import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone } from 'lucide-react';

const SmsDashboard = ({ batteryLevel, smsMessage }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block w-80 max-w-[22rem] flex-shrink-0 bg-slate-900/40 rounded-3xl p-6 border-2 border-volt-cyan/30 shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-xl relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-volt-cyan shadow-[0_0_10px_rgba(34,211,238,0.5)]"></div>

            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-volt-cyan/20 flex items-center justify-center text-volt-cyan shadow-inner">
                    <Smartphone size={24} />
                </div>
                <div>
                    <div className="text-lg font-bold text-white flex items-center gap-2">
                        📩 SMS Updates
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Live Simulation</div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-slate-300 shadow-lg">
                    <p className="text-sm leading-relaxed italic text-slate-400 mb-2">
                        "Charging updates will be sent to your registered mobile number."
                    </p>
                    <div className="text-[10px] opacity-40 text-right uppercase font-bold tracking-tighter">System Message</div>
                </div>

                {smsMessage && (
                    <motion.div
                        key={smsMessage + Date.now()}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="p-4 rounded-2xl bg-volt-cyan/10 border border-volt-cyan/30 text-volt-cyan shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                    >
                        <p className="text-sm font-bold">
                            {smsMessage}
                        </p>
                        <div className="text-[10px] mt-2 opacity-60 text-right uppercase font-mono">Sent Now</div>
                    </motion.div>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>MOBILE CONNECTED</span>
                <span className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-volt-cyan shadow-[0_0_5px_rgba(34,211,238,0.8)]"></span>
                    <span className="w-1 h-1 rounded-full bg-volt-cyan/40"></span>
                    <span className="w-1 h-1 rounded-full bg-volt-cyan/20"></span>
                </span>
            </div>
        </motion.div>
    );
};

export default SmsDashboard;



