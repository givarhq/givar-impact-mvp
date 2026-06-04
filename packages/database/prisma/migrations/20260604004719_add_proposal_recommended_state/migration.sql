-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'PROPOSAL_RECOMMENDED';

-- AlterEnum
ALTER TYPE "ProposalStatus" ADD VALUE 'RECOMMENDED';

-- AlterTable
ALTER TABLE "project_proposals" ADD COLUMN     "internalNotes" TEXT;
