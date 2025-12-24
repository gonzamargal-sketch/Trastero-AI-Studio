
import React, { useState, useRef } from 'react';
import { X, Camera, Sparkles, Loader2, Calendar, Bell, MapPin } from 'lucide-react';
import { StorageItem, Dimensions, StorageZone } from '../types';
import { COLORS } from '../constants';
import { analyzeItemPhoto } from '../services/gemini';

interface ItemFormProps {
  item?: StorageItem;
  categories: string[];
  zones: string[]; // These are IDs
  onSave: (item: Partial<StorageItem>) => void;
  onClose: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, categories, zones, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<StorageItem>>(item || {
    name: '',
    category: categories[0] || 'Otros',
    quantity: 1,
    dimensions: { width: 50, height: 50, depth: 50 },
    color: COLORS[0],
    location: zones[0] || '',
    reminderDate: '',
    reminderNote: '',
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('dim-')) {
      const dimKey = name.replace('dim-', '') as keyof Dimensions;
      setFormData(prev => ({
        ...prev,
        dimensions: { ...prev.dimensions!, [dimKey]: parseInt(value) || 0 }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      setFormData(prev => ({ ...prev, photoUrl: event.target?.result as string }));
      
      setIsAnalyzing(true);
      try {
        const aiSuggestion = await analyzeItemPhoto(base64);
        setFormData(prev => ({
          ...prev,
          name: aiSuggestion.name || prev.name,
          category: categories.includes(aiSuggestion.category) ? aiSuggestion.category : prev.category,
          dimensions: aiSuggestion.dimensions || prev.dimensions
        }));
      } catch (error) {
        console.error("AI Analysis failed", error);
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-0 md:p-4 overflow-hidden">
      <div className="bg-white rounded-t-[2.5rem] md:rounded-3xl w-full max-w-lg overflow-y-auto max-h-[92vh] md:max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md flex justify-between items-center p-6 border-b border-slate-100 z-10">
          <h2 className="text-xl font-bold text-slate-900">{item ? 'Editar Objeto' : 'Nuevo Objeto'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form className="p-6 pb-12 md:pb-6 space-y-6" onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
          <div className="flex flex-col md:flex-row gap-6">
            <div 
              className="w-full md:w-32 h-40 md:h-32 bg-slate-100 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-300 relative group cursor-pointer overflow-hidden shadow-inner"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.photoUrl ? (
                <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="text-slate-400 group-hover:text-indigo-500 transition-colors" size={32} />
                  <span className="text-[10px] text-slate-400 mt-2 font-bold tracking-wider uppercase">FOTO CON IA</span>
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-indigo-600/90 flex items-center justify-center flex-col text-white gap-2">
                  <Loader2 className="animate-spin" size={32} />
                  <span className="text-[10px] font-bold uppercase tracking-tighter">Analizando...</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nombre</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 font-medium" 
                  required 
                  placeholder="Ej: Maletas azules"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Categoría</label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="w-20">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cant.</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    value={formData.quantity} 
                    onChange={handleChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dimensiones (cm)</label>
            <div className="grid grid-cols-3 gap-3">
              <DimensionInput label="Ancho" name="dim-width" value={formData.dimensions?.width} onChange={handleChange} />
              <DimensionInput label="Alto" name="dim-height" value={formData.dimensions?.height} onChange={handleChange} />
              <DimensionInput label="Fondo" name="dim-depth" value={formData.dimensions?.depth} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Color en el Mapa</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button 
                    key={c} 
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, color: c }))}
                    className={`w-7 h-7 rounded-full border-4 shadow-sm transition-transform ${formData.color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Zona de Destino</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 appearance-none font-medium"
                >
                  <option value="" disabled>Seleccionar zona...</option>
                  {zones.map(zid => <option key={zid} value={zid}>Zona {zid.slice(0,3)}</option>)}
                  {zones.length === 0 && <option value="" disabled>Añade zonas en Ajustes</option>}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/70 p-5 rounded-3xl border border-indigo-100 space-y-4">
            <h3 className="text-xs font-bold text-indigo-700 flex items-center gap-2 uppercase tracking-widest">
              <Bell size={16} /> Recordatorios
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Fecha Límite</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300" size={16} />
                  <input 
                    type="date" 
                    name="reminderDate" 
                    value={formData.reminderDate} 
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-indigo-400 uppercase mb-1">Anotación</label>
                <input 
                  type="text" 
                  name="reminderNote" 
                  placeholder="Ej: Devolver a Juan"
                  value={formData.reminderNote} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-3xl shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
          >
            {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={22} />}
            <span>{item ? 'Actualizar' : 'Guardar en Inventario'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

const DimensionInput = ({ label, name, value, onChange }: { label: string, name: string, value: any, onChange: any }) => (
  <div className="space-y-1 bg-slate-50 p-2 rounded-2xl border border-slate-100">
    <span className="block text-[9px] text-slate-400 font-bold uppercase text-center">{label}</span>
    <input 
      type="number" 
      name={name} 
      value={value} 
      onChange={onChange} 
      className="w-full bg-transparent text-center text-sm font-mono outline-none" 
      placeholder="0"
    />
  </div>
);

export default ItemForm;
