/**
 * Check recently created contracts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecentContracts() {
  console.log('Checking recently created contracts...\n');

  try {
    // Get recent contracts
    const contracts = await prisma.maintenanceContract.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        assets: {
          include: {
            asset: true,
          },
        },
        licenses: {
          include: {
            license: true,
          },
        },
      },
    });

    for (const contract of contracts) {
      console.log(`Contract: ${contract.contractNumber}`);
      console.log(`  Category: ${contract.category}`);
      console.log(`  Type: ${contract.contractType}`);
      console.log(`  Cost: ${contract.annualCost}`);
      console.log(`  Start: ${contract.startDate.toISOString().split('T')[0]}`);
      console.log(`  End: ${contract.endDate.toISOString().split('T')[0]}`);
      console.log(`  Hardware Assets: ${contract.assets.length}`);
      if (contract.assets.length > 0) {
        contract.assets.forEach((mapping) => {
          console.log(`    - ${mapping.asset.serialNumber} (${mapping.assetCost || 'no cost'})`);
        });
      }
      console.log(`  Licenses: ${contract.licenses.length}`);
      if (contract.licenses.length > 0) {
        contract.licenses.forEach((mapping) => {
          console.log(`    - ${mapping.license.licenseKey} (${mapping.licenseCost || 'no cost'})`);
        });
      }
      console.log('');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentContracts();
