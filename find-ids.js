// find-ids.js - Nominatim version (no Mapbox dependency)
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const INPUT_FILE = 'input.tsv';
const OUTPUT_FILE = 'output.csv';
// --- End Configuration ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate a manual ID for bulk uploads
function generateManualId() {
  return `manual_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

async function geocodeWithNominatim(address) {
  const encodedAddress = encodeURIComponent(address);
  const endpoint = `https://nominatim.openstreetmap.org/search?` +
    `q=${encodedAddress}&` +
    `format=json&` +
    `addressdetails=1&` +
    `countrycodes=us&` +
    `limit=1`;
  
  try {
    const response = await fetch(endpoint, {
      headers: {
        'User-Agent': 'BupeLocator-BulkUpload/1.0 (https://bupe.opioidpolicy.org; contact@opioidpolicy.org)',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data[0] || null;
  } catch (error) {
    console.error(`Geocoding error for "${address}":`, error.message);
    return null;
  }
}

async function processFile() {
  console.log('Starting Nominatim-based data processor...');
  console.log('This tool uses OpenStreetMap\'s Nominatim service.');
  console.log('Please be respectful of their free service - we\'ll wait 1 second between requests.\n');

  // Define the final CSV headers
  const csvHeaders = "pharmacy_id,pharmacy_name,street_address,city,state,zip_code,report_type,formulation,notes\n";
  let csvContent = csvHeaders;

  // Check if input file exists
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`ERROR: Input file "${INPUT_FILE}" not found.`);
    console.log('Please create an input.tsv file with tab-separated values:');
    console.log('Format: address[TAB]report_type[TAB]formulation[TAB]notes');
    return;
  }

  // Read the input .tsv file
  const inputData = fs.readFileSync(INPUT_FILE, 'utf8')
    .split('\n')
    .filter(line => line.trim() !== '');
  
  console.log(`Found ${inputData.length} records to process.\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < inputData.length; i++) {
    const line = inputData[i];
    // Split the line by the Tab character
    const [address, report_type = '', formulation = '', notes = ''] = line.split('\t');

    if (!address) continue;

    console.log(`[${i + 1}/${inputData.length}] Processing: ${address}`);
    
    const result = await geocodeWithNominatim(address);
    
    if (result) {
      // Extract pharmacy info from Nominatim result
      const osmId = `osm_${result.osm_type}_${result.osm_id}`;
      
      // Try to extract pharmacy name from the result
      let name = result.name || '';
      if (!name && result.address) {
        // Try common pharmacy indicators
        name = result.address.shop || 
               result.address.amenity || 
               result.address.building ||
               address.split(',')[0]; // Use first part of address as fallback
      }
      
      const street = result.address?.road || '';
      const houseNumber = result.address?.house_number || '';
      const fullStreet = houseNumber ? `${houseNumber} ${street}`.trim() : street;
      const city = result.address?.city || result.address?.town || result.address?.village || '';
      const state = result.address?.state || '';
      const postcode = result.address?.postcode || '';

      // Combine into CSV row
      csvContent += `"${osmId}","${name}","${fullStreet}","${city}","${state}","${postcode}","${report_type}","${formulation}","${notes.replace(/"/g, '""')}"\n`;
      console.log(` ✓ Found: ${name || 'Pharmacy'} in ${city}, ${state}`);
      successCount++;
    } else {
      // Generate manual ID for failed geocoding
      const manualId = generateManualId();
      console.log(` ✗ Not found - will need manual review`);
      csvContent += `"${manualId}","NEEDS MANUAL REVIEW: ${address}","","","","","${report_type}","${formulation}","${notes.replace(/"/g, '""')}"\n`;
      failCount++;
    }
    
    // Be respectful to Nominatim - wait 1 second between requests
    await sleep(1000);
  }

  // Write output file
  fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');
  
  console.log('\n' + '='.repeat(50));
  console.log('Processing complete!');
  console.log(`✓ Successfully geocoded: ${successCount} addresses`);
  console.log(`✗ Need manual review: ${failCount} addresses`);
  console.log(`Results saved to: ${OUTPUT_FILE}`);
  console.log('='.repeat(50));
  
  if (failCount > 0) {
    console.log('\nNote: Some addresses couldn\'t be geocoded automatically.');
    console.log('These are marked as "NEEDS MANUAL REVIEW" in the output file.');
    console.log('You can manually find these pharmacies and update their information.');
  }
}

// Run the processor
processFile().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});