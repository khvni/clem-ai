-- CreateTable
CREATE TABLE "public"."Claim" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "claimantName" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "incidentDate" TIMESTAMP(3) NOT NULL,
    "incidentDescription" TEXT NOT NULL,
    "triageResult" JSONB,
    "settlementRecommendation" JSONB,
    "settlementAmount" DOUBLE PRECISION,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);
