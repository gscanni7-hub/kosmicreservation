import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar, Settings, BarChart3, LogOut, ChevronRight, ChevronDown,
  Plus, Download, Filter, Building2, X, ArrowLeft, Menu, Map, Pencil, Trash2,
  UserCheck, Bell
} from 'lucide-react';
import { MOCK_USERS, INITIAL_VENUES, INITIAL_EVENTS, INITIAL_RESERVATIONS, INITIAL_MANAGED_USERS } from './constants';
import { UserProfile, Event, Reservation, Venue, FloorPlan, ManagedUser } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import { isEmailConfigured, sendPasswordResetEmail } from './lib/emailService';
import FloorPlanViewer from './components/floorplan/FloorPlanViewer';
import FloorPlanEditor from './components/floorplan/FloorPlanEditor';

type AppView = 'venues' | 'venue-events' | 'events' | 'active-events' | 'plan' | 'editor' | 'reservations' | 'approvals' | 'profile';

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com','guerrillamail.com','guerrillamail.net','guerrillamail.org','guerrillamail.de',
  'guerrillamail.info','guerrillamail.biz','guerrillamailblock.com','grr.la','sharklasers.com',
  'spam4.me','trashmail.com','trashmail.me','trashmail.at','trashmail.io','trashmail.xyz',
  'dispostable.com','fakeinbox.com','tempr.email','discard.email','yopmail.com',
  '10minutemail.com','10minutemail.net','tempmail.com','tempmail.net','tempmail.org',
  'throwaway.email','maildrop.cc','mailnesia.com','spamgourmet.com','wegwerfmail.de',
  'mytrashmail.com','throwam.com','mailtemp.info','mailtemp.net','luxusmail.org',
  'spamfree24.org','mailnull.com','spamify.com','trash-mail.at','fakemails.com',
  'fakemail.fr','jetable.fr.nf','getnada.com','spamhereplease.com',
  'getairmail.com','filzmail.com','owlpic.com','trbvm.com',
  'spamgourmet.net','spamgourmet.org','mailtemp.co.uk','anonaddy.com','33mail.com','spamex.com',
]);

// Provider noti → TLD validi. Se il nome del dominio corrisponde ma il TLD è sbagliato, l'errore suggerisce la correzione.
const KNOWN_PROVIDERS: Record<string, { tlds: string[]; canonical: string }> = {
  gmail:       { tlds: ['com'],                                              canonical: 'gmail.com' },
  googlemail:  { tlds: ['com'],                                              canonical: 'gmail.com' },
  outlook:     { tlds: ['com','it','fr','de','es','be','at','ch','co.uk'],   canonical: 'outlook.com' },
  hotmail:     { tlds: ['com','it','fr','de','es','be','at','ch','co.uk'],   canonical: 'hotmail.com' },
  live:        { tlds: ['com','it','fr','de','es','be','at','ch','co.uk'],   canonical: 'live.com' },
  msn:         { tlds: ['com'],                                              canonical: 'msn.com' },
  yahoo:       { tlds: ['com','it','fr','de','es','co.uk','co.jp','gr','ro'],canonical: 'yahoo.com' },
  ymail:       { tlds: ['com'],                                              canonical: 'ymail.com' },
  icloud:      { tlds: ['com'],                                              canonical: 'icloud.com' },
  me:          { tlds: ['com'],                                              canonical: 'me.com' },
  mac:         { tlds: ['com'],                                              canonical: 'mac.com' },
  libero:      { tlds: ['it'],                                               canonical: 'libero.it' },
  virgilio:    { tlds: ['it'],                                               canonical: 'virgilio.it' },
  alice:       { tlds: ['it'],                                               canonical: 'alice.it' },
  tin:         { tlds: ['it'],                                               canonical: 'tin.it' },
  tiscali:     { tlds: ['it','co.uk','de','fr','es'],                        canonical: 'tiscali.it' },
  fastwebnet:  { tlds: ['it'],                                               canonical: 'fastwebnet.it' },
  protonmail:  { tlds: ['com'],                                              canonical: 'protonmail.com' },
  proton:      { tlds: ['me','com'],                                         canonical: 'proton.me' },
  tutanota:    { tlds: ['com','de'],                                         canonical: 'tutanota.com' },
  tutamail:    { tlds: ['com'],                                              canonical: 'tutamail.com' },
  tuta:        { tlds: ['io'],                                               canonical: 'tuta.io' },
  zoho:        { tlds: ['com'],                                              canonical: 'zoho.com' },
  aol:         { tlds: ['com'],                                              canonical: 'aol.com' },
  gmx:         { tlds: ['com','de','net','at','it','fr','es','ch'],          canonical: 'gmx.com' },
  fastmail:    { tlds: ['com','fm'],                                         canonical: 'fastmail.com' },
  posteo:      { tlds: ['de','net','eu','org'],                              canonical: 'posteo.de' },
};

function validateEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  if (!/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}$/.test(trimmed))
    return 'Formato email non valido (TLD non valido).';
  const [local, domain] = trimmed.split('@');
  if (DISPOSABLE_DOMAINS.has(domain))
    return 'Email temporanee non ammesse.';
  
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  
  // Blocca TLD comuni sbagliati
  const commonTypos: Record<string, string> = {
    'con': 'com',
    'itit': 'it',
    'om': 'com',
    'nt': 'net',
    'ed': 'edu'
  };
  
  if (commonTypos[tld]) {
    return `TLD ".${tld}" non valido. Intendevi ".${commonTypos[tld]}"?`;
  }

  // Controlla se il provider è noto ma il TLD è sbagliato
  const providerName = parts[0];
  const known = KNOWN_PROVIDERS[providerName];
  if (known && !known.tlds.includes(tld))
    return `"${domain}" non esiste. Intendevi ${known.canonical}?`;

  return '';
}

function validatePhone(phone: string): string {
  const stripped = phone.trim().replace(/[\s\-\(\)\.]/g, '');
  if (!stripped) return 'Numero di telefono obbligatorio.';
  if (stripped.startsWith('+')) {
    if (stripped.startsWith('+39')) {
      const nat = stripped.slice(3);
      if (/^3\d{9}$/.test(nat) || /^0\d{8,9}$/.test(nat)) return '';
      return 'Numero italiano non valido. Es: +39 333 000 0000';
    }
    if (/^\+\d{7,15}$/.test(stripped)) return '';
    return 'Numero internazionale non valido.';
  }
  if (/^3\d{9}$/.test(stripped)) return '';
  if (/^0\d{8,9}$/.test(stripped)) return '';
  if (stripped.length < 9) return 'Numero troppo corto.';
  if (stripped.length > 15) return 'Numero troppo lungo.';
  return 'Formato non valido. Es: +39 333 000 0000 oppure 333 000 0000';
}

