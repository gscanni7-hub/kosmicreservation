import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getRegistrationById } from '../../lib/registrationService';
import { Registration } from '../../types';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import { CheckCircle2, AlertCircle, Download, Users, Calendar, MapPin } from 'lucide-react';

export default function TicketPage() {
  const { id } = useParams<{ id: string }>();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function load() {
      if (!id) { setNotFound(true); setLoading(false); return; }
      try {
        const reg = await getRegistrationById(id);
        if (!reg) { setNotFound(true); }
        else { setRegistration(reg); }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!registration || !canvasRef.current) return;
    const ticketUrl = `${window.location.origin}/ticket/${registration.id}`;
    QRCode.toCanvas(canvasRef.current, ticketUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#ffffff', light: '#000000' },
    });
  }, [registration]);

  const handleSave = () => {
    if (!canvasRef.current || !registration) return;
    const link = document.createElement('a');
    link.download = `biglietto-${registration.eventName.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#D4622A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !registration) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <AlertCircle size={40} className="text-[#EF4444] mx-auto" />
          <p className="text-white font-bold text-lg">Biglietto non trovato</p>
          <p className="text-[#666] text-sm">Questo biglietto non esiste o è stato rimosso.</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(registration.eventDate).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const isCheckedIn = registration.checkedIn;

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Ticket card */}
        <div className="relative bg-[#0a0a0a] border border-[#1e1e1e] overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-[#D4622A]" />

          {/* Status banner */}
          {isCheckedIn && (
            <div className="bg-[#22C55E]/10 border-b border-[#22C55E]/20 px-6 py-2.5 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[#22C55E]" />
              <span className="text-[#22C55E] text-[10px] font-mono uppercase tracking-widest">Entrato</span>
            </div>
          )}

          {/* Header */}
          <div className="px-6 pt-6 pb-4 text-center border-b border-dashed border-[#1e1e1e]">
            <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#D4622A] mb-2">
              {registration.venueName}
            </p>
            <h1
              className="text-2xl font-black uppercase leading-tight text-white"
              style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
            >
              {registration.eventName}
            </h1>
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-center gap-1.5 text-[#666] text-[10px] font-mono capitalize">
                <Calendar size={10} />
                {formattedDate}
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[#666] text-[10px] font-mono">
                <MapPin size={10} />
                {registration.venueName}
              </div>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center py-6 border-b border-dashed border-[#1e1e1e]">
            <canvas ref={canvasRef} className="rounded" />
            <p className="text-[9px] font-mono text-[#444] mt-3 uppercase tracking-widest">
              Mostra all'ingresso
            </p>
          </div>

          {/* Guest info */}
          <div className="px-6 py-4 border-b border-dashed border-[#1e1e1e]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-mono uppercase tracking-widest text-[#555] mb-0.5">Intestatario</p>
                <p className="text-sm font-bold text-white">
                  {registration.firstName} {registration.lastName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-mono uppercase tracking-widest text-[#555] mb-0.5">Persone</p>
                <div className="flex items-center gap-1 justify-end">
                  <Users size={12} className="text-[#D4622A]" />
                  <span className="text-sm font-bold text-white">{registration.guestsCount}</span>
                </div>
              </div>
            </div>
            {registration.prName && (
              <div className="mt-3 pt-3 border-t border-[#1a1a1a]">
                <p className="text-[8px] font-mono uppercase tracking-widest text-[#555] mb-0.5">Invitato da</p>
                <p className="text-xs text-[#888]">{registration.prName}</p>
              </div>
            )}
          </div>

          {/* Ticket ID */}
          <div className="px-6 py-3 flex items-center justify-between">
            <p className="text-[8px] font-mono text-[#333] uppercase tracking-widest">
              #{registration.id.slice(0, 8).toUpperCase()}
            </p>
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-[#D4622A]" />
              <p className="text-[8px] font-mono text-[#555] uppercase tracking-widest">Nightplan</p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <motion.button
          onClick={handleSave}
          whileTap={{ scale: 0.97 }}
          className="w-full mt-3 border border-[#2a2a2a] py-3.5 text-[#888] hover:text-white hover:border-[#3a3a3a] transition-colors flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest"
        >
          <Download size={13} />
          Salva biglietto
        </motion.button>

        <p className="text-center text-[9px] font-mono text-[#333] mt-4 uppercase tracking-widest">
          Powered by Nightplan
        </p>
      </motion.div>
    </div>
  );
}
