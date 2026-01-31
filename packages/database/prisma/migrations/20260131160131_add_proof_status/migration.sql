/*
  Warnings:

  - Added the required column `updatedAt` to the `milestone_proofs` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "milestone_proofs" ADD COLUMN     "adminFeedback" TEXT,
ADD COLUMN     "status" "ProofStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
