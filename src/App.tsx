import React, { useState, useEffect } from 'react';
import { Layout, Calendar, Users, Map as MapIcon, Plus, LogOut, ChevronRight, Settings, BarChart3, Filter, Download } from 'lucide-react';
import { MOCK_ADMIN, MOCK_PR, MOCK_EVENTS, MOCK_FLOOR_PLAN, MOCK_RESERVATIONS } from './constants';
import { UserProfile, Event, Reservation } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import FloorPlanViewer from './components/floorplan/FloorPlanViewer';
import FloorPlanEditor from './components/floorplan/FloorPlanEditor';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'events' | 'editor' | 'reservations' | 'plan'>('events');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>(MOCK_RESERVATIONS);

  // Authentication Mock
  const handleLogin = (role: 'admin' | 'pr') => {
    setUser(role === 'admin' ? MOCK_ADMIN : MOCK_PR);
    setView('events');
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedEvent(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-20 pointer-events-none floorplan-grid"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-card border border-border rounded-2xl p-12 shadow-2xl gold-glow text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-accent rounded-full mb-10 shadow-[0_0_50px_rgba(212,175,55,0.3)]">
              <span className="text-black font-black text-4xl serif">N</span>
            </div>
            
            <h1 className="text-5xl font-black text-white tracking-tight uppercase italic serif mb-2">Nightplan</h1>
            <div className="h-px w-12 bg-accent/40 mx-auto mb-4"></div>
            <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] mb-12">Sophisticated Venue Management</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => handleLogin('admin')}
                className="group relative w-full overflow-hidden bg-accent text-black font-black py-5 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px]"
              >
                <span>Accedi come Proprietario</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => handleLogin('pr')}
                className="group w-full bg-transparent text-white/60 font-black py-5 rounded-lg hover:text-white hover:bg-white/5 transition-all border border-border flex items-center justify-center gap-2 uppercase tracking-[0.2em] text-[10px]"
              >
                <span>Accesso Staff PR</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-zinc-600 text-[10px] uppercase tracking-widest leading-loose">
                Un'esperienza esclusiva di gestione<br/>per i club più prestigiosi.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-zinc-50 flex">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-[#050505] flex flex-col hidden md:flex">
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

        <div className="flex-1 px-6 space-y-12">
           <div className="space-y-6">
              <h3 className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 px-4 font-black">Overview</h3>
              <div className="space-y-4 px-4">
                <div className="group">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2 group-hover:text-accent transition-colors">Occupacy Rate</div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl serif text-white">60</span>
                    <span className="text-xs text-zinc-600 mb-1.5 font-bold">%</span>
                  </div>
                  <div className="h-0.5 w-full bg-zinc-900 mt-3 rounded-full overflow-hidden">
                    <div className="h-full bg-accent w-[60%]"></div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Revenue Projected</div>
                  <div className="text-2xl serif text-accent">€18.400</div>
                </div>
              </div>
           </div>

          <div className="space-y-6">
            <h3 className="text-[9px] uppercase tracking-[0.3em] text-zinc-600 px-4 font-black">Navigation</h3>
            <nav className="space-y-2">
              <SidebarLink 
                icon={<Calendar size={18} />} 
                label="Boutique Events" 
                active={view === 'events' || view === 'plan'} 
                onClick={() => { setView('events'); setSelectedEvent(null); }} 
              />
              {user.role === 'admin' && (
                <SidebarLink 
                  icon={<Settings size={18} />} 
                  label="Venue Design" 
                  active={view === 'editor'} 
                  onClick={() => setView('editor')} 
                />
              )}
              <SidebarLink 
                icon={<BarChart3 size={18} />} 
                label="Reservations" 
                active={view === 'reservations'} 
                onClick={() => setView('reservations')} 
              />
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
          <button 
            onClick={handleLogout}
            className="group flex items-center gap-3 text-zinc-600 hover:text-white transition-all w-full px-2 py-2 text-[9px] uppercase tracking-[0.3em] font-black"
          >
            <LogOut size={14} className="group-hover:text-red-500 transition-colors" /> 
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col relative">
        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
             {view === 'plan' && (
               <button 
                onClick={() => setView('events')}
                className="p-1 px-2 border border-border rounded text-zinc-500 hover:text-white hover:border-accent/50 transition-all text-[10px] uppercase tracking-widest"
              >
                Indietro
              </button>
             )}
             <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-zinc-400">
              {view === 'plan' ? selectedEvent?.name : view}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-4 hidden sm:flex border-r border-border pr-4">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Sistema Attivo</span>
                <span className="text-xs font-medium text-accent">Real-time Sync</span>
            </div>
            {view === 'events' && user.role === 'admin' && (
              <button className="bg-accent text-black px-4 py-2 rounded text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all">
                <Plus size={14} /> New Event
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
            {view === 'events' && (
              <motion.div 
                key="events"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {MOCK_EVENTS.map(event => (
                  <EventCard 
                    key={event.id} 
                    event={event} 
                    onClick={() => {
                      setSelectedEvent(event);
                      setView('plan');
                    }}
                  />
                ))}
              </motion.div>
            )}

            {view === 'plan' && selectedEvent && (
              <motion.div 
                key="plan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col"
              >
                <FloorPlanViewer 
                  event={selectedEvent} 
                  floorPlan={MOCK_FLOOR_PLAN} 
                  reservations={reservations}
                  currentUser={user}
                  onReservationAdded={(res) => setReservations([...reservations, res])}
                />
              </motion.div>
            )}

            {view === 'editor' && (
              <motion.div 
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <FloorPlanEditor floorPlan={MOCK_FLOOR_PLAN} />
              </motion.div>
            )}

            {view === 'reservations' && (
              <motion.div 
                key="reservations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ReservationsTable 
                  reservations={user.role === 'admin' ? reservations : reservations.filter(r => r.prId === user.id)}
                  userRole={user.role}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 w-full px-4 py-3 rounded-lg transition-all text-[10px] uppercase tracking-[0.2em] font-black group",
        active 
          ? "bg-accent/5 text-accent border-l-2 border-accent" 
          : "text-zinc-600 hover:text-white hover:translate-x-1"
      )}
    >
      <span className={cn("transition-colors", active ? "text-accent" : "text-zinc-700 group-hover:text-accent")}>
        {React.cloneElement(icon as React.ReactElement<any>, { size: 14 })}
      </span>
      {label}
    </button>
  );
}

