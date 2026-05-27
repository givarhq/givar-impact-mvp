/*
  Warnings:

  - You are about to drop the column `preCollectedHeldAt` on the `project_proposals` table. All the data in the column will be lost.
  - You are about to drop the column `preCollectedProofKey` on the `project_proposals` table. All the data in the column will be lost.
  - You are about to drop the column `preCollectedHeldAt` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `preCollectedProofKey` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `preCollectedVerified` on the `projects` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "project_proposals" DROP COLUMN "preCollectedHeldAt",
DROP COLUMN "preCollectedProofKey";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "preCollectedHeldAt",
DROP COLUMN "preCollectedProofKey",
DROP COLUMN "preCollectedVerified";
