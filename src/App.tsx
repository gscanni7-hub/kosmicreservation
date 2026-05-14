import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar, Settings, BarChart3, LogOut, ChevronRight, ChevronDown,
  Plus, Download, Filter, Building2, X, ArrowLeft, Menu, Map, Pencil, Trash2,
  UserCheck, Bell, Clock, TrendingUp, CheckCircle2, XCircle, Users, Eye, EyeOff,
  DoorOpen, LogIn
} from 'lucide-react';
import { MOCK_USERS, INITIAL_VENUES, INITIAL_EVENTS, INITIAL_RESERVATIONS, INITIAL_MANAGED_USERS } from './constants';
import { UserProfile, Event, Reservation, Venue, FloorPlan, ManagedUser, Table } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import { isEmailConfigured, sendPasswordResetEmail } from './lib/emailService';
import { isFirebaseConfigured, signInWithGoogle } from './lib/firebase';
import FloorPlanViewer from './components/floorplan/FloorPlanViewer';
import FloorPlanEditor from './components/floorplan/FloorPlanEditor';

type AppView = 'venues' | 'venue-events' | 'events' | 'active-events' | 'plan' | 'editor' | 'reservations' | 'approvals' | 'profile' | 'history' | 'pr-management' | 'checkin';

interface Toast { id: string; message: string; sub?: string; }

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

const findTable = (res: { tableId: string; eventId: string }, events: Event[], venues: Venue[]): Table | null => {
  const event = events.find(e => e.id === res.eventId);
  if (!event) return null;
  const venue = venues.find(v => v.id === event.venueId);
  if (!venue) return null;
  const fp = venue.floorPlans.find(f => f.id === event.floorPlanId) ?? venue.floorPlans[0];
  return fp?.tables.find(t => t.id === res.tableId) ?? null;
};

