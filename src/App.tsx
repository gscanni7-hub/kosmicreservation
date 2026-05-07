import React, { useState } from 'react';
import {
  Calendar, Settings, BarChart3, LogOut, ChevronRight,
  Plus, Download, Filter, Building2, X, ArrowLeft, Menu
} from 'lucide-react';
import { MOCK_ADMIN, MOCK_PR, INITIAL_VENUES, INITIAL_EVENTS, INITIAL_RESERVATIONS } from './constants';
import { UserProfile, Event, Reservation, Venue, FloorPlan } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import FloorPlanViewer from './components/floorplan/FloorPlanViewer';
import FloorPlanEditor from './components/floorplan/FloorPlanEditor';

type AppView = 'venues' | 'venue-events' | 'events' | 'plan' | 'editor' | 'reservations';

const PAGE = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.22 },
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<AppView>('venues');
  const [venues]     = useState(INITIAL_VENUES);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogin = (role: 'admin' | 'pr') => {
    setUser(role === 'admin' ? MOCK_ADMIN : MOCK_PR);
    setView(role === 'admin' ? 'venues' : 'events');
  };
  const handleLogout = () => { setUser(null); setSelectedVenue(null); setSelectedEvent(null); };

  const openVenue = (venue: Venue) => { setSelectedVenue(venue); setView('venue-events'); };
  const openEvent = (event: Event) => {
    if (!selectedVenue) setSelectedVenue(venues.find(v => v.id === event.venueId) ?? null);
    setSelectedEvent(event);
    setView('plan');
    setMobileSidebarOpen(false);
  };
  const goBack = () => {
    if (view === 'plan') { setSelectedEvent(null); setView(user?.role === 'admin' ? 'venue-events' : 'events'); }
    else if (view === 'venue-events') { setSelectedVenue(null); setView('venues'); }
  };

  const getFloorPlan = (event: Event): FloorPlan | undefined => {
    const venue = venues.find(v => v.id === event.venueId);
    return venue?.floorPlans.find(fp => fp.id === event.floorPlanId) ?? venue?.floorPlans[0];
  };

  const activeEvents  = events.filter(e => e.status === 'active');
  const venueEvents   = selectedVenue ? events.filter(e => e.venueId === selectedVenue.id) : [];
  const showBack      = view === 'plan' || view === 'venue-events';

  const headerTitle = () => {
    if (view === 'venues')        return 'Venues';
    if (view === 'venue-events')  return selectedVenue?.name ?? '';
    if (view === 'events')        return 'Events';
    if (view === 'plan')          return selectedEvent?.name ?? '';
    if (view === 'editor')        return 'Venue Design';
    if (view === 'reservations')  return 'Reservations';
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
          className="hidden lg:flex flex-col justify-between p-14 xl:p-20 border-r border-[#111] lg:w-[55%] relative overflow-hidden"
        >
          <div className="absolute inset-0 floorplan-grid opacity-40 pointer-events-none" />
          <span className="relative text-[10px] font-sans font-medium uppercase tracking-[0.5em] text-[#333]">
            Table Management Platform
          </span>
          <div className="relative">
            <h1 className="hv font-black leading-[0.88] tracking-tighter uppercase text-white"
              style={{ fontSize: 'clamp(80px, 10vw, 130px)' }}>
              NIGHT<br />PLAN
            </h1>
            <div className="mt-8 flex items-center gap-4">
              <div className="h-px w-10 bg-accent shrink-0" />
              <p className="text-[#3a3a3a] text-sm font-sans leading-relaxed">
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
            <p className="text-[#333] text-[10px] font-sans uppercase tracking-[0.4em] mt-2">Management Suite</p>
          </div>

          <div className="w-full max-w-xs">
            <div className="mb-10">
              <h2 className="hv font-black text-2xl uppercase text-white">Accedi</h2>
              <p className="text-[#333] text-[10px] font-sans uppercase tracking-widest mt-2">Seleziona profilo</p>
            </div>

            <div className="space-y-3">
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => handleLogin('admin')}
                className="group w-full bg-accent text-black py-[18px] text-[10px] hv font-black uppercase tracking-[0.3em] flex items-center justify-between px-6 hover:bg-white transition-colors"
              >
                <span>Proprietario</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => handleLogin('pr')}
                className="group w-full bg-transparent text-white py-[18px] text-[10px] hv font-black uppercase tracking-[0.3em] flex items-center justify-between px-6 border border-[#222] hover:border-accent hover:text-accent transition-all"
              >
                <span>Staff PR</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>

            <p className="text-[#222] text-[9px] font-sans uppercase tracking-widest mt-12 text-center">
              Un'esperienza esclusiva per i club più prestigiosi
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── AUTHENTICATED LAYOUT ───────────────────────────────── */
  return (
    <div className="min-h-screen bg-bg text-white flex flex-col md:flex-row relative">

      {/* ── Mobile top bar ── */}
      <div className="md:hidden h-12 bg-black border-b border-[#111] flex items-center justify-between px-4 sticky top-0 z-50 shrink-0">
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
              className="fixed left-0 top-0 bottom-0 w-72 bg-black border-r border-[#111] z-50 md:hidden flex flex-col"
            >
              <SidebarContent
                user={user}
                view={view}
                onNav={(v) => { setView(v as AppView); setSelectedVenue(null); setSelectedEvent(null); setMobileSidebarOpen(false); }}
                onLogout={handleLogout}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-60 xl:w-64 border-r border-[#111] bg-black flex-col shrink-0 sticky top-0 h-screen">
        <SidebarContent user={user} view={view}
          onNav={(v) => { setView(v as AppView); setSelectedVenue(null); setSelectedEvent(null); }}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Header */}
        <header className="h-12 border-b border-[#111] flex items-center justify-between px-5 bg-black/95 backdrop-blur-sm sticky top-0 md:top-0 z-30 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            {showBack && (
              <button onClick={goBack}
                className="flex items-center gap-1.5 text-[#444] hover:text-accent transition-colors text-[10px] font-sans uppercase tracking-widest shrink-0">
                <ArrowLeft size={11} /> Indietro
              </button>
            )}
            <span className="text-[10px] font-sans font-medium uppercase tracking-[0.35em] text-[#333] truncate">
              {headerTitle()}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {view === 'venue-events' && user.role === 'admin' && (
              <button onClick={() => setShowNewEventModal(true)}
                className="flex items-center gap-2 bg-accent text-black px-4 py-2 text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-colors">
                <Plus size={12} /> Nuovo Evento
              </button>
            )}
            {view === 'reservations' && (
              <button className="flex items-center gap-2 border border-[#222] text-[#555] px-4 py-2 text-[9px] hv font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all">
                <Download size={12} /> Export
              </button>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-5 md:p-8 overflow-auto">
          <AnimatePresence mode="wait">

            {/* Venues */}
            {view === 'venues' && (
              <motion.div key="venues" {...PAGE}>
                <PageTitle title="I tuoi Locali" sub="Seleziona un locale per gestire gli eventi" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-8">
                  {venues.map((venue, i) => (
                    <motion.div key={venue.id}
                      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, duration: 0.22 }}>
                      <VenueCard venue={venue}
                        eventCount={events.filter(e => e.venueId === venue.id).length}
                        onClick={() => openVenue(venue)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Venue events */}
            {view === 'venue-events' && selectedVenue && (
              <motion.div key="venue-events" {...PAGE}>
                <div className="mb-8">
                  <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#333] mb-1">Venue</p>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {venueEvents.map((event, i) => (
                      <motion.div key={event.id}
                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}>
                        <EventCard event={event} onClick={() => openEvent(event)} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* PR events */}
            {view === 'events' && (
              <motion.div key="events" {...PAGE}>
                <PageTitle title="Eventi in Corso" sub="Seleziona un evento per accedere alla pianta" />
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
                    onReservationAdded={(res) => setReservations(prev => [...prev, res])}
                  />
                </motion.div>
              );
            })()}

            {/* Editor */}
            {view === 'editor' && (
              <motion.div key="editor" {...PAGE}>
                <FloorPlanEditor floorPlan={venues[0]?.floorPlans[0] ?? INITIAL_VENUES[0].floorPlans[0]} />
              </motion.div>
            )}

            {/* Reservations */}
            {view === 'reservations' && (
              <motion.div key="reservations" {...PAGE}>
                <ReservationsTable
                  reservations={user.role === 'admin' ? reservations : reservations.filter(r => r.prId === user.id)}
                  userRole={user.role}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>

      {/* New Event Modal */}
      {showNewEventModal && selectedVenue && (
        <NewEventModal
          venue={selectedVenue}
          onClose={() => setShowNewEventModal(false)}
          onSubmit={(data) => {
            setEvents(prev => [...prev, {
              id: `e_${Date.now()}`,
              venueId: selectedVenue.id,
              floorPlanId: selectedVenue.floorPlans[0]?.id ?? '',
              status: 'active',
              ...data,
            }]);
            setShowNewEventModal(false);
          }}
        />
      )}
    </div>
  );
}

/* ── SidebarContent ──────────────────────────────────────── */
function SidebarContent({ user, view, onNav, onLogout }: {
  user: UserProfile; view: string;
  onNav: (v: string) => void;
  onLogout: () => void;
}) {
  return (
    <>
      {/* Brand */}
      <div className="px-6 py-6 border-b border-[#111] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-accent flex items-center justify-center shrink-0">
            <span className="hv font-black text-black text-sm leading-none">N</span>
          </div>
          <div>
            <span className="hv font-black uppercase tracking-widest text-[11px] text-white block leading-tight">Nightplan</span>
            <span className="text-[8px] font-sans text-[#333] uppercase tracking-widest">Management</span>
          </div>
        </div>
      </div>

      {/* KPIs — admin only */}
      {user.role === 'admin' && (
        <div className="px-6 py-6 border-b border-[#111] space-y-5 shrink-0">
          <div>
            <div className="hv font-black leading-none text-white" style={{ fontSize: 52 }}>
              60<span className="text-[28px] text-[#222]">%</span>
            </div>
            <div className="mt-2.5 h-px bg-[#111] relative overflow-hidden">
              <motion.div className="h-px bg-accent absolute inset-y-0 left-0"
                initial={{ width: 0 }} animate={{ width: '60%' }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }} />
            </div>
            <p className="text-[9px] font-sans uppercase tracking-[0.35em] text-[#333] mt-1.5">Occupancy</p>
          </div>
          <div>
            <div className="hv font-black text-accent leading-none" style={{ fontSize: 36 }}>€18.4K</div>
            <p className="text-[9px] font-sans uppercase tracking-[0.35em] text-[#333] mt-1">Revenue Est.</p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {user.role === 'admin' ? (
          <>
            <NavLink icon={<Building2 size={14}/>} label="Venues"
              active={view==='venues'||view==='venue-events'}
              onClick={() => onNav('venues')} />
            <NavLink icon={<Settings size={14}/>} label="Venue Design"
              active={view==='editor'}
              onClick={() => onNav('editor')} />
            <NavLink icon={<BarChart3 size={14}/>} label="Reservations"
              active={view==='reservations'}
              onClick={() => onNav('reservations')} />
          </>
        ) : (
          <>
            <NavLink icon={<Calendar size={14}/>} label="Events"
              active={view==='events'||view==='plan'}
              onClick={() => onNav('events')} />
            <NavLink icon={<BarChart3 size={14}/>} label="Reservations"
              active={view==='reservations'}
              onClick={() => onNav('reservations')} />
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-6 py-6 border-t border-[#111] shrink-0">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-[#111] border border-[#222] flex items-center justify-center shrink-0">
            <span className="hv font-black text-accent text-xs">{user.displayName.substring(0, 2).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] hv font-black uppercase text-white truncate">{user.displayName}</p>
            <p className="text-[8px] font-sans text-[#333] uppercase tracking-widest mt-0.5">{user.role}</p>
          </div>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-2 text-[#333] hover:text-accent transition-colors text-[9px] font-sans uppercase tracking-widest w-full">
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </>
  );
}

/* ── NavLink ─────────────────────────────────────────────── */
function NavLink({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn(
        'flex items-center gap-3 w-full px-3 py-2.5 text-[10px] font-sans font-medium uppercase tracking-[0.25em] transition-all group border-l-2',
        active
          ? 'text-accent border-accent bg-accent/5'
          : 'text-[#3a3a3a] border-transparent hover:text-white hover:border-[#2a2a2a]'
      )}>
      <span className={cn('transition-colors shrink-0', active ? 'text-accent' : 'text-[#2a2a2a] group-hover:text-[#555]')}>
        {icon}
      </span>
      {label}
    </button>
  );
}

/* ── PageTitle ───────────────────────────────────────────── */
function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-8">
      <h2 className="hv font-black text-3xl md:text-4xl uppercase text-white leading-tight">{title}</h2>
      {sub && <p className="text-[10px] font-sans uppercase tracking-widest text-[#333] mt-1.5">{sub}</p>}
    </div>
  );
}

/* ── EmptyState ──────────────────────────────────────────── */
function EmptyState({ icon, label, children }: { icon: React.ReactNode; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 text-center mt-4">
      <div className="text-[#1e1e1e] mb-4">{icon}</div>
      <p className="text-[10px] font-sans uppercase tracking-widest text-[#333]">{label}</p>
      {children}
    </div>
  );
}

/* ── VenueCard ───────────────────────────────────────────── */
function VenueCard({ venue, eventCount, onClick }: { venue: Venue; eventCount: number; onClick: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="group bg-card border border-[#1a1a1a] cursor-pointer overflow-hidden flex flex-col relative"
    >
      {/* Top accent bar */}
      <div className="h-[2px] w-0 group-hover:w-full bg-accent transition-all duration-500 origin-left" />

      <div className="p-7 flex flex-col gap-7 flex-1">
        <div className="w-9 h-9 border border-[#222] flex items-center justify-center group-hover:border-accent/30 transition-colors">
          <Building2 size={15} className="text-[#333] group-hover:text-accent transition-colors" />
        </div>

        <div className="flex-1">
          <h3 className="hv font-black text-[clamp(22px,3vw,30px)] uppercase text-white leading-tight group-hover:text-accent transition-colors">
            {venue.name}
          </h3>
          <p className="text-[9px] font-sans uppercase tracking-widest text-[#2a2a2a] mt-1">{venue.address}</p>
        </div>

        <div className="flex items-end justify-between border-t border-[#111] pt-5">
          <div>
            <span className="hv font-black text-[52px] leading-none text-[#161616] group-hover:text-[#222] transition-colors select-none">
              {String(eventCount).padStart(2, '0')}
            </span>
            <p className="text-[8px] font-sans uppercase tracking-widest text-[#2a2a2a] mt-0.5">eventi</p>
          </div>
          <div className="flex items-center gap-1.5 text-[#2a2a2a] group-hover:text-accent transition-colors mb-1">
            <span className="text-[9px] font-sans uppercase tracking-widest">Apri</span>
            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── EventCard ───────────────────────────────────────────── */
function EventCard({ event, venueName, onClick }: { event: Event; venueName?: string; onClick: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="group bg-card border border-[#1a1a1a] cursor-pointer overflow-hidden flex flex-col"
    >
      <div className="h-[2px] w-0 group-hover:w-full bg-accent transition-all duration-500 origin-left" />

      <div className="p-7 flex flex-col gap-5 flex-1">
        <div className="flex items-center justify-between gap-3">
          {venueName && (
            <span className="text-[8px] font-sans uppercase tracking-widest text-[#2a2a2a] flex items-center gap-1.5">
              <Building2 size={9} /> {venueName}
            </span>
          )}
          <span className={cn(
            'text-[8px] font-sans font-bold uppercase tracking-widest px-2 py-1 shrink-0',
            event.status === 'active'
              ? 'text-accent bg-accent/8'
              : 'text-[#333] bg-[#111]'
          )}>
            {event.status === 'active' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent blink mr-1.5 align-middle" />}
            {event.status}
          </span>
        </div>

        <div className="flex-1">
          <p className="font-mono text-[10px] text-[#2a2a2a] mb-2 tracking-wider">{event.date}</p>
          <h3 className="hv font-black text-[clamp(18px,2.5vw,24px)] uppercase text-white leading-tight">{event.name}</h3>
          <p className="text-[11px] font-sans text-[#333] mt-2.5 leading-relaxed line-clamp-2">{event.description}</p>
        </div>

        <div className="flex items-center gap-1.5 text-[#2a2a2a] group-hover:text-accent transition-colors border-t border-[#111] pt-4 mt-1">
          <span className="text-[9px] font-sans uppercase tracking-widest">Apri Pianta</span>
          <ChevronRight size={11} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}

/* ── ReservationsTable ───────────────────────────────────── */
function ReservationsTable({ reservations, userRole }: { reservations: Reservation[]; userRole: string }) {
  return (
    <div className="bg-card border border-[#1a1a1a] overflow-hidden">
      <div className="px-7 py-5 border-b border-[#111] flex justify-between items-center">
        <h2 className="hv font-black text-xl uppercase text-white">Prenotazioni</h2>
        <div className="flex gap-2">
          <IconBtn><Filter size={14} /></IconBtn>
          <IconBtn><Download size={14} /></IconBtn>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-[#111]">
              {['Status', 'Tavolo', 'Ospite', ...(userRole === 'admin' ? ['PR'] : []), 'Pax', 'Budget'].map(h => (
                <th key={h} className="px-7 py-4 text-[8px] font-sans font-bold uppercase tracking-[0.35em] text-[#2a2a2a]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reservations.map(res => (
              <tr key={res.id} className="border-b border-[#0d0d0d] hover:bg-white/[0.01] transition-colors group">
                <td className="px-7 py-5">
                  <div className="flex items-center gap-2.5">
                    <span className={cn('w-1.5 h-1.5 rounded-full shrink-0',
                      res.status === 'confirmed' ? 'bg-accent blink' : 'bg-[#222]'
                    )} />
                    <span className={cn('text-[9px] font-sans uppercase tracking-widest',
                      res.status === 'confirmed' ? 'text-accent' : 'text-[#333]'
                    )}>{res.status}</span>
                  </div>
                </td>
                <td className="px-7 py-5">
                  <span className="hv font-bold text-sm text-white">{res.tableId}</span>
                </td>
                <td className="px-7 py-5">
                  <p className="hv font-bold text-[11px] uppercase text-white">{res.customerName}</p>
                  <p className="font-mono text-[9px] text-[#333] mt-0.5">{res.customerPhone}</p>
                </td>
                {userRole === 'admin' && (
                  <td className="px-7 py-5">
                    <span className="text-[9px] font-sans text-[#333] uppercase tracking-widest group-hover:text-accent transition-colors">{res.prName}</span>
                  </td>
                )}
                <td className="px-7 py-5">
                  <span className="hv font-black text-xl text-[#333]">{res.guestsCount}</span>
                </td>
                <td className="px-7 py-5 text-right">
                  <span className="hv font-black text-xl text-accent">€{res.budget}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {reservations.length === 0 && (
          <div className="px-7 py-24 text-center">
            <p className="text-[9px] font-sans uppercase tracking-[0.4em] text-[#1e1e1e]">Nessuna Prenotazione</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── NewEventModal ───────────────────────────────────────── */
function NewEventModal({ venue, onClose, onSubmit }: {
  venue: Venue;
  onClose: () => void;
  onSubmit: (d: { name: string; date: string; description: string }) => void;
}) {
  const [form, setForm] = useState({ name: '', date: '', description: '' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative w-full max-w-md bg-card border border-[#1a1a1a] overflow-hidden"
      >
        <div className="h-[2px] bg-accent" />
        <div className="px-8 py-6 border-b border-[#111] flex items-center justify-between">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">Nuovo Evento</h3>
            <p className="text-[9px] font-sans uppercase tracking-widest text-[#333] mt-1">{venue.name}</p>
          </div>
          <button onClick={onClose} className="text-[#333] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        <form className="p-8 space-y-5" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <Field label="Nome Evento">
            <input required placeholder="ES. TECHNO FRIDAY"
              className="w-full bg-bg border border-[#1a1a1a] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#2a2a2a] outline-none transition-colors"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Data">
            <input required type="date"
              className="w-full bg-bg border border-[#1a1a1a] px-4 py-3 text-xs font-sans text-white outline-none transition-colors [color-scheme:dark]"
              value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Descrizione (opzionale)">
            <textarea rows={2} placeholder="DETTAGLI..."
              className="w-full bg-bg border border-[#1a1a1a] px-4 py-3 text-xs font-sans uppercase tracking-widest text-white placeholder-[#2a2a2a] outline-none transition-colors resize-none"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest border border-[#1a1a1a] text-[#333] hover:text-white hover:border-[#333] transition-all">
              Annulla
            </button>
            <button type="submit"
              className="flex-1 py-3.5 text-[9px] hv font-black uppercase tracking-widest bg-accent text-black hover:bg-white transition-colors">
              Crea Evento
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
      <label className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#333]">{label}</label>
      {children}
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="w-8 h-8 border border-[#1a1a1a] flex items-center justify-center text-[#333] hover:text-accent hover:border-[#2a2a2a] transition-all">
      {children}
    </button>
  );
}
