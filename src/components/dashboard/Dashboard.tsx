import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Bell, Users, DoorOpen, TrendingUp,
  ChevronRight, MapPin, Link2, BarChart3, CheckCircle2, Clock
} from 'lucide-react';
import { UserProfile, Event, Venue, Reservation, ManagedUser } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  user: UserProfile;
  events: Event[];
  venues: Venue[];
  reservations: Reservation[];
  managedUsers: ManagedUser[];
  pendingCount: number;
  prPendingCount: number;
  onNav: (view: string) => void;
  onOpenEvent: (event: Event) => void;
}

export default function Dashboard({ user, events, venues, reservations, managedUsers, pendingCount, prPendingCount, onNav, onOpenEvent }: Props) {
  if (user.role === 'admin') return <AdminDashboard user={user} events={events} venues={venues} reservations={reservations} managedUsers={managedUsers} pendingCount={pendingCount} onNav={onNav} onOpenEvent={onOpenEvent} />;
  if (user.role === 'pr')    return <PRDashboard user={user} events={events} venues={venues} reservations={reservations} prPendingCount={prPendingCount} onNav={onNav} onOpenEvent={onOpenEvent} />;
  return <HostDashboard user={user} events={events} venues={venues} reservations={reservations} onNav={onNav} />;
}

