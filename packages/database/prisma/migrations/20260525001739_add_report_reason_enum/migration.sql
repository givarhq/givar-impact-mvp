/*
  Warnings:

  - Changed the type of `reason` on the `project_reports` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('UNAUTHORIZED_BENEFICIARY', 'FRAUD', 'INAPPROPRIATE', 'OTHER');

-- AlterTable
ALTER TABLE "project_reports" DROP COLUMN "reason",
ADD COLUMN     "reason" "ReportReason" NOT NULL;
