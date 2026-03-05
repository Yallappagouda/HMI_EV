import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Clock, ShieldCheck, Wifi, Smartphone, ArrowRight,
  CheckCircle2, Circle, AlertTriangle, RotateCcw, Phone,
  Battery, History, X, Lock, Unlock, Speaker
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { triggerHaptic, speak, beep, stopSpeaking } from './utils';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import useVoiceCommands from './hooks/useVoiceCommands';
import SmsDashboard from './components/SmsDashboard';
import FirstTimeTutorial from './pages/FirstTimeTutorial';
import FirstTimeNFCAuth from './components/FirstTimeNFCAuth';
import MainAuthentication from './components/MainAuthentication';
import ErrorDashboard from './pages/ErrorDashboard';
import { useUserFlow } from './context/UserFlowContext';
import MicButton from './components/MicButton';
import { useCognitive } from './hooks/useCognitiveEngine';

// --- UI COMPONENTS (Defined early to avoid ReferenceErrors) ---

const Card = ({ children, className, onClick, active }) => {
  const handleClick = (event) => {
    if (onClick) onClick(event);
  };
  return (
    <div
      onClick={handleClick}
      className={`relative p-6 rounded-2xl border transition-all duration-300 backdrop-blur-sm ${active ? 'bg-volt-navy/80 border-volt-cyan shadow-[0_0_20px_rgba(34,211,238,0.2)]' : 'bg-volt-navy/40 border-white/5 hover:bg-volt-navy/60 hover:border-white/10'} ${className}`}
    >
      {children}
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', className, icon: Icon, disabled = false }) => {
  const variants = {
    primary: "bg-gradient-to-r from-volt-cyan to-volt-green text-black font-bold shadow-[0_0_20px_rgba(34,211,238,0.4)]",
    danger: "bg-gradient-to-r from-red-800 to-red-600 text-white border border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    secondary: "bg-volt-navy border border-white/20 text-white hover:bg-white/10",
    ghost: "bg-transparent text-volt-cyan hover:text-white"
  };
  return (
    <motion.button
      whileTap={!disabled ? { scale: 0.95 } : {}}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      onClick={!disabled ? (e) => { if (onClick) onClick(e); } : undefined}
      disabled={disabled}
      className={`w-full py-4 px-6 rounded-xl flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={20} />}
      {children}
    </motion.button>
  );
};

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error("Screen Error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-red-950/20 border-2 border-red-600 rounded-2xl">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-500 mb-2">Screen Failed to Load</h2>
          <p className="text-slate-400 mb-6">We encountered an issue displaying this screen.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded-lg font-bold"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
// --- LEGACY SCREENS REMOVED (Replaced by separate components) ---

// reference to avoid unused-import linter in some environments
const _motionRef = motion;

// Remove duplicate UI components as they are now defined at the top

// --- SCREENS ---

const Header = ({ voice }) => (
  <div className="absolute top-0 z-10 flex items-center justify-between w-full p-6">
    <div className="flex items-center gap-2">
      <Zap className="text-volt-cyan fill-volt-cyan" />
      <span className="font-sans text-xl font-bold tracking-widest">VOLTCHARGE</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex gap-4 px-4 py-2 font-mono text-xs border rounded-full text-slate-400 bg-volt-navy/80 border-white/5">
        <span className="flex items-center gap-2"><Wifi size={12} className="text-volt-green" /> 5G Connected</span>
        <span>|</span>
        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="ml-2">
        <MicButton voice={voice} />
      </div>
    </div>
  </div>
);

// 1. HOME - WELCOME SCREEN WITH FIRST-TIME CHECK
const HomeScreen = ({ onNext, decideUserMode, userMode, incrementHelp }) => {
  const navigate = useNavigate();
  const { setIsFirstTimeUser, setGuidedMode } = useUserFlow();
  const { registerInteraction } = useCognitive();

  const [inactiveStage, setInactiveStage] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const hasTriggeredRef = useRef(false);
  const isMountedRef = useRef(true);
  const countdownActiveRef = useRef(false);

  // Inactivity timeout logic - Stable version
  useEffect(() => {
    if (hasTriggeredRef.current) return;

    const reminderTimer = setTimeout(() => {
      setInactiveStage(1);
    }, 10000);

    const guidedTimer = setTimeout(() => {
      setInactiveStage(2);
    }, 20000);

    return () => {
      clearTimeout(reminderTimer);
      clearTimeout(guidedTimer);
    };
  }, []);

  // Handle stage changes safely (isolated side effects)
  useEffect(() => {
    if (inactiveStage === 1) {
      speak("Please select Yes or No.");
    }

    if (inactiveStage === 2 && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      countdownActiveRef.current = true;

      const proceedToGuided = () => {
        if (!countdownActiveRef.current) return;
        countdownActiveRef.current = false;
        setIsFirstTimeUser(true);
        setGuidedMode(true);
        navigate("/guided-video");
      };

      // Speak and navigate after speech
      speak("Switching to guided mode in 5… 4… 3… 2… 1");

      // Use speechSynthesis event to ensure completion
      if (window.speechSynthesis) {
        const checkInterval = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(checkInterval);
            proceedToGuided();
          }
        }, 200);
      } else {
        // Fallback if speech API fails
        setTimeout(proceedToGuided, 6000);
      }
    }
  }, [inactiveStage, navigate, setIsFirstTimeUser, setGuidedMode]);



  const handleYes = useCallback(() => {
    countdownActiveRef.current = false;
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    decideUserMode && decideUserMode(true, 0);
    localStorage.setItem('voltcharge-is-first-time', 'true');
    setIsFirstTimeUser(true);
    setGuidedMode(false);
    try { window.dispatchEvent(new CustomEvent('voltcharge-start', { detail: { time: Date.now() } })); } catch (e) { void e; }
    onNext(true);
  }, [decideUserMode, onNext, setIsFirstTimeUser, setGuidedMode]);

  const handleNo = useCallback(() => {
    countdownActiveRef.current = false;
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    decideUserMode && decideUserMode(false, 0);
    localStorage.setItem('voltcharge-is-first-time', 'false');
    setIsFirstTimeUser(false);
    setGuidedMode(false);
    try { window.dispatchEvent(new CustomEvent('voltcharge-start', { detail: { time: Date.now() } })); } catch (e) { void e; }
    onNext(false);
  }, [decideUserMode, onNext, setIsFirstTimeUser, setGuidedMode]);

  // Voice logic removed - now centralized in App.jsx

  useEffect(() => {
    isMountedRef.current = true;
    speak("Welcome to EV Charging Station. Is this your first time charging an EV?");

    const handleVoiceAction = (e) => {
      const action = e.detail;
      if (action === 'yes') handleYes();
      if (action === 'no') handleNo();
    };

    window.addEventListener('voltcharge-voice-action', handleVoiceAction);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('voltcharge-voice-action', handleVoiceAction);
    };
  }, [handleYes, handleNo]);

  const modeClasses = userMode === 'ELDERLY' ? 'text-2xl high-contrast' : (userMode === 'GUIDED' ? 'text-xl' : (userMode === 'EXPERT' ? 'text-sm' : ''));
  const showInactivityHint = inactiveStage >= 1;
  const hasVoiceSupport = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className={`flex flex-col h-full justify-between px-4 py-8 relative ${modeClasses}`} onClick={() => setInactiveStage(0)}>
      {/* Header Section */}
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 border rounded-full bg-volt-cyan/20 border-volt-cyan">
            <Zap size={32} className="text-volt-cyan" />
          </div>
        </div>
        <motion.h1
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className={`font-bold font-sans text-glow mb-2 ${userMode === 'ELDERLY' ? 'text-4xl' : (userMode === 'GUIDED' ? 'text-3xl' : 'text-2xl')}`}
        >
          EV Charging Station
        </motion.h1>
        <p className={`${userMode === 'ELDERLY' ? 'text-xl' : (userMode === 'GUIDED' ? 'text-lg' : 'text-base')} text-slate-400`}>Fast, Safe, and Sustainable Charging</p>
      </div>

      {/* Main Question Section */}
      <div className="flex items-center justify-center flex-1 mb-12">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl text-center"
        >
          <h2 className={`font-bold font-sans mb-12 ${userMode === 'ELDERLY' ? 'text-3xl' : (userMode === 'GUIDED' ? 'text-2xl' : 'text-xl')}`}>
            Is this your first time charging an EV?
          </h2>

          <AnimatePresence>
            {showInactivityHint && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-8 text-xl font-bold text-volt-cyan animate-pulse"
              >
                Need help getting started?
              </motion.p>
            )}
          </AnimatePresence>

          {voiceError && (
            <p className="mt-2 text-sm text-amber-400">
              {voiceError}
            </p>
          )}

          <div className={`grid grid-cols-2 gap-6 ${userMode === 'ELDERLY' ? 'gap-8' : ''}`}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              animate={showInactivityHint ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0px rgba(34,211,238,0)", "0 0 20px rgba(34,211,238,0.5)", "0 0 0px rgba(34,211,238,0)"] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              onClick={handleYes}
              className={`py-6 px-4 rounded-xl font-bold uppercase tracking-wider transition-all border-2 text-white bg-volt-green/20 border-volt-green hover:bg-volt-green/30 ${userMode === 'ELDERLY' ? 'py-8 text-2xl' : (userMode === 'GUIDED' ? 'py-6 text-lg' : 'py-4 text-base')}`}
            >
              ✅ Yes
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              animate={showInactivityHint ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0px rgba(255,255,255,0)", "0 0 20px rgba(255,255,255,0.3)", "0 0 0px rgba(255,255,255,0)"] } : {}}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              onClick={handleNo}
              className={`py-6 px-4 rounded-xl font-bold uppercase tracking-wider transition-all border-2 text-white bg-slate-700/30 border-slate-600 hover:bg-slate-700/50 ${userMode === 'ELDERLY' ? 'py-8 text-2xl' : (userMode === 'GUIDED' ? 'py-6 text-lg' : 'py-4 text-base')}`}
            >
              ❌ No
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Footer Section */}
      <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
        <button
          className="hover:text-slate-300"
          onClick={() => {
            incrementHelp();
            registerInteraction();
            navigate('/help');
          }}
        >
          ℹ️ Help
        </button>
        <div className="w-px h-5 bg-slate-700"></div>
        {hasVoiceSupport && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span>🎤</span>
            <span>Voice: Say "Yes" or "No"</span>
          </div>
        )}
        <select className="px-3 py-1 bg-transparent border rounded border-slate-600 text-slate-300">
          <option>English</option>
          <option>Español</option>
          <option>Français</option>
        </select>
      </div>
    </div>
  );
};

// 1.5. CHARGING MODE SELECTION
const ChargingModeScreen = ({ onFastCharge, onNormalCharge, userMode }) => {
  const handleFastCharge = () => {
    triggerHaptic(50);
    speak("Fast charging selected.");
    // notify any listeners (research tracking)
    try { window.dispatchEvent(new CustomEvent('voltcharge-mode-selected', { detail: { mode: 'fast', time: Date.now() } })); } catch (e) { void e; }
    onFastCharge();
  };

  const handleNormalCharge = () => {
    triggerHaptic(50);
    speak("Normal charging selected.");
    try { window.dispatchEvent(new CustomEvent('voltcharge-mode-selected', { detail: { mode: 'normal', time: Date.now() } })); } catch (e) { void e; }
    onNormalCharge();
  };

  useEffect(() => {
    speak("Please select Normal Charging or Fast Charging.");
  }, []);

  const modeClasses = userMode === 'ELDERLY' ? 'text-2xl high-contrast' : (userMode === 'GUIDED' ? 'text-xl' : (userMode === 'EXPERT' ? 'text-sm compact-layout' : ''));
  return (
    <div className={`flex flex-col h-full justify-center px-4 max-w-5xl mx-auto w-full ${modeClasses}`}>
      <div className="mb-16 text-center">
        <h2 className="mb-2 font-sans text-4xl font-bold text-glow">Select Charging Mode</h2>
        <p className="text-slate-400">Choose your preferred charging speed</p>
      </div>

      <div className="grid items-stretch grid-cols-1 gap-8 md:grid-cols-2">
        {/* FAST CHARGE CARD */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleFastCharge}
          className="relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-sm bg-volt-navy/40 hover:bg-volt-navy/60 border-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.3)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)]">
          <div className="absolute w-8 h-8 border-2 rounded-full top-4 right-4 border-cyan-400 bg-cyan-400/10"></div>

          <div className="mb-6 text-6xl">⚡</div>
          <h3 className="mb-2 text-3xl font-bold text-cyan-400">Fast Charge</h3>
          <p className="mb-6 text-lg text-slate-400">High-speed charging</p>

          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-400">⚡</span>
              <span>0-80% in ~25 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-400">⚡</span>
              <span>150 kW max power</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-400">⚡</span>
              <span>Ideal for quick trips</span>
            </div>
          </div>
        </motion.div>

        {/* NORMAL CHARGE CARD */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNormalCharge}
          className="relative p-8 rounded-2xl border-2 cursor-pointer transition-all duration-300 backdrop-blur-sm bg-volt-navy/40 hover:bg-volt-navy/60 border-green-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)]">
          <div className="absolute w-8 h-8 border-2 border-green-500 rounded-full top-4 right-4 bg-green-500/10"></div>

          <div className="mb-6 text-6xl">🔋</div>
          <h3 className="mb-2 text-3xl font-bold text-green-500">Normal Charge</h3>
          <p className="mb-6 text-lg text-slate-400">Balanced charging mode</p>

          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500">✓</span>
              <span>Optimized for battery health</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500">✓</span>
              <span>50 kW balanced power</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-green-500">✓</span>
              <span>Extended battery lifespan</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// --- DEPRECATED AUTH SCREEN REMOVED ---

// 2.5 OTP VERIFICATION WITH REAL BACKEND
// [OTP SCREEN REMOVED]

// 3. CONNECT CABLE (OLD - KEPT FOR COMPATIBILITY)
// [DEPRECATED - Use CableConnectionScreen instead]
// filepath: c:\Users\Lenovo\OneDrive\ドキュメント\GitHub\HMI_EV_CHARGING\src\App.jsx
// Add this BEFORE the main App function (around line 1300, before "export default function App")

// 3. CABLE CONNECTION SCREEN (NFC / CONNECTOR DETECTION)
const CableConnectionScreen = ({ onNext, userMode }) => {
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const isMountedRef = useRef(true);
  const [isCableListening, setIsCableListening] = useState(false);
  const [hasPromptedCable, setHasPromptedCable] = useState(false);

  const handleContinue = useCallback(() => {
    triggerHaptic(50);
    beep(300);
    setTimeout(() => onNext(), 400);
  }, [onNext]);

  useEffect(() => {
    speak(userMode === 'GUIDED' ? 'Step 2 of 3: Connect your charging cable.' : 'Please connect your charging cable.');
    beep(500);

    // Simulate cable detection after 2 seconds
    const timeout = setTimeout(() => {
      setChecking(false);
      // Auto-detect cable (in production, this would check actual hardware)
      const detected = Math.random() > 0.3; // 70% success rate for demo
      if (detected) {
        setConnected(true);
        triggerHaptic([100, 50, 100]);
      } else {
        setError('Cable not detected. Please insert cable firmly.');
        triggerHaptic([100, 50, 100, 50, 100]);
      }
    }, 2000);

    const handleVoiceAction = (e) => {
      if (e.detail === 'continue' && connected) {
        handleContinue();
      }
    };

    window.addEventListener('voltcharge-voice-action', handleVoiceAction);

    return () => {
      isMountedRef.current = false;
      clearTimeout(timeout);
      window.removeEventListener('voltcharge-voice-action', handleVoiceAction);
    };
  }, [userMode, connected, handleContinue]);

  // Voice logic moved to App.jsx

  useEffect(() => {
    if (connected && !hasPromptedCable) {
      speak("Cable connected. Say Continue to start charging.");
      setHasPromptedCable(true);
      setIsCableListening(true);
    }
  }, [connected, hasPromptedCable]);

  const handleRetry = () => {
    setChecking(true);
    setError('');
    setConnected(false);
    speak('Checking for cable connection...');

    setTimeout(() => {
      setChecking(false);
      const detected = Math.random() > 0.2; // 80% success rate on retry
      if (detected) {
        setConnected(true);
        triggerHaptic([100, 50, 100]);
      } else {
        setError('Cable still not detected.');
      }
    }, 2000);
  };

  const modeClasses = userMode === 'ELDERLY' ? 'text-2xl high-contrast' : (userMode === 'GUIDED' ? 'text-xl' : 'text-sm');
  const titleSize = userMode === 'ELDERLY' ? 'text-4xl' : (userMode === 'GUIDED' ? 'text-3xl' : 'text-2xl');

  if (checking) {
    return (
      <div className={`flex flex-col h-full items-center justify-center px-8 max-w-md mx-auto w-full ${modeClasses}`}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 mb-6 border-4 rounded-full border-volt-cyan border-t-transparent"
        />
        <h2 className={`font-bold font-sans text-glow mb-2 ${titleSize}`}>
          Detecting Cable...
        </h2>
        <p className={`text-slate-400 ${userMode === 'ELDERLY' ? 'text-xl' : 'text-base'}`}>
          Please insert your charging cable
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full justify-center px-8 max-w-md mx-auto w-full ${modeClasses}`}>
      <div className={userMode === 'GUIDED' ? 'flex items-center gap-2 mb-12' : 'mb-8'}>
        {userMode === 'GUIDED' && <span className="font-bold text-volt-cyan">Step 2 of 3</span>}
        <h2 className={`font-bold font-sans text-glow ${titleSize}`}>
          {userMode === 'GUIDED' ? 'Connect Cable' : 'Cable Connection'}
        </h2>
      </div>

      <Card className={`flex flex-col items-center justify-center mb-8 ${userMode === 'ELDERLY' ? 'p-12 min-h-[300px]' : 'p-8 min-h-[250px]'}`}>
        <motion.div
          animate={connected ? { scale: [1, 1.2, 1] } : { y: [0, 10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
          className={`${userMode === 'ELDERLY' ? 'text-8xl' : 'text-6xl'} mb-6`}
        >
          {connected ? '✅' : '🔌'}
        </motion.div>
        <h3 className={`font-bold mb-2 ${userMode === 'ELDERLY' ? 'text-2xl' : 'text-lg'}`}>
          {connected ? 'Cable Connected' : 'Waiting for Cable'}
        </h3>
        <p className={`text-slate-400 text-center ${userMode === 'ELDERLY' ? 'text-lg' : 'text-sm'}`}>
          {connected ? 'Ready to start charging' : 'Insert cable into charging port'}
        </p>
      </Card>

      {error && (
        <div className={`bg-red-950/30 border border-red-600 rounded-lg p-4 mb-6 text-red-400 ${userMode === 'ELDERLY' ? 'text-lg' : 'text-sm'}`}>
          {error}
        </div>
      )}

      <div className="space-y-3">
        {!connected && (
          <Button onClick={handleRetry} variant="secondary" className={userMode === 'ELDERLY' ? 'py-6 text-2xl' : ''}>
            Retry Detection
          </Button>
        )}
        <Button
          onClick={handleContinue}
          variant="primary"
          disabled={!connected}
          className={userMode === 'ELDERLY' ? 'py-6 text-2xl' : ''}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

// 4. CHARGING DASHBOARD
const ChargingScreen = ({ onComplete, onError, mode = 'normal', userMode = 'STANDARD', isFirstTime }) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [show80Modal, setShow80Modal] = useState(false);
  const [hapticTriggered, setHapticTriggered] = useState(false);
  const [hapticToasts, setHapticToasts] = useState([]);
  const [childLockEnabled, setChildLockEnabled] = useState(false);
  const [overVoltageWarning, setOverVoltageWarning] = useState(false);
  const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
  const [isListening80, setIsListening80] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [awaiting80Decision, setAwaiting80Decision] = useState(false);
  const [hasAnnouncedFinalVoice, setHasAnnouncedFinalVoice] = useState(false);

  const intervalRef = useRef(null);
  const pausedRef = useRef(false);
  const completedRef = useRef(false);
  const spokeStartRef = useRef(false);
  const spoke80Ref = useRef(false);
  const spokeStopRef = useRef(false);
  const preBeepRef = useRef(false);
  const nearBeepRef = useRef(false);
  const [micActive, setMicActive] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState('');

  // --- Safe Render Fallback ---
  if (progress === undefined || progress === null) {
    return null;
  }

  // --- HELPERS (Defined before useEffect hooks to avoid TDZ errors) ---

  const addHapticToastCb = useCallback((pattern) => {
    const id = Date.now();
    setHapticToasts(prev => [...prev, { id, pattern }]);
    setTimeout(() => {
      setHapticToasts(prev => prev.filter(t => t.id !== id));
    }, 1200);
  }, []);

  const triggerHapticWithFeedback = useCallback((pattern) => {
    triggerHaptic(pattern);
    setHapticTriggered(true);
    addHapticToastCb(pattern);
    setTimeout(() => setHapticTriggered(false), 300);
  }, [addHapticToastCb]);

  const handleSessionComplete = useCallback((reason = 'user') => {
    setIsListening80(false);
    onComplete && onComplete();
  }, [onComplete]);

  const handleVoiceCommand = useCallback((text) => {
    const cmd = text.toLowerCase();
    setVoiceMessage(`Heard: "${text}"`);

    // Modals get priority
    if (showStopConfirm) {
      if (cmd.includes('yes') || cmd.includes('stop')) {
        completedRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        speak("Charging stopped.");
        setSmsMessage("SMS sent: Charging completed.");
        setTimeout(() => handleSessionComplete('user_stop'), 500);
        return;
      } else if (cmd.includes('continue') || cmd.includes('no')) {
        setShowStopConfirm(false);
        spokeStopRef.current = false;
        setIsPaused(false);
        pausedRef.current = false;
        speak("Resuming charging.");
        return;
      }
    }

    if (awaiting80Decision) {
      if (cmd.includes('continue')) {
        setShow80Modal(false);
        setAwaiting80Decision(false);
        setIsPaused(false);
        pausedRef.current = false;
        speak("Continuing to full charge.");
        return;
      } else if (cmd.includes('stop')) {
        setShow80Modal(false);
        setAwaiting80Decision(false);
        // showStopConfirm will be handled by the next block
      }
    }

    // Generic stop command
    if (cmd.includes('stop charging') || cmd.includes('stop')) {
      if (!showStopConfirm) {
        setShowStopConfirm(true);
        setIsPaused(true);
        pausedRef.current = true;
        if (!spokeStopRef.current) {
          spokeStopRef.current = true;
          speak("Are you sure you want to stop charging? Say Yes to stop or say Continue charging to resume.");
        }
      }
      return;
    }
    // brief display
    setTimeout(() => setVoiceMessage(''), 3000);
  }, [triggerHapticWithFeedback, handleSessionComplete, show80Modal, awaiting80Decision, showStopConfirm]);

  const toggleChildLock = () => {
    const newState = !childLockEnabled;
    setChildLockEnabled(newState);
    triggerHaptic([80, 40, 80]);
    speak(newState ? "Child lock enabled." : "Child lock disabled.");
  };

  const resetOverVoltageWarning = () => {
    setOverVoltageWarning(false);
    setIsPaused(false);
    pausedRef.current = false;
    speak("Voltage stabilized. Resuming charging.");
    triggerHaptic(50);
  };

  function handleEmergencyStop() {
    if (childLockEnabled) {
      speak("Child lock enabled. Emergency stop disabled.");
      triggerHaptic(50);
      return;
    }
    setShowEmergencyConfirm(true);
  }

  const confirmEmergencyStop = () => {
    completedRef.current = true;
    if (intervalRef.current) clearInterval(intervalRef.current);
    triggerHaptic([100, 50, 100, 50, 100]);
    speak("Charging stopped for safety.");
    beep(400);
    setShowEmergencyConfirm(false);
    setTimeout(() => handleSessionComplete('emergency_stop'), 500);
  };


  // --- EFFECT HOOKS ---

  // Dedicated effect for initial announcement (Senior debugging fix)
  useEffect(() => {
    if (spokeStartRef.current) return;
    spokeStartRef.current = true;

    const startChargingVoice = () => {
      // 1. Pause microphone to avoid synthesis interference
      window.dispatchEvent(new Event("voltcharge-pause-mic"));

      // 2. Small delay ensures recognition processes the pause before TTS starts
      setTimeout(() => {
        const text = "Charging started. Your vehicle is now charging.";
        speak(text, () => {
          // 3. Resume microphone automatically AFTER speech finishes
          window.dispatchEvent(new Event("voltcharge-resume-mic"));
        });
        setSmsMessage("SMS sent: Charging started.");
      }, 500);
    };

    // Ensure speechSynthesis voices are loaded (critical for reliable playback)
    if (window.speechSynthesis.getVoices().length > 0) {
      startChargingVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        startChargingVoice();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  useEffect(() => {
    const handleVoiceAction = (e) => {
      handleVoiceCommand(e.detail);
    };

    window.addEventListener('voltcharge-voice-action', handleVoiceAction);
    return () => {
      window.removeEventListener('voltcharge-voice-action', handleVoiceAction);
    };
  }, [handleVoiceCommand]);

  // keep pausedRef in sync with isPaused state
  useEffect(() => { pausedRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
    // start charging
    beep(500);
    setTimeout(() => triggerHapticWithFeedback([100, 50, 100, 50, 100]), 0);

    intervalRef.current = setInterval(() => {
      setProgress(prev => {
        if (pausedRef.current) return prev;
        if (completedRef.current) return prev;

        const newProgress = +(prev + 0.2).toFixed(3);

        // Pre-completion beep (near 100%, 5% remaining)
        if (!preBeepRef.current && (100 - newProgress) <= 5 && newProgress < 100) {
          preBeepRef.current = true;
          // long, high-volume beep
          beep(1200);
          triggerHapticWithFeedback([120, 60]);
        }

        // Near-complete beep (very close to 100%)
        if (!nearBeepRef.current && newProgress >= 98 && newProgress < 100) {
          nearBeepRef.current = true;
          beep(1500);
          triggerHapticWithFeedback([150, 80]);
        }

        // completion
        if (newProgress >= 100) {
          completedRef.current = true;
          clearInterval(intervalRef.current);
          beep(2000);
          setSmsMessage("SMS sent: Charging completed.");
          //speak("Charging completed"); // Task says "Charging stopped. Please unplug the cable." should be spoken before payment.
          triggerHapticWithFeedback([150, 50, 150]);

          if (!hasAnnouncedFinalVoice) {
            setHasAnnouncedFinalVoice(true);
            speak("Charging stopped. Please unplug the cable.", () => {
              setTimeout(() => handleSessionComplete('complete'), 1000);
            });
          }
          return 100;
        }

        // 80% Pause Logic - run once
        if (newProgress >= 80 && !spoke80Ref.current) {
          spoke80Ref.current = true;
          setIsPaused(true);
          pausedRef.current = true;
          setShow80Modal(true);
          setAwaiting80Decision(true);
          triggerHapticWithFeedback([100, 50, 100]);
          speak("Battery has reached 80 percent. Say Continue to charge to 100 percent or say Stop charging.");
          setSmsMessage("SMS sent: Charging 80% complete.");
          setIsListening80(true);
          return 80;
        }

        // Haptic trigger every 5%
        const nextFloor = Math.floor(newProgress);
        const prevFloor = Math.floor(prev);
        if (nextFloor !== prevFloor && nextFloor % 5 === 0) {
          triggerHapticWithFeedback(30);
        }

        return newProgress;
      });
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [handleSessionComplete, triggerHapticWithFeedback]);


  return (
    <div className="relative flex gap-6 items-start justify-center w-full h-full max-w-7xl mx-auto overflow-visible px-4 pt-24 py-8">
      {/* LEFT SIDE SMS DASHBOARD */}
      <SmsDashboard batteryLevel={progress} smsMessage={smsMessage} />

      {/* Main Charging UI Content */}
      <div className="flex-1 min-w-[500px] flex flex-col items-center relative">

        {/* MODE INDICATOR - TOP */}
        <div className={`absolute top-24 left-0 right-0 mx-auto w-fit px-6 py-2 rounded-full border-2 font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${mode === 'fast'
          ? 'border-cyan-400 bg-cyan-400/10 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]'
          : 'border-green-500 bg-green-500/10 text-green-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          }`}>
          <Zap size={14} />
          {mode === 'fast' ? 'FAST CHARGE MODE' : 'NORMAL CHARGE MODE'}
        </div>

        {/* EMERGENCY STOP CONFIRMATION */}
        <AnimatePresence>
          {showEmergencyConfirm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
              <Card className="text-center border-red-600 w-96">
                <h2 className="mb-4 text-2xl font-bold text-red-500">⚠️ Emergency Stop</h2>
                <p className="mb-6 text-slate-400">Are you sure you want to stop charging immediately?</p>
                <div className="space-y-3">
                  <Button onClick={confirmEmergencyStop} variant="danger">YES, STOP NOW</Button>
                  <Button onClick={() => { setShowEmergencyConfirm(false); }} variant="secondary">CANCEL</Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>


        {/* 80% Modal Overlay */}
        <AnimatePresence>
          {show80Modal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
              <Card className="text-center w-96 border-volt-cyan">
                <h2 className="mb-4 text-2xl font-bold text-volt-cyan">80% Limit Reached</h2>
                <p className="mb-6 text-slate-400">Battery has reached 80 percent.</p>
                <div className="space-y-3">
                  <Button onClick={() => { setShow80Modal(false); setAwaiting80Decision(false); setIsPaused(false); pausedRef.current = false; speak("Continuing to full charge."); }}>CONTINUE TO 100%</Button>
                  <Button variant="danger" onClick={() => { setShow80Modal(false); setAwaiting80Decision(false); setShowStopConfirm(true); if (!spokeStopRef.current) { spokeStopRef.current = true; speak("Are you sure you want to stop charging? Say Yes to stop or say Continue charging to resume."); } }}>STOP CHARGING</Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stop Confirmation Modal Overlay */}
        <AnimatePresence>
          {showStopConfirm && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
              <Card className="text-center w-96 border-red-500">
                <h2 className="mb-4 text-2xl font-bold text-red-500">Confirm Stop</h2>
                <p className="mb-6 text-slate-400">Are you sure you want to stop charging? Say Yes to stop or say Continue charging to resume.</p>
                <div className="space-y-3">
                  <Button variant="danger" onClick={() => { completedRef.current = true; if (intervalRef.current) clearInterval(intervalRef.current); speak("Charging stopped."); setSmsMessage("SMS sent: Charging completed."); setTimeout(() => handleSessionComplete('user_stop'), 500); }}>YES, STOP</Button>
                  <Button variant="secondary" onClick={() => { setShowStopConfirm(false); spokeStopRef.current = false; setIsPaused(false); pausedRef.current = false; speak("Resuming charging."); }}>CONTINUE CHARGING</Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Ring - MODE ADAPTIVE */}
        <div className={`relative flex items-center justify-center ${userMode === 'ELDERLY' ? 'w-96 h-96 mb-12' : (userMode === 'EXPERT' ? 'w-72 h-72 mb-6' : 'w-80 h-80 mb-8')}`}>
          <svg className="w-full h-full -rotate-90">
            <circle cx={userMode === 'ELDERLY' ? 192 : (userMode === 'EXPERT' ? 144 : 160)} cy={userMode === 'ELDERLY' ? 192 : (userMode === 'EXPERT' ? 144 : 160)} r={userMode === 'ELDERLY' ? 160 : (userMode === 'EXPERT' ? 120 : 140)} stroke="#0f172a" strokeWidth="12" fill="none" />
            <circle
              cx={userMode === 'ELDERLY' ? 192 : (userMode === 'EXPERT' ? 144 : 160)}
              cy={userMode === 'ELDERLY' ? 192 : (userMode === 'EXPERT' ? 144 : 160)}
              r={userMode === 'ELDERLY' ? 160 : (userMode === 'EXPERT' ? 120 : 140)}
              stroke="#22d3ee" strokeWidth="12" fill="none"
              strokeDasharray={userMode === 'ELDERLY' ? 1005 : (userMode === 'EXPERT' ? 753.98 : 879.6)}
              strokeDashoffset={userMode === 'ELDERLY' ? 1005 - (1005 * progress) / 100 : (userMode === 'EXPERT' ? 753.98 - (753.98 * progress) / 100 : 879.6 - (879.6 * progress) / 100)}
              strokeLinecap="round"
              className="drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] transition-all duration-300"
            />
          </svg>
          <div className="absolute text-center">
            <span className={`font-bold font-mono block ${userMode === 'ELDERLY' ? 'text-8xl' : (userMode === 'EXPERT' ? 'text-5xl' : 'text-7xl')}`}>{Math.floor(progress)}<span className={userMode === 'ELDERLY' ? 'text-4xl' : 'text-2xl'}>%</span></span>
            <div className={`uppercase tracking-tighter text-[10px] font-bold ${mode === 'fast' ? 'text-cyan-400' : 'text-green-500'} mb-1`}>
              {mode === 'fast' ? 'Fast Charging Enabled' : 'Normal Charging Enabled'}
            </div>
            <span className={`uppercase tracking-widest text-volt-cyan ${userMode === 'ELDERLY' ? 'text-lg' : (userMode === 'EXPERT' ? 'text-xs' : 'text-sm')} animate-pulse`}>
              {userMode === 'GUIDED' ? 'Charging...' : (userMode === 'ELDERLY' ? 'CHARGING IN PROGRESS' : 'Charging')}
            </span>
          </div>
        </div>

        {userMode !== 'EXPERT' && (
          <div className={`bg-volt-navy/50 px-4 py-2 rounded-full border border-white/5 mb-8 flex items-center gap-2 ${userMode === 'ELDERLY' ? 'px-6 py-3' : ''}`}>
            <motion.div
              animate={hapticTriggered ? { scale: [1, 1.3, 0.9, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`w-3 h-3 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.6)] ${hapticTriggered ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-volt-cyan'}`}
            ></motion.div>
            <span className={`text-slate-400 ${userMode === 'ELDERLY' ? 'text-base' : 'text-xs'}`}>Haptic Feedback Active</span>
          </div>
        )}

        {/* Linear Bar */}
        {userMode !== 'EXPERT' && (
          <>
            <div className={`w-full max-w-xl ${userMode === 'ELDERLY' ? 'h-4' : 'h-2'} bg-slate-800 rounded-full ${userMode === 'ELDERLY' ? 'mb-4' : 'mb-2'} overflow-hidden`}>
              <div className="h-full bg-volt-cyan" style={{ width: `${progress}%` }}></div>
            </div>
            <div className={`w-full max-w-xl flex justify-between text-slate-500 ${userMode === 'ELDERLY' ? 'text-lg mb-16' : 'text-xs mb-12'}`}>
              <span>Battery Level</span>
              <span>{Math.floor(progress)} / 100 kWh</span>
            </div>
          </>
        )}

        {/* Stats Grid */}
        <div className="grid w-full grid-cols-3 gap-4 mb-8">
          <Card className="flex flex-col items-center py-4">
            <Clock size={20} className="mb-2 text-volt-cyan" />
            <span className="font-mono text-xl font-bold">{Math.max(0, Math.floor((100 - progress) * 0.5))} min</span>
            <span className="text-[10px] text-slate-500 uppercase">Remaining</span>
          </Card>
          <Card className="flex flex-col items-center py-4">
            <Zap size={20} className="mb-2 text-volt-green" />
            <span className="font-mono text-xl font-bold">{mode === 'fast' ? '150' : '50'} kW</span>
            <span className="text-[10px] text-slate-500 uppercase">Power</span>
          </Card>
          <Card className="flex flex-col items-center py-4">
            <span className="text-lg font-bold text-volt-cyan">$</span>
            <span className="font-mono text-xl font-bold">{(progress * 0.45).toFixed(2)}</span>
            <span className="text-[10px] text-slate-500 uppercase">Cost</span>
          </Card>
        </div>

        {/* SAFETY FEATURES PANEL */}
        <div className="w-full max-w-3xl p-6 mb-8 border bg-volt-navy/40 border-white/5 rounded-2xl">
          <h3 className="mb-4 text-sm font-bold tracking-widest uppercase text-slate-300">Safety Features</h3>

          <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
            {/* Over Voltage Warning Card */}
            <motion.div
              className={`p-4 rounded-lg border-2 transition-all ${overVoltageWarning
                ? 'border-red-600 bg-red-950/30 shadow-[0_0_20px_rgba(220,38,38,0.3)]'
                : 'border-green-600 bg-green-950/20'
                }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold">{overVoltageWarning ? '⚠️ Over Voltage' : '✓ Voltage Safe'}</span>
                <span className={`text-xs font-mono ${overVoltageWarning ? 'text-red-400' : 'text-green-400'}`}>
                  {overVoltageWarning ? '420V' : '400V'}
                </span>
              </div>
              <p className="mb-3 text-xs text-slate-400">
                {overVoltageWarning ? 'Over voltage detected. Charging paused.' : 'Voltage within safe limits'}
              </p>
              {overVoltageWarning && (
                <Button onClick={resetOverVoltageWarning} variant="secondary" className="py-2 text-xs">
                  Reset
                </Button>
              )}
            </motion.div>

            {/* Child Lock Toggle */}
            <div className="flex flex-col justify-between p-4 border-2 rounded-lg border-white/10 bg-volt-navy/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Child Lock Mode</span>
                  {childLockEnabled && <Lock size={16} className="text-yellow-500" />}
                </div>
                <p className="mb-3 text-xs text-slate-400">
                  {childLockEnabled ? 'Disabled: Stop & Mode buttons' : 'Safety lock for critical controls'}
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleChildLock}
                className={`w-full py-2 px-3 rounded-lg font-bold text-xs uppercase transition-all ${childLockEnabled
                  ? 'bg-yellow-900/40 border border-yellow-600 text-yellow-400'
                  : 'bg-slate-700/40 border border-white/10 text-slate-300 hover:bg-slate-700/60'
                  }`}
              >
                {childLockEnabled ? '🔒 UNLOCK' : '🔓 LOCK'}
              </motion.button>
            </div>
          </div>

          {/* Emergency Stop Button */}
          <motion.button
            whileHover={!childLockEnabled ? { scale: 1.02 } : {}}
            whileTap={!childLockEnabled ? { scale: 0.98 } : {}}
            onClick={handleEmergencyStop}
            disabled={childLockEnabled}
            className={`w-full py-4 rounded-xl font-bold text-white uppercase tracking-wider transition-all ${childLockEnabled
              ? 'bg-slate-700/30 border-2 border-slate-600 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-red-800 to-red-600 border-2 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]'
              }`}
          >
            🛑 Emergency Stop
          </motion.button>
        </div>

        <Button
          variant="danger"
          onClick={() => {
            if (!showStopConfirm) {
              setShowStopConfirm(true);
              setIsPaused(true);
              pausedRef.current = true;
              if (!spokeStopRef.current) {
                spokeStopRef.current = true;
                speak("Are you sure you want to stop charging? Say Yes to stop or say Continue charging to resume.");
              }
            }
          }}
          className={`w-full max-w-md ${userMode === 'ELDERLY' ? 'py-6 text-3xl' : (userMode === 'GUIDED' ? 'py-6 text-2xl' : 'py-6 text-2xl')}`}
          disabled={childLockEnabled}
        >
          {userMode === 'ELDERLY' ? '🛑 STOP' : 'STOP CHARGING'}
        </Button>
      </div>

      {/* Haptic Toast Notifications + Voice Mic */}
      <AnimatePresence>
        {hapticToasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-24 right-8 bg-gradient-to-r from-volt-cyan to-volt-green text-black px-4 py-3 rounded-lg font-bold text-sm shadow-[0_0_20px_rgba(34,211,238,0.5)]"
          >
            ⚡ Haptic Feedback Triggered
          </motion.div>
        ))}

        {/* Voice message display */}
        {voiceMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed px-4 py-2 text-sm border rounded-lg bottom-40 right-8 bg-volt-navy/80 border-white/5"
          >
            {voiceMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Microphone UI Removed as per requirements for continuous background listening */}
    </div>
  );
};

// 5. ERROR SCREEN - CONNECTOR ERROR
const ErrorScreen = ({ onRetry, onHome }) => {
  useEffect(() => {
    triggerHaptic([100, 50, 100, 50, 100, 50, 100]);
    speak("Connection error. Connector not detected.");
    beep(300);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl mx-auto">
      <motion.div
        animate={{ scale: [1, 1.1, 0.95, 1.05, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-red-950 border-2 border-volt-red flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(239,68,68,0.6)]"
      >
        <AlertTriangle size={48} className="text-volt-red animate-pulse" />
      </motion.div>

      <h2 className="mb-2 text-3xl font-bold text-volt-red">⚠️ Connector Error</h2>
      <p className="mb-8 text-lg text-slate-300">Connector not detected. Please reconnect cable.</p>

      <div className="w-full p-6 mb-8 text-left border-l-4 rounded-lg bg-red-950/40 border-volt-red">
        <h3 className="mb-3 font-bold text-volt-red">Error Code: E-CCS-001</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-volt-red">⚡</span>
            <span>Cable may not be fully inserted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-volt-red">⚡</span>
            <span>Incompatible vehicle connector</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-volt-red">⚡</span>
            <span>Port obstruction detected</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full p-6 mb-8 border rounded-lg bg-volt-navy/60 border-white/10">
        <span className="mb-4 text-sm font-bold">🔌 Check Cable Connection</span>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
          <ArrowRight className="rotate-180 text-volt-red" size={28} />
        </motion.div>
        <span className="mt-4 text-xs text-center text-slate-400">Remove and reconnect the cable firmly until you hear a click</span>
      </div>

      <div className="flex w-full gap-4">
        <Button onClick={onRetry} variant="primary" className="flex-1">Retry Connection</Button>
        <Button
          onClick={() => {
            incrementHelp();
            onHome();
          }}
          variant="secondary"
          className="flex-1"
        >
          Help
        </Button>
      </div>
    </div>
  );
};

// ERROR SCREEN - NETWORK ERROR
const NetworkErrorScreen = ({ onRetry, onHome }) => {
  useEffect(() => {
    triggerHaptic(50);
    speak("Network unavailable. Please wait or try again.");
    beep(400);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl mx-auto">
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-orange-950 border-2 border-orange-500 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(249,115,22,0.4)]"
      >
        <Wifi size={48} className="text-orange-400" />
      </motion.div>

      <h2 className="mb-2 text-3xl font-bold text-orange-400">🌐 Network Error</h2>
      <p className="mb-8 text-lg text-slate-300">Network unavailable. Please wait or try again.</p>

      <div className="w-full p-6 mb-8 text-left border-l-4 border-orange-500 rounded-lg bg-orange-950/40">
        <h3 className="mb-3 font-bold text-orange-400">Error Code: E-NET-001</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-orange-400">📡</span>
            <span>No internet connection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400">📡</span>
            <span>Server temporarily unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-orange-400">📡</span>
            <span>Check WiFi or mobile signal</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full p-6 mb-8 border rounded-lg bg-volt-navy/60 border-white/10">
        <span className="mb-4 text-sm font-bold">⏳ Retrying in a moment...</span>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Wifi className="text-orange-400" size={28} />
        </motion.div>
      </div>

      <div className="flex w-full gap-4">
        <Button onClick={onRetry} variant="primary" className="flex-1">Retry Now</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Help</Button>
      </div>
    </div>
  );
};

// ERROR SCREEN - BATTERY OVERHEAT
const OverheatErrorScreen = ({ onRetry, onHome }) => {
  useEffect(() => {
    triggerHaptic([150, 100, 150]);
    speak("Battery temperature high. Charging paused for safety.");
    beep(350);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl mx-auto">
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-orange-950 border-2 border-orange-600 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(234,88,12,0.6)]"
      >
        <AlertTriangle size={48} className="text-orange-500" />
      </motion.div>

      <h2 className="mb-2 text-3xl font-bold text-orange-500">🔥 Battery Overheat</h2>
      <p className="mb-8 text-lg text-slate-300">Battery temperature high. Charging paused for safety.</p>

      <div className="w-full p-6 mb-8 text-left border-l-4 border-orange-600 rounded-lg bg-orange-950/40">
        <h3 className="mb-3 font-bold text-orange-500">Error Code: E-THERM-001</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-center gap-3 p-3 rounded bg-black/30">
            <span className="text-2xl">🌡️</span>
            <div>
              <div className="font-bold text-orange-400">Battery Temperature: 58°C</div>
              <div className="text-xs text-slate-400">Safe operating range: 15-45°C</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span>⏱️</span>
            <span>Charging will resume when temperature drops</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full p-6 mb-8 border rounded-lg bg-volt-navy/60 border-white/10">
        <span className="mb-4 text-sm font-bold">🔌 Allow Battery to Cool</span>
        <div className="text-xs text-center text-slate-400">
          Move vehicle to a shaded area or wait 15-20 minutes before resuming
        </div>
      </div>

      <div className="flex w-full gap-4">
        <Button onClick={onRetry} variant="primary" className="flex-1">Check Temperature</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Help</Button>
      </div>
    </div>
  );
};

// ERROR SCREEN - PAYMENT FAILURE
const PaymentErrorScreen = ({ onRetry, onHome }) => {
  useEffect(() => {
    triggerHaptic([100, 50, 100, 50, 100]);
    speak("Payment failed. Try another payment method.");
    beep(380);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl mx-auto">
      <motion.div
        animate={{ rotate: [0, -5, 5, -5, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-red-950 border-2 border-red-600 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
      >
        <X size={48} className="text-red-500" />
      </motion.div>

      <h2 className="mb-2 text-3xl font-bold text-red-500">💳 Payment Failed</h2>
      <p className="mb-8 text-lg text-slate-300">Payment failed. Try another method.</p>

      <div className="w-full p-6 mb-8 text-left border-l-4 border-red-600 rounded-lg bg-red-950/40">
        <h3 className="mb-3 font-bold text-red-500">Error Code: E-PAY-001</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-red-500">❌</span>
            <span>Card declined by issuer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">❌</span>
            <span>Insufficient funds</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">❌</span>
            <span>Payment gateway timeout</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full p-6 mb-8 border rounded-lg bg-volt-navy/60 border-white/10">
        <span className="mb-3 text-sm font-bold">💰 Try Another Payment Method</span>
        <div className="text-xs text-center text-slate-400">
          Use a different card, Apple Pay, or Google Pay to complete the transaction
        </div>
      </div>

      <div className="flex w-full gap-4">
        <Button onClick={onRetry} variant="primary" className="flex-1">Try Again</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Help</Button>
      </div>
    </div>
  );
};

// 5.5 CHARGING INTERRUPTED
const ChargingErrorScreen = ({ onRetry, onHome }) => {
  useEffect(() => {
    triggerHaptic([100, 50, 100, 50, 200]);
    speak("Charging interrupted. Power disconnected.");
    beep(500);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full max-w-3xl mx-auto">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 0.6, repeat: Infinity }}
        className="w-24 h-24 rounded-2xl bg-red-950 border-2 border-red-600 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
      >
        <AlertTriangle size={48} className="text-red-500" />
      </motion.div>

      <h2 className="mb-2 text-3xl font-bold text-red-500">⚠️ Charging Interrupted</h2>
      <p className="mb-8 text-lg text-slate-300">Power connection lost during charging</p>

      <div className="w-full p-6 mb-8 text-left border-l-4 border-red-600 rounded-lg bg-red-950/40">
        <h3 className="mb-3 font-bold text-red-500">Error Code: E-PWR-002</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-red-500">🔌</span>
            <span>Cable disconnected unexpectedly</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">🔌</span>
            <span>Power supply interrupted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500">🔌</span>
            <span>Vehicle moved during charging</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full p-6 mb-8 border rounded-lg bg-volt-navy/60 border-white/10">
        <span className="mb-4 text-sm font-bold">🔌 Reconnect and Retry</span>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
          <ArrowRight className="text-red-500 rotate-180" size={28} />
        </motion.div>
        <span className="mt-4 text-xs text-center text-slate-400">Ensure cable is firmly connected before retrying</span>
      </div>

      <div className="flex w-full gap-4">
        <Button onClick={onRetry} variant="primary" className="flex-1">Retry Charging</Button>
        <Button onClick={onHome} variant="secondary" className="flex-1">Help</Button>
      </div>
    </div>
  );
};

// 6. PAYMENT / COMPLETE
const PaymentScreen = ({ onHome, userMode }) => {
  useEffect(() => { speak("Charging completed successfully. Receipt sent."); }, []);

  const downloadReceipt = () => {
    const now = new Date();
    const receipt = `VoltCharge Receipt\nDate: ${now.toLocaleString()}\n\nTotal Energy: 42.5 kWh\nTime: 35 min\nTotal Paid: $19.12\n\nThank you for charging with VoltCharge.`;
    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `voltcharge-receipt-${now.getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    speak('Receipt downloaded.');
    triggerHaptic([80, 40]);
  };

  const [sessionSummary, setSessionSummary] = useState(null);
  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('voltcharge-session'));
      setTimeout(() => setSessionSummary(s), 0);
    } catch (e) { void e; }
  }, []);

  const titleSize = userMode === 'ELDERLY' ? 'text-5xl' : (userMode === 'GUIDED' ? 'text-4xl' : 'text-3xl');
  const textSize = userMode === 'ELDERLY' ? 'text-2xl' : (userMode === 'GUIDED' ? 'text-lg' : 'text-base');
  const spacing = userMode === 'ELDERLY' ? 'gap-8' : (userMode === 'GUIDED' ? 'gap-6' : 'gap-4');

  return (
    <div className={`flex flex-col h-full items-center justify-center max-w-2xl mx-auto w-full text-center ${spacing}`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 80 }}
        className={`rounded-full bg-volt-green/20 border border-volt-green flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] ${userMode === 'ELDERLY' ? 'w-40 h-40' : (userMode === 'GUIDED' ? 'w-32 h-32' : 'w-24 h-24')}`}
      >
        <CheckCircle2 size={userMode === 'ELDERLY' ? 80 : (userMode === 'GUIDED' ? 60 : 48)} className="text-volt-green" />
      </motion.div>

      <div>
        <h2 className={`${titleSize} font-bold mb-2`}>
          {userMode === 'GUIDED' ? 'Charging Complete!' : 'Charging Completed'}
        </h2>
        <p className={`text-volt-green font-semibold ${textSize}`}>Payment Successful</p>
      </div>

      <Card className={`w-full ${userMode === 'ELDERLY' ? 'p-8' : (userMode === 'GUIDED' ? 'p-6' : 'p-4')}`}>
        <div className={`flex justify-between ${userMode === 'ELDERLY' ? 'py-4 text-2xl' : (userMode === 'GUIDED' ? 'py-3 text-lg' : 'py-2')} border-b border-white/10`}>
          <span className="text-slate-400">Total Energy</span>
          <span className="font-mono font-bold">42.5 kWh</span>
        </div>
        <div className={`flex justify-between ${userMode === 'ELDERLY' ? 'py-4 text-2xl' : (userMode === 'GUIDED' ? 'py-3 text-lg' : 'py-2')} border-b border-white/10`}>
          <span className="text-slate-400">Duration</span>
          <span className="font-mono font-bold">35 min</span>
        </div>
        <div className={`flex justify-between ${userMode === 'ELDERLY' ? 'py-6 text-4xl' : (userMode === 'GUIDED' ? 'py-4 text-2xl' : 'py-3 text-xl')} text-volt-cyan font-bold`}>
          <span>Total Paid</span>
          <span>$19.12</span>
        </div>
      </Card>

      <div className={`flex gap-4 w-full max-w-md flex-col md:flex-row ${userMode === 'ELDERLY' ? 'gap-6' : ''}`}>
        <Button
          onClick={downloadReceipt}
          variant="primary"
          className={`flex-1 ${userMode === 'ELDERLY' ? 'py-6 text-xl' : (userMode === 'GUIDED' ? 'py-5 text-lg' : '')}`}
        >
          {userMode === 'ELDERLY' ? '📄 RECEIPT' : 'Download Receipt'}
        </Button>
        <Button
          onClick={onHome}
          variant="secondary"
          className={`flex-1 ${userMode === 'ELDERLY' ? 'py-6 text-xl' : (userMode === 'GUIDED' ? 'py-5 text-lg' : '')}`}
        >
          {userMode === 'ELDERLY' ? '🏠 HOME' : 'Return Home'}
        </Button>
      </div>

      {userMode !== 'EXPERT' && (
        <div className={`mt-8 w-full max-w-md`}>
          <Card className={userMode === 'ELDERLY' ? 'p-8' : (userMode === 'GUIDED' ? 'p-6' : 'p-4')}>
            <div className={`font-bold mb-4 ${userMode === 'ELDERLY' ? 'text-2xl' : 'text-lg'}`}>Session Details</div>
            <div className={`space-y-3 ${userMode === 'ELDERLY' ? 'text-xl' : (userMode === 'GUIDED' ? 'text-base' : 'text-sm')}`}>
              <div className="flex justify-between text-slate-400">
                <span>Time Taken</span>
                <span className="font-mono font-bold text-white">{sessionSummary?.totalTime ? `${Math.floor(sessionSummary.totalTime / 1000)}s` : '--'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Actions</span>
                <span className="font-mono font-bold text-white">{sessionSummary?.interactions ?? '--'}</span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// 7. HISTORY
const HistoryScreen = ({ onBack, userMode }) => {
  const data = [
    { name: 'Mon', amt: 24 }, { name: 'Tue', amt: 13 },
    { name: 'Wed', amt: 38 }, { name: 'Thu', amt: 20 },
    { name: 'Fri', amt: 45 }, { name: 'Sat', amt: 30 }, { name: 'Sun', amt: 15 },
  ];

  const modeClasses = userMode === 'ELDERLY' ? 'text-2xl high-contrast' : (userMode === 'GUIDED' ? 'text-xl' : (userMode === 'EXPERT' ? 'text-sm compact-layout' : ''));
  return (
    <div className={`flex flex-col h-full p-4 max-w-4xl mx-auto w-full ${modeClasses}`}>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack}><ArrowRight className="rotate-180" /></button>
        <h2 className="text-2xl font-bold">Charging History</h2>
      </div>

      <Card className="h-64 mb-8">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
            <Bar dataKey="amt" fill="#06b6d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between p-4 border bg-volt-navy/40 rounded-xl border-white/5">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-volt-cyan/10">
                <Zap size={16} className="text-volt-cyan" />
              </div>
              <div>
                <div className="font-bold">Station {i}</div>
                <div className="text-xs text-slate-500">Today, 2:30 PM</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold">$12.50</div>
              <div className="text-xs text-slate-500">25 kWh</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isFirstTimeUser, setIsFirstTimeUser } = useUserFlow();
  const [chargingMode, setChargingMode] = useState('normal');
  const [userMode, setUserMode] = useState('STANDARD'); // STANDARD | GUIDED | ELDERLY | EXPERT
  const [mobileNumber, setMobileNumber] = useState('');
  const [showHelpDashboard, setShowHelpDashboard] = useState(false);
  const voice = useVoiceCommands();
  const prevScreenRef = useRef(null);
  const authAnnouncedRef = useRef(false);

  const incrementHelp = () => {
    setShowHelpDashboard(true);
  };

  // --- STOP SPEECH ON ROUTE CHANGE ---
  useEffect(() => {
    stopSpeaking();
  }, [location.pathname]);

  // --- AUTH SUCCESS ANNOUNCEMENT ON TRANSITION TO CABLE CONNECT ---
  useEffect(() => {
    const prev = prevScreenRef.current;
    if (location.pathname === '/cable-connect' && (prev === '/authentication' || prev === '/first-time-authentication')) {
      if (!authAnnouncedRef.current) {
        const announce = () => speak("Authentication successful.");
        if (window.speechSynthesis && window.speechSynthesis.speaking) {
          setTimeout(announce, 800);
        } else {
          announce();
        }
        authAnnouncedRef.current = true;
      }
    }
    prevScreenRef.current = location.pathname;
  }, [location.pathname]);
  // --- UNLOCK AUDIO FOR VOICE-TRIGGERED VIDEO PLAY ---
  useEffect(() => {
    const unlockAudio = () => {
      const dummy = new Audio();
      dummy.play().catch(() => { });
      window.removeEventListener("click", unlockAudio);
    };
    window.addEventListener("click", unlockAudio);
    return () => window.removeEventListener("click", unlockAudio);
  }, []);
  const recognitionRef = useRef(null);
  const hasStartedRef = useRef(false);
  const commandHandlerRef = useRef(null);
  const micPausedRef = useRef(false);
  const systemSpeakingRef = useRef(false);

  // --- CENTRAL COMMAND HANDLER ---
  const handleGlobalVoiceCommand = useCallback((command) => {
    console.log("USER SAID (Global Handler):", command, "| Path:", location.pathname);

    switch (location.pathname) {
      case "/":
        if (command.includes("yes")) {
          window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'yes' }));
          return;
        }
        if (command.includes("no")) {
          window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'no' }));
          return;
        }
        break;

      case "/guided-video":
        if (command.includes("play")) {
          window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'play' }));
          return;
        }
        if (command.includes("stop") || command.includes("pause")) {
          window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'stop' }));
          return;
        }
        if (command.includes("continue")) {
          window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'continue' }));
          navigate("/first-time-authentication");
          return;
        }
        break;

      case "/authentication":
      case "/first-time-authentication":
        window.dispatchEvent(new CustomEvent('voltcharge-voice-digits', { detail: command }));
        if (command.includes("authenticate")) {
          speak("Authentication successful.", () => {
            setTimeout(() => {
              navigate("/cable-connect");
            }, 300);
          });
          return;
        }
        break;

      case "/cable-connect":
        if (command.includes("continue")) {
          window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'continue' }));
          return;
        }
        break;

      case "/charging":
        if (command.includes("yes") || command.includes("stop")) {
          window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: command }));
          return;
        }
        if (command.includes("continue") || command.includes("no")) {
          window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: command }));
          return;
        }
        break;

      case "/mode-select":
        if (command.includes("fast")) {
          window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'fast' }));
          navigate('/authentication');
          return;
        }
        if (command.includes("normal")) {
          window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'normal' }));
          navigate('/authentication');
          return;
        }
        break;

      default:
        break;
    }

    // Global Commands
    if (command.includes('go back')) {
      navigate(-1);
    } else if (command.includes('confirm')) {
      window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'confirm' }));
    }
  }, [location.pathname, navigate]);

  // Keep ref in sync with latest handler
  useEffect(() => {
    commandHandlerRef.current = handleGlobalVoiceCommand;
  }, [handleGlobalVoiceCommand]);

  // --- SAFE START (no double start) ---
  const safeStart = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (hasStartedRef.current) return;

    try {
      recognition.start();
      hasStartedRef.current = true;
      console.log("Global voice recognition STARTED");
    } catch (e) {
      console.warn("Start prevented:", e);
    }
  }, []);
  useEffect(() => {
    const onSpeakStart = () => { systemSpeakingRef.current = true; };
    const onSpeakEnd = () => { systemSpeakingRef.current = false; };
    window.addEventListener("voltcharge-speaking-start", onSpeakStart);
    window.addEventListener("voltcharge-speaking-end", onSpeakEnd);
    return () => {
      window.removeEventListener("voltcharge-speaking-start", onSpeakStart);
      window.removeEventListener("voltcharge-speaking-end", onSpeakEnd);
    };
  }, []);

  // --- SAFE RESTART (delayed, prevents abort loop) ---
  const safeRestart = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    hasStartedRef.current = false;
    setTimeout(() => {
      try {
        recognition.start();
        hasStartedRef.current = true;
      } catch { }
    }, 800);
  }, []);

  // --- INITIALIZE RECOGNITION ONCE (empty deps = never recreated) ---
  useEffect(() => {
    if (recognitionRef.current) return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript =
        event.results[event.results.length - 1][0].transcript
          .toLowerCase()
          .trim();

      console.log("USER SAID:", transcript);

      if (commandHandlerRef.current) {
        commandHandlerRef.current(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.warn("Recognition error:", event.error);

      // DO NOT restart on 'aborted' — that causes the loop
      if (event.error === "aborted") return;

      safeRestart();
    };

    recognition.onend = () => {
      console.log("Recognition ended");
      if (!micPausedRef.current) {
        try {
          recognition.start();
          hasStartedRef.current = true;
          console.log("Recognition restarted automatically");
        } catch (e) {
          console.log("Recognition restart blocked");
        }
      } else {
        console.log("Recognition not restarted (mic paused intentionally)");
      }
    };

    recognitionRef.current = recognition;

    // request mic permission once
    navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => { });
  }, [safeRestart]);

  // --- START ONLY ONCE AFTER APP LOADS ---
  useEffect(() => {
    safeStart();
  }, [safeStart]);

  // --- GLOBAL MIC CONTROL (event-driven) ---
  useEffect(() => {
    const pauseMic = () => {
      micPausedRef.current = true;
      const rec = recognitionRef.current;
      if (rec) {
        try {
          hasStartedRef.current = false;
          rec.stop();
          console.log("Mic paused via event");
        } catch (e) { void e; }
      }
    };
    const resumeMic = () => {
      micPausedRef.current = false;
      hasStartedRef.current = false; // Force safeStart to actually start
      console.log("Mic resume requested via event");
      safeStart();
    };
    window.addEventListener('voltcharge-pause-mic', pauseMic);
    window.addEventListener('voltcharge-resume-mic', resumeMic);
    return () => {
      window.removeEventListener('voltcharge-pause-mic', pauseMic);
      window.removeEventListener('voltcharge-resume-mic', resumeMic);
    };
  }, [safeRestart]);

  // Recognition runs continuously. No start/stop on route change.

  useEffect(() => {
    const saved = localStorage.getItem('voltcharge-is-first-time');
    if (saved !== null) {
      setIsFirstTimeUser(saved === 'true');
    }
  }, [setIsFirstTimeUser]);

  const decideUserMode = (firstTime, interactionTime) => {
    // silent background decision
    if (firstTime) {
      setUserMode('GUIDED');
      return;
    }
    if ((interactionTime || 0) > 5000) {
      setUserMode('ELDERLY');
    } else {
      setUserMode('EXPERT');
    }
  };

  // Global voice command mapping (basic router) - listens for dispatched transcripts
  useEffect(() => {
    const onVoiceCmd = (e) => {
      const text = (e && e.detail || '').toString().toLowerCase();
      if (!text) return;
      if (text.includes('start charging')) {
        if (location.pathname === '/') navigate('/mode-select');
      } else if (text.includes('stop charging')) {
        try { window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'stop_charging' })); } catch (err) { void err; }
      } else if (text.includes('go back')) {
        navigate(-1);
      } else if (text.includes('confirm')) {
        try { window.dispatchEvent(new CustomEvent('voltcharge-voice-action', { detail: 'confirm' })); } catch (err) { void err; }
      } else if (text.includes('enter mobile')) {
        navigate('/authentication');
        try { window.dispatchEvent(new CustomEvent('voltcharge-focus-mobile')); } catch (err) { void err; }
      } else if (text.includes('clear')) {
        try { window.dispatchEvent(new CustomEvent('voltcharge-clear-mobile')); } catch (err) { void err; }
      }
    };
    window.addEventListener('voltcharge-voice-cmd', onVoiceCmd);
    return () => window.removeEventListener('voltcharge-voice-cmd', onVoiceCmd);
  }, [location.pathname, navigate]);

  // --- RENDER LOGIC MOVED TO JSX ROUTES ---

  return (
    <div className="flex flex-col min-h-screen font-sans text-white bg-hexagon">
      <Header voice={voice} />
      <div className="flex-1 px-4 pt-20 pb-8 overflow-visible overflow-y-auto">
        <AnimatePresence mode="wait">
          <ErrorBoundary>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Routes location={location}>
                <Route path="/" element={
                  <HomeScreen
                    onNext={(isFirst) => {
                      setIsFirstTimeUser(isFirst);
                      navigate(isFirst ? '/guided-video' : '/mode-select');
                    }}
                    onHistory={() => navigate('/history')}
                    decideUserMode={decideUserMode}
                    voice={voice}
                    userMode={userMode}
                    incrementHelp={incrementHelp}
                  />
                } />

                <Route path="/guided-video" element={<FirstTimeTutorial commandHandlerRef={commandHandlerRef} />} />
                <Route path="/help" element={<ErrorDashboard />} />

                <Route path="/first-time-authentication" element={
                  <FirstTimeNFCAuth
                    onNext={() => navigate('/cable-connect')}
                  />
                } />

                <Route path="/authentication" element={
                  <MainAuthentication
                    onNext={(mobile) => {
                      setMobileNumber(mobile);
                      navigate('/cable-connect');
                    }}
                  />
                } />

                <Route path="/mode-select" element={
                  <ChargingModeScreen
                    onFastCharge={() => { setChargingMode('fast'); navigate('/authentication'); }}
                    onNormalCharge={() => { setChargingMode('normal'); navigate('/authentication'); }}
                    userMode={userMode}
                  />
                } />

                <Route path="/cable-connect" element={
                  <CableConnectionScreen
                    onNext={() => navigate('/charging')}
                    userMode={userMode}
                  />
                } />

                <Route path="/charging" element={
                  <ChargingScreen
                    mode={chargingMode}
                    onComplete={() => navigate('/payment')}
                    onError={() => { prevScreenRef.current = '/charging'; navigate('/charging-error'); }}
                    voice={voice}
                    userMode={userMode}
                    isFirstTime={isFirstTimeUser}
                  />
                } />

                <Route path="/payment" element={<PaymentScreen onHome={() => navigate('/')} userMode={userMode} />} />
                <Route path="/history" element={<HistoryScreen onBack={() => navigate('/')} userMode={userMode} />} />

                {/* Error Screens */}
                <Route path="/charging-error" element={<ChargingErrorScreen onRetry={() => navigate('/charging')} onHome={() => navigate('/')} />} />
                <Route path="/overheat-error" element={<OverheatErrorScreen onRetry={() => navigate('/charging')} onHome={() => navigate('/')} />} />
                <Route path="/payment-error" element={<PaymentErrorScreen onRetry={() => navigate('/authentication')} onHome={() => navigate('/')} />} />
                <Route path="/network-error" element={<NetworkErrorScreen onRetry={() => navigate(-1)} onHome={() => navigate('/')} />} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </ErrorBoundary>
        </AnimatePresence>
      </div>
    </div>
  );
}
