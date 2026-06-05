-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'TWO_FACTOR_RECOVERY_USED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFactorRecoveryCodes" TEXT[] DEFAULT ARRAY[]::TEXT[];
