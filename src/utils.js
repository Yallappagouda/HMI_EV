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

export const speakIndustrial = (text, recognitionRef) => {
  if (!window.speechSynthesis) return;

  // 🔴 Turn OFF mic before speaking
  if (recognitionRef?.current) {
    try {
      recognitionRef.current.onend = null; // prevent auto-restart
      recognitionRef.current.stop();
      console.log("🎤 Mic OFF (System speaking)");
    } catch (e) { }
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onend = () => {
    console.log("🔊 System finished speaking");

    // 🟢 Turn mic back ON
    if (recognitionRef?.current) {
      try {
        recognitionRef.current.start();
        console.log("🎤 Mic ON (Listening again)");
      } catch (e) { }
    }
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
    oscillator.frequency.value = 1000; // 1000 Hz tone
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  }
};