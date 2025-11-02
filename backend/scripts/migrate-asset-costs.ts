/**
 * Migration script to populate assetCost field in AssetContractMapping
 * For existing contracts, we calculate per-asset cost by dividing total contract cost by number of assets
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateAssetCosts() {
  console.log('Starting assetCost migration...');

  try {
    // Get all contracts with their assets
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

    let updatedMappings = 0;
    let skippedMappings = 0;

    for (const contract of contracts) {
      const activeAssets = contract.assets.length;

      if (activeAssets === 0) {
        console.log(`Contract ${contract.contractNumber} has no active assets, skipping`);
        continue;
      }

      if (!contract.annualCost) {
        console.log(`Contract ${contract.contractNumber} has no annual cost, skipping`);
        skippedMappings += activeAssets;
        continue;
      }

      // Calculate per-asset cost
      const totalCost = Number(contract.annualCost);
      const perAssetCost = Math.round(totalCost / activeAssets);

      console.log(`Contract ${contract.contractNumber}: ${totalCost} kr / ${activeAssets} assets = ${perAssetCost} kr per asset`);

      // Update each asset mapping
      for (const mapping of contract.assets) {
        // Only update if assetCost is null
        if (mapping.assetCost === null) {
          await prisma.assetContractMapping.update({
            where: { id: mapping.id },
            data: { assetCost: perAssetCost },
          });
          updatedMappings++;
        }
      }
    }

    console.log('\nMigration completed!');
    console.log(`- Updated mappings: ${updatedMappings}`);
    console.log(`- Skipped mappings: ${skippedMappings}`);
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateAssetCosts()
  .then(() => {
    console.log('Migration finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
