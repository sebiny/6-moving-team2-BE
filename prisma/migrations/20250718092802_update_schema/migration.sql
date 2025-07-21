/*
  Warnings:

  - You are about to drop the column `designatedDriverId` on the `EstimateRequest` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Notification` table. All the data in the column will be lost.
  - Changed the column `moveType` on the `Driver` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.
  - Added the required column `message` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MOVE_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE 'DESIGNATED_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'MOVE_DAY_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'REVIEW_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE 'WELCOME';

-- DropForeignKey
ALTER TABLE "EstimateRequest" DROP CONSTRAINT "EstimateRequest_designatedDriverId_fkey";

-- AlterTable

ALTER TABLE "Driver" DROP COLUMN "moveType";

ALTER TABLE "Driver" ADD COLUMN "moveType" "MoveType"[] DEFAULT ARRAY[]::"MoveType"[];

ALTER TABLE "Driver" ADD COLUMN "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- moveType 필드를 배열로 바꾸되 기존 값 보존
ALTER TABLE "Driver" ALTER COLUMN "moveType" TYPE "MoveType"[] USING ARRAY["moveType"]::"MoveType"[];

-- AlterTable
ALTER TABLE "EstimateRequest" DROP COLUMN "designatedDriverId";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "title",
ADD COLUMN     "message" TEXT NOT NULL,
ADD COLUMN     "path" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "DesignatedDriver" (
    "id" TEXT NOT NULL,
    "estimateRequestId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignatedDriver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignatedDriver_estimateRequestId_idx" ON "DesignatedDriver"("estimateRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "DesignatedDriver_estimateRequestId_driverId_key" ON "DesignatedDriver"("estimateRequestId", "driverId");

-- AddForeignKey
ALTER TABLE "DesignatedDriver" ADD CONSTRAINT "DesignatedDriver_estimateRequestId_fkey" FOREIGN KEY ("estimateRequestId") REFERENCES "EstimateRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignatedDriver" ADD CONSTRAINT "DesignatedDriver_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
