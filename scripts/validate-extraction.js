const fs = require('fs');
const path = require('path');

// Things that should NEVER appear in translations
const FORBIDDEN_PATTERNS = [
  /https?:\/\//,           // URLs
  /www\./,                 // Web addresses
  /\w+@\w+\.\w+/,         // Emails
  /\w+\[at\]\w+\[dot\]/,  // Obfuscated emails
  /\/api\//,              // API paths
];

function validate() {
  const translationFile = path.join(process.cwd(), 'src/translations/extracted.json');
  const data = JSON.parse(fs.readFileSync(translationFile, 'utf8'));
  
  let issues = 0;
  
  for (const [key, value] of Object.entries(data.translations)) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(value)) {
        console.log(`⚠️  ${key}: Contains forbidden pattern: ${value.substring(0, 50)}...`);
        issues++;
      }
    }
  }
  
  // Check required keys exist
  const required = ['share.message', 'form.standardizedNoteLabels.will-order'];
  for (const reqKey of required) {
    if (!data.translations[reqKey]) {
      console.log(`❌ Missing required key: ${reqKey}`);
      issues++;
    }
  }
  
  console.log(issues === 0 ? '✅ All validations passed!' : `❌ Found ${issues} issues`);
}

validate();