-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'EXTERNAL_CONTRIBUTION_LOGGED';
ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_PAUSED';
ALTER TYPE "AuditAction" ADD VALUE 'PROJECT_RESUMED';

-- AlterEnum
ALTER TYPE "ProjectStatus" ADD VALUE 'PAUSED';

-- AlterTable
ALTER TABLE "guest_donations" ADD COLUMN     "isExternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "receiptKey" TEXT;
