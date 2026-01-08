import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, CreditCard, Building, Plane, Landmark, 
  Plus, ArrowLeftRight, CheckCircle2, Target, Wallet2, 
  TrendingUp, LayoutGrid, List, ChevronRight
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext'; // <--- Importamos el tema

interface DashboardItem {
  id: string; title: string; value: string; subLabel?: string;
  icon: React.ReactNode; iconBg: string; iconColor: string;
  route: string; span?: boolean; badge?: string; type: 'section' | 'card'; 
}

const MobileDashboard = () => {
  const navigate = useNavigate();
  const { accounts, goals } = useData();
  const { theme } = useTheme(); // <--- Usamos el tema
  
  // Detectamos si es modo oscuro
  const isDark = theme === 'dark' || theme === 'solid' || theme === 'dark-glass';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFab, setShowFab] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userName = "Michael";
  const userAvatar = "https://i.pravatar.cc/150?u=Michael"; 

  const totalCuentasSoles = accounts.filter(a => a.currency === 'S/').reduce((sum, a) => sum + a.balance, 0);
  const totalCuentasDolares = accounts.filter(a => a.currency === '$').reduce((sum, a) => sum + a.balance, 0);
  const pendingTasks = 3;
  const activeGoals = goals.length || 2;
  const walletsCount = 3;

  useEffect(() => {
    const resetTimer = () => {
      setShowFab(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setShowFab(false), 3000);
    };
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    resetTimer();
    return () => {
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const sectionsItems: DashboardItem[] = [
    { id: 'tasks', title: 'Tareas', value: pendingTasks.toString(), subLabel: 'Pendientes', icon: <CheckCircle2 size={20} />, iconBg: 'bg-blue-50', iconColor: 'text-[#007AFF]', route: '/tasks', type: 'section' },
    { id: 'goals', title: 'Metas', value: activeGoals.toString(), subLabel: 'En curso', icon: <Target size={20} />, iconBg: 'bg-green-50', iconColor: 'text-green-600', route: '/goals', type: 'section' },
    { id: 'wallets', title: 'Wallet', value: walletsCount.toString(), subLabel: 'Activas', icon: <Wallet2 size={20} />, iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', route: '/wallets', type: 'section' }
  ];

  const financialItems: DashboardItem[] = [
    { id: 'cards', title: 'Tarjetas', value: '-$46.2k', icon: <CreditCard size={20} />, iconBg: 'bg-red-50', iconColor: 'text-[#FF3B30]', route: '/cards', type: 'card' },
    { id: 'accounts', title: 'Cuentas', value: `S/ ${totalCuentasSoles.toLocaleString()}`, icon: <Wallet size={20} />, iconBg: 'bg-blue-50', iconColor: 'text-[#007AFF]', route: '/accounts', type: 'card' },
    { id: 'properties', title: 'Propiedades', value: '$130,000', icon: <Building size={20} />, iconBg: 'bg-blue-50', iconColor: 'text-[#007AFF]', route: '/properties', span: true, badge: '+5%', type: 'card' },
    { id: 'miles', title: 'Millas', value: '45,000 pts', icon: <Plane size={20} />, iconBg: 'bg-purple-50', iconColor: 'text-purple-500', route: '/miles', type: 'card' },
    
    // --- CORRECCIÓN AQUÍ: Ruta cambiada de /loans a /mortgage ---
    { id: 'loans', title: 'Hipoteca', value: '-$80,000', icon: <Landmark size={20} />, iconBg: 'bg-orange-50', iconColor: 'text-orange-500', route: '/mortgage', type: 'card' }
  ];

  const renderListItem = (item: DashboardItem) => (
    <button 
        key={item.id} 
        onClick={() => navigate(item.route)} 
        className={`w-full px-5 py-4 rounded-[35px] shadow-sm border flex items-center justify-between active:scale-[0.98] transition-all mb-3 
            ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100'}
        `}
    >
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-full ${item.iconBg} ${item.iconColor} flex items-center justify-center`}>{item.icon}</div>
        <div className="text-left">
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
              {item.type === 'section' ? item.subLabel : (item.id.includes('card') ? 'Deuda Total' : 'Saldo Disponible')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {item.type === 'section' ? (
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDark ? 'bg-zinc-800 text-gray-300' : 'bg-gray-100 text-slate-600'}`}>{item.value}</span>
        ) : (
            <span className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.value}</span>
        )}
        <ChevronRight size={18} className="text-gray-300" />
      </div>
    </button>
  );

  return (
    <div className={`h-screen w-full font-sans overflow-hidden flex flex-col relative transition-colors duration-500 ${isDark ? 'bg-black text-white' : 'bg-[#FCFCFC] text-slate-800'}`}>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      
      <div className="flex-1 overflow-y-auto pt-12 pb-32 px-5 no-scrollbar touch-pan-y">
        <div className="flex justify-between items-center mb-6">
          <div className={`pl-1.5 pr-4 py-1.5 rounded-full shadow-sm border flex items-center gap-3 ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100'}`}>
            <img src={userAvatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover shadow-sm"/>
            <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}>Hola, {userName}</span>
          </div>
          <button 
            onClick={(e) => {e.stopPropagation(); setViewMode(viewMode === 'grid' ? 'list' : 'grid')}} 
            className={`w-11 h-11 rounded-full flex items-center justify-center shadow-sm border active:scale-95 transition-transform text-[#007AFF] ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100'}`}
          >
            {viewMode === 'grid' ? <List size={20} /> : <LayoutGrid size={20} />}
          </button>
        </div>

        {/* TARJETA DE SALDO PRINCIPAL */}
        <div className={`rounded-[2rem] p-6 shadow-sm border mb-8 ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-lg">S/</div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Saldo Total</p>
                <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCuentasSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h2>
            </div>
          </div>
          <div className={`h-px w-full my-2 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}></div>
          <div className="flex items-center gap-4 mt-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-lg">$</div>
            <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ahorros USD</p>
                <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCuentasDolares.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h2>
            </div>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="flex justify-between gap-3 mb-8">
            {sectionsItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => navigate(item.route)} 
                className={`flex-1 p-1.5 rounded-full shadow-sm border flex items-center group active:scale-95 transition-all ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100'}`}
              >
                <div className={`h-10 w-10 bg-[#007AFF] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:bg-blue-600 transition-colors`}>{item.value}</div>
                <span className={`flex-1 text-center text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{item.title}</span>
              </button>
            ))}
          </div>
        ) : (<div className="flex flex-col">{sectionsItems.map((item) => renderListItem(item))}</div>)}

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-4">
            {financialItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => navigate(item.route)} 
                className={`
                  p-5 rounded-[1.5rem] shadow-sm border 
                  flex active:scale-[0.98] transition-all relative
                  ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100'}
                  ${item.span 
                    ? 'col-span-2 flex-row items-center justify-start gap-4' 
                    : 'flex-col justify-between h-40'
                  }
                `}
              >
                <div className={`${item.span ? 'w-12 h-12' : 'w-10 h-10'} ${item.iconBg} ${item.iconColor} rounded-xl flex items-center justify-center`}>
                  {item.icon}
                </div>
                
                <div className="text-left"> 
                  <p className="text-sm text-gray-500 font-medium mb-1">{item.title}</p>
                  <p className={`font-bold tracking-tight ${item.span ? 'text-2xl' : 'text-xl'} ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.value}
                  </p>
                </div>

                {item.badge && item.span && <div className="absolute top-5 right-5 bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><TrendingUp size={12} /> {item.badge}</div>}
              </button>
            ))}
          </div>
        ) : (<div className="flex flex-col">{financialItems.map((item) => renderListItem(item))}</div>)}
      </div>

      <div className={`fixed bottom-8 right-6 flex flex-col gap-4 items-end transition-all duration-500 ease-in-out z-50 ${showFab ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        <button className={`w-12 h-12 rounded-full shadow-lg border flex items-center justify-center text-[#007AFF] active:scale-90 transition-transform ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100'}`}>
            <ArrowLeftRight size={20} />
        </button>
        <button className="w-16 h-16 bg-[#007AFF] rounded-full shadow-xl shadow-blue-500/30 flex items-center justify-center text-white active:scale-90 transition-transform">
            <Plus size={32} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default MobileDashboard;