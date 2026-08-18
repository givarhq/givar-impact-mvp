-- AlterTable
ALTER TABLE "project_updates" ADD COLUMN     "assets" TEXT[] DEFAULT ARRAY[]::TEXT[];
