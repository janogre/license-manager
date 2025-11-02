-- CreateEnum
CREATE TYPE "ContractCategory" AS ENUM ('HARDWARE', 'LICENSE');

-- AlterTable
ALTER TABLE "maintenance_contracts" ADD COLUMN "category" "ContractCategory" NOT NULL DEFAULT 'HARDWARE';
