
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import InventoryList from './components/InventoryList';
import ThreeDPlanner from './components/ThreeDPlanner';
import ItemForm from './components/ItemForm';
import StorageSettings from './components/StorageSettings';
import { AppView, StorageItem, StorageRoom, OptimizationSuggestion, StorageZone, Position } from './types';
import { INITIAL_ITEMS, DEFAULT_ROOM, CATEGORIES as INITIAL_CATEGORIES, COLORS } from './constants';
import { getSpaceOptimization } from './services/gemini';
import { Sparkles, Loader2, ArrowRight, Tags, Plus, Trash2, Box, Bell, ChevronLeft, Move, Check, Ruler, Layers, MapPin, Info, RefreshCw, X, Download, Upload } from 'lucide-react';

const INITIAL_ZONES: StorageZone[] = [
  { id: 'z1', name: 'Estantería Principal', dimensions: { width: 120, height: 180, depth: 40 }, position: { x: -80, y: 90, z: -100 }, color: COLORS[3], shelves: 3, shelfHeights: [60, 60, 60] },
  { id: 'z2', name: 'Estantería Alta', dimensions: { width: 100, height: 220, depth: 50 }, position: { x: 50, y: 110, z: 50 }, color: COLORS[2], shelves: 4, shelfHeights: [80, 50, 50, 40] }
];

const STORAGE_KEYS = {
  ITEMS: 'smartstorage_items',
  ZONES: 'smartstorage_zones',
  ROOM: 'smartstorage_room',
  CATEGORIES: 'smartstorage_categories',
  LAST_VIEW: 'smartstorage_last_view'
};

