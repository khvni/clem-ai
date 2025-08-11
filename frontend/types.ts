// frontend/types.ts
export type Claim = {
    id: string;
    claimNumber: string;
    policyNumber: string;
    claimantName: string;
    incidentDate: string; // Will be a string in JSON
    status: 'PENDING' | 'IN_REVIEW' | 'AWAITING_APPROVAL' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    aiRecommendation?: { // This is a JSON object from the DB
      decision: 'APPROVE' | 'DENY';
      payout: number;
      reason: string;
    };
  };