import { useState, useEffect } from 'react';
import { translations, Language, Translations } from '@/lib/i18n/translations';

/**
 * Soft language detection hook
 * - Detects browser language
 * - Supports: en (default), hi (Hindi), ar (Arabic)
 * - Fallback to English always
 */
export function useLanguage() {
  const [language, setLanguage] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language?.toLowerCase() || 'en';
    
    // Map browser language to supported languages
    let detectedLang: Language = 'en';
    
    if (browserLang.startsWith('hi')) {
      detectedLang = 'hi';
    } else if (browserLang.startsWith('ar')) {
      detectedLang = 'ar';
      setIsRTL(true);
    }
    // Add more language mappings as needed
    
    setLanguage(detectedLang);
  }, []);

  // Get translations for current language, fallback to English
  const t: Translations = translations[language] || translations.en;

  // Function to change language manually
  const changeLanguage = (newLang: Language) => {
    if (translations[newLang]) {
      setLanguage(newLang);
      setIsRTL(newLang === 'ar');
    }
  };

  return {
    language,
    t,
    isRTL,
    changeLanguage,
    supportedLanguages: ['en', 'hi', 'ar'] as Language[],
  };
}

/**
 * Get translated label with fallback
 */
export function getLabel(
  translations: Translations, 
  section: keyof Translations, 
  key: string
): string {
  const sectionData = translations[section] as Record<string, string>;
  return sectionData?.[key] || key;
}
