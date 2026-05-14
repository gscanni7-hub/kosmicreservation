import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Users, FileText, CheckCircle2 } from 'lucide-react';
import { Event, Venue, UserProfile, Reservation } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  events: Event[];
  venues: Venue[];
  user: UserProfile;
  onClose: () => void;
  onAdd: (reservation: Omit<Reservation, 'id' | 'createdAt'>) => void;
}

export default function QuickAddModal({ events, venues, user, onClose, onAdd }: Props) {
  const activeEvents = events.filter(e => e.status === 'active');
  const [form, setForm] = useState({
    eventId: activeEvents[0]?.id ?? '',
    customerName: '',
    customerPhone: '',
    guestsCount: 2,
    notes: '',
  });
  const [done, setDone] = useState(false);

  const selectedEvent = events.find(e => e.id === form.eventId);
  const selectedVenue = selectedEvent ? venues.find(v => v.id === selectedEvent.venueId) : null;
  const fp = selectedEvent
    ? (selectedVenue?.floorPlans.find(f => f.id === selectedEvent.floorPlanId) ?? selectedVenue?.floorPlans[0])
    : null;
  const tables = fp?.tables.filter(t => !t.isFixture) ?? [];

  const [tableId, setTableId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.eventId) return;
    const table = tables.find(t => t.id === tableId);
    onAdd({
      eventId: form.eventId,
      tableId: tableId || 'tbd',
      tableName: table?.name ?? 'Da assegnare',
      prId: user.id,
      prName: `${user.displayName} ${user.lastName ?? ''}`.trim(),
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      guestsCount: form.guestsCount,
      bottles: '',
      budget: table?.minSpend ?? 0,
      notes: form.notes.trim(),
      status: 'confirmed',
      approvalStatus: 'pending',
      checkedIn: false,
    });
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full sm:max-w-md bg-[#1a1a1a] border-t border-x sm:border border-[#2a2a2a] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[90vh] flex flex-col"
      >
        <div className="h-[2px] bg-[#D4622A] shrink-0" />

        <div className="px-6 py-5 border-b border-[#222] flex items-center justify-between shrink-0">
          <h3 className="hv font-black text-lg uppercase text-white">Aggiungi Prenotazione</h3>
          <button onClick={onClose} className="text-[#666] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4 p-10">
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center"
            >
              <CheckCircle2 size={32} className="text-[#22C55E]" />
            </motion.div>
            <div className="text-center">
              <p className="hv font-black text-white uppercase text-lg">Aggiunta!</p>
              <p className="text-[#666] text-xs mt-1">In attesa di approvazione admin</p>
            </div>
            <button onClick={onClose}
              className="w-full py-3.5 bg-[#D4622A] text-black text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors">
              Chiudi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Event selector */}
            {activeEvents.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-[8px] font-mono uppercase tracking-widest text-[#555]">Evento</label>
                <select
                  value={form.eventId}
                  onChange={e => { setForm({ ...form, eventId: e.target.value }); setTableId(''); }}
                  className="w-full bg-[#111] border border-[#2a2a2a] px-4 py-3 text-sm text-white outline-none focus:border-[#D4622A] transition-colors [color-scheme:dark]"
                >
                  {activeEvents.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Customer name */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-mono uppercase tracking-widest text-[#555]">Nome cliente *</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                <input
                  required
                  value={form.customerName}
                  onChange={e => setForm({ ...form, customerName: e.target.value })}
                  placeholder="Mario Rossi"
                  className="w-full bg-[#111] border border-[#2a2a2a] pl-9 pr-3 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-[#D4622A] transition-colors"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-mono uppercase tracking-widest text-[#555]">Telefono</label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                <input
                  type="tel"
                  value={form.customerPhone}
                  onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="+39 333 000 0000"
                  className="w-full bg-[#111] border border-[#2a2a2a] pl-9 pr-3 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-[#D4622A] transition-colors"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-mono uppercase tracking-widest text-[#555]">Numero persone</label>
              <div className="flex items-center gap-3 bg-[#111] border border-[#2a2a2a] px-4 py-2.5">
                <Users size={13} className="text-[#444]" />
                <button type="button" onClick={() => setForm(f => ({ ...f, guestsCount: Math.max(1, f.guestsCount - 1) }))}
                  className="w-8 h-8 text-[#888] hover:text-white text-xl leading-none flex items-center justify-center transition-colors">−</button>
                <span className="hv font-black text-white text-xl w-8 text-center">{form.guestsCount}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, guestsCount: f.guestsCount + 1 }))}
                  className="w-8 h-8 text-[#888] hover:text-white text-xl leading-none flex items-center justify-center transition-colors">+</button>
              </div>
            </div>

            {/* Table (optional) */}
            {tables.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[8px] font-mono uppercase tracking-widest text-[#555]">Tavolo (opzionale)</label>
                <select
                  value={tableId}
                  onChange={e => setTableId(e.target.value)}
                  className="w-full bg-[#111] border border-[#2a2a2a] px-4 py-3 text-sm text-white outline-none focus:border-[#D4622A] transition-colors [color-scheme:dark]"
                >
                  <option value="">Da assegnare</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>{t.name} — {t.area} — min. €{t.minSpend}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[8px] font-mono uppercase tracking-widest text-[#555]">Note (opzionale)</label>
              <div className="relative">
                <FileText size={13} className="absolute left-3 top-3.5 text-[#444]" />
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Richieste speciali..."
                  className="w-full bg-[#111] border border-[#2a2a2a] pl-9 pr-3 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-[#D4622A] transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3.5 border border-[#2a2a2a] text-[#666] text-[9px] hv font-black uppercase tracking-widest hover:text-white hover:border-[#3a3a3a] transition-colors">
                Annulla
              </button>
              <button type="submit"
                className="flex-1 py-3.5 bg-[#D4622A] text-black text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors">
                Aggiungi
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
