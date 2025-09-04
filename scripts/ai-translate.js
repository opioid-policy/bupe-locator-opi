// scripts/ai-translate.js - Qwen-powered translation generation
const fs = require('fs');
const path = require('path');
const { Ollama } = require('ollama');

const ollama = new Ollama({ host: 'http://localhost:11434' });

// Target languages (your 15 languages)
const targetLanguages = [
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文' },
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'scn', name: 'Sicilian', nativeName: 'Sicilianu' }
];

// Healthcare-specific translation prompt
function createTranslationPrompt(text, targetLang, nativeName) {
  return `You are a professional medical translator. Translate this text for a healthcare website that helps people find pharmacies for addiction treatment medication (buprenorphine).

CONTEXT: This is a community tool to help people access addiction treatment. Be respectful, clear, and medically appropriate.

RULES:
1. Keep medical terms "bupe" and "buprenorphine" unchanged in all languages
2. Use "medicine" instead of "prescription" for clarity
3. Use respectful, non-stigmatizing language appropriate for healthcare
4. Maintain the same tone (helpful, professional, compassionate)
5. For technical terms like "ZIP Code," keep as-is or use local equivalent
6. If translating "pharmacy," use the most common local term

TARGET LANGUAGE: ${targetLang} (${nativeName})

ENGLISH TEXT: "${text}"

Provide ONLY the translation, no explanations or additional text:`;
}

async function translateText(text, targetLang, nativeName) {
  try {
    const prompt = createTranslationPrompt(text, targetLang, nativeName);
    
    const response = await ollama.generate({
      model: 'qwen3:8b',  // Updated to use your qwen3:8b model
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3, // Lower temperature for consistent translations
        top_p: 0.9,
        num_predict: 100
      }
    });
    
    // Clean up the response
    let translation = response.response.trim();
    
    // Remove quotes if AI added them
    if (translation.startsWith('"') && translation.endsWith('"')) {
      translation = translation.slice(1, -1);
    }
    if (translation.startsWith("'") && translation.endsWith("'")) {
      translation = translation.slice(1, -1);
    }
    
    return translation;
  } catch (error) {
    console.error(`Translation error for ${targetLang}:`, error.message);
    return text; // Fallback to original text
  }
}

async function translateToLanguage(englishTranslations, targetLang, nativeName) {
  console.log(`🔄 Translating to ${targetLang} (${nativeName})...`);
  
  const translations = {};
  const entries = Object.entries(englishTranslations);
  
  for (let i = 0; i < entries.length; i++) {
    const [key, englishText] = entries[i];
    
    // Show progress
    const progress = Math.round((i / entries.length) * 100);
    process.stdout.write(`\r   Progress: ${progress}% (${i + 1}/${entries.length})`);
    
    const translatedText = await translateText(englishText, targetLang, nativeName);
    translations[key] = translatedText;
    
    // Brief pause to prevent overwhelming the local model
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  process.stdout.write('\n');
  return translations;
}

async function checkOllamaConnection() {
  try {
    const models = await ollama.list();
    const hasQwen = models.models.some(model => 
      model.name.includes('qwen3:8b')
    );
    
    if (!hasQwen) {
      console.error('❌ Qwen3:8b model not found!');
      console.log('💡 Please run: ollama pull qwen3:8b');
      process.exit(1);
    }
    
    console.log('✅ Ollama connected, Qwen3:8b model ready');
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to Ollama!');
    console.log('💡 Make sure Ollama is running: ollama serve');
    console.log('💡 Or start Ollama Desktop app');
    process.exit(1);
  }
}

async function main() {
  console.log('🤖 Starting AI translation with Qwen3:8b...');
  
  // Check Ollama connection
  await checkOllamaConnection();
  
  const translationsDir = path.join(process.cwd(), 'src', 'translations');
  const extractedFile = path.join(translationsDir, 'extracted.json');
  
  if (!fs.existsSync(extractedFile)) {
    console.error('❌ No extracted text found!');
    console.log('💡 Please run: pnpm run extract-text first');
    process.exit(1);
  }
  
  // Load extracted English text
  const extractedData = JSON.parse(fs.readFileSync(extractedFile, 'utf8'));
  const englishTranslations = extractedData.translations;
  
  console.log(`📝 Translating ${Object.keys(englishTranslations).length} strings to ${targetLanguages.length} languages...`);
  console.log('⏱️  Estimated time: ~2-3 minutes\n');
  
  // Translate to each target language
  for (const lang of targetLanguages) {
    try {
      const translations = await translateToLanguage(
        englishTranslations, 
        lang.name, 
        lang.nativeName
      );
      
      // Save translation file
      const outputPath = path.join(translationsDir, `${lang.code}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(translations, null, 2));
      
      console.log(`✅ ${lang.nativeName} translations saved`);
    } catch (error) {
      console.error(`❌ Failed to translate to ${lang.name}:`, error.message);
    }
  }
  
  // Create public translations directory for dynamic loading
  const publicTranslationsDir = path.join(process.cwd(), 'public', 'translations');
  if (!fs.existsSync(publicTranslationsDir)) {
    fs.mkdirSync(publicTranslationsDir, { recursive: true });
  }
  
  // Copy non-core languages to public directory for dynamic loading
  const coreLanguages = ['en', 'es', 'fr']; // These get bundled
  
  targetLanguages.forEach(lang => {
    if (!coreLanguages.includes(lang.code)) {
      const srcPath = path.join(translationsDir, `${lang.code}.json`);
      const destPath = path.join(publicTranslationsDir, `${lang.code}.json`);
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`📁 ${lang.code}.json copied to public directory`);
      }
    }
  });
  
  console.log('\n🎉 All translations complete!');
  console.log('📋 Summary:');
  console.log(`   • Generated ${targetLanguages.length} translation files`);
  console.log(`   • Core languages (bundled): en, es, fr`);
  console.log(`   • Dynamic languages: ${targetLanguages.filter(l => !coreLanguages.includes(l.code)).map(l => l.code).join(', ')}`);
  console.log('\n✨ Ready to deploy! Your users can now access bupe information in 15 languages.');
  console.log('🚀 Next: Run "pnpm run dev" to test the language selector');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { translateText, checkOllamaConnection };