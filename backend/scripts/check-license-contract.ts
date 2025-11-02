/**
 * Check license contract for RTU00036987466
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLicenseContract() {
  const serialNumber = 'RTU00036987466';

  console.log(`Checking license and contract for serial: ${serialNumber}\n`);

  try {
    // Find the license
    const license = await prisma.license.findFirst({
      where: {
        licenseKey: {
          equals: serialNumber,
          mode: 'insensitive',
        },
      },
      include: {
        contracts: {
          include: {
            contract: true,
          },
        },
      },
    });

    if (!license) {
      console.log('License NOT found');
      return;
    }

    console.log('License found:');
    console.log(`  ID: ${license.id}`);
    console.log(`  License Key: ${license.licenseKey}`);
    console.log(`  Software Product: ${license.softwareProduct}`);
    console.log(`  Type: ${license.licenseType}`);
    console.log(`  Contracts: ${license.contracts.length}`);

    if (license.contracts.length > 0) {
      console.log('\nLinked contracts:');
      for (const mapping of license.contracts) {
        console.log(`  - ${mapping.contract.contractNumber}`);
        console.log(`    Category: ${mapping.contract.category}`);
        console.log(`    Type: ${mapping.contract.contractType}`);
        console.log(`    License Cost: ${mapping.licenseCost}`);
        console.log(`    Coverage: ${mapping.coverageStart.toISOString().split('T')[0]} to ${mapping.coverageEnd.toISOString().split('T')[0]}`);
        console.log(`    Status: ${mapping.status}`);
      }
    }

    // Also check for contracts with this contract number
    console.log('\n--- Checking for contracts with PAR-SUP prefix ---');
    const contracts = await prisma.maintenanceContract.findMany({
      where: {
        contractNumber: {
          contains: 'PAR-SUP',
        },
      },
      include: {
        licenses: {
          include: {
            license: true,
          },
        },
      },
    });

    for (const contract of contracts) {
      console.log(`\nContract: ${contract.contractNumber}`);
      console.log(`  Category: ${contract.category}`);
      console.log(`  Type: ${contract.contractType}`);
      console.log(`  Licenses: ${contract.licenses.length}`);
      if (contract.licenses.length > 0) {
        contract.licenses.forEach((mapping) => {
          console.log(`    - ${mapping.license.licenseKey}`);
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLicenseContract();
