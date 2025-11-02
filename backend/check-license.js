const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLicense() {
  const licenses = await prisma.license.findMany({
    where: {
      licenseKey: {
        contains: 'RTU00044570833'
      }
    }
  });

  console.log('Found licenses:', JSON.stringify(licenses, null, 2));

  // Also check without filter
  const allLicenses = await prisma.license.findMany({
    take: 5
  });

  console.log('\nFirst 5 licenses:', JSON.stringify(allLicenses, null, 2));

  await prisma.$disconnect();
}

checkLicense();
