// scripts/ai-translate.js - Fixed version with better error handling
const fs = require('fs');
const path = require('path');
const { Ollama } = require('ollama');

const ollama = new Ollama({ host: 'http://localhost:11434' });

// For testing, only Spanish
const TEST_MODE = false;
const TEST_LANGUAGES = [
  { code: 'es', name: 'Spanish', nativeName: 'Español' }
];

const ALL_LANGUAGES = [
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  // ... rest of languages
];

const targetLanguages = TEST_MODE ? TEST_LANGUAGES : ALL_LANGUAGES;
const TRANSLATION_CAP = TEST_MODE ? 10 : null;

// IMPROVED Chat API approach
async function translateTextWithChat(text, targetLang, nativeName) {
  try {
    console.log(`   [Chat API] Translating: "${text.substring(0, 50)}..."`);
    
    const response = await ollama.chat({
      model: 'gemma3:4b',
      messages: [
        {
          role: 'system',
          content: `You are a translator. Translate to ${targetLang}. Output only the translation.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        num_predict: 2000,  // Allow longer responses since we'll extract from reasoning
      }
    });
    
    let translation = response.message.content.trim();
    
    // Debug: Show if we got reasoning
    if (translation.length > 200) {
      console.log(`   📊 Got long response (${translation.length} chars), likely reasoning`);
    }
    
    if (!translation || translation.length === 0) {
      console.log(`   ⚠️  Chat API returned empty response`);
      return null;
    }
    
    // Clean and extract
    translation = cleanTranslation(translation, targetLang, nativeName);
    
    if (!translation || translation.length < 1) {
      console.log(`   ⚠️  Failed to extract translation from reasoning`);
      return null;
    }
    
    console.log(`   ✓ Extracted translation: "${translation.substring(0, 50)}..."`);
    return translation;
    
  } catch (error) {
    console.error(`   ✗ Chat API error: ${error.message}`);
    return null;
  }
}

// IMPROVED Generate API with better prompts
async function translateTextWithGenerate(text, targetLang, nativeName) {
  console.log(`   [Generate API] Trying multiple prompts...`);
  
  const prompts = [
    {
      prompt: `Translate the following English text to ${targetLang}. English: ${text}\n${targetLang}:`,
      name: 'Structured'
    },
    {
      prompt: `English: ${text}\n${targetLang} translation:`,
      name: 'Simple'
    },
    {
      prompt: `${text}\n===\nThe above in ${targetLang}:`,
      name: 'Separator'
    },
    {
      prompt: text + `\n\nIn ${targetLang}, this means:`,
      name: 'Natural'
    }
  ];
  
  for (const { prompt, name } of prompts) {
    try {
      console.log(`   Trying ${name} prompt...`);
      
      const response = await ollama.generate({
        model: 'gemma3:4b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 500,  // Increased
          // Only stop on very clear markers
          stop: ['English:', '\n\n\n', '===']
        }
      });
      
      // Debug: show raw response
      console.log(`   Raw response: "${response.response.substring(0, 100)}..."`);
      
      let translation = response.response.trim();
      
      // If empty, try next
      if (!translation) {
        console.log(`   ✗ ${name} returned empty`);
        continue;
      }
      
      // Clean the response
      translation = cleanTranslation(translation, targetLang, nativeName);
      
      // Check if valid
      if (translation && translation !== text && translation.length > 0) {
        console.log(`   ✓ ${name} worked: "${translation.substring(0, 50)}..."`);
        return translation;
      } else {
        console.log(`   ✗ ${name} failed - Got: "${translation}"`);
      }
    } catch (error) {
      console.error(`   ✗ ${name} error: ${error.message}`);
    }
  }
  
  return null;
}

// Centralized cleaning function
function cleanTranslation(translation, targetLang, nativeName) {
  if (!translation) return '';
  
  // SPECIAL HANDLING FOR QWEN REASONING OUTPUT
  // Qwen often outputs reasoning like "Let me translate... The translation would be: [actual translation]"
  // We need to extract just the final translation
  
  // Common patterns where the actual translation appears
  const extractionPatterns = [
    // "The translation would be: [translation]"
    /(?:translation would be|traducción sería|final translation is|la traducción es)[:\s]+(.+?)(?:\.|$)/i,
    // "In Spanish: [translation]"
    /(?:In Spanish|En español)[:\s]+(.+?)(?:\.|$)/i,
    // "So the translation: [translation]"
    /(?:So the translation|Entonces la traducción)[:\s]+(.+?)(?:\.|$)/i,
    // Last sentence that doesn't contain "Let me", "I'll", "I need", etc.
    /(?:^|\. )([^.]*?(?:es|son|está|están|soy|somos|tiene|tienen)[^.]*?)\.?$/i,
  ];
  
  // Check if this looks like reasoning (contains phrases like "Let me", "I'll", "The user", etc.)
  const reasoningIndicators = [
    'let me', 'i\'ll', 'i need', 'the user', 'first', 'next', 'wait',
    'okay', 'original', 'translation', 'should', 'would be', 'context',
    'correct', 'better', 'alternatively', 'putting it together'
  ];
  
  const lowerText = translation.toLowerCase();
  const hasReasoning = reasoningIndicators.some(indicator => lowerText.includes(indicator));
  
  if (hasReasoning && translation.length > 200) {
    console.log('   📝 Detected reasoning output, extracting translation...');
    
    // Try to extract the actual translation
    for (const pattern of extractionPatterns) {
      const match = translation.match(pattern);
      if (match && match[1]) {
        translation = match[1].trim();
        console.log(`   ✂️ Extracted: "${translation.substring(0, 50)}..."`);
        break;
      }
    }
    
    // If still too long, try splitting by sentences and taking the last Spanish-looking one
    if (translation.length > 200) {
      const sentences = translation.split(/[.!?]+/);
      
      // Find the last sentence that looks like Spanish (contains Spanish words)
      const spanishIndicators = ['el', 'la', 'de', 'que', 'es', 'en', 'un', 'una', 'para', 'con', 'su', 'está'];
      
      for (let i = sentences.length - 1; i >= 0; i--) {
        const sentence = sentences[i].trim();
        const words = sentence.toLowerCase().split(/\s+/);
        
        // Check if this sentence contains Spanish words
        if (spanishIndicators.some(indicator => words.includes(indicator))) {
          // This might be the translation
          if (!sentence.includes('translation') && !sentence.includes('user') && sentence.length > 2) {
            translation = sentence;
            console.log(`   ✂️ Found Spanish sentence: "${translation.substring(0, 50)}..."`);
            break;
          }
        }
      }
    }
    
    // Last resort: if still contains obvious English reasoning, take everything after the last colon
    if (translation.includes('translation') || translation.includes('user')) {
      const parts = translation.split(':');
      if (parts.length > 1) {
        translation = parts[parts.length - 1].trim();
        console.log(`   ✂️ Taking text after last colon: "${translation.substring(0, 50)}..."`);
      }
    }
  }
  
  // Regular cleaning (for non-reasoning outputs)
  translation = translation.replace(/<think>.*?<\/think>/gs, '');
  translation = translation.replace(/<.*?>/g, '');
  translation = translation.replace(/^["']|["']$/g, '');
  translation = translation.replace(/\\"/g, '"');
  translation = translation.replace(/\\'/g, "'");
  translation = translation.replace(/^\n+|\n+$/g, '');
  translation = translation.replace(/\n\n+/g, ' ');
  translation = translation.replace(/\\n/g, ' ');
  
  // Remove common prefixes
  const prefixPatterns = [
    new RegExp(`^${targetLang}:\\s*`, 'i'),
    new RegExp(`^${nativeName}:\\s*`, 'i'),
    new RegExp(`^Spanish:\\s*`, 'i'),
    new RegExp(`^Español:\\s*`, 'i'),
    /^Translation:\s*/i,
    /^Traducción:\s*/i,
  ];
  
  for (const pattern of prefixPatterns) {
    translation = translation.replace(pattern, '');
  }
  
  // Final validation - if it still looks like reasoning, return empty
  if (translation.toLowerCase().includes('let me') || 
      translation.toLowerCase().includes('the user') ||
      translation.length > 500) {
    console.log('   ⚠️ Still contains reasoning after cleaning');
    return '';
  }
  
  return translation.trim();
}

// Test with raw Ollama to debug
async function debugOllama() {
  console.log('\n🔍 Debug: Testing raw Ollama response...');
  
  try {
    // Test 1: Super simple
    const test1 = await ollama.generate({
      model: 'gemma3:4b',
      prompt: 'Translate to Spanish: Hello',
      stream: false,
      options: { temperature: 0.5 }
    });
    console.log('Test 1 raw response:', test1.response);
    
    // Test 2: Chat format
    const test2 = await ollama.chat({
      model: 'gemma3:4b',
      messages: [
        { role: 'user', content: 'Say "hello" in Spanish' }
      ],
      stream: false,
      options: { temperature: 0.5 }
    });
    console.log('Test 2 chat response:', test2.message.content);
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

// Main translation function
async function translateText(text, targetLang, nativeName) {
  // Try Chat API first
  let translation = await translateTextWithChat(text, targetLang, nativeName);
  
  // If chat API fails, try Generate API
  if (!translation) {
    console.log('   Falling back to generate API...');
    translation = await translateTextWithGenerate(text, targetLang, nativeName);
  }
  
  // Final fallback
  if (!translation) {
    console.log(`   ✗ All methods failed, using original text`);
    return text;
  }
  
  return translation;
}

async function checkOllamaConnection() {
  try {
    const models = await ollama.list();
    console.log('Available models:', models.models.map(m => m.name).join(', '));
    
    const hasQwen = models.models.some(model => 
      model.name.includes('gemma')
    );
    
    if (!hasQwen) {
      console.error('❌ Qwen model not found!');
      console.log('💡 Available models:', models.models.map(m => m.name));
      
      // Check for alternative models
      const alternatives = ['llama3.2', 'gemma2', 'mistral', 'phi3'];
      const available = alternatives.find(alt => 
        models.models.some(m => m.name.includes(alt))
      );
      
      if (available) {
        console.log(`💡 Found alternative: ${available}. Update the script to use this model.`);
      }
      
      process.exit(1);
    }
    
    console.log('✅ Ollama connected, Qwen model ready');
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to Ollama!');
    console.log('💡 Make sure Ollama is running: ollama serve');
    process.exit(1);
  }
}

async function translateToLanguage(englishTranslations, targetLang, nativeName) {
  console.log(`\n🔄 Translating to ${targetLang} (${nativeName})...`);
  
  const translations = {};
  const entries = Object.entries(englishTranslations);
  
  const entriesToTranslate = TRANSLATION_CAP 
    ? entries.slice(0, TRANSLATION_CAP)
    : entries;
  
  console.log(`📝 Will translate ${entriesToTranslate.length} of ${entries.length} strings\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (let i = 0; i < entriesToTranslate.length; i++) {
    const [key, englishText] = entriesToTranslate[i];
    
    console.log(`\n[${i + 1}/${entriesToTranslate.length}] Processing: "${englishText.substring(0, 50)}..."`);
    
    try {
      const translatedText = await translateText(englishText, targetLang, nativeName);
      
      if (translatedText && translatedText !== englishText) {
        translations[key] = translatedText;
        successCount++;
        console.log(`✅ Success!`);
      } else {
        translations[key] = englishText;
        failCount++;
        console.log(`❌ Failed - using original`);
      }
    } catch (error) {
      translations[key] = englishText;
      failCount++;
      console.log(`❌ Error: ${error.message}`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Fill remaining with English if capped
  if (TRANSLATION_CAP && entries.length > TRANSLATION_CAP) {
    console.log(`\n📋 Filling remaining ${entries.length - TRANSLATION_CAP} entries with English...`);
    for (let i = TRANSLATION_CAP; i < entries.length; i++) {
      const [key, englishText] = entries[i];
      translations[key] = englishText;
    }
  }
  
  console.log(`\n📊 Results: ${successCount} successful, ${failCount} failed`);
  return translations;
}

async function main() {
  console.log('🤖 Starting AI translation test...');
  console.log(`🧪 TEST MODE: ${TEST_MODE ? 'ON' : 'OFF'}`);
  if (TEST_MODE) {
    console.log(`📌 Testing with: Spanish only, first ${TRANSLATION_CAP} strings`);
  }
  
  // Check connection
  await checkOllamaConnection();
  
  // Run debug tests first
  await debugOllama();
  
  const translationsDir = path.join(process.cwd(), 'src', 'translations');
  const extractedFile = path.join(translationsDir, 'extracted.json');
  
  if (!fs.existsSync(extractedFile)) {
    console.error('❌ No extracted text found!');
    process.exit(1);
  }
  
  const extractedData = JSON.parse(fs.readFileSync(extractedFile, 'utf8'));
  const englishTranslations = extractedData.translations;
  
  console.log(`\n📚 Loaded ${Object.keys(englishTranslations).length} strings`);
  
  // Translate
  for (const lang of targetLanguages) {
    try {
      const translations = await translateToLanguage(
        englishTranslations, 
        lang.name, 
        lang.nativeName
      );
      
      const outputPath = path.join(translationsDir, `${lang.code}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2));
      
      console.log(`\n💾 Saved to ${lang.code}.json`);
      
    } catch (error) {
      console.error(`\n❌ Failed:`, error.message);
    }
  }
  
  console.log('\n✨ Complete!');
}

// Add to your translation output processing
function encodeForJSX(text) {
  // Only encode the essential ones that break JSX
  return text
    .replace(/'/g, "&apos;")  // or use \'
    .replace(/"/g, "&quot;")  // or use \"
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Or, if you prefer, keep apostrophes as-is but escape for JSON:
function escapeForJSON(text) {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

if (require.main === module) {
  main().catch(console.error);
}