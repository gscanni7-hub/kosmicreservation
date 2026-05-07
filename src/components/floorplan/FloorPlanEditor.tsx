import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Circle, Text, Group, Transformer } from 'react-konva';
import { FloorPlan, Table } from '../../types';
import { Plus, Trash2, Save, Move, Layers, Square, Circle as CircleIcon, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface FloorPlanEditorProps {
  floorPlan: FloorPlan;
}

export default function FloorPlanEditor({ floorPlan }: FloorPlanEditorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [tables, setTables] = useState<Table[]>(floorPlan.tables);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const backgroundLayerRef = useRef<any>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = floorPlan.imageUrl;
    img.onload = () => {
      setImage(img);
    };
  }, [floorPlan.imageUrl]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const addTable = (shape: 'rect' | 'circle') => {
    const newTable: Table = {
      id: Math.random().toString(36).substr(2, 9),
      name: `T-${tables.length + 1}`,
      x: 50,
      y: 50,
      width: shape === 'rect' ? 60 : 60,
      height: 60,
      shape: shape,
      area: 'Main',
      capacity: 4,
      minSpend: 200,
    };
    setTables([...tables, newTable]);
    setSelectedId(newTable.id);
  };

  const handleDragEnd = (id: string, e: any) => {
    setTables(tables.map(t => t.id === id ? { ...t, x: e.target.x(), y: e.target.y() } : t));
  };

  const handleTransformEnd = (id: string, e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);

    setTables(tables.map(t => t.id === id ? {
      ...t,
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
    } : t));
  };

  const deleteSelected = () => {
    if (selectedId) {
      setTables(tables.filter(t => t.id !== selectedId));
      setSelectedId(null);
    }
  };

  const selectedTable = tables.find(t => t.id === selectedId);

  return (
    <div className="flex flex-col h-full gap-8 lg:flex-row" ref={containerRef}>
      {/* Editor Main View */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => addTable('rect')}
              className="flex items-center gap-2 px-4 py-3 bg-zinc-800 border border-border rounded text-[9px] uppercase tracking-[0.2em] font-black hover:bg-zinc-700 transition-all"
            >
              <Square size={14} /> Add Rect
            </button>
            <button 
              onClick={() => addTable('circle')}
              className="flex items-center gap-2 px-4 py-3 bg-zinc-800 border border-border rounded text-[9px] uppercase tracking-[0.2em] font-black hover:bg-zinc-700 transition-all"
            >
              <CircleIcon size={14} /> Add Round
            </button>
          </div>
          <button className="flex items-center gap-2 px-8 py-3 bg-accent text-black rounded font-black text-[10px] uppercase tracking-[0.2em] hover:opacity-90 transition-all shadow-[0_0_30px_rgba(212,175,55,0.2)]">
            <Save size={16} /> Save Floorplan
          </button>
        </div>

        <div className="flex-1 bg-zinc-900/40 rounded-2xl border border-border overflow-hidden relative min-h-[600px] floorplan-grid flex items-center justify-center">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}></div>
          <Stage 
            width={dimensions.width} 
            height={dimensions.height}
            onMouseDown={e => {
              const clickedOnEmpty = e.target === e.target.getStage();
              if (clickedOnEmpty) setSelectedId(null);
            }}
          >
            <Layer ref={backgroundLayerRef}>
              {image && (
                <KonvaImage
                  image={image}
                  width={dimensions.width}
                  height={dimensions.height}
                  opacity={0.1}
                />
              )}
              
              {tables.map(table => (
                <TableShape 
                  key={table.id}
                  table={table}
                  isSelected={selectedId === table.id}
                  onSelect={() => setSelectedId(table.id)}
                  onDragEnd={(e) => handleDragEnd(table.id, e)}
                  onTransformEnd={(e) => handleTransformEnd(table.id, e)}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Control Panel */}
      <aside className="w-full lg:w-80">
        <div className="bg-card border border-border rounded-xl flex flex-col h-full overflow-hidden shadow-2xl">
          <div className="p-6 bg-[#0c0c0d] border-b border-border">
            <h3 className="serif text-xl italic italic">Editor Config</h3>
          </div>

          <div className="p-6 space-y-8">
            {!selectedTable ? (
              <div className="py-16 px-4 border border-dashed border-border rounded flex flex-col items-center justify-center text-center text-zinc-700">
                <Move className="mb-4 opacity-20" size={32} />
                <p className="text-[10px] uppercase font-bold tracking-widest leading-loose">Seleziona un tavolo<br/>per editarlo</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-accent">Anagrafica</span>
                  <button onClick={deleteSelected} className="text-red-500/50 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 ml-1">ID Tavolo</label>
                    <input 
                      className="w-full bg-bg border border-border rounded px-4 py-3 text-xs uppercase tracking-widest focus:border-accent/40 outline-none transition-colors font-bold"
                      value={selectedTable.name}
                      onChange={e => setTables(tables.map(t => t.id === selectedId ? { ...t, name: e.target.value } : t))}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Area locale</label>
                    <input 
                      className="w-full bg-bg border border-border rounded px-4 py-3 text-xs uppercase tracking-widest focus:border-accent/40 outline-none transition-colors"
                      value={selectedTable.area}
                      onChange={e => setTables(tables.map(t => t.id === selectedId ? { ...t, area: e.target.value } : t))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Pax</label>
                      <input 
                        type="number"
                        className="w-full bg-bg border border-border rounded px-4 py-3 text-xs serif focus:border-accent/40 outline-none transition-colors"
                        value={selectedTable.capacity}
                        onChange={e => setTables(tables.map(t => t.id === selectedId ? { ...t, capacity: parseInt(e.target.value) } : t))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 ml-1">Spend (€)</label>
                      <input 
                        type="number"
                        className="w-full bg-bg border border-border rounded px-4 py-3 text-xs serif text-accent focus:border-accent/40 outline-none transition-colors"
                        value={selectedTable.minSpend}
                        onChange={e => setTables(tables.map(t => t.id === selectedId ? { ...t, minSpend: parseInt(e.target.value) } : t))}
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border">
                     <div className="p-4 bg-zinc-900 border border-border rounded text-[9px] text-zinc-500 leading-normal uppercase tracking-widest">
                      Pos: {Math.round(selectedTable.x)}, {Math.round(selectedTable.y)}<br/>
                      Dim: {Math.round(selectedTable.width)}x{Math.round(selectedTable.height)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function TableShape({ table, isSelected, onSelect, onDragEnd, onTransformEnd }: { 
  table: Table, 
  isSelected: boolean, 
  onSelect: () => void,
  onDragEnd: (e: any) => void,
  onTransformEnd: (e: any) => void
}) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Group
        draggable
        x={table.x}
        y={table.y}
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
        ref={shapeRef}
      >
        {table.shape === 'rect' ? (
          <Rect
            width={table.width}
            height={table.height}
            fill={isSelected ? '#d4af37' : '#18181b'}
            opacity={0.3}
            stroke="#d4af37"
            strokeWidth={isSelected ? 2 : 1}
            cornerRadius={2}
          />
        ) : (
          <Circle
            radius={table.width / 2}
            x={table.width / 2}
            y={table.width / 2}
            fill={isSelected ? '#d4af37' : '#18181b'}
            opacity={0.3}
            stroke="#d4af37"
            strokeWidth={isSelected ? 2 : 1}
          />
        )}
        <Text
          text={table.name}
          width={table.width}
          height={table.height}
          align="center"
          verticalAlign="middle"
          fill="white"
          fontSize={10}
          fontStyle="bold"
          pointerEvents="none"
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 10 || newBox.height < 10) return oldBox;
            return newBox;
          }}
          rotateEnabled={false}
          anchorFill="#d4af37"
          anchorStroke="#ffffff"
          anchorCornerRadius={2}
          anchorSize={8}
          borderStroke="#d4af37"
        />
      )}
    </>
  );
}
