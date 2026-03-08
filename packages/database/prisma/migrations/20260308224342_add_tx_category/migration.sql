-- CreateEnum
CREATE TYPE "TxCategory" AS ENUM ('FUNDING', 'DONATION', 'TRANSACTION_FEE', 'VOLUNTARY_TIP', 'DISBURSEMENT', 'REFUND', 'INTERNAL_TRANSFER', 'WITHDRAWAL', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "wallet_transactions" ADD COLUMN     "category" "TxCategory" NOT NULL DEFAULT 'INTERNAL_TRANSFER';

-- CreateIndex
CREATE INDEX "wallet_transactions_category_idx" ON "wallet_transactions"("category");