/* ── Admin ─────────────────────────────────────────────────── */
function AdminDashboard({ user, events, venues, reservations, managedUsers, pendingCount, onNav, onOpenEvent }: {
  user: UserProfile; events: Event[]; venues: Venue[]; reservations: Reservation[];
  managedUsers: ManagedUser[]; pendingCount: number;
  onNav: (v: string) => void; onOpenEvent: (e: Event) => void;
}) {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buongiorno' : hour < 18 ? 'Buon pomeriggio' : 'Buonasera';
  const dateStr = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  const activeEvents = events.filter(e => e.status === 'active');
  const activeIds = new Set(activeEvents.map(e => e.id));
  const activeRes = reservations.filter(r => activeIds.has(r.eventId) && r.approvalStatus === 'approved');
  const checkedIn = activeRes.filter(r => r.checkedIn);
  const revenueEst = activeRes.reduce((s, r) => s + (r.actualBudget ?? r.budget), 0);

  const totalTables = activeEvents.reduce((sum, ev) => {
    const venue = venues.find(v => v.id === ev.venueId);
    const fp = venue?.floorPlans.find(f => f.id === ev.floorPlanId) ?? venue?.floorPlans[0];
    return sum + (fp?.tables.filter(t => !t.isFixture).length ?? 0);
  }, 0);
  const occupancy = totalTables > 0 ? Math.round((activeRes.length / totalTables) * 100) : 0;

  const kpis = [
    { label: 'Tavoli', value: `${activeRes.length}/${totalTables}`, sub: `${occupancy}% occupancy`, color: 'text-[#D4622A]', icon: <MapPin size={14}/> },
    { label: 'Incasso est.', value: revenueEst >= 1000 ? `€${(revenueEst/1000).toFixed(1)}K` : `€${revenueEst}`, sub: 'prenotazioni approvate', color: 'text-[#22C55E]', icon: <TrendingUp size={14}/> },
    { label: 'Da approvare', value: String(pendingCount), sub: 'in attesa', color: pendingCount > 0 ? 'text-[#F59E0B]' : 'text-[#555]', icon: <Bell size={14}/> },
    { label: 'Entrati', value: String(checkedIn.length), sub: `di ${activeRes.length} prenotati`, color: 'text-[#38BDF8]', icon: <CheckCircle2 size={14}/> },
  ];

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#D4622A] mb-1">{dateStr}</p>
        <h1 className="hv font-black text-3xl uppercase text-white leading-tight">
          {greeting},<br />{user.displayName}
        </h1>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="border border-[#2a2a2a] bg-[#1a1a1a] p-4"
          >
            <div className={cn('mb-3', k.color)}>{k.icon}</div>
            <div className={cn('hv font-black text-3xl leading-none', k.color)}>{k.value}</div>
            <div className="text-[8px] font-mono uppercase tracking-widest text-[#555] mt-2">{k.label}</div>
            <div className="text-[9px] font-sans text-[#444] mt-0.5">{k.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Serate attive */}
      {activeEvents.length > 0 && (
        <div>
          <p className="text-[8px] font-mono uppercase tracking-[0.35em] text-[#555] mb-3">Serate in corso</p>
          <div className="space-y-2">
            {activeEvents.map(ev => {
              const venue = venues.find(v => v.id === ev.venueId);
              const evRes = activeRes.filter(r => r.eventId === ev.id);
              return (
                <motion.button
                  key={ev.id}
                  onClick={() => onOpenEvent(ev)}
                  whileTap={{ scale: 0.985 }}
                  className="w-full flex items-center gap-4 border border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#D4622A]/30 transition-colors p-4 text-left"
                >
                  <div className="w-2 h-2 rounded-full bg-[#D4622A] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="hv font-black uppercase text-white text-sm truncate">{ev.name}</p>
                    <p className="text-[9px] font-mono text-[#555] mt-0.5">{venue?.name ?? ''} · {evRes.length} tavoli</p>
                  </div>
                  <ChevronRight size={14} className="text-[#555] shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p className="text-[8px] font-mono uppercase tracking-[0.35em] text-[#555] mb-3">Azioni rapide</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Approva', icon: <Bell size={14}/>, view: 'approvals', badge: pendingCount },
            { label: 'PR Team', icon: <Users size={14}/>, view: 'pr-management' },
            { label: 'Ingresso', icon: <DoorOpen size={14}/>, view: 'checkin' },
            { label: 'Club', icon: <MapPin size={14}/>, view: 'venues' },
          ].map(a => (
            <button
              key={a.view}
              onClick={() => onNav(a.view)}
              className="relative flex items-center gap-3 border border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#D4622A]/30 hover:bg-[#1e1e1e] transition-colors px-4 py-3 text-left"
            >
              <span className="text-[#D4622A]">{a.icon}</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#888]">{a.label}</span>
              {a.badge !== undefined && a.badge > 0 && (
                <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#F59E0B] text-black text-[8px] font-black flex items-center justify-center">
                  {a.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── PR ────────────────────────────────────────────────────── */
function PRDashboard({ user, events, venues, reservations, prPendingCount, onNav, onOpenEvent }: {
  user: UserProfile; events: Event[]; venues: Venue[]; reservations: Reservation[];
  prPendingCount: number; onNav: (v: string) => void; onOpenEvent: (e: Event) => void;
}) {
  const activeEvents = events.filter(e => e.status === 'active');
  const myRes = reservations.filter(r => r.prId === user.id);
  const myActiveRes = myRes.filter(r => activeEvents.some(e => e.id === r.eventId));
  const myApproved = myActiveRes.filter(r => r.approvalStatus === 'approved');
  const myBudget = myApproved.reduce((s, r) => s + (r.actualBudget ?? r.budget), 0);

  const activeWithToken = activeEvents.filter(e => e.registrationToken);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 18 ? 'Ciao' : 'Buonasera';

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#D4622A] mb-1">
          {now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="hv font-black text-3xl uppercase text-white leading-tight">
          {greeting},<br />{user.displayName}
        </h1>
      </div>

      {/* Stats stasera */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Prenotate', value: myActiveRes.length, color: 'text-white' },
          { label: 'Approvate', value: myApproved.length, color: 'text-[#22C55E]' },
          { label: 'In attesa', value: prPendingCount, color: prPendingCount > 0 ? 'text-[#F59E0B]' : 'text-[#555]' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: i * 0.06 }}
            className="border border-[#2a2a2a] bg-[#1a1a1a] p-4 text-center"
          >
            <div className={cn('hv font-black text-3xl leading-none', s.color)}>{s.value}</div>
            <div className="text-[8px] font-mono uppercase tracking-widest text-[#555] mt-2">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {myBudget > 0 && (
        <div className="border border-[#2a2a2a] bg-[#1a1a1a] p-4 flex items-center justify-between">
          <div>
            <p className="text-[8px] font-mono uppercase tracking-widest text-[#555]">Budget generato stasera</p>
            <p className="hv font-black text-2xl text-[#22C55E] mt-1">
              {myBudget >= 1000 ? `€${(myBudget/1000).toFixed(1)}K` : `€${myBudget}`}
            </p>
          </div>
          <TrendingUp size={24} className="text-[#22C55E]/30" />
        </div>
      )}

      {/* CTA principale */}
      {activeEvents.length > 0 && (
        <div>
          <p className="text-[8px] font-mono uppercase tracking-[0.35em] text-[#555] mb-3">Serate attive</p>
          <div className="space-y-2">
            {activeEvents.map(ev => {
              const venue = venues.find(v => v.id === ev.venueId);
              return (
                <motion.button
                  key={ev.id}
                  onClick={() => onOpenEvent(ev)}
                  whileTap={{ scale: 0.985 }}
                  className="w-full flex items-center gap-4 bg-[#D4622A] hover:bg-white transition-colors p-4 text-left group"
                >
                  <Calendar size={16} className="text-black shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="hv font-black uppercase text-black text-sm truncate">{ev.name}</p>
                    <p className="text-[9px] font-mono text-black/60 mt-0.5">{venue?.name ?? ''}</p>
                  </div>
                  <ChevronRight size={14} className="text-black shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Il mio link */}
      {activeWithToken.length > 0 && (
        <div>
          <p className="text-[8px] font-mono uppercase tracking-[0.35em] text-[#555] mb-3">Il tuo link</p>
          <div className="space-y-2">
            {activeWithToken.map(ev => {
              const link = `${window.location.origin}/r/${ev.registrationToken}?pr=${user.id}`;
              return (
                <div key={ev.id} className="border border-[#2a2a2a] bg-[#1a1a1a] p-4 space-y-3">
                  <p className="hv font-black uppercase text-white text-xs">{ev.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#111] border border-[#222] px-3 py-2 overflow-hidden">
                      <p className="text-[9px] font-mono text-[#555] truncate">{link}</p>
                    </div>
                    <button
                      onClick={() => navigator.clipboard.writeText(link)}
                      className="shrink-0 px-4 py-2 bg-[#D4622A] text-black text-[9px] font-mono uppercase tracking-widest hover:bg-white transition-colors"
                    >
                      Copia
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Azioni rapide */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Prenotazioni', icon: <BarChart3 size={14}/>, view: 'reservations', badge: prPendingCount },
          { label: 'Storico', icon: <Clock size={14}/>, view: 'history' },
        ].map(a => (
          <button
            key={a.view}
            onClick={() => onNav(a.view)}
            className="relative flex items-center gap-3 border border-[#2a2a2a] bg-[#1a1a1a] hover:border-[#D4622A]/30 transition-colors px-4 py-3"
          >
            <span className="text-[#D4622A]">{a.icon}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#888]">{a.label}</span>
            {a.badge !== undefined && a.badge > 0 && (
              <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#F59E0B] text-black text-[8px] font-black flex items-center justify-center">
                {a.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Host ───────────────────────────────────────────────────── */
function HostDashboard({ user, events, venues, reservations, onNav }: {
  user: UserProfile; events: Event[]; venues: Venue[];
  reservations: Reservation[]; onNav: (v: string) => void;
}) {
  const activeEvents = events.filter(e => e.status === 'active');
  const activeEvent = activeEvents[0] ?? null;
  const venue = activeEvent ? venues.find(v => v.id === activeEvent.venueId) : null;
  const approved = reservations.filter(r => r.approvalStatus === 'approved' && activeEvents.some(e => e.id === r.eventId));
  const checkedIn = approved.filter(r => r.checkedIn);
  const pct = approved.length > 0 ? Math.round((checkedIn.length / approved.length) * 100) : 0;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 18 ? 'Ciao' : 'Buonasera';

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#D4622A] mb-1">
          {now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="hv font-black text-3xl uppercase text-white leading-tight">
          {greeting},<br />{user.displayName}
        </h1>
      </div>

      {!activeEvent ? (
        <div className="py-20 text-center border border-[#2a2a2a]">
          <DoorOpen size={32} className="text-[#333] mx-auto mb-3" />
          <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#555]">Nessun evento attivo stasera</p>
        </div>
      ) : (
        <>
          {/* Evento in corso */}
          <div className="border-l-2 border-[#D4622A] pl-4">
            <p className="text-[8px] font-mono uppercase tracking-widest text-[#555]">{venue?.name ?? ''}</p>
            <p className="hv font-black uppercase text-white text-lg">{activeEvent.name}</p>
          </div>

          {/* Grande numero */}
          <div className="border border-[#2a2a2a] bg-[#1a1a1a] p-8 text-center">
            <div className="hv font-black text-white leading-none" style={{ fontSize: 72 }}>
              {checkedIn.length}
            </div>
            <div className="text-[#555] hv font-black text-xl mt-1">/ {approved.length}</div>
            <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-[#555] mt-3">Persone entrate</p>
            {/* Progress bar */}
            <div className="mt-4 h-1 bg-[#222] overflow-hidden">
              <motion.div
                className="h-full bg-[#22C55E]"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-[9px] font-mono text-[#555] mt-2">{pct}%</p>
          </div>

          {/* CTA principale */}
          <div className="space-y-2">
            <motion.button
              onClick={() => onNav('checkin')}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-3 bg-[#D4622A] text-black py-5 font-black uppercase tracking-widest hover:bg-white transition-colors"
              style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif', fontSize: 13 }}
            >
              <DoorOpen size={18} />
              Vai all'ingresso
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}
