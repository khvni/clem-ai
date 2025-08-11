# backend/app/main.py

import socketio
import uvicorn
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

# Import our new agent runnable
from app.services.agent import agent_runnable

# --- Pydantic Models for API Data Validation ---
class ClaimCreate(BaseModel):
    policyNumber: str
    claimantName: str
    incidentDate: datetime
    incidentDescription: str # Add description for the agent to analyze

# --- FastAPI App & Socket.IO Initialization ---
app = FastAPI(title="Clem AI API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")
sio_app = socketio.ASGIApp(socketio_server=sio, other_asgi_app=app)


# --- Background Task to Run the Agent ---
async def run_agent_and_notify(claim_id: str, claim_data: dict):
    """
    This function orchestrates the AI processing and real-time updates.
    It's designed to be run in the background so the API can respond instantly.
    """
    # 1. Notify frontend that a new claim is being processed
    initial_payload = {"id": claim_id, "status": "IN_REVIEW", **claim_data}
    await sio.emit("new_claim", data=initial_payload)
    print(f"Emitted 'new_claim' for {claim_id}")

    # 2. Invoke the LangGraph agent with the claim data
    agent_input = {"claim_data": claim_data}
    final_state = await agent_runnable.ainvoke(agent_input)
    print(f"Agent finished for {claim_id}. Final state: {final_state}")

    # 3. Notify frontend that processing is complete with the final recommendation
    recommendation = final_state.get("recommendation", {})
    final_payload = {
        "id": claim_id,
        "status": "AWAITING_APPROVAL",
        "aiRecommendation": recommendation,
        "aiReasoning": recommendation.get("reason", "No reason provided.")
    }
    await sio.emit("claim_updated", data=final_payload)
    print(f"Emitted 'claim_updated' for {claim_id}")

# --- API Endpoints ---
@app.get("/")
async def read_root():
    return {"message": "Clem AI Backend is running!"}

@app.post("/api/v1/claims", status_code=202) # Use 202 Accepted
async def create_claim(claim: ClaimCreate):
    """
    Receives a new claim, and immediately triggers the AI agent as a
    background task. Responds instantly without waiting for the agent.
    """
    print(f"Received new claim: {claim.dict()}")
    claim_id = str(uuid.uuid4())

    # Start the agent process in the background. The API call returns
    # immediately, providing a fast user experience.
    await sio.start_background_task(run_agent_and_notify, claim_id, claim.dict())

    return {"message": "Claim received and is being processed", "claim_id": claim_id}

# --- Socket.IO Event Handlers ---
@sio.event
async def connect(sid, environ):
    print(f"✅ Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"❌ Client disconnected: {sid}")