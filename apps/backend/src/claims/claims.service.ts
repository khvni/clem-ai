// apps/backend/src/claims/claims.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import 'dotenv/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StateGraph, END } from '@langchain/langgraph';
import { RunnableSequence } from '@langchain/core/runnables';
import { PromptTemplate } from '@langchain/core/prompts';

import { PrismaService } from '../prisma.service';
import { claimInputSchema, agentStateSchema, AgentState, triageResultSchema, settlementRecommendationSchema } from './claims.state';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);
  private agent: any;

  // We are injecting the PrismaService. Since it's now fixed, this will work.
  constructor(private prisma: PrismaService) {
    this.agent = this.buildAgent();
  }

  private buildAgent() {
    // Initialize the ChatGoogleGenerativeAI model
    const model = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash-latest',
      temperature: 0.1,
    });

    // Define the triage node
    const triageNode = async (input: AgentState) => {
      const triageChain = model.withStructuredOutput(triageResultSchema);
      
      const prompt = PromptTemplate.fromTemplate(`
        You are an insurance claims triage specialist. Analyze the following claim and provide an assessment.
        
        Claim Details:
        - Claimant: {claimant_name}
        - Policy Number: {policy_number}
        - Incident Date: {incident_date}
        - Description: {incident_description}
        
        Provide a triage assessment based on the incident details.
        Be thorough but concise in your assessment.
      `);
      
      const formattedPrompt = await prompt.format({
        claimant_name: input.claim_data.claimant_name,
        policy_number: input.claim_data.policy_number,
        incident_date: input.claim_data.incident_date,
        incident_description: input.claim_data.incident_description,
      });
      
      const result = await triageChain.invoke(formattedPrompt);
      return { triage_result: result };
    };

    // Define the recommendation node
    const recommendNode = async (input: AgentState) => {
      const recommendationChain = model.withStructuredOutput(settlementRecommendationSchema);
      
      const prompt = PromptTemplate.fromTemplate(`
        You are an insurance claims settlement specialist. Based on the triage assessment, provide a settlement recommendation.
        
        Claim Details:
        - Claimant: {claimant_name}
        - Policy Number: {policy_number}
        - Incident Date: {incident_date}
        - Description: {incident_description}
        
        Triage Assessment:
        - Assessment: {assessment}
        - Severity: {severity}
        - Fraud Flags: {fraud_flags}
        
        Consider the severity and fraud flags when making your recommendation.
        Provide a settlement recommendation based on the incident details and triage assessment.
      `);
      
      const formattedPrompt = await prompt.format({
        claimant_name: input.claim_data.claimant_name,
        policy_number: input.claim_data.policy_number,
        incident_date: input.claim_data.incident_date,
        incident_description: input.claim_data.incident_description,
        assessment: input.triage_result?.assessment || 'No assessment available',
        severity: input.triage_result?.severity || 'Medium',
        fraud_flags: input.triage_result?.fraud_flags?.join(', ') || 'No fraud flags identified',
      });
      
      const result = await recommendationChain.invoke(formattedPrompt);
      return { settlement_recommendation: result };
    };

    // Define the LangGraph workflow
    const workflow = new StateGraph(agentStateSchema as any)
      .addNode('triage', triageNode)
      .addNode('recommend', recommendNode)
      .addEdge('triage', 'recommend')
      .addEdge('recommend', END)
      .setEntryPoint('triage');

    return workflow.compile();
  }

  // This is now a simple, non-AI function
  async processNewClaim(claimInput: z.infer<typeof claimInputSchema>): Promise<any> {
    this.logger.log(`Processing new claim for policy: ${claimInput.policy_number}`);

    try {
      // Initialize the agent state with claim data
      const initialState: AgentState = {
        claim_data: claimInput,
      };

      this.logger.log('Starting AI agent workflow...');

      // Call the agent and get the complete final state
      const finalState = await this.agent.invoke(initialState);

      this.logger.log('AI agent workflow completed successfully');

      // Save the AI-generated results to the database
      const createdClaim = await this.prisma.claim.create({
        data: {
          claimantName: claimInput.claimant_name,
          policyNumber: claimInput.policy_number,
          incidentDate: new Date(claimInput.incident_date),
          incidentDescription: claimInput.incident_description,
          settlementRecommendation: finalState.settlement_recommendation,
          settlementAmount: finalState.settlement_recommendation?.recommended_amount || 0,
        },
      });

      this.logger.log(`Successfully saved AI-processed claim with ID: ${createdClaim.id}`);
      return createdClaim;
    } catch (error) {
      this.logger.error('Error processing claim with AI agent:', error);
      throw error;
    }
  }

  async findAllClaims() {
    this.logger.log('Fetching all claims from database...');
    return this.prisma.claim.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}