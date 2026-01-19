/**
 * Script to import hardware assets and link them to maintenance contracts from nLogic file
 *
 * Structure: Each row represents a hardware asset (Serienummer) linked to a
 * maintenance contract (Varenummer, e.g., PAR-SUP-ACX7020)
 *
 * Run with: npx tsx scripts/import-missing.ts <path-to-nlogic-file>
 */

import { PrismaClient } from '@prisma/client';
import XLSX from 'xlsx';

const prisma = new PrismaClient();

interface NLogicRow {
  Varenummer: string;      // Contract/SKU (e.g., PAR-SUP-ACX7020)
  Modell: string;          // Hardware model (e.g., ACX7020-DC)
  Serienummer: string;     // Serial number (e.g., HU3525AX0196)
  Produkttype: string;     // Product type (Hardware/License)
  Lokasjon?: string;       // Location
  Kommentar?: string;      // Comments
  RENEW: string;           // Renewal flag
  'RNW to': number | string;       // Renewal end date
  ' NOK RNW PRICE ': number;       // Renewal price in NOK
  'Start Date': number | string;   // Contract start date
}

function parseExcelDate(excelDate: number | string): Date | null {
  if (!excelDate || excelDate === '') return null;
  const numDate = Number(excelDate);
  if (isNaN(numDate)) return null;
  const excelEpoch = new Date(1900, 0, 1);
  return new Date(excelEpoch.getTime() + (numDate - 2) * 24 * 60 * 60 * 1000);
}

