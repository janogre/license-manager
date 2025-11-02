/**
 * Script to fix contract total costs
 * Recalculates contract annualCost as sum of all asset costs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixContractTotalCosts() {
  console.log('Starting contract total cost fix...');

  try {
    // Get all contracts
    const contracts = await prisma.maintenanceContract.findMany({
      include: {
        assets: {
          where: {
            status: 'active',
          },
        },
      },
    });

    console.log(`Found ${contracts.length} contracts to process`);

    let updatedContracts = 0;

    for (const contract of contracts) {
      const activeAssets = contract.assets.length;

      if (activeAssets === 0) {
        console.log(`Contract ${contract.contractNumber} has no active assets, skipping`);
        continue;
      }

      // Calculate total cost by summing all asset costs
      let totalCost = 0;
      for (const mapping of contract.assets) {
        if (mapping.assetCost) {
          totalCost += Number(mapping.assetCost);
        }
      }

      // Round to nearest whole number
      totalCost = Math.round(totalCost);

      // Check if update is needed
      const currentCost = Number(contract.annualCost || 0);
      if (Math.abs(currentCost - totalCost) > 0.01) {
        console.log(`Contract ${contract.contractNumber}: Updating cost from ${currentCost} kr to ${totalCost} kr (${activeAssets} assets)`);

        await prisma.maintenanceContract.update({
          where: { id: contract.id },
          data: { annualCost: totalCost },
        });

        updatedContracts++;
      } else {
        console.log(`Contract ${contract.contractNumber}: Cost already correct (${totalCost} kr, ${activeAssets} assets)`);
      }
    }

    console.log('\nFix completed!');
    console.log(`- Updated contracts: ${updatedContracts}`);
    console.log(`- Unchanged contracts: ${contracts.length - updatedContracts}`);
  } catch (error) {
    console.error('Fix failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixContractTotalCosts()
  .then(() => {
    console.log('Fix finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fix failed:', error);
    process.exit(1);
  });
