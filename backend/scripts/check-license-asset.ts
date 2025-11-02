/**
 * Check if a license asset exists
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLicenseAsset() {
  const serialNumber = 'RTU00036987466';

  console.log(`Checking for asset with serial number: ${serialNumber}`);

  try {
    // Check hardware assets
    const hardwareAsset = await prisma.hardwareAsset.findFirst({
      where: {
        serialNumber: {
          equals: serialNumber,
          mode: 'insensitive',
        },
      },
    });

    console.log('Hardware asset:', hardwareAsset ? 'Found' : 'Not found');
    if (hardwareAsset) {
      console.log('  ID:', hardwareAsset.id);
      console.log('  Serial:', hardwareAsset.serialNumber);
    }

    // Check licenses
    const license = await prisma.license.findFirst({
      where: {
        licenseKey: {
          equals: serialNumber,
          mode: 'insensitive',
        },
      },
    });

    console.log('License:', license ? 'Found' : 'Not found');
    if (license) {
      console.log('  ID:', license.id);
      console.log('  License Key:', license.licenseKey);
      console.log('  Software Product:', license.softwareProduct);
      console.log('  Type:', license.licenseType);
    }

    // Check all licenses
    const allLicenses = await prisma.license.findMany({
      take: 5,
    });

    console.log(`\nTotal licenses in database: ${allLicenses.length}`);
    allLicenses.forEach(lic => {
      console.log(`- ${lic.softwareProduct} (${lic.licenseKey || 'no key'})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkLicenseAsset();
