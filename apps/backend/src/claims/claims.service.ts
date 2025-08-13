// apps/backend/src/claims/claims.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { StateGraph, END } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import 'dotenv/config';

import { PrismaService } from '../prisma.service';
import { ClaimsGateway } from './claims.gateway';
import {
  claimInputSchema,
  agentStateSchema,
  AgentState,
  triageResultSchema,
  settlementRecommendationSchema,
} from './claims.state';

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);
  private agent: any;

  constructor(
    private prisma: PrismaService,
    private claimsGateway: ClaimsGateway,
  ) {
    this.agent = this.buildAgent();
  }

  private buildAgent() {
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-1.5-flash-latest',
      temperature: 0,
    });

    const triageNode = async (state: AgentState): Promise<Partial<AgentState>> => {
      this.logger.log('--- Executing Triage Node ---');
      const triageLlm = llm.withStructuredOutput(triageResultSchema);
      const prompt = `You are an expert insurance claims triager. Analyze the claim and provide a structured assessment. Claim: "${state.claim_data.incident_description}"`;
      const triage_result = await triageLlm.invoke(prompt);
      return { triage_result };
    };

    const recommendNode = async (state: AgentState): Promise<Partial<AgentState>> => {
      this.logger.log('--- Executing Recommend Node ---');
      const recommendLlm = llm.withStructuredOutput(settlementRecommendationSchema);
      const prompt = `You are an expert claims adjuster. Based on the claim and triage, provide a settlement recommendation. Triage Assessment: "${JSON.stringify(state.triage_result, null, 2)}"`;
      const settlement_recommendation = await recommendLlm.invoke(prompt);
      return { settlement_recommendation };
    };

    const workflow = new StateGraph(agentStateSchema as any);

    workflow.addNode('triage' as any, triageNode);
    workflow.addNode('recommend' as any, recommendNode);
    workflow.setEntryPoint('triage' as any);
    workflow.addEdge('triage' as any, 'recommend' as any);
    workflow.addEdge('recommend' as any, END);

    return workflow.compile();
  }

  async processNewClaim(claimInput: z.infer<typeof claimInputSchema>): Promise<any> {
    this.logger.log(`Processing new claim for policy: ${claimInput.policy_number}`);

    const stream = await this.agent.stream({ claim_data: claimInput });
    
    // ** THE FINAL FIX IS HERE **
    // This is the correct way to reconstruct the state from the stream.
    let finalState: Partial<AgentState> = {};
    for await (const chunk of stream) {
      const nodeName = Object.keys(chunk)[0];
      if (nodeName) {
        this.logger.log(`Received chunk from node: ${nodeName}`);
        // Merge the output of the node into our final state
        finalState = { ...finalState, ...chunk[nodeName] };
      }
    }
    
    this.logger.log('Agent run complete. Saving to database...');

    const createdClaim = await this.prisma.claim.create({
      data: {
        claimantName: claimInput.claimant_name,
        policyNumber: claimInput.policy_number,
        incidentDate: new Date(claimInput.incident_date),
        incidentDescription: claimInput.incident_description,
        triageResult: finalState.triage_result,
        settlementRecommendation: finalState.settlement_recommendation,
        settlementAmount: finalState.settlement_recommendation?.recommended_amount,
      },
    });

    this.logger.log(`Successfully saved claim with ID: ${createdClaim.id}`);
    
    // Emit the new claim to all connected WebSocket clients
    this.claimsGateway.emitNewClaim(createdClaim);
    this.logger.log('Emitted new claim to WebSocket clients');
    
    return createdClaim;
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