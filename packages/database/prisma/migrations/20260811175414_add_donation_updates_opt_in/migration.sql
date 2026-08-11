-- AlterTable
ALTER TABLE "donations" ADD COLUMN     "wantsUpdates" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "guest_donations" ADD COLUMN     "wantsUpdates" BOOLEAN NOT NULL DEFAULT true;
