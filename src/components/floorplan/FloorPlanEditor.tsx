import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Transformer, Image as KonvaImage } from 'react-konva';
import { FloorPlan, Table } from '../../types';
import { Trash2, Save, Move, Square, Circle as CircleIcon, ImageIcon, X, ChevronDown } from 'lucide-react';

const LETTERS = ['A', 'B', 'C', 'D', 'T', 'P'] as const;
type TableLetter = typeof LETTERS[number];

const SHAPE_STYLE = {
  rect:     { fill: '#1a1a1a', stroke: '#D4622A', selectedFill: '#2a1a0f' },
  circle:   { fill: '#1a1a1a', stroke: '#D4622A', selectedFill: '#2a1a0f' },
  bar:      { fill: '#0d1f30', stroke: '#2d7dd2', selectedFill: '#0d1f30' },
  consolle: { fill: '#1a0d2e', stroke: '#8b5cf6', selectedFill: '#1a0d2e' },
};

interface FloorPlanEditorProps {
  floorPlan: FloorPlan;
  onSave?: (fp: FloorPlan) => void;
}

export default function FloorPlanEditor({ floorPlan, onSave }: FloorPlanEditorProps) {
  const [tables, setTables] = useState<Table[]>(floorPlan.tables);
  const [fpName, setFpName] = useState(floorPlan.name);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedLetter, setSelectedLetter] = useState<TableLetter>('T');
  const [bgImage, setBgImage] = useState<string | null>(floorPlan.bgImage ?? null);
  const [bgImageEl, setBgImageEl] = useState<HTMLImageElement | null>(null);
  const [bgOpacity, setBgOpacity] = useState(0.25);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!bgImage) { setBgImageEl(null); return; }
    const img = new window.Image();
    img.src = bgImage;
    img.onload = () => setBgImageEl(img);
  }, [bgImage]);

  const getNextNum = (letter: string) =>
    tables.filter(t => t.letter === letter).length + 1;

  const addTable = (shape: 'rect' | 'circle') => {
    const num = getNextNum(selectedLetter);
    const newTable: Table = {
      id: `t_${Date.now()}`,
      name: `${selectedLetter}${num}`,
      letter: selectedLetter,
      x: 60 + Math.random() * 80,
      y: 60 + Math.random() * 80,
      width: shape === 'rect' ? 72 : 64,
      height: shape === 'rect' ? 64 : 64,
      shape,
      area: 'Main',
      capacity: 4,
      minSpend: 200,
    };
    setTables(prev => [...prev, newTable]);
    setSelectedId(newTable.id);
  };

  const addFixture = (shape: 'bar' | 'consolle') => {
    const fixture: Table = {
      id: `fx_${Date.now()}`,
      name: shape === 'bar' ? 'BAR' : 'CONSOLLE',
      x: 100 + Math.random() * 60,
      y: 100 + Math.random() * 60,
      width: shape === 'bar' ? 200 : 100,
      height: shape === 'bar' ? 50 : 70,
      shape,
      area: 'Fixed',
      capacity: 0,
      minSpend: 0,
      isFixture: true,
    };
    setTables(prev => [...prev, fixture]);
    setSelectedId(fixture.id);
  };

  const handleDragEnd = (id: string, e: any) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, x: e.target.x(), y: e.target.y() } : t));
  };

  const handleTransformEnd = (id: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    setTables(prev => prev.map(t => t.id === id ? {
      ...t,
      x: node.x(),
      y: node.y(),
      width: Math.max(24, t.width * scaleX),
      height: Math.max(24, t.height * scaleY),
    } : t));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setTables(prev => prev.filter(t => t.id !== selectedId));
    setSelectedId(null);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setBgImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const updateTable = (id: string, patch: Partial<Table>) =>
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));

  const changeLetter = (letter: TableLetter) => {
    if (!selectedId) return;
    const table = tables.find(t => t.id === selectedId);
    if (!table || table.isFixture) return;
    const num = tables.filter(t => t.letter === letter && t.id !== selectedId).length + 1;
    updateTable(selectedId, { letter, name: `${letter}${num}` });
  };

  const selectedTable = tables.find(t => t.id === selectedId);

  const handleSave = () => {
    onSave?.({
      ...floorPlan,
      id: floorPlan.id || `fp_${Date.now()}`,
      name: fpName || 'Nuova Pianta',
      tables,
      bgImage: bgImage ?? undefined,
    });
  };

  return (
    <div className="flex flex-col h-full gap-4 lg:flex-row min-h-0">

      {/* ── Canvas column ── */}
      <div className="flex-1 flex flex-col gap-3 min-w-0">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="flex-1 min-w-[120px] bg-transparent border border-[#2a2a2a] px-4 py-2.5 text-xs hv font-black uppercase tracking-widest text-white placeholder-[#555] outline-none focus:border-accent/40 transition-colors"
            placeholder="NOME PIANTA"
            value={fpName}
            onChange={e => setFpName(e.target.value)}
          />

          {/* Letter selector */}
          <div className="flex items-center gap-1 border border-[#2a2a2a] px-2 py-1">
            {LETTERS.map(l => (
              <button key={l}
                onClick={() => setSelectedLetter(l)}
                className={`w-7 h-7 text-[10px] hv font-black transition-colors ${selectedLetter === l ? 'bg-accent text-black' : 'text-[#666] hover:text-white'}`}>
                {l}
              </button>
            ))}
          </div>

          {/* Table shape buttons */}
          <button onClick={() => addTable('rect')}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-[#222] border border-[#333] text-[9px] hv font-black uppercase tracking-widest hover:border-accent/50 transition-all">
            <Square size={12} /> Quadrato
          </button>
          <button onClick={() => addTable('circle')}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-[#222] border border-[#333] text-[9px] hv font-black uppercase tracking-widest hover:border-accent/50 transition-all">
            <CircleIcon size={12} /> Rotondo
          </button>

          {/* Fixture buttons */}
          <button onClick={() => addFixture('bar')}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-[#0d1f30] border border-[#2d7dd2]/40 text-[9px] hv font-black uppercase tracking-widest text-[#2d7dd2] hover:border-[#2d7dd2] transition-all">
            Bar
          </button>
          <button onClick={() => addFixture('consolle')}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-[#1a0d2e] border border-[#8b5cf6]/40 text-[9px] hv font-black uppercase tracking-widest text-[#8b5cf6] hover:border-[#8b5cf6] transition-all">
            Consolle
          </button>

          {/* Save */}
          <button onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-black text-[9px] hv font-black uppercase tracking-widest hover:bg-white transition-all ml-auto">
            <Save size={13} /> Salva
          </button>
        </div>

        {/* Canvas */}
        <div ref={containerRef}
          className="flex-1 bg-[#111] border border-[#2a2a2a] overflow-hidden relative min-h-[500px] floorplan-grid">
          {dimensions.width > 0 && (
            <Stage
              width={dimensions.width}
              height={dimensions.height}
              onMouseDown={e => { if (e.target === e.target.getStage()) setSelectedId(null); }}
              onTouchStart={e => { if (e.target === e.target.getStage()) setSelectedId(null); }}
            >
              {/* Background image layer */}
              <Layer listening={false}>
                {bgImageEl && (
                  <KonvaImage
                    image={bgImageEl}
                    x={0} y={0}
                    width={dimensions.width}
                    height={dimensions.height}
                    opacity={bgOpacity}
                  />
                )}
              </Layer>

              {/* Tables layer */}
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
          )}

          {tables.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] font-sans uppercase tracking-[0.4em] text-[#333]">Canvas vuoto — aggiungi elementi</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Control panel ── */}
      <aside className="w-full lg:w-72 flex flex-col gap-3 shrink-0">

        {/* Background upload */}
        <div className="border border-[#2a2a2a] bg-[#161616]">
          <div className="px-4 py-3 border-b border-[#222]">
            <p className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666]">Sfondo Pianta</p>
          </div>
          <div className="p-4 space-y-3">
            {bgImage ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-sans uppercase tracking-widest text-[#777]">Immagine caricata</span>
                  <button onClick={() => setBgImage(null)}
                    className="text-[#555] hover:text-red-500 transition-colors">
                    <X size={13} />
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-sans uppercase tracking-widest text-[#555]">Opacità</label>
                  <input type="range" min={0.05} max={0.7} step={0.05}
                    value={bgOpacity}
                    onChange={e => setBgOpacity(parseFloat(e.target.value))}
                    className="w-full accent-[#D4622A]" />
                </div>
              </>
            ) : (
              <>
                <button onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-[#333] text-[9px] hv font-black uppercase tracking-widest text-[#555] hover:border-accent/40 hover:text-[#888] transition-all">
                  <ImageIcon size={12} /> Carica PNG / JPG
                </button>
                <p className="text-[8px] font-sans text-[#444] leading-relaxed">
                  Per PDF: esporta prima come immagine PNG dal tuo programma.
                </p>
              </>
            )}
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden" onChange={handleBgUpload} />
          </div>
        </div>

        {/* Table properties */}
        <div className="border border-[#2a2a2a] bg-[#161616] flex-1">
          <div className="px-4 py-3 border-b border-[#222] flex items-center justify-between">
            <p className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#666]">
              {selectedTable ? (selectedTable.isFixture ? 'Elemento Fisso' : 'Tavolo Selezionato') : 'Proprietà'}
            </p>
            {selectedTable && (
              <button onClick={deleteSelected} className="text-[#555] hover:text-red-500 transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <div className="p-4">
            {!selectedTable ? (
              <div className="py-10 flex flex-col items-center gap-3 text-center">
                <Move size={24} className="text-[#2a2a2a]" />
                <p className="text-[9px] font-sans uppercase tracking-[0.3em] text-[#3a3a3a]">
                  Seleziona un elemento<br />per modificarlo
                </p>
              </div>
            ) : selectedTable.isFixture ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#555]">Nome</label>
                  <input
                    className="w-full bg-[#111] border border-[#2a2a2a] px-3 py-2.5 text-xs font-sans uppercase tracking-widest text-white outline-none focus:border-accent/40 transition-colors"
                    value={selectedTable.name}
                    onChange={e => updateTable(selectedTable.id, { name: e.target.value })}
                  />
                </div>
                <div className="p-3 bg-[#111] border border-[#2a2a2a]">
                  <p className="text-[8px] font-sans uppercase tracking-widest text-[#444] leading-relaxed">
                    Elemento fisso — non prenotabile.<br />
                    Trascina per posizionare,<br />usa le maniglie per ridimensionare.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[8px] font-sans uppercase tracking-widest text-[#444]">
                  <div>W: {Math.round(selectedTable.width)}px</div>
                  <div>H: {Math.round(selectedTable.height)}px</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Letter selector */}
                <div className="space-y-1.5">
                  <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#555]">Lettera</label>
                  <div className="flex gap-1">
                    {LETTERS.map(l => (
                      <button key={l}
                        onClick={() => changeLetter(l)}
                        className={`flex-1 py-2 text-[10px] hv font-black transition-colors ${selectedTable.letter === l ? 'bg-accent text-black' : 'bg-[#111] border border-[#2a2a2a] text-[#666] hover:text-white'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#555]">Etichetta</label>
                  <input
                    className="w-full bg-[#111] border border-[#2a2a2a] px-3 py-2.5 text-xs font-sans uppercase tracking-widest text-white outline-none focus:border-accent/40 transition-colors"
                    value={selectedTable.name}
                    onChange={e => updateTable(selectedTable.id, { name: e.target.value })}
                  />
                </div>

                {/* Area */}
                <div className="space-y-1">
                  <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#555]">Area</label>
                  <input
                    className="w-full bg-[#111] border border-[#2a2a2a] px-3 py-2.5 text-xs font-sans uppercase tracking-widest text-white outline-none focus:border-accent/40 transition-colors"
                    value={selectedTable.area}
                    onChange={e => updateTable(selectedTable.id, { area: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#555]">Pax</label>
                    <input type="number" min={1}
                      className="w-full bg-[#111] border border-[#2a2a2a] px-3 py-2.5 text-xs font-sans text-white outline-none focus:border-accent/40 transition-colors"
                      value={selectedTable.capacity}
                      onChange={e => updateTable(selectedTable.id, { capacity: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] hv font-black uppercase tracking-[0.2em] text-[#555]">Min €</label>
                    <input type="number" min={0}
                      className="w-full bg-[#111] border border-[#2a2a2a] px-3 py-2.5 text-xs font-sans text-accent outline-none focus:border-accent/40 transition-colors"
                      value={selectedTable.minSpend}
                      onChange={e => updateTable(selectedTable.id, { minSpend: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-[8px] font-sans uppercase tracking-widest text-[#444] border-t border-[#222] pt-3">
                  <div>X: {Math.round(selectedTable.x)} Y: {Math.round(selectedTable.y)}</div>
                  <div>W: {Math.round(selectedTable.width)} H: {Math.round(selectedTable.height)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
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
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const style = SHAPE_STYLE[table.shape] ?? SHAPE_STYLE.rect;
  const fill = isSelected ? style.selectedFill : style.fill;
  const stroke = style.stroke;
  const strokeWidth = isSelected ? 2 : 1;
  const isCircle = table.shape === 'circle';
  const labelFontSize = table.isFixture ? 9 : 11;

  return (
    <>
      <Group
        ref={shapeRef}
        draggable
        x={table.x}
        y={table.y}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
      >
        {isCircle ? (
          <Circle
            x={table.width / 2}
            y={table.height / 2}
            radius={Math.min(table.width, table.height) / 2}
            fill={fill}
            opacity={isSelected ? 0.7 : 0.5}
            stroke={stroke}
            strokeWidth={strokeWidth}
          />
        ) : (
          <Rect
            width={table.width}
            height={table.height}
            fill={fill}
            opacity={isSelected ? 0.7 : 0.5}
            stroke={stroke}
            strokeWidth={strokeWidth}
            cornerRadius={table.shape === 'bar' || table.shape === 'consolle' ? 3 : 2}
          />
        )}
        <Text
          text={table.name}
          width={table.width}
          height={table.height}
          align="center"
          verticalAlign="middle"
          fill={table.isFixture ? stroke : 'white'}
          fontSize={labelFontSize}
          fontStyle="bold"
          listening={false}
        />
      </Group>

      {isSelected && (
        <Transformer
          ref={transformerRef}
          rotateEnabled={false}
          keepRatio={isCircle}
          boundBoxFunc={(_, newBox) => ({
            ...newBox,
            width: Math.max(24, newBox.width),
            height: Math.max(24, newBox.height),
          })}
          anchorFill={stroke}
          anchorStroke="#ffffff"
          anchorCornerRadius={2}
          anchorSize={8}
          borderStroke={stroke}
        />
      )}
    </>
  );
}
