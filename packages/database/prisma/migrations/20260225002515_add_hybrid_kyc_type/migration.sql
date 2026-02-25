-- CreateEnum
CREATE TYPE "KycType" AS ENUM ('INDIVIDUAL', 'ORGANIZATION');

-- AlterTable
ALTER TABLE "organization_profiles" ADD COLUMN     "kycType" "KycType" NOT NULL DEFAULT 'ORGANIZATION';
