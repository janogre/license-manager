const XLSX = require('xlsx');
const path = require('path');

// Read the License Excel file
const filePath = path.join('C:', 'Users', 'jang', 'OneDrive - Nordmøre Energiverk AS', 'Prosjekter', 'NEAS Lisens-manager', 'Vedlikeholdskontrakter lisenser.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log('Total rows:', data.length);
  console.log('\nFirst 3 rows:');
  console.log(JSON.stringify(data.slice(0, 3), null, 2));

  console.log('\nColumn names:');
  if (data.length > 0) {
    console.log(Object.keys(data[0]));
  }
} catch (error) {
  console.error('Error reading Excel file:', error.message);
}
