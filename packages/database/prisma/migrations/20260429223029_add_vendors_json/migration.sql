-- AlterTable
ALTER TABLE "project_proposals" ADD COLUMN     "vendors" JSONB DEFAULT '[]';

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "vendors" JSONB DEFAULT '[]';
