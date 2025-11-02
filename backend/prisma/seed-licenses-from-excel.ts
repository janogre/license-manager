import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting license import from Excel...');

  // Read Excel file
  console.log('Reading license Excel file...');
  const filePath = path.join(__dirname, '..', 'data', 'Vedlikeholdskontrakter lisenser.xlsx');

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`✓ Read ${rawData.length} rows from Excel`);

  // Clear existing licenses
  console.log('Clearing existing licenses...');
  await prisma.assetLicenseMapping.deleteMany();
  await prisma.license.deleteMany();
  console.log('✓ Cleared existing licenses');

  let licensesCreated = 0;
  let licensesMapped = 0;
  let skippedNoAsset = 0;
  const seenLicenseKeys = new Set<string>();

  for (const row of rawData) {
    const data: any = row;
    const licenseSerial = String(data['Serienummer'] || '').trim();
    const licenseSKU = String(data['Utstyr/lisens'] || '').trim();
    const type = String(data['Type'] || '').trim();
    const contractName = String(data['Vedlikeholdsavtale'] || '').trim();
    const assetSerial = String(data['Lisensen tilhører utstyr'] || '').trim();
    const price = Number(data['Pris']) || 0;

    if (!licenseSerial || !licenseSKU) {
      console.log('⚠️  Skipping row - missing license serial or SKU');
      continue;
    }

    // Skip duplicate license keys
    if (seenLicenseKeys.has(licenseSerial)) {
      console.log(`⚠️  Skipping duplicate license serial: ${licenseSerial}`);
      continue;
    }
    seenLicenseKeys.add(licenseSerial);

    // Determine license type
    let licenseType = 'SUBSCRIPTION';
    if (type.toLowerCase().includes('perpetual')) {
      licenseType = 'PERPETUAL';
    } else if (type.toLowerCase().includes('trial')) {
      licenseType = 'TRIAL';
    } else if (type.toLowerCase().includes('feature')) {
      licenseType = 'FEATURE';
    }

    // Create license
    const license = await prisma.license.create({
      data: {
        licenseKey: licenseSerial,
        licenseType: licenseType as any,
        softwareProduct: licenseSKU,
        quantity: 1,
        purchaseDate: new Date('2020-01-01'),
        cost: price.toString(),
        vendorContractNumber: contractName || null,
        isActive: true,
      },
    });

    licensesCreated++;

    // Map license to hardware asset if asset serial is provided
    if (assetSerial) {
      // Find the hardware asset by serial number
      const asset = await prisma.hardwareAsset.findUnique({
        where: { serialNumber: assetSerial },
      });

      if (asset) {
        await prisma.assetLicenseMapping.create({
          data: {
            assetId: asset.id,
            licenseId: license.id,
            assignedDate: new Date(),
            status: 'active',
          },
        });
        licensesMapped++;
      } else {
        console.log(`⚠️  Asset not found for serial: ${assetSerial} (license: ${licenseSerial})`);
        skippedNoAsset++;
      }
    }
  }

  console.log(`✓ Created ${licensesCreated} licenses`);
  console.log(`✓ Mapped ${licensesMapped} licenses to assets`);
  if (skippedNoAsset > 0) {
    console.log(`⚠️  ${skippedNoAsset} licenses could not be mapped (asset not found)`);
  }

  console.log('\n✅ License import completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Licenses Created: ${licensesCreated}`);
  console.log(`   - License-Asset Mappings: ${licensesMapped}`);
  console.log(`   - Unmapped Licenses: ${skippedNoAsset}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during license import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
