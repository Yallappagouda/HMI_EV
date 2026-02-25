import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wifi, Smartphone, AlertTriangle, Zap } from 'lucide-react';
import { speak, triggerHaptic, beep } from '../utils';
import { useCognitive } from '../hooks/useCognitiveEngine';
import { useUserFlow } from '../context/UserFlowContext';

const MainAuthentication = () => {
    const navigate = useNavigate();
    const { isFirstTimeUser } = useUserFlow();
    const { incrementError } = useCognitive();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const hasSpokenRef = useRef(false);
    const instructionSpokenRef = useRef(false);

    useEffect(() => {
        if (isFirstTimeUser === undefined) {
            navigate('/');
        }
    }, [isFirstTimeUser, navigate]);

    const [isVoiceActive, setIsVoiceActive] = useState(false);

    // Voice digit capture handled by global engine in App.jsx
    useEffect(() => {
        let accumulatedDigits = "";

        const handleVoiceDigits = (e) => {
            const transcript = e.detail || "";
            let digits = transcript.replace(/\D/g, "");
            if (!digits) return;

            setIsVoiceActive(true);
            accumulatedDigits += digits;

            if (accumulatedDigits.length > 10) {
                accumulatedDigits = accumulatedDigits.slice(-10);
            }

            const cleanNumber = accumulatedDigits.slice(0, 10);
            setPhone(cleanNumber);

            if (cleanNumber.length === 10) {
                setIsVoiceActive(false);
                speak("Number captured.");
            }
        };

        window.addEventListener('voltcharge-voice-digits', handleVoiceDigits);

        return () => {
            window.removeEventListener('voltcharge-voice-digits', handleVoiceDigits);
        };
    }, []);

    useEffect(() => {
        speak("Please tap your NFC card or authenticate using your mobile number.");
    }, []);

    useEffect(() => {
        if (isFirstTimeUser === null || isFirstTimeUser === undefined) return;
        if (isFirstTimeUser === false && !instructionSpokenRef.current) {
            instructionSpokenRef.current = true;
            setTimeout(() => {
                speak("After entering the mobile number, say authenticate or click on authenticate to move to cable connection.");
            }, 500);
        }
    }, [isFirstTimeUser]);

    const validatePhone = (value) => {
        return /^(\+?\d{1,3})?\d{10}$/.test(value.replace(/\s+/g, ''));
    };

    const handlePhoneAuth = () => {
        if (!validatePhone(phone)) {
            setError('Invalid format. Use 10-12 digits.');
            triggerHaptic([100, 50, 100]);
            incrementError();
            return;
        }
        if (hasSpokenRef.current) return;
        hasSpokenRef.current = true;
        speak('Authentication successful.', () => {
            setTimeout(() => {
                navigate('/cable-connect');
            }, 300);
        });
    };

    const handleNfcTap = () => {
        triggerHaptic(50);
        beep(400);
        if (hasSpokenRef.current) return;
        hasSpokenRef.current = true;
        speak('Authentication successful.', () => {
            setTimeout(() => {
                navigate('/cable-connect');
            }, 300);
        });
    };

    return (
        <div className="flex flex-col h-full justify-center px-8 max-w-5xl mx-auto w-full">
            <div className="mb-12">
                <h2 className="text-3xl font-bold font-sans text-glow mb-2">Authentication</h2>
                <p className="text-slate-400">Choose your preferred identification method</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch h-[400px]">
                {/* NFC Card */}
                <div
                    onClick={handleNfcTap}
                    className="p-8 rounded-3xl border border-white/5 bg-volt-navy/40 flex flex-col items-center justify-center cursor-pointer group hover:border-volt-cyan hover:bg-volt-navy/60 transition-all duration-300"
                >
                    <div className="w-32 h-32 rounded-full bg-volt-dark border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Wifi size={48} className="text-volt-cyan" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Tap Card</h3>
                    <p className="text-slate-500 text-sm">NFC Identification</p>
                </div>

                {/* OR Divider (Desktop only) */}
                <div className="absolute z-10 hidden md:flex flex-col items-center justify-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 mt-12">
                    <div className="h-16 w-[1px] bg-slate-700 mb-2"></div>
                    <span className="px-2 font-mono text-xs bg-volt-dark text-slate-500">OR</span>
                    <div className="h-16 w-[1px] bg-slate-700 mt-2"></div>
                </div>

                {/* Mobile Number */}
                <div className="p-8 rounded-3xl border border-white/5 bg-volt-navy/40 flex flex-col justify-center">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-volt-green/10 rounded-xl text-volt-green">
                            <Smartphone size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Mobile Number</h3>
                            <p className="text-slate-500 text-xs">Cardless Entry</p>
                        </div>
                    </div>

                    <div className="relative mb-6">
                        <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ''))}
                            placeholder="+91 99999 00000"
                            className={`w-full bg-black/40 border ${error ? 'border-red-500' : 'border-white/10 focus:border-volt-cyan'} rounded-2xl p-5 outline-none font-mono text-lg tracking-wider transition-all`}
                        />
                        {isVoiceActive && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <div className="flex gap-1 items-end h-4">
                                    <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-volt-cyan rounded-full" />
                                    <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.1 }} className="w-1 bg-volt-cyan rounded-full" />
                                    <motion.div animate={{ height: [4, 12, 4] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 bg-volt-cyan rounded-full" />
                                </div>
                                <span className="text-[10px] font-bold text-volt-cyan uppercase tracking-tighter">Listening</span>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-red-400 text-xs mb-4 px-2 tracking-wide font-medium">⚠️ {error}</p>}

                    <button
                        onClick={handlePhoneAuth}
                        className="w-full py-5 rounded-2xl bg-gradient-to-r from-volt-cyan to-volt-green text-black font-bold uppercase tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all"
                    >
                        Authenticate
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MainAuthentication;
