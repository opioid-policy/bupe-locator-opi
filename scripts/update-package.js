const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Add translation scripts
packageJson.scripts = {
  ...packageJson.scripts,
  "extract-text": "node scripts/extract-text.js",
  "ai-translate": "node scripts/ai-translate.js", 
  "translate": "npm run extract-text && npm run ai-translate",
  "translate-dev": "npm run extract-text && npm run ai-translate && npm run dev"
};

// Add Ollama dependency
packageJson.devDependencies = {
  ...packageJson.devDependencies,
  "ollama": "^0.5.0"
};

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
console.log('✅ Package.json updated with translation scripts and dependencies');