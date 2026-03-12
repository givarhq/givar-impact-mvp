-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UpdateType" ADD VALUE 'VERIFICATION_UPDATE';
ALTER TYPE "UpdateType" ADD VALUE 'GOAL_ADJUSTMENT';
ALTER TYPE "UpdateType" ADD VALUE 'MILESTONE_UPDATE';
ALTER TYPE "UpdateType" ADD VALUE 'FUNDS_DISBURSED';
ALTER TYPE "UpdateType" ADD VALUE 'IMPACT_ACHIEVED';

-- AlterTable
ALTER TABLE "project_proposals" ADD COLUMN     "beneficiaryAge" INTEGER,
ADD COLUMN     "beneficiaryName" TEXT,
ADD COLUMN     "beneficiaryRelationship" TEXT,
ADD COLUMN     "hasPreCollectedFunds" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preCollectedAmount" BIGINT,
ADD COLUMN     "preCollectedHeldAt" TEXT,
ADD COLUMN     "preCollectedProofKey" TEXT,
ADD COLUMN     "vendorAddress" TEXT,
ADD COLUMN     "vendorContactPerson" TEXT,
ADD COLUMN     "vendorEmail" TEXT,
ADD COLUMN     "vendorName" TEXT,
ADD COLUMN     "vendorPhone" TEXT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "beneficiaryAge" INTEGER,
ADD COLUMN     "beneficiaryName" TEXT,
ADD COLUMN     "beneficiaryRelationship" TEXT,
ADD COLUMN     "hasPreCollectedFunds" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preCollectedAmount" BIGINT,
ADD COLUMN     "preCollectedHeldAt" TEXT,
ADD COLUMN     "preCollectedProofKey" TEXT,
ADD COLUMN     "preCollectedVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vendorAddress" TEXT,
ADD COLUMN     "vendorContactPerson" TEXT,
ADD COLUMN     "vendorEmail" TEXT,
ADD COLUMN     "vendorName" TEXT,
ADD COLUMN     "vendorPhone" TEXT;
