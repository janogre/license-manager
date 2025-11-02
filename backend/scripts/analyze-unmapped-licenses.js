const XLSX = require('xlsx');
const path = require('path');

const licensePath = path.join(__dirname, '..', 'data', 'Vedlikeholdskontrakter lisenser.xlsx');
const hardwarePath = path.join(__dirname, '..', 'data', 'Vedlikeholdskontrakter hardware .xlsx');

try {
  // Read license file
  const licenseWorkbook = XLSX.readFile(licensePath);
  const licenseSheet = licenseWorkbook.Sheets[licenseWorkbook.SheetNames[0]];
  const licenses = XLSX.utils.sheet_to_json(licenseSheet);

  // Read hardware file
  const hardwareWorkbook = XLSX.readFile(hardwarePath);
  const hardwareSheet = hardwareWorkbook.Sheets[hardwareWorkbook.SheetNames[0]];
  const hardware = XLSX.utils.sheet_to_json(hardwareSheet);

  // Get all hardware serial numbers
  const hardwareSerials = new Set(
    hardware.map(h => String(h['Serienummer'] || '').trim()).filter(Boolean)
  );

  console.log(`Total licenses: ${licenses.length}`);
  console.log(`Total hardware assets: ${hardware.length}`);
  console.log(`Unique hardware serials: ${hardwareSerials.size}\n`);

  // Analyze licenses
  let withAssetSerial = 0;
  let withoutAssetSerial = 0;
  let matchingAsset = 0;
  let notMatchingAsset = 0;
  const unmatchedSerials = [];

  licenses.forEach(lic => {
    const assetSerial = String(lic['Lisensen tilhører utstyr'] || '').trim();

    if (assetSerial) {
      withAssetSerial++;
      if (hardwareSerials.has(assetSerial)) {
        matchingAsset++;
      } else {
        notMatchingAsset++;
        unmatchedSerials.push(assetSerial);
      }
    } else {
      withoutAssetSerial++;
    }
  });

  console.log('License-to-Hardware Mapping Analysis:');
  console.log(`  Licenses with asset serial number: ${withAssetSerial}`);
  console.log(`  Licenses without asset serial number: ${withoutAssetSerial}`);
  console.log(`  Licenses with matching hardware asset: ${matchingAsset}`);
  console.log(`  Licenses with non-matching asset serial: ${notMatchingAsset}\n`);

  if (unmatchedSerials.length > 0) {
    console.log('Unmatched asset serial numbers (first 10):');
    unmatchedSerials.slice(0, 10).forEach(serial => {
      console.log(`  - ${serial}`);
    });
  }

} catch (error) {
  console.error('Error:', error.message);
}
