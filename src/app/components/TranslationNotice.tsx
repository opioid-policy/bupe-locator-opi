// src/app/components/TranslationNotice.tsx
"use client";
import { useTranslations } from '@/lib/i18n-client';

export default function TranslationNotice() {
  const { currentLang } = useTranslations();
  
  if (currentLang === 'en') return null;
  
  const messages: Record<string, string> = {
    es: 'Traducción en progreso - algunas secciones pueden aparecer en inglés.',
    zh: '翻译进行中 - 某些部分可能以英文显示。',
    tl: 'Ang pagsasalin ay kasalukuyang ginagawa - ang ilang bahagi ay maaaring lumitaw sa Ingles.',
    vi: 'Bản dịch đang được thực hiện - một số phần có thể hiển thị bằng tiếng Anh.',
    ar: 'الترجمة قيد التقدم - قد تظهر بعض الأقسام باللغة الإنجليزية.',
    fr: 'Traduction en cours - certaines sections peuvent apparaître en anglais.',
    ko: '번역 진행 중 - 일부 섹션은 영어로 표시될 수 있습니다.',
    pt: 'Tradução em andamento - algumas seções podem aparecer em inglês.',
    he: 'התרגום בתהליך - חלקים מסוימים עשויים להופיע באנגלית.',
    de: 'Übersetzung in Arbeit - einige Abschnitte können auf Englisch erscheinen.',
    it: 'Traduzione in corso - alcune sezioni potrebbero apparire in inglese.',
    pl: 'Tłumaczenie w toku - niektóre sekcje mogą pojawić się po angielsku.',
    scn: 'Traduzzioni in cursu - certi sezzioni ponnu appariri in inglisi.',
    ru: 'Перевод в процессе - некоторые разделы могут отображаться на английском языке.',
    uk: 'Переклад триває - деякі розділи можуть відображатися англійською мовою.'
  };
  
  return (
    <p style={{ 
      fontStyle: 'italic', 
      opacity: 0.9,
      marginTop: '0.5rem',
      textAlign: 'center',
      width: '100%'
    }}>
      {messages[currentLang] || 'Translation in progress - some sections may appear in English. See an issue? Let us know!'}
    </p>
  );
}