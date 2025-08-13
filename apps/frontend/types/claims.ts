// apps/frontend/types/claims.ts

export type Claim = {
  id: string;
  claimantName: string;
  status: string;
  triageResult: { 
    assessment: string; 
    severity: string;
    fraud_flags?: string[];
  } | null;
  settlementRecommendation?: {
    recommendation_text: string;
    recommended_amount: number;
    next_steps: string;
  } | null;
  settlementAmount: number | null;
  createdAt: string;
  incidentDate: string;
  incidentDescription: string;
  policyNumber: string;
};
