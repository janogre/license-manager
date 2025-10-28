-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ModelType" AS ENUM ('ROUTER', 'SWITCH', 'FIREWALL', 'WIRELESS_AP', 'CONTROLLER', 'OTHER');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'SPARE', 'DEFECT', 'RETIRED', 'IN_REPAIR', 'MISSING');

-- CreateEnum
CREATE TYPE "LicenseType" AS ENUM ('SUBSCRIPTION', 'PERPETUAL', 'FEATURE', 'TRIAL');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('JUNIPER_CARE', 'PREMIUM_CARE', 'THIRD_PARTY', 'OTHER');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('CONTRACT_EXPIRY_90', 'CONTRACT_EXPIRY_60', 'CONTRACT_EXPIRY_30', 'LICENSE_EXPIRY_60', 'LICENSE_EXPIRY_30', 'LICENSE_EXPIRY_7', 'EOL_ANNOUNCED', 'EOS_ANNOUNCED');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_models" (
    "id" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL DEFAULT 'Juniper Networks',
    "modelName" TEXT NOT NULL,
    "modelType" "ModelType" NOT NULL,
    "description" TEXT,
    "technicalSpecs" JSONB,
    "eolDate" TIMESTAMP(3),
    "eosDate" TIMESTAMP(3),
    "eolAnnouncedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hardware_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_assets" (
    "id" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "assetTag" TEXT,
    "hostname" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(10,2),
    "location" TEXT,
    "rackPosition" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'ACTIVE',
    "owner" TEXT,
    "notes" TEXT,
    "observiumId" INTEGER,
    "lastSyncAt" TIMESTAMP(3),
    "lastAuditDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hardware_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licenses" (
    "id" TEXT NOT NULL,
    "licenseKey" TEXT,
    "licenseType" "LicenseType" NOT NULL,
    "softwareProduct" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purchaseDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "cost" DECIMAL(10,2),
    "vendorContractNumber" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_contracts" (
    "id" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "vendor" TEXT NOT NULL DEFAULT 'Juniper Networks',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "renewalDate" TIMESTAMP(3),
    "annualCost" DECIMAL(10,2),
    "serviceLevel" TEXT,
    "autoRenewal" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_license_mappings" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_license_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_contract_mappings" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "coverageStart" TIMESTAMP(3) NOT NULL,
    "coverageEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_contract_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observium_sync_logs" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "observiumDeviceId" INTEGER NOT NULL,
    "syncType" TEXT NOT NULL,
    "syncStatus" TEXT NOT NULL,
    "changes" JSONB,
    "errorMessage" TEXT,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observium_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contract_alerts" (
    "id" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "alertDate" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "status" "AlertStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_models_modelName_key" ON "hardware_models"("modelName");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_assets_serialNumber_key" ON "hardware_assets"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_assets_assetTag_key" ON "hardware_assets"("assetTag");

-- CreateIndex
CREATE UNIQUE INDEX "hardware_assets_observiumId_key" ON "hardware_assets"("observiumId");

-- CreateIndex
CREATE INDEX "hardware_assets_modelId_idx" ON "hardware_assets"("modelId");

-- CreateIndex
CREATE INDEX "hardware_assets_serialNumber_idx" ON "hardware_assets"("serialNumber");

-- CreateIndex
CREATE INDEX "hardware_assets_hostname_idx" ON "hardware_assets"("hostname");

-- CreateIndex
CREATE UNIQUE INDEX "licenses_licenseKey_key" ON "licenses"("licenseKey");

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_contracts_contractNumber_key" ON "maintenance_contracts"("contractNumber");

-- CreateIndex
CREATE INDEX "asset_license_mappings_assetId_idx" ON "asset_license_mappings"("assetId");

-- CreateIndex
CREATE INDEX "asset_license_mappings_licenseId_idx" ON "asset_license_mappings"("licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_license_mappings_assetId_licenseId_key" ON "asset_license_mappings"("assetId", "licenseId");

-- CreateIndex
CREATE INDEX "asset_contract_mappings_assetId_idx" ON "asset_contract_mappings"("assetId");

-- CreateIndex
CREATE INDEX "asset_contract_mappings_contractId_idx" ON "asset_contract_mappings"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "asset_contract_mappings_assetId_contractId_key" ON "asset_contract_mappings"("assetId", "contractId");

-- CreateIndex
CREATE INDEX "observium_sync_logs_assetId_idx" ON "observium_sync_logs"("assetId");

-- CreateIndex
CREATE INDEX "observium_sync_logs_observiumDeviceId_idx" ON "observium_sync_logs"("observiumDeviceId");

-- CreateIndex
CREATE INDEX "contract_alerts_contractId_idx" ON "contract_alerts"("contractId");

-- CreateIndex
CREATE INDEX "contract_alerts_alertDate_idx" ON "contract_alerts"("alertDate");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "hardware_assets" ADD CONSTRAINT "hardware_assets_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "hardware_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_license_mappings" ADD CONSTRAINT "asset_license_mappings_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hardware_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_license_mappings" ADD CONSTRAINT "asset_license_mappings_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_contract_mappings" ADD CONSTRAINT "asset_contract_mappings_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hardware_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_contract_mappings" ADD CONSTRAINT "asset_contract_mappings_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "maintenance_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observium_sync_logs" ADD CONSTRAINT "observium_sync_logs_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hardware_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contract_alerts" ADD CONSTRAINT "contract_alerts_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "maintenance_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
