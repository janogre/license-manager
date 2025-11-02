/**
 * Check licenses for PAR-SUP-EACX100GAP contract
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkContractLicenses() {
  const contractNumber = 'PAR-SUP-EACX100GAP';

  console.log(`Checking contract: ${contractNumber}\n`);

  try {
    const contract = await prisma.maintenanceContract.findUnique({
      where: { contractNumber },
      include: {
        licenses: {
          include: {
            license: true,
          },
        },
        assets: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!contract) {
      console.log('Contract not found');
      return;
    }

    console.log('Contract Details:');
    console.log(`  Number: ${contract.contractNumber}`);
    console.log(`  Category: ${contract.category}`);
    console.log(`  Type: ${contract.contractType}`);
    console.log(`  Annual Cost: ${contract.annualCost} kr`);
    console.log(`  Start Date: ${contract.startDate.toISOString().split('T')[0]}`);
    console.log(`  End Date: ${contract.endDate.toISOString().split('T')[0]}`);
    console.log('');

    console.log(`Hardware Assets: ${contract.assets.length}`);
    if (contract.assets.length > 0) {
      contract.assets.forEach((mapping, index) => {
        console.log(`  ${index + 1}. ${mapping.asset.serialNumber}`);
        console.log(`     Cost: ${mapping.assetCost || 'N/A'} kr/year`);
      });
    }
    console.log('');

    console.log(`Licenses: ${contract.licenses.length}`);
    if (contract.licenses.length > 0) {
      console.log('License details:');
      contract.licenses.forEach((mapping, index) => {
        console.log(`  ${index + 1}. ${mapping.license.softwareProduct}`);
        console.log(`     License Key: ${mapping.license.licenseKey}`);
        console.log(`     Cost: ${mapping.licenseCost} kr/year`);
        console.log(`     Coverage: ${mapping.coverageStart.toISOString().split('T')[0]} to ${mapping.coverageEnd.toISOString().split('T')[0]}`);
        console.log(`     Status: ${mapping.status}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContractLicenses();
