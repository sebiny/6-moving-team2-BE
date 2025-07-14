/*
  Warnings:

  - You are about to drop the column `services` on the `Driver` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Review` table. All the data in the column will be lost.
  - Made the column `moveType` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `currentArea` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `moveType` to the `Driver` table without a default value. This is not possible if the table is not empty.
  - Made the column `shortIntro` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `detailIntro` on table `Driver` required. This step will fail if there are existing NULL values in that column.
  - Made the column `career` on table `Driver` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "moveType" SET NOT NULL,
ALTER COLUMN "currentArea" SET NOT NULL;

-- AlterTable
ALTER TABLE "Driver" DROP COLUMN "services",
ADD COLUMN     "moveType" "MoveType" NOT NULL,
ALTER COLUMN "shortIntro" SET NOT NULL,
ALTER COLUMN "detailIntro" SET NOT NULL,
ALTER COLUMN "career" SET NOT NULL;

-- AlterTable
ALTER TABLE "DriverServiceArea" ALTER COLUMN "district" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "deletedAt";