const App: React.FC = () => {
  const [items, setItems] = useState<StorageItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ITEMS);
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [zones, setZones] = useState<StorageZone[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ZONES);
    return saved ? JSON.parse(saved) : INITIAL_ZONES;
  });

  const [room, setRoom] = useState<StorageRoom>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROOM);
    return saved ? JSON.parse(saved) : DEFAULT_ROOM;
  });

  const [view, setView] = useState<AppView>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_VIEW);
    return (saved as AppView) || 'inventory';
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StorageItem | undefined>();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [newCatName, setNewCatName] = useState('');
  const [optimizing, setOptimizing] = useState(false);
  const [suggestions, setSuggestions] = useState<(OptimizationSuggestion & { targetZoneId?: string })[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEYS.ZONES, JSON.stringify(zones));
    localStorage.setItem(STORAGE_KEYS.ROOM, JSON.stringify(room));
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    localStorage.setItem(STORAGE_KEYS.LAST_VIEW, view);
  }, [items, zones, room, categories, view]);

  const handleSaveItem = (itemData: Partial<StorageItem>) => {
    if (editingItem) {
      setItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...itemData } as StorageItem : item));
    } else {
      const newItem: StorageItem = {
        ...itemData as StorageItem,
        id: Math.random().toString(36).substr(2, 9),
        position: itemData.position || { x: 0, y: (itemData.dimensions?.height || 50) / 2, z: 0 }
      };
      setItems(prev => [...prev, newItem]);
    }
    setIsFormOpen(false);
    setEditingItem(undefined);
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('¿Eliminar este objeto?')) {
      setItems(prev => prev.filter(item => item.id !== id));
      if (selectedItemId === id) setSelectedItemId(null);
    }
  };

  const handleExportData = () => {
    const data = { items, zones, room, categories, version: '2.0' };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartstorage_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.items && data.zones) {
          setItems(data.items);
          setZones(data.zones);
          setRoom(data.room || DEFAULT_ROOM);
          setCategories(data.categories || INITIAL_CATEGORIES);
          alert('Inventario importado con éxito.');
        }
      } catch (err) {
        alert('Error al importar: El archivo no es válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <Layout 
      activeView={view} 
      setActiveView={setView} 
      onAddItem={() => { setEditingItem(undefined); setIsFormOpen(true); }}
      items={items}
    >
      {view === 'inventory' && (
        <InventoryList 
          items={items} 
          categories={categories}
          onEdit={(item) => { setEditingItem(item); setIsFormOpen(true); }} 
          onDelete={handleDeleteItem} 
        />
      )}

      {view === 'categories' && (
        <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Tags className="text-indigo-600" /> Categorías
            </h2>
            <p className="text-slate-500 mb-6 text-sm">Organiza tus objetos por tipos personalizados.</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (newCatName && !categories.includes(newCatName)) {
                setCategories([...categories, newCatName]);
                setNewCatName('');
              }
            }} className="flex gap-2 mb-8">
              <input 
                type="text" 
                placeholder="Nueva categoría..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <button 
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-indigo-100"
              >
                <Plus size={20} />
              </button>
            </form>

            <div className="grid grid-cols-1 gap-3">
              {categories.map(cat => (
                <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                  <div className="flex items-center gap-3">
                    <Box size={18} className="text-indigo-400" />
                    <span className="font-semibold text-slate-700">{cat}</span>
                  </div>
                  <button onClick={() => setCategories(categories.filter(c => c !== cat))} className="p-2 text-slate-300 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'settings' && (
        <div className="space-y-8">
          <StorageSettings 
            room={room} 
            onUpdateRoom={setRoom} 
            zones={zones} 
            onAddZone={(z) => setZones([...zones, z])} 
            onDeleteZone={(id) => setZones(zones.filter(z => z.id !== id))} 
          />
          
          <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-4">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <RefreshCw className="text-indigo-600" size={20} /> Portabilidad de Datos
              </h3>
              <p className="text-sm text-slate-500 mb-6 italic">Usa estas opciones para mover tu inventario entre el ordenador y el móvil.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={handleExportData}
                  className="flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-black transition-all active:scale-95"
                >
                  <Download size={20} /> Exportar Inventario
                </button>
                <label className="flex items-center justify-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold hover:bg-slate-50 cursor-pointer transition-all active:scale-95">
                  <Upload size={20} /> Importar Archivo
                  <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </label>
              </div>
            </div>

            <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h4 className="text-red-800 font-bold">Zona de Peligro</h4>
                <p className="text-red-600 text-sm">Esto borrará permanentemente todo tu inventario actual.</p>
              </div>
              <button 
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres borrar todos los datos?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                className="bg-red-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all active:scale-95 w-full md:w-auto justify-center"
              >
                <Trash2 size={18} /> Restaurar Fábrica
              </button>
            </div>
          </div>
          <div className="pb-12" />
        </div>
      )}

      {view === 'planner' && (
        <div className="w-full h-full flex flex-col md:flex-row overflow-hidden">
          <div className="flex-1 relative order-1">
            <ThreeDPlanner 
              room={room} 
              zones={zones}
              items={items} 
              selectedItemId={selectedItemId} 
              selectedZoneId={selectedZoneId}
              onSelectItem={setSelectedItemId}
              onSelectZone={setSelectedZoneId}
              onUpdateItemPosition={(id, pos) => setItems(prev => prev.map(item => item.id === id ? { ...item, position: pos } : item))}
              onUpdateZonePosition={(id, pos) => setZones(prev => prev.map(zone => zone.id === id ? { ...zone, position: pos } : zone))}
            />
            
            <button 
              onClick={async () => {
                setOptimizing(true);
                try {
                  const result = await getSpaceOptimization(room, items, zones);
                  setSuggestions(result);
                  setView('ai-insights');
                } catch (error) {
                  console.error("Optimization failed", error);
                } finally {
                  setOptimizing(false);
                }
              }}
              disabled={optimizing}
              className="absolute top-4 right-4 bg-white/95 backdrop-blur hover:bg-white text-indigo-600 px-6 py-3 rounded-2xl shadow-2xl font-bold border border-indigo-100 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 z-10"
            >
              {optimizing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
              <span className="text-sm">Optimización IA</span>
            </button>
          </div>
          
          {(selectedItemId || selectedZoneId) && (
            <div className="fixed inset-x-0 bottom-20 md:relative md:inset-auto md:w-80 bg-white border-t md:border-t-0 md:border-l border-slate-200 p-6 overflow-y-auto z-40 animate-in slide-in-from-right duration-300 md:h-full max-h-[60vh] md:max-h-none rounded-t-[2.5rem] md:rounded-none shadow-2xl md:shadow-none order-2">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-900 text-lg">Información</h3>
                <button onClick={() => { setSelectedItemId(null); setSelectedZoneId(null); }} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {selectedItemId && (() => {
                const item = items.find(i => i.id === selectedItemId);
                if (!item) return null;
                return (
                  <div className="space-y-6">
                    <div className="h-40 bg-slate-100 rounded-3xl overflow-hidden border border-slate-100 relative">
                      {item.photoUrl ? <img src={item.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center opacity-20"><Box size={60} /></div>}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-2">
                        <MapPin size={12} className="text-indigo-500" />
                        {zones.find(z => z.id === item.location)?.name || 'Suelo'}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{item.name}</h3>
                      <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest">{item.category}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="block text-[8px] font-bold text-slate-400">ANCHO</span>
                        <span className="text-xs font-mono font-bold">{item.dimensions.width}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="block text-[8px] font-bold text-slate-400">ALTO</span>
                        <span className="text-xs font-mono font-bold">{item.dimensions.height}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl text-center border border-slate-100">
                        <span className="block text-[8px] font-bold text-slate-400">FONDO</span>
                        <span className="text-xs font-mono font-bold">{item.dimensions.depth}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {selectedZoneId && (() => {
                const zone = zones.find(z => z.id === selectedZoneId);
                if (!zone) return null;
                return (
                  <div className="space-y-6">
                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${zone.color}20` }}>
                        <Layers style={{ color: zone.color }} size={24} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{zone.name}</h3>
                        <p className="text-emerald-600 font-bold text-[10px] tracking-widest uppercase">{zone.shelfHeights.length} Niveles</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Alturas de Baldas</h4>
                       {zone.shelfHeights.map((h, i) => (
                         <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-xs font-bold text-slate-500">Nivel {i+1}</span>
                            <span className="text-xs font-mono font-bold text-slate-800">{h} cm</span>
                         </div>
                       ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {view === 'ai-insights' && (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24 md:pb-8">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-indigo-100 overflow-hidden">
            <div className="bg-indigo-600 p-8 text-white relative">
              <Sparkles className="absolute right-8 top-8 opacity-20 w-16 h-16" />
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Reorganización Inteligente</h2>
              <p className="text-indigo-100 text-sm md:text-lg">Cálculo completado. ¿Deseas aplicar el nuevo plano?</p>
            </div>
            
            <div className="p-6 md:p-8">
              <div className="space-y-4 mb-8 max-h-[45vh] overflow-y-auto pr-2 custom-scrollbar">
                {suggestions.map((s, idx) => {
                  const item = items.find(i => i.id === s.itemId);
                  const targetZone = zones.find(z => z.id === s.targetZoneId);
                  return (
                    <div key={idx} className="flex items-start gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-200">
                      <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl shrink-0 flex items-center justify-center" style={{ backgroundColor: `${item?.color}20` }}>
                         <Box style={{ color: item?.color }} size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-800 text-sm md:text-base">{item?.name}</h4>
                          <ArrowRight size={14} className="text-slate-400" />
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase tracking-tighter">
                            {targetZone ? targetZone.name : 'Suelo'}
                          </span>
                        </div>
                        <p className="text-[11px] md:text-xs text-slate-600 italic leading-relaxed">"{s.reasoning}"</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => {
                    setItems(prev => prev.map(item => {
                      const suggestion = suggestions.find(s => s.itemId === item.id);
                      if (suggestion) {
                        return { 
                          ...item, 
                          position: suggestion.suggestedPosition,
                          location: suggestion.targetZoneId || item.location
                        };
                      }
                      return item;
                    }));
                    setView('planner');
                    setSuggestions([]);
                  }} 
                  className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-bold shadow-xl shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <Check size={20} /> Aplicar Cambios
                </button>
                <button onClick={() => setView('planner')} className="px-8 py-5 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <ItemForm 
          item={editingItem} 
          categories={categories}
          zones={zones.map(z => z.id)} 
          onSave={handleSaveItem} 
          onClose={() => { setIsFormOpen(false); setEditingItem(undefined); }} 
        />
      )}
    </Layout>
  );
};

export default App;
