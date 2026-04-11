import { useCallback, useRef, useState } from 'react';
import { getNarrationText, type DemoNarrationStep, type DemoScenario } from '@/lib/demo-voiceover-script';

const LANG_MAP: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  ar: 'ar-SA',
  vi: 'vi-VN',
  zh: 'zh-CN',
};

export function useDemoVoiceover(language: string = 'en', scenario: DemoScenario = 'full') {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState<DemoNarrationStep | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback((step: DemoNarrationStep, onEnd?: () => void) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    const text = getNarrationText(step, language, scenario);
    if (!text) return;

    const synthesis = window.speechSynthesis;
    // Only cancel if actively speaking (not paused) — prevents overlap
    if (synthesis.speaking && !synthesis.paused) {
      synthesis.cancel();
    }
    // Chrome bug: after cancel, synthesis can get stuck in paused state
    synthesis.resume();

    const utterance = new SpeechSynthesisUtterance(text);

    // Pick best available voice
    const requestedLang = LANG_MAP[language] || 'en-US';
    const voices = synthesis.getVoices();
    const preferredVoice =
      voices.find(v => v.lang === requestedLang) ||
      voices.find(v => v.lang.toLowerCase().startsWith(requestedLang.slice(0, 2).toLowerCase())) ||
      voices.find(v => v.lang.toLowerCase().startsWith('en'));

    utterance.lang = preferredVoice?.lang || requestedLang;
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.85;

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
      // 'interrupted' is normal when we cancel to start a new utterance
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
