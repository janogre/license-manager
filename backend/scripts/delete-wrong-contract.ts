/**
 * Delete the incorrectly created contract PAR-SUP-ACX-100GAP
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteWrongContract() {
  const contractNumber = 'PAR-SUP-ACX-100GAP';

  console.log(`Deleting contract: ${contractNumber}\n`);

  try {
    // Find the contract
    const contract = await prisma.maintenanceContract.findUnique({
      where: {
        contractNumber,
      },
      include: {
        assets: true,
        licenses: true,
      },
    });

    if (!contract) {
      console.log('Contract not found');
      return;
    }

    console.log('Contract found:');
    console.log(`  ID: ${contract.id}`);
    console.log(`  Category: ${contract.category}`);
    console.log(`  Assets: ${contract.assets.length}`);
    console.log(`  Licenses: ${contract.licenses.length}`);

    // Delete the contract
    await prisma.maintenanceContract.delete({
      where: {
        id: contract.id,
      },
    });

    console.log('\nContract deleted successfully!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteWrongContract();
