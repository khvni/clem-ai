// apps/backend/src/agent.state.ts
import { z } from 'zod';

export const claimSchema = z.object({
  claimant_name: z.string(),
  policy_number: z.string(),
  incident_date: z.string(),
  incident_description: z.string(),
});

export const triageResultSchema = z.object({
  assessment: z
    .string()
    .describe('A summary of the incident and initial liability assessment.'),
  severity: z.enum(['Low', 'Medium', 'High']),
  fraud_flags: z
    .array(z.string())
    .describe(
      'List of any potential fraud indicators, or an empty array if none.',
    ),
});

export const settlementRecommendationSchema = z.object({
  recommendation_text: z
    .string()
    .describe('A detailed explanation for the settlement recommendation.'),
  recommended_amount: z
    .number()
    .describe('The recommended settlement amount in USD.'),
  next_steps: z
    .string()
    .describe('The recommended next steps for the human adjuster.'),
});

// The main state object passed through the graph
export interface ClaimState {
  claim_data: z.infer<typeof claimSchema>;
  triage_result?: z.infer<typeof triageResultSchema>;
  settlement_recommendation?: z.infer<typeof settlementRecommendationSchema>;
}