async function main() {
  const filePath = process.argv[2] || "C:/Users/jang/OneDrive - NEAS Gruppen/Avtaler/nLogic/20251113 nLogic - NEAS - Juniper Service Renewal 2026.xlsx";

  console.log('Reading nLogic file:', filePath);

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets['nLogic 2025'];
  const data = XLSX.utils.sheet_to_json<NLogicRow>(sheet, { defval: '' });

  console.log(`Found ${data.length} rows in nLogic file\n`);

  // Get existing data from database
  const existingLicenses = await prisma.license.findMany({
    select: { licenseKey: true }
  });
  const existingAssets = await prisma.hardwareAsset.findMany({
    select: { serialNumber: true }
  });

  const existingLicenseKeys = new Set(existingLicenses.map(l => (l.licenseKey || '').toUpperCase()));
  const existingAssetSerials = new Set(existingAssets.map(a => a.serialNumber.toUpperCase()));

  // Get existing contracts
  const existingContracts = await prisma.maintenanceContract.findMany({
    select: { id: true, contractNumber: true }
  });
  const contractMap = new Map(existingContracts.map(c => [c.contractNumber.toUpperCase(), c.id]));

  console.log(`Existing in database: ${existingLicenses.length} licenses, ${existingAssets.length} hardware assets, ${existingContracts.length} contracts\n`);

  const results = {
    licensesImported: 0,
    licensesSkipped: 0,
    hardwareImported: 0,
    hardwareSkipped: 0,
    contractsCreated: 0,
    mappingsCreated: 0,
    errors: [] as string[]
  };

  for (const row of data) {
    const serialNumber = String(row.Serienummer || '').trim();
    if (!serialNumber) continue;

    const productType = String(row.Produkttype || '').toLowerCase();
    const isLicense = productType.includes('licens') ||
                      productType.includes('lic/sub') ||
                      productType.startsWith('lic');

    const model = String(row.Modell || '').trim();
    const contractNumber = String(row.Varenummer || '').trim(); // PAR-SUP-ACX7020
    const location = String(row.Lokasjon || '').trim() || null;
    const comment = String(row.Kommentar || '').trim();
    const renewalPrice = Number(row[' NOK RNW PRICE ']) || 0;
    const endDate = parseExcelDate(row['RNW to']);
    const startDate = parseExcelDate(row['Start Date']);

    try {
      if (isLicense) {
        // Handle license - create if new, then link to contract
        let licenseId: string;

        if (existingLicenseKeys.has(serialNumber.toUpperCase())) {
          // License exists - get its ID for mapping
          const existingLicense = await prisma.license.findFirst({
            where: { licenseKey: { equals: serialNumber, mode: 'insensitive' } },
            select: { id: true }
          });
          if (!existingLicense) {
            results.licensesSkipped++;
            continue;
          }
          licenseId = existingLicense.id;
          results.licensesSkipped++;
        } else {
          // Create new license
          const newLicense = await prisma.license.create({
            data: {
              licenseKey: serialNumber,
              licenseType: 'SUBSCRIPTION',
              softwareProduct: model || 'Unknown Software',
              quantity: 1,
              expiryDate: endDate,
              cost: renewalPrice || null,
              notes: comment || `Imported from nLogic on ${new Date().toLocaleDateString('nb-NO')}`,
              isActive: true,
            },
          });

          licenseId = newLicense.id;
          results.licensesImported++;
          existingLicenseKeys.add(serialNumber.toUpperCase());
        }

        // Link license to maintenance contract (Varenummer)
        if (contractNumber) {
          let contractId = contractMap.get(contractNumber.toUpperCase());

          // Create contract if it doesn't exist
          if (!contractId) {
            const contractStartDate = startDate || new Date();
            const contractEndDate = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

            const newContract = await prisma.maintenanceContract.create({
              data: {
                contractNumber: contractNumber,
                contractType: 'NLOGIC',
                category: 'LICENSE',
                vendor: 'Juniper Networks',
                startDate: contractStartDate,
                endDate: contractEndDate,
                annualCost: null,
                serviceLevel: contractNumber.includes('PAR-') ? 'Partner Support' : 'Standard',
                notes: `Imported from nLogic on ${new Date().toLocaleDateString('nb-NO')}`,
                isActive: true,
              },
            });

            contractId = newContract.id;
            contractMap.set(contractNumber.toUpperCase(), contractId);
            results.contractsCreated++;
            console.log(`  Created contract: ${contractNumber}`);
          }

          // Create license-contract mapping if it doesn't exist
          const existingMapping = await prisma.licenseContractMapping.findFirst({
            where: { licenseId, contractId }
          });

          if (!existingMapping) {
            const coverageStart = startDate || new Date();
            const coverageEnd = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

            await prisma.licenseContractMapping.create({
              data: {
                licenseId,
                contractId,
                coverageStart,
                coverageEnd,
                licenseCost: renewalPrice || null,
                status: 'active',
              },
            });

            results.mappingsCreated++;
          }
        }

      } else {
        // Hardware asset
        let assetId: string;
        let isNewAsset = false;

        if (existingAssetSerials.has(serialNumber.toUpperCase())) {
          // Asset exists - get its ID for mapping
          const existingAsset = await prisma.hardwareAsset.findFirst({
            where: { serialNumber: { equals: serialNumber, mode: 'insensitive' } },
            select: { id: true }
          });
          if (!existingAsset) {
            results.hardwareSkipped++;
            continue;
          }
          assetId = existingAsset.id;
          results.hardwareSkipped++;
        } else {
          // Create new hardware asset
          isNewAsset = true;

          // Find or create model
          let hardwareModel = await prisma.hardwareModel.findFirst({
            where: { modelName: { equals: model, mode: 'insensitive' } }
          });

          if (!hardwareModel && model) {
            hardwareModel = await prisma.hardwareModel.create({
              data: {
                manufacturer: 'Juniper Networks',
                modelName: model,
                modelType: 'ROUTER',
                isActive: true,
              },
            });
          }

          if (!hardwareModel) {
            results.errors.push(`No model for hardware: ${serialNumber}`);
            continue;
          }

          // Find or create location
          let locationId: string | null = null;
          if (location) {
            let loc = await prisma.location.findFirst({
              where: { name: { equals: location, mode: 'insensitive' } }
            });

            if (!loc) {
              loc = await prisma.location.create({
                data: { name: location, isActive: true }
              });
            }
            locationId = loc.id;
          }

          // Create hardware asset
          const newAsset = await prisma.hardwareAsset.create({
            data: {
              modelId: hardwareModel.id,
              serialNumber: serialNumber,
              locationId,
              status: 'ACTIVE',
              notes: comment || `Imported from nLogic on ${new Date().toLocaleDateString('nb-NO')}`,
            },
          });

          assetId = newAsset.id;
          results.hardwareImported++;
          existingAssetSerials.add(serialNumber.toUpperCase());
        }

        // Now link the asset to its maintenance contract (Varenummer)
        if (contractNumber) {
          let contractId = contractMap.get(contractNumber.toUpperCase());

          // Create contract if it doesn't exist
          if (!contractId) {
            const contractStartDate = startDate || new Date();
            const contractEndDate = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

            const newContract = await prisma.maintenanceContract.create({
              data: {
                contractNumber: contractNumber,
                contractType: 'NLOGIC',
                category: 'HARDWARE',
                vendor: 'Juniper Networks',
                startDate: contractStartDate,
                endDate: contractEndDate,
                annualCost: null, // Will be calculated from sum of assets
                serviceLevel: contractNumber.includes('PAR-') ? 'Partner Support' : 'Standard',
                notes: `Imported from nLogic on ${new Date().toLocaleDateString('nb-NO')}`,
                isActive: true,
              },
            });

            contractId = newContract.id;
            contractMap.set(contractNumber.toUpperCase(), contractId);
            results.contractsCreated++;
            console.log(`  Created contract: ${contractNumber}`);
          }

          // Create asset-contract mapping if it doesn't exist
          const existingMapping = await prisma.assetContractMapping.findFirst({
            where: { assetId, contractId }
          });

          if (!existingMapping) {
            const coverageStart = startDate || new Date();
            const coverageEnd = endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

            await prisma.assetContractMapping.create({
              data: {
                assetId,
                contractId,
                coverageStart,
                coverageEnd,
                assetCost: renewalPrice || null,
                status: 'active',
              },
            });

            results.mappingsCreated++;
          }
        }
      }
    } catch (error: any) {
      results.errors.push(`${serialNumber}: ${error.message}`);
    }
  }

  console.log('\n=== Import Results ===');
  console.log(`Hardware imported: ${results.hardwareImported}`);
  console.log(`Hardware skipped (already exist): ${results.hardwareSkipped}`);
  console.log(`Contracts created: ${results.contractsCreated}`);
  console.log(`Asset-Contract mappings created: ${results.mappingsCreated}`);
  console.log(`Licenses imported: ${results.licensesImported}`);
  console.log(`Licenses skipped (already exist): ${results.licensesSkipped}`);

  if (results.errors.length > 0) {
    console.log(`\nErrors (${results.errors.length}):`);
    results.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
    if (results.errors.length > 10) {
      console.log(`  ... and ${results.errors.length - 10} more`);
    }
  }

  // Update annual cost on all contracts (sum of asset costs + license costs)
  console.log('\nOppdaterer årskostnad per kontrakt...');
  const allContracts = await prisma.maintenanceContract.findMany({
    include: {
      assets: { select: { assetCost: true } },
      licenses: { select: { licenseCost: true } }
    }
  });

  for (const contract of allContracts) {
    const assetTotal = contract.assets.reduce((sum, mapping) => {
      return sum + (mapping.assetCost ? Number(mapping.assetCost) : 0);
    }, 0);

    const licenseTotal = contract.licenses.reduce((sum, mapping) => {
      return sum + (mapping.licenseCost ? Number(mapping.licenseCost) : 0);
    }, 0);

    const totalCost = assetTotal + licenseTotal;

    await prisma.maintenanceContract.update({
      where: { id: contract.id },
      data: { annualCost: totalCost }
    });
  }
  console.log(`  Oppdatert ${allContracts.length} kontrakter`);

  // Final counts
  const finalLicenses = await prisma.license.count();
  const finalAssets = await prisma.hardwareAsset.count();
  const finalContracts = await prisma.maintenanceContract.count();
  const finalAssetMappings = await prisma.assetContractMapping.count();
  const finalLicenseMappings = await prisma.licenseContractMapping.count();
  console.log(`\nFinal database counts:`);
  console.log(`  - ${finalAssets} hardware assets`);
  console.log(`  - ${finalLicenses} licenses`);
  console.log(`  - ${finalContracts} contracts`);
  console.log(`  - ${finalAssetMappings} asset-contract mappings`);
  console.log(`  - ${finalLicenseMappings} license-contract mappings`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
