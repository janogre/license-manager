const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'Vedlikeholdskontrakter hardware .xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log('Total rows:', data.length);

  // Check for duplicate serial numbers
  const serialNumbers = data.map(row => String(row['Serienummer'] || '').trim()).filter(Boolean);
  const uniqueSerials = new Set(serialNumbers);

  console.log('Total serial numbers:', serialNumbers.length);
  console.log('Unique serial numbers:', uniqueSerials.size);
  console.log('Duplicates found:', serialNumbers.length - uniqueSerials.size);

  if (serialNumbers.length !== uniqueSerials.size) {
    // Find and show duplicates
    const counts = {};
    serialNumbers.forEach(sn => {
      counts[sn] = (counts[sn] || 0) + 1;
    });

    console.log('\nDuplicate serial numbers:');
    Object.entries(counts)
      .filter(([sn, count]) => count > 1)
      .forEach(([sn, count]) => {
        console.log(`  ${sn}: appears ${count} times`);
      });
  }
} catch (error) {
  console.error('Error:', error.message);
}
