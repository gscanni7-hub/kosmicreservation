import React, { useState } from 'react';
import { Event, Venue, UserProfile } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Link2, Copy, Check, ChevronDown, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
  events: Event[];
  venues: Venue[];
  user: UserProfile;
}

export default function PRLinkGenerator({ events, venues, user }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const activeEvents = events.filter(e => e.status === 'active' && e.registrationToken);

  const getPersonalLink = (event: Event) =>
    `${window.location.origin}/r/${event.registrationToken}?pr=${user.id}`;

  const handleCopy = async (link: string, eventId: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(eventId);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* fallback: select text */
    }
  };

  if (activeEvents.length === 0) return null;

  return (
    <div className="mt-8 border border-[#2a2a2a] bg-[#1a1a1a]">
      {/* Header toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Link2 size={14} className="text-[#D4622A]" />
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-white">Il mio link</p>
            <p className="text-[9px] font-sans text-[#555] mt-0.5">Condividi il tuo link personalizzato</p>
          </div>
        </div>
        <ChevronDown size={13} className={cn('text-[#555] transition-transform duration-200', open && 'rotate-180')} />
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
            <div className="px-5 pb-5 border-t border-[#222] space-y-4 pt-4">
              {activeEvents.map(event => {
                const venue = venues.find(v => v.id === event.venueId);
                const link = getPersonalLink(event);
                const isCopied = copied === event.id;

                return (
                  <div key={event.id} className="space-y-2">
                    <div>
                      <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-[#D4622A]">
                        {venue?.name ?? 'Venue'}
                      </p>
                      <p className="text-sm font-bold text-white uppercase" style={{ fontFamily: 'Helvetica Neue, Helvetica, Arial, sans-serif' }}>
                        {event.name}
                      </p>
                      <p className="text-[9px] font-mono text-[#555]">
                        {new Date(event.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#111] border border-[#2a2a2a] px-3 py-2 overflow-hidden">
                        <p className="text-[9px] font-mono text-[#666] truncate">{link}</p>
                      </div>
                      <motion.button
                        onClick={() => handleCopy(link, event.id)}
                        whileTap={{ scale: 0.93 }}
                        className={cn(
                          'p-2.5 border transition-colors shrink-0',
                          isCopied
                            ? 'border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10'
                            : 'border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#3a3a3a]'
                        )}
                      >
                        {isCopied ? <Check size={14} /> : <Copy size={14} />}
                      </motion.button>
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 border border-[#2a2a2a] text-[#666] hover:text-white hover:border-[#3a3a3a] transition-colors shrink-0"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>

                    <p className="text-[9px] font-sans text-[#444]">
                      Le registrazioni tramite questo link compariranno nelle tue prenotazioni
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
