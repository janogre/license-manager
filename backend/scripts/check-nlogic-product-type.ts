/**
 * Check product type for RTU00036987466 in nLogic file
 */

import XLSX from 'xlsx';
import path from 'path';

const nlogicFilePath = path.join(__dirname, '../data/nLogic 2025.xlsx');

console.log(`Reading file: ${nlogicFilePath}\n`);

const workbook = XLSX.readFile(nlogicFilePath);
const sheetName = 'nLogic 2025';
const worksheet = workbook.Sheets[sheetName];
const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

const serialNumber = 'RTU00036987466';

const asset = rawData.find((row) =>
  String(row.Serienummer || '').trim().toUpperCase() === serialNumber.toUpperCase()
);

if (asset) {
  console.log('Asset found in nLogic file:');
  console.log('  Serial Number:', asset.Serienummer);
  console.log('  Model:', asset.Modell);
  console.log('  Product Type:', asset.Produkttype);
  console.log('  Contract Number (Varenummer):', asset.Varenummer);
  console.log('  Part Number:', asset.__EMPTY);
  console.log('  Location:', asset.Lokasjon);
  console.log('  RENEW:', asset.RENEW);
  console.log('  Renewal Price:', asset[' NOK RNW PRICE ']);
  console.log('  Start Date:', asset['Start Date']);
  console.log('  End Date (RNW to):', asset['RNW to']);
  console.log('\nProduct type check:');
  const productType = String(asset.Produkttype || '').toLowerCase();
  console.log(`  productType.toLowerCase(): "${productType}"`);
  console.log(`  includes('lisens'): ${productType.includes('lisens')}`);
  console.log(`  includes('license'): ${productType.includes('license')}`);
} else {
  console.log('Asset NOT found in nLogic file');
}
