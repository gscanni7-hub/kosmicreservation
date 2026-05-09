import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Transformer } from 'react-konva';
import { FloorPlan, Table } from '../../types';
import {
  X, Save, Square, Circle as CircleIcon, Trash2, Move,
  Sparkles, Loader2, AlertCircle, CheckCircle2, Minus, Plus,
} from 'lucide-react';

/* ── Constants ───────────────────────────────────────────── */
const LETTERS = ['A', 'B', 'C', 'D', 'T', 'P'] as const;
type TableLetter = typeof LETTERS[number];

const SHAPE_STYLE: Record<string, { fill: string; stroke: string; label: string }> = {
  rect:     { fill: '#1c1c1e', stroke: '#D4622A', label: '#fff' },
  circle:   { fill: '#1c1c1e', stroke: '#D4622A', label: '#fff' },
  bar:      { fill: '#071828', stroke: '#3b9edd', label: '#3b9edd' },
  consolle: { fill: '#120820', stroke: '#9b5ef5', label: '#9b5ef5' },
};

/* ── Props ───────────────────────────────────────────────── */
interface FloorPlanEditorProps {
  floorPlan: FloorPlan;
  onSave?: (fp: FloorPlan) => void;
  onClose?: () => void;
}

/* ── AI analysis ─────────────────────────────────────────── */
async function analyzeFloorPlan(
  base64: string,
  mediaType: string,
  paperW: number,
  paperH: number,
): Promise<Table[]> {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Chiave VITE_ANTHROPIC_API_KEY non configurata nel file .env');

  const isImage = mediaType.startsWith('image/');

  const content: any[] = [
    isImage
      ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } }
      : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
    {
      type: 'text',
      text: `Analizza questa pianta di un locale notturno / venue. Identifica tutti i tavoli, le sedute, il bar, il bancone del DJ (consolle) e altri elementi fissi visibili.

Rispondi SOLO con un array JSON, niente altro:
[
  {
    "name": "T1",
    "letter": "T",
    "shape": "rect" | "circle" | "bar" | "consolle",
    "isFixture": false,
    "xPct": <centro-x come percentuale 0-100 della larghezza immagine>,
    "yPct": <centro-y come percentuale 0-100 dell'altezza immagine>,
    "wPct": <larghezza come percentuale 0-100 della larghezza immagine>,
    "hPct": <altezza come percentuale 0-100 dell'altezza immagine>,
    "capacity": 4,
    "minSpend": 200
  }
]

Regole:
- Bar fisico → shape "bar", isFixture true, name "BAR"
- Consolle/DJ booth → shape "consolle", isFixture true, name "CONSOLLE"
- Tavoli rotondi → shape "circle"
- Tavoli rettangolari → shape "rect"
- Numera tavoli automaticamente: A1,A2… o T1,T2… basandoti sulla lettera visibile
- Se non c'è lettera usa T1,T2,T3…
- Restituisci SOLO l'array JSON.`,
    },
  ];

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Errore API: ${err?.error?.message ?? res.status}`);
  }

  const data = await res.json();
  const text: string = data.content[0]?.text ?? '';
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Risposta AI non valida');

  const raw: any[] = JSON.parse(match[0]);
  return raw.map((t, i) => ({
    id: `ai_${Date.now()}_${i}`,
    name:     t.name ?? `T${i + 1}`,
    letter:   t.letter ?? 'T',
    shape:    t.shape ?? 'rect',
    isFixture: !!t.isFixture,
    x: Math.max(0, ((t.xPct ?? 50) / 100) * paperW - ((t.wPct ?? 8) / 100) * paperW / 2),
    y: Math.max(0, ((t.yPct ?? 50) / 100) * paperH - ((t.hPct ?? 8) / 100) * paperH / 2),
    width:  Math.max(30, ((t.wPct ?? 8) / 100) * paperW),
    height: Math.max(30, ((t.hPct ?? 8) / 100) * paperH),
    area:     'Main',
    capacity: t.capacity ?? 4,
    minSpend: t.minSpend ?? 200,
  }));
}

/* ── Component ───────────────────────────────────────────── */
export default function FloorPlanEditor({ floorPlan, onSave, onClose }: FloorPlanEditorProps) {
  const [tables,    setTables]    = useState<Table[]>(floorPlan.tables);
  const [fpName,    setFpName]    = useState(floorPlan.name);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<TableLetter>('T');
  const [paperW, setPaperW] = useState(floorPlan.canvasWidth  ?? 1200);
  const [paperH, setPaperH] = useState(floorPlan.canvasHeight ?? 900);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiMsg, setAiMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* keyboard delete */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (!selectedId) return;
      setTables(prev => prev.filter(t => t.id !== selectedId));
      setSelectedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  /* helpers */
  const getNextNum = (letter: string) =>
    tables.filter(t => t.letter === letter).length + 1;

  const addTable = (shape: 'rect' | 'circle') => {
    const num = getNextNum(selectedLetter);
    const t: Table = {
      id: `t_${Date.now()}`,
      name: `${selectedLetter}${num}`,
      letter: selectedLetter,
      x: 80 + Math.random() * 100,
      y: 80 + Math.random() * 100,
      width: shape === 'rect' ? 80 : 70,
      height: shape === 'rect' ? 70 : 70,
      shape, area: 'Main', capacity: 4, minSpend: 200,
    };
    setTables(prev => [...prev, t]);
    setSelectedId(t.id);
  };

  const addFixture = (shape: 'bar' | 'consolle') => {
    const f: Table = {
      id: `fx_${Date.now()}`,
      name: shape === 'bar' ? 'BAR' : 'CONSOLLE',
      x: 120, y: 120,
      width: shape === 'bar' ? 220 : 110,
      height: shape === 'bar' ? 55 : 75,
      shape, area: 'Fixed', capacity: 0, minSpend: 0, isFixture: true,
    };
    setTables(prev => [...prev, f]);
    setSelectedId(f.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setTables(prev => prev.filter(t => t.id !== selectedId));
    setSelectedId(null);
  };

  const updateTable = (id: string, patch: Partial<Table>) =>
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const changeLetter = (letter: TableLetter) => {
    if (!selectedId) return;
    const num = tables.filter(t => t.letter === letter && t.id !== selectedId).length + 1;
    updateTable(selectedId, { letter, name: `${letter}${num}` });
  };

  const handleDragEnd = (id: string, e: any) =>
    setTables(prev => prev.map(t => t.id === id ? { ...t, x: e.target.x(), y: e.target.y() } : t));

  const handleTransformEnd = (id: string, e: any) => {
    const node = e.target;
    const box = node.getClientRect({ relativeTo: node.getParent() });
    node.scaleX(1); node.scaleY(1);
    node.x(box.x);  node.y(box.y);
    setTables(prev => prev.map(t => t.id === id ? {
      ...t, x: box.x, y: box.y,
      width: Math.max(24, box.width),
      height: Math.max(24, box.height),
    } : t));
  };

  /* AI upload */
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setAiMsg(null);
    setAnalyzing(true);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = ev => {
          const result = ev.target?.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const newTables = await analyzeFloorPlan(base64, file.type, paperW, paperH);
      setTables(newTables);
      setSelectedId(null);
      setAiMsg({ type: 'ok', text: `${newTables.length} elementi ricreati dalla pianta` });
    } catch (err: any) {
      setAiMsg({ type: 'err', text: err.message ?? 'Errore durante l\'analisi' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = () => onSave?.({
    ...floorPlan,
    id: floorPlan.id || `fp_${Date.now()}`,
    name: fpName || 'Nuova Pianta',
    tables,
    canvasWidth: paperW,
    canvasHeight: paperH,
  });

  const selectedTable = tables.find(t => t.id === selectedId);

  /* ── Render ── */
  return (
    <div className="fixed inset-0 z-[200] bg-[#080808] flex flex-col select-none">

      {/* ── Toolbar ── */}
      <div className="h-[52px] bg-[#0f0f0f] border-b border-[#1e1e1e] flex items-center px-3 gap-1.5 shrink-0">

        {/* Close */}
        <button onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors mr-1">
          <X size={15} />
        </button>
        <div className="w-px h-5 bg-[#1e1e1e] mx-1" />

        {/* Name */}
        <input
          className="w-44 bg-transparent border border-[#1e1e1e] px-3 py-1.5 text-[10px] hv font-black uppercase tracking-widest text-white placeholder-[#333] outline-none focus:border-[#333] transition-colors"
          placeholder="NOME PIANTA"
          value={fpName}
          onChange={e => setFpName(e.target.value)}
        />
        <div className="w-px h-5 bg-[#1e1e1e] mx-1" />

        {/* Letter selector */}
        <div className="flex items-center gap-0.5 bg-[#0a0a0a] border border-[#1e1e1e] px-1.5 py-1">
          {LETTERS.map(l => (
            <button key={l} onClick={() => setSelectedLetter(l)}
              title={`Lettera ${l}`}
              className={`w-6 h-6 text-[9px] hv font-black transition-colors ${selectedLetter === l ? 'bg-accent text-black' : 'text-[#555] hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Shapes */}
        <button onClick={() => addTable('rect')} title="Aggiungi tavolo quadrato"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0a0a0a] border border-[#1e1e1e] text-[9px] hv font-black text-[#888] hover:text-white hover:border-[#333] transition-all">
          <Square size={11} /> Quadrato
        </button>
        <button onClick={() => addTable('circle')} title="Aggiungi tavolo rotondo"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#0a0a0a] border border-[#1e1e1e] text-[9px] hv font-black text-[#888] hover:text-white hover:border-[#333] transition-all">
          <CircleIcon size={11} /> Rotondo
        </button>
        <div className="w-px h-5 bg-[#1e1e1e] mx-1" />

        {/* Fixtures */}
        <button onClick={() => addFixture('bar')} title="Aggiungi bancone bar"
          className="px-2.5 py-1.5 bg-[#071828] border border-[#3b9edd]/30 text-[9px] hv font-black text-[#3b9edd] hover:border-[#3b9edd] transition-all">
          Bar
        </button>
        <button onClick={() => addFixture('consolle')} title="Aggiungi consolle DJ"
          className="px-2.5 py-1.5 bg-[#120820] border border-[#9b5ef5]/30 text-[9px] hv font-black text-[#9b5ef5] hover:border-[#9b5ef5] transition-all">
          Consolle
        </button>
        <div className="w-px h-5 bg-[#1e1e1e] mx-1" />

        {/* Canvas size */}
        <div className="flex items-center gap-1 text-[9px] font-sans text-[#555]">
          <span className="uppercase tracking-widest">W</span>
          <input type="number" min={400} max={4000} step={50} value={paperW}
            onChange={e => setPaperW(Math.max(400, Math.min(4000, Number(e.target.value))))}
            className="w-16 bg-[#0a0a0a] border border-[#1e1e1e] px-2 py-1 text-[10px] font-sans text-white outline-none focus:border-[#333] text-center" />
          <span>×</span>
          <span className="uppercase tracking-widest">H</span>
          <input type="number" min={300} max={3000} step={50} value={paperH}
            onChange={e => setPaperH(Math.max(300, Math.min(3000, Number(e.target.value))))}
            className="w-16 bg-[#0a0a0a] border border-[#1e1e1e] px-2 py-1 text-[10px] font-sans text-white outline-none focus:border-[#333] text-center" />
        </div>

        <div className="flex-1" />

        {/* AI message */}
        {aiMsg && (
          <div className={`flex items-center gap-1.5 text-[9px] font-sans uppercase tracking-widest mr-2 ${aiMsg.type === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>
            {aiMsg.type === 'ok' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
            {aiMsg.text}
          </div>
        )}

        {/* AI analyze */}
        <button onClick={() => { setAiMsg(null); fileRef.current?.click(); }}
          disabled={analyzing}
          title="Carica una pianta PNG/JPG/PDF e ricreala con AI"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0a0a] border border-[#2a2a2a] text-[9px] hv font-black text-[#888] hover:border-accent/40 hover:text-accent transition-all disabled:opacity-50">
          {analyzing ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
          {analyzing ? 'Analisi...' : 'Analizza Pianta'}
        </button>

        {/* Save */}
        <button onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-black text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-all ml-1">
          <Save size={11} /> Salva
        </button>
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex min-h-0 relative">

        {/* Scrollable canvas area */}
        <div
          className="flex-1 overflow-auto"
          style={{ background: '#050505' }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedId(null); }}
        >
          {/* Paper wrapper — centers when paper < viewport, scrolls when larger */}
          <div style={{ minWidth: paperW + 80, minHeight: paperH + 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
            <div style={{
              width: paperW, height: paperH, flexShrink: 0,
              boxShadow: '0 0 0 1px #1e1e1e, 0 20px 60px rgba(0,0,0,0.8)',
              background: '#111',
              position: 'relative',
            }}>
              {/* Grid overlay */}
              <div className="absolute inset-0 floorplan-grid opacity-30 pointer-events-none" />

              <Stage
                width={paperW}
                height={paperH}
                onMouseDown={e => { if (e.target === e.target.getStage()) setSelectedId(null); }}
                onTouchStart={e => { if (e.target === e.target.getStage()) setSelectedId(null); }}
              >
                <Layer>
                  {tables.map(table => (
                    <TableShape
                      key={table.id}
                      table={table}
                      isSelected={selectedId === table.id}
                      onSelect={() => setSelectedId(table.id)}
                      onDragEnd={e => handleDragEnd(table.id, e)}
                      onTransformEnd={e => handleTransformEnd(table.id, e)}
                    />
                  ))}
                </Layer>
              </Stage>

              {/* Empty state */}
              {tables.length === 0 && !analyzing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-3">
                  <p className="text-[11px] font-sans uppercase tracking-[0.4em] text-[#2a2a2a]">Piano vuoto</p>
                  <p className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#222]">Aggiungi elementi dalla toolbar o analizza una pianta</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right properties panel ── */}
        {selectedTable && (
          <div className="w-64 border-l border-[#1a1a1a] bg-[#0c0c0c] flex flex-col shrink-0 overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-3.5 border-b border-[#1a1a1a] flex items-center justify-between">
              <p className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#555]">
                {selectedTable.isFixture ? 'Elemento fisso' : 'Tavolo'}
              </p>
              <button onClick={deleteSelected}
                className="w-6 h-6 flex items-center justify-center text-[#333] hover:text-red-500 transition-colors" title="Elimina (Delete)">
                <Trash2 size={13} />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1">
              {selectedTable.isFixture ? (
                /* Fixture properties */
                <div className="space-y-3">
                  <Field label="Nome">
                    <input className={INPUT}
                      value={selectedTable.name}
                      onChange={e => updateTable(selectedTable.id, { name: e.target.value })} />
                  </Field>
                  <InfoBox color={SHAPE_STYLE[selectedTable.shape]?.stroke ?? '#888'}>
                    Elemento fisso — non prenotabile.<br />Trascina per posizionare, usa le maniglie per ridimensionare.
                  </InfoBox>
                </div>
              ) : (
                /* Table properties */
                <div className="space-y-3">
                  <Field label="Lettera">
                    <div className="flex gap-0.5">
                      {LETTERS.map(l => (
                        <button key={l} onClick={() => changeLetter(l)}
                          className={`flex-1 py-1.5 text-[10px] hv font-black transition-colors ${selectedTable.letter === l ? 'bg-accent text-black' : 'bg-[#0a0a0a] border border-[#1e1e1e] text-[#555] hover:text-white'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Etichetta">
                    <input className={INPUT}
                      value={selectedTable.name}
                      onChange={e => updateTable(selectedTable.id, { name: e.target.value })} />
                  </Field>
                  <Field label="Area">
                    <input className={INPUT}
                      value={selectedTable.area}
                      onChange={e => updateTable(selectedTable.id, { area: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Pax">
                      <div className="flex items-center gap-1">
                        <button onClick={() => updateTable(selectedTable.id, { capacity: Math.max(1, selectedTable.capacity - 1) })}
                          className="w-6 h-8 flex items-center justify-center text-[#555] hover:text-white bg-[#0a0a0a] border border-[#1e1e1e] transition-colors">
                          <Minus size={10} />
                        </button>
                        <input type="number" min={1} className={`${INPUT} text-center flex-1`}
                          value={selectedTable.capacity}
                          onChange={e => updateTable(selectedTable.id, { capacity: Math.max(1, parseInt(e.target.value) || 1) })} />
                        <button onClick={() => updateTable(selectedTable.id, { capacity: selectedTable.capacity + 1 })}
                          className="w-6 h-8 flex items-center justify-center text-[#555] hover:text-white bg-[#0a0a0a] border border-[#1e1e1e] transition-colors">
                          <Plus size={10} />
                        </button>
                      </div>
                    </Field>
                    <Field label="Min €">
                      <input type="number" min={0} className={`${INPUT} text-accent`}
                        value={selectedTable.minSpend}
                        onChange={e => updateTable(selectedTable.id, { minSpend: parseInt(e.target.value) || 0 })} />
                    </Field>
                  </div>
                </div>
              )}

              {/* Dimensions info */}
              <div className="pt-3 border-t border-[#1a1a1a] grid grid-cols-2 gap-1 text-[8px] font-sans uppercase tracking-widest text-[#333]">
                <span>X {Math.round(selectedTable.x)}</span>
                <span>Y {Math.round(selectedTable.y)}</span>
                <span>W {Math.round(selectedTable.width)}</span>
                <span>H {Math.round(selectedTable.height)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Keyboard hint */}
        {selectedTable && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-sans uppercase tracking-widest text-[#2a2a2a] pointer-events-none">
            Delete / Backspace per eliminare
          </div>
        )}

        {/* AI analyzing overlay */}
        {analyzing && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-10">
            <Loader2 size={32} className="text-accent animate-spin" />
            <p className="text-[11px] hv font-black uppercase tracking-[0.3em] text-white">Analisi pianta in corso…</p>
            <p className="text-[9px] font-sans uppercase tracking-widest text-[#666]">Claude sta esaminando il file e ricostruendo il layout</p>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
        className="hidden" onChange={handleFileUpload} />
    </div>
  );
}

/* ── Shared styles ───────────────────────────────────────── */
const INPUT = 'w-full bg-[#0a0a0a] border border-[#1e1e1e] px-3 py-2 text-xs font-sans uppercase tracking-widest text-white outline-none focus:border-[#2e2e2e] transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[8px] hv font-black uppercase tracking-[0.25em] text-[#444]">{label}</label>
      {children}
    </div>
  );
}

function InfoBox({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="p-3 border text-[8px] font-sans uppercase tracking-widest leading-relaxed"
      style={{ borderColor: `${color}30`, color: `${color}99`, background: `${color}08` }}>
      {children}
    </div>
  );
}

/* ── TableShape ──────────────────────────────────────────── */
function TableShape({ table, isSelected, onSelect, onDragEnd, onTransformEnd }: {
  table: Table;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: any) => void;
  onTransformEnd: (e: any) => void;
}) {
  const shapeRef = useRef<any>(null);
  const trRef    = useRef<any>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const style     = SHAPE_STYLE[table.shape] ?? SHAPE_STYLE.rect;
  const isCircle  = table.shape === 'circle';
  const fillColor = isSelected ? `${style.stroke}22` : `${style.stroke}10`;
  const sw        = isSelected ? 1.5 : 1;
  const fontSize  = table.width < 50 ? 9 : table.isFixture ? 10 : 11;

  return (
    <>
      <Group ref={shapeRef} draggable x={table.x} y={table.y}
        onClick={onSelect} onTap={onSelect}
        onDragEnd={onDragEnd} onTransformEnd={onTransformEnd}>
        {isCircle ? (
          <Circle
            x={table.width / 2} y={table.height / 2}
            radius={Math.min(table.width, table.height) / 2}
            fill={fillColor} stroke={style.stroke} strokeWidth={sw}
          />
        ) : (
          <Rect
            width={table.width} height={table.height}
            fill={fillColor} stroke={style.stroke} strokeWidth={sw}
            cornerRadius={table.shape === 'bar' || table.shape === 'consolle' ? 4 : 2}
          />
        )}
        <Text
          text={table.name}
          width={table.width} height={table.height}
          align="center" verticalAlign="middle"
          fill={isSelected ? style.stroke : style.label}
          fontSize={fontSize} fontStyle="bold"
          listening={false}
        />
      </Group>

      {isSelected && (
        <Transformer ref={trRef}
          rotateEnabled={false}
          keepRatio={isCircle}
          boundBoxFunc={(_, b) => ({ ...b, width: Math.max(24, b.width), height: Math.max(24, b.height) })}
          anchorFill={style.stroke} anchorStroke="#fff"
          anchorCornerRadius={2} anchorSize={7}
          borderStroke={style.stroke} borderDash={[4, 3]}
        />
      )}
    </>
  );
}
