/*
  Warnings:

  - A unique constraint covering the columns `[proposalId]` on the table `projects` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "proposalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "projects_proposalId_key" ON "projects"("proposalId");
