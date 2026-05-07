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

const STATUS_COLORS = {
  confirmed: '#ef4444',
  blocked:   '#2a2a2a',
  free:      '#22c55e',
} as const;

export default function FloorPlanViewer({ event, floorPlan, reservations, currentUser, onReservationAdded }: FloorPlanViewerProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const canvasW = floorPlan.canvasWidth  ?? 800;
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

  const scale   = containerWidth > 0 ? containerWidth / canvasW : 1;
  const stageH  = canvasH * scale;

  const getStatus      = (id: string) => reservations.find(r => r.tableId === id && r.eventId === event.id)?.status ?? 'free';
  const getReservation = (id: string) => reservations.find(r => r.tableId === id && r.eventId === event.id);

  return (
    <div className="flex flex-col lg:flex-row h-full gap-5">
      {/* Canvas + legend wrapper */}
      <div className="flex-1 flex flex-col gap-0 min-w-0">
        <div ref={containerRef}
          className="flex-1 bg-[#080808] border border-[#1a1a1a] border-b-0 overflow-hidden relative floorplan-grid"
          style={{ minHeight: 400 }}>
          <Stage width={containerWidth} height={stageH} scaleX={scale} scaleY={scale}>
            <Layer>
              {/* Static areas */}
              {floorPlan.staticAreas?.map(area => (
                <Group key={area.id}>
                  <Rect x={area.x} y={area.y} width={area.width} height={area.height}
                    fill="#0d0d0d" stroke="#222" strokeWidth={1.5} cornerRadius={0} />
                  <Text x={area.x} y={area.y} width={area.width} height={area.height}
                    text={area.label} align="center" verticalAlign="middle"
                    fill="#F0E800" fontStyle="bold" fontSize={14} letterSpacing={3}
                    fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" />
                </Group>
              ))}

              {/* Tables */}
              {floorPlan.tables.map(table => {
                const status = getStatus(table.id);
                const color  = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.free;
                const sel    = selectedTable?.id === table.id;

                return (
                  <Group key={table.id} x={table.x} y={table.y}
                    onClick={() => setSelectedTable(table)}
                    onTap={() => setSelectedTable(table)}>
                    {table.shape === 'rect' ? (
                      <Rect width={table.width} height={table.height}
                        fill={color} opacity={sel ? 0.28 : 0.14}
                        stroke={color} strokeWidth={sel ? 2.5 : 1}
                        cornerRadius={0}
                        shadowBlur={sel ? 16 : 0} shadowColor={color} />
                    ) : (
                      <Circle radius={table.width / 2} x={table.width / 2} y={table.width / 2}
                        fill={color} opacity={sel ? 0.28 : 0.14}
                        stroke={color} strokeWidth={sel ? 2.5 : 1}
                        shadowBlur={sel ? 16 : 0} shadowColor={color} />
                    )}
                    <Text text={table.name}
                      width={table.width} height={table.height}
                      align="center" verticalAlign="middle"
                      fill="white" fontStyle="bold" fontSize={10}
                      fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif" />
                  </Group>
                );
              })}
            </Layer>
          </Stage>
        </div>

        {/* Legend — fuori dal canvas, sotto */}
        <div className="border border-[#1a1a1a] px-5 py-3 flex flex-wrap gap-x-6 gap-y-2 items-center bg-[#080808]">
          <span className="text-[8px] font-sans uppercase tracking-[0.4em] text-[#2a2a2a] border-r border-[#1a1a1a] pr-5 shrink-0">Tavoli</span>
          {Object.entries(STATUS_COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2 shrink-0">
              <span className="w-2 h-2 shrink-0" style={{ background: color }} />
              <span className="text-[8px] font-sans uppercase tracking-widest text-[#444] capitalize">{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <aside className="w-full lg:w-72 xl:w-80 flex flex-col shrink-0">
        <AnimatePresence mode="wait">
          {!selectedTable ? (
            <motion.div key="prompt"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 border border-dashed border-[#1a1a1a] flex flex-col items-center justify-center text-center p-8 min-h-[200px]">
              <Info size={24} className="text-[#1e1e1e] mb-4" />
              <p className="text-[9px] font-sans uppercase tracking-widest text-[#2a2a2a] leading-loose">
                Seleziona un tavolo<br />per i dettagli
              </p>
            </motion.div>
          ) : (
            <motion.div key={selectedTable.id}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="flex-1 bg-card border border-[#1a1a1a] flex flex-col overflow-hidden">

              {/* Panel header */}
              <div className="px-6 py-4 border-b border-[#111] flex items-center justify-between bg-[#080808]">
                <div>
                  <h3 className="hv font-black uppercase text-white text-lg">
                    Tavolo {selectedTable.name}
                  </h3>
                  <p className="text-[8px] font-sans uppercase tracking-widest text-[#2a2a2a] mt-0.5">
                    {selectedTable.area}
                  </p>
                </div>
                <button onClick={() => setSelectedTable(null)}
                  className="text-[#333] hover:text-white transition-colors p-1">
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Table info */}
                <div className="space-y-0">
                  <InfoRow label="Pax"        value={String(selectedTable.capacity)} />
                  <InfoRow label="Min. Spesa"  value={`€${selectedTable.minSpend}`} accent />
                  <InfoRow label="Stato"       value={getStatus(selectedTable.id)} accent />
                </div>

                {getReservation(selectedTable.id) ? (
                  <div className="space-y-5">
                    <div className="space-y-0">
                      <InfoRow label="Cliente"     value={getReservation(selectedTable.id)!.customerName} />
                      <InfoRow label="Contatto"    value={getReservation(selectedTable.id)!.customerPhone} mono />
                      <InfoRow label="PR"          value={getReservation(selectedTable.id)!.prName} accent />
                    </div>

                    {getReservation(selectedTable.id)!.bottles && (
                      <div className="border border-[#1a1a1a] p-4">
                        <p className="text-[8px] font-sans uppercase tracking-widest text-[#333] mb-2">Bottiglie</p>
                        <p className="font-mono text-[10px] text-white leading-relaxed">
                          {getReservation(selectedTable.id)!.bottles}
                        </p>
                      </div>
                    )}

                    {getReservation(selectedTable.id)!.notes && (
                      <div className="border-l-2 border-accent pl-4">
                        <p className="text-[8px] font-sans uppercase tracking-widest text-accent mb-1">Note</p>
                        <p className="text-xs font-sans text-[#555] italic leading-relaxed">
                          "{getReservation(selectedTable.id)!.notes}"
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <button className="flex-1 py-3 text-[8px] hv font-black uppercase tracking-widest border border-[#1a1a1a] text-[#333] hover:text-white hover:border-[#333] transition-all">
                        Modifica
                      </button>
                      <button className="flex-1 py-3 text-[8px] hv font-black uppercase tracking-widest border border-[#300] text-[#555] hover:border-red-900 hover:text-red-500 transition-all">
                        Libera
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="border-t border-[#111] pt-5 mb-4 text-center">
                      <span className="text-[8px] font-sans uppercase tracking-widest text-[#222]">Tavolo Libero</span>
                    </div>
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="group w-full py-4 border border-[#1a1a1a] text-[9px] hv font-black uppercase tracking-widest text-[#555] hover:border-accent hover:text-accent flex items-center justify-center gap-2 transition-all">
                      <Plus size={12} /> Nuova Prenotazione
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* Booking modal */}
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

/* ── InfoRow ─────────────────────────────────────────────── */
function InfoRow({ label, value, accent, mono }: { label: string; value: string; accent?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[#0d0d0d]">
      <span className="text-[8px] font-sans uppercase tracking-widest text-[#2a2a2a]">{label}</span>
      <span className={cn(
        'text-[11px] font-sans',
        accent ? 'hv font-black uppercase text-accent' : mono ? 'font-mono text-[#555]' : 'font-medium text-white'
      )}>{value}</span>
    </div>
  );
}

/* ── BookingModal ────────────────────────────────────────── */
function BookingModal({ table, onClose, onSubmit }: {
  table: Table;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [form, setForm] = useState({
    customerName: '',
    prName: '',
    guestsCount: table.capacity,
    bottles: '', budget: table.minSpend,
    notes: '',
  });

  const inp = "w-full bg-bg border border-[#1a1a1a] px-4 py-3 text-xs font-sans text-white placeholder-[#2a2a2a] outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg bg-card border border-[#1a1a1a] overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="h-[2px] bg-accent shrink-0" />

        <div className="px-8 py-5 border-b border-[#111] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">Prenotazione</h3>
            <p className="text-[8px] font-sans uppercase tracking-widest text-[#333] mt-0.5">Tavolo {table.name} · Min €{table.minSpend}</p>
          </div>
          <button onClick={onClose} className="text-[#333] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        <form className="p-8 space-y-5 overflow-y-auto"
          onSubmit={(e) => { e.preventDefault(); onSubmit({ ...form, status: 'confirmed' as const }); }}>
          <div className="grid grid-cols-2 gap-4">
            <BField label="Cliente">
              <input required className={cn(inp, 'uppercase tracking-widest')} placeholder="NOME COMPLETO"
                value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} />
            </BField>
            <BField label="PR">
              <input required className={cn(inp, 'uppercase tracking-widest')} placeholder="NOME PR"
                value={form.prName} onChange={e => setForm({ ...form, prName: e.target.value })} />
            </BField>
            <BField label="PAX">
              <input type="number" className={inp}
                value={form.guestsCount} onChange={e => setForm({ ...form, guestsCount: +e.target.value })} />
            </BField>
            <BField label="Budget €">
              <input type="number" className={cn(inp, 'text-accent')}
                value={form.budget} onChange={e => setForm({ ...form, budget: +e.target.value })} />
            </BField>
          </div>

          <BField label="Bottiglie">
            <input className={cn(inp, 'uppercase tracking-widest')} placeholder="2× CHAMPAGNE, 1× VODKA"
              value={form.bottles} onChange={e => setForm({ ...form, bottles: e.target.value.toUpperCase() })} />
          </BField>

          <BField label="Note">
            <textarea rows={2} className={cn(inp, 'resize-none italic')} placeholder="NOTE..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </BField>

          <button type="submit"
            className="w-full py-4 bg-accent text-black text-[10px] hv font-black uppercase tracking-[0.3em] hover:bg-white transition-colors">
            Conferma Prenotazione
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function BField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#2a2a2a]">{label}</label>
      {children}
    </div>
  );
}
