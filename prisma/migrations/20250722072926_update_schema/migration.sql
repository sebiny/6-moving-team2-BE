/*
  Warnings:

  - Changed the column `moveType` on the `Customer` table from a scalar field to a list field. If there are non-null values in that column, this step will fail.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ESTIMATE_PROPOSAL';

-- AlterTable
ALTER TABLE "Customer"
  ALTER COLUMN "moveType"
  SET DATA TYPE "MoveType"[]
  USING ARRAY["moveType"]::"MoveType"[];