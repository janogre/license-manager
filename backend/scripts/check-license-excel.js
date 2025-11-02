const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'Vedlikeholdskontrakter lisenser.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log('Total rows:', data.length);
  console.log('\nFirst 3 rows:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));

  console.log('\nColumn names:');
  if (data.length > 0) {
    console.log(Object.keys(data[0]));
  }

  // Check for duplicates
  const licenseNames = data.map(row => String(row['Utstyr/lisens'] || '').trim()).filter(Boolean);
  const uniqueLicenses = new Set(licenseNames);
  console.log('\nTotal licenses:', licenseNames.length);
  console.log('Unique license names:', uniqueLicenses.size);
  console.log('Duplicates found:', licenseNames.length - uniqueLicenses.size);
} catch (error) {
  console.error('Error:', error.message);
}
