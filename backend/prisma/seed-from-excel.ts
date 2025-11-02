import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding from Excel...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.contractAlert.deleteMany();
  await prisma.observiumSyncLog.deleteMany();
  await prisma.assetContractMapping.deleteMany();
  await prisma.assetLicenseMapping.deleteMany();
  await prisma.maintenanceContract.deleteMany();
  await prisma.license.deleteMany();
  await prisma.hardwareAsset.deleteMany();
  await prisma.hardwareModel.deleteMany();
  await prisma.location.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const adminPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@neas.no',
      password: adminPassword,
      firstName: 'NEAS',
      lastName: 'Admin',
      role: 'ADMIN',
    },
  });

  console.log('✓ Created admin user');

  // Read Excel file
  console.log('Reading Excel file...');
  const filePath = path.join(__dirname, '..', 'data', 'Vedlikeholdskontrakter hardware .xlsx');

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`✓ Read ${rawData.length} rows from Excel`);

  // Extract unique locations from the data
  const uniqueLocations = [...new Set(rawData.map((row: any) => row['Lokasjon']))].filter(Boolean);
  console.log(`Found ${uniqueLocations.length} unique locations`);

  // Create locations
  console.log('Creating locations...');
  const locationMap = new Map();

  for (const locationName of uniqueLocations) {
    const name = String(locationName).trim();
    const location = await prisma.location.create({
      data: {
        name: name,
        isActive: true,
      },
    });
    locationMap.set(name, location);
  }

  console.log(`✓ Created ${uniqueLocations.length} locations`);

  // Extract unique models from the data
  const uniqueModels = [...new Set(rawData.map((row: any) => row['Utstyr/lisens']))].filter(Boolean);
  console.log(`Found ${uniqueModels.length} unique models`);

  // Create models
  console.log('Creating hardware models...');
  const modelMap = new Map();

  for (const modelName of uniqueModels) {
    const name = String(modelName).trim();

    // Determine model type based on name patterns
    let modelType = 'OTHER';
    if (name.includes('MX') || name.match(/MX\d+/)) {
      modelType = 'ROUTER';
    } else if (name.includes('QFX') || name.includes('EX')) {
      modelType = 'SWITCH';
    } else if (name.includes('SRX')) {
      modelType = 'FIREWALL';
    }

    const model = await prisma.hardwareModel.create({
      data: {
        modelName: name,
        modelType: modelType as any,
        manufacturer: 'Juniper Networks',
        description: `${name} network equipment`,
        technicalSpecs: {},
        isActive: true,
      },
    });

    modelMap.set(name, model);
  }

  console.log(`✓ Created ${uniqueModels.length} hardware models`);

  // Extract unique contract types
  const uniqueContracts = [...new Set(rawData.map((row: any) => row['Vedlikeholdsavtale']))].filter(Boolean);
  console.log(`Found ${uniqueContracts.length} unique contract types`);

  // Create maintenance contracts
  console.log('Creating maintenance contracts...');
  const contractMap = new Map();

  for (const contractName of uniqueContracts) {
    const name = String(contractName).trim();

    // Calculate total annual cost for this contract type
    const contractAssets = rawData.filter((row: any) => row['Vedlikeholdsavtale'] === contractName);
    const totalCost = contractAssets.reduce((sum: number, row: any) => sum + (Number(row['Pris']) || 0), 0);

    const contract = await prisma.maintenanceContract.create({
      data: {
        contractNumber: name,
        contractType: 'THIRD_PARTY',
        vendor: 'Juniper Networks',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        renewalDate: new Date('2025-11-01'),
        annualCost: totalCost.toString(),
        serviceLevel: 'Business hours support',
        autoRenewal: true,
        isActive: true,
      },
    });

    contractMap.set(name, contract);
  }

  console.log(`✓ Created ${uniqueContracts.length} maintenance contracts`);

  // Create hardware assets
  console.log('Creating hardware assets...');
  let assetsCreated = 0;
  let assetsMapped = 0;
  const seenSerialNumbers = new Set<string>();

  for (const row of rawData) {
    const data: any = row;
    const serialNumber = String(data['Serienummer'] || '').trim();
    const modelName = String(data['Utstyr/lisens'] || '').trim();
    const location = String(data['Lokasjon'] || '').trim();
    const contractName = String(data['Vedlikeholdsavtale'] || '').trim();
    const price = Number(data['Pris']) || 0;

    if (!serialNumber || !modelName) {
      console.log(`Skipping row - missing serial number or model`);
      continue;
    }

    // Skip duplicate serial numbers
    if (seenSerialNumbers.has(serialNumber)) {
      console.log(`⚠️  Skipping duplicate serial number: ${serialNumber}`);
      continue;
    }
    seenSerialNumbers.add(serialNumber);

    const model = modelMap.get(modelName);
    if (!model) {
      console.log(`Model not found: ${modelName}`);
      continue;
    }

    // Get location
    const locationObj = locationMap.get(location);

    // Determine status based on location
    let status = 'ACTIVE';
    if (location.toLowerCase().includes('lager')) {
      status = 'SPARE';
    }

    const asset = await prisma.hardwareAsset.create({
      data: {
        modelId: model.id,
        serialNumber: serialNumber,
        assetTag: null,
        hostname: null,
        purchaseDate: new Date('2020-01-01'),
        purchasePrice: price.toString(),
        locationId: locationObj?.id || null,
        rackPosition: null,
        status: status as any,
        owner: 'NEAS',
        notes: null,
      },
    });

    assetsCreated++;

    // Map asset to contract
    if (contractName) {
      const contract = contractMap.get(contractName);
      if (contract) {
        await prisma.assetContractMapping.create({
          data: {
            assetId: asset.id,
            contractId: contract.id,
            coverageStart: new Date('2024-01-01'),
            coverageEnd: new Date('2025-12-31'),
            status: 'active',
          },
        });
        assetsMapped++;
      }
    }
  }

  console.log(`✓ Created ${assetsCreated} hardware assets`);
  console.log(`✓ Mapped ${assetsMapped} assets to contracts`);

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: 1`);
  console.log(`   - Locations: ${uniqueLocations.length}`);
  console.log(`   - Hardware Models: ${uniqueModels.length}`);
  console.log(`   - Maintenance Contracts: ${uniqueContracts.length}`);
  console.log(`   - Hardware Assets: ${assetsCreated}`);
  console.log(`   - Asset-Contract Mappings: ${assetsMapped}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
