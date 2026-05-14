import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { getRegistrationsByEvent, checkInRegistration, undoCheckInRegistration } from '../../lib/registrationService';
import { Registration, Event } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Users, ScanLine, X, ChevronDown, AlertCircle, Camera } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  activeEvent: Event | null;
}

export default function IngressiView({ activeEvent }: Props) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ ok: boolean; message: string; name?: string } | null>(null);
  const [showEntered, setShowEntered] = useState(false);
  const [search, setSearch] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';

  useEffect(() => {
    if (!activeEvent) return;
    setLoading(true);
    getRegistrationsByEvent(activeEvent.id)
      .then(setRegistrations)
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, [activeEvent]);

  const startScanner = async () => {
    setScanning(true);
    setScanResult(null);
    await new Promise(r => setTimeout(r, 100));

    const scanner = new Html5Qrcode(scannerDivId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          // decodedText is the ticket URL or registrationId
          const id = decodedText.includes('/ticket/') ? decodedText.split('/ticket/')[1] : decodedText;

          await stopScanner();

          const reg = registrations.find(r => r.id === id);
          if (!reg) {
            setScanResult({ ok: false, message: 'Biglietto non trovato in questo evento.' });
            return;
          }
          if (reg.checkedIn) {
            setScanResult({ ok: false, message: 'Già entrato.', name: `${reg.firstName} ${reg.lastName}` });
            return;
          }

          try {
            await checkInRegistration(id);
            setRegistrations(prev => prev.map(r => r.id === id ? { ...r, checkedIn: true, checkedInAt: new Date().toISOString() } : r));
            setScanResult({ ok: true, message: `Entrata registrata · ${reg.guestsCount} ${reg.guestsCount === 1 ? 'persona' : 'persone'}`, name: `${reg.firstName} ${reg.lastName}` });
          } catch {
            setScanResult({ ok: false, message: 'Errore durante il check-in. Riprova.' });
          }
        },
        () => { /* ignore decode errors */ }
      );
    } catch {
      setScanning(false);
      setScanResult({ ok: false, message: 'Impossibile accedere alla fotocamera.' });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch { /* already stopped */ }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUndoCheckIn = async (id: string) => {
    await undoCheckInRegistration(id);
    setRegistrations(prev => prev.map(r => r.id === id ? { ...r, checkedIn: false, checkedInAt: undefined } : r));
  };

  if (!activeEvent) {
    return (
      <div className="py-24 text-center">
        <ScanLine size={28} className="text-[#333] mx-auto mb-3" />
        <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#555]">Nessun evento attivo stasera</p>
      </div>
    );
  }

  const q = search.trim().toLowerCase();
  const filtered = registrations.filter(r =>
    !q || `${r.firstName} ${r.lastName}`.toLowerCase().includes(q) || (r.prName ?? '').toLowerCase().includes(q)
  );
  const pending = filtered.filter(r => !r.checkedIn);
  const entered = filtered.filter(r => r.checkedIn);
  const total = registrations.length;
  const checkedInCount = registrations.filter(r => r.checkedIn).length;

  return (
    <div className="max-w-xl mx-auto w-full">
      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-1 bg-[#222] overflow-hidden">
          <motion.div className="h-full bg-[#22C55E]" initial={{ width: 0 }}
            animate={{ width: total > 0 ? `${Math.round(checkedInCount / total * 100)}%` : '0%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }} />
        </div>
        <span className="hv font-black text-white text-sm shrink-0">
          {checkedInCount}<span className="text-[#555] font-normal text-xs">/{total}</span>
        </span>
      </div>

      {/* Scanner button */}
      <motion.button
        onClick={scanning ? stopScanner : startScanner}
        whileTap={{ scale: 0.97 }}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-4 mb-4 font-black uppercase tracking-widest text-xs transition-colors',
          scanning
            ? 'border border-[#333] text-[#666] hover:text-white hover:border-[#444]'
            : 'bg-[#D4622A] text-black hover:bg-white'
        )}
        style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
      >
        {scanning ? <><X size={14} /> Chiudi scanner</> : <><Camera size={14} /> Scannerizza QR</>}
      </motion.button>

      {/* QR reader div (hidden when not scanning) */}
      <div
        id={scannerDivId}
        className={cn('mb-4 overflow-hidden rounded', scanning ? 'block' : 'hidden')}
        style={{ width: '100%' }}
      />

      {/* Scan result */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={cn(
              'flex items-start gap-3 p-4 border mb-4',
              scanResult.ok
                ? 'bg-[#22C55E]/10 border-[#22C55E]/30'
                : 'bg-[#EF4444]/10 border-[#EF4444]/30'
            )}
          >
            {scanResult.ok
              ? <CheckCircle2 size={16} className="text-[#22C55E] shrink-0 mt-0.5" />
              : <AlertCircle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
            }
            <div className="flex-1">
              {scanResult.name && <p className="text-white font-bold text-sm">{scanResult.name}</p>}
              <p className={cn('text-xs mt-0.5', scanResult.ok ? 'text-[#22C55E]' : 'text-[#EF4444]')}>
                {scanResult.message}
              </p>
            </div>
            <button onClick={() => setScanResult(null)} className="text-[#555] hover:text-white transition-colors">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      {registrations.length > 0 && (
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Cerca nome, PR…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#1e1e1e] border border-[#2e2e2e] px-4 py-3 text-sm font-sans text-white placeholder-[#444] outline-none focus:border-[#D4622A]/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="py-12 flex justify-center">
          <div className="w-5 h-5 border-2 border-[#D4622A] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && registrations.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#444]">Nessuna registrazione per questa serata</p>
        </div>
      )}

      {/* Da fare */}
      {pending.length > 0 && (
        <div className="mb-4">
          <p className="text-[8px] font-sans uppercase tracking-[0.4em] text-[#555] mb-2 px-1">
            Da fare — {pending.length}
          </p>
          <div className="border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
            {pending.map(reg => (
              <RegistrationRow key={reg.id} reg={reg} onUndoCheckIn={handleUndoCheckIn} />
            ))}
          </div>
        </div>
      )}

      {/* Entrati */}
      {entered.length > 0 && (
        <div>
          <button
            onClick={() => setShowEntered(o => !o)}
            className="flex items-center gap-2 text-[8px] font-sans uppercase tracking-[0.4em] text-[#555] hover:text-[#888] transition-colors mb-2 px-1 w-full"
          >
            <ChevronDown size={11} className={cn('transition-transform duration-200', showEntered && 'rotate-180')} />
            Entrati — {entered.length}
          </button>
          <AnimatePresence>
            {showEntered && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="border border-[#2a2a2a] bg-[#1a1a1a] overflow-hidden">
                  {entered.map(reg => (
                    <RegistrationRow key={reg.id} reg={reg} onUndoCheckIn={handleUndoCheckIn} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function RegistrationRow({ reg, onUndoCheckIn }: { reg: Registration; onUndoCheckIn: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const isIn = reg.checkedIn;

  return (
    <div className={cn('border-b border-[#222] last:border-0', isIn && 'bg-[#22C55E]/[0.03]')}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0', isIn ? 'bg-[#22C55E]' : 'bg-[#2e2e2e]')} />
        <div className="flex-1 min-w-0">
          <p className={cn('font-bold text-sm truncate', isIn ? 'text-[#aaa]' : 'text-white')}>
            {reg.firstName} {reg.lastName}
          </p>
          <p className="text-[9px] font-mono text-[#555] mt-0.5 truncate">
            <Users size={9} className="inline mr-1" />{reg.guestsCount}
            {reg.prName && <> · PR {reg.prName}</>}
            {isIn && <span className="text-[#22C55E] ml-2">· Entrato</span>}
          </p>
        </div>
        {isIn
          ? <CheckCircle2 size={15} className="text-[#22C55E] shrink-0" />
          : <ChevronDown size={13} className={cn('text-[#555] shrink-0 transition-transform', open && 'rotate-180')} />
        }
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
            <div className="px-5 pb-4 pt-1 border-t border-[#222] space-y-3">
              <div className="text-[9px] font-mono text-[#555] space-y-1">
                <p>Email: <span className="text-[#888]">{reg.email}</span></p>
                {reg.phone && <p>Tel: <span className="text-[#888]">{reg.phone}</span></p>}
                {reg.prName && <p>Invitato da: <span className="text-[#888]">{reg.prName}</span></p>}
              </div>
              {isIn && (
                <button
                  onClick={() => onUndoCheckIn(reg.id)}
                  className="w-full py-2 border border-[#333] text-[#666] text-[9px] font-mono uppercase tracking-widest hover:border-[#EF4444]/40 hover:text-[#EF4444] transition-colors"
                >
                  Annulla entrata
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
