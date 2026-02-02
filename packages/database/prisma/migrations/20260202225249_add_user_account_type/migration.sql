-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('INDIVIDUAL', 'ORGANIZER');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ACCOUNT_TYPE_CHANGED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL';
