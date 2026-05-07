import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group } from 'react-konva';
import { FloorPlan, Event, Reservation, Table, UserProfile } from '../../types';
import { X, Info, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface FloorPlanViewerProps {
  event: Event;
  floorPlan: FloorPlan;
  reservations: Reservation[];
  currentUser: UserProfile;
  onReservationAdded: (res: Reservation) => void;
}

export default function FloorPlanViewer({ event, floorPlan, reservations, currentUser, onReservationAdded }: FloorPlanViewerProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const canvasW = floorPlan.canvasWidth ?? 800;
  const canvasH = floorPlan.canvasHeight ?? 600;

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const scale = containerWidth > 0 ? containerWidth / canvasW : 1;
  const stageH = canvasH * scale;

  const getTableStatus = (tableId: string) => {
    const res = reservations.find(r => r.tableId === tableId && r.eventId === event.id);
    return res ? res.status : 'free';
  };

  const getReservation = (tableId: string) =>
    reservations.find(r => r.tableId === tableId && r.eventId === event.id);

  const getTableColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#ef4444';
      case 'optioned':  return '#eab308';
      case 'blocked':   return '#71717a';
      default:          return '#22c55e';
    }
  };

  return (
    <div className="flex flex-col h-full gap-8 lg:flex-row">
      <div
        ref={containerRef}
        className="flex-1 bg-zinc-900/30 rounded-2xl border border-border overflow-hidden relative floorplan-grid"
        style={{ minHeight: '500px' }}
      >
        <Stage width={containerWidth} height={stageH} scaleX={scale} scaleY={scale}>
          <Layer>
            {/* Static areas: BAR, CONSOLE, etc. */}
            {floorPlan.staticAreas?.map(area => (
              <Group key={area.id}>
                <Rect
                  x={area.x}
                  y={area.y}
                  width={area.width}
                  height={area.height}
                  fill="#18181b"
                  stroke="#3f3f46"
                  strokeWidth={2}
                  cornerRadius={4}
                />
                <Text
                  x={area.x}
                  y={area.y}
                  width={area.width}
                  height={area.height}
                  text={area.label}
                  align="center"
                  verticalAlign="middle"
                  fill="#d4af37"
                  fontStyle="bold"
                  fontSize={16}
                  letterSpacing={4}
                />
              </Group>
            ))}

            {/* Tables */}
            {floorPlan.tables.map(table => {
              const status = getTableStatus(table.id);
              const color = getTableColor(status);
              const isSelected = selectedTable?.id === table.id;

              return (
                <Group
                  key={table.id}
                  x={table.x}
                  y={table.y}
                  onClick={() => setSelectedTable(table)}
                  onTap={() => setSelectedTable(table)}
                >
                  {table.shape === 'rect' ? (
                    <Rect
                      width={table.width}
                      height={table.height}
                      fill={color}
                      opacity={0.18}
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 1.5}
                      cornerRadius={3}
                      shadowBlur={isSelected ? 14 : 0}
                      shadowColor={color}
                    />
                  ) : (
                    <Circle
                      radius={table.width / 2}
                      x={table.width / 2}
                      y={table.width / 2}
                      fill={color}
                      opacity={0.18}
                      stroke={color}
                      strokeWidth={isSelected ? 3 : 1.5}
                      shadowBlur={isSelected ? 14 : 0}
                      shadowColor={color}
                    />
                  )}
                  <Text
                    text={table.name}
                    width={table.width}
                    height={table.height}
                    align="center"
                    verticalAlign="middle"
                    fill="white"
                    fontStyle="bold"
                    fontSize={11}
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 p-4 bg-card/50 backdrop-blur-2xl rounded border border-white/5 flex gap-6 items-center">
          <div className="text-[8px] uppercase tracking-[0.4em] text-zinc-500 font-black border-r border-white/10 pr-4 mr-1">Disponibilità</div>
          <LegendItem color="#22c55e" label="Libero" />
          <LegendItem color="#eab308" label="Opzionato" />
          <LegendItem color="#ef4444" label="Occupato" />
          <LegendItem color="#3f3f46" label="Bloccato" />
        </div>
      </div>

      {/* Side panel */}
      <aside className="w-full lg:w-80 flex flex-col gap-6">
        <AnimatePresence mode="wait">
          {!selectedTable ? (
            <motion.div
              key="prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center text-zinc-700 h-full bg-card/50"
            >
              <Info className="mb-4 opacity-20" size={32} />
              <p className="text-[10px] uppercase tracking-widest leading-loose font-bold">Seleziona un tavolo<br />per i dettagli</p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedTable.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-card border border-border rounded-xl overflow-hidden flex flex-col h-full"
            >
              <div className="p-6 flex justify-between items-center bg-[#0c0c0d]">
                <h2 className="serif text-xl italic">Tavolo {selectedTable.name}</h2>
                <button onClick={() => setSelectedTable(null)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6">
                <div className="space-y-4">
                  <Row label="Area"      value={selectedTable.area} />
                  <Row label="Pax"       value={String(selectedTable.capacity)} />
                  <Row label="Min. Spesa" value={`€${selectedTable.minSpend}`} accent />
                </div>

                {getReservation(selectedTable.id) ? (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Row label="Cliente"     value={getReservation(selectedTable.id)!.customerName} />
                      <Row label="Referente PR" value={getReservation(selectedTable.id)!.prName} accent />
                      <Row label="Stato"        value={getReservation(selectedTable.id)!.status} accent />
                    </div>

                    <div className="p-4 rounded bg-zinc-900 border border-zinc-800">
                      <h4 className="text-[9px] uppercase tracking-widest text-zinc-500 mb-2">Bottiglie</h4>
                      <p className="text-xs text-zinc-300 font-mono">
                        {getReservation(selectedTable.id)!.bottles || 'Nessun pre-ordine'}
                      </p>
                    </div>

                    {getReservation(selectedTable.id)!.notes && (
                      <div className="p-4 rounded bg-accent/5 border border-accent/20">
                        <h4 className="text-[9px] uppercase tracking-widest text-accent mb-2">Note</h4>
                        <p className="text-xs text-zinc-400 italic">"{getReservation(selectedTable.id)!.notes}"</p>
                      </div>
                    )}

                    <div className="pt-4 flex gap-3">
                      <button className="flex-1 py-3 bg-zinc-800 text-[9px] uppercase tracking-[0.2em] font-black hover:bg-zinc-700 transition-colors">Modifica</button>
                      <button className="flex-1 py-3 bg-red-900/40 text-red-400 border border-red-900/50 text-[9px] uppercase tracking-[0.2em] font-black hover:bg-red-900/60 transition-colors">Libera</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4">
                    <p className="text-zinc-500 text-[10px] uppercase tracking-widest text-center leading-loose border-t border-border pt-6">Tavolo Libero</p>
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="w-full py-4 bg-transparent border border-accent text-accent rounded font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-accent hover:text-black transition-all"
                    >
                      <Plus size={14} /> Nuova Prenotazione
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {showBookingModal && selectedTable && (
        <BookingModal
          table={selectedTable}
          onClose={() => setShowBookingModal(false)}
          onSubmit={(data) => {
            onReservationAdded({
              id: Math.random().toString(36).substr(2, 9),
              eventId: event.id,
              tableId: selectedTable.id,
              prId: currentUser.id,
              prName: currentUser.displayName,
              ...data,
              createdAt: new Date().toISOString(),
            });
            setShowBookingModal(false);
          }}
        />
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
      <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{label}</span>
      <span className={cn('text-sm font-semibold', accent ? 'text-accent uppercase tracking-widest serif' : '')}>{value}</span>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">{label}</span>
    </div>
  );
}

function BookingModal({ table, onClose, onSubmit }: { table: Table; onClose: () => void; onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    guestsCount: table.capacity,
    bottles: '',
    budget: table.minSpend,
    notes: '',
    status: 'optioned' as any,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-xl bg-card border border-border rounded shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-border flex items-center justify-between bg-[#0c0c0d]">
          <div>
            <h3 className="serif text-2xl italic text-white">Prenotazione Tavolo</h3>
            <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Slot: {table.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded text-zinc-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form className="p-8 space-y-6" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Anagrafica Cliente</label>
              <input required className="w-full bg-bg border border-border rounded px-4 py-3 outline-none focus:border-accent/40 transition-colors text-xs uppercase tracking-widest" placeholder="NOME COMPLETO" value={formData.customerName} onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Contatto</label>
              <input required className="w-full bg-bg border border-border rounded px-4 py-3 outline-none focus:border-accent/40 transition-colors text-xs font-mono" placeholder="+39 ---" value={formData.customerPhone} onChange={e => setFormData({ ...formData, customerPhone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">PAX</label>
              <input type="number" className="w-full bg-bg border border-border rounded px-4 py-3 outline-none focus:border-accent/40 transition-colors text-xs" value={formData.guestsCount} onChange={e => setFormData({ ...formData, guestsCount: parseInt(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Budget (€)</label>
              <input type="number" className="w-full bg-bg border border-border rounded px-4 py-3 outline-none focus:border-accent/40 transition-colors text-xs text-accent" value={formData.budget} onChange={e => setFormData({ ...formData, budget: parseInt(e.target.value) })} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Pre-ordine Bottiglie</label>
            <input className="w-full bg-bg border border-border rounded px-4 py-3 outline-none focus:border-accent/40 transition-colors text-xs uppercase tracking-widest" placeholder="es. 2x CHAMPAGNE, 1x VODKA" value={formData.bottles} onChange={e => setFormData({ ...formData, bottles: e.target.value.toUpperCase() })} />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Note Extra</label>
            <textarea rows={2} className="w-full bg-bg border border-border rounded px-4 py-3 outline-none focus:border-accent/40 transition-colors text-xs uppercase tracking-widest resize-none italic" placeholder="NOTE..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
          </div>

          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => setFormData({ ...formData, status: 'optioned' })} className={cn('flex-1 py-4 font-black text-[9px] uppercase tracking-[0.2em] transition-all border', formData.status === 'optioned' ? 'bg-amber-500/20 text-amber-500 border-amber-500/50' : 'bg-transparent text-zinc-700 border-border')}>Opziona</button>
            <button type="button" onClick={() => setFormData({ ...formData, status: 'confirmed' })} className={cn('flex-1 py-4 font-black text-[9px] uppercase tracking-[0.2em] transition-all border', formData.status === 'confirmed' ? 'bg-accent text-black border-accent' : 'bg-transparent text-zinc-700 border-border')}>Conferma</button>
          </div>

          <button type="submit" className="w-full py-5 bg-accent text-black font-black text-xs uppercase tracking-[0.3em] hover:opacity-90 transition-all">
            Invia al Sistema
          </button>
        </form>
      </motion.div>
    </div>
  );
}
