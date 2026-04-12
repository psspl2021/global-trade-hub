import { useCallback, useRef, useState } from 'react';
import { getNarrationText, type DemoNarrationStep, type DemoScenario } from '@/lib/demo-voiceover-script';

// 🔥 ALWAYS use en-IN voice — Hinglish text sounds natural with Indian English voice
const VOICE_LANG = 'en-IN';

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

  const speakInternal = useCallback(async (step: DemoNarrationStep, onEnd?: () => void) => {
    if (!voiceEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    const text = getNarrationText(step, language, scenario);
    if (!text) return;

    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    synthesis.resume(); // Chrome bug: clear stuck paused state

    const voices = await getVoices();

    // Always use en-IN voice — Hinglish text sounds best with Indian English
    const preferredVoice =
      voices.find(v => v.lang === VOICE_LANG) ||
      voices.find(v => v.lang.toLowerCase().startsWith('en')) ||
      voices[0];

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = preferredVoice?.lang || VOICE_LANG;
    if (preferredVoice) utterance.voice = preferredVoice;

    // Human-like tuning — slower for impact lines
    const SLOW_STEPS: DemoNarrationStep[] = ['savings', 'loss_aversion', 'outro'];
    utterance.rate = SLOW_STEPS.includes(step) ? 0.82 : 0.9;
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

  // Dramatic pause before impact steps
  const DRAMA_STEPS: DemoNarrationStep[] = ['loss_aversion', 'outro', 'cta'];
  const speak = useCallback((step: DemoNarrationStep, onEnd?: () => void) => {
    const delay = DRAMA_STEPS.includes(step) ? 800 : 0;
    if (delay) {
      setTimeout(() => speakInternal(step, onEnd), delay);
    } else {
      speakInternal(step, onEnd);
    }
  }, [speakInternal]);

  return { speak, pause, resume, stop, speaking, paused, currentStep, voiceEnabled, toggleVoice };
}
