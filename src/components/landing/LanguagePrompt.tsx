/**
 * ============================================================
 * LANGUAGE PROMPT COMPONENT
 * ============================================================
 * 
 * Optional language switch prompt for internationalization.
 * 
 * Features:
 * - Auto-detects browser language
 * - Shows non-intrusive prompt
 * - Changes content text only (NOT the URL)
 * - Same canonical URL always
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Globe } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

// Supported languages with native names (subset of full Language type)
type SupportedLang = 'en' | 'hi' | 'ar';

const LANGUAGE_LABELS: Record<SupportedLang, { nativeName: string; englishName: string }> = {
  en: { nativeName: 'English', englishName: 'English' },
  hi: { nativeName: 'हिंदी', englishName: 'Hindi' },
  ar: { nativeName: 'العربية', englishName: 'Arabic' },
};

export function LanguagePrompt() {
  const { language, changeLanguage } = useLanguage();
  const [detectedLanguage, setDetectedLanguage] = useState<SupportedLang | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  
  useEffect(() => {
    // Check if already dismissed this session
    const wasDismissed = sessionStorage.getItem('ps_lang_prompt_dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }
    
    // Detect browser language
    const browserLang = navigator.language?.toLowerCase() || 'en';
    let detected: SupportedLang = 'en';
    
    if (browserLang.startsWith('hi')) {
      detected = 'hi';
    } else if (browserLang.startsWith('ar')) {
      detected = 'ar';
    }
    
    // Only show prompt if detected language differs from current
    if (detected !== language && detected !== 'en') {
      setDetectedLanguage(detected);
      setShowPrompt(true);
    }
  }, [language]);
  
  const handleSwitch = () => {
    if (detectedLanguage) {
      changeLanguage(detectedLanguage);
    }
    setShowPrompt(false);
    sessionStorage.setItem('ps_lang_prompt_dismissed', 'true');
  };
  
  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    sessionStorage.setItem('ps_lang_prompt_dismissed', 'true');
  };
  
  if (!showPrompt || dismissed || !detectedLanguage) {
    return null;
  }
  
  const langInfo = LANGUAGE_LABELS[detectedLanguage];
  
  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-left-4 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-[280px]">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Globe className="w-4 h-4 text-primary" />
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              View in {langInfo.nativeName}?
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We detected your browser language as {langInfo.englishName}.
            </p>
            
            <div className="flex gap-2 mt-3">
              <Button 
                size="sm" 
                onClick={handleSwitch}
                className="text-xs h-7"
              >
                Switch to {langInfo.nativeName}
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs h-7"
              >
                Keep English
              </Button>
            </div>
          </div>
          
          <button 
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LanguagePrompt;
