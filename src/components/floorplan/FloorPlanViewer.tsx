import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group } from 'react-konva';
import { FloorPlan, Event, Reservation, Table, UserProfile } from '../../types';
import { X, Info, Plus, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface FloorPlanViewerProps {
  event: Event;
  floorPlan: FloorPlan;
  reservations: Reservation[];
  currentUser: UserProfile;
  onReservationAdded: (res: Reservation) => void;
  onReservationUpdated: (res: Reservation) => void;
  onReservationRemoved: (id: string) => void;
  hostMode?: boolean;
}

const STATUS_COLORS = {
  confirmed: '#ef4444',
  pending:   '#f97316',
  blocked:   '#2a2a2a',
  free:      '#22c55e',
} as const;

const HOST_COLORS = {
  checkedIn:  '#22c55e',
  reserved:   '#D4622A',
  free:       '#2a2a2a',
} as const;

export default function FloorPlanViewer({
  event, floorPlan, reservations, currentUser,
  onReservationAdded, onReservationUpdated, onReservationRemoved,
  hostMode = false,
}: FloorPlanViewerProps) {
  const [selectedTable, setSelectedTable]       = useState<Table | null>(null);
  const [showBookingModal, setShowBookingModal]  = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
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

  const scale  = containerWidth > 0 ? containerWidth / canvasW : 1;
  const stageH = canvasH * scale;

  const getReservation = (id: string) => reservations.find(r => r.tableId === id && r.eventId === event.id);
  const getStatus      = (id: string) => {
    const res = getReservation(id);
    if (!res) return 'free';
    if (res.approvalStatus === 'pending') return 'pending';
    return res.status;
  };

  const canModify = (res: Reservation) =>
    currentUser.role === 'admin' || res.prId === currentUser.id;

  const openEdit = (res: Reservation) => {
    setEditingReservation(res);
    setShowBookingModal(true);
  };

  const handleFree = (res: Reservation) => {
    onReservationRemoved(res.id);
    setSelectedTable(null);
  };

  const closeBooking = () => {
    setShowBookingModal(false);
    setEditingReservation(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-0 lg:gap-5">
      {/* Canvas + legend wrapper */}
      <div className="flex-1 flex flex-col gap-0 min-w-0">
        <div ref={containerRef}
          className="flex-1 bg-[#080808] border border-[#2a2a2a] border-b-0 overflow-hidden relative floorplan-grid"
          style={{ minHeight: 400 }}>
          <Stage width={containerWidth} height={stageH} scaleX={scale} scaleY={scale}>
            <Layer>
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

              {floorPlan.tables.map(table => {
                const status = getStatus(table.id);
                const res    = getReservation(table.id);
                const color  = hostMode
                  ? (res?.checkedIn ? HOST_COLORS.checkedIn : res ? HOST_COLORS.reserved : HOST_COLORS.free)
                  : (STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.free);
                const sel    = selectedTable?.id === table.id;

                return (
                  <Group key={table.id} x={table.x} y={table.y}
                    onClick={() => {
                      setSelectedTable(table);
                      if (!hostMode && status === 'free') setShowBookingModal(true);
                    }}
                    onTap={() => {
                      setSelectedTable(table);
                      if (!hostMode && status === 'free') setShowBookingModal(true);
                    }}>
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

        <div className="border border-[#2a2a2a] px-5 py-3 flex items-center gap-6 bg-[#080808]">
          <span className="text-[8px] font-sans uppercase tracking-[0.4em] text-[#666] border-r border-[#2a2a2a] pr-5 shrink-0">Tavoli</span>
          {hostMode ? (
            <>
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 shrink-0 bg-[#22c55e]" />
                <span className="text-[8px] font-sans uppercase tracking-widest text-[#666]">Entrato</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 shrink-0 bg-[#D4622A]" />
                <span className="text-[8px] font-sans uppercase tracking-widest text-[#666]">Atteso</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 shrink-0 bg-[#2a2a2a]" />
                <span className="text-[8px] font-sans uppercase tracking-widest text-[#666]">Libero</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 shrink-0 bg-[#ef4444]" />
                <span className="text-[8px] font-sans uppercase tracking-widest text-[#666]">Confirmed</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 shrink-0 bg-[#f97316]" />
                <span className="text-[8px] font-sans uppercase tracking-widest text-[#666]">In attesa</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="w-2 h-2 shrink-0 bg-[#22c55e]" />
                <span className="text-[8px] font-sans uppercase tracking-widest text-[#666]">Free</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Side panel */}
      <aside className="hidden lg:flex lg:w-72 xl:w-80 flex-col shrink-0">
        <AnimatePresence mode="wait">
          {!selectedTable ? (
            <motion.div key="prompt"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 border border-dashed border-[#2a2a2a] flex flex-col items-center justify-center text-center p-8 min-h-[200px]">
              <Info size={24} className="text-[#1e1e1e] mb-4" />
              <p className="text-[9px] font-sans uppercase tracking-widest text-[#666] leading-loose">
                Seleziona un tavolo<br />per i dettagli
              </p>
            </motion.div>
          ) : (
            <motion.div key={selectedTable.id}
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              className="flex-1 bg-card border border-[#2a2a2a] flex flex-col overflow-hidden">

              <div className="px-6 py-4 border-b border-[#1e1e1e] flex items-center justify-between bg-[#080808]">
                <div>
                  <h3 className="hv font-black uppercase text-white text-lg">Tavolo {selectedTable.name}</h3>
                  <p className="text-[8px] font-sans uppercase tracking-widest text-[#666] mt-0.5">{selectedTable.area}</p>
                </div>
                <button onClick={() => setSelectedTable(null)} className="text-[#333] hover:text-white transition-colors p-1">
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-auto p-6 space-y-6">
                <div className="space-y-0">
                  <InfoRow label="Pax"       value={String(selectedTable.capacity)} />
                  <InfoRow label="Min. Spesa" value={`€${selectedTable.minSpend}`} accent />
                  <InfoRow label="Stato"      value={getStatus(selectedTable.id)} accent />
                </div>

                {(() => {
                  const res = getReservation(selectedTable.id);
                  if (!res) return null;
                  const allowed = canModify(res);
                  return (
                    <div className="space-y-5">
                      <div className="space-y-0">
                        <InfoRow label="Cliente" value={res.customerName} />
                        <InfoRow label="PR"      value={res.prName} accent />
                        <InfoRow label="Pax previsti" value={String(res.guestsCount)} />
                        {hostMode ? (
                          <>
                            <InfoRow label="Pax entrati" value={res.checkedIn ? String(res.actualPeople ?? res.guestsCount) : '—'} accent />
                            <InfoRow label="Incasso"     value={`€${res.actualBudget ?? res.budget}`} accent />
                            <InfoRow label="Stato"       value={res.checkedIn ? 'Entrato ✓' : 'In attesa'} accent />
                          </>
                        ) : (
                          <InfoRow label="Budget" value={`€${res.budget}`} accent />
                        )}
                      </div>

                      {res.bottles && (
                        <div className="border border-[#2a2a2a] p-4">
                          <p className="text-[8px] font-sans uppercase tracking-widest text-[#333] mb-2">Bottiglie</p>
                          <p className="font-mono text-[10px] text-white leading-relaxed">{res.bottles}</p>
                        </div>
                      )}

                      {res.notes && (
                        <div className="border-l-2 border-accent pl-4">
                          <p className="text-[8px] font-sans uppercase tracking-widest text-accent mb-1">Note</p>
                          <p className="text-xs font-sans text-[#555] italic leading-relaxed">"{res.notes}"</p>
                        </div>
                      )}

                      {!hostMode && (allowed ? (
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => openEdit(res)}
                            className="flex-1 py-3 text-[8px] hv font-black uppercase tracking-widest border border-[#2a2a2a] text-[#333] hover:text-white hover:border-[#333] transition-all">
                            Modifica
                          </button>
                          <button
                            onClick={() => handleFree(res)}
                            className="flex-1 py-3 text-[8px] hv font-black uppercase tracking-widest border border-[#300] text-[#555] hover:border-red-900 hover:text-red-500 transition-all">
                            Libera
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 pt-2 px-1">
                          <Lock size={11} className="text-[#333] shrink-0" />
                          <p className="text-[8px] font-sans uppercase tracking-widest text-[#333] leading-relaxed">
                            Prenotazione di un altro PR
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* Mobile bottom sheet — table info panel */}
      <AnimatePresence>
        {selectedTable && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 z-40 bg-black/60"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedTable(null)}
            />
            <motion.div
              className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-[#0c0c0c] border-t border-[#2a2a2a] rounded-t-2xl overflow-hidden max-h-[70vh] flex flex-col"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              <div className="w-10 h-1 bg-[#2a2a2a] rounded-full mx-auto mt-3 shrink-0" />
              <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between shrink-0">
                <div>
                  <h3 className="hv font-black uppercase text-white text-base">Tavolo {selectedTable.name}</h3>
                  <p className="text-[8px] font-sans uppercase tracking-widest text-[#666] mt-0.5">{selectedTable.area}</p>
                </div>
                <button onClick={() => setSelectedTable(null)} className="text-[#333] hover:text-white transition-colors p-1">
                  <X size={15} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="space-y-0">
                  <InfoRow label="Pax"        value={String(selectedTable.capacity)} />
                  <InfoRow label="Min. Spesa" value={`€${selectedTable.minSpend}`} accent />
                  <InfoRow label="Stato"      value={getStatus(selectedTable.id)} accent />
                </div>
                {(() => {
                  const res = getReservation(selectedTable.id);
                  if (!res) return null;
                  const allowed = canModify(res);
                  return (
                    <div className="space-y-4">
                      <div className="space-y-0">
                        <InfoRow label="Cliente" value={res.customerName} />
                        <InfoRow label="PR"      value={res.prName} accent />
                        <InfoRow label="Pax previsti" value={String(res.guestsCount)} />
                        {hostMode ? (
                          <>
                            <InfoRow label="Pax entrati" value={res.checkedIn ? String(res.actualPeople ?? res.guestsCount) : '—'} accent />
                            <InfoRow label="Incasso"     value={`€${res.actualBudget ?? res.budget}`} accent />
                            <InfoRow label="Stato"       value={res.checkedIn ? 'Entrato ✓' : 'In attesa'} accent />
                          </>
                        ) : (
                          <InfoRow label="Budget"  value={`€${res.budget}`} accent />
                        )}
                      </div>
                      {res.bottles && (
                        <div className="border border-[#2a2a2a] p-3">
                          <p className="text-[8px] font-sans uppercase tracking-widest text-[#333] mb-1.5">Bottiglie</p>
                          <p className="font-mono text-[10px] text-white">{res.bottles}</p>
                        </div>
                      )}
                      {!hostMode && (allowed ? (
                        <div className="flex gap-2 pb-2">
                          <button onClick={() => { openEdit(res); }}
                            className="flex-1 py-3 text-[8px] hv font-black uppercase tracking-widest border border-[#2a2a2a] text-[#333] hover:text-white hover:border-[#333] transition-all">
                            Modifica
                          </button>
                          <button onClick={() => handleFree(res)}
                            className="flex-1 py-3 text-[8px] hv font-black uppercase tracking-widest border border-[#300] text-[#555] hover:border-red-900 hover:text-red-500 transition-all">
                            Libera
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-1 pb-2">
                          <Lock size={11} className="text-[#333] shrink-0" />
                          <p className="text-[8px] font-sans uppercase tracking-widest text-[#333]">Prenotazione di un altro PR</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showBookingModal && selectedTable && (
        <BookingModal
          table={selectedTable}
          initialReservation={editingReservation ?? undefined}
          defaultPrName={`${currentUser.displayName}${currentUser.lastName ? ' ' + currentUser.lastName : ''}`}
          onClose={closeBooking}
          onSubmit={(data) => {
            if (editingReservation) {
              onReservationUpdated({ ...editingReservation, ...data });
            } else {
              onReservationAdded({
                id: Math.random().toString(36).substr(2, 9),
                eventId: event.id,
                tableId: selectedTable.id,
                tableName: selectedTable.name,
                prId: currentUser.id,
                ...data,
                createdAt: new Date().toISOString(),
              });
            }
            closeBooking();
          }}
        />
      )}
    </div>
  );
}

/* ── InfoRow ─────────────────────────────────────────────── */
function InfoRow({ label, value, accent, mono }: { label: string; value?: string; accent?: boolean; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[#1a1a1a]">
      <span className="text-[8px] font-sans uppercase tracking-widest text-[#666]">{label}</span>
      <span className={cn(
        'text-[11px] font-sans',
        accent ? 'hv font-black uppercase text-accent' : mono ? 'font-mono text-[#555]' : 'font-medium text-white'
      )}>{value}</span>
    </div>
  );
}

/* ── BookingModal ────────────────────────────────────────── */
type BottleItem = { qty: number; name: string };

function parseBottles(str: string): BottleItem[] {
  if (!str) return [];
  return str.split(',').map(p => {
    const m = p.trim().match(/^(\d+)x (.+)$/i);
    return m ? { qty: parseInt(m[1]), name: m[2] } : { qty: 1, name: p.trim() };
  }).filter(b => b.name);
}

function serializeBottles(items: BottleItem[]): string {
  return items.filter(b => b.name.trim()).map(b => `${b.qty}x ${b.name.toUpperCase()}`).join(', ');
}

function BookingModal({ table, initialReservation, defaultPrName, onClose, onSubmit }: {
  table: Table;
  initialReservation?: Reservation;
  defaultPrName?: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const isEdit = !!initialReservation;

  const calcBudget = (guests: number) =>
    table.minSpend + Math.max(0, (guests - 10) * 30);

  const [form, setForm] = useState({
    customerName: initialReservation?.customerName ?? '',
    prName:       initialReservation?.prName       ?? defaultPrName ?? '',
    guestsCount:  initialReservation?.guestsCount  ?? table.capacity,
    budget:       initialReservation?.budget       ?? calcBudget(table.capacity),
    notes:        initialReservation?.notes        ?? '',
  });

  const [bottleItems, setBottleItems] = useState<BottleItem[]>(
    () => parseBottles(initialReservation?.bottles ?? '')
  );

  const addBottle   = () => setBottleItems(prev => [...prev, { qty: 1, name: '' }]);
  const removeBottle = (i: number) => setBottleItems(prev => prev.filter((_, idx) => idx !== i));
  const updateBottle = (i: number, patch: Partial<BottleItem>) =>
    setBottleItems(prev => prev.map((b, idx) => idx === i ? { ...b, ...patch } : b));

  const inp = "w-full bg-bg border border-[#2a2a2a] px-4 py-3 text-xs font-sans text-white placeholder-[#444] outline-none transition-colors";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg bg-card border border-[#2a2a2a] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="h-[2px] bg-accent shrink-0" />

        <div className="px-8 py-5 border-b border-[#1e1e1e] flex items-center justify-between shrink-0">
          <div>
            <h3 className="hv font-black text-xl uppercase text-white">
              {isEdit ? 'Modifica Prenotazione' : 'Prenotazione'}
            </h3>
            <p className="text-[8px] font-sans uppercase tracking-widest text-[#777] mt-0.5">
              Tavolo {table.name} · Min €{table.minSpend}
            </p>
          </div>
          <button onClick={onClose} className="text-[#777] hover:text-white transition-colors p-1"><X size={18} /></button>
        </div>

        <form className="p-8 space-y-5 overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ ...form, bottles: serializeBottles(bottleItems), status: 'confirmed' as const });
          }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BField label="Cliente">
              <input required className={cn(inp, 'uppercase tracking-widest')} placeholder="NOME COMPLETO"
                value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} />
            </BField>
            <BField label="PR">
              <input readOnly className={cn(inp, 'uppercase tracking-widest cursor-default select-none text-[#777] bg-[#0a0a0a] border-[#1a1a1a]')}
                value={form.prName} onChange={() => {}} />
            </BField>
            <BField label="PAX">
              <input type="number" min={1} className={inp}
                value={form.guestsCount} onChange={e => {
                  const guests = +e.target.value;
                  setForm({ ...form, guestsCount: guests, budget: calcBudget(guests) });
                }} />
            </BField>
            <BField label="Budget €">
              <div className={cn(inp, 'text-accent hv font-black select-none cursor-default')}>
                €{form.budget}
              </div>
            </BField>
          </div>

          <BField label="Bottiglie">
            <div className="space-y-2">
              {bottleItems.map((bottle, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select
                    value={bottle.qty}
                    onChange={e => updateBottle(i, { qty: +e.target.value })}
                    className="bg-bg border border-[#2a2a2a] px-3 py-3 text-xs font-sans text-white outline-none transition-colors w-20 shrink-0 [color-scheme:dark]">
                    {Array.from({ length: 10 }, (_, n) => n + 1).map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <input
                    className={cn(inp, 'uppercase tracking-widest')}
                    placeholder="NOME BOTTIGLIA"
                    value={bottle.name}
                    onChange={e => updateBottle(i, { name: e.target.value.toUpperCase() })}
                  />
                  <button type="button" onClick={() => removeBottle(i)}
                    className="text-[#555] hover:text-red-500 transition-colors p-1 shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addBottle}
                className="flex items-center gap-2 w-full py-2.5 border border-dashed border-[#2a2a2a] text-[#555] hover:border-accent/50 hover:text-accent transition-colors text-[9px] hv font-black uppercase tracking-widest justify-center mt-1">
                <Plus size={11} /> Aggiungi Bottiglia
              </button>
            </div>
          </BField>

          <BField label="Note">
            <textarea rows={2} className={cn(inp, 'resize-none italic')} placeholder="NOTE..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </BField>

          <button type="submit"
            className="w-full py-4 bg-accent text-black text-[10px] hv font-black uppercase tracking-[0.3em] hover:bg-white transition-colors">
            {isEdit ? 'Salva Modifiche' : 'Conferma Prenotazione'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function BField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[8px] font-sans font-bold uppercase tracking-widest text-[#666]">{label}</label>
      {children}
    </div>
  );
}
