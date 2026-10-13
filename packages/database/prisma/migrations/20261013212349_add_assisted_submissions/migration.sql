-- AlterTable
ALTER TABLE "project_proposals" ADD COLUMN     "isAssisted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "isAssisted" BOOLEAN NOT NULL DEFAULT false;
