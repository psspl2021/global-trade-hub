import { useCallback, useRef, useState } from 'react';
import { getNarrationText, type DemoNarrationStep, type DemoScenario } from '@/lib/demo-voiceover-script';

const LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ar: 'ar-SA',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

/** Resolve voices with a fallback for lazy-loading browsers (Chrome/Safari) */
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) return resolve(voices);
    window.speechSynthesis.onvoiceschanged = () => {
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

export function useDemoVoiceover(language: string = 'en', scenario: DemoScenario = 'full') {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState<DemoNarrationStep | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(async (step: DemoNarrationStep, onEnd?: () => void) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    const text = getNarrationText(step, language, scenario);
    if (!text) return;

    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    synthesis.resume(); // Chrome bug: clear stuck paused state

    const voices = await getVoices();
    const requestedLang = LANG_MAP[language] || 'en-IN';

    // Priority: exact match → language-family match → Indian English → any English → first
    const preferredVoice =
      voices.find(v => v.lang === requestedLang) ||
      voices.find(v => v.lang.toLowerCase().startsWith(requestedLang.slice(0, 2).toLowerCase())) ||
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => v.lang.toLowerCase().startsWith('en')) ||
      voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = preferredVoice?.lang || requestedLang;
    if (preferredVoice) utterance.voice = preferredVoice;

    // Human-like tuning
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
      setCurrentStep(step);
    };
    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
      setCurrentStep(null);
      onEnd?.();
    };
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        setSpeaking(false);
        setPaused(false);
        setCurrentStep(null);
      }
    };

    utteranceRef.current = utterance;
    synthesis.speak(utterance);
  }, [language, voiceEnabled, scenario]);

  const pause = useCallback(() => {
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setPaused(false);
    setCurrentStep(null);
  }, []);

  const toggleVoice = useCallback(() => {
    if (speaking || paused) stop();
    setVoiceEnabled(v => !v);
  }, [speaking, paused, stop]);

  return { speak, pause, resume, stop, speaking, paused, currentStep, voiceEnabled, toggleVoice };
}
