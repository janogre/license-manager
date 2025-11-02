/**
 * Test if Prisma Client has licenseContractMapping
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('Checking Prisma Client models...\n');

// @ts-ignore
console.log('Has licenseContractMapping:', typeof prisma.licenseContractMapping !== 'undefined');
// @ts-ignore
console.log('Has assetContractMapping:', typeof prisma.assetContractMapping !== 'undefined');
// @ts-ignore
console.log('Has license:', typeof prisma.license !== 'undefined');
// @ts-ignore
console.log('Has maintenanceContract:', typeof prisma.maintenanceContract !== 'undefined');

// Try to query
(async () => {
  try {
    // @ts-ignore
    const count = await prisma.licenseContractMapping.count();
    console.log(`\nlicenseContractMapping count: ${count}`);
  } catch (error: any) {
    console.log(`\nError accessing licenseContractMapping: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
})();
