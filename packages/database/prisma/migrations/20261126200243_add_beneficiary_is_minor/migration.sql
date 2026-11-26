-- AlterTable
ALTER TABLE "project_proposals" ADD COLUMN     "isMinor" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "isMinor" BOOLEAN DEFAULT false;
