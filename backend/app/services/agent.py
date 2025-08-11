# backend/app/services/agent.py

from typing import TypedDict
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.output_parsers import PydanticOutputParser
from langgraph.graph import StateGraph, END
from app.core.config import settings
import random

# --- 1. Define the Agent's State ---
# The "state" is the memory of our agent. It's a dictionary that gets
# passed between each step (node) in our graph. Each node can update it.
class AgentState(TypedDict):
    claim_data: dict      # The initial data from the API call
    triage_decision: dict # The result from our triage node
    recommendation: dict  # The final JSON recommendation

# --- 2. Define the LLM and Parsers for Structured Output ---
# We initialize our connection to Google's Gemini API.
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",              # A fast, multi-modal, and cost-effective model
    temperature=0,                         # For deterministic and reliable outputs
    google_api_key=settings.GOOGLE_API_KEY,
    convert_system_message_to_human=True,  # A compatibility helper for LangChain
    response_mime_type="application/json"  # A Gemini-specific feature to enforce JSON output
)

# We use Pydantic to define the *exact* JSON structure we want the LLM to return.
class TriageResult(BaseModel):
    decision: str = Field(description="Decision if claim is covered. Either 'PROCEED' or 'REJECT'.")
    reason: str = Field(description="Brief explanation for the decision.")

class Recommendation(BaseModel):
    decision: str = Field(description="Final settlement decision. Either 'APPROVE' or 'DENY'.")
    payout: float = Field(description="The recommended payout amount. Set to 0.0 if denied.")
    reason: str = Field(description="Detailed reason for the recommendation.")

# --- 3. Define the Agent's Nodes ---
# Each node in our graph is a function that performs a specific action.
async def triage_node(state: AgentState):
    """
    Performs an initial check on the claim to decide if it's simple enough for
    automated processing or needs manual review.

    This node uses an LLM to make a basic "PROCEED" or "REJECT" decision based
    on the complexity of the claim description.

    Args:
        state: The current state of the agent, containing the initial claim data.

    Returns:
        A dictionary with the key "triage_decision" and a value containing
        the LLM's decision and reasoning.
    """
    print("--- AGENT: Triage Node ---")
    parser = PydanticOutputParser(pydantic_object=TriageResult)

    # The prompt provides context and instructions to the LLM.
    prompt = f"""
    You are an AI claims triage specialist for auto insurance in California.
    Your task is to analyze the claim data and decide if it should proceed or be rejected for manual review.

    Format Instructions: {parser.get_format_instructions()}
    Claim Data: {state['claim_data']}

    Decision Criteria:
    - A fender-bender or parked car incident is simple.
    - Assume the policy is active and covers property damage.
    - If the claimant states their vehicle was parked and struck, they are not at fault.
    - If it's anything more complex (mentions of injury, major dispute), reject it.
    """

    # The LangChain Expression Language (LCEL) chain pipes the prompt to the LLM and then to the parser.
    chain = llm | parser
    try:
        result = await chain.ainvoke(prompt)
        print(f"Triage Result: {result.dict()}")
        # The return value updates the "triage_decision" field in the agent's state.
        return {"triage_decision": result.dict()}
    except Exception as e:
        print(f"--- ERROR in Triage Node: {e} ---")
        return {"error": "Failed to get triage decision from LLM."}

async def recommend_node(state: AgentState):
    """
    Generates a final settlement recommendation if the claim has passed triage.

    This node uses an LLM to generate an "APPROVE" or "DENY" decision with a
    payout amount and detailed reasoning.

    Args:
        state: The current state of the agent, containing the claim data and
               the triage decision.

    Returns:
        A dictionary with the key "recommendation" and a value containing the
        final recommendation details.
    """
    print("--- AGENT: Recommend Node ---")
    parser = PydanticOutputParser(pydantic_object=Recommendation)

    # For this MVP, we simulate damage analysis with a random value.
    # In a real-world scenario, this could come from an image analysis model or a database.
    estimated_damage = random.uniform(500, 3000)

    prompt = f"""
    You are an AI claims adjuster. Your task is to generate a final settlement recommendation.

    Format Instructions: {parser.get_format_instructions()}
    Context:
    - Claim Data: {state['claim_data']}
    - Triage Decision: {state['triage_decision']}
    - Estimated Damage Cost: ${estimated_damage:.2f}

    Instructions:
    - If the triage decision was 'PROCEED', you should 'APPROVE' the claim.
    - The payout should be based on the estimated damage.
    - Provide a clear reason referencing the incident type.
    """

    chain = llm | parser
    try:
        result = await chain.ainvoke(prompt)
        print(f"Recommendation Result: {result.dict()}")
        # The return value updates the "recommendation" field in the agent's state.
        return {"recommendation": result.dict()}
    except Exception as e:
        print(f"--- ERROR in Recommend Node: {e} ---")
        return {"error": "Failed to get recommendation from LLM."}

# --- 4. Assemble the Graph ---
# We define the workflow by connecting the nodes in a specific order.
workflow = StateGraph(AgentState)
workflow.add_node("triage", triage_node)
workflow.add_node("recommend", recommend_node)

# Define the data flow: Triage -> Recommend -> End
workflow.set_entry_point("triage")
workflow.add_edge("triage", "recommend")
workflow.add_edge("recommend", END) # END is a special marker for the graph's finish

# Compile the graph into a runnable object that we can invoke from our API.
agent_runnable = workflow.compile()
print("✅ Clem AI Agent (Gemini) graph compiled successfully!")