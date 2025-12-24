
import React, { useState, useEffect } from 'react';
import { StorageRoom, Dimensions, StorageZone, Position } from '../types';
import { Ruler, MapPin, Plus, Trash2, Layers, Info, ChevronRight, Hash } from 'lucide-react';
import { COLORS } from '../constants';

interface StorageSettingsProps {
  room: StorageRoom;
  onUpdateRoom: (room: StorageRoom) => void;
  zones: StorageZone[];
  onAddZone: (zone: StorageZone) => void;
  onDeleteZone: (id: string) => void;
}

const StorageSettings: React.FC<StorageSettingsProps> = ({ room, onUpdateRoom, zones, onAddZone, onDeleteZone }) => {
  const [roomDims, setRoomDims] = useState<Dimensions>(room.dimensions);
  const [showZoneForm, setShowZoneForm] = useState(false);
  
  const [zoneFormData, setZoneFormData] = useState<Partial<StorageZone>>({
    name: '',
    dimensions: { width: 100, height: 180, depth: 40 },
    position: { x: 0, y: 90, z: 0 },
    color: COLORS[2],
    shelfHeights: [60, 60, 60] // Alturas por defecto
  });

  const handleRoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRoomDims(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('dim-')) {
      const field = name.split('-')[1] as keyof Dimensions;
      const newVal = parseInt(value) || 0;
      setZoneFormData(prev => ({
        ...prev,
        dimensions: { ...prev.dimensions!, [field]: newVal }
      }));
    } else {
      setZoneFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleShelfHeightChange = (index: number, value: string) => {
    const newHeights = [...(zoneFormData.shelfHeights || [])];
    newHeights[index] = parseInt(value) || 0;
    
    // El alto total de la estantería es la suma de sus baldas
    const totalHeight = newHeights.reduce((sum, h) => sum + h, 0);
    
    setZoneFormData(prev => ({
      ...prev,
      shelfHeights: newHeights,
      dimensions: { ...prev.dimensions!, height: totalHeight },
      position: { ...prev.position!, y: totalHeight / 2 }
    }));
  };

  const addShelf = () => {
    const newHeights = [...(zoneFormData.shelfHeights || []), 40];
    const totalHeight = newHeights.reduce((sum, h) => sum + h, 0);
    setZoneFormData(prev => ({
      ...prev,
      shelfHeights: newHeights,
      dimensions: { ...prev.dimensions!, height: totalHeight },
      position: { ...prev.position!, y: totalHeight / 2 }
    }));
  };

  const removeShelf = (index: number) => {
    const newHeights = (zoneFormData.shelfHeights || []).filter((_, i) => i !== index);
    if (newHeights.length === 0) newHeights.push(180);
    const totalHeight = newHeights.reduce((sum, h) => sum + h, 0);
    setZoneFormData(prev => ({
      ...prev,
      shelfHeights: newHeights,
      dimensions: { ...prev.dimensions!, height: totalHeight },
      position: { ...prev.position!, y: totalHeight / 2 }
    }));
  };

  const submitZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneFormData.name) return;
    
    const newZone: StorageZone = {
      id: Math.random().toString(36).substr(2, 9),
      name: zoneFormData.name,
      dimensions: zoneFormData.dimensions as Dimensions,
      position: zoneFormData.position as Position,
      color: zoneFormData.color || COLORS[0],
      shelves: zoneFormData.shelfHeights?.length || 1,
      shelfHeights: zoneFormData.shelfHeights || [180]
    };
    onAddZone(newZone);
    setShowZoneForm(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-24 md:pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-2xl text-indigo-600">
              <Ruler size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Sala de Trastero</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <DimensionInput label="Ancho" name="width" value={roomDims.width} onChange={handleRoomChange} />
            <DimensionInput label="Alto" name="height" value={roomDims.height} onChange={handleRoomChange} />
            <DimensionInput label="Fondo" name="depth" value={roomDims.depth} onChange={handleRoomChange} />
          </div>

          <button 
            onClick={() => onUpdateRoom({ ...room, dimensions: roomDims })}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            Guardar Sala
          </button>
        </div>

        <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 p-2.5 rounded-2xl text-emerald-600">
                <Layers size={24} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Estanterías</h2>
            </div>
            <button 
              onClick={() => setShowZoneForm(!showZoneForm)}
              className={`p-2 rounded-xl transition-all ${showZoneForm ? 'bg-slate-100 text-slate-600' : 'bg-emerald-600 text-white shadow-lg'}`}
            >
              {showZoneForm ? <Trash2 size={20} className="rotate-45" /> : <Plus size={20} />}
            </button>
          </div>

          {showZoneForm ? (
            <form onSubmit={submitZone} className="space-y-6 animate-in fade-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <input 
                  type="text" 
                  name="name"
                  placeholder="Nombre de la estantería..."
                  value={zoneFormData.name}
                  onChange={handleZoneChange}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                  required
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <DimensionInput label="Ancho Estructura" name="dim-width" value={zoneFormData.dimensions?.width} onChange={handleZoneChange} small />
                  <DimensionInput label="Fondo Estructura" name="dim-depth" value={zoneFormData.dimensions?.depth} onChange={handleZoneChange} small />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dimensiones de Baldas (Alturas)</label>
                    <button type="button" onClick={addShelf} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg hover:bg-emerald-100">+ Añadir Balda</button>
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {zoneFormData.shelfHeights?.map((h, i) => (
                      <div key={i} className="flex items-center gap-3 animate-in fade-in slide-in-from-left duration-200">
                        <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 flex items-center px-4 py-2">
                           <Hash size={14} className="text-slate-300 mr-2" />
                           <span className="text-xs font-bold text-slate-400 mr-2">B{i+1}:</span>
                           <input 
                             type="number" 
                             value={h} 
                             onChange={(e) => handleShelfHeightChange(i, e.target.value)}
                             className="bg-transparent text-sm font-mono font-bold text-slate-700 w-full outline-none"
                           />
                           <span className="text-[10px] font-bold text-slate-300 ml-2">cm</span>
                        </div>
                        <button type="button" onClick={() => removeShelf(i)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Altura total calculada: <span className="text-slate-800 font-bold">{zoneFormData.dimensions?.height} cm</span></p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center py-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setZoneFormData(p => ({...p, color: c}))} className={`w-8 h-8 rounded-full border-4 ${zoneFormData.color === c ? 'border-white ring-2 ring-emerald-500 scale-110 shadow-md' : 'border-transparent opacity-60'}`} style={{backgroundColor: c}} />
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-emerald-50 active:scale-95 transition-all">Crear Estantería</button>
            </form>
          ) : (
            <div className="flex-1 space-y-4 max-h-[500px] overflow-auto pr-1">
              {zones.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <Info size={48} className="mx-auto mb-4 opacity-10" />
                  <p className="text-sm font-medium">Crea tu primera estantería para organizar objetos.</p>
                </div>
              ) : zones.map(zone => (
                <div key={zone.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-300 transition-all shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-10 rounded-full" style={{ backgroundColor: zone.color }} />
                      <h4 className="font-bold text-slate-800">{zone.name}</h4>
                    </div>
                    <button onClick={() => onDeleteZone(zone.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded-2xl border border-slate-100">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Estructura</span>
                      <span className="text-xs font-mono text-slate-600">{zone.dimensions.width}x{zone.dimensions.depth}x{zone.dimensions.height}</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl border border-slate-100">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Distribución</span>
                      <span className="text-xs font-bold text-indigo-600">{zone.shelfHeights.length} niveles</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const DimensionInput = ({ label, name, value, onChange, small }: { label: string, name: string, value: any, onChange: any, small?: boolean }) => (
  <div className="space-y-1">
    <label className={`block font-bold text-slate-400 uppercase tracking-widest ${small ? 'text-[8px]' : 'text-[10px]'}`}>{label}</label>
    <div className="relative">
      <input 
        type="number" 
        name={name}
        value={value} 
        onChange={onChange}
        className={`w-full bg-slate-50 border border-slate-200 rounded-2xl outline-none transition-all font-mono text-center focus:ring-2 focus:ring-indigo-500 focus:bg-white ${small ? 'px-1 py-3 text-xs' : 'px-4 py-4 font-bold'}`}
      />
      {small && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-300 pointer-events-none">cm</span>}
    </div>
  </div>
);

export default StorageSettings;
