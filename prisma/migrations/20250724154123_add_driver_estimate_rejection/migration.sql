-- CreateTable
CREATE TABLE "DriverEstimateRejection" (
    "id" TEXT NOT NULL,
    "estimateRequestId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DriverEstimateRejection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverEstimateRejection_driverId_idx" ON "DriverEstimateRejection"("driverId");

-- CreateIndex
CREATE INDEX "DriverEstimateRejection_estimateRequestId_idx" ON "DriverEstimateRejection"("estimateRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverEstimateRejection_estimateRequestId_driverId_key" ON "DriverEstimateRejection"("estimateRequestId", "driverId");

-- AddForeignKey
ALTER TABLE "DriverEstimateRejection" ADD CONSTRAINT "DriverEstimateRejection_estimateRequestId_fkey" FOREIGN KEY ("estimateRequestId") REFERENCES "EstimateRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverEstimateRejection" ADD CONSTRAINT "DriverEstimateRejection_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
