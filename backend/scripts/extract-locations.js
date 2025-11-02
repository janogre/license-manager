const XLSX = require('xlsx');
const path = require('path');

const hardwarePath = path.join(__dirname, '..', 'data', 'Vedlikeholdskontrakter hardware .xlsx');

try {
  const workbook = XLSX.readFile(hardwarePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet);

  // Extract unique locations
  const locations = data.map(row => String(row['Lokasjon'] || '').trim()).filter(Boolean);
  const uniqueLocations = [...new Set(locations)].sort();

  console.log(`Total locations in data: ${locations.length}`);
  console.log(`Unique locations: ${uniqueLocations.length}\n`);
  console.log('Unique location names:');
  uniqueLocations.forEach((loc, i) => {
    console.log(`  ${i + 1}. ${loc}`);
  });

} catch (error) {
  console.error('Error:', error.message);
}
