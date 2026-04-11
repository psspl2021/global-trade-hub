import { useCallback, useRef, useState } from 'react';
import { getNarrationText, type DemoNarrationStep, type DemoScenario } from '@/lib/demo-voiceover-script';

const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ar: 'ar-SA',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

export function useDemoVoiceover(language: string = 'en', scenario: DemoScenario = 'full') {
  const [speaking, setSpeaking] = useState(false);
  const [currentStep, setCurrentStep] = useState<DemoNarrationStep | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((step: DemoNarrationStep, onEnd?: () => void) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    const text = getNarrationText(step, language, scenario);
    if (!text) return;

    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    synthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);
    const requestedLang = LANG_MAP[language] || 'en-US';
    const voices = synthesis.getVoices();
    const preferredVoice =
      voices.find((voice) => voice.lang === requestedLang) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith(requestedLang.slice(0, 2).toLowerCase())) ||
      voices.find((voice) => voice.lang.toLowerCase().startsWith('en'));

    utterance.lang = preferredVoice?.lang || requestedLang;
    if (preferredVoice) utterance.voice = preferredVoice;
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
    synthesis.speak(utterance);
  }, [language, voiceEnabled, scenario]);

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
