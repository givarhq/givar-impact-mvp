-- AlterTable
ALTER TABLE "recommendation_configs" ALTER COLUMN "recencyWeight" SET DEFAULT 5.0,
ALTER COLUMN "velocityWeight" SET DEFAULT 7.0,
ALTER COLUMN "engagementWeight" SET DEFAULT 3.0,
ALTER COLUMN "adminWeight" SET DEFAULT 4.0;
