// src/utils.js

export const triggerHaptic = (pattern) => {
  if (navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const speak = (text, onEndCallback = null) => {
  if (!window.speechSynthesis) return;

  // Signal start to other components
  try { window.dispatchEvent(new Event("voltcharge-speaking-start")); } catch (e) { void e; }
  // Explicitly pause microphone before starting speech
  try { window.dispatchEvent(new Event("voltcharge-pause-mic")); } catch (e) { void e; }
  try { window.isSystemSpeaking = true; } catch (e) { void e; }

  // Cancel any ongoing speech to avoid overlaps
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  const handleEnd = () => {
    try {
      window.isSystemSpeaking = false;
      window.dispatchEvent(new Event("voltcharge-speaking-end"));
      // Crucial: Resume microphone after speech completes or fails
      window.dispatchEvent(new Event("voltcharge-resume-mic"));
      if (onEndCallback) onEndCallback();
    } catch (e) {
      console.error("Error in speech end handler:", e);
    }
  };

  utterance.onend = handleEnd;
  utterance.onerror = (event) => {
    console.warn("Speech synthesis error:", event);
    handleEnd();
  };

  window.speechSynthesis.speak(utterance);
};

export const beep = (duration = 500) => {
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration / 1000
    );
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  }
};
