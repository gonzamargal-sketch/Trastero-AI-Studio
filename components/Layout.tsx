
import React, { useState } from 'react';
import { Package, Box, Lightbulb, PlusCircle, LayoutDashboard, Tags, Bell, Settings, X } from 'lucide-react';
import { AppView, StorageItem } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  onAddItem: () => void;
  items: StorageItem[];
}

const Layout: React.FC<LayoutProps> = ({ children, activeView, setActiveView, onAddItem, items }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const reminders = items.filter(item => item.reminderDate && new Date(item.reminderDate) >= new Date())
    .sort((a, b) => new Date(a.reminderDate!).getTime() - new Date(b.reminderDate!).getTime());

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Header con soporte para Safe Areas */}
      <header className="flex items-center justify-between px-4 md:px-6 pt-10 pb-3 md:py-4 bg-white border-b border-slate-200 shadow-sm z-30 safe-top">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 md:p-2 rounded-lg shadow-sm">
            <Box className="text-white w-5 h-5 md:w-6 md:h-6" />
          </div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
            SmartStorage <span className="text-indigo-600 hidden xs:inline">3D</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-full transition-all relative"
            >
              <Bell size={22} />
              {reminders.length > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold border-2 border-white">
                  {reminders.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="fixed inset-x-4 md:absolute md:inset-auto md:right-0 mt-3 md:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in slide-in-from-top-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Bell size={18} className="text-indigo-600" /> Recordatorios
                  </h3>
                  <button onClick={() => setShowNotifications(false)} className="md:hidden p-1">
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>
                <div className="space-y-3 max-h-64 overflow-auto pb-2">
                  {reminders.length > 0 ? reminders.map(item => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-slate-800">{item.name}</span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                          {new Date(item.reminderDate!).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 italic">{item.reminderNote || 'Revisar estado'}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 text-center py-4">No hay recordatorios próximos.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={onAddItem}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-full font-bold transition-all shadow-md active:scale-95 text-sm"
          >
            <PlusCircle size={20} />
            <span className="hidden xs:inline">Añadir</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar for Tablet/Desktop */}
        <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col p-4 gap-2 z-10 shadow-sm">
          <NavItem 
            icon={<LayoutDashboard />} 
            label="Inventario" 
            active={activeView === 'inventory'} 
            onClick={() => setActiveView('inventory')} 
          />
          <NavItem 
            icon={<Tags />} 
            label="Categorías" 
            active={activeView === 'categories'} 
            onClick={() => setActiveView('categories')} 
          />
          <NavItem 
            icon={<Package />} 
            label="Planificador 3D" 
            active={activeView === 'planner'} 
            onClick={() => setActiveView('planner')} 
          />
          <NavItem 
            icon={<Lightbulb />} 
            label="Optimización AI" 
            active={activeView === 'ai-insights'} 
            onClick={() => setActiveView('ai-insights')} 
          />
          <div className="mt-auto border-t border-slate-100 pt-2">
            <NavItem 
              icon={<Settings />} 
              label="Configuración" 
              active={activeView === 'settings'} 
              onClick={() => setActiveView('settings')} 
            />
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-auto relative bg-slate-50 pb-20 md:pb-0" onClick={() => { if(showNotifications) setShowNotifications(false); }}>
          {children}
        </main>

        {/* Bottom Nav for Mobile con soporte para Safe Areas */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 pt-2 pb-6 flex justify-around items-center z-40 safe-bottom">
          <MobileNavItem icon={<LayoutDashboard size={20} />} active={activeView === 'inventory'} onClick={() => setActiveView('inventory')} />
          <MobileNavItem icon={<Tags size={20} />} active={activeView === 'categories'} onClick={() => setActiveView('categories')} />
          <MobileNavItem icon={<Package size={24} />} active={activeView === 'planner'} onClick={() => setActiveView('planner')} highlight />
          <MobileNavItem icon={<Lightbulb size={20} />} active={activeView === 'ai-insights'} onClick={() => setActiveView('ai-insights')} />
          <MobileNavItem icon={<Settings size={20} />} active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </nav>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all w-full ${
        active 
          ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={active ? 'text-indigo-600' : 'text-slate-400'}>{icon}</span>
      <span className="font-medium">{label}</span>
    </button>
  );
};

const MobileNavItem: React.FC<{ icon: React.ReactNode, active: boolean, onClick: () => void, highlight?: boolean }> = ({ icon, active, onClick, highlight }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
        highlight 
          ? (active ? 'bg-indigo-600 text-white -translate-y-4 shadow-lg scale-110' : 'bg-slate-100 text-indigo-600 -translate-y-2')
          : (active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400')
      }`}
    >
      {icon}
    </button>
  );
};

export default Layout;
