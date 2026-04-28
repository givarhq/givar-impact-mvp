/*
  Warnings:

  - You are about to drop the column `vendorSubaccount` on the `project_proposals` table. All the data in the column will be lost.
  - You are about to drop the column `vendorSubaccount` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "project_proposals" DROP COLUMN "vendorSubaccount";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "vendorSubaccount";
