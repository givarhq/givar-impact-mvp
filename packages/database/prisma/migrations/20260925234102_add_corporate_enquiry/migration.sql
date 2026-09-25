-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CORPORATE_ENQUIRY_RECEIVED';

-- CreateTable
CREATE TABLE "corporate_enquiries" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "areasOfInterest" TEXT[],
    "notes" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_enquiries_pkey" PRIMARY KEY ("id")
);
