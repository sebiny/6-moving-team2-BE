/*
  Warnings:

  - The `career` column on the `Driver` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Driver" ADD COLUMN     "work" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "career",
ADD COLUMN     "career" INTEGER;
