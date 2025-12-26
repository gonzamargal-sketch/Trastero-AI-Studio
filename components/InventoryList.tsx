
import React, { useState } from 'react';
import { Edit2, Trash2, Search, PackageOpen, Filter, ChevronDown, ListFilter, LayoutGrid, Calendar, Bell, X } from 'lucide-react';
import { StorageItem } from '../types';

interface InventoryListProps {
  items: StorageItem[];
  categories: string[];
  onEdit: (item: StorageItem) => void;
  onDelete: (id: string) => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, categories, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [groupByCategory, setGroupByCategory] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const locations = Array.from(new Set(items.map(i => i.location).filter(Boolean)));

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesLocation = selectedLocation === 'All' || item.location === selectedLocation;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const groupedItems = groupByCategory 
    ? filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, StorageItem[]>)
    : null;

  const ItemCard: React.FC<{ item: StorageItem }> = ({ item }) => {
    const hasUpcomingReminder = item.reminderDate && new Date(item.reminderDate) >= new Date();
    
    return (
      <div key={item.id} className="group bg-white rounded-2xl p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-200 transition-all relative">
        {hasUpcomingReminder && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg z-10 animate-bounce">
            <Bell size={12} />
          </div>
        )}
        <div className="flex gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-100">
            {item.photoUrl ? (
              <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                <div className="w-8 h-8 rounded" style={{ backgroundColor: item.color }} />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-slate-900 truncate pr-2 text-sm md:text-base">{item.name}</h4>
              <span className="text-[10px] md:text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md font-bold whitespace-nowrap">
                x{item.quantity}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-medium mb-1">{item.category}</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">{item.dimensions.width}x{item.dimensions.height}x{item.dimensions.depth} cm</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] md:text-xs text-slate-400 font-medium italic truncate max-w-[100px] md:max-w-[120px]">📍 {item.location || 'Sin ubicación'}</span>
            {item.reminderDate && (
              <span className="text-[9px] md:text-[10px] text-indigo-500 flex items-center gap-1 mt-0.5">
                <Calendar size={10} /> {new Date(item.reminderDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => onEdit(item)}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => onDelete(item.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">Tu Inventario</h2>
            <p className="text-slate-500 text-sm">Gestiona y localiza tus objetos fácilmente.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 md:flex-none min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl w-full focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all text-sm"
              />
            </div>
            <button 
              onClick={() => setGroupByCategory(!groupByCategory)}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-2 font-bold text-[10px] md:text-xs uppercase tracking-wider ${groupByCategory ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {groupByCategory ? <LayoutGrid size={18} /> : <ListFilter size={18} />}
              <span className="hidden sm:inline">{groupByCategory ? 'Desagrupar' : 'Agrupar'}</span>
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`md:hidden p-2.5 rounded-xl border transition-all flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider ${showFilters ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Filters Row - Responsive */}
        <div className={`${showFilters ? 'flex' : 'hidden'} md:flex flex-wrap gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in zoom-in duration-200`}>
          <div className="flex items-center gap-2 w-full md:w-auto pb-2 md:pb-0 border-b md:border-b-0 border-slate-100">
            <Filter size={16} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filtrar por:</span>
          </div>
          
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 md:flex-none px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="All">Categorías (Todas)</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={selectedLocation} 
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="flex-1 md:flex-none px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
          >
            <option value="All">Zonas (Todas)</option>
            {locations.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          {(selectedCategory !== 'All' || selectedLocation !== 'All' || searchTerm !== '') && (
            <button 
              onClick={() => { setSelectedCategory('All'); setSelectedLocation('All'); setSearchTerm(''); }}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline flex items-center gap-1 ml-auto"
            >
              <X size={12} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <PackageOpen className="text-slate-300 w-12 h-12" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">No hay coincidencias</h3>
          <p className="text-slate-400 max-w-xs text-sm">Intenta ajustar los filtros o busca algo diferente.</p>
        </div>
      ) : groupByCategory && groupedItems ? (
        <div className="space-y-8">
          {(Object.entries(groupedItems) as [string, StorageItem[]][]).map(([category, catItems]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-base md:text-lg font-bold text-slate-800">{category}</h3>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-[10px] font-bold">{catItems.length}</span>
                <div className="h-px bg-slate-200 flex-1"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {catItems.map(item => <ItemCard key={item.id} item={item} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredItems.map(item => <ItemCard key={item.id} item={item} />)}
        </div>
      )}
      <div className="pb-20 md:pb-0" />
    </div>
  );
};

export default InventoryList;
