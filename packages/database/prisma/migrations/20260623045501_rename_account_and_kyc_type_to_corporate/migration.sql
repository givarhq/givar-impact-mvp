/*
  Warnings:

  - The values [ORGANIZER] on the enum `AccountType` will be removed. If these variants are still used in the database, this will fail.
  - The values [ORGANIZATION] on the enum `KycType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AccountType_new" AS ENUM ('INDIVIDUAL', 'CORPORATE');
ALTER TABLE "public"."users" ALTER COLUMN "accountType" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "accountType" TYPE "AccountType_new" USING ("accountType"::text::"AccountType_new");
ALTER TYPE "AccountType" RENAME TO "AccountType_old";
ALTER TYPE "AccountType_new" RENAME TO "AccountType";
DROP TYPE "public"."AccountType_old";
ALTER TABLE "users" ALTER COLUMN "accountType" SET DEFAULT 'INDIVIDUAL';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "KycType_new" AS ENUM ('INDIVIDUAL', 'CORPORATE');
ALTER TABLE "public"."organization_profiles" ALTER COLUMN "kycType" DROP DEFAULT;
ALTER TABLE "organization_profiles" ALTER COLUMN "kycType" TYPE "KycType_new" USING ("kycType"::text::"KycType_new");
ALTER TYPE "KycType" RENAME TO "KycType_old";
ALTER TYPE "KycType_new" RENAME TO "KycType";
DROP TYPE "public"."KycType_old";
ALTER TABLE "organization_profiles" ALTER COLUMN "kycType" SET DEFAULT 'CORPORATE';
COMMIT;

-- AlterTable
ALTER TABLE "organization_profiles" ALTER COLUMN "kycType" SET DEFAULT 'CORPORATE';
