import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Zap } from 'lucide-react';
import { speak, triggerHaptic } from '../utils';
import { useUserFlow } from '../context/UserFlowContext';

const FirstTimeTutorial = ({ commandHandlerRef }) => {
    console.log("Rendering FirstTimeTutorial");

    const navigate = useNavigate();
    const { isFirstTimeUser } = useUserFlow();

    const [videoEnded, setVideoEnded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [videoError, setVideoError] = useState(false);

    const videoRef = useRef(null);
    const hasInitializedRef = useRef(false);

    // ✅ Speak once safely (StrictMode safe)
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        const timer = setTimeout(() => {
            speak(
                "Watch the quick guide then tap or say continue to move authentication",
                () => {
                    // Autoplay after speech
                    if (videoRef.current) {
                        videoRef.current.muted = true; // autoplay safe
                        videoRef.current.play()
                            .then(() => {
                                setIsPlaying(true);
                                setTimeout(() => {
                                    if (videoRef.current) {
                                        videoRef.current.muted = false;
                                    }
                                }, 800);
                            })
                            .catch(() => { });
                    }
                }
            );
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    // ✅ Voice Commands (NO new recognition)
    useEffect(() => {
        if (!commandHandlerRef) return;

        commandHandlerRef.current = (transcript) => {
            const command = (transcript || '').toLowerCase();

            if (command.includes('play')) {
                videoRef.current?.play().catch(() => { });
                setIsPlaying(true);
            }

            if (command.includes('pause')) {
                videoRef.current?.pause();
                setIsPlaying(false);
            }

            if (command.includes('continue')) {
                handleContinue();
            }
        };

        return () => { };
    }, [navigate, commandHandlerRef]);

    const handleContinue = () => {
        triggerHaptic(50);

        if (isFirstTimeUser) {
            navigate('/first-time-authentication');
        } else {
            navigate('/authentication');
        }
    };

    const handlePlayOverlay = () => {
        if (videoRef.current) {
            videoRef.current.play().catch(() => { });
            setIsPlaying(true);
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
                <div className="w-full rounded-3xl overflow-hidden border-2 border-volt-cyan/30 shadow-[0_0_40px_rgba(34,211,238,0.2)] bg-black relative">

                    {!videoError ? (
                        <>
                            <video
                                ref={videoRef}
                                src="/tutorial.mp4"
                                controls={false}
                                playsInline
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onEnded={() => {
                                    setVideoEnded(true);
                                    speak(
                                        "Tutorial complete. You can now press the Continue button or say Continue."
                                    );
                                }}
                                onError={() => {
                                    setVideoError(true);
                                    setVideoEnded(true);
                                    speak(
                                        "Tutorial video unreachable. You can press continue to proceed manually."
                                    );
                                }}
                                className="w-full h-auto object-contain bg-black"
                            />

                            {!isPlaying && !videoError && (
                                <button
                                    onClick={handlePlayOverlay}
                                    className="absolute inset-0 flex items-center justify-center text-4xl md:text-5xl text-white/90 hover:text-white transition-colors z-10"
                                    aria-label="Play tutorial video"
                                >
                                    <span className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-volt-cyan/20 border border-volt-cyan shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                                        ▶
                                    </span>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-64 flex flex-col items-center justify-center p-8 text-center bg-red-950/10">
                            <AlertTriangle size={64} className="text-red-500 mb-6" />
                            <h2 className="text-xl md:text-2xl font-bold mb-4">
                                Tutorial Video Unreachable
                            </h2>
                            <p className="text-slate-400 max-w-md">
                                We couldn't load the instruction video, but you can still proceed.
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