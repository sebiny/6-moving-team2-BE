-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('CUSTOMER', 'DRIVER');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'NAVER', 'KAKAO');

-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('SEOUL', 'GYEONGGI');

-- CreateEnum
CREATE TYPE "MoveType" AS ENUM ('SMALL', 'HOME', 'OFFICE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('ACTIVE', 'CONFIRMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EstimateStatus" AS ENUM ('PROPOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LangCode" AS ENUM ('ko', 'en', 'zh');

-- CreateTable
CREATE TABLE "AuthUser" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone" TEXT,
    "userType" "UserType" NOT NULL,
    "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "providerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "AuthUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" SERIAL NOT NULL,
    "postalCode" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "detail" TEXT,
    "region" "RegionType" NOT NULL,
    "district" TEXT NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "authUserId" INTEGER NOT NULL,
    "profileImage" TEXT,
    "moveType" "MoveType",
    "currentArea" TEXT,
    "fromAddressId" INTEGER,
    "toAddressId" INTEGER,
    "moveDate" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "languagePrefId" INTEGER,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" SERIAL NOT NULL,
    "authUserId" INTEGER NOT NULL,
    "profileImage" TEXT,
    "nickname" TEXT NOT NULL,
    "career" TEXT,
    "shortIntro" TEXT,
    "detailIntro" TEXT,
    "services" TEXT[],
    "serviceAreas" TEXT[],
    "deletedAt" TIMESTAMP(3),
    "languagePrefId" INTEGER,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EstimateRequest" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "moveType" "MoveType" NOT NULL,
    "moveDate" TIMESTAMP(3) NOT NULL,
    "fromAddressId" INTEGER NOT NULL,
    "toAddressId" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL,
    "designatedDriverId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "EstimateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Estimate" (
    "id" SERIAL NOT NULL,
    "driverId" INTEGER NOT NULL,
    "estimateRequestId" INTEGER NOT NULL,
    "price" INTEGER,
    "comment" TEXT,
    "status" "EstimateStatus" NOT NULL DEFAULT 'PROPOSED',
    "rejectReason" TEXT,
    "isDesignated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Estimate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiverId" INTEGER NOT NULL,
    "senderId" INTEGER,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LanguagePreference" (
    "id" SERIAL NOT NULL,
    "language" "LangCode" NOT NULL,
    "value" TEXT,

    CONSTRAINT "LanguagePreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AuthUser_email_key" ON "AuthUser"("email");

-- CreateIndex
CREATE INDEX "Address_region_idx" ON "Address"("region");

-- CreateIndex
CREATE INDEX "Address_district_idx" ON "Address"("district");

-- CreateIndex
CREATE UNIQUE INDEX "Address_postalCode_street_detail_key" ON "Address"("postalCode", "street", "detail");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_authUserId_key" ON "Customer"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_languagePrefId_key" ON "Customer"("languagePrefId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_authUserId_key" ON "Driver"("authUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Driver_languagePrefId_key" ON "Driver"("languagePrefId");

-- CreateIndex
CREATE UNIQUE INDEX "Estimate_estimateRequestId_driverId_key" ON "Estimate"("estimateRequestId", "driverId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "AuthUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_fromAddressId_fkey" FOREIGN KEY ("fromAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_toAddressId_fkey" FOREIGN KEY ("toAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_languagePrefId_fkey" FOREIGN KEY ("languagePrefId") REFERENCES "LanguagePreference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_authUserId_fkey" FOREIGN KEY ("authUserId") REFERENCES "AuthUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Driver" ADD CONSTRAINT "Driver_languagePrefId_fkey" FOREIGN KEY ("languagePrefId") REFERENCES "LanguagePreference"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "AuthUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "AuthUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
