// find-ids.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// --- Configuration ---
const INPUT_FILE = 'input.tsv'; // Changed to .tsv
const OUTPUT_FILE = 'output.csv';
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
// --- End Configuration ---

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function processFile() {
  console.log('Starting advanced data processor...');

  if (!MAPBOX_TOKEN) {
    console.error('ERROR: Mapbox token not found. Make sure it is in your .env.local file.');
    return;
  }

  // Define the final CSV headers
  const csvHeaders = "pharmacy_id,pharmacy_name,street_address,city,state,zip_code,report_type,formulation,notes\n";
  let csvContent = csvHeaders;

  // Read the input .tsv file
  const inputData = fs.readFileSync(INPUT_FILE, 'utf8').split('\n').filter(line => line.trim() !== '');
  console.log(`Found ${inputData.length} records to process.`);

  for (const line of inputData) {
    // Split the line by the Tab character
    const [address, report_type = '', formulation = '', notes = ''] = line.split('\t');

    if (!address) continue;

    console.log(`Processing: ${address}`);
    const encodedAddress = encodeURIComponent(address);
    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const id = feature.id;
        const name = feature.text || '';
        
        const street = feature.properties.address || '';
        const postcode = feature.context?.find(c => c.id.startsWith('postcode'))?.text || '';
        const city = feature.context?.find(c => c.id.startsWith('place'))?.text || '';
        const state = feature.context?.find(c => c.id.startsWith('region'))?.short_code?.replace('US-', '') || '';

        // Combine Mapbox data with original report data into a single CSV row
        csvContent += `"${id}","${name}","${street}","${city}","${state}","${postcode}","${report_type}","${formulation}","${notes.replace(/"/g, '""')}"\n`;
      } else {
        console.log(` -> No results found for: ${address}`);
        csvContent += `"""""","No result for: ${address}","${report_type}","${formulation}","${notes.replace(/"/g, '""')}"\n`;
      }
    } catch (error) {
      console.error(` -> An error occurred for address: ${address}`, error);
    }
    
    await sleep(200); 
  }

  fs.writeFileSync(OUTPUT_FILE, csvContent, 'utf8');
  console.log(`\nProcessing complete! Results saved to ${OUTPUT_FILE}`);
}

processFile();