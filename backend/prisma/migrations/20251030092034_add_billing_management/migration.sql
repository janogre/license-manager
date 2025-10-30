-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "billing_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "billingType" "BillingType" NOT NULL DEFAULT 'SEMI_ANNUAL',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxAssets" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_billing_mappings" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "billingGroupId" TEXT NOT NULL,
    "assignedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "assignedBy" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_billing_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_records" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "billingGroupId" TEXT NOT NULL,
    "vendor" TEXT NOT NULL DEFAULT 'Juniper Networks',
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'NOK',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "paymentDate" TIMESTAMP(3),
    "paidAmount" DECIMAL(12,2),
    "notes" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "assetId" TEXT,
    "contractId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "billingPeriod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_cycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "billingType" "BillingType" NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 2,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "autoAssign" BOOLEAN NOT NULL DEFAULT true,
    "balanceThreshold" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_groups_name_key" ON "billing_groups"("name");

-- CreateIndex
CREATE INDEX "asset_billing_mappings_assetId_idx" ON "asset_billing_mappings"("assetId");

-- CreateIndex
CREATE INDEX "asset_billing_mappings_billingGroupId_idx" ON "asset_billing_mappings"("billingGroupId");

-- CreateIndex
CREATE INDEX "asset_billing_mappings_effectiveFrom_idx" ON "asset_billing_mappings"("effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "asset_billing_mappings_assetId_billingGroupId_effectiveFrom_key" ON "asset_billing_mappings"("assetId", "billingGroupId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "invoice_records_invoiceNumber_key" ON "invoice_records"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoice_records_billingGroupId_idx" ON "invoice_records"("billingGroupId");

-- CreateIndex
CREATE INDEX "invoice_records_invoiceDate_idx" ON "invoice_records"("invoiceDate");

-- CreateIndex
CREATE INDEX "invoice_records_status_idx" ON "invoice_records"("status");

-- CreateIndex
CREATE INDEX "invoice_line_items_invoiceId_idx" ON "invoice_line_items"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_line_items_assetId_idx" ON "invoice_line_items"("assetId");

-- CreateIndex
CREATE INDEX "invoice_line_items_contractId_idx" ON "invoice_line_items"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "billing_cycles_name_key" ON "billing_cycles"("name");

-- AddForeignKey
ALTER TABLE "asset_billing_mappings" ADD CONSTRAINT "asset_billing_mappings_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hardware_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asset_billing_mappings" ADD CONSTRAINT "asset_billing_mappings_billingGroupId_fkey" FOREIGN KEY ("billingGroupId") REFERENCES "billing_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_records" ADD CONSTRAINT "invoice_records_billingGroupId_fkey" FOREIGN KEY ("billingGroupId") REFERENCES "billing_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hardware_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "maintenance_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
