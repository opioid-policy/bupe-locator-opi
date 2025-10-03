const fs = require('fs');
const path = require('path');
const {Translate} = require('@google-cloud/translate').v2;

//
//
//
// Put your API key here
const API_KEY = 'API_KEY_HERE';
//
//
//
//

const translate = new Translate({
  key: API_KEY
});

async function translateText(text, targetLang) {
  try {
    const [translation] = await translate.translate(text, targetLang);
    return translation;
  } catch (error) {
    console.error(`Failed: ${error.message}`);
    return text;
  }
}

async function translateFile(langCode, langName) {
  console.log(`\nTranslating to ${langName}...`);
  
  const enPath = path.join(__dirname, '../src/translations/en.json');
  const enTranslations = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  
  const translations = {};
  const entries = Object.entries(enTranslations);
  
  for (let i = 0; i < entries.length; i++) {
    const [key, text] = entries[i];
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Progress: ${i + 1}/${entries.length}`);
    }
    
    translations[key] = await translateText(text, langCode);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const outputPath = path.join(__dirname, `../src/translations/${langCode}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2));
  console.log(`  ✓ Saved: ${langCode}.json`);
}

async function main() {
  console.log('Google Cloud Translation\n');
  await translateFile('so', 'Somali');
  await translateFile('hmn', 'Hmong');
  console.log('\nDone! Files ready to deploy.');
}

main().catch(console.error);