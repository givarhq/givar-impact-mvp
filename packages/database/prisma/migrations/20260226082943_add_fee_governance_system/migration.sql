-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'FEE_RULE_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'FEE_RULE_DEACTIVATED';

-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "baseAmount" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "feeAmount" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "feePercentageUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "feeRuleId" TEXT,
ADD COLUMN     "tipAmount" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "guest_donations" ADD COLUMN     "baseAmount" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "feeAmount" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "feePercentageUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "feeRuleId" TEXT,
ADD COLUMN     "tipAmount" BIGINT NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "transaction_fee_rules" (
    "id" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "appliesGlobally" BOOLEAN NOT NULL DEFAULT true,
    "categoryId" TEXT,
    "optionalTipEnabled" BOOLEAN NOT NULL DEFAULT true,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUntil" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "transaction_fee_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_fee_rules_activeFrom_activeUntil_idx" ON "transaction_fee_rules"("activeFrom", "activeUntil");

-- CreateIndex
CREATE INDEX "transaction_fee_rules_categoryId_idx" ON "transaction_fee_rules"("categoryId");

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_feeRuleId_fkey" FOREIGN KEY ("feeRuleId") REFERENCES "transaction_fee_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_donations" ADD CONSTRAINT "guest_donations_feeRuleId_fkey" FOREIGN KEY ("feeRuleId") REFERENCES "transaction_fee_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_fee_rules" ADD CONSTRAINT "transaction_fee_rules_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
