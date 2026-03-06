import { useRef, useState } from 'react';

const digitMap = {
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9'
};

export default function useVoiceCommands() {
  const recognitionRef = useRef(null);
  const recognitionRunning = useRef(false);
  const [micActive, setMicActive] = useState(false);

  function normalizeTranscript(text) {
    return (text || '').toLowerCase().replace(/[.,]/g, '').trim();
  }

  function wordsToDigits(text) {
    const words = normalizeTranscript(text).split(/\s+/);
    const digits = words.map(w => digitMap[w]).filter(Boolean).join('');
    // also allow direct numbers in transcript
    if (!digits) {
      const numerals = (text || '').replace(/[^0-9]/g, '');
      return numerals;
    }
    return digits;
  }

  function startListening(mode = 'commands', onResult = () => { }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      try { window.dispatchEvent(new CustomEvent('voltcharge-voice-feedback', { detail: 'unsupported' })); } catch (e) { void e; }
      return;
    }

    // stop previous
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRunning.current = false;
      } catch (e) { void e; }
      recognitionRef.current = null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = true; // Keep listening continuously
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join(' ');
      if (mode === 'digits') {
        const digits = wordsToDigits(text);
        onResult(digits, text);
      } else {
        onResult(text, text);
      }
    };

    recognition.onerror = () => {
      setMicActive(false);
      recognitionRunning.current = false;
      try { window.dispatchEvent(new CustomEvent('voltcharge-voice-feedback', { detail: 'error' })); } catch (e) { void e; }
    };

    recognition.onend = () => {
      recognitionRunning.current = false;
      // Auto-restart if still in state
      if (recognitionRef.current) {
        try {
          if (!recognitionRunning.current) {
            recognition.start();
            recognitionRunning.current = true;
          }
        } catch (e) {
          void e;
          recognitionRunning.current = false;
        }
      }
    };

    try {
      if (!recognitionRunning.current) {
        recognition.start();
        recognitionRunning.current = true;
        recognitionRef.current = recognition;
        setMicActive(true);
        try { window.dispatchEvent(new CustomEvent('voltcharge-voice-feedback', { detail: 'listening' })); } catch (e) { void e; }
      }
    } catch (e) {
      setMicActive(false);
      recognitionRunning.current = false;
    }
  }

  function stopListening() {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRunning.current = false;
      } catch (e) { void e; }
      recognitionRef.current = null;
    }
    setMicActive(false);
    recognitionRunning.current = false;
  }

  return { micActive, startListening, stopListening };
}
