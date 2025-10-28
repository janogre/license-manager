import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

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
  await prisma.user.deleteMany();

  // Create users
  console.log('Creating users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  const editorPassword = await bcrypt.hash('editor123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  const editor = await prisma.user.create({
    data: {
      email: 'editor@example.com',
      password: editorPassword,
      firstName: 'Editor',
      lastName: 'User',
      role: 'EDITOR',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@example.com',
      password: viewerPassword,
      firstName: 'Viewer',
      lastName: 'User',
      role: 'VIEWER',
    },
  });

  console.log('✓ Created 3 users');

  // Create Hardware Models
  console.log('Creating hardware models...');
  const mx240 = await prisma.hardwareModel.create({
    data: {
      modelName: 'MX240',
      modelType: 'ROUTER',
      manufacturer: 'Juniper Networks',
      description: 'High-performance edge router',
      technicalSpecs: {
        ports: '48x 10GbE',
        throughput: '2.4 Tbps',
        dimensions: '7U',
      },
      eolDate: new Date('2026-12-31'),
      eosDate: new Date('2028-12-31'),
    },
  });

  const ex4300 = await prisma.hardwareModel.create({
    data: {
      modelName: 'EX4300-48T',
      modelType: 'SWITCH',
      manufacturer: 'Juniper Networks',
      description: '48-port Gigabit Ethernet switch',
      technicalSpecs: {
        ports: '48x 1GbE + 4x 10GbE SFP+',
        switching_capacity: '176 Gbps',
        dimensions: '1U',
      },
      eolDate: new Date('2025-06-30'),
      eosDate: new Date('2027-06-30'),
    },
  });

  const srx345 = await prisma.hardwareModel.create({
    data: {
      modelName: 'SRX345',
      modelType: 'FIREWALL',
      manufacturer: 'Juniper Networks',
      description: 'Services Gateway for branch offices',
      technicalSpecs: {
        firewall_throughput: '3 Gbps',
        ipsec_vpn: '500 Mbps',
        concurrent_sessions: '250000',
        dimensions: '1U',
      },
    },
  });

  const ex2300 = await prisma.hardwareModel.create({
    data: {
      modelName: 'EX2300-24T',
      modelType: 'SWITCH',
      manufacturer: 'Juniper Networks',
      description: 'Compact Ethernet Switch with 24 ports',
      technicalSpecs: {
        ports: '24x 1GbE + 4x 1/10GbE SFP/SFP+',
        switching_capacity: '128 Gbps',
        dimensions: '1U',
      },
    },
  });

  const mx480 = await prisma.hardwareModel.create({
    data: {
      modelName: 'MX480',
      modelType: 'ROUTER',
      manufacturer: 'Juniper Networks',
      description: 'Universal routing platform',
      technicalSpecs: {
        throughput: '5 Tbps',
        dimensions: '14U',
      },
    },
  });

  console.log('✓ Created 5 hardware models');

  // Create Licenses
  console.log('Creating licenses...');
  const licenseAdvanced = await prisma.license.create({
    data: {
      licenseKey: 'JUNOS-ADV-2024-ABC123',
      licenseType: 'SUBSCRIPTION',
      softwareProduct: 'Junos OS Advanced',
      quantity: 10,
      purchaseDate: new Date('2024-01-15'),
      expiryDate: new Date('2026-01-15'),
      cost: 25000,
      vendorContractNumber: 'JL-2024-001',
      notes: 'Advanced routing and MPLS features',
    },
  });

  const licenseStandard = await prisma.license.create({
    data: {
      licenseKey: 'JUNOS-STD-2024-XYZ789',
      licenseType: 'SUBSCRIPTION',
      softwareProduct: 'Junos OS Standard',
      quantity: 20,
      purchaseDate: new Date('2024-03-01'),
      expiryDate: new Date('2025-03-01'),
      cost: 15000,
      vendorContractNumber: 'JL-2024-002',
    },
  });

  const licenseSecurity = await prisma.license.create({
    data: {
      licenseKey: 'JSEC-ENT-2024-DEF456',
      licenseType: 'SUBSCRIPTION',
      softwareProduct: 'Juniper Security Director',
      quantity: 5,
      purchaseDate: new Date('2024-02-10'),
      expiryDate: new Date('2025-12-10'),
      cost: 18000,
      vendorContractNumber: 'JL-2024-003',
    },
  });

  const licenseATP = await prisma.license.create({
    data: {
      licenseKey: 'JATP-CLOUD-2024-GHI789',
      licenseType: 'SUBSCRIPTION',
      softwareProduct: 'Juniper ATP Cloud',
      quantity: 15,
      purchaseDate: new Date('2023-11-20'),
      expiryDate: new Date('2025-11-20'),
      cost: 22000,
      notes: 'Advanced Threat Prevention',
    },
  });

  const licensePerpetual = await prisma.license.create({
    data: {
      licenseType: 'PERPETUAL',
      softwareProduct: 'Junos Base License',
      quantity: 50,
      purchaseDate: new Date('2022-05-10'),
      cost: 5000,
      notes: 'Perpetual base license for all devices',
    },
  });

  console.log('✓ Created 5 licenses');

  // Create Maintenance Contracts
  console.log('Creating maintenance contracts...');
  const contractPremium = await prisma.maintenanceContract.create({
    data: {
      contractNumber: 'JC-2024-001',
      contractType: 'PREMIUM_CARE',
      vendor: 'Juniper Networks',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2025-12-31'),
      renewalDate: new Date('2025-11-01'),
      annualCost: 125000,
      serviceLevel: '24x7, 4-hour response',
      autoRenewal: true,
      notes: 'Premium support for core infrastructure',
    },
  });

  const contractStandard = await prisma.maintenanceContract.create({
    data: {
      contractNumber: 'JC-2024-002',
      contractType: 'JUNIPER_CARE',
      vendor: 'Juniper Networks',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-02-28'),
      renewalDate: new Date('2025-01-28'),
      annualCost: 75000,
      serviceLevel: 'Business hours, next business day',
      autoRenewal: false,
      notes: 'Standard support for access layer',
    },
  });

  const contractExpiring = await prisma.maintenanceContract.create({
    data: {
      contractNumber: 'JC-2023-005',
      contractType: 'JUNIPER_CARE',
      vendor: 'Juniper Networks',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2025-11-15'), // Expiring soon
      annualCost: 45000,
      serviceLevel: 'Business hours',
      autoRenewal: false,
      notes: 'Contract expiring soon - needs renewal',
    },
  });

  const contractThirdParty = await prisma.maintenanceContract.create({
    data: {
      contractNumber: 'TP-2024-001',
      contractType: 'THIRD_PARTY',
      vendor: 'TechSupport AS',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2026-01-15'),
      annualCost: 35000,
      serviceLevel: '12x5',
      autoRenewal: true,
    },
  });

  console.log('✓ Created 4 maintenance contracts');

  // Create Hardware Assets
  console.log('Creating hardware assets...');
  const assetMX240_1 = await prisma.hardwareAsset.create({
    data: {
      modelId: mx240.id,
      serialNumber: 'JN1234567890',
      assetTag: 'ASSET-001',
      hostname: 'mx240-core-01.oslo',
      purchaseDate: new Date('2022-03-15'),
      purchasePrice: 45000,
      location: 'Oslo DC1, Rack A-12',
      rackPosition: 'U10-U12',
      status: 'ACTIVE',
      owner: 'Network Operations',
      observiumId: 101,
      lastSyncAt: new Date('2025-10-27T08:30:00Z'),
      notes: 'Core router for Oslo datacenter',
    },
  });

  const assetEX4300_1 = await prisma.hardwareAsset.create({
    data: {
      modelId: ex4300.id,
      serialNumber: 'JN0987654321',
      assetTag: 'ASSET-002',
      hostname: 'ex4300-access-02.oslo',
      purchaseDate: new Date('2023-06-20'),
      purchasePrice: 12000,
      location: 'Oslo DC1, Rack B-05',
      rackPosition: 'U8',
      status: 'ACTIVE',
      owner: 'Network Operations',
      observiumId: 102,
      lastSyncAt: new Date('2025-10-27T08:35:00Z'),
      notes: 'Access switch for server row B',
    },
  });

  const assetSRX345_1 = await prisma.hardwareAsset.create({
    data: {
      modelId: srx345.id,
      serialNumber: 'JN5555666777',
      assetTag: 'ASSET-003',
      hostname: 'srx345-fw-01.bergen',
      purchaseDate: new Date('2023-09-10'),
      purchasePrice: 8500,
      location: 'Bergen Office',
      status: 'ACTIVE',
      owner: 'Security Team',
      notes: 'Branch office firewall',
    },
  });

  const assetEX2300_1 = await prisma.hardwareAsset.create({
    data: {
      modelId: ex2300.id,
      serialNumber: 'JN8888999000',
      assetTag: 'ASSET-004',
      hostname: 'ex2300-access-01.trondheim',
      purchaseDate: new Date('2024-02-15'),
      purchasePrice: 3500,
      location: 'Trondheim Office',
      status: 'ACTIVE',
      owner: 'Network Operations',
    },
  });

  const assetMX480_1 = await prisma.hardwareAsset.create({
    data: {
      modelId: mx480.id,
      serialNumber: 'JN1111222333',
      assetTag: 'ASSET-005',
      hostname: 'mx480-core-02.oslo',
      purchaseDate: new Date('2021-11-20'),
      purchasePrice: 85000,
      location: 'Oslo DC2, Rack C-01',
      rackPosition: 'U1-U14',
      status: 'ACTIVE',
      owner: 'Network Operations',
      observiumId: 103,
      lastSyncAt: new Date('2025-10-27T08:32:00Z'),
      notes: 'Backup core router',
    },
  });

  const assetSpare = await prisma.hardwareAsset.create({
    data: {
      modelId: ex4300.id,
      serialNumber: 'JN9999888777',
      assetTag: 'ASSET-006',
      purchaseDate: new Date('2024-05-10'),
      purchasePrice: 12000,
      location: 'Oslo DC1, Spare Equipment Room',
      status: 'SPARE',
      owner: 'Network Operations',
      notes: 'Hot spare for access layer',
    },
  });

  const assetDefect = await prisma.hardwareAsset.create({
    data: {
      modelId: srx345.id,
      serialNumber: 'JN6666777888',
      assetTag: 'ASSET-007',
      hostname: 'srx345-fw-02.stavanger',
      purchaseDate: new Date('2023-04-15'),
      purchasePrice: 8500,
      location: 'Stavanger Office',
      status: 'DEFECT',
      owner: 'Security Team',
      notes: 'Power supply failure - RMA in progress',
    },
  });

  const assetNoContract = await prisma.hardwareAsset.create({
    data: {
      modelId: ex2300.id,
      serialNumber: 'JN3333444555',
      assetTag: 'ASSET-008',
      hostname: 'ex2300-temp-01.oslo',
      purchaseDate: new Date('2024-08-01'),
      purchasePrice: 3500,
      location: 'Oslo DC1, Rack D-10',
      status: 'ACTIVE',
      owner: 'Network Operations',
      notes: 'Recently purchased - no contract yet',
    },
  });

  console.log('✓ Created 8 hardware assets');

  // Create Asset-License Mappings
  console.log('Creating asset-license mappings...');
  await prisma.assetLicenseMapping.create({
    data: {
      assetId: assetMX240_1.id,
      licenseId: licenseAdvanced.id,
      assignedDate: new Date('2024-01-15'),
      status: 'active',
    },
  });

  await prisma.assetLicenseMapping.create({
    data: {
      assetId: assetMX480_1.id,
      licenseId: licenseAdvanced.id,
      assignedDate: new Date('2024-01-15'),
      status: 'active',
    },
  });

  await prisma.assetLicenseMapping.create({
    data: {
      assetId: assetEX4300_1.id,
      licenseId: licenseStandard.id,
      assignedDate: new Date('2024-03-01'),
      status: 'active',
    },
  });

  await prisma.assetLicenseMapping.create({
    data: {
      assetId: assetSRX345_1.id,
      licenseId: licenseSecurity.id,
      assignedDate: new Date('2024-02-10'),
      status: 'active',
    },
  });

  console.log('✓ Created 4 asset-license mappings');

  // Create Asset-Contract Mappings
  console.log('Creating asset-contract mappings...');
  await prisma.assetContractMapping.create({
    data: {
      assetId: assetMX240_1.id,
      contractId: contractPremium.id,
      coverageStart: new Date('2024-01-01'),
      coverageEnd: new Date('2025-12-31'),
      status: 'active',
    },
  });

  await prisma.assetContractMapping.create({
    data: {
      assetId: assetMX480_1.id,
      contractId: contractPremium.id,
      coverageStart: new Date('2024-01-01'),
      coverageEnd: new Date('2025-12-31'),
      status: 'active',
    },
  });

  await prisma.assetContractMapping.create({
    data: {
      assetId: assetEX4300_1.id,
      contractId: contractStandard.id,
      coverageStart: new Date('2024-03-01'),
      coverageEnd: new Date('2025-02-28'),
      status: 'active',
    },
  });

  await prisma.assetContractMapping.create({
    data: {
      assetId: assetEX2300_1.id,
      contractId: contractStandard.id,
      coverageStart: new Date('2024-03-01'),
      coverageEnd: new Date('2025-02-28'),
      status: 'active',
    },
  });

  await prisma.assetContractMapping.create({
    data: {
      assetId: assetSRX345_1.id,
      contractId: contractExpiring.id,
      coverageStart: new Date('2023-06-01'),
      coverageEnd: new Date('2025-11-15'),
      status: 'active',
    },
  });

  await prisma.assetContractMapping.create({
    data: {
      assetId: assetDefect.id,
      contractId: contractThirdParty.id,
      coverageStart: new Date('2024-01-15'),
      coverageEnd: new Date('2026-01-15'),
      status: 'active',
    },
  });

  console.log('✓ Created 6 asset-contract mappings');

  // Create Observium Sync Logs
  console.log('Creating Observium sync logs...');
  await prisma.observiumSyncLog.create({
    data: {
      assetId: assetMX240_1.id,
      observiumDeviceId: 101,
      syncType: 'update',
      syncStatus: 'success',
      changes: {
        hostname: 'mx240-core-01.oslo',
        lastSeen: '2025-10-27T08:30:00Z',
      },
      syncedAt: new Date('2025-10-27T08:30:00Z'),
    },
  });

  await prisma.observiumSyncLog.create({
    data: {
      assetId: assetEX4300_1.id,
      observiumDeviceId: 102,
      syncType: 'update',
      syncStatus: 'success',
      changes: {
        hostname: 'ex4300-access-02.oslo',
      },
      syncedAt: new Date('2025-10-27T08:35:00Z'),
    },
  });

  console.log('✓ Created 2 Observium sync logs');

  // Create Contract Alerts
  console.log('Creating contract alerts...');
  await prisma.contractAlert.create({
    data: {
      contractId: contractExpiring.id,
      alertType: 'CONTRACT_EXPIRY_90',
      alertDate: new Date('2025-08-17'), // 90 days before Nov 15
      status: 'SENT',
      sentAt: new Date('2025-08-17T08:00:00Z'),
    },
  });

  await prisma.contractAlert.create({
    data: {
      contractId: contractExpiring.id,
      alertType: 'CONTRACT_EXPIRY_60',
      alertDate: new Date('2025-09-16'), // 60 days before Nov 15
      status: 'PENDING',
    },
  });

  await prisma.contractAlert.create({
    data: {
      contractId: contractStandard.id,
      alertType: 'CONTRACT_EXPIRY_90',
      alertDate: new Date('2024-11-30'),
      status: 'SENT',
      sentAt: new Date('2024-11-30T08:00:00Z'),
    },
  });

  console.log('✓ Created 3 contract alerts');

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('   - 3 users (admin/editor/viewer)');
  console.log('   - 5 hardware models');
  console.log('   - 5 licenses');
  console.log('   - 4 maintenance contracts');
  console.log('   - 8 hardware assets');
  console.log('   - 4 asset-license mappings');
  console.log('   - 6 asset-contract mappings');
  console.log('   - 2 Observium sync logs');
  console.log('   - 3 contract alerts');
  console.log('\n🔑 Test credentials:');
  console.log('   Admin:  admin@example.com / admin123');
  console.log('   Editor: editor@example.com / editor123');
  console.log('   Viewer: viewer@example.com / viewer123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
