-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CORPORATE_SPONSORSHIP_LOGGED';

-- AlterTable
ALTER TABLE "guest_donors" ADD COLUMN     "isCorporate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoUrl" TEXT;
