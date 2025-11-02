/**
 * Script to update contracts from THIRD_PARTY to NLOGIC type
 * Only updates contracts that were created from nLogic data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateContractsToNLogic() {
  console.log('Updating contracts to NLOGIC type...');

  try {
    // Update all THIRD_PARTY contracts to NLOGIC
    // These are contracts that were created from nLogic validation
    const result = await prisma.maintenanceContract.updateMany({
      where: {
        contractType: 'THIRD_PARTY',
      },
      data: {
        contractType: 'NLOGIC',
      },
    });

    console.log(`Updated ${result.count} contracts from THIRD_PARTY to NLOGIC`);
  } catch (error) {
    console.error('Update failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateContractsToNLogic()
  .then(() => {
    console.log('Update finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  });
