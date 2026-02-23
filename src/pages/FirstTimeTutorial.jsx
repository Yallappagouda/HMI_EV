import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Zap } from 'lucide-react';
import { speak, triggerHaptic } from '../utils';
import { useUserFlow } from '../context/UserFlowContext';

const FirstTimeTutorial = () => {
    console.log("Rendering FirstTimeTutorial from src/pages/FirstTimeTutorial.jsx");

    const navigate = useNavigate();
    const { isFirstTimeUser } = useUserFlow();
    const [videoEnded, setVideoEnded] = useState(false);

    const [videoError, setVideoError] = useState(false);
    const videoRef = useRef(null);

    useEffect(() => {
        speak(
            "Welcome to EV Charging Station. Please watch this short tutorial to understand how to charge your vehicle. You can say Play to start the video."
        );

        // Voice commands handled by global engine in App.jsx
        const handleVoiceAction = (e) => {
            const action = e.detail;
            if (action === 'play' && videoRef.current) {
                videoRef.current.play();
            }
            if (action === 'stop' && videoRef.current) {
                videoRef.current.pause();
            }
            if (action === 'continue' && videoEnded) {
                handleContinue();
            }
        };

        window.addEventListener('voltcharge-voice-action', handleVoiceAction);

        return () => {
            window.removeEventListener('voltcharge-voice-action', handleVoiceAction);
        };
    }, [videoEnded]);

    const handleContinue = () => {
        triggerHaptic(50);
        if (isFirstTimeUser) {
            navigate('/first-time-authentication');
        } else {
            navigate('/authentication');
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen w-full px-4 py-6">

            {/* HEADER */}
            <div className="mb-6 text-center">
                <div className="flex justify-center mb-2">
                    <div className="p-3 rounded-full bg-volt-cyan/10 border border-volt-cyan/30">
                        <Zap size={40} className="text-volt-cyan" />
                    </div>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-sans text-glow mb-2">
                    How It Works
                </h1>
                <p className="text-slate-400 text-base md:text-lg">
                    Quick guide to your first charging session
                </p>
            </div>

            {/* VIDEO + BUTTON CONTAINER */}
            <div className="w-full max-w-5xl flex flex-col items-center">

                {/* VIDEO SECTION */}
                <div className="w-full rounded-3xl overflow-hidden border-2 border-volt-cyan/30 shadow-[0_0_40px_rgba(34,211,238,0.2)] bg-black">

                    {!videoError ? (
                        <video
                            ref={videoRef}
                            src="/tutorial.mp4"
                            controls
                            playsInline
                            onEnded={() => {
                                setVideoEnded(true);
                                speak(
                                    "Tutorial complete. You can now press the Continue button or say Continue."
                                );
                            }}
                            onError={() => {
                                setVideoError(true);
                                speak(
                                    "Tutorial Video Unreachable. You can click continue to proceed manually."
                                );
                                setVideoEnded(true);
                            }}
                            className="w-full h-auto object-contain bg-black"
                        />
                    ) : (
                        <div className="w-full h-64 flex flex-col items-center justify-center p-8 text-center bg-red-950/10">
                            <AlertTriangle size={64} className="text-red-500 mb-6" />
                            <h2 className="text-xl md:text-2xl font-bold mb-4">
                                Tutorial Video Unreachable
                            </h2>
                            <p className="text-slate-400 max-w-md">
                                We couldn't load the instruction video, but you can still proceed with the charging setup.
                            </p>
                        </div>
                    )}
                </div>

                {/* CONTINUE BUTTON */}
                <div className="w-full mt-6">
                    <button
                        onClick={handleContinue}
                        disabled={!videoEnded}
                        className={`w-full py-4 md:py-5 px-6 rounded-2xl font-bold text-lg md:text-xl uppercase tracking-widest transition-all duration-300
                        ${videoEnded
                                ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-green-400 text-black shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:scale-105'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                    >
                        {videoEnded ? 'CONTINUE' : 'WATCH TUTORIAL TO CONTINUE'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default FirstTimeTutorial;