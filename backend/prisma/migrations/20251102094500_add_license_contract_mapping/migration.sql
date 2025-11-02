-- CreateTable
CREATE TABLE "license_contract_mappings" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "coverageStart" TIMESTAMP(3) NOT NULL,
    "coverageEnd" TIMESTAMP(3) NOT NULL,
    "licenseCost" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "license_contract_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "license_contract_mappings_licenseId_idx" ON "license_contract_mappings"("licenseId");

-- CreateIndex
CREATE INDEX "license_contract_mappings_contractId_idx" ON "license_contract_mappings"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "license_contract_mappings_licenseId_contractId_key" ON "license_contract_mappings"("licenseId", "contractId");

-- AddForeignKey
ALTER TABLE "license_contract_mappings" ADD CONSTRAINT "license_contract_mappings_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "licenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "license_contract_mappings" ADD CONSTRAINT "license_contract_mappings_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "maintenance_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
