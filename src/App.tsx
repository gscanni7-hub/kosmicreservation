import React, { useState } from 'react';
import { Calendar, Settings, BarChart3, LogOut, ChevronRight, Plus, Download, Filter, Users, Building2, X, ArrowLeft } from 'lucide-react';
import { MOCK_ADMIN, MOCK_PR, INITIAL_VENUES, INITIAL_EVENTS, INITIAL_RESERVATIONS } from './constants';
import { UserProfile, Event, Reservation, Venue, FloorPlan } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import FloorPlanViewer from './components/floorplan/FloorPlanViewer';
import FloorPlanEditor from './components/floorplan/FloorPlanEditor';

type AppView = 'venues' | 'venue-events' | 'events' | 'plan' | 'editor' | 'reservations';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<AppView>('venues');
  const [venues, setVenues] = useState(INITIAL_VENUES);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showNewEventModal, setShowNewEventModal] = useState(false);

  const handleLogin = (role: 'admin' | 'pr') => {
    setUser(role === 'admin' ? MOCK_ADMIN : MOCK_PR);
    setView(role === 'admin' ? 'venues' : 'events');
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedVenue(null);
    setSelectedEvent(null);
  };

  const openVenue = (venue: Venue) => {
    setSelectedVenue(venue);
    setView('venue-events');
  };

  const openEvent = (event: Event) => {
    if (!selectedVenue) {
      const v = venues.find(v => v.id === event.venueId) ?? null;
      setSelectedVenue(v);
    }
    setSelectedEvent(event);
    setView('plan');
  };

  const goBack = () => {
    if (view === 'plan') {
      setSelectedEvent(null);
      setView(user?.role === 'admin' ? 'venue-events' : 'events');
    } else if (view === 'venue-events') {
      setSelectedVenue(null);
      setView('venues');
    }
  };

  const getFloorPlan = (event: Event): FloorPlan | undefined => {
    const venue = venues.find(v => v.id === event.venueId);
    return venue?.floorPlans.find(fp => fp.id === event.floorPlanId) ?? venue?.floorPlans[0];
  };

  const activeEvents = events.filter(e => e.status === 'active');
  const venueEvents = selectedVenue ? events.filter(e => e.venueId === selectedVenue.id) : [];

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-20 pointer-events-none floorplan-grid" />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
          <div className="bg-card border border-border rounded-2xl p-12 shadow-2xl gold-glow text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-full mb-10 shadow-[0_0_50px_rgba(212,175,55,0.3)]">
              <span className="text-black font-black text-4xl serif">N</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tight uppercase italic serif mb-2">Nightplan</h1>
            <div className="h-px w-12 bg-accent/40 mx-auto mb-4" />
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] mb-12">Sophisticated Venue Management</p>
            <div className="space-y-4">
              <button onClick={() => handleLogin('admin')} className="group relative w-full overflow-hidden bg-accent text-black font-black py-5 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px]">
                <span>Accedi come Proprietario</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => handleLogin('pr')} className="group w-full bg-transparent text-white/60 font-black py-5 rounded-lg hover:text-white hover:bg-white/5 transition-all border border-border flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px]">
                <span>Accesso Staff PR</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-zinc-600 text-[10px] uppercase tracking-widest leading-loose">Un'esperienza esclusiva di gestione<br />per i club più prestigiosi.</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const headerTitle = () => {
    if (view === 'venues')       return 'Venues';
    if (view === 'venue-events') return selectedVenue?.name ?? '';
    if (view === 'events')       return 'Events';
    if (view === 'plan')         return selectedEvent?.name ?? '';
    if (view === 'editor')       return 'Venue Design';
    if (view === 'reservations') return 'Reservations';
    return '';
  };

  const showBack = view === 'plan' || view === 'venue-events';

  return (
    <div className="min-h-screen bg-bg text-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-[#050505] flex-col hidden md:flex">
        <div className="p-10 mb-8 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center gold-glow">
              <span className="text-black font-black text-lg serif">N</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl serif italic text-white leading-tight">Nightplan</span>
              <span className="text-[8px] text-zinc-600 uppercase tracking-[0.4em] mt-0.5">Management Suite</span>
            </div>
          </div>
        </div>

        <div className="flex-1 px-6 space-y-10">
          {/* KPI — solo admin */}
          {user.role === 'admin' && (
            <div className="space-y-6 px-4">
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 font-black">Overview</h3>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Occupancy Rate</div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl serif text-white">60</span>
                  <span className="text-xs text-zinc-600 mb-1.5 font-bold">%</span>
                </div>
                <div className="h-0.5 w-full bg-zinc-900 mt-3 rounded-full overflow-hidden">
                  <div className="h-full bg-accent w-[60%]" />
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Revenue Projected</div>
                <div className="text-2xl serif text-accent">€18.400</div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 px-4 font-black">Navigation</h3>
            <nav className="space-y-2">
              {user.role === 'admin' ? (
                <>
                  <SidebarLink icon={<Building2 size={14} />} label="Venues" active={view === 'venues' || view === 'venue-events'} onClick={() => { setSelectedVenue(null); setSelectedEvent(null); setView('venues'); }} />
                  <SidebarLink icon={<Settings size={14} />} label="Venue Design" active={view === 'editor'} onClick={() => setView('editor')} />
                  <SidebarLink icon={<BarChart3 size={14} />} label="Reservations" active={view === 'reservations'} onClick={() => setView('reservations')} />
                </>
              ) : (
                <>
                  <SidebarLink icon={<Calendar size={14} />} label="Events" active={view === 'events' || view === 'plan'} onClick={() => { setSelectedEvent(null); setView('events'); }} />
                  <SidebarLink icon={<BarChart3 size={14} />} label="Reservations" active={view === 'reservations'} onClick={() => setView('reservations')} />
                </>
              )}
            </nav>
          </div>
        </div>

        <div className="mt-auto p-10 border-t border-border">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-full border border-accent/20 p-1">
              <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-xs font-black italic serif text-accent border border-accent/10">
                {user.displayName.substring(0, 2)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-white truncate">{user.displayName}</p>
              <p className="text-[9px] text-accent uppercase font-black tracking-[0.2em] mt-1 italic">{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="group flex items-center gap-3 text-zinc-600 hover:text-white transition-all w-full px-2 py-2 text-[9px] uppercase tracking-[0.3em] font-black">
            <LogOut size={14} className="group-hover:text-red-500 transition-colors" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto flex flex-col">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            {showBack && (
              <button onClick={goBack} className="flex items-center gap-2 p-1 px-3 border border-border rounded text-zinc-500 hover:text-white hover:border-accent/50 transition-all text-[10px] uppercase tracking-widest">
                <ArrowLeft size={12} /> Indietro
              </button>
            )}
            <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-zinc-400">{headerTitle()}</h2>
          </div>
          <div className="flex items-center gap-4">
            {view === 'venue-events' && user.role === 'admin' && (
              <button onClick={() => setShowNewEventModal(true)} className="bg-accent text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all">
                <Plus size={14} /> Nuovo Evento
              </button>
            )}
            {view === 'reservations' && (
              <button className="bg-transparent border border-accent text-accent px-4 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-accent hover:text-black transition-all">
                <Download size={14} /> Export CSV
              </button>
            )}
          </div>
        </header>

        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">

            {/* ── Admin: venues list ── */}
            {view === 'venues' && (
              <motion.div key="venues" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="mb-8">
                  <h3 className="serif text-3xl italic text-white mb-1">I tuoi Locali</h3>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Seleziona un locale per gestire gli eventi</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {venues.map(venue => (
                    <VenueCard key={venue.id} venue={venue} eventCount={events.filter(e => e.venueId === venue.id).length} onClick={() => openVenue(venue)} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Admin: events within a venue ── */}
            {view === 'venue-events' && selectedVenue && (
              <motion.div key="venue-events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="mb-8">
                  <p className="text-zinc-600 text-[9px] uppercase tracking-widest mb-1">Venue</p>
                  <h3 className="serif text-3xl italic text-white">{selectedVenue.name}</h3>
                </div>
                {venueEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <Calendar size={32} className="text-zinc-700 mb-4" />
                    <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Nessun evento ancora.<br />Crea il primo evento.</p>
                    <button onClick={() => setShowNewEventModal(true)} className="mt-6 bg-accent text-black px-6 py-3 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all">
                      <Plus size={14} /> Crea Evento
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {venueEvents.map(event => (
                      <EventCard key={event.id} event={event} onClick={() => openEvent(event)} />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── PR: all active events ── */}
            {view === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <div className="mb-8">
                  <h3 className="serif text-3xl italic text-white mb-1">Eventi in Corso</h3>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest">Seleziona un evento per accedere alla pianta</p>
                </div>
                {activeEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <Calendar size={32} className="text-zinc-700 mb-4" />
                    <p className="text-zinc-600 text-[10px] uppercase tracking-widest">Nessun evento attivo al momento.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {activeEvents.map(event => (
                      <EventCard
                        key={event.id}
                        event={event}
                        venueName={venues.find(v => v.id === event.venueId)?.name}
                        onClick={() => openEvent(event)}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Floor plan viewer ── */}
            {view === 'plan' && selectedEvent && (() => {
              const fp = getFloorPlan(selectedEvent);
              if (!fp) return null;
              return (
                <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col">
                  <FloorPlanViewer
                    event={selectedEvent}
                    floorPlan={fp}
                    reservations={reservations}
                    currentUser={user}
                    onReservationAdded={(res) => setReservations([...reservations, res])}
                  />
                </motion.div>
              );
            })()}

            {/* ── Editor ── */}
            {view === 'editor' && (
              <motion.div key="editor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FloorPlanEditor floorPlan={venues[0]?.floorPlans[0] ?? INITIAL_VENUES[0].floorPlans[0]} />
              </motion.div>
            )}

            {/* ── Reservations ── */}
            {view === 'reservations' && (
              <motion.div key="reservations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
            const newEvent: Event = {
              id: `e_${Date.now()}`,
              venueId: selectedVenue.id,
              floorPlanId: selectedVenue.floorPlans[0]?.id ?? '',
              status: 'active',
              ...data,
            };
            setEvents([...events, newEvent]);
            setShowNewEventModal(false);
          }}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn('flex items-center gap-4 w-full px-4 py-3 rounded-lg transition-all text-[10px] uppercase tracking-[0.2em] font-black group', active ? 'bg-accent/5 text-accent border-l-2 border-accent' : 'text-zinc-600 hover:text-white hover:translate-x-1')}>
      <span className={cn('transition-colors', active ? 'text-accent' : 'text-zinc-700 group-hover:text-accent')}>{icon}</span>
      {label}
    </button>
  );
}

function VenueCard({ venue, eventCount, onClick }: { venue: Venue; eventCount: number; onClick: () => void }) {
  return (
    <div onClick={onClick} className="group bg-card border border-border rounded-xl p-8 cursor-pointer hover:border-accent/40 transition-all hover:shadow-[0_0_40px_rgba(212,175,55,0.04)] flex flex-col gap-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent/3 blur-[60px] rounded-full pointer-events-none" />
      <div className="w-12 h-12 bg-accent/10 border border-accent/20 rounded-lg flex items-center justify-center">
        <Building2 size={20} className="text-accent" />
      </div>
      <div>
        <h4 className="text-2xl font-black uppercase tracking-tight text-white italic serif">{venue.name}</h4>
        <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">{venue.address}</p>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-600">{eventCount} eventi</span>
        <div className="flex items-center gap-2 text-accent text-[9px] uppercase tracking-[0.2em] font-black group-hover:gap-3 transition-all">
          Apri <ChevronRight size={12} />
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, venueName, onClick }: { event: Event; venueName?: string; onClick: () => void }) {
  return (
    <div onClick={onClick} className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-accent/30 transition-all flex flex-col relative">
      <div className="aspect-[4/3] bg-[#0a0a0b] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-zinc-950 floorplan-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
        <div className="absolute inset-0 p-8 flex flex-col justify-end">
          <div className="space-y-3">
            {venueName && (
              <div className="flex items-center gap-2">
                <Building2 size={10} className="text-accent/60" />
                <span className="text-accent/60 text-[9px] font-black uppercase tracking-[0.3em]">{venueName}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-accent/50" />
              <span className="text-accent text-[9px] font-black uppercase tracking-[0.3em]">{event.status}</span>
            </div>
            <div>
              <p className="serif italic text-white/50 text-sm mb-1">{event.date}</p>
              <h4 className="text-2xl font-bold tracking-tight text-white uppercase italic serif leading-tight">{event.name}</h4>
            </div>
            <p className="text-zinc-500 text-[10px] leading-relaxed tracking-[0.1em] uppercase font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
              {event.description}
            </p>
            <div className="pt-3 flex items-center gap-2">
              <span className="text-[9px] uppercase tracking-[0.2em] text-accent font-black">Apri Pianta</span>
              <ChevronRight size={12} className="text-accent group-hover:translate-x-2 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationsTable({ reservations, userRole }: { reservations: Reservation[]; userRole: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-border flex justify-between items-center bg-[#0c0c0d]">
        <h3 className="serif text-2xl italic">Manifesto Prenotazioni</h3>
        <div className="flex gap-4">
          <button className="p-2 text-zinc-500 hover:text-white transition-colors border border-border rounded"><Filter size={16} /></button>
          <button className="p-2 text-zinc-500 hover:text-white transition-colors border border-border rounded"><Download size={16} /></button>
        </div>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#0c0c0d]/50 text-[9px] uppercase font-black tracking-[0.3em] text-zinc-600 border-b border-border">
          <tr>
            <th className="px-8 py-5">Status</th>
            <th className="px-8 py-5">Tavolo</th>
            <th className="px-8 py-5">Ospite</th>
            {userRole === 'admin' && <th className="px-8 py-5">PR</th>}
            <th className="px-8 py-5 text-center">Pax</th>
            <th className="px-8 py-5 text-right">Budget</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reservations.map(res => (
            <tr key={res.id} className="hover:bg-accent/[0.02] transition-all cursor-default">
              <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className={cn('w-1.5 h-1.5 rounded-full', res.status === 'confirmed' ? 'bg-accent shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-zinc-700')} />
                  <span className={cn('text-[10px] font-black uppercase tracking-[0.2em]', res.status === 'confirmed' ? 'text-accent' : 'text-zinc-600')}>{res.status}</span>
                </div>
              </td>
              <td className="px-8 py-6"><span className="text-sm font-bold serif italic text-white/80">{res.tableId}</span></td>
              <td className="px-8 py-6">
                <p className="font-bold text-xs tracking-[0.1em] text-white uppercase">{res.customerName}</p>
                <p className="text-zinc-600 text-[9px] uppercase tracking-[0.2em] mt-1 font-mono">{res.customerPhone}</p>
              </td>
              {userRole === 'admin' && <td className="px-8 py-6"><span className="text-[10px] text-accent/60 font-black uppercase tracking-[0.2em]">{res.prName}</span></td>}
              <td className="px-8 py-6 text-center"><span className="serif text-xl text-zinc-400">{res.guestsCount}</span></td>
              <td className="px-8 py-6 text-right"><span className="serif text-2xl text-accent italic">€{res.budget}</span></td>
            </tr>
          ))}
          {reservations.length === 0 && (
            <tr>
              <td colSpan={6} className="px-8 py-32 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full border border-border border-dashed flex items-center justify-center opacity-10"><Users size={24} /></div>
                  <span className="uppercase tracking-[0.4em] text-[9px] text-zinc-700 font-black">Nessuna Prenotazione</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function NewEventModal({ venue, onClose, onSubmit }: { venue: Venue; onClose: () => void; onSubmit: (data: { name: string; date: string; description: string }) => void }) {
  const [form, setForm] = useState({ name: '', date: '', description: '' });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-lg bg-card border border-border rounded shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-border flex items-center justify-between bg-[#0c0c0d]">
          <div>
            <h3 className="serif text-2xl italic text-white">Nuovo Evento</h3>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">{venue.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded text-zinc-500 transition-colors"><X size={20} /></button>
        </div>
        <form className="p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Nome Evento</label>
            <input required className="w-full bg-bg border border-border rounded px-4 py-3 outline-none focus:border-accent/40 transition-colors text-xs uppercase tracking-widest" placeholder="ES. TECHNO FRIDAY" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Data</label>
            <input required type="date" className="w-full bg-bg border border-border rounded px-4 py-3 outline-none focus:border-accent/40 transition-colors text-xs" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Descrizione (opzionale)</label>
            <textarea rows={2} className="w-full bg-bg border border-border rounded px-4 py-3 outline-none focus:border-accent/40 transition-colors text-xs uppercase tracking-widest resize-none" placeholder="DETTAGLI EVENTO..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-black text-[9px] uppercase tracking-[0.2em] transition-all border border-border text-zinc-600 hover:text-white">Annulla</button>
            <button type="submit" className="flex-1 py-4 bg-accent text-black font-black text-[9px] uppercase tracking-[0.2em] hover:opacity-90 transition-all">Crea Evento</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