function EventCard({ event, onClick }: { event: Event, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-accent/30 transition-all hover:shadow-[0_0_50px_rgba(212,175,55,0.03)] flex flex-col relative"
    >
      <div className="aspect-[4/5] bg-[#0a0a0b] relative overflow-hidden">
        <img 
          src={MOCK_FLOOR_PLAN.imageUrl} 
          alt={event.name} 
          className="w-full h-full object-cover opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-[2s] grayscale" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        
        <div className="absolute inset-0 p-8 flex flex-col justify-end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-accent/50"></div>
              <span className="text-accent text-[9px] font-black uppercase tracking-[0.3em]">{event.status}</span>
            </div>
            
            <div>
              <p className="serif italic text-white/50 text-base mb-1 tracking-wider">{event.date}</p>
              <h4 className="text-3xl font-bold tracking-tight text-white uppercase italic serif leading-tight">{event.name}</h4>
            </div>

            <p className="text-zinc-500 text-[10px] leading-relaxed tracking-[0.1em] uppercase font-medium max-w-[80%] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
              {event.description}
            </p>

            <div className="pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.2em] text-accent font-black">Open Gallery</span>
                <ChevronRight size={14} className="text-accent group-hover:translate-x-2 transition-transform duration-500" />
              </div>
              
              <div className="flex -space-x-2 opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all duration-700">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-card flex items-center justify-center text-[8px] font-black italic serif">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReservationsTable({ reservations, userRole }: { reservations: Reservation[], userRole: string }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl glass">
      <div className="p-8 border-b border-border flex justify-between items-center bg-[#0c0c0d]">
        <h3 className="serif text-2xl italic">Manifesto Prenotazioni</h3>
        <div className="flex gap-4">
          <button className="p-2 text-zinc-500 hover:text-white transition-colors border border-border rounded">
            <Filter size={16} />
          </button>
          <button className="p-2 text-zinc-500 hover:text-white transition-colors border border-border rounded">
            <Download size={16} />
          </button>
        </div>
      </div>
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#0c0c0d]/50 text-[9px] uppercase font-black tracking-[0.3em] text-zinc-600 border-b border-border">
          <tr>
            <th className="px-10 py-6">Status</th>
            <th className="px-10 py-6">Slot</th>
            <th className="px-10 py-6">Ospite</th>
            {userRole === 'admin' && <th className="px-10 py-6">Referente PR</th>}
            <th className="px-10 py-6 text-center">Pax</th>
            <th className="px-10 py-6 text-right">Commitment</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {reservations.map(res => (
            <tr key={res.id} className="hover:bg-accent/[0.02] transition-all group cursor-default">
              <td className="px-10 py-7">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full gold-glow",
                    res.status === 'confirmed' ? "bg-accent shadow-[0_0_10px_rgba(212,175,55,0.4)]" : "bg-zinc-700"
                  )}></div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em]",
                    res.status === 'confirmed' ? "text-accent" : "text-zinc-600"
                  )}>{res.status}</span>
                </div>
              </td>
              <td className="px-10 py-7">
                <span className="text-sm font-bold serif italic text-white/80 group-hover:text-accent transition-colors">T.{res.tableId}</span>
              </td>
              <td className="px-10 py-7">
                <p className="font-bold text-xs tracking-[0.1em] text-white uppercase">{res.customerName}</p>
                <p className="text-zinc-600 text-[9px] uppercase tracking-[0.2em] mt-1 font-mono">{res.customerPhone}</p>
              </td>
              {userRole === 'admin' && (
                <td className="px-10 py-7">
                  <span className="text-[10px] text-accent/60 font-black uppercase tracking-[0.2em] group-hover:text-accent transition-colors">{res.prName}</span>
                </td>
              )}
              <td className="px-10 py-7 text-center">
                <span className="serif text-xl text-zinc-400">{res.guestsCount}</span>
              </td>
              <td className="px-10 py-7 text-right">
                <div className="flex flex-col items-end">
                  <span className="serif text-2xl text-accent italic">€{res.budget}</span>
                  <span className="text-[8px] text-zinc-700 uppercase tracking-widest mt-1">Pre-autorizzato</span>
                </div>
              </td>
            </tr>
          ))}
          {reservations.length === 0 && (
            <tr>
              <td colSpan={6} className="px-10 py-32 text-center border-none bg-bg/20">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full border border-border border-dashed flex items-center justify-center opacity-10">
                    <Users size={24} />
                  </div>
                  <span className="uppercase tracking-[0.4em] text-[9px] text-zinc-700 font-black">Nessun Dato Disponibile</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
