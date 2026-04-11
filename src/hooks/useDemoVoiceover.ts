import { useCallback, useRef, useState } from 'react';
import { DEMO_NARRATION, type DemoNarrationStep } from '@/lib/demo-voiceover-script';

const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ar: 'ar-SA',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

export function useDemoVoiceover(language: string = 'en') {
  const [speaking, setSpeaking] = useState(false);
  const [currentStep, setCurrentStep] = useState<DemoNarrationStep | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((step: DemoNarrationStep, onEnd?: () => void) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const entry = DEMO_NARRATION.find(n => n.step === step);
    if (!entry) return;

    const text = entry.text[language] || entry.text['en'] || '';
    if (!text) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[language] || 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.85;

    utterance.onstart = () => {
      setSpeaking(true);
      setCurrentStep(step);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setCurrentStep(null);
      onEnd?.();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setCurrentStep(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [language, voiceEnabled]);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setCurrentStep(null);
  }, []);

  const toggleVoice = useCallback(() => {
    if (speaking) stop();
    setVoiceEnabled(v => !v);
  }, [speaking, stop]);

  return { speak, stop, speaking, currentStep, voiceEnabled, toggleVoice };
}
