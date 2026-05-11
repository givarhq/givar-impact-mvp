-- AlterTable
ALTER TABLE "transaction_fee_rules" ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "subcategoryId" TEXT;

-- CreateIndex
CREATE INDEX "transaction_fee_rules_subcategoryId_idx" ON "transaction_fee_rules"("subcategoryId");

-- CreateIndex
CREATE INDEX "transaction_fee_rules_projectId_idx" ON "transaction_fee_rules"("projectId");