const PAGE = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.22 },
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('nightplan_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>(() => {
    try {
      const saved = localStorage.getItem('nightplan_managed_users');
      return saved ? JSON.parse(saved) : INITIAL_MANAGED_USERS;
    } catch { return INITIAL_MANAGED_USERS; }
  });
  const [authScreen, setAuthScreen] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [regName, setRegName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');
  const [regEmailError, setRegEmailError] = useState('');
  const [regPhoneError, setRegPhoneError] = useState('');
  const [regDone, setRegDone] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotDevLink, setForgotDevLink] = useState('');
  const [resetTokenState, setResetTokenState] = useState('');
  const [resetEmailState, setResetEmailState] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetDone, setResetDone] = useState(false);
  const [view, setView] = useState<AppView>('venues');
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [editingFloorPlan, setEditingFloorPlan] = useState<{ venueId: string; fp: FloorPlan } | null>(null);
  const [showNewClubModal, setShowNewClubModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [showNewFloorPlanModal, setShowNewFloorPlanModal] = useState(false);
  const [editingFloorPlanMeta, setEditingFloorPlanMeta] = useState<{ venueId: string; fp: FloorPlan } | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  useEffect(() => {
    localStorage.setItem('nightplan_managed_users', JSON.stringify(managedUsers));
  }, [managedUsers]);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith('#reset=')) return;
    const token = hash.slice(7);
    type RT = { token: string; email: string; expiresAt: number };
    const tokens: RT[] = JSON.parse(localStorage.getItem('nightplan_reset_tokens') ?? '[]');
    const found = tokens.find(t => t.token === token && t.expiresAt > Date.now());
    if (found) {
      setResetTokenState(token);
      setResetEmailState(found.email);
      setAuthScreen('reset');
      if (user) { handleLogout(); }
    } else {
      window.location.hash = '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = managedUsers.find(
      u => u.email.toLowerCase() === loginEmail.trim().toLowerCase() && u.password === loginPassword
    );
    if (!found) { setLoginError('Email o password non corretti.'); return; }
    if (found.status === 'pending')  { setLoginError('Il tuo account è in attesa di approvazione.'); return; }
    if (found.status === 'rejected') { setLoginError('Il tuo account non è stato approvato.'); return; }
    const profile: UserProfile = { id: found.id, email: found.email, role: found.role, displayName: found.displayName, lastName: found.lastName, phone: found.phone, profileImage: found.profileImage };
    localStorage.setItem('nightplan_user', JSON.stringify(profile));
    setUser(profile);
    setView(found.role === 'admin' ? 'active-events' : 'events');
    setLoginError('');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(regEmail);
    const phoneErr = validatePhone(regPhone);
    setRegEmailError(emailErr);
    setRegPhoneError(phoneErr);
    if (emailErr || phoneErr) return;
    const exists = managedUsers.find(u => u.email.toLowerCase() === regEmail.trim().toLowerCase());
    if (exists) { setRegError('Email già registrata.'); return; }
    const newUser: ManagedUser = {
      id: `pr_${Date.now()}`,
      email: regEmail.trim().toLowerCase(),
      password: regPassword,
      role: 'pr',
      displayName: regName.trim(),
      lastName: regLastName.trim(),
      phone: regPhone.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setManagedUsers(prev => [...prev, newUser]);
    setRegDone(true);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = managedUsers.find(u => u.email.toLowerCase() === forgotEmail.trim().toLowerCase());
    if (!found) { setForgotError('Nessun account trovato con questa email.'); return; }
    const token = Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
    const resetLink = `${window.location.origin}${window.location.pathname}#reset=${token}`;
    type RT = { token: string; email: string; expiresAt: number };
    const tokens: RT[] = JSON.parse(localStorage.getItem('nightplan_reset_tokens') ?? '[]');
    tokens.push({ token, email: found.email, expiresAt: Date.now() + 30 * 60 * 1000 });
    localStorage.setItem('nightplan_reset_tokens', JSON.stringify(tokens));
    if (isEmailConfigured()) {
      try {
        await sendPasswordResetEmail(found.email, found.displayName, resetLink);
        setForgotSent(true);
      } catch {
        setForgotDevLink(resetLink);
        setForgotSent(true);
      }
    } else {
      setForgotDevLink(resetLink);
      setForgotSent(true);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTokenState || !resetEmailState) return;
    setManagedUsers(prev => prev.map(u =>
      u.email === resetEmailState ? { ...u, password: newPassword } : u
    ));
    type RT = { token: string; email: string; expiresAt: number };
    const tokens: RT[] = JSON.parse(localStorage.getItem('nightplan_reset_tokens') ?? '[]');
    localStorage.setItem('nightplan_reset_tokens', JSON.stringify(tokens.filter((t: RT) => t.token !== resetTokenState)));
    window.location.hash = '';
    setResetDone(true);
  };

  const handleUpdateProfile = (updates: { displayName: string; lastName: string; profileImage?: string }) => {
    setManagedUsers(prev => prev.map(u => u.id === user!.id ? { ...u, ...updates } : u));
    const updated: UserProfile = { ...user!, ...updates };
    setUser(updated);
    localStorage.setItem('nightplan_user', JSON.stringify(updated));
  };

  const handleApproveUser = (id: string) =>
    setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'approved' } : u));
  const handleRejectUser = (id: string) =>
    setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'rejected' } : u));
  const handleApproveReservation = (id: string) =>
    setReservations(prev => prev.map(r => r.id === id ? { ...r, approvalStatus: 'approved' } : r));
  const handleRejectReservation = (id: string) =>
    setReservations(prev => prev.map(r => r.id === id ? { ...r, approvalStatus: 'rejected' } : r));

  const handleLogout = () => {
    localStorage.removeItem('nightplan_user');
    setUser(null); setSelectedVenue(null); setSelectedEvent(null);
    setLoginEmail(''); setLoginPassword(''); setLoginError('');
    setAuthScreen('login');
    setRegDone(false); setRegName(''); setRegLastName(''); setRegEmail(''); setRegPassword(''); setRegPhone(''); setRegError(''); setRegEmailError(''); setRegPhoneError('');
    setForgotEmail(''); setForgotError(''); setForgotSent(false); setForgotDevLink('');
    setNewPassword(''); setResetError(''); setResetDone(false);
  };

  const openVenue = (venue: Venue) => { setSelectedVenue(venue); setView('venue-events'); };
  const openEvent = (event: Event) => {
    if (!selectedVenue) setSelectedVenue(venues.find(v => v.id === event.venueId) ?? null);
    setSelectedEvent(event);
    setView('plan');
    setMobileSidebarOpen(false);
  };
  const goBack = () => {
    if (view === 'plan') { setSelectedEvent(null); setView(user?.role === 'admin' ? 'active-events' : 'events'); }
    else if (view === 'venue-events') { setSelectedVenue(null); setView('venues'); }
    else if (view === 'active-events') { setView('venues'); }
  };

  const getFloorPlan = (event: Event): FloorPlan | undefined => {
    const venue = venues.find(v => v.id === event.venueId);
    return venue?.floorPlans.find(fp => fp.id === event.floorPlanId) ?? venue?.floorPlans[0];
  };

  const activeEvents  = events.filter(e => e.status === 'active');
  const venueEvents   = selectedVenue ? events.filter(e => e.venueId === selectedVenue.id) : [];
  const showBack      = view === 'plan' || view === 'venue-events' || view === 'active-events';

  const activeEventIds = new Set(activeEvents.map(e => e.id));
  const totalTables = activeEvents.reduce((sum, event) => {
    const venue = venues.find(v => v.id === event.venueId);
    const fp = venue?.floorPlans.find(f => f.id === event.floorPlanId) ?? venue?.floorPlans[0];
    return sum + (fp?.tables.length ?? 0);
  }, 0);
  const bookedReservations = reservations.filter(
    r => (r.status === 'confirmed' || r.status === 'blocked') && activeEventIds.has(r.eventId)
  );
  const occupancyPct = totalTables > 0 ? Math.round((bookedReservations.length / totalTables) * 100) : 0;
  const revenueEst   = bookedReservations.reduce((sum, r) => sum + r.budget, 0);

  const pendingUsers = managedUsers.filter(u => u.status === 'pending');
  const pendingResv  = reservations.filter(r => r.approvalStatus === 'pending');
  const pendingCount = pendingUsers.length + pendingResv.length;

  const headerTitle = () => {
    if (view === 'venues')         return 'Location';
    if (view === 'venue-events')   return selectedVenue?.name ?? '';
    if (view === 'active-events')  return 'Prossimi eventi';
    if (view === 'events')         return 'Eventi';
    if (view === 'plan')           return selectedEvent?.name ?? '';
    if (view === 'editor')         return 'Layout Tavoli';
    if (view === 'reservations')   return 'Prenotazioni';
    if (view === 'approvals')      return 'Approvazioni';
    if (view === 'profile')        return 'Il Mio Profilo';
    return '';
  };

  /* ── LOGIN ──────────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col lg:flex-row">
        {/* Brand panel — desktop */}
        <motion.div
          initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:flex flex-col justify-between p-14 xl:p-20 border-r border-[#1e1e1e] lg:w-[55%] relative overflow-hidden"
        >
          <div className="absolute inset-0 floorplan-grid opacity-40 pointer-events-none" />
          <span className="relative text-[10px] font-sans font-medium uppercase tracking-[0.5em] text-[#777]">
            Table Management Platform
          </span>
          <div className="relative">
            <h1 className="hv font-black leading-[0.88] tracking-tighter uppercase text-white"
              style={{ fontSize: 'clamp(80px, 10vw, 130px)' }}>
              NIGHT<br />PLAN
            </h1>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-px w-10 bg-accent shrink-0" />
              <p className="text-[#777] text-sm font-sans leading-relaxed">
                The operating system<br />for nightlife professionals.
              </p>
            </div>
          </div>
          <span className="relative text-[9px] font-sans text-[#222] uppercase tracking-[0.4em]">
            © 2025 Nightplan Management Suite
          </span>
        </motion.div>

        {/* Login form panel */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-black lg:bg-[#030303]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-14 text-center">
            <h1 className="hv font-black text-5xl uppercase tracking-tight text-white">NIGHTPLAN</h1>
            <p className="text-[#777] text-[10px] font-sans uppercase tracking-[0.4em] mt-2">Management Suite</p>
          </div>

          <div className="w-full max-w-xs">
            <AnimatePresence mode="wait">
              {authScreen === 'login' ? (
                <motion.div key="login" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  <div className="mb-10">
                    <h2 className="hv font-black text-2xl uppercase text-white">Accedi</h2>
                    <p className="text-[#777] text-[10px] font-sans uppercase tracking-widest mt-2">Inserisci le tue credenziali</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444]">Email</label>
                      <input
                        type="email"
                        list="nightplan-accounts"
                        autoComplete="off"
                        required
                        value={loginEmail}
                        onChange={e => {
                          setLoginEmail(e.target.value);
                          setLoginError('');
                          const match = SAVED_ACCOUNTS.find(a => a.email === e.target.value);
                          if (match) setLoginPassword(match.password);
                        }}
                        placeholder="tua@email.it"
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-5 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans"
                      />
                      <datalist id="nightplan-accounts">
                        {SAVED_ACCOUNTS.map(a => <option key={a.email} value={a.email}>{a.label}</option>)}
                      </datalist>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444]">Password</label>
                      <input type="password" autoComplete="current-password" required value={loginPassword}
                        onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                        placeholder="••••••••"
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-5 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                    </div>
                    {loginError && <p className="text-red-500/80 text-[10px] font-sans uppercase tracking-widest pt-1">{loginError}</p>}
                    <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      className="group w-full bg-accent text-black py-[18px] text-[10px] hv font-black uppercase tracking-[0.3em] flex items-center justify-between px-6 hover:bg-white transition-colors mt-2">
                      <span>Accedi</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                    <div className="text-center pt-3">
                      <button type="button"
                        onClick={() => { setAuthScreen('forgot'); setForgotError(''); setForgotSent(false); setForgotDevLink(''); }}
                        className="text-[10px] font-sans text-white/50 hover:text-accent transition-colors underline tracking-widest uppercase font-medium">
                        Password dimenticata?
                      </button>
                    </div>
                  </form>

                  <div className="mt-10 pt-8 border-t border-[#1e1e1e]">
                    <p className="text-[9px] font-sans text-[#444] uppercase tracking-widest text-center mb-4">Sei un PR?</p>
                    <button onClick={() => { setAuthScreen('register'); setRegError(''); setRegDone(false); }}
                      className="w-full py-3.5 text-[9px] hv font-black uppercase tracking-[0.2em] border border-[#2a2a2a] text-[#666] hover:border-accent/40 hover:text-accent transition-colors">
                      Registrati
                    </button>
                  </div>
                </motion.div>
              ) : authScreen === 'forgot' ? (
                <motion.div key="forgot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  {forgotSent ? (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                        <UserCheck size={24} className="text-accent" />
                      </div>
                      <h2 className="hv font-black text-xl uppercase text-white mb-3">Email Inviata</h2>
                      <p className="text-[#777] text-[10px] font-sans uppercase tracking-widest leading-loose">
                        Controlla la tua casella di posta<br />e clicca il link per reimpostare<br />la password.
                      </p>
                      {forgotDevLink && (
                        <div className="mt-6 p-4 bg-[#0a0a0a] border border-[#2a2a2a] text-left">
                          <p className="text-[8px] font-sans uppercase tracking-widest text-[#555] mb-2">Link di reset (dev mode)</p>
                          <a href={forgotDevLink} className="text-accent text-[10px] font-mono break-all hover:underline">
                            Clicca qui per reimpostare
                          </a>
                        </div>
                      )}
                      <button onClick={() => { setAuthScreen('login'); setForgotSent(false); setForgotEmail(''); }}
                        className="mt-8 w-full py-3.5 text-[9px] hv font-black uppercase tracking-[0.2em] border border-[#2a2a2a] text-[#666] hover:border-accent/40 hover:text-accent transition-colors">
                        Torna al Login
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-10">
                        <h2 className="hv font-black text-2xl uppercase text-white">Password Dimenticata</h2>
                        <p className="text-[#777] text-[10px] font-sans uppercase tracking-widest mt-2">Inserisci la tua email</p>
                      </div>
                      <form onSubmit={handleForgotPassword} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444]">Email</label>
                          <input type="email" required value={forgotEmail}
                            onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }}
                            placeholder="tua@email.it"
                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-5 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                        </div>
                        {forgotError && <p className="text-red-500/80 text-[10px] font-sans uppercase tracking-widest pt-1">{forgotError}</p>}
                        <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          className="group w-full bg-accent text-black py-[18px] text-[10px] hv font-black uppercase tracking-[0.3em] flex items-center justify-between px-6 hover:bg-white transition-colors mt-2">
                          <span>Invia Link</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </form>
                      <div className="mt-8 pt-6 border-t border-[#1e1e1e]">
                        <button onClick={() => setAuthScreen('login')}
                          className="w-full text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444] hover:text-[#777] transition-colors py-2">
                          ← Torna al Login
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ) : authScreen === 'reset' ? (
                <motion.div key="reset" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  {resetDone ? (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                        <UserCheck size={24} className="text-accent" />
                      </div>
                      <h2 className="hv font-black text-xl uppercase text-white mb-3">Password Aggiornata</h2>
                      <p className="text-[#777] text-[10px] font-sans uppercase tracking-widest leading-loose">
                        La tua password è stata<br />reimpostata con successo.
                      </p>
                      <button onClick={() => { setAuthScreen('login'); setResetDone(false); setNewPassword(''); }}
                        className="mt-8 w-full py-3.5 text-[9px] hv font-black uppercase tracking-[0.2em] bg-accent text-black hover:bg-white transition-colors">
                        Accedi ora
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-10">
                        <h2 className="hv font-black text-2xl uppercase text-white">Nuova Password</h2>
                        <p className="text-[#777] text-[10px] font-sans uppercase tracking-widest mt-2">{resetEmailState}</p>
                      </div>
                      <form onSubmit={handleResetPassword} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444]">Nuova Password</label>
                          <input type="password" required minLength={4} value={newPassword}
                            onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                            placeholder="••••••••"
                            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-5 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                        </div>
                        {resetError && <p className="text-red-500/80 text-[10px] font-sans uppercase tracking-widest pt-1">{resetError}</p>}
                        <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          className="group w-full bg-accent text-black py-[18px] text-[10px] hv font-black uppercase tracking-[0.3em] flex items-center justify-between px-6 hover:bg-white transition-colors mt-2">
                          <span>Reimposta Password</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </form>
                    </>
                  )}
                </motion.div>
              ) : regDone ? (
                <motion.div key="done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}
                  className="text-center py-8">
                  <div className="w-14 h-14 bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                    <UserCheck size={24} className="text-accent" />
                  </div>
                  <h2 className="hv font-black text-xl uppercase text-white mb-3">Richiesta Inviata</h2>
                  <p className="text-[#777] text-[10px] font-sans uppercase tracking-widest leading-loose">
                    Il tuo account è in attesa<br />di approvazione admin.
                  </p>
                  <button onClick={() => { setAuthScreen('login'); setRegDone(false); setRegName(''); setRegEmail(''); setRegPassword(''); }}
                    className="mt-8 w-full py-3.5 text-[9px] hv font-black uppercase tracking-[0.2em] border border-[#2a2a2a] text-[#666] hover:border-accent/40 hover:text-accent transition-colors">
                    Torna al Login
                  </button>
                </motion.div>
              ) : (
                <motion.div key="register" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  <div className="mb-10">
                    <h2 className="hv font-black text-2xl uppercase text-white">Registrati</h2>
                    <p className="text-[#777] text-[10px] font-sans uppercase tracking-widest mt-2">Crea il tuo account PR</p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444]">Nome</label>
                        <input required value={regName} onChange={e => { setRegName(e.target.value); setRegError(''); }}
                          placeholder="Mario"
                          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-4 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444]">Cognome</label>
                        <input required value={regLastName} onChange={e => { setRegLastName(e.target.value); setRegError(''); }}
                          placeholder="Rossi"
                          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-4 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444]">Email</label>
                      <input
                        type="text" inputMode="email" autoComplete="email" required value={regEmail}
                        onChange={e => {
                          const val = e.target.value;
                          setRegEmail(val);
                          setRegError('');
                          const [, domainPart] = val.split('@');
                          if (domainPart && domainPart.includes('.'))
                            setRegEmailError(validateEmail(val));
                          else
                            setRegEmailError('');
                        }}
                        onBlur={() => { if (regEmail) setRegEmailError(validateEmail(regEmail)); }}
                        placeholder="tua@email.it"
                        className={`w-full bg-[#0a0a0a] border px-5 py-4 text-sm text-white placeholder-[#444] outline-none transition-colors font-sans ${regEmailError ? 'border-red-500/60' : 'border-[#2a2a2a] focus:border-accent/40'}`}
                      />
                      {regEmailError && <p className="text-red-500/80 text-[9px] font-sans uppercase tracking-widest">{regEmailError}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444]">Telefono</label>
                      <input
                        type="tel" required value={regPhone}
                        onChange={e => {
                          const val = e.target.value;
                          setRegPhone(val);
                          setRegError('');
                          const digits = val.replace(/\D/g, '');
                          if (digits.length >= 9)
                            setRegPhoneError(validatePhone(val));
                          else
                            setRegPhoneError('');
                        }}
                        onBlur={() => { if (regPhone) setRegPhoneError(validatePhone(regPhone)); }}
                        placeholder="+39 333 000 0000"
                        className={`w-full bg-[#0a0a0a] border px-5 py-4 text-sm text-white placeholder-[#444] outline-none transition-colors font-sans ${regPhoneError ? 'border-red-500/60' : 'border-[#2a2a2a] focus:border-accent/40'}`}
                      />
                      {regPhoneError && <p className="text-red-500/80 text-[9px] font-sans uppercase tracking-widest">{regPhoneError}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444]">Password</label>
                      <input type="password" required value={regPassword} onChange={e => { setRegPassword(e.target.value); setRegError(''); }}
                        placeholder="••••••••"
                        className="w-full bg-[#0a0a0a] border border-[#2a2a2a] px-5 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                    </div>
                    {regError && <p className="text-red-500/80 text-[10px] font-sans uppercase tracking-widest pt-1">{regError}</p>}
                    <motion.button
                      type="submit"
                      disabled={!!regEmailError || !!regPhoneError}
                      whileHover={!regEmailError && !regPhoneError ? { scale: 1.01 } : {}}
                      whileTap={!regEmailError && !regPhoneError ? { scale: 0.99 } : {}}
                      className={`group w-full py-[18px] text-[10px] hv font-black uppercase tracking-[0.3em] flex items-center justify-between px-6 transition-colors mt-2 ${regEmailError || regPhoneError ? 'bg-[#2a2a2a] text-[#555] cursor-not-allowed' : 'bg-accent text-black hover:bg-white'}`}>
                      <span>Invia Richiesta</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-[#1e1e1e]">
                    <button onClick={() => { setAuthScreen('login'); setRegError(''); setRegEmailError(''); setRegPhoneError(''); }}
                      className="w-full text-[9px] hv font-black uppercase tracking-[0.2em] text-[#444] hover:text-[#777] transition-colors py-2">
                      ← Torna al Login
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── AUTHENTICATED LAYOUT ───────────────────────────────── */
  return (
    <div className="min-h-screen bg-bg text-white flex flex-col md:flex-row relative">

      {/* ── Mobile top bar ── */}
      <div className="md:hidden h-12 bg-black border-b border-[#1e1e1e] flex items-center justify-between px-4 sticky top-0 z-50 shrink-0">
        <span className="hv font-black text-xl uppercase tracking-tight">NP</span>
        <button onClick={() => setMobileSidebarOpen(o => !o)} className="text-[#555] hover:text-white transition-colors p-1">
          <Menu size={18} />
        </button>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-40 md:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-black border-r border-[#1e1e1e] z-50 md:hidden flex flex-col"
            >
              <SidebarContent
                user={user}
                view={view}
                onNav={(v) => { setView(v as AppView); setSelectedVenue(null); setSelectedEvent(null); setEditingFloorPlan(null); setMobileSidebarOpen(false); }}
                onLogout={handleLogout}
                occupancyPct={occupancyPct}
                revenueEst={revenueEst}
                pendingCount={pendingCount}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 xl:w-64 border-r border-[#1e1e1e] bg-black flex-col shrink-0 sticky top-0 h-screen">
        <SidebarContent user={user} view={view}
          onNav={(v) => { setView(v as AppView); setSelectedVenue(null); setSelectedEvent(null); setEditingFloorPlan(null); }}
          onLogout={handleLogout}
          occupancyPct={occupancyPct}
          revenueEst={revenueEst}
          pendingCount={pendingCount}
        />
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Header */}
        <header className="h-12 border-b border-[#1e1e1e] flex items-center justify-between px-5 bg-black/95 backdrop-blur-sm sticky top-0 md:top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            {showBack && (
              <button onClick={goBack}
                className="flex items-center gap-1.5 text-[#444] hover:text-accent transition-colors text-[10px] font-sans uppercase tracking-widest shrink-0">
                <ArrowLeft size={11} /> Indietro
              </button>
            )}
            <span className="text-[10px] font-sans font-medium uppercase tracking-[0.35em] text-[#777] truncate">
              {headerTitle()}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-5 md:p-8 overflow-auto">
          <AnimatePresence mode="wait">

            {/* Venues */}
            {view === 'venues' && (
              <motion.div key="venues" {...PAGE}>
                <div className="flex items-start justify-between mb-8 gap-4">
                  <PageTitle title="I tuoi Locali" sub="Seleziona un locale per gestire gli eventi" />
                  {user.role === 'admin' && (
                    <button onClick={() => setShowNewClubModal(true)}
                      className="flex items-center gap-2 bg-accent text-black px-5 py-3 text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors shrink-0 mt-1">
                      <Plus size={12} /> Nuovo Club
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
                  {venues.map((venue, i) => (
                    <motion.div key={venue.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.22 }}>
                      <VenueCard venue={venue}
                        eventCount={events.filter(e => e.venueId === venue.id).length}
                        onClick={() => openVenue(venue)}
                        onEdit={(e) => { e.stopPropagation(); setEditingVenue(venue); }}
                        onDelete={(e) => { e.stopPropagation(); setVenues(prev => prev.filter(v => v.id !== venue.id)); }}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Venue events */}
            {view === 'venue-events' && selectedVenue && (
              <motion.div key="venue-events" {...PAGE}>
                <div className="mb-8">
                  <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#777] mb-1">Venue</p>
                  <h2 className="hv font-black text-4xl uppercase text-white">{selectedVenue.name}</h2>
                </div>
                {venueEvents.length === 0 ? (
                  <EmptyState icon={<Calendar size={28} />} label="Nessun evento ancora.">
                    <button onClick={() => setShowNewEventModal(true)}
                      className="mt-5 flex items-center gap-2 bg-accent text-black px-5 py-3 text-[10px] hv font-black uppercase tracking-widest hover:bg-white transition-colors">
                      <Plus size={13} /> Crea Evento
                    </button>
                  </EmptyState>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                      {venueEvents.map((event, i) => (
                        <motion.div key={event.id}
                          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}>
                          <EventCard
                            event={event}
                            onClick={() => openEvent(event)}
                            onEdit={(e) => { e.stopPropagation(); setEditingEvent(event); }}
                            onDelete={(e) => { e.stopPropagation(); setEvents(prev => prev.filter(ev => ev.id !== event.id)); }}
                          />
                        </motion.div>
                      ))}
                    </div>
                    {user.role === 'admin' && (
                      <div className="mt-6 flex justify-center">
                        <button onClick={() => setShowNewEventModal(true)}
                          className="flex items-center gap-2 border border-[#2a2a2a] text-[#777] px-6 py-3 text-[9px] hv font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all">
                          <Plus size={11} /> Nuovo Evento
                        </button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* PR events */}
            {view === 'active-events' && (
              <motion.div key="active-events" {...PAGE}>
                <PageTitle title="Prossimi eventi" sub="Seleziona un evento per aprire la pianta" />
                {activeEvents.length === 0 ? (
                  <EmptyState icon={<Calendar size={28} />} label="Nessuna serata attiva." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
                    {activeEvents.map((event, i) => (
                      <motion.div key={event.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}>
                        <EventCard event={event}
                          venueName={venues.find(v => v.id === event.venueId)?.name}
                          onClick={() => openEvent(event)} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {view === 'events' && (
              <motion.div key="events" {...PAGE}>
                <PageTitle title="Prossimi eventi" sub="Seleziona un evento per accedere alla pianta" />
                {activeEvents.length === 0 ? (
                  <EmptyState icon={<Calendar size={28} />} label="Nessun evento attivo." />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
                    {activeEvents.map((event, i) => (
                      <motion.div key={event.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}>
                        <EventCard event={event}
                          venueName={venues.find(v => v.id === event.venueId)?.name}
                          onClick={() => openEvent(event)} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Plan */}
            {view === 'plan' && selectedEvent && (() => {
              const fp = getFloorPlan(selectedEvent);
              if (!fp) return null;
              return (
                <motion.div key="plan" {...PAGE} className="h-full flex flex-col">
                  <FloorPlanViewer
                    event={selectedEvent} floorPlan={fp}
                    reservations={reservations} currentUser={user}
                    onReservationAdded={(res) => setReservations(prev => [...prev, {
                      ...res,
                      approvalStatus: user.role === 'admin' ? 'approved' : 'pending',
                    }])}
                    onReservationUpdated={(res) => setReservations(prev => prev.map(r => r.id === res.id ? res : r))}
                    onReservationRemoved={(id) => setReservations(prev => prev.filter(r => r.id !== id))}
                  />
                </motion.div>
              );
            })()}

            {/* Editor */}
            {view === 'editor' && (
              <motion.div key="editor" {...PAGE} className="h-full flex flex-col">
                {editingFloorPlan ? (
                  <div className="flex flex-col h-full gap-5">
                    <button
                      onClick={() => setEditingFloorPlan(null)}
                      className="flex items-center gap-2 text-[#444] hover:text-accent transition-colors text-[10px] font-sans uppercase tracking-widest self-start">
                      <ArrowLeft size={11} /> Torna alle Piante
                    </button>
                    <FloorPlanEditor
                      key={editingFloorPlan.fp.id || 'new'}
                      floorPlan={editingFloorPlan.fp}
                      onSave={(savedFp) => {
                        setVenues(prev => prev.map(v =>
                          v.id === editingFloorPlan.venueId
                            ? {
                                ...v,
                                floorPlans: v.floorPlans.some(fp => fp.id === savedFp.id)
                                  ? v.floorPlans.map(fp => fp.id === savedFp.id ? savedFp : fp)
                                  : [...v.floorPlans, savedFp],
                              }
                            : v
                        ));
                        setEditingFloorPlan(null);
                      }}
                    />
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between mb-8 gap-4">
                      <PageTitle title="Venue Design" sub="Gestisci le piante dei tuoi locali" />
                      <button
                        onClick={() => setShowNewFloorPlanModal(true)}
                        className="flex items-center gap-2 bg-accent text-black px-5 py-3 text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors shrink-0 mt-1">
                        <Plus size={12} /> Nuova Pianta
                      </button>
                    </div>
                    <div className="space-y-6">
                      {venues.map(venue => (
                        <div key={venue.id} className="border border-[#2a2a2a] bg-card">
                          <div className="px-7 py-5 border-b border-[#1e1e1e]">
                            <h3 className="hv font-black text-xl uppercase text-white">{venue.name}</h3>
                            <p className="text-[9px] font-sans uppercase tracking-widest text-[#777] mt-0.5">{venue.address}</p>
                          </div>
                          {venue.floorPlans.length === 0 ? (
                            <div className="px-7 py-8 text-center">
                              <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#444]">Nessuna pianta</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-[#0d0d0d]">
                              {venue.floorPlans.map(fp => (
                                <div key={fp.id} className="px-7 py-4 flex items-center justify-between group hover:bg-white/[0.01] transition-colors">
                                  <div className="flex items-center gap-4">
                                    <Map size={14} className="text-[#666] shrink-0" />
                                    <div>
                                      <p className="hv font-black text-sm uppercase text-white">{fp.name}</p>
                                      <p className="text-[8px] font-sans text-[#777] mt-0.5">{fp.tables.length} tavoli</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => setEditingFloorPlanMeta({ venueId: venue.id, fp })}
                                        className="w-7 h-7 flex items-center justify-center text-[#777] hover:text-accent transition-colors">
                                        <Pencil size={12} />
                                      </button>
                                      <button
                                        onClick={() => setVenues(prev => prev.map(v =>
                                          v.id === venue.id ? { ...v, floorPlans: v.floorPlans.filter(f => f.id !== fp.id) } : v
                                        ))}
                                        className="w-7 h-7 flex items-center justify-center text-[#777] hover:text-red-500 transition-colors">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => setEditingFloorPlan({ venueId: venue.id, fp })}
                                      className="text-[9px] font-sans uppercase tracking-widest text-[#777] hover:text-accent transition-colors flex items-center gap-1.5">
                                      Canvas <ChevronRight size={11} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Reservations */}
            {view === 'reservations' && (
              <motion.div key="reservations" {...PAGE}>
                <ReservationsTable
                  reservations={user.role === 'admin' ? reservations : reservations.filter(r => r.prId === user.id)}
                  userRole={user.role}
                  events={events}
                />
              </motion.div>
            )}

            {/* Approvals — admin only */}
            {view === 'approvals' && user.role === 'admin' && (
              <motion.div key="approvals" {...PAGE}>
                <PageTitle
                  title="Approvazioni"
                  sub={pendingCount > 0 ? `${pendingCount} element${pendingCount !== 1 ? 'i' : 'o'} in attesa` : 'Nessun elemento in attesa'}
                />

                {/* Pending PRs */}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[9px] font-sans uppercase tracking-[0.4em] text-accent font-bold">Nuovi PR</span>
                    {pendingUsers.length > 0 && (
                      <span className="bg-accent text-black text-[8px] hv font-black px-2 py-0.5 leading-none">{pendingUsers.length}</span>
                    )}
                  </div>
                  {pendingUsers.length === 0 ? (
                    <div className="border border-dashed border-[#2a2a2a] py-10 px-6 text-center">
                      <p className="text-[9px] font-sans uppercase tracking-widest text-[#444]">Nessuna richiesta in attesa</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-5 bg-card border border-[#2a2a2a] hover:border-[#333] transition-colors">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-9 h-9 bg-[#111] border border-[#222] flex items-center justify-center shrink-0">
                              <span className="hv font-black text-[#666] text-xs">{u.displayName.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="hv font-black uppercase text-white text-[11px]">{u.displayName}</p>
                              <p className="text-[9px] font-sans text-[#666] mt-0.5">{u.email}</p>
                              <p className="text-[8px] font-sans text-[#444] uppercase tracking-widest mt-0.5">
                                {new Date(u.createdAt).toLocaleDateString('it-IT')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => handleApproveUser(u.id)}
                              className="px-4 py-2 bg-accent text-black text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors">
                              Approva
                            </button>
                            <button onClick={() => handleRejectUser(u.id)}
                              className="px-4 py-2 border border-[#2a2a2a] text-red-500/70 text-[9px] hv font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors">
                              Rifiuta
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pending Reservations */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[9px] font-sans uppercase tracking-[0.4em] text-accent font-bold">Prenotazioni in Attesa</span>
                    {pendingResv.length > 0 && (
                      <span className="bg-accent text-black text-[8px] hv font-black px-2 py-0.5 leading-none">{pendingResv.length}</span>
                    )}
                  </div>
                  {pendingResv.length === 0 ? (
                    <div className="border border-dashed border-[#2a2a2a] py-10 px-6 text-center">
                      <p className="text-[9px] font-sans uppercase tracking-widest text-[#444]">Nessuna prenotazione in attesa</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingResv.map(r => {
                        const ev = events.find(e => e.id === r.eventId);
                        return (
                          <div key={r.id} className="flex items-center justify-between p-5 bg-card border border-[#2a2a2a] hover:border-[#333] transition-colors gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="hv font-black uppercase text-white text-sm">{r.customerName}</span>
                                <span className="text-[8px] font-sans uppercase tracking-widest text-[#666] border border-[#2a2a2a] px-2 py-0.5">Tav. {r.tableName}</span>
                                <span className="text-[8px] font-sans uppercase tracking-widest text-orange-400 border border-orange-500/30 px-2 py-0.5">In attesa</span>
                              </div>
                              <div className="flex items-center gap-4 mt-2 flex-wrap">
                                {ev && <p className="text-[9px] font-sans text-[#666]">{ev.name}</p>}
                                <p className="text-[9px] font-sans text-[#555]">PR: {r.prName}</p>
                                <p className="text-[9px] font-sans text-[#555]">{r.guestsCount} pax</p>
                                <p className="text-[9px] font-sans text-accent">€{r.budget}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => handleApproveReservation(r.id)}
                                className="px-4 py-2 bg-accent text-black text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors">
                                Approva
                              </button>
                              <button onClick={() => handleRejectReservation(r.id)}
                                className="px-4 py-2 border border-[#2a2a2a] text-red-500/70 text-[9px] hv font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors">
                                Rifiuta
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Profile — PR only */}
            {view === 'profile' && user.role === 'pr' && (
              <motion.div key="profile" {...PAGE}>
                <PRProfile user={user} onSave={handleUpdateProfile} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* New Event Modal */}
      {showNewEventModal && selectedVenue && (
        <NewEventModal
          venue={selectedVenue}
          floorPlans={venues.find(v => v.id === selectedVenue.id)?.floorPlans ?? []}
          onClose={() => setShowNewEventModal(false)}
          onSubmit={(data) => {
            setEvents(prev => [...prev, {
              id: `e_${Date.now()}`,
              venueId: selectedVenue.id,
              status: 'active',
              ...data,
            }]);
            setShowNewEventModal(false);
          }}
        />
      )}

      {editingVenue && (
        <NewClubModal
          initialData={{ name: editingVenue.name, address: editingVenue.address }}
          onClose={() => setEditingVenue(null)}
          onSubmit={({ name, address }) => {
            setVenues(prev => prev.map(v => v.id === editingVenue.id ? { ...v, name, address } : v));
            setEditingVenue(null);
          }}
        />
      )}

      {showNewClubModal && (
        <NewClubModal
          onClose={() => setShowNewClubModal(false)}
          onSubmit={({ name, address }) => {
            const venueId = `v_${Date.now()}`;
            setVenues(prev => [...prev, { id: venueId, name, address, floorPlans: [] }]);
            setShowNewClubModal(false);
            setEditingFloorPlan({
              venueId,
              fp: { id: '', name: '', canvasWidth: 800, canvasHeight: 600, staticAreas: [], tables: [] },
            });
            setView('editor');
          }}
        />
      )}

      {editingEvent && selectedVenue && (
        <NewEventModal
          venue={selectedVenue}
          floorPlans={venues.find(v => v.id === selectedVenue.id)?.floorPlans ?? []}
          initialData={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSubmit={(data) => {
            setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? { ...ev, ...data } : ev));
            setEditingEvent(null);
          }}
        />
      )}

      {showNewFloorPlanModal && (
        <NewFloorPlanModal
          venues={venues}
          onClose={() => setShowNewFloorPlanModal(false)}
          onSubmit={(venueId) => {
            setShowNewFloorPlanModal(false);
            setEditingFloorPlan({
              venueId,
              fp: { id: '', name: '', canvasWidth: 800, canvasHeight: 600, staticAreas: [], tables: [] },
            });
          }}
        />
      )}

      {editingFloorPlanMeta && (
        <FloorPlanMetaModal
          fp={editingFloorPlanMeta.fp}
          onClose={() => setEditingFloorPlanMeta(null)}
          onSubmit={(name) => {
            setVenues(prev => prev.map(v =>
              v.id === editingFloorPlanMeta.venueId
                ? { ...v, floorPlans: v.floorPlans.map(f => f.id === editingFloorPlanMeta.fp.id ? { ...f, name } : f) }
                : v
            ));
            setEditingFloorPlanMeta(null);
          }}
        />
      )}
    </div>
  );
}

/* ── PRProfile ───────────────────────────────────────────── */
function PRProfile({ user, onSave }: {
  user: UserProfile;
  onSave: (u: { displayName: string; lastName: string; profileImage?: string }) => void;
}) {
  const [firstName, setFirstName]   = useState(user.displayName);
  const [lastName,  setLastName]    = useState(user.lastName ?? '');
  const [image,     setImage]       = useState(user.profileImage ?? '');
  const [saved,     setSaved]       = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ displayName: firstName.trim(), lastName: lastName.trim(), profileImage: image || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const initials = (firstName.substring(0, 1) + (lastName.substring(0, 1) || '')).toUpperCase();

  return (
    <div className="max-w-md">
      <form onSubmit={handleSave} className="space-y-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <button type="button" onClick={() => fileRef.current?.click()}
            className="relative group w-24 h-24 bg-[#111] border border-[#2a2a2a] overflow-hidden hover:border-accent/40 transition-colors">
            {image
              ? <img src={image} alt="" className="w-full h-full object-cover" />
              : <span className="hv font-black text-accent text-2xl">{initials}</span>
            }
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] hv font-black uppercase tracking-widest text-white">Cambia</span>
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <p className="text-[9px] font-sans uppercase tracking-widest text-[#444]">Clicca per cambiare foto</p>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome">
              <input required value={firstName} onChange={e => setFirstName(e.target.value)}
                className="w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-sm text-white outline-none focus:border-accent/40 transition-colors font-sans" />
            </Field>
            <Field label="Cognome">
              <input value={lastName} onChange={e => setLastName(e.target.value)}
                className="w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-sm text-white outline-none focus:border-accent/40 transition-colors font-sans" />
            </Field>
          </div>
          <Field label="Email">
            <input disabled value={user.email}
              className="w-full bg-[#080808] border border-[#1a1a1a] px-4 py-3 text-sm text-[#444] outline-none font-sans cursor-not-allowed" />
          </Field>
        </div>

        <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          className={cn(
            'w-full py-4 text-[10px] hv font-black uppercase tracking-[0.3em] transition-colors',
            saved ? 'bg-green-500 text-black' : 'bg-accent text-black hover:bg-white'
          )}>
          {saved ? 'Salvato ✓' : 'Salva Modifiche'}
        </motion.button>
      </form>
    </div>
  );
}

const SAVED_ACCOUNTS = [
  { label: 'Admin', email: 'g.scanni7@gmail.com', password: '1234' },
  { label: 'PR',    email: 'lucavisca@gmail.com', password: '1234' },
];

/* ── SidebarContent ──────────────────────────────────────── */
function SidebarContent({ user, view, onNav, onLogout, occupancyPct = 0, revenueEst = 0, pendingCount = 0 }: {
  user: UserProfile; view: string;
  onNav: (v: string) => void;
  onLogout: () => void;
  occupancyPct?: number;
  revenueEst?: number;
  pendingCount?: number;
}) {
  const revenueDisplay = revenueEst >= 1000
    ? `€${(revenueEst / 1000).toFixed(1)}K`
    : `€${revenueEst}`;
  return (
    <>
      {/* Brand */}
      <div className="px-6 py-6 border-b border-[#1e1e1e] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent flex items-center justify-center shrink-0">
            <span className="hv font-black text-black text-sm leading-none">N</span>
          </div>
          <div>
            <span className="hv font-black uppercase tracking-widest text-[11px] text-white block leading-tight">Nightplan</span>
            <span className="text-[8px] font-sans text-[#777] uppercase tracking-widest">Management</span>
          </div>
        </div>
      </div>

      {/* KPIs — admin only */}
      {user.role === 'admin' && (
        <div className="px-6 py-6 border-b border-[#1e1e1e] space-y-5 shrink-0">
          <div>
            <div className="hv font-black leading-none text-white" style={{ fontSize: 52 }}>
              {occupancyPct}<span className="text-[28px] text-[#222]">%</span>
            </div>
            <div className="mt-2.5 h-px bg-[#111] relative overflow-hidden">
              <motion.div className="h-px bg-accent absolute inset-y-0 left-0"
                initial={{ width: 0 }} animate={{ width: `${occupancyPct}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }} />
            </div>
            <p className="text-[9px] font-sans uppercase tracking-[0.35em] text-[#777] mt-1.5">Occupancy</p>
          </div>
          <div>
            <div className="hv font-black text-accent leading-none" style={{ fontSize: 36 }}>{revenueDisplay}</div>
            <p className="text-[9px] font-sans uppercase tracking-[0.35em] text-[#777] mt-1">Revenue Est.</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        {user.role === 'admin' ? (
          <>
            <NavSection label="Gestione">
              <NavLink icon={<Calendar size={14}/>} label="Prossimi eventi"
                active={view==='active-events'||view==='plan'}
                onClick={() => onNav('active-events')} />
              <NavLink icon={<Building2 size={14}/>} label="Location"
                active={view==='venues'||view==='venue-events'}
                onClick={() => onNav('venues')} />
              <NavLink icon={<Map size={14}/>} label="Layout Tavoli"
                active={view==='editor'}
                onClick={() => onNav('editor')} />
            </NavSection>
            <NavSection label="Operazioni">
              <NavLink icon={<BarChart3 size={14}/>} label="Prenotazioni"
                active={view==='reservations'}
                onClick={() => onNav('reservations')} />
              <NavLink icon={<Bell size={14}/>} label="Approvazioni"
                active={view==='approvals'}
                onClick={() => onNav('approvals')}
                badge={pendingCount} />
            </NavSection>
          </>
        ) : (
          <div className="space-y-0.5">
            <NavLink icon={<Calendar size={14}/>} label="Eventi"
              active={view==='events'||view==='plan'}
              onClick={() => onNav('events')} />
            <NavLink icon={<BarChart3 size={14}/>} label="Prenotazioni"
              active={view==='reservations'}
              onClick={() => onNav('reservations')} />
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-6 py-6 border-t border-[#1e1e1e] shrink-0">
        <button
          onClick={() => user.role === 'pr' ? onNav('profile') : undefined}
          className={cn('flex items-center gap-3 mb-5 w-full text-left', user.role === 'pr' && 'group cursor-pointer')}
        >
          <div className="w-9 h-9 bg-[#111] border border-[#222] flex items-center justify-center shrink-0 overflow-hidden group-hover:border-accent/30 transition-colors">
            {user.profileImage
              ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              : <span className="hv font-black text-accent text-xs">{user.displayName.substring(0, 2).toUpperCase()}</span>
            }
          </div>
          <div className="min-w-0">
            <p className="text-[11px] hv font-black uppercase text-white truncate group-hover:text-accent transition-colors">
              {user.displayName}{user.lastName ? ' ' + user.lastName : ''}
            </p>
            <p className="text-[8px] font-sans text-[#777] uppercase tracking-widest mt-0.5">{user.role}</p>
          </div>
        </button>
        <button onClick={onLogout}
          className="flex items-center gap-2 text-[#777] hover:text-accent transition-colors text-[9px] font-sans uppercase tracking-widest w-full">
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </>
  );
}

/* ── NavSection ──────────────────────────────────────────── */
function NavSection({ label, children, defaultOpen = true }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between w-full px-3 pt-1 pb-2 group"
      >
        <span className="text-[8px] font-sans uppercase tracking-[0.3em] text-[#444] group-hover:text-[#666] transition-colors">
          {label}
        </span>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="text-[#333] group-hover:text-[#555] transition-colors"
        >
          <ChevronDown size={10} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5 pb-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── NavLink ─────────────────────────────────────────────── */
function NavLink({ icon, label, active, onClick, badge }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2.5 text-[10px] font-sans font-medium uppercase tracking-[0.25em] transition-all group border-l-2',
        active
          ? 'text-accent border-accent bg-accent/5'
          : 'text-[#777] border-transparent hover:text-white hover:border-[#2a2a2a]'
      )}>
      <span className={cn('transition-colors shrink-0', active ? 'text-accent' : 'text-[#666] group-hover:text-[#555]')}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge != null && badge > 0 && (
        <span className="bg-accent text-black text-[8px] hv font-black px-1.5 py-0.5 leading-none min-w-[18px] text-center shrink-0">
          {badge}
        </span>
      )}
    </button>
  );
}

/* ── PageTitle ───────────────────────────────────────────── */
function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <h2 className="hv font-black text-3xl md:text-4xl uppercase text-white leading-tight">{title}</h2>
      {sub && <p className="text-[10px] font-sans uppercase tracking-widest text-[#777] mt-1.5">{sub}</p>}
    </div>
  );
}

/* ── EmptyState ──────────────────────────────────────────── */
function EmptyState({ icon, label, children }: { icon: React.ReactNode; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center mt-4">
      <div className="text-[#444] mb-4">{icon}</div>
      <p className="text-[10px] font-sans uppercase tracking-widest text-[#777]">{label}</p>
      {children}
    </div>
  );
}

/* ── VenueCard ───────────────────────────────────────────── */
function VenueCard({ venue, eventCount, onClick, onEdit, onDelete }: {
  venue: Venue; eventCount: number; onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="group bg-card border border-[#2a2a2a] cursor-pointer overflow-hidden flex flex-col relative"
    >
      <div className="h-[2px] w-0 group-hover:w-full bg-accent transition-all duration-500 origin-left" />

      <div className="p-7 flex flex-col gap-7 flex-1">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 border border-[#222] flex items-center justify-center group-hover:border-accent/30 transition-colors shrink-0">
            <Building2 size={15} className="text-[#777] group-hover:text-accent transition-colors" />
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button onClick={onEdit}
                  className="w-7 h-7 flex items-center justify-center text-[#777] hover:text-accent transition-colors">
                  <Pencil size={12} />
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete}
                  className="w-7 h-7 flex items-center justify-center text-[#777] hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="hv font-black text-[clamp(22px,3vw,30px)] uppercase text-white leading-tight group-hover:text-accent transition-colors">
            {venue.name}
          </h3>
          <p className="text-[9px] font-sans uppercase tracking-widest text-[#666] mt-1">{venue.address}</p>
        </div>

        <div className="flex items-end justify-between border-t border-[#1e1e1e] pt-5">
          <div>
            <span className="hv font-black text-[52px] leading-none text-[#161616] group-hover:text-[#222] transition-colors select-none">
              {String(eventCount).padStart(2, '0')}
            </span>
            <p className="text-[8px] font-sans uppercase tracking-widest text-[#666] mt-0.5">eventi</p>
          </div>
          <div className="flex items-center gap-1.5 text-[#666] group-hover:text-accent transition-colors mb-1">
            <span className="text-[9px] font-sans uppercase tracking-widest">Apri</span>
            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── EventCard ───────────────────────────────────────────── */
function EventCard({ event, venueName, onClick, onEdit, onDelete }: {
  event: Event; venueName?: string; onClick: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="group bg-card border border-[#2a2a2a] cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="h-[2px] w-0 group-hover:w-full bg-accent transition-all duration-500 origin-left" />

      <div className="p-7 flex flex-col gap-5 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {venueName && (
              <span className="text-[8px] font-sans uppercase tracking-widest text-[#666] flex items-center gap-1.5 shrink-0">
                <Building2 size={9} /> {venueName}
              </span>
            )}
            <span className={cn(
              'text-[8px] font-sans font-bold uppercase tracking-widest px-2 py-1 shrink-0',
              event.status === 'active'
                ? 'text-accent bg-accent/8'
                : 'text-[#777] bg-[#111]'
            )}>
              {event.status === 'active' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent blink mr-1.5 align-middle" />}
              {event.status}
            </span>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button onClick={onEdit}
                  className="w-7 h-7 flex items-center justify-center text-[#777] hover:text-accent transition-colors">
                  <Pencil size={12} />
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete}
                  className="w-7 h-7 flex items-center justify-center text-[#777] hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="font-mono text-[10px] text-[#666] mb-2 tracking-wider">{event.date}</p>
          <h3 className="hv font-black text-[clamp(18px,2.5vw,24px)] uppercase text-white leading-tight">{event.name}</h3>
          <p className="text-[11px] font-sans text-[#777] mt-2.5 leading-relaxed line-clamp-2">{event.description}</p>
        </div>

        <div className="flex items-center gap-1.5 text-[#666] group-hover:text-accent transition-colors border-t border-[#1e1e1e] pt-4 mt-1">
          <span className="text-[9px] font-sans uppercase tracking-widest">Apri Pianta</span>
          <ChevronRight size={11} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── ReservationsTable ───────────────────────────────────── */
function ReservationsTable({ reservations, userRole, events }: {
  reservations: Reservation[];
  userRole: string;
  events: Event[];
}) {
  const colCount = userRole === 'admin' ? 6 : 5;

  // Group reservations by event, sorted alphabetically within each group
  const groups: { event: Event | undefined; eventId: string; rows: Reservation[] }[] =
    Object.entries(
      reservations.reduce<Record<string, Reservation[]>>((acc, r) => {
        (acc[r.eventId] ??= []).push(r);
        return acc;
      }, {})
    ).map(([eventId, rows]) => ({
      eventId,
      event: events.find(e => e.id === eventId),
      rows: [...rows].sort((a, b) => a.customerName.localeCompare(b.customerName)),
    }));

  const exportEventCSV = (rows: Reservation[], eventName: string) => {
    const headers = ['Tavolo', 'Cliente', 'PR', 'PAX', 'Budget €', 'Bottiglie'];
    const data = rows.map(r => [
      r.tableName ?? r.tableId,
      r.customerName,
      r.prName,
      r.guestsCount,
      r.budget,
      r.bottles,
    ]);
    const csv = [headers, ...data]
      .map(row => row.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventName.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-card border border-[#2a2a2a] overflow-hidden">
      <div className="px-7 py-5 border-b border-[#1e1e1e]">
        <h2 className="hv font-black text-xl uppercase text-white">Prenotazioni</h2>
      </div>

      {reservations.length === 0 ? (
        <div className="px-7 py-24 text-center">
          <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#444]">Nessuna Prenotazione</p>
        </div>
      ) : (
        <div className="space-y-0">
          {groups.map(({ event, eventId, rows }) => (
            <div key={eventId}>
              {/* Event header */}
              <div className="px-7 py-3 bg-[#0a0a0a] border-b border-[#1e1e1e] flex items-center gap-4">
                <span className="hv font-black text-sm uppercase text-white tracking-widest">
                  {event?.name ?? eventId}
                </span>
                {event && (
                  <span className="font-mono text-[9px] text-[#555]">{event.date}</span>
                )}
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#555]">
                  {rows.length} {rows.length === 1 ? 'prenotazione' : 'prenotazioni'}
                </span>
                {userRole === 'admin' && (
                  <button
                    onClick={() => exportEventCSV(rows, event?.name ?? eventId)}
                    className="ml-auto flex items-center gap-1.5 text-[#555] hover:text-accent transition-colors text-[9px] font-sans uppercase tracking-widest">
                    <Download size={11} /> Scarica
                  </button>
                )}
              </div>

              {/* Mobile cards */}
              <div className="sm:hidden divide-y divide-[#1a1a1a]">
                {rows.map(res => (
                  <div key={res.id} className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0',
                          res.status === 'confirmed' ? 'bg-accent blink' : 'bg-[#222]'
                        )} />
                        <span className={cn('text-[9px] font-sans uppercase tracking-widest',
                          res.status === 'confirmed' ? 'text-accent' : 'text-[#777]'
                        )}>{res.status}</span>
                      </div>
                      <span className="hv font-black text-accent text-lg">€{res.budget}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="hv font-bold text-sm uppercase text-white truncate">{res.customerName}</p>
                        {userRole === 'admin' && <p className="text-[9px] font-sans text-[#777] uppercase tracking-widest mt-0.5">{res.prName}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="hv font-bold text-sm text-white">{res.tableName ?? res.tableId}</p>
                        <p className="text-[9px] font-sans text-[#777] mt-0.5">{res.guestsCount} pax</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#1e1e1e]">
                      {['Tavolo', 'Cliente', ...(userRole === 'admin' ? ['PR'] : []), 'Pax', 'Budget'].map(h => (
                        <th key={h} className="px-7 py-3 text-[8px] font-sans font-bold uppercase tracking-[0.35em] text-[#555]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(res => (
                      <tr key={res.id} className="border-b border-[#1a1a1a] hover:bg-white/[0.01] transition-colors group">
                        <td className="px-7 py-4">
                          <span className="hv font-bold text-sm text-white">{res.tableName ?? res.tableId}</span>
                        </td>
                        <td className="px-7 py-4">
                          <p className="hv font-bold text-[11px] uppercase text-white">{res.customerName}</p>
                        </td>
                        {userRole === 'admin' && (
                          <td className="px-7 py-4">
                            <span className="text-[9px] font-sans text-[#777] uppercase tracking-widest group-hover:text-accent transition-colors">{res.prName}</span>
                          </td>
                        )}
                        <td className="px-7 py-4">
                          <span className="hv font-black text-lg text-[#777]">{res.guestsCount}</span>
                        </td>
                        <td className="px-7 py-4 text-right">
                          <span className="hv font-black text-lg text-accent">€{res.budget}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── NewEventModal ───────────────────────────────────────── */
function NewEventModal({ venue, floorPlans, onClose, onSubmit, initialData }: {
  venue: Venue;
  floorPlans: FloorPlan[];
  onClose: () => void;
  onSubmit: (d: { name: string; date: string; description: string; floorPlanId: string }) => void;
  initialData?: Event;
}) {
  const isEdit = !!initialData;
  const [form, setForm] = useState({
    name: initialData?.name ?? '',
    date: initialData?.date ?? '2026-01-01',
    description: initialData?.description ?? '',
    floorPlanId: initialData?.floorPlanId ?? floorPlans[0]?.id ?? '',
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full sm:max-w-md bg-card border-t border-x sm:border border-[#2a2a2a] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[90vh] flex flex-col"
      >
        <div className="h-[2px] bg-accent shrink-0" />
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[#1e1e1e] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">{isEdit ? 'Modifica Evento' : 'Nuovo Evento'}</h3>
            <p className="text-[9px] font-sans uppercase tracking-widest text-[#777] mt-1">{venue.name}</p>
          </div>
          <button onClick={onClose} className="text-[#777] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        <form className="p-6 sm:p-8 space-y-5 overflow-y-auto" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <Field label="Nome Evento">
            <input required placeholder="ES. TECHNO FRIDAY"
              className="w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Data">
            <input required type="date" min="2026-01-01"
              className="w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-xs font-sans text-white outline-none transition-colors [color-scheme:dark]"
              value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Descrizione (opzionale)">
            <textarea rows={2} placeholder="DETTAGLI..."
              className="w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors resize-none"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>

          {floorPlans.length > 0 && (
            <Field label="Pianta">
              <select
                className="w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white outline-none transition-colors [color-scheme:dark]"
                value={form.floorPlanId}
                onChange={e => setForm({ ...form, floorPlanId: e.target.value })}>
                {floorPlans.map(fp => (
                  <option key={fp.id} value={fp.id}>{fp.name}</option>
                ))}
              </select>
            </Field>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest border border-[#2a2a2a] text-[#777] hover:text-white hover:border-[#333] transition-all">
              Annulla
            </button>
            <button type="submit"
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest bg-accent text-black hover:bg-white transition-colors">
              {isEdit ? 'Salva Modifiche' : 'Crea Evento'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── Micro helpers ───────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#777]">{label}</label>
      {children}
    </div>
  );
}

/* ── NewClubModal ────────────────────────────────────────── */
function NewClubModal({ onClose, onSubmit, initialData }: {
  onClose: () => void;
  onSubmit: (d: { name: string; address: string }) => void;
  initialData?: { name: string; address: string };
}) {
  const isEdit = !!initialData;
  const [form, setForm] = useState({ name: initialData?.name ?? '', address: initialData?.address ?? '' });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full sm:max-w-md bg-card border-t border-x sm:border border-[#2a2a2a] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[90vh] flex flex-col"
      >
        <div className="h-[2px] bg-accent shrink-0" />
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[#1e1e1e] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">{isEdit ? 'Modifica Club' : 'Nuovo Club'}</h3>
            <p className="text-[9px] font-sans uppercase tracking-widest text-[#777] mt-1">{isEdit ? 'Aggiorna nome e indirizzo' : 'Crea il locale e poi la sua piantina'}</p>
          </div>
          <button onClick={onClose} className="text-[#777] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        <form className="p-6 sm:p-8 space-y-5 overflow-y-auto" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <Field label="Nome del Club">
            <input required placeholder="ES. AMNESIA CLUB"
              className="w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Città / Indirizzo">
            <input placeholder="ES. MILANO"
              className="w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors"
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest border border-[#2a2a2a] text-[#777] hover:text-white hover:border-[#333] transition-all">
              Annulla
            </button>
            <button type="submit"
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest bg-accent text-black hover:bg-white transition-colors">
              {isEdit ? 'Salva Modifiche' : 'Avanti'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── NewFloorPlanModal ───────────────────────────────────── */
function NewFloorPlanModal({ venues, onClose, onSubmit }: {
  venues: Venue[];
  onClose: () => void;
  onSubmit: (venueId: string) => void;
}) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '');

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full sm:max-w-md bg-card border-t border-x sm:border border-[#2a2a2a] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[90vh] flex flex-col">
        <div className="h-[2px] bg-accent shrink-0" />
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[#1e1e1e] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">Nuova Pianta</h3>
            <p className="text-[9px] font-sans uppercase tracking-widest text-[#777] mt-1">Seleziona il locale di destinazione</p>
          </div>
          <button onClick={onClose} className="text-[#777] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>
        <form className="p-6 sm:p-8 space-y-5 overflow-y-auto" onSubmit={(e) => { e.preventDefault(); if (venueId) onSubmit(venueId); }}>
          <Field label="Locale">
            <select required
              className="w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white outline-none transition-colors [color-scheme:dark]"
              value={venueId} onChange={e => setVenueId(e.target.value)}>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest border border-[#2a2a2a] text-[#777] hover:text-white hover:border-[#333] transition-all">
              Annulla
            </button>
            <button type="submit"
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest bg-accent text-black hover:bg-white transition-colors">
              Avanti
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── FloorPlanMetaModal ──────────────────────────────────── */
function FloorPlanMetaModal({ fp, onClose, onSubmit }: {
  fp: FloorPlan;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(fp.name);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full sm:max-w-md bg-card border-t border-x sm:border border-[#2a2a2a] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[90vh] flex flex-col">
        <div className="h-[2px] bg-accent shrink-0" />
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[#1e1e1e] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">Modifica Pianta</h3>
            <p className="text-[9px] font-sans uppercase tracking-widest text-[#777] mt-1">Aggiorna il nome della pianta</p>
          </div>
          <button onClick={onClose} className="text-[#777] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>
        <form className="p-6 sm:p-8 space-y-5 overflow-y-auto" onSubmit={(e) => { e.preventDefault(); onSubmit(name); }}>
          <Field label="Nome Pianta">
            <input required
              className="w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors"
              value={name} onChange={e => setName(e.target.value)} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest border border-[#2a2a2a] text-[#777] hover:text-white hover:border-[#333] transition-all">
              Annulla
            </button>
            <button type="submit"
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest bg-accent text-black hover:bg-white transition-colors">
              Salva Modifiche
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-8 h-8 border border-[#2a2a2a] flex items-center justify-center text-[#777] hover:text-accent hover:border-[#2a2a2a] transition-all">
      {children}
    </button>
  );
}
