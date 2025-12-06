/*
  Warnings:

  - Added the required column `email` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subscription` ADD COLUMN `email` VARCHAR(191) NOT NULL;
