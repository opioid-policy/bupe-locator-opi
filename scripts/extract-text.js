// scripts/extract-text-enhanced.js - Captures ALL translatable content
const fs = require('fs');
const path = require('path');

// Enhanced extraction patterns for comprehensive content
const patterns = [
  // JSX text content: >{text}<
  />{([^<>{}]+)}</g,
  
  // Form attributes
  /placeholder="([^"]+)"/g,
  /aria-label="([^"]+)"/g,
  /title="([^"]+)"/g,
  /alt="([^"]+)"/g,
  
  // Page content patterns (NEW)
  // Paragraph content: <p>long text content</p>
  /<p[^>]*>\s*([^<]+(?:\s*<[^>]*>[^<]*<\/[^>]*>\s*[^<]*)*)\s*<\/p>/g,
  
  // Header content: <h1-6>Header Text</h1-6>
  /<h[1-6][^>]*>\s*([^<]+)\s*<\/h[1-6]>/g,
  
  // List items: <li>content with possible nested tags</li>
  /<li[^>]*>\s*([^<]+(?:\s*<[^>]*>[^<]*<\/[^>]*>\s*[^<]*)*)\s*<\/li>/g,
  
  // Strong/bold content: <strong>important text</strong>
  /<strong[^>]*>\s*([^<]+)\s*<\/strong>/g,
  
  // Link text: <Link>text</Link> or <a>text</a>
  /<(?:Link|a)[^>]*>\s*([^<]+)\s*<\/(?:Link|a)>/g,
  
  // Button content: <button>text</button>
  /<button[^>]*>\s*([^<{}]+)\s*<\/button>/g,
  
  // Label content: <label>text</label>
  /<label[^>]*>\s*([^<{}]+)\s*<\/label>/g
];

const doNotTranslate = [
  // Domain names and URLs
  'wormhole.app',
  'opioidpolicy.org',
  'bupe.opioidpolicy.org',
  'news.opioidpolicy.org',
  'cryptpad.fr',
  'organicmaps.app',
  'privacyguides.org',
  
  // Service/Platform names
  'airtable',
  'vercel',
  'github',
  'codeberg',
  'turnstile',
  'cloudflare',
  'stripe',
  'fillout',
  'ghost',
  'ollama',
  'qwen',
  'openstreetmap',
  
  // Medical terms (keep consistent)
  'bupe',
  'buprenorphine',
  'methadone',
  'naltrexone',
  'suboxone',
  'zubsolv',
  
  // File extensions and technical terms
  '.tsv',
  '.csv',
  '.json',
  '.xlsx',
  'api',
  'zip code',
  'ip address',
  
  // Brand names
  'google maps',
  'apple maps',
  'instagram',
  'facebook',
  'microsoft',
  'amazon'
];
// Expanded ignore patterns
const ignorePatterns = [
  /^[A-Z_][A-Z0-9_]*$/,        // ALL_CAPS constants
  /^\d+$/,                     // Pure numbers
  /^[a-z][a-zA-Z]*$/,          // camelCase variables
  /^\$\{.*\}$/,                // Template literals ${...}
  /^[%$#@].*$/,                // Special character prefixes
  /^(div|span|button|input|form|label|p|h[1-6]|ul|ol|li|strong|em|a)$/i, // HTML elements
  /^(className|onClick|onChange|onSubmit|href|src|style)$/i, // React/HTML props
  /^(true|false|null|undefined)$/i, // JS literals
  /^(https?:\/\/|mailto:|tel:)/i,   // URLs, email, phone protocols
  /^[\d\s\-\(\)\+\.]+$/,           // Phone numbers, formatted numbers
  /^[^\w\s]$/,                     // Single special characters
  /^\s*$/,                         // Whitespace only
  /^(amp|quot|lt|gt|nbsp);?$/,     // HTML entities
  /^[\d\/\-\s:]+$/,                // Dates and times
  /^[A-Z]{2,}$/,                   // Abbreviations like USA, API, CSS
  /^\w{1,3}$/,                     // Very short words (likely abbreviations)
];

// Content that should definitely be included (override ignore patterns)
const forceIncludePatterns = [
  /bupe/i,
  /pharmacy/i,
  /prescription/i,
  /medicine/i,
  /report/i,
  /privacy/i,
  /about/i,
  /dashboard/i,
  /find/i,
  /submit/i,
  /loading/i,
  /error/i,
  /success/i,
  /\.{3}$/,  // Text ending with ...
];

function shouldIgnoreText(text) {
  if (!text || typeof text !== 'string') return true;
  
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 2) return true;
  
  // Check do-not-translate list FIRST (case-insensitive)
  if (doNotTranslate.some(term => 
    trimmed.toLowerCase().includes(term.toLowerCase())
  )) {
    return true;
  }
  
  // Force include important terms (override other rules)
  if (forceIncludePatterns.some(pattern => pattern.test(trimmed))) {
    return false;
  }
  
  // Apply standard ignore patterns
  return ignorePatterns.some(pattern => pattern.test(trimmed));
}

function cleanExtractedText(text) {
  if (!text) return '';
  
  return text
    .trim()
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    // Remove HTML entities
    .replace(/&[a-z]+;/gi, ' ')
    // Remove React interpolation markers
    .replace(/\{[^}]*\}/g, '')
    // Clean up quotes
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Remove leading/trailing punctuation that shouldn't be there
    .replace(/^[^\w\s]+|[^\w\s\.\!\?]+$/g, '')
    .trim();
}

function extractFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const extractedStrings = new Set();
    
    console.log(`📄 Scanning: ${path.relative(process.cwd(), filePath)}`);
    
    patterns.forEach((pattern, index) => {
      const matches = [...content.matchAll(pattern)];
      
      matches.forEach(match => {
        const rawText = match[1];
        if (!rawText) return;
        
        const cleanText = cleanExtractedText(rawText);
        if (cleanText && !shouldIgnoreText(cleanText)) {
          extractedStrings.add(cleanText);
        }
      });
    });
    
    const found = Array.from(extractedStrings);
    if (found.length > 0) {
      console.log(`   ✅ Found ${found.length} translatable strings`);
    }
    
    return found;
  } catch (error) {
    console.warn(`⚠️  Error reading ${filePath}:`, error.message);
    return [];
  }
}

function scanDirectory(dir) {
  const allStrings = new Set();
  let totalFiles = 0;
  
  function walkDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip certain directories
        if (!item.startsWith('.') && 
            item !== 'node_modules' && 
            item !== 'dist' && 
            item !== 'build') {
          walkDir(fullPath);
        }
      } else if (item.endsWith('.tsx') || 
                 (item.endsWith('.ts') && !item.endsWith('.d.ts'))) {
        totalFiles++;
        const strings = extractFromFile(fullPath);
        strings.forEach(str => allStrings.add(str));
      }
    }
  }
  
  console.log('🔍 Scanning for translatable content...\n');
  walkDir(dir);
  console.log(`\n📊 Scanned ${totalFiles} files`);
  
  return Array.from(allStrings).sort();
}

function generateTranslationKeys(strings) {
  const keyMap = {};
  const usedKeys = new Set();
  
  strings.forEach(str => {
    // Generate a meaningful key from the string
    let key = str
      .toLowerCase()
      // Handle common contractions
      .replace(/don't/g, 'do-not')
      .replace(/can't/g, 'cannot')
      .replace(/won't/g, 'will-not')
      // Remove punctuation except hyphens and spaces
      .replace(/[^\w\s\-]/g, '')
      // Convert spaces to hyphens
      .replace(/\s+/g, '-')
      // Remove multiple hyphens
      .replace(/-+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Limit length
      .substring(0, 50);
    
    // Ensure key is not empty
    if (!key) {
      key = 'untranslatable-' + Math.random().toString(36).substring(2, 8);
    }
    
    // Ensure uniqueness
    let finalKey = key;
    let counter = 1;
    while (usedKeys.has(finalKey)) {
      finalKey = `${key}-${counter}`;
      counter++;
    }
    
    usedKeys.add(finalKey);
    keyMap[str] = finalKey;
  });
  
  return keyMap;
}

function main() {
  console.log('🚀 Enhanced Text Extraction for Multi-Language Support\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const translationsDir = path.join(process.cwd(), 'src', 'translations');
  
  // Create translations directory
  if (!fs.existsSync(translationsDir)) {
    fs.mkdirSync(translationsDir, { recursive: true });
  }
  
  // Extract all strings
  const extractedStrings = scanDirectory(srcDir);
  
  console.log(`\n🎯 RESULTS:`);
  console.log(`📝 Found ${extractedStrings.length} total translatable strings`);
  
  // Show breakdown by content type
  const formStrings = extractedStrings.filter(s => 
    s.length < 50 && (s.includes('submit') || s.includes('find') || s.includes('report') || s.includes('button') || s.includes('field'))
  );
  const contentStrings = extractedStrings.filter(s => s.length >= 50);
  const shortContent = extractedStrings.filter(s => s.length < 50 && !formStrings.includes(s));
  
  console.log(`   🎛️  Interface elements: ${formStrings.length + shortContent.length}`);
  console.log(`   📄 Page content: ${contentStrings.length}`);
  
  // Generate keys
  const keyMap = generateTranslationKeys(extractedStrings);
  
  // Create English source file
  const englishTranslations = {};
  Object.entries(keyMap).forEach(([text, key]) => {
    englishTranslations[key] = text;
  });
  
  // Save files
  const extractionResults = {
    strings: extractedStrings,
    keyMap: keyMap,
    translations: englishTranslations,
    extractedAt: new Date().toISOString(),
    stats: {
      total: extractedStrings.length,
      interface: formStrings.length + shortContent.length,
      content: contentStrings.length
    }
  };
  
  fs.writeFileSync(
    path.join(translationsDir, 'extracted.json'),
    JSON.stringify(extractionResults, null, 2)
  );
  
  fs.writeFileSync(
    path.join(translationsDir, 'en.json'),
    JSON.stringify(englishTranslations, null, 2)
  );
  
  console.log('\n✅ Extraction Complete!');
  console.log(`📁 Files saved to: ${translationsDir}`);
  console.log('\n🎯 Next steps:');
  console.log('1. Review the extracted strings in src/translations/extracted.json');
  console.log('2. Run "pnpm run ai-translate" to generate all translations');
  
  // Show sample content
  console.log('\n📋 Sample extracted content:');
  console.log('Interface elements:');
  extractedStrings.filter(s => s.length < 30).slice(0, 5).forEach(str => {
    console.log(`   • "${str}"`);
  });
  
  console.log('\nPage content:');
  extractedStrings.filter(s => s.length >= 30).slice(0, 3).forEach(str => {
    console.log(`   • "${str.substring(0, 60)}..."`);
  });
}

if (require.main === module) {
  main();
}

module.exports = { extractFromFile, scanDirectory };