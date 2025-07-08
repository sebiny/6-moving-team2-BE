/*
  Warnings:

  - The values [ACTIVE,CONFIRMED] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Address` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `AuthUser` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Customer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `fromAddressId` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `toAddressId` on the `Customer` table. All the data in the column will be lost.
  - The primary key for the `Driver` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `serviceAreas` on the `Driver` table. All the data in the column will be lost.
  - The primary key for the `Estimate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `EstimateRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Favorite` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `LanguagePreference` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Notification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Review` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[nickname]` on the table `Driver` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[customerId,driverId]` on the table `Favorite` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[estimateRequestId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Estimate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Favorite` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimateRequestId` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AddressRole" AS ENUM ('FROM', 'TO', 'EXTRA');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ESTIMATE_REQUEST', 'ESTIMATE_ACCEPTED', 'ESTIMATE_REJECTED', 'MOVE_COMPLETED', 'REVIEW_REQUESTED', 'MESSAGE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EstimateStatus" ADD VALUE 'ACCEPTED';
ALTER TYPE "EstimateStatus" ADD VALUE 'AUTO_REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "RegionType" ADD VALUE 'BUSAN';
ALTER TYPE "RegionType" ADD VALUE 'DAEGU';
ALTER TYPE "RegionType" ADD VALUE 'INCHEON';
ALTER TYPE "RegionType" ADD VALUE 'GWANGJU';
ALTER TYPE "RegionType" ADD VALUE 'DAEJEON';
ALTER TYPE "RegionType" ADD VALUE 'ULSAN';
ALTER TYPE "RegionType" ADD VALUE 'SEJONG';
ALTER TYPE "RegionType" ADD VALUE 'GANGWON';
ALTER TYPE "RegionType" ADD VALUE 'CHUNGBUK';
ALTER TYPE "RegionType" ADD VALUE 'CHUNGNAM';
ALTER TYPE "RegionType" ADD VALUE 'JEONBUK';
ALTER TYPE "RegionType" ADD VALUE 'JEONNAM';
ALTER TYPE "RegionType" ADD VALUE 'GYEONGBUK';
ALTER TYPE "RegionType" ADD VALUE 'GYEONGNAM';
ALTER TYPE "RegionType" ADD VALUE 'JEJU';

-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED');
ALTER TABLE "EstimateRequest" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "RequestStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_authUserId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_fromAddressId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_languagePrefId_fkey";

-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_toAddressId_fkey";

-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_authUserId_fkey";

-- DropForeignKey
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_languagePrefId_fkey";

-- DropForeignKey
ALTER TABLE "Estimate" DROP CONSTRAINT "Estimate_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Estimate" DROP CONSTRAINT "Estimate_estimateRequestId_fkey";

-- DropForeignKey
ALTER TABLE "EstimateRequest" DROP CONSTRAINT "EstimateRequest_customerId_fkey";

-- DropForeignKey
ALTER TABLE "EstimateRequest" DROP CONSTRAINT "EstimateRequest_designatedDriverId_fkey";

-- DropForeignKey
ALTER TABLE "EstimateRequest" DROP CONSTRAINT "EstimateRequest_fromAddressId_fkey";

-- DropForeignKey
ALTER TABLE "EstimateRequest" DROP CONSTRAINT "EstimateRequest_toAddressId_fkey";

-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_driverId_fkey";

-- AlterTable
ALTER TABLE "Address" DROP CONSTRAINT "Address_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Address_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Address_id_seq";

-- AlterTable
ALTER TABLE "AuthUser" DROP CONSTRAINT "AuthUser_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "AuthUser_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "AuthUser_id_seq";

-- AlterTable
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_pkey",
DROP COLUMN "fromAddressId",
DROP COLUMN "toAddressId",
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "authUserId" SET DATA TYPE TEXT,
ALTER COLUMN "languagePrefId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Customer_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Customer_id_seq";

-- AlterTable
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_pkey",
DROP COLUMN "serviceAreas",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "authUserId" SET DATA TYPE TEXT,
ALTER COLUMN "languagePrefId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Driver_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Driver_id_seq";

-- AlterTable
ALTER TABLE "Estimate" DROP CONSTRAINT "Estimate_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "driverId" SET DATA TYPE TEXT,
ALTER COLUMN "estimateRequestId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Estimate_id_seq";

-- AlterTable
ALTER TABLE "EstimateRequest" DROP CONSTRAINT "EstimateRequest_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "customerId" SET DATA TYPE TEXT,
ALTER COLUMN "fromAddressId" SET DATA TYPE TEXT,
ALTER COLUMN "toAddressId" SET DATA TYPE TEXT,
ALTER COLUMN "designatedDriverId" SET DATA TYPE TEXT,
ADD CONSTRAINT "EstimateRequest_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "EstimateRequest_id_seq";

-- AlterTable
ALTER TABLE "Favorite" DROP CONSTRAINT "Favorite_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "customerId" SET DATA TYPE TEXT,
ALTER COLUMN "driverId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Favorite_id_seq";

-- AlterTable
ALTER TABLE "LanguagePreference" DROP CONSTRAINT "LanguagePreference_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "LanguagePreference_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "LanguagePreference_id_seq";

-- AlterTable
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_pkey",
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "type" "NotificationType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "receiverId" SET DATA TYPE TEXT,
ALTER COLUMN "senderId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Notification_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Notification_id_seq";

-- AlterTable
ALTER TABLE "Review" DROP CONSTRAINT "Review_pkey",
ADD COLUMN     "estimateRequestId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "customerId" SET DATA TYPE TEXT,
ALTER COLUMN "driverId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Review_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Review_id_seq";

-- CreateTable
CREATE TABLE "DriverServiceArea" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "region" "RegionType" NOT NULL,
    "district" TEXT NOT NULL,

    CONSTRAINT "DriverServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAddress" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "role" "AddressRole" NOT NULL,
    "customLabel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "CustomerAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverServiceArea_region_idx" ON "DriverServiceArea"("region");

-- CreateIndex
CREATE INDEX "DriverServiceArea_district_idx" ON "DriverServiceArea"("district");

-- CreateIndex
CREATE UNIQUE INDEX "DriverServiceArea_driverId_region_district_key" ON "DriverServiceArea"("driverId", "region", "district");

-- CreateIndex
CREATE INDEX "CustomerAddress_deletedAt_idx" ON "CustomerAddress"("deletedAt");

-- CreateIndex
CREATE INDEX "CustomerAddress_customerId_idx" ON "CustomerAddress"("customerId");

-- CreateIndex
CREATE INDEX "CustomerAddress_addressId_idx" ON "CustomerAddress"("addressId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAddress_customerId_addressId_role_key" ON "CustomerAddress"("customerId", "addressId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_nickname_key" ON "Driver"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_customerId_driverId_key" ON "Favorite"("customerId", "driverId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_estimateRequestId_key" ON "Review"("estimateRequestId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "AuthUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_languagePrefId_fkey" FOREIGN KEY ("languagePrefId") REFERENCES "LanguagePreference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "AuthUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_languagePrefId_fkey" FOREIGN KEY ("languagePrefId") REFERENCES "LanguagePreference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverServiceArea" ADD CONSTRAINT "DriverServiceArea_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAddress" ADD CONSTRAINT "CustomerAddress_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateRequest" ADD CONSTRAINT "EstimateRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateRequest" ADD CONSTRAINT "EstimateRequest_fromAddressId_fkey" FOREIGN KEY ("fromAddressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateRequest" ADD CONSTRAINT "EstimateRequest_toAddressId_fkey" FOREIGN KEY ("toAddressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EstimateRequest" ADD CONSTRAINT "EstimateRequest_designatedDriverId_fkey" FOREIGN KEY ("designatedDriverId") REFERENCES "Driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Estimate" ADD CONSTRAINT "Estimate_estimateRequestId_fkey" FOREIGN KEY ("estimateRequestId") REFERENCES "EstimateRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_estimateRequestId_fkey" FOREIGN KEY ("estimateRequestId") REFERENCES "EstimateRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "AuthUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "AuthUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
