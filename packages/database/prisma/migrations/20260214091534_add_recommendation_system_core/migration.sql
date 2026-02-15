-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('APPROVED', 'FLAGGED', 'HIDDEN');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "featureWeight" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "visibilityScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;

-- CreateTable
CREATE TABLE "recommendation_configs" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "recencyWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "velocityWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "engagementWeight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "adminWeight" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "diversityLimit" INTEGER NOT NULL DEFAULT 3,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "featured_slots" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "featured_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "featured_slots_position_key" ON "featured_slots"("position");

-- AddForeignKey
ALTER TABLE "featured_slots" ADD CONSTRAINT "featured_slots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
