import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, AlertTriangle } from 'lucide-react';
import { speak, triggerHaptic, beep } from '../utils';
import { useCognitive } from '../hooks/useCognitiveEngine';
import { useUserFlow } from '../context/UserFlowContext';

const FirstTimeNFCAuth = () => {
    const navigate = useNavigate();
    const { isFirstTimeUser } = useUserFlow();
    const { incrementError } = useCognitive();
    const [error, setError] = useState('');

    useEffect(() => {
        if (isFirstTimeUser === undefined || isFirstTimeUser === false) {
            navigate('/');
        }
        speak('Please tap your NFC card to authenticate.');
    }, [isFirstTimeUser, navigate]);

    const handleNfcTap = () => {
        try {
            triggerHaptic(50);
            beep(400);
            speak('Card recognized. Proceeding to cable connection.');
            setTimeout(() => {
                navigate('/cable-connect');
            }, 500);
        } catch (err) {
            setError('Could not process card. Please try again.');
            triggerHaptic([100, 50, 100]);
            incrementError();
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-full px-8 max-w-2xl mx-auto w-full">
            <div className="mb-12 text-center w-full">
                <div className="inline-block px-4 py-1 rounded-full bg-volt-cyan/10 border border-volt-cyan/30 text-volt-cyan text-xs font-bold mb-6 uppercase tracking-widest">
                    First-Time Setup
                </div>
                <h2 className="text-4xl font-bold font-sans text-glow mb-4">Identity Verification</h2>
                <p className="text-slate-400 text-lg">Please tap your NFC charging card to continue</p>
            </div>

            <div
                onClick={handleNfcTap}
                className="w-full p-12 aspect-square max-w-sm rounded-[3rem] border-2 border-volt-cyan/20 bg-volt-navy/40 flex flex-col items-center justify-center cursor-pointer group hover:border-volt-cyan hover:bg-volt-navy/60 transition-all duration-500 shadow-[0_0_30px_rgba(34,211,238,0.1)] hover:shadow-[0_0_50px_rgba(34,211,238,0.2)]"
            >
                <div className="w-48 h-48 rounded-full bg-volt-dark border border-white/5 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 rounded-full bg-volt-cyan/10 animate-ping"></div>
                    <Wifi size={80} className="text-volt-cyan relative z-10" />
                </div>
                <h3 className="text-3xl font-bold mb-3">Tap Card</h3>
                <p className="text-slate-500 text-lg">Contactless RFID Reader</p>
            </div>

            {error && (
                <div className="mt-8 p-4 bg-red-950/30 border border-red-900/50 rounded-2xl flex items-center gap-4 text-red-400 w-full max-w-sm animate-shake">
                    <AlertTriangle size={24} />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            <div className="mt-12 text-slate-500 text-sm italic">
                Ensure your card is held firmly against the reader circle.
            </div>
        </div>
    );
};

export default FirstTimeNFCAuth;
