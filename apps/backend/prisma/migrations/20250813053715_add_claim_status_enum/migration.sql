/*
  Warnings:

  - The `status` column on the `Claim` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."Claim" DROP COLUMN "status",
ADD COLUMN     "status" "public"."ClaimStatus" NOT NULL DEFAULT 'PENDING';
