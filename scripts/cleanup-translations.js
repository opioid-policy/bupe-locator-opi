// scripts/cleanup-translations.js
const fs = require('fs');
const path = require('path');

const languages = ['zh', 'tl', 'vi', 'ar', 'fr', 'ko', 'pt', 'he', 'de', 'it', 'pl', 'scn', 'ru', 'uk'];

languages.forEach(lang => {
  const filePath = path.join(process.cwd(), 'src/translations', `${lang}.json`);
  
  if (fs.existsSync(filePath)) {
    let translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Clean up common AI artifacts
    Object.keys(translations).forEach(key => {
      translations[key] = translations[key]
        .replace(/^(Translation:|Translate to \w+:)\s*/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();
    });
    
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2));
    console.log(`✓ Cleaned ${lang}.json`);
  }
});