const calcActualBudget = (reservedBudget: number, actualPeople: number, table: Table | null): number => {
  if (!table) return reservedBudget;
  const { capacity, minSpend } = table;
  const perPersonRate = capacity > 0 ? minSpend / capacity : 0;
  const base = Math.max(reservedBudget, minSpend);
  if (actualPeople <= capacity) return base;
  return Math.round(base + (actualPeople - capacity) * perPersonRate);
};

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
      if (!saved) return INITIAL_MANAGED_USERS;
      const parsed: ManagedUser[] = JSON.parse(saved);
      const merged = [...parsed];
      for (const sys of INITIAL_MANAGED_USERS) {
        if (!merged.find(u => u.id === sys.id)) merged.unshift(sys);
        else {
          const idx = merged.findIndex(u => u.id === sys.id);
          merged[idx] = { ...merged[idx], role: sys.role, status: 'approved' };
        }
      }
      return merged;
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
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    try {
      const saved = localStorage.getItem('nightplan_reservations');
      return saved ? JSON.parse(saved) : INITIAL_RESERVATIONS;
    } catch { return INITIAL_RESERVATIONS; }
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
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
  const [editorVenueId, setEditorVenueId] = useState<string | null>(null);
  const [venueTab, setVenueTab] = useState<'events' | 'layout'>('events');
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [selectedPR, setSelectedPR] = useState<ManagedUser | null>(null);

  /* ── URL ↔ state sync (react-router) ─────────────────────── */
  const navigate = useNavigate();
  const location = useLocation();
  const ignoreNextLocationChange = useRef(false);

  const buildPath = (): string => {
    if (!user) return '/login';
    switch (view) {
      case 'venues':         return '/clubs';
      case 'venue-events':   return selectedVenue ? `/clubs/${selectedVenue.id}` : '/clubs';
      case 'plan':           return (selectedVenue && selectedEvent)
                                ? `/clubs/${selectedVenue.id}/serate/${selectedEvent.id}/pianta`
                                : '/clubs';
      case 'editor':         return editorVenueId
                                ? `/clubs/${editorVenueId}/editor/${editingFloorPlan?.fp.id ?? 'new'}`
                                : '/clubs';
      case 'active-events':  return '/serate-attive';
      case 'events':         return '/serate';
      case 'reservations':   return '/prenotazioni';
      case 'approvals':      return '/approvazioni';
      case 'profile':        return '/profilo';
      case 'history':        return '/storico';
      case 'pr-management':  return selectedPR ? `/pr-team/${selectedPR.id}` : '/pr-team';
      case 'checkin':        return '/ingresso';
      default:               return '/clubs';
    }
  };

  const applyFromUrl = (path: string) => {
    // /clubs/:venueId/serate/:eventId/pianta
    let m = path.match(/^\/clubs\/([^/]+)\/serate\/([^/]+)\/pianta$/);
    if (m) {
      const venue = venues.find(v => v.id === m[1]);
      const event = events.find(e => e.id === m[2]);
      if (venue && event) {
        setSelectedVenue(venue);
        setSelectedEvent(event);
        setView('plan');
      }
      return;
    }
    // /clubs/:venueId/editor/:fpId
    m = path.match(/^\/clubs\/([^/]+)\/editor\/([^/]+)$/);
    if (m) {
      setEditorVenueId(m[1]);
      const venue = venues.find(v => v.id === m[1]);
      const fp = venue?.floorPlans.find(f => f.id === m[2]);
      if (venue && fp) setEditingFloorPlan({ venueId: venue.id, fp });
      setView('editor');
      return;
    }
    // /clubs/:venueId
    m = path.match(/^\/clubs\/([^/]+)$/);
    if (m) {
      const venue = venues.find(v => v.id === m[1]);
      if (venue) {
        setSelectedVenue(venue);
        setView('venue-events');
      }
      return;
    }
    // /pr-team/:prId
    m = path.match(/^\/pr-team\/([^/]+)$/);
    if (m) {
      const pr = managedUsers.find(u => u.id === m[1]);
      if (pr) {
        setSelectedPR(pr);
        setView('pr-management');
      }
      return;
    }
    // Top-level routes
    const topMap: Record<string, AppView> = {
      '/clubs':         'venues',
      '/serate-attive': 'active-events',
      '/serate':        'events',
      '/prenotazioni':  'reservations',
      '/approvazioni':  'approvals',
      '/profilo':       'profile',
      '/storico':       'history',
      '/pr-team':       'pr-management',
      '/ingresso':      'checkin',
    };
    if (topMap[path]) {
      setView(topMap[path]);
    }
  };

  // URL → State (initial mount, browser back/forward, refresh)
  useEffect(() => {
    if (!user) return;
    if (ignoreNextLocationChange.current) {
      ignoreNextLocationChange.current = false;
      return;
    }
    applyFromUrl(location.pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, user]);

  // State → URL
  useEffect(() => {
    if (!user) return;
    const path = buildPath();
    if (location.pathname !== path) {
      ignoreNextLocationChange.current = true;
      navigate(path, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedVenue, selectedEvent, editorVenueId, editingFloorPlan, selectedPR, user]);

  useEffect(() => {
    localStorage.setItem('nightplan_managed_users', JSON.stringify(managedUsers));
  }, [managedUsers]);

  useEffect(() => {
    localStorage.setItem('nightplan_reservations', JSON.stringify(reservations));
  }, [reservations]);

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
    setView(found.role === 'admin' ? 'active-events' : found.role === 'host' ? 'checkin' : 'events');
    setLoginError('');
  };

  const handleGoogleSignIn = async () => {
    const setErr = authScreen === 'register' ? setRegError : setLoginError;
    setErr('');
    try {
      const g = await signInWithGoogle();

      // Admin o PR già esistente?
      const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === g.email.toLowerCase());
      if (mockUser) {
        const profile: UserProfile = { id: mockUser.id, email: mockUser.email, role: mockUser.role, displayName: mockUser.displayName, lastName: mockUser.lastName ?? '', phone: mockUser.phone ?? '', profileImage: g.photoURL };
        localStorage.setItem('nightplan_user', JSON.stringify(profile));
        setUser(profile);
        setView(mockUser.role === 'admin' ? 'active-events' : 'events');
        return;
      }

      const managed = managedUsers.find(u => u.email.toLowerCase() === g.email.toLowerCase());
      if (managed) {
        if (managed.status === 'approved') {
          const profile: UserProfile = { id: managed.id, email: managed.email, role: 'pr', displayName: managed.displayName, lastName: managed.lastName, phone: managed.phone, profileImage: g.photoURL };
          localStorage.setItem('nightplan_user', JSON.stringify(profile));
          setUser(profile);
          setView('events');
        } else if (managed.status === 'pending') {
          setErr('Il tuo account è in attesa di approvazione.');
        } else {
          setErr('Il tuo account non è stato approvato.');
        }
        return;
      }

      // Nuovo utente → crea account PR in attesa
      const newUser: ManagedUser = {
        id: `pr_${Date.now()}`,
        email: g.email,
        password: '',
        role: 'pr',
        displayName: g.displayName || g.email.split('@')[0],
        lastName: g.lastName,
        phone: '',
        status: 'pending',
        createdAt: new Date().toISOString(),
        profileImage: g.photoURL,
      };
      setManagedUsers(prev => [...prev, newUser]);
      setErr('Account creato con Google! In attesa di approvazione dall\'admin.');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErr('Errore durante l\'accesso con Google. Riprova.');
      }
    }
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

  const addToast = (message: string, sub?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, sub }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleCheckIn = (reservationId: string, actualPeople: number) => {
    const res = reservations.find(r => r.id === reservationId);
    if (!res) return;
    const table = findTable(res, events, venues);
    const actualBudget = calcActualBudget(res.budget, actualPeople, table);
    setReservations(prev => prev.map(r =>
      r.id === reservationId ? { ...r, checkedIn: true, actualPeople, actualBudget } : r
    ));
    const diff = actualBudget - res.budget;
    const budgetStr = diff > 0 ? `€${actualBudget} (+€${diff})` : `€${actualBudget}`;
    addToast(`${res.customerName} — entrati`, `${actualPeople} ospiti · Tav. ${res.tableName ?? res.tableId} · ${budgetStr}`);
  };

  const handleUndoCheckIn = (reservationId: string) => {
    setReservations(prev => prev.map(r =>
      r.id === reservationId ? { ...r, checkedIn: false, actualPeople: undefined, actualBudget: undefined } : r
    ));
  };

  const handleUpdatePeople = (reservationId: string, actualPeople: number) => {
    const res = reservations.find(r => r.id === reservationId);
    if (!res) return;
    const table = findTable(res, events, venues);
    const actualBudget = calcActualBudget(res.budget, actualPeople, table);
    setReservations(prev => prev.map(r =>
      r.id === reservationId ? { ...r, actualPeople, actualBudget } : r
    ));
    const diff = actualBudget - res.budget;
    const budgetStr = diff > 0 ? `€${actualBudget} (+€${diff})` : `€${actualBudget}`;
    addToast(`${res.customerName} — aggiornato`, `${actualPeople} ospiti · ${budgetStr}`);
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

  const openVenue = (venue: Venue) => { setSelectedVenue(venue); setVenueTab('events'); setView('venue-events'); };
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
  const revenueEst   = bookedReservations.reduce((sum, r) => sum + (r.actualBudget ?? r.budget), 0);

  const pendingUsers = managedUsers.filter(u => u.status === 'pending');
  const pendingResv  = reservations.filter(r => r.approvalStatus === 'pending');
  const pendingCount = pendingUsers.length + pendingResv.length;
  const prPendingCount = user?.role === 'pr' ? reservations.filter(r => r.prId === user.id && r.approvalStatus === 'pending').length : 0;

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
    if (view === 'history')        return 'Il Mio Storico';
    if (view === 'pr-management')  return selectedPR ? `${selectedPR.displayName} ${selectedPR.lastName}` : 'I Miei PR';
    if (view === 'checkin')        return 'Ingresso Serata';
    return '';
  };

  type Crumb = { label: string; onClick?: () => void };

  const breadcrumbs = (): Crumb[] => {
    if (view === 'venue-events' && selectedVenue) {
      return [
        { label: 'Clubs', onClick: () => { setSelectedVenue(null); setSelectedEvent(null); setView('venues'); } },
        { label: selectedVenue.name },
      ];
    }
    if (view === 'plan' && selectedVenue && selectedEvent) {
      return [
        { label: 'Clubs', onClick: () => { setSelectedVenue(null); setSelectedEvent(null); setView('venues'); } },
        { label: selectedVenue.name, onClick: () => { setSelectedEvent(null); setView('venue-events'); } },
        { label: 'Pianta' },
      ];
    }
    if (view === 'editor' && editorVenueId) {
      const v = venues.find(x => x.id === editorVenueId);
      return [
        { label: 'Clubs', onClick: () => { setEditorVenueId(null); setEditingFloorPlan(null); setView('venues'); } },
        { label: v?.name ?? '', onClick: () => { setEditorVenueId(null); setEditingFloorPlan(null); setView('venue-events'); } },
        { label: 'Editor' },
      ];
    }
    if (view === 'pr-management' && selectedPR) {
      return [
        { label: 'I Miei PR', onClick: () => setSelectedPR(null) },
        { label: `${selectedPR.displayName} ${selectedPR.lastName}` },
      ];
    }
    return [];
  };

  const contextBadges = (): { label: string; color: string }[] => {
    if (view === 'plan' && selectedEvent) {
      const evResv = reservations.filter(r => r.eventId === selectedEvent.id && r.approvalStatus === 'approved');
      const checkedIn = evResv.filter(r => r.checkedIn).length;
      const total = evResv.length;
      const status = selectedEvent.status;
      const statusBadge = status === 'active'
        ? { label: 'Attiva', color: '#22c55e' }
        : status === 'draft'
        ? { label: 'Bozza', color: '#f97316' }
        : { label: 'Conclusa', color: '#666' };
      const badges = [statusBadge];
      if (total > 0) badges.push({ label: `${checkedIn}/${total} entrati`, color: '#D4622A' });
      return badges;
    }
    return [];
  };

  const contextSubtitle = (): string => {
    if (view === 'venue-events' && selectedVenue) return selectedVenue.address;
    if (view === 'plan' && selectedEvent) {
      try {
        return new Date(selectedEvent.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      } catch { return selectedEvent.date; }
    }
    if (view === 'editor' && editingFloorPlan) return editingFloorPlan.fp.name;
    if (view === 'pr-management' && selectedPR) return selectedPR.email;
    return '';
  };

  /* ── LOGIN ──────────────────────────────────────────────── */
  if (!user) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col lg:flex-row">
        {/* Brand panel — desktop */}
        <motion.div
          initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="hidden lg:flex flex-col justify-between p-14 xl:p-20 border-r border-[#2e2e2e] lg:w-[55%] relative overflow-hidden"
        >
          <div className="absolute inset-0 floorplan-grid opacity-40 pointer-events-none" />
          <span className="relative text-[10px] font-sans font-medium uppercase tracking-[0.5em] text-[#999]">
            Table Management Platform
          </span>
          <div className="relative">
            <h1 className="hv font-black leading-[0.88] tracking-tighter uppercase text-white"
              style={{ fontSize: 'clamp(80px, 10vw, 130px)' }}>
              NIGHT<br />PLAN
            </h1>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-px w-10 bg-accent shrink-0" />
              <p className="text-[#999] text-sm font-sans leading-relaxed">
                The operating system<br />for nightlife professionals.
              </p>
            </div>
          </div>
          <span className="relative text-[9px] font-sans text-[#555] uppercase tracking-[0.4em]">
            © 2025 Nightplan Management Suite
          </span>
        </motion.div>

        {/* Login form panel */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex-1 flex flex-col justify-center items-center p-8 lg:p-16 bg-[#1A1A1A]"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-14 text-center">
            <h1 className="hv font-black text-5xl uppercase tracking-tight text-white">NIGHTPLAN</h1>
            <p className="text-[#999] text-[10px] font-sans uppercase tracking-[0.4em] mt-2">Management Suite</p>
          </div>

          <div className="w-full max-w-xs">
            <AnimatePresence mode="wait">
              {authScreen === 'login' ? (
                <motion.div key="login" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>

                  {/* Header */}
                  <div className="mb-8">
                    <h2 className="hv font-black text-2xl uppercase text-white tracking-tight">Accedi</h2>
                    <p className="text-[#555] text-[9px] font-sans uppercase tracking-[0.25em] mt-1.5">Bentornato nella piattaforma</p>
                  </div>

                  {/* Google — metodo principale */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="group w-full flex items-center justify-center gap-3 py-[15px] bg-[#1e1e1e] border border-[#333] hover:border-[#4a4a4a] hover:bg-[#242424] transition-all duration-200 mb-6"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-[10px] hv font-black uppercase tracking-[0.18em] text-[#aaa] group-hover:text-white transition-colors">
                      Accedi con Google
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-[#272727]" />
                    <span className="text-[8px] font-sans uppercase tracking-[0.3em] text-[#444]">oppure con email</span>
                    <div className="flex-1 h-px bg-[#272727]" />
                  </div>

                  {/* Form email/password */}
                  <form onSubmit={handleLogin} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#555]">Email</label>
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
                        className="w-full bg-[#141414] border border-[#2e2e2e] px-5 py-3.5 text-sm text-white placeholder-[#383838] outline-none focus:border-accent/40 transition-colors font-sans"
                      />
                      <datalist id="nightplan-accounts">
                        {SAVED_ACCOUNTS.map(a => <option key={a.email} value={a.email}>{a.label}</option>)}
                      </datalist>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#555]">Password</label>
                        <button type="button"
                          onClick={() => { setAuthScreen('forgot'); setForgotError(''); setForgotSent(false); setForgotDevLink(''); }}
                          className="text-[8px] font-sans text-[#444] hover:text-accent transition-colors uppercase tracking-widest">
                          Dimenticata?
                        </button>
                      </div>
                      <input type="password" autoComplete="current-password" required value={loginPassword}
                        onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }}
                        placeholder="••••••••"
                        className="w-full bg-[#141414] border border-[#2e2e2e] px-5 py-3.5 text-sm text-white placeholder-[#383838] outline-none focus:border-accent/40 transition-colors font-sans" />
                    </div>
                    {loginError && <p className="text-red-500/80 text-[10px] font-sans uppercase tracking-widest pt-1">{loginError}</p>}
                    <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      className="group w-full bg-accent text-black py-[15px] text-[10px] hv font-black uppercase tracking-[0.3em] flex items-center justify-between px-6 hover:bg-white transition-all duration-200 mt-1 hover:shadow-[0_0_24px_rgba(212,98,42,0.30)] glow-sm">
                      <span>Accedi</span>
                      <ChevronRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </form>

                  {/* Registrazione */}
                  <p className="text-center text-[9px] font-sans text-[#444] uppercase tracking-widest mt-8">
                    Sei un PR?{' '}
                    <button onClick={() => { setAuthScreen('register'); setRegError(''); setRegDone(false); }}
                      className="text-[#777] hover:text-accent transition-colors underline underline-offset-2">
                      Registrati
                    </button>
                  </p>
                </motion.div>
              ) : authScreen === 'forgot' ? (
                <motion.div key="forgot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  {forgotSent ? (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                        <UserCheck size={24} className="text-accent" />
                      </div>
                      <h2 className="hv font-black text-xl uppercase text-white mb-3">Email Inviata</h2>
                      <p className="text-[#999] text-[10px] font-sans uppercase tracking-widest leading-loose">
                        Controlla la tua casella di posta<br />e clicca il link per reimpostare<br />la password.
                      </p>
                      {forgotDevLink && (
                        <div className="mt-6 p-4 bg-[#141414] border border-[#383838] text-left">
                          <p className="text-[8px] font-sans uppercase tracking-widest text-[#777] mb-2">Link di reset (dev mode)</p>
                          <a href={forgotDevLink} className="text-accent text-[10px] font-mono break-all hover:underline">
                            Clicca qui per reimpostare
                          </a>
                        </div>
                      )}
                      <button onClick={() => { setAuthScreen('login'); setForgotSent(false); setForgotEmail(''); }}
                        className="mt-8 w-full py-3.5 text-[9px] hv font-black uppercase tracking-[0.2em] border border-[#383838] text-[#888] hover:border-accent/40 hover:text-accent transition-colors">
                        Torna al Login
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-10">
                        <h2 className="hv font-black text-2xl uppercase text-white">Password Dimenticata</h2>
                        <p className="text-[#999] text-[10px] font-sans uppercase tracking-widest mt-2">Inserisci la tua email</p>
                      </div>
                      <form onSubmit={handleForgotPassword} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666]">Email</label>
                          <input type="email" required value={forgotEmail}
                            onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }}
                            placeholder="tua@email.it"
                            className="w-full bg-[#141414] border border-[#383838] px-5 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                        </div>
                        {forgotError && <p className="text-red-500/80 text-[10px] font-sans uppercase tracking-widest pt-1">{forgotError}</p>}
                        <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          className="group w-full bg-accent text-black py-[18px] text-[10px] hv font-black uppercase tracking-[0.3em] flex items-center justify-between px-6 hover:bg-white transition-all duration-200 mt-2 hover:shadow-[0_0_24px_rgba(212,98,42,0.40)] glow-sm">
                          <span>Invia Link</span>
                          <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </form>
                      <div className="mt-8 pt-6 border-t border-[#2e2e2e]">
                        <button onClick={() => setAuthScreen('login')}
                          className="w-full text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666] hover:text-[#999] transition-colors py-2">
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
                      <p className="text-[#999] text-[10px] font-sans uppercase tracking-widest leading-loose">
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
                        <p className="text-[#999] text-[10px] font-sans uppercase tracking-widest mt-2">{resetEmailState}</p>
                      </div>
                      <form onSubmit={handleResetPassword} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666]">Nuova Password</label>
                          <input type="password" required minLength={4} value={newPassword}
                            onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                            placeholder="••••••••"
                            className="w-full bg-[#141414] border border-[#383838] px-5 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                        </div>
                        {resetError && <p className="text-red-500/80 text-[10px] font-sans uppercase tracking-widest pt-1">{resetError}</p>}
                        <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                          className="group w-full bg-accent text-black py-[18px] text-[10px] hv font-black uppercase tracking-[0.3em] flex items-center justify-between px-6 hover:bg-white transition-all duration-200 mt-2 hover:shadow-[0_0_24px_rgba(212,98,42,0.40)] glow-sm">
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
                  <p className="text-[#999] text-[10px] font-sans uppercase tracking-widest leading-loose">
                    Il tuo account è in attesa<br />di approvazione admin.
                  </p>
                  <button onClick={() => { setAuthScreen('login'); setRegDone(false); setRegName(''); setRegEmail(''); setRegPassword(''); }}
                    className="mt-8 w-full py-3.5 text-[9px] hv font-black uppercase tracking-[0.2em] border border-[#383838] text-[#888] hover:border-accent/40 hover:text-accent transition-colors">
                    Torna al Login
                  </button>
                </motion.div>
              ) : (
                <motion.div key="register" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                  {/* Header */}
                  <div className="mb-8">
                    <h2 className="hv font-black text-2xl uppercase text-white tracking-tight">Registrati</h2>
                    <p className="text-[#555] text-[9px] font-sans uppercase tracking-[0.25em] mt-1.5">Crea il tuo account PR</p>
                  </div>

                  {/* Google — metodo rapido */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="group w-full flex items-center justify-center gap-3 py-[15px] bg-[#1e1e1e] border border-[#333] hover:border-[#4a4a4a] hover:bg-[#242424] transition-all duration-200 mb-6"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-[10px] hv font-black uppercase tracking-[0.18em] text-[#aaa] group-hover:text-white transition-colors">
                      Registrati con Google
                    </span>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex-1 h-px bg-[#272727]" />
                    <span className="text-[8px] font-sans uppercase tracking-[0.3em] text-[#444]">oppure manualmente</span>
                    <div className="flex-1 h-px bg-[#272727]" />
                  </div>

                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666]">Nome</label>
                        <input required value={regName} onChange={e => { setRegName(e.target.value); setRegError(''); }}
                          placeholder="Mario"
                          className="w-full bg-[#141414] border border-[#383838] px-4 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666]">Cognome</label>
                        <input required value={regLastName} onChange={e => { setRegLastName(e.target.value); setRegError(''); }}
                          placeholder="Rossi"
                          className="w-full bg-[#141414] border border-[#383838] px-4 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666]">Email</label>
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
                        className={`w-full bg-[#141414] border px-5 py-4 text-sm text-white placeholder-[#444] outline-none transition-colors font-sans ${regEmailError ? 'border-red-500/60' : 'border-[#383838] focus:border-accent/40'}`}
                      />
                      {regEmailError && <p className="text-red-500/80 text-[9px] font-sans uppercase tracking-widest">{regEmailError}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666]">Telefono</label>
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
                        className={`w-full bg-[#141414] border px-5 py-4 text-sm text-white placeholder-[#444] outline-none transition-colors font-sans ${regPhoneError ? 'border-red-500/60' : 'border-[#383838] focus:border-accent/40'}`}
                      />
                      {regPhoneError && <p className="text-red-500/80 text-[9px] font-sans uppercase tracking-widest">{regPhoneError}</p>}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666]">Password</label>
                      <input type="password" required value={regPassword} onChange={e => { setRegPassword(e.target.value); setRegError(''); }}
                        placeholder="••••••••"
                        className="w-full bg-[#141414] border border-[#383838] px-5 py-4 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
                    </div>
                    {regError && <p className="text-red-500/80 text-[10px] font-sans uppercase tracking-widest pt-1">{regError}</p>}
                    <motion.button
                      type="submit"
                      disabled={!!regEmailError || !!regPhoneError}
                      whileHover={!regEmailError && !regPhoneError ? { scale: 1.01 } : {}}
                      whileTap={!regEmailError && !regPhoneError ? { scale: 0.99 } : {}}
                      className={`group w-full py-[18px] text-[10px] hv font-black uppercase tracking-[0.3em] flex items-center justify-between px-6 transition-colors mt-2 ${regEmailError || regPhoneError ? 'bg-[#2a2a2a] text-[#777] cursor-not-allowed' : 'bg-accent text-black hover:bg-white'}`}>
                      <span>Invia Richiesta</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                  </form>

                  <p className="text-center text-[9px] font-sans text-[#444] uppercase tracking-widest mt-8">
                    Hai già un account?{' '}
                    <button onClick={() => { setAuthScreen('login'); setRegError(''); setRegEmailError(''); setRegPhoneError(''); }}
                      className="text-[#777] hover:text-accent transition-colors underline underline-offset-2">
                      Accedi
                    </button>
                  </p>
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
      <div className="md:hidden h-12 bg-[#171717] border-b border-[#2e2e2e] flex items-center justify-between px-4 sticky top-0 z-50 shrink-0">
        <span className="hv font-black text-xl uppercase tracking-tight">NP</span>
        <button onClick={() => setMobileSidebarOpen(o => !o)} className="text-[#777] hover:text-white transition-colors p-1">
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
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#171717] border-r border-[#2e2e2e] z-50 md:hidden flex flex-col"
            >
              <SidebarContent
                user={user}
                view={view}
                onNav={(v) => { setView(v as AppView); setSelectedVenue(null); setSelectedEvent(null); setEditingFloorPlan(null); setEditorVenueId(null); setSelectedPR(null); setMobileSidebarOpen(false); }}
                onLogout={handleLogout}
                occupancyPct={occupancyPct}
                revenueEst={revenueEst}
                pendingCount={pendingCount}
                prPendingCount={prPendingCount}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 xl:w-64 border-r border-[#2e2e2e] bg-[#171717] flex-col shrink-0 sticky top-0 h-screen">
        <SidebarContent user={user} view={view}
          onNav={(v) => { setView(v as AppView); setSelectedVenue(null); setSelectedEvent(null); setEditingFloorPlan(null); setEditorVenueId(null); setSelectedPR(null); }}
          onLogout={handleLogout}
          occupancyPct={occupancyPct}
          revenueEst={revenueEst}
          pendingCount={pendingCount}
          prPendingCount={prPendingCount}
        />
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto pb-16 md:pb-0">
        {/* Header */}
        {(() => {
          const crumbs = breadcrumbs();
          const subtitle = contextSubtitle();
          const badges = contextBadges();
          const expanded = crumbs.length > 0;

          if (!expanded) {
            return (
              <header className="h-12 border-b border-[#2e2e2e] flex items-center justify-between px-5 bg-[#171717]/95 backdrop-blur-sm sticky top-0 z-30 shrink-0">
                <div className="flex items-center gap-4 min-w-0">
                  {showBack && (
                    <button onClick={goBack}
                      className="flex items-center gap-1.5 text-[#666] hover:text-accent transition-colors text-[10px] font-sans uppercase tracking-widest shrink-0">
                      <ArrowLeft size={11} /> Indietro
                    </button>
                  )}
                  <span className="text-[10px] font-sans font-medium uppercase tracking-[0.35em] text-[#999] truncate">
                    {headerTitle()}
                  </span>
                </div>
              </header>
            );
          }

          return (
            <header className="border-b border-[#2e2e2e] bg-[#171717]/95 backdrop-blur-sm sticky top-0 z-30 shrink-0">
              <div className="px-5 py-3">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
                  {crumbs.map((bc, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <ChevronRight size={10} className="text-[#444] shrink-0" />}
                      {bc.onClick ? (
                        <button onClick={bc.onClick}
                          className="text-[8px] font-sans uppercase tracking-[0.3em] text-[#666] hover:text-accent transition-colors truncate">
                          {bc.label}
                        </button>
                      ) : (
                        <span className="text-[8px] font-sans uppercase tracking-[0.3em] text-[#999] truncate">
                          {bc.label}
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                {/* Title + subtitle + badges */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h1 className="hv font-black uppercase text-white text-base md:text-lg tracking-tight truncate">
                    {headerTitle()}
                  </h1>
                  {subtitle && (
                    <span className="text-[10px] font-sans text-[#888] truncate capitalize">
                      {subtitle}
                    </span>
                  )}
                  {badges.map((badge, i) => (
                    <span key={i}
                      className="text-[8px] font-sans uppercase tracking-widest px-2 py-0.5 border"
                      style={{ color: badge.color, borderColor: `${badge.color}33` }}>
                      {badge.label}
                    </span>
                  ))}
                </div>
              </div>
            </header>
          );
        })()}

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

            {/* Venue detail — Serate + Pianta */}
            {view === 'venue-events' && selectedVenue && (
              <motion.div key="venue-events" {...PAGE}>
                {/* Header */}
                <div className="mb-7">
                  <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#555] mb-1">Club</p>
                  <h2 className="hv font-black text-4xl uppercase text-white">{selectedVenue.name}</h2>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#242424] mb-8 gap-1">
                  {(['events', 'layout'] as const).map(tab => (
                    <button key={tab} onClick={() => setVenueTab(tab)}
                      className={`px-5 py-2.5 text-[9px] hv font-black uppercase tracking-[0.2em] transition-colors relative ${
                        venueTab === tab ? 'text-white' : 'text-[#555] hover:text-[#888]'
                      }`}>
                      {tab === 'events' ? 'Serate' : 'Pianta'}
                      {venueTab === tab && (
                        <motion.div layoutId="venue-tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-px bg-accent"
                          transition={{ duration: 0.2 }} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab: Serate */}
                <AnimatePresence mode="wait">
                  {venueTab === 'events' && (
                    <motion.div key="tab-events" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      {venueEvents.length === 0 ? (
                        <EmptyState icon={<Calendar size={28} />} label="Nessuna serata ancora.">
                          <button onClick={() => setShowNewEventModal(true)}
                            className="mt-5 flex items-center gap-2 bg-accent text-black px-5 py-3 text-[10px] hv font-black uppercase tracking-widest hover:bg-white transition-colors">
                            <Plus size={13} /> Crea Serata
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
                                className="flex items-center gap-2 border border-[#383838] text-[#999] px-6 py-3 text-[9px] hv font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all">
                                <Plus size={11} /> Nuova Serata
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* Tab: Pianta */}
                  {venueTab === 'layout' && (
                    <motion.div key="tab-layout" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                      <div>
                          <div className="flex justify-end mb-6">
                            <button onClick={() => setEditingFloorPlan({ venueId: selectedVenue.id, fp: { id: `fp_${Date.now()}`, name: '', canvasWidth: 800, canvasHeight: 600, staticAreas: [], tables: [] } })}
                              className="flex items-center gap-2 bg-accent text-black px-5 py-3 text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors">
                              <Plus size={12} /> Nuova Pianta
                            </button>
                          </div>
                          {(() => {
                            const liveFloorPlans = venues.find(v => v.id === selectedVenue.id)?.floorPlans ?? [];
                            return liveFloorPlans.length === 0 ? (
                            <EmptyState icon={<Map size={28} />} label="Nessuna pianta per questo club." />
                          ) : (
                            <div className="border border-[#383838] bg-card divide-y divide-[#2a2a2a]">
                              {liveFloorPlans.map(fp => (
                                <div key={fp.id} className="px-7 py-4 flex items-center justify-between group hover:bg-white/[0.01] transition-colors">
                                  <div className="flex items-center gap-4">
                                    <Map size={14} className="text-[#888] shrink-0" />
                                    <div>
                                      <p className="hv font-black text-sm uppercase text-white">{fp.name}</p>
                                      <p className="text-[8px] font-sans text-[#999] mt-0.5">{fp.tables.length} tavoli</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setEditingFloorPlanMeta({ venueId: selectedVenue.id, fp })}
                                        className="w-7 h-7 flex items-center justify-center text-[#999] hover:text-accent transition-colors">
                                        <Pencil size={12} />
                                      </button>
                                      <button onClick={() => setVenues(prev => prev.map(v =>
                                        v.id === selectedVenue.id ? { ...v, floorPlans: v.floorPlans.filter(f => f.id !== fp.id) } : v
                                      ))} className="w-7 h-7 flex items-center justify-center text-[#999] hover:text-red-500 transition-colors">
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                    <button onClick={() => setEditingFloorPlan({ venueId: selectedVenue.id, fp })}
                                      className="text-[9px] font-sans uppercase tracking-widest text-[#999] hover:text-accent transition-colors flex items-center gap-1.5">
                                      Apri Canvas <ChevronRight size={11} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                          })()}
                        </div>
                    </motion.div>
                  )}
                </AnimatePresence>
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
                {(() => {
                  const filteredVenue = editorVenueId ? venues.find(v => v.id === editorVenueId) : null;
                  const venuesToShow = filteredVenue ? [filteredVenue] : venues;
                  const title = filteredVenue ? `Pianta — ${filteredVenue.name}` : 'Layout Tavoli';
                  const sub = filteredVenue ? `Gestisci il layout di ${filteredVenue.name}` : 'Gestisci le piante di tutti i locali';
                  return (
                    <div>
                      <div className="flex items-start justify-between mb-8 gap-4">
                        <div>
                          {filteredVenue && (
                            <button
                              onClick={() => { setEditorVenueId(null); setView('venue-events'); }}
                              className="flex items-center gap-2 text-[#666] hover:text-accent transition-colors text-[10px] font-sans uppercase tracking-widest mb-4">
                              <ArrowLeft size={11} /> Torna al Club
                            </button>
                          )}
                          <PageTitle title={title} sub={sub} />
                        </div>
                        <button
                          onClick={() => setShowNewFloorPlanModal(true)}
                          className="flex items-center gap-2 bg-accent text-black px-5 py-3 text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors shrink-0 mt-1">
                          <Plus size={12} /> Nuova Pianta
                        </button>
                      </div>
                      <div className="space-y-6">
                        {venuesToShow.map(venue => (
                          <div key={venue.id} className="border border-[#383838] bg-card">
                            {!filteredVenue && (
                              <div className="px-7 py-5 border-b border-[#2e2e2e]">
                                <h3 className="hv font-black text-xl uppercase text-white">{venue.name}</h3>
                                <p className="text-[9px] font-sans uppercase tracking-widest text-[#999] mt-0.5">{venue.address}</p>
                              </div>
                            )}
                            {venue.floorPlans.length === 0 ? (
                              <div className="px-7 py-8 text-center">
                                <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#666]">Nessuna pianta</p>
                              </div>
                            ) : (
                              <div className="divide-y divide-[#2a2a2a]">
                                {venue.floorPlans.map(fp => (
                                  <div key={fp.id} className="px-7 py-4 flex items-center justify-between group hover:bg-white/[0.01] transition-colors">
                                    <div className="flex items-center gap-4">
                                      <Map size={14} className="text-[#888] shrink-0" />
                                      <div>
                                        <p className="hv font-black text-sm uppercase text-white">{fp.name}</p>
                                        <p className="text-[8px] font-sans text-[#999] mt-0.5">{fp.tables.length} tavoli</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => setEditingFloorPlanMeta({ venueId: venue.id, fp })}
                                          className="w-7 h-7 flex items-center justify-center text-[#999] hover:text-accent transition-colors">
                                          <Pencil size={12} />
                                        </button>
                                        <button
                                          onClick={() => setVenues(prev => prev.map(v =>
                                            v.id === venue.id ? { ...v, floorPlans: v.floorPlans.filter(f => f.id !== fp.id) } : v
                                          ))}
                                          className="w-7 h-7 flex items-center justify-center text-[#999] hover:text-red-500 transition-colors">
                                          <Trash2 size={12} />
                                        </button>
                                      </div>
                                      <button
                                        onClick={() => setEditingFloorPlan({ venueId: venue.id, fp })}
                                        className="text-[9px] font-sans uppercase tracking-widest text-[#999] hover:text-accent transition-colors flex items-center gap-1.5">
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
                  );
                })()}
              </motion.div>
            )}

            {/* Reservations */}
            {view === 'reservations' && (
              <motion.div key="reservations" {...PAGE}>
                <ReservationsTable
                  reservations={user.role === 'admin' ? reservations : reservations.filter(r => r.prId === user.id)}
                  userRole={user.role}
                  events={events}
                  onDelete={(id) => setReservations(prev => prev.filter(r => r.id !== id))}
                  onEdit={(r) => setEditingReservation(r)}
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
                    <div className="border border-dashed border-[#383838] py-10 px-6 text-center">
                      <p className="text-[9px] font-sans uppercase tracking-widest text-[#666]">Nessuna richiesta in attesa</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingUsers.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-5 bg-card border border-[#383838] hover:border-[#333] transition-colors">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-9 h-9 bg-[#2a2a2a] border border-[#383838] flex items-center justify-center shrink-0">
                              <span className="hv font-black text-[#888] text-xs">{u.displayName.substring(0, 2).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="hv font-black uppercase text-white text-[11px]">{u.displayName}</p>
                              <p className="text-[9px] font-sans text-[#888] mt-0.5">{u.email}</p>
                              <p className="text-[8px] font-sans text-[#666] uppercase tracking-widest mt-0.5">
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
                              className="px-4 py-2 border border-[#383838] text-red-500/70 text-[9px] hv font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors">
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
                    <div className="border border-dashed border-[#383838] py-10 px-6 text-center">
                      <p className="text-[9px] font-sans uppercase tracking-widest text-[#666]">Nessuna prenotazione in attesa</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pendingResv.map(r => {
                        const ev = events.find(e => e.id === r.eventId);
                        return (
                          <div key={r.id} className="flex items-center justify-between p-5 bg-card border border-[#383838] hover:border-[#333] transition-colors gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="hv font-black uppercase text-white text-sm">{r.customerName}</span>
                                <span className="text-[8px] font-sans uppercase tracking-widest text-[#888] border border-[#383838] px-2 py-0.5">Tav. {r.tableName}</span>
                                <span className="text-[8px] font-sans uppercase tracking-widest text-orange-400 border border-orange-500/30 px-2 py-0.5">In attesa</span>
                              </div>
                              <div className="flex items-center gap-4 mt-2 flex-wrap">
                                {ev && <p className="text-[9px] font-sans text-[#888]">{ev.name}</p>}
                                <p className="text-[9px] font-sans text-[#777]">PR: {r.prName}</p>
                                <p className="text-[9px] font-sans text-[#777]">{r.guestsCount} pax</p>
                                <p className="text-[9px] font-sans text-accent">€{r.budget}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button onClick={() => handleApproveReservation(r.id)}
                                className="px-4 py-2 bg-accent text-black text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors">
                                Approva
                              </button>
                              <button onClick={() => handleRejectReservation(r.id)}
                                className="px-4 py-2 border border-[#383838] text-red-500/70 text-[9px] hv font-black uppercase tracking-widest hover:border-red-500 hover:text-red-500 transition-colors">
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

            {/* PR Management — admin only */}
            {view === 'pr-management' && user.role === 'admin' && (
              <motion.div key="pr-management" {...PAGE}>
                <PRManagementPage
                  managedUsers={managedUsers}
                  reservations={reservations}
                  events={events}
                  selectedPR={selectedPR}
                  onSelectPR={setSelectedPR}
                  onBack={() => setSelectedPR(null)}
                  onUpdateStatus={(id, status) => setManagedUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u))}
                />
              </motion.div>
            )}

            {/* Profile — PR only */}
            {view === 'profile' && user.role === 'pr' && (
              <motion.div key="profile" {...PAGE}>
                <PRProfile user={user} onSave={handleUpdateProfile} />
              </motion.div>
            )}

            {/* History — PR only */}
            {view === 'history' && user.role === 'pr' && (() => {
              const myRes = reservations.filter(r => r.prId === user.id);
              const myEventIds = [...new Set(myRes.map(r => r.eventId))];
              const approved = myRes.filter(r => r.approvalStatus === 'approved').length;
              const totalBudget = myRes.reduce((s, r) => s + (r.actualBudget ?? r.budget), 0);
              const approvalRate = myRes.length > 0 ? Math.round((approved / myRes.length) * 100) : 0;

              return (
                <motion.div key="history" {...PAGE}>
                  <PageTitle title="Il Mio Storico" sub="Riepilogo delle tue prenotazioni" />

                  {/* KPIs */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 mb-10">
                    <div className="border border-[#2a2a2a] bg-card px-6 py-6">
                      <div className="text-accent mb-4"><BarChart3 size={18}/></div>
                      <div className="hv font-black text-4xl text-white leading-none">{myRes.length}</div>
                      <div className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#555] mt-3">Tavoli prenotati</div>
                    </div>
                    <div className="border border-[#2a2a2a] bg-card px-6 py-6">
                      <div className="text-accent mb-4"><TrendingUp size={18}/></div>
                      <div className="hv font-black text-4xl text-white leading-none">€{totalBudget >= 1000 ? `${(totalBudget/1000).toFixed(1)}K` : totalBudget}</div>
                      <div className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#555] mt-3">Budget generato</div>
                    </div>
                    <div className="border border-[#2a2a2a] bg-card px-6 py-6">
                      <div className="text-accent mb-4"><Calendar size={18}/></div>
                      <div className="hv font-black text-4xl text-white leading-none">{myEventIds.length}</div>
                      <div className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#555] mt-3">Serate lavorate</div>
                    </div>
                    <div className="border border-[#2a2a2a] bg-card px-6 py-6">
                      <div className="text-accent mb-4"><CheckCircle2 size={18}/></div>
                      <div className="hv font-black text-4xl text-white leading-none">{approvalRate}<span className="text-xl text-[#555]">%</span></div>
                      <div className="mt-3 h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                        <motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: `${approvalRate}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                      </div>
                      <div className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#555] mt-2">Tasso approvazione</div>
                    </div>
                  </div>

                  {/* Events list */}
                  {myEventIds.length === 0 ? (
                    <EmptyState icon={<Clock size={28}/>} label="Nessuna prenotazione ancora." />
                  ) : (
                    <div className="space-y-3">
                      {myEventIds.map(eventId => {
                        const event = events.find(e => e.id === eventId);
                        if (!event) return null;
                        const venue = venues.find(v => v.id === event.venueId);
                        const eventRes = myRes.filter(r => r.eventId === eventId);
                        const eventApproved = eventRes.filter(r => r.approvalStatus === 'approved').length;
                        const eventBudget = eventRes.reduce((s, r) => s + (r.actualBudget ?? r.budget), 0);
                        return (
                          <HistoryEventRow
                            key={eventId}
                            event={event}
                            venueName={venue?.name ?? '—'}
                            reservations={eventRes}
                            approvedCount={eventApproved}
                            totalBudget={eventBudget}
                          />
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })()}

            {/* Check-in ingresso */}
            {view === 'checkin' && (
              <motion.div key="checkin" {...PAGE}>
                <HostCheckinView
                  reservations={reservations}
                  events={events}
                  venues={venues}
                  userRole={user.role}
                  currentUser={user}
                  onCheckIn={handleCheckIn}
                  onUndoCheckIn={handleUndoCheckIn}
                  onUpdatePeople={handleUpdatePeople}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* Bottom tab bar — mobile only, admin/pr */}
      {user.role !== 'host' && (
        <BottomTabBar
          user={user}
          view={view}
          pendingCount={pendingCount}
          prPendingCount={prPendingCount}
          onNav={(v) => {
            setView(v as AppView);
            setSelectedVenue(null);
            setSelectedEvent(null);
            setEditingFloorPlan(null);
            setEditorVenueId(null);
            setSelectedPR(null);
          }}
        />
      )}

      {/* Toast overlay */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="bg-[#1e1e1e] border border-[#2e2e2e] border-l-4 border-l-accent px-5 py-4 min-w-[260px] shadow-2xl"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-accent shrink-0" />
                <span className="hv font-black text-white text-[11px] uppercase tracking-widest">{t.message}</span>
              </div>
              {t.sub && <p className="text-[9px] font-sans text-[#777] mt-1.5 pl-5 uppercase tracking-widest">{t.sub}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
          onSubmit={(venueId, name) => {
            setShowNewFloorPlanModal(false);
            setEditingFloorPlan({
              venueId,
              fp: { id: `fp_${Date.now()}`, name, canvasWidth: 800, canvasHeight: 600, staticAreas: [], tables: [] },
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

      {editingFloorPlan && (
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
          onClose={() => setEditingFloorPlan(null)}
        />
      )}

      {editingReservation && (
        <ReservationQuickEditModal
          reservation={editingReservation}
          onClose={() => setEditingReservation(null)}
          onSave={(updated) => {
            setReservations(prev => prev.map(r => r.id === updated.id ? updated : r));
            setEditingReservation(null);
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
            className="relative group w-24 h-24 bg-[#2a2a2a] border border-[#383838] overflow-hidden hover:border-accent/40 transition-colors">
            {image
              ? <img src={image} alt="" className="w-full h-full object-cover" />
              : <span className="hv font-black text-accent text-2xl">{initials}</span>
            }
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] hv font-black uppercase tracking-widest text-white">Cambia</span>
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          <p className="text-[9px] font-sans uppercase tracking-widest text-[#666]">Clicca per cambiare foto</p>
        </div>

        {/* Fields */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome">
              <input required value={firstName} onChange={e => setFirstName(e.target.value)}
                className="w-full bg-bg border border-[#383838] px-4 py-3 text-sm text-white outline-none focus:border-accent/40 transition-colors font-sans" />
            </Field>
            <Field label="Cognome">
              <input value={lastName} onChange={e => setLastName(e.target.value)}
                className="w-full bg-bg border border-[#383838] px-4 py-3 text-sm text-white outline-none focus:border-accent/40 transition-colors font-sans" />
            </Field>
          </div>
          <Field label="Email">
            <input disabled value={user.email}
              className="w-full bg-[#080808] border border-[#1a1a1a] px-4 py-3 text-sm text-[#666] outline-none font-sans cursor-not-allowed" />
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
  { label: 'Admin',        email: 'g.scanni7@gmail.com',      password: '1234' },
  { label: 'PR',           email: 'lucavisca@gmail.com',      password: '1234' },
  { label: 'Accoglienza',  email: 'accoglienza@nightplan.it', password: '1234' },
];

/* ── PRManagementPage ────────────────────────────────────── */
function PRManagementPage({ managedUsers, reservations, events, selectedPR, onSelectPR, onBack, onUpdateStatus }: {
  managedUsers: ManagedUser[];
  reservations: Reservation[];
  events: Event[];
  selectedPR: ManagedUser | null;
  onSelectPR: (pr: ManagedUser) => void;
  onBack: () => void;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void;
}) {
  const prUsers = managedUsers.filter(u => u.role === 'pr');

  const prStats = (prId: string) => {
    const res = reservations.filter(r => r.prId === prId);
    const approved = res.filter(r => r.approvalStatus === 'approved').length;
    const budget = res.reduce((s, r) => s + r.budget, 0);
    const rate = res.length > 0 ? Math.round((approved / res.length) * 100) : 0;
    const eventCount = new Set(res.map(r => r.eventId)).size;
    return { total: res.length, budget, rate, eventCount };
  };

  const statusBadge = (s: string) => {
    if (s === 'approved') return <span className="px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">Attivo</span>;
    if (s === 'rejected') return <span className="px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">Rifiutato</span>;
    return <span className="px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-[#1e1e1e] text-[#777] border border-[#2a2a2a]">In attesa</span>;
  };

  if (selectedPR) {
    return <PRDetailView pr={selectedPR} reservations={reservations} events={events} onBack={onBack} onUpdateStatus={onUpdateStatus} statusBadge={statusBadge} />;
  }

  return (
    <div>
      <PageTitle title="I Miei PR" sub={`${prUsers.length} professionisti registrati`} />
      {prUsers.length === 0 ? (
        <EmptyState icon={<Users size={28}/>} label="Nessun PR registrato." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {prUsers.map(pr => {
            const stats = prStats(pr.id);
            return (
              <div key={pr.id} className="border border-[#2a2a2a] bg-card p-6 flex flex-col gap-5 hover:border-[#3a3a3a] transition-colors">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0 overflow-hidden">
                    {pr.profileImage
                      ? <img src={pr.profileImage} alt="" className="w-full h-full object-cover" />
                      : <span className="hv font-black text-accent text-sm">{pr.displayName.slice(0,2).toUpperCase()}</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="hv font-black text-sm uppercase text-white truncate">{pr.displayName} {pr.lastName}</p>
                    <p className="text-[10px] font-sans text-[#555] truncate mt-0.5">{pr.email}</p>
                  </div>
                  {statusBadge(pr.status)}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 border-t border-[#1e1e1e] pt-5">
                  <div>
                    <p className="hv font-black text-xl text-white">{stats.total}</p>
                    <p className="text-[8px] font-sans uppercase tracking-[0.3em] text-[#555] mt-1">Tavoli</p>
                  </div>
                  <div>
                    <p className="hv font-black text-xl text-white">€{stats.budget >= 1000 ? `${(stats.budget/1000).toFixed(1)}K` : stats.budget}</p>
                    <p className="text-[8px] font-sans uppercase tracking-[0.3em] text-[#555] mt-1">Budget</p>
                  </div>
                  <div>
                    <p className="hv font-black text-xl text-white">{stats.rate}<span className="text-sm text-[#555]">%</span></p>
                    <p className="text-[8px] font-sans uppercase tracking-[0.3em] text-[#555] mt-1">Approv.</p>
                  </div>
                </div>

                {/* CTA */}
                <button onClick={() => onSelectPR(pr)}
                  className="w-full py-2.5 text-[9px] hv font-black uppercase tracking-[0.2em] border border-[#2a2a2a] text-[#666] hover:border-accent/40 hover:text-accent transition-colors flex items-center justify-center gap-2">
                  Apri Scheda <ChevronRight size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── PRDetailView ────────────────────────────────────────── */
function PRDetailView({ pr, reservations, events, onBack, onUpdateStatus, statusBadge }: {
  pr: ManagedUser;
  reservations: Reservation[];
  events: Event[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: 'approved' | 'rejected') => void;
  statusBadge: (s: string) => React.ReactNode;
}) {
  const [showPwd, setShowPwd] = useState(false);
  const myRes = reservations.filter(r => r.prId === pr.id);
  const myEventIds = [...new Set(myRes.map(r => r.eventId))];
  const approved = myRes.filter(r => r.approvalStatus === 'approved').length;
  const totalBudget = myRes.reduce((s, r) => s + (r.actualBudget ?? r.budget), 0);
  const approvalRate = myRes.length > 0 ? Math.round((approved / myRes.length) * 100) : 0;

  return (
    <div>
      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-[#555] hover:text-accent transition-colors text-[10px] font-sans uppercase tracking-widest mb-8">
        <ArrowLeft size={11} /> Tutti i PR
      </button>

      {/* Header */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center shrink-0 overflow-hidden">
          {pr.profileImage
            ? <img src={pr.profileImage} alt="" className="w-full h-full object-cover" />
            : <span className="hv font-black text-accent text-xl">{pr.displayName.slice(0,2).toUpperCase()}</span>}
        </div>
        <div>
          <h2 className="hv font-black text-3xl uppercase text-white tracking-tight">{pr.displayName} {pr.lastName}</h2>
          <div className="flex items-center gap-3 mt-2">
            {statusBadge(pr.status)}
            <span className="text-[9px] font-sans text-[#444] uppercase tracking-widest">dal {pr.createdAt?.slice(0,10) ?? '—'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: info + actions */}
        <div className="space-y-4">
          {/* Info card */}
          <div className="border border-[#2a2a2a] bg-card p-5 space-y-4">
            <p className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#555] mb-1">Informazioni</p>
            {[
              { label: 'Email', value: pr.email },
              { label: 'Telefono', value: pr.phone || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#555]">{label}</p>
                <p className="text-sm text-white font-sans mt-1">{value}</p>
              </div>
            ))}
            <div>
              <p className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#555]">Password</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-white font-sans font-mono">{showPwd ? pr.password : '••••••••'}</p>
                <button onClick={() => setShowPwd(v => !v)}
                  className="text-[#444] hover:text-accent transition-colors">
                  {showPwd ? <EyeOff size={13}/> : <Eye size={13}/>}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          {pr.status !== 'approved' && (
            <button onClick={() => onUpdateStatus(pr.id, 'approved')}
              className="w-full py-3 text-[9px] hv font-black uppercase tracking-[0.2em] bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors">
              Approva Account
            </button>
          )}
          {pr.status !== 'rejected' && (
            <button onClick={() => onUpdateStatus(pr.id, 'rejected')}
              className="w-full py-3 text-[9px] hv font-black uppercase tracking-[0.2em] bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
              Disabilita Account
            </button>
          )}
        </div>

        {/* Right: stats + history */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Tavoli', value: myRes.length },
              { label: 'Budget', value: `€${totalBudget >= 1000 ? `${(totalBudget/1000).toFixed(1)}K` : totalBudget}` },
              { label: 'Serate', value: myEventIds.length },
              { label: 'Approv.', value: `${approvalRate}%` },
            ].map(({ label, value }) => (
              <div key={label} className="border border-[#2a2a2a] bg-card px-4 py-4">
                <p className="hv font-black text-2xl text-white">{value}</p>
                <p className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#555] mt-2">{label}</p>
              </div>
            ))}
          </div>

          {/* Barra approvazione */}
          {myRes.length > 0 && (
            <div className="border border-[#2a2a2a] bg-card px-5 py-4">
              <div className="flex justify-between mb-2">
                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#555]">Tasso approvazione</span>
                <span className="text-[9px] hv font-black text-accent">{approvalRate}%</span>
              </div>
              <div className="h-1 bg-[#1e1e1e] rounded-full overflow-hidden">
                <motion.div className="h-full bg-accent" initial={{ width: 0 }} animate={{ width: `${approvalRate}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
              </div>
            </div>
          )}

          {/* Event history */}
          {myEventIds.length === 0 ? (
            <EmptyState icon={<Clock size={24}/>} label="Nessuna prenotazione ancora." />
          ) : (
            <div className="space-y-3">
              {myEventIds.map(eventId => {
                const event = events.find(e => e.id === eventId);
                if (!event) return null;
                const eventRes = myRes.filter(r => r.eventId === eventId);
                const eventApproved = eventRes.filter(r => r.approvalStatus === 'approved').length;
                const eventBudget = eventRes.reduce((s, r) => s + (r.actualBudget ?? r.budget), 0);
                return (
                  <HistoryEventRow key={eventId} event={event} venueName="—"
                    reservations={eventRes} approvedCount={eventApproved} totalBudget={eventBudget} />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── ReservationQuickEditModal ───────────────────────────── */
function ReservationQuickEditModal({ reservation, onClose, onSave }: {
  reservation: Reservation;
  onClose: () => void;
  onSave: (r: Reservation) => void;
}) {
  const [guests, setGuests] = useState(reservation.guestsCount);
  const [budget, setBudget] = useState(reservation.budget);
  const [bottles, setBottles] = useState(reservation.bottles);
  const [notes, setNotes] = useState(reservation.notes);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
        className="relative w-full sm:max-w-md bg-card border-t border-x sm:border border-[#383838] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[90vh] flex flex-col">
        <div className="h-[2px] bg-accent shrink-0" />
        <div className="px-6 py-5 border-b border-[#2e2e2e] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-lg uppercase text-white">Modifica Prenotazione</h3>
            <p className="text-[9px] font-sans text-[#666] uppercase tracking-widest mt-0.5">{reservation.tableName} · {reservation.customerName}</p>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <form className="p-6 space-y-4 overflow-y-auto" onSubmit={e => { e.preventDefault(); onSave({ ...reservation, guestsCount: guests, budget, bottles, notes }); }}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666] mb-2">N. Ospiti</label>
              <input type="number" min={1} value={guests} onChange={e => setGuests(Number(e.target.value))}
                className="w-full bg-[#141414] border border-[#383838] px-4 py-3 text-sm text-white outline-none focus:border-accent/40 transition-colors font-sans" />
            </div>
            <div>
              <label className="block text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666] mb-2">Budget €</label>
              <input type="number" min={0} value={budget} onChange={e => setBudget(Number(e.target.value))}
                className="w-full bg-[#141414] border border-[#383838] px-4 py-3 text-sm text-white outline-none focus:border-accent/40 transition-colors font-sans" />
            </div>
          </div>
          <div>
            <label className="block text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666] mb-2">Bottiglie</label>
            <input value={bottles} onChange={e => setBottles(e.target.value)}
              placeholder="es. 2 vodka, 1 champagne"
              className="w-full bg-[#141414] border border-[#383838] px-4 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans" />
          </div>
          <div>
            <label className="block text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666] mb-2">Note</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
              className="w-full bg-[#141414] border border-[#383838] px-4 py-3 text-sm text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors font-sans resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 text-[9px] hv font-black uppercase tracking-[0.2em] border border-[#383838] text-[#777] hover:border-[#555] transition-colors">
              Annulla
            </button>
            <button type="submit"
              className="flex-1 py-3 text-[9px] hv font-black uppercase tracking-[0.2em] bg-accent text-black hover:bg-white transition-colors">
              Salva
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ── HistoryEventRow ─────────────────────────────────────── */
function HistoryEventRow({ event, venueName, reservations, approvedCount, totalBudget }: {
  event: Event; venueName: string; reservations: Reservation[];
  approvedCount: number; totalBudget: number;
}) {
  const [open, setOpen] = useState(false);
  const rejected = reservations.filter(r => r.approvalStatus === 'rejected').length;
  const borderColor = rejected > 0 ? 'border-l-red-500/50' : approvedCount === reservations.length ? 'border-l-green-500/40' : 'border-l-[#444]';
  const statusLabel = (s: string) =>
    s === 'approved' ? 'Approvata' : s === 'rejected' ? 'Rifiutata' : 'In attesa';

  const approvalBadge = (s: string) => {
    if (s === 'approved') return <span className="px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">Approvata</span>;
    if (s === 'rejected') return <span className="px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">Rifiutata</span>;
    return <span className="px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-[#1e1e1e] text-[#777] border border-[#2a2a2a]">In attesa</span>;
  };

  return (
    <div className={cn('border border-[#2a2a2a] border-l-4 bg-card overflow-hidden', borderColor)}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-6 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="flex items-center gap-5 min-w-0">
          <div className="w-10 h-10 bg-[#1a1a1a] border border-[#333] flex items-center justify-center shrink-0">
            <Calendar size={14} className="text-accent" />
          </div>
          <div className="min-w-0">
            <p className="hv font-black text-sm uppercase text-white truncate">{event.name}</p>
            <p className="text-[9px] font-sans text-[#666] mt-0.5 uppercase tracking-widest">{venueName} · {event.date}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 shrink-0 ml-4">
          <div className="text-right hidden sm:block">
            <p className="hv font-black text-sm text-white">{reservations.length} <span className="text-[#555] font-normal text-xs">tavoli</span></p>
            <p className="text-[9px] font-sans text-[#555] mt-0.5">€{totalBudget.toLocaleString('it-IT')}</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[9px] font-sans text-[#555] uppercase tracking-widest">{approvedCount}/{reservations.length} approvate</p>
          </div>
          <ChevronDown size={14} className={cn('text-[#555] transition-transform duration-200', open && 'rotate-180')} />
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#222] divide-y divide-[#1e1e1e]">
              {reservations.map(r => (
                <div key={r.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      'w-7 h-7 border flex items-center justify-center shrink-0',
                      r.checkedIn ? 'bg-green-500/10 border-green-500/30' : 'bg-[#141414] border-[#252525]'
                    )}>
                      <span className={cn('text-[9px] hv font-black', r.checkedIn ? 'text-green-400' : 'text-accent')}>
                        {r.tableName ?? '—'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-sans truncate">{r.customerName}</p>
                      <p className="text-[9px] font-sans text-[#555] mt-0.5">
                        {r.checkedIn ? `${r.actualPeople ?? r.guestsCount} entrati` : `${r.guestsCount} ospiti`}
                        {' · '}
                        <span className="text-accent">€{r.checkedIn && r.actualBudget ? r.actualBudget : r.budget}</span>
                        {r.checkedIn && r.actualBudget && r.actualBudget > r.budget && (
                          <span className="text-green-400 ml-1">+€{r.actualBudget - r.budget}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {r.checkedIn && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                        <CheckCircle2 size={9}/> Entrato
                      </span>
                    )}
                    {approvalBadge(r.approvalStatus)}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── HostCheckinView ─────────────────────────────────────── */
function CheckinRow({ res, events, venues, onCheckIn, onUndoCheckIn, onUpdatePeople }: {
  res: Reservation;
  events: Event[];
  venues: Venue[];
  onCheckIn: (id: string, n: number) => void;
  onUndoCheckIn: (id: string) => void;
  onUpdatePeople: (id: string, n: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [people, setPeople] = useState(res.actualPeople ?? res.guestsCount);
  const isIn = res.checkedIn;
  const table = findTable(res, events, venues);
  const previewBudget = calcActualBudget(res.budget, people, table);
  const budgetDiff = previewBudget - res.budget;
  const peopleChanged = people !== (res.actualPeople ?? res.guestsCount);

  return (
    <div className={cn('border-b border-[#1e1e1e] last:border-0', isIn && 'bg-green-500/[0.03]')}>
      {/* Main row — always visible */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={cn('w-2.5 h-2.5 rounded-full shrink-0 transition-colors', isIn ? 'bg-green-500' : 'bg-[#2e2e2e]')} />
        <div className="flex-1 min-w-0">
          <p className={cn('hv font-black text-base uppercase truncate transition-colors', isIn ? 'text-[#aaa]' : 'text-white')}>
            {res.customerName}
          </p>
          <p className="text-[9px] font-sans text-[#555] mt-0.5 truncate">
            Tav. {res.tableName ?? res.tableId}{table?.area ? ` · ${table.area}` : ''} · PR {res.prName}
            {isIn && <span className="text-green-500 ml-2">· {res.actualPeople ?? res.guestsCount} entrati · €{res.actualBudget ?? res.budget}</span>}
          </p>
        </div>
        {isIn
          ? <CheckCircle2 size={16} className="text-green-500 shrink-0" />
          : <ChevronDown size={14} className={cn('text-[#555] shrink-0 transition-transform duration-200', open && 'rotate-180')} />
        }
      </button>

      {/* Expanded panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 border-t border-[#1e1e1e]">
              {/* People counter */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#555]">Persone entrate</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setPeople(p => Math.max(1, p - 1))}
                    className="w-8 h-8 border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-colors text-xl leading-none flex items-center justify-center">−</button>
                  <span className="hv font-black text-2xl text-white w-8 text-center">{people}</span>
                  <button onClick={() => setPeople(p => p + 1)}
                    className="w-8 h-8 border border-[#333] text-[#888] hover:text-white hover:border-[#555] transition-colors text-xl leading-none flex items-center justify-center">+</button>
                </div>
              </div>

              {/* Budget preview */}
              <div className="flex items-center justify-between mb-5 py-3 border-t border-b border-[#1e1e1e]">
                <span className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#555]">Incasso</span>
                <div className="flex items-center gap-2">
                  {people !== res.guestsCount && <span className="text-[9px] font-sans text-[#444] line-through">€{res.budget}</span>}
                  <span className="hv font-black text-lg text-accent">€{previewBudget}</span>
                  {budgetDiff > 0 && <span className="text-[9px] font-sans text-green-400">+€{budgetDiff}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {!isIn ? (
                  <button
                    onClick={() => { onCheckIn(res.id, people); setOpen(false); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-accent text-black text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors"
                  >
                    <LogIn size={12} /> Segna Entrata
                  </button>
                ) : (
                  <>
                    {peopleChanged && (
                      <button
                        onClick={() => { onUpdatePeople(res.id, people); setOpen(false); }}
                        className="flex-1 py-2.5 bg-accent text-black text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors"
                      >
                        Aggiorna
                      </button>
                    )}
                    <button
                      onClick={() => { onUndoCheckIn(res.id); setOpen(false); }}
                      className="flex-1 py-2.5 border border-[#333] text-[#666] text-[9px] hv font-black uppercase tracking-widest hover:border-red-500/40 hover:text-red-400 transition-colors"
                    >
                      Annulla Entrata
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HostCheckinView({ reservations, events, venues, userRole, currentUser, onCheckIn, onUndoCheckIn, onUpdatePeople }: {
  reservations: Reservation[];
  events: Event[];
  venues: Venue[];
  userRole: string;
  currentUser: UserProfile;
  onCheckIn: (id: string, actualPeople: number) => void;
  onUndoCheckIn: (id: string) => void;
  onUpdatePeople: (id: string, actualPeople: number) => void;
}) {
  const [search, setSearch] = useState('');
  const [showEntered, setShowEntered] = useState(false);
  const [tab, setTab] = useState<'lista' | 'pianta'>('lista');

  const activeEvents = events.filter(e => e.status === 'active');
  const activeEvent = activeEvents[0] ?? null;
  const approvedRes = reservations.filter(r => r.approvalStatus === 'approved');
  const total = approvedRes.length;
  const checkedInCount = approvedRes.filter(r => r.checkedIn).length;
  const pct = total > 0 ? Math.round((checkedInCount / total) * 100) : 0;

  const q = search.trim().toLowerCase();
  const filtered = approvedRes.filter(r =>
    !q || r.customerName.toLowerCase().includes(q) ||
    (r.tableName ?? '').toLowerCase().includes(q) ||
    r.prName.toLowerCase().includes(q)
  );

  const pending = filtered.filter(r => !r.checkedIn).sort((a, b) => a.customerName.localeCompare(b.customerName));
  const entered = filtered.filter(r => r.checkedIn).sort((a, b) => a.customerName.localeCompare(b.customerName));

  if (activeEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <DoorOpen size={32} className="text-[#333]" />
        <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#555]">Nessun evento attivo stasera</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="mb-5 max-w-xl mx-auto w-full">
        <h1 className="hv font-black text-2xl uppercase text-white tracking-tight">Ingresso Serata</h1>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-1 bg-[#222] overflow-hidden">
            <motion.div className="h-full bg-accent" initial={{ width: 0 }}
              animate={{ width: `${pct}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
          </div>
          <span className="hv font-black text-white text-sm shrink-0">{checkedInCount}<span className="text-[#555] font-normal text-xs">/{total}</span></span>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-0 mb-5 max-w-xl mx-auto w-full border border-[#2a2a2a]">
        {(['lista', 'pianta'] as const).map(t => (
          <button key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2.5 text-[9px] hv font-black uppercase tracking-widest transition-colors',
              tab === t ? 'bg-accent text-black' : 'text-[#555] hover:text-white'
            )}>
            {t === 'lista' ? 'Lista' : 'Pianta'}
          </button>
        ))}
      </div>

      {tab === 'lista' && (
        <div className="max-w-xl mx-auto w-full">
          {/* Search */}
          <div className="relative mb-6">
            <input
              type="text"
              placeholder="Cerca cliente, tavolo, PR…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#1e1e1e] border border-[#2e2e2e] px-4 py-3 text-sm font-sans text-white placeholder-[#444] outline-none focus:border-accent/40 transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-white transition-colors">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Da fare */}
          {pending.length > 0 && (
            <div className="mb-4">
              <p className="text-[8px] font-sans uppercase tracking-[0.4em] text-[#555] mb-2 px-1">
                Da fare — {pending.length}
              </p>
              <div className="border border-[#2a2a2a] bg-card overflow-hidden">
                {pending.map(res => (
                  <CheckinRow key={res.id} res={res} events={events} venues={venues}
                    onCheckIn={onCheckIn} onUndoCheckIn={onUndoCheckIn} onUpdatePeople={onUpdatePeople} />
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
                    <div className="border border-[#2a2a2a] bg-card overflow-hidden">
                      {entered.map(res => (
                        <CheckinRow key={res.id} res={res} events={events} venues={venues}
                          onCheckIn={onCheckIn} onUndoCheckIn={onUndoCheckIn} onUpdatePeople={onUpdatePeople} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#444]">Nessun risultato</p>
            </div>
          )}
        </div>
      )}

      {tab === 'pianta' && (() => {
        if (!activeEvent) return null;
        const venue = venues.find(v => v.id === activeEvent.venueId);
        const fp = venue?.floorPlans.find(f => f.id === activeEvent.floorPlanId) ?? venue?.floorPlans[0];
        if (!venue || !fp) return (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#555]">Nessuna pianta disponibile</p>
          </div>
        );
        return (
          <div className="flex-1 min-h-0">
            <FloorPlanViewer
              event={activeEvent}
              floorPlan={fp}
              reservations={reservations}
              currentUser={currentUser}
              onReservationAdded={() => {}}
              onReservationUpdated={() => {}}
              onReservationRemoved={() => {}}
              hostMode={true}
            />
          </div>
        );
      })()}

    </div>
  );
}

/* ── SidebarContent ──────────────────────────────────────── */
function SidebarContent({ user, view, onNav, onLogout, occupancyPct = 0, revenueEst = 0, pendingCount = 0, prPendingCount = 0 }: {
  user: UserProfile; view: string;
  onNav: (v: string) => void;
  onLogout: () => void;
  occupancyPct?: number;
  revenueEst?: number;
  pendingCount?: number;
  prPendingCount?: number;
}) {
  const revenueDisplay = revenueEst >= 1000
    ? `€${(revenueEst / 1000).toFixed(1)}K`
    : `€${revenueEst}`;
  return (
    <>
      {/* Brand */}
      <div className="px-6 py-5 border-b border-[#2e2e2e] shrink-0">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
            <img
              src="/Logo.png"
              alt="Nightplan"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="hv font-black uppercase tracking-widest text-[11px] text-white leading-tight">Nightplan</span>
            <span className="text-[8px] font-sans text-[#666] uppercase tracking-[0.3em] mt-0.5">Management</span>
          </div>
        </div>
      </div>

      {/* KPIs — admin only */}
      {user.role === 'admin' && (
        <div className="px-6 py-6 border-b border-[#2e2e2e] space-y-5 shrink-0">
          <div>
            <div className="hv font-black leading-none text-white glow-text" style={{ fontSize: 52 }}>
              {occupancyPct}<span className="text-[28px] text-[#555]">%</span>
            </div>
            <div className="mt-2.5 h-px bg-[#2a2a2a] relative overflow-hidden">
              <motion.div className="h-px bg-accent absolute inset-y-0 left-0"
                initial={{ width: 0 }} animate={{ width: `${occupancyPct}%` }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }} />
            </div>
            <p className="text-[9px] font-sans uppercase tracking-[0.35em] text-[#999] mt-1.5">Occupancy</p>
          </div>
          <div>
            <div className="hv font-black text-accent leading-none glow-text" style={{ fontSize: 36 }}>{revenueDisplay}</div>
            <p className="text-[9px] font-sans uppercase tracking-[0.35em] text-[#999] mt-1">Revenue Est.</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto">
        {user.role === 'admin' ? (
          <>
            <div className="space-y-0.5">
              <NavLink icon={<Calendar size={14}/>} label="Prossimi eventi"
                active={view==='active-events'||view==='plan'}
                onClick={() => onNav('active-events')} />
              <NavLink icon={<Building2 size={14}/>} label="Club"
                active={view==='venues'||view==='venue-events'||view==='editor'}
                onClick={() => onNav('venues')} />
            </div>
            <div className="mx-3 my-4 h-px bg-[#242424]" />
            <div className="space-y-0.5">
              <NavLink icon={<BarChart3 size={14}/>} label="Prenotazioni"
                active={view==='reservations'}
                onClick={() => onNav('reservations')} />
              <NavLink icon={<Bell size={14}/>} label="Approvazioni"
                active={view==='approvals'}
                onClick={() => onNav('approvals')}
                badge={pendingCount} />
            </div>
            <div className="mx-3 my-4 h-px bg-[#242424]" />
            <div className="space-y-0.5">
              <NavLink icon={<Users size={14}/>} label="I Miei PR"
                active={view==='pr-management'}
                onClick={() => onNav('pr-management')} />
              <NavLink icon={<DoorOpen size={14}/>} label="Ingresso"
                active={view==='checkin'}
                onClick={() => onNav('checkin')} />
            </div>
          </>
        ) : user.role === 'host' ? (
          <div className="space-y-0.5">
            <NavLink icon={<DoorOpen size={14}/>} label="Ingresso Serata"
              active={view==='checkin'}
              onClick={() => onNav('checkin')} />
          </div>
        ) : (
          <div className="space-y-0.5">
            <NavLink icon={<Calendar size={14}/>} label="Eventi"
              active={view==='events'||view==='plan'}
              onClick={() => onNav('events')} />
            <NavLink icon={<BarChart3 size={14}/>} label="Prenotazioni"
              active={view==='reservations'}
              onClick={() => onNav('reservations')}
              badge={prPendingCount} />
            <NavLink icon={<Clock size={14}/>} label="Il Mio Storico"
              active={view==='history'}
              onClick={() => onNav('history')} />
          </div>
        )}
      </nav>

      {/* User */}
      <div className="px-6 py-6 border-t border-[#2e2e2e] shrink-0">
        <button
          onClick={() => user.role === 'pr' ? onNav('profile') : undefined}
          className={cn('flex items-center gap-3 mb-5 w-full text-left', user.role === 'pr' && 'group cursor-pointer')}
        >
          <div className="w-9 h-9 bg-[#2a2a2a] border border-[#383838] flex items-center justify-center shrink-0 overflow-hidden group-hover:border-accent/30 transition-colors">
            {user.profileImage
              ? <img src={user.profileImage} alt="" className="w-full h-full object-cover" />
              : <span className="hv font-black text-accent text-xs">{user.displayName.substring(0, 2).toUpperCase()}</span>
            }
          </div>
          <div className="min-w-0">
            <p className="text-[11px] hv font-black uppercase text-white truncate group-hover:text-accent transition-colors">
              {user.displayName}{user.lastName ? ' ' + user.lastName : ''}
            </p>
            <p className="text-[8px] font-sans text-[#999] uppercase tracking-widest mt-0.5">{user.role}</p>
          </div>
        </button>
        <button onClick={onLogout}
          className="flex items-center gap-2 text-[#999] hover:text-accent transition-colors text-[9px] font-sans uppercase tracking-widest w-full">
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
        <span className="text-[8px] font-sans uppercase tracking-[0.3em] text-[#666] group-hover:text-[#888] transition-colors">
          {label}
        </span>
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className="text-[#555] group-hover:text-[#777] transition-colors"
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
        'flex items-center gap-3 w-full px-3 py-2.5 text-[10px] font-sans font-medium uppercase tracking-[0.25em] transition-all duration-200 group border-l-2',
        active
          ? 'text-accent border-accent bg-accent/5'
          : 'text-[#777] border-transparent hover:text-white hover:border-[#333] hover:bg-white/[0.02]'
      )}>
      <span className={cn('transition-colors duration-200 shrink-0', active ? 'text-accent' : 'text-[#666] group-hover:text-[#888]')}>
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
      <h2 className="hv font-black text-3xl md:text-4xl uppercase text-white leading-tight tracking-tight">{title}</h2>
      {sub && <p className="text-[10px] font-sans uppercase tracking-[0.3em] text-[#777] mt-2">{sub}</p>}
    </div>
  );
}

/* ── EmptyState ──────────────────────────────────────────── */
function EmptyState({ icon, label, children }: { icon: React.ReactNode; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center mt-4">
      <div className="text-[#555] mb-5">{icon}</div>
      <p className="text-[9px] font-sans uppercase tracking-[0.35em] text-[#666]">{label}</p>
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
      className="group bg-card border border-[#383838] cursor-pointer overflow-hidden flex flex-col relative"
    >
      <div className="h-[2px] w-0 group-hover:w-full bg-accent transition-all duration-500 origin-left" />

      <div className="p-7 flex flex-col gap-7 flex-1">
        <div className="flex items-start justify-between">
          <div className="w-9 h-9 border border-[#383838] flex items-center justify-center group-hover:border-accent/30 transition-colors shrink-0">
            <Building2 size={15} className="text-[#999] group-hover:text-accent transition-colors" />
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button onClick={onEdit}
                  className="w-7 h-7 flex items-center justify-center text-[#999] hover:text-accent transition-colors">
                  <Pencil size={12} />
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete}
                  className="w-7 h-7 flex items-center justify-center text-[#999] hover:text-red-500 transition-colors">
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
          <p className="text-[9px] font-sans uppercase tracking-widest text-[#888] mt-1">{venue.address}</p>
        </div>

        <div className="flex items-end justify-between border-t border-[#2e2e2e] pt-5">
          <div>
            <span className="hv font-black text-[52px] leading-none text-[#3a3a3a] group-hover:text-[#555] transition-colors select-none">
              {String(eventCount).padStart(2, '0')}
            </span>
            <p className="text-[8px] font-sans uppercase tracking-widest text-[#888] mt-0.5">eventi</p>
          </div>
          <div className="flex items-center gap-1.5 text-[#888] group-hover:text-accent transition-colors mb-1">
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
      className="group bg-card border border-[#383838] cursor-pointer overflow-hidden flex flex-col card-hover"
    >
      <div className="h-[2px] w-0 group-hover:w-full bg-accent transition-all duration-500 origin-left" />

      <div className="p-7 flex flex-col gap-5 flex-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {venueName && (
              <span className="text-[8px] font-sans uppercase tracking-widest text-[#888] flex items-center gap-1.5 shrink-0">
                <Building2 size={9} /> {venueName}
              </span>
            )}
            <span className={cn(
              'text-[8px] font-sans font-bold uppercase tracking-widest px-2 py-1 shrink-0',
              event.status === 'active'
                ? 'text-accent bg-accent/8'
                : 'text-[#999] bg-[#2a2a2a]'
            )}>
              {event.status === 'active' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent blink mr-1.5 align-middle" />}
              {event.status}
            </span>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <button onClick={onEdit}
                  className="w-7 h-7 flex items-center justify-center text-[#999] hover:text-accent transition-colors">
                  <Pencil size={12} />
                </button>
              )}
              {onDelete && (
                <button onClick={onDelete}
                  className="w-7 h-7 flex items-center justify-center text-[#999] hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="font-mono text-[10px] text-[#888] mb-2 tracking-wider">{event.date}</p>
          <h3 className="hv font-black text-[clamp(18px,2.5vw,24px)] uppercase text-white leading-tight">{event.name}</h3>
          <p className="text-[11px] font-sans text-[#999] mt-2.5 leading-relaxed line-clamp-2">{event.description}</p>
        </div>

        <div className="flex items-center gap-1.5 text-[#888] group-hover:text-accent transition-colors border-t border-[#2e2e2e] pt-4 mt-1">
          <span className="text-[9px] font-sans uppercase tracking-widest">Apri Pianta</span>
          <ChevronRight size={11} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── ReservationsTable ───────────────────────────────────── */
function ReservationsTable({ reservations, userRole, events, onDelete, onEdit }: {
  reservations: Reservation[];
  userRole: string;
  events: Event[];
  onDelete?: (id: string) => void;
  onEdit?: (r: Reservation) => void;
}) {
  const colCount = userRole === 'admin' ? 6 : 5;

  const approvalBadge = (s: string) => {
    if (s === 'approved') return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">Approvata</span>;
    if (s === 'rejected') return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/20">Rifiutata</span>;
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-[#2a2a2a] text-[#888] border border-[#333]">In attesa</span>;
  };

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
    <div className="bg-card border border-[#383838] overflow-hidden">
      <div className="px-7 py-5 border-b border-[#2e2e2e]">
        <h2 className="hv font-black text-xl uppercase text-white">Prenotazioni</h2>
      </div>

      {reservations.length === 0 ? (
        <div className="px-7 py-24 text-center">
          <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#666]">Nessuna Prenotazione</p>
        </div>
      ) : (
        <div className="space-y-0">
          {groups.map(({ event, eventId, rows }) => (
            <div key={eventId}>
              {/* Event header */}
              <div className="px-7 py-3 bg-[#141414] border-b border-[#2e2e2e] flex items-center gap-4 flex-wrap">
                <span className="hv font-black text-sm uppercase text-white tracking-widest">
                  {event?.name ?? eventId}
                </span>
                {event && (
                  <span className="font-mono text-[9px] text-[#777]">{event.date}</span>
                )}
                <span className="text-[9px] font-sans uppercase tracking-widest text-[#777]">
                  {rows.length} {rows.length === 1 ? 'prenotazione' : 'prenotazioni'}
                </span>
                {rows.some(r => r.checkedIn) && (
                  <span className="flex items-center gap-1 text-[9px] font-sans uppercase tracking-widest text-green-400 border border-green-500/20 bg-green-500/5 px-2 py-0.5">
                    <CheckCircle2 size={10} /> {rows.filter(r => r.checkedIn).length} entrati
                  </span>
                )}
                {userRole === 'admin' && (
                  <button
                    onClick={() => exportEventCSV(rows, event?.name ?? eventId)}
                    className="ml-auto flex items-center gap-1.5 text-[#777] hover:text-accent transition-colors text-[9px] font-sans uppercase tracking-widest">
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
                          res.status === 'confirmed' ? 'bg-accent blink' : 'bg-[#333]'
                        )} />
                        <span className={cn('text-[9px] font-sans uppercase tracking-widest',
                          res.status === 'confirmed' ? 'text-accent' : 'text-[#999]'
                        )}>{res.status}</span>
                      </div>
                      <span className="hv font-black text-accent text-lg">€{res.budget}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="hv font-bold text-sm uppercase text-white truncate">{res.customerName}</p>
                        {userRole === 'admin' && <p className="text-[9px] font-sans text-[#999] uppercase tracking-widest mt-0.5">{res.prName}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="hv font-bold text-sm text-white">{res.tableName ?? res.tableId}</p>
                        <p className="text-[9px] font-sans text-[#999] mt-0.5">{res.guestsCount} pax</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead>
                    <tr className="border-b border-[#222]">
                      {['Tavolo', 'Cliente', ...(userRole === 'admin' ? ['PR'] : []), 'Pax', 'Budget', 'Stato', ''].map((h, i) => (
                        <th key={i} className="px-6 py-3 text-[8px] font-sans font-bold uppercase tracking-[0.35em] text-[#555]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(res => (
                      <tr key={res.id} className="border-b border-[#1a1a1a] hover:bg-white/[0.015] transition-colors group">
                        <td className="px-6 py-3.5">
                          <span className="hv font-black text-sm text-white">{res.tableName ?? res.tableId}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="text-sm text-white font-sans">{res.customerName}</p>
                          {res.customerPhone && <p className="text-[9px] font-sans text-[#555] mt-0.5">{res.customerPhone}</p>}
                        </td>
                        {userRole === 'admin' && (
                          <td className="px-6 py-3.5">
                            <span className="text-[10px] font-sans text-[#777]">{res.prName}</span>
                          </td>
                        )}
                        <td className="px-6 py-3.5">
                          <span className="text-sm font-sans text-[#aaa]">{res.guestsCount}</span>
                        </td>
                        <td className="px-6 py-3.5">
                          {res.checkedIn && res.actualBudget && res.actualBudget !== res.budget ? (
                            <div>
                              <span className="hv font-black text-sm text-accent">€{res.actualBudget}</span>
                              <span className="text-[9px] font-sans text-green-400 ml-1">+€{res.actualBudget - res.budget}</span>
                            </div>
                          ) : (
                            <span className="hv font-black text-sm text-accent">€{res.budget}</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {approvalBadge(res.approvalStatus)}
                            {res.checkedIn && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-sans uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/20">
                                <CheckCircle2 size={9}/> Entrato{res.actualPeople ? ` · ${res.actualPeople}` : ''}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          {userRole === 'pr' && res.approvalStatus === 'pending' && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => onEdit?.(res)}
                                className="w-7 h-7 flex items-center justify-center text-[#555] hover:text-accent transition-colors">
                                <Pencil size={12} />
                              </button>
                              <button onClick={() => onDelete?.(res.id)}
                                className="w-7 h-7 flex items-center justify-center text-[#555] hover:text-red-400 transition-colors">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
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
        className="relative w-full sm:max-w-md bg-card border-t border-x sm:border border-[#383838] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[90vh] flex flex-col"
      >
        <div className="h-[2px] bg-accent shrink-0" />
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[#2e2e2e] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">{isEdit ? 'Modifica Evento' : 'Nuovo Evento'}</h3>
            <p className="text-[9px] font-sans uppercase tracking-widest text-[#999] mt-1">{venue.name}</p>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        <form className="p-6 sm:p-8 space-y-5 overflow-y-auto" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <Field label="Nome Evento">
            <input required placeholder="ES. TECHNO FRIDAY"
              className="w-full bg-bg border border-[#383838] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Data">
            <input required type="date" min="2026-01-01"
              className="w-full bg-bg border border-[#383838] px-4 py-3 text-xs font-sans text-white outline-none transition-colors [color-scheme:dark]"
              value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Descrizione (opzionale)">
            <textarea rows={2} placeholder="DETTAGLI..."
              className="w-full bg-bg border border-[#383838] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors resize-none"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>

          {floorPlans.length > 0 && (
            <Field label="Pianta">
              <select
                className="w-full bg-bg border border-[#383838] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white outline-none transition-colors [color-scheme:dark]"
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
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest border border-[#383838] text-[#999] hover:text-white hover:border-[#333] transition-all">
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
      <label className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#999]">{label}</label>
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
        className="relative w-full sm:max-w-md bg-card border-t border-x sm:border border-[#383838] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[90vh] flex flex-col"
      >
        <div className="h-[2px] bg-accent shrink-0" />
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[#2e2e2e] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">{isEdit ? 'Modifica Club' : 'Nuovo Club'}</h3>
            <p className="text-[9px] font-sans uppercase tracking-widest text-[#999] mt-1">{isEdit ? 'Aggiorna nome e indirizzo' : 'Crea il locale e poi la sua piantina'}</p>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        <form className="p-6 sm:p-8 space-y-5 overflow-y-auto" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <Field label="Nome del Club">
            <input required placeholder="ES. AMNESIA CLUB"
              className="w-full bg-bg border border-[#383838] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Città / Indirizzo">
            <input placeholder="ES. MILANO"
              className="w-full bg-bg border border-[#383838] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors"
              value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest border border-[#383838] text-[#999] hover:text-white hover:border-[#333] transition-all">
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
  onSubmit: (venueId: string, name: string) => void;
}) {
  const [venueId, setVenueId] = useState(venues[0]?.id ?? '');
  const [name, setName] = useState('');

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full sm:max-w-md bg-card border-t border-x sm:border border-[#383838] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[90vh] flex flex-col">
        <div className="h-[2px] bg-accent shrink-0" />
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[#2e2e2e] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">Nuova Pianta</h3>
            <p className="text-[9px] font-sans uppercase tracking-widest text-[#999] mt-1">Dai un nome e scegli il locale</p>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>
        <form className="p-6 sm:p-8 space-y-5 overflow-y-auto" onSubmit={(e) => { e.preventDefault(); if (venueId && name.trim()) onSubmit(venueId, name.trim()); }}>
          <Field label="Nome Pianta">
            <input required placeholder="Es. Piano Terra, VIP Room..."
              className="w-full bg-bg border border-[#383838] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors"
              value={name} onChange={e => setName(e.target.value)} />
          </Field>
          <Field label="Locale">
            <select required
              className="w-full bg-bg border border-[#383838] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white outline-none transition-colors [color-scheme:dark]"
              value={venueId} onChange={e => setVenueId(e.target.value)}>
              {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest border border-[#383838] text-[#999] hover:text-white hover:border-[#333] transition-all">
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
        className="relative w-full sm:max-w-md bg-card border-t border-x sm:border border-[#383838] overflow-hidden rounded-t-2xl sm:rounded-none max-h-[90vh] flex flex-col">
        <div className="h-[2px] bg-accent shrink-0" />
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-[#2e2e2e] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">Modifica Pianta</h3>
            <p className="text-[9px] font-sans uppercase tracking-widest text-[#999] mt-1">Aggiorna il nome della pianta</p>
          </div>
          <button onClick={onClose} className="text-[#999] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>
        <form className="p-6 sm:p-8 space-y-5 overflow-y-auto" onSubmit={(e) => { e.preventDefault(); onSubmit(name); }}>
          <Field label="Nome Pianta">
            <input required
              className="w-full bg-bg border border-[#383838] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#444] outline-none transition-colors"
              value={name} onChange={e => setName(e.target.value)} />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest border border-[#383838] text-[#999] hover:text-white hover:border-[#333] transition-all">
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
    <button onClick={onClick} className="w-8 h-8 border border-[#383838] flex items-center justify-center text-[#999] hover:text-accent hover:border-[#383838] transition-all">
      {children}
    </button>
  );
}

/* ── BottomTabBar (mobile) ───────────────────────────────── */
function BottomTabBar({ user, view, onNav, pendingCount, prPendingCount }: {
  user: UserProfile;
  view: string;
  onNav: (v: string) => void;
  pendingCount: number;
  prPendingCount: number;
}) {
  type Tab = { id: string; label: string; icon: React.ReactNode; active: boolean; badge?: number };

  const tabs: Tab[] = user.role === 'admin' ? [
    { id: 'active-events', label: 'Eventi',   icon: <Calendar size={16}/>,  active: view === 'active-events' || view === 'plan' },
    { id: 'venues',        label: 'Club',     icon: <Building2 size={16}/>, active: view === 'venues' || view === 'venue-events' || view === 'editor' },
    { id: 'approvals',     label: 'Approva',  icon: <Bell size={16}/>,      active: view === 'approvals', badge: pendingCount },
    { id: 'pr-management', label: 'PR',       icon: <Users size={16}/>,     active: view === 'pr-management' },
    { id: 'checkin',       label: 'Ingresso', icon: <DoorOpen size={16}/>,  active: view === 'checkin' },
  ] : [
    { id: 'events',        label: 'Eventi',   icon: <Calendar size={16}/>,  active: view === 'events' || view === 'plan' },
    { id: 'reservations',  label: 'Prenot.',  icon: <BarChart3 size={16}/>, active: view === 'reservations', badge: prPendingCount },
    { id: 'history',       label: 'Storico',  icon: <Clock size={16}/>,     active: view === 'history' },
    { id: 'profile',       label: 'Profilo',  icon: <Settings size={16}/>,  active: view === 'profile' },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0c0c]/95 backdrop-blur-md border-t border-[#2a2a2a]">
      <div className="flex items-stretch">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onNav(tab.id)}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2 relative transition-colors',
              tab.active ? 'text-accent' : 'text-[#555] hover:text-[#888]'
            )}
          >
            {tab.active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-accent" />}
            <div className="relative">
              {tab.icon}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-accent text-black text-[8px] hv font-black flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[8px] font-sans uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>
      <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}
