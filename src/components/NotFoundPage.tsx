import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center max-w-sm"
      >
        <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#D4622A] mb-6">Nightplan</p>
        <div className="hv font-black text-white leading-none mb-4" style={{ fontSize: 96 }}>404</div>
        <p className="text-[#555] text-sm mb-8">Questa pagina non esiste o il link non è valido.</p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3.5 bg-[#D4622A] text-black text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors"
        >
          Torna all'app
        </button>
      </motion.div>
    </div>
  );
}
