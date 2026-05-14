import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { createRegistration } from '../../lib/registrationService';
import { Event, Venue, ManagedUser } from '../../types';
import { INITIAL_EVENTS, INITIAL_VENUES, INITIAL_MANAGED_USERS } from '../../constants';
import { motion } from 'framer-motion';
import { Users, User, Phone, Mail, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PublicRegistrationForm() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const prId = searchParams.get('pr');
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [pr, setPr] = useState<ManagedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    guestsCount: 1,
  });

  useEffect(() => {
    async function load() {
      if (!token) { setNotFound(true); setLoading(false); return; }

      // First try localStorage events (mock data)
      let foundEvent: Event | null = null;
      let foundVenue: Venue | null = null;

      // Search in localStorage/initial data
      const localEvents: Event[] = (() => {
        try {
          const saved = localStorage.getItem('nightplan_events');
          return saved ? JSON.parse(saved) : INITIAL_EVENTS;
        } catch { return INITIAL_EVENTS; }
      })();
      const localVenues: Venue[] = (() => {
        try {
          const saved = localStorage.getItem('nightplan_venues');
          return saved ? JSON.parse(saved) : INITIAL_VENUES;
        } catch { return INITIAL_VENUES; }
      })();

      foundEvent = localEvents.find(e => e.registrationToken === token) ?? null;
      if (foundEvent) {
        foundVenue = localVenues.find(v => v.id === foundEvent!.venueId) ?? null;
      }

      // Fallback: search Firestore
      if (!foundEvent) {
        try {
          const q = query(collection(db, 'events'), where('registrationToken', '==', token));
          const snap = await getDocs(q);
          if (!snap.empty) {
            foundEvent = { id: snap.docs[0].id, ...snap.docs[0].data() } as Event;
            if (foundEvent) {
              const vq = query(collection(db, 'venues'), where('__name__', '==', foundEvent.venueId));
              const vsnap = await getDocs(vq);
              if (!vsnap.empty) foundVenue = { id: vsnap.docs[0].id, ...vsnap.docs[0].data() } as Venue;
            }
          }
        } catch { /* Firestore not available */ }
      }

      if (!foundEvent) { setNotFound(true); setLoading(false); return; }
      setEvent(foundEvent);
      setVenue(foundVenue);

      // Load PR if prId provided
      if (prId) {
        const managedUsers: ManagedUser[] = (() => {
          try {
            const saved = localStorage.getItem('nightplan_managed_users');
            return saved ? JSON.parse(saved) : INITIAL_MANAGED_USERS;
          } catch { return INITIAL_MANAGED_USERS; }
        })();
        const foundPr = managedUsers.find(u => u.id === prId && u.role === 'pr') ?? null;
        setPr(foundPr);
      }

      setLoading(false);
    }
    load();
  }, [token, prId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !venue) return;
    if (!form.firstName.trim() || !form.lastName.trim()) { setError('Nome e cognome obbligatori.'); return; }
    if (!form.email.trim()) { setError('Email obbligatoria.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const id = await createRegistration({
        eventId: event.id,
        eventName: event.name,
        venueName: venue.name,
        eventDate: event.date,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        guestsCount: form.guestsCount,
        prId: pr?.id ?? null,
        prName: pr ? `${pr.displayName} ${pr.lastName}` : null,
      });
      navigate(`/ticket/${id}`);
    } catch (err) {
      console.error(err);
      setError('Errore durante la registrazione. Riprova.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 bg-[#D4622A] flex items-center justify-center mb-2">
          <span className="text-black font-black text-[11px]" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>N</span>
        </div>
        <div className="w-5 h-5 border-2 border-[#D4622A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 max-w-xs"
        >
          <div className="w-10 h-10 bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center mx-auto">
            <AlertCircle size={20} className="text-[#EF4444]" />
          </div>
          <div>
            <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#D4622A] mb-2">Nightplan</p>
            <p className="text-white hv font-black text-xl uppercase">Link non valido</p>
            <p className="text-[#555] text-xs mt-2">Questo link di registrazione non esiste o è scaduto.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const formattedDate = event ? new Date(event.date).toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }) : '';

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Hero header */}
      <div className="relative overflow-hidden">
        {/* Cover image */}
        {event?.coverImage && (
          <div className="absolute inset-0">
            <img src={event.coverImage} alt="" className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/40 via-[#0d0d0d]/60 to-[#0d0d0d]" />
          </div>
        )}
        {!event?.coverImage && (
          <div className="absolute inset-0 bg-gradient-to-b from-[#D4622A]/10 to-transparent" />
        )}
        <div className="relative px-6 pt-10 pb-10 text-center max-w-md mx-auto">
          {/* Nightplan brand */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-5 h-5 bg-[#D4622A] flex items-center justify-center">
              <span className="text-black font-black text-[8px]" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>N</span>
            </div>
            <span className="text-[9px] font-mono uppercase tracking-[0.45em] text-[#555]">Nightplan</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#D4622A] mb-2">
              {venue?.name}
            </p>
            <h1 className="hv font-black text-4xl uppercase leading-none text-white mb-3">
              {event?.name}
            </h1>
            <p className="text-[#666] text-[11px] font-mono capitalize">{formattedDate}{event?.time ? ` · ${event.time}` : ''}</p>
          </motion.div>

          {pr && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="mt-5 inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] px-4 py-2"
            >
              <div className="w-1.5 h-1.5 bg-[#D4622A]" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#aaa]">
                Invitato da {pr.displayName} {pr.lastName}
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-md mx-auto px-6">
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent mb-8" />
      </div>

      {/* Form */}
      <div className="px-6 pb-16 max-w-md mx-auto">
        <p className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#444] text-center mb-6">Compila il modulo per registrarti</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-[#666]">Nome *</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                <input
                  required
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  placeholder="Mario"
                  className="w-full bg-[#1a1a1a] border border-[#2a2a2a] pl-9 pr-3 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-[#D4622A] transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono uppercase tracking-widest text-[#666]">Cognome *</label>
              <input
                required
                value={form.lastName}
                onChange={e => setForm({ ...form, lastName: e.target.value })}
                placeholder="Rossi"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] px-3 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-[#D4622A] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-[#666]">Email *</label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="mario@email.com"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] pl-9 pr-3 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-[#D4622A] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-[#666]">Telefono</label>
            <div className="relative">
              <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+39 333 000 0000"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] pl-9 pr-3 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-[#D4622A] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono uppercase tracking-widest text-[#666]">Numero persone *</label>
            <div className="relative">
              <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
              <select
                value={form.guestsCount}
                onChange={e => setForm({ ...form, guestsCount: parseInt(e.target.value) })}
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] pl-9 pr-3 py-3 text-sm text-white outline-none focus:border-[#D4622A] transition-colors [color-scheme:dark]"
              >
                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'persone'}</option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-[#EF4444]/10 border border-[#EF4444]/20 px-4 py-3">
              <AlertCircle size={14} className="text-[#EF4444] shrink-0" />
              <p className="text-[#EF4444] text-xs">{error}</p>
            </div>
          )}

          <motion.button
            type="submit"
            disabled={submitting}
            whileTap={{ scale: 0.97 }}
            className="w-full bg-[#D4622A] text-white py-4 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Registrati
                <ChevronRight size={16} />
              </>
            )}
          </motion.button>

          <p className="text-center text-[10px] text-[#444] font-mono">
            Riceverai il tuo biglietto con QR code
          </p>
        </form>

        {/* Footer brand */}
        <div className="mt-12 pt-6 border-t border-[#1a1a1a] flex items-center justify-center gap-2">
          <div className="w-4 h-4 bg-[#D4622A] flex items-center justify-center">
            <span className="text-black font-black text-[7px]" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>N</span>
          </div>
          <span className="text-[8px] font-mono uppercase tracking-[0.4em] text-[#333]">Powered by Nightplan</span>
        </div>
      </div>
    </div>
  );
}
