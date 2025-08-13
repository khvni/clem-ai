// apps/backend/src/claims/claims.state.ts
import { z } from 'zod';

export const claimInputSchema = z.object({
  claimant_name: z.string(),
  policy_number: z.string(),
  incident_date: z.string().date(),
  incident_description: z.string().min(20),
});

// We are now exporting these for the service to use
export const triageResultSchema = z.object({
  assessment: z.string().describe("A summary of the incident and initial liability assessment."),
  severity: z.enum(["Low", "Medium", "High"]),
  fraud_flags: z.array(z.string()),
});

export const settlementRecommendationSchema = z.object({
  recommendation_text: z.string().describe("A detailed explanation for the settlement recommendation."),
  recommended_amount: z.number().describe("The recommended settlement amount in USD."),
  next_steps: z.string(),
});

// The master Zod schema for the entire agent's state
export const agentStateSchema = z.object({
  claim_data: claimInputSchema,
  triage_result: triageResultSchema.optional(),
  settlement_recommendation: settlementRecommendationSchema.optional(),
});

// The TypeScript type inferred from our master schema
export type AgentState = z.infer<typeof agentStateSchema>;