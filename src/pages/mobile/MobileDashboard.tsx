import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, CreditCard, Building, Plane, Landmark, 
  Plus, ArrowLeftRight, CheckCircle2, Target, Wallet2, 
  TrendingUp, LayoutGrid, List, ChevronRight
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardItem {
  id: string; title: string; value: string; subLabel?: string;
  icon: React.ReactNode; iconBg: string; iconColor: string;
  route: string; span?: boolean; badge?: string; type: 'section' | 'card'; 
}

const MobileDashboard = () => {
  const navigate = useNavigate();
  const { accounts, goals } = useData();
  const { theme } = useTheme();
  
  const isDark = theme === 'dark' || theme === 'solid' || theme === 'dark-glass';
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFab, setShowFab] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const userName = "Michael";
  const userAvatar = "https://i.pravatar.cc/300?u=Michael"; 

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
    { id: 'loans', title: 'Hipoteca', value: '-$80,000', icon: <Landmark size={20} />, iconBg: 'bg-orange-50', iconColor: 'text-orange-500', route: '/mortgage', type: 'card' }
  ];

  // --- ESTILOS 3D ---
  const card3DStyle = isDark 
    ? 'bg-gradient-to-b from-[#2c2c2e] to-[#1c1c1e] shadow-[0_4px_12px_rgba(0,0,0,0.3)] border-[#3a3a3c]' 
    : 'bg-gradient-to-b from-white to-gray-50 shadow-[0_4px_16px_rgb(0_0_0/0.06),0_2px_4px_rgb(0_0_0/0.04)] border-white/80';

  const card3DStyleStrong = isDark 
  ? 'bg-gradient-to-br from-[#3a3a3c] to-[#222224] shadow-[0_8px_20px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] border-[#454547]' 
  : 'bg-gradient-to-br from-white to-gray-100 shadow-[0_8px_25px_rgb(0_0_0/0.1),inset_0_1px_0_rgba(255,255,255,0.8)] border-white';

  // Iconos internos más cuadrados (rounded-lg)
  const iconContainerStyle = "rounded-lg flex items-center justify-center shadow-sm";

  const renderListItem = (item: DashboardItem) => (
    <button 
        key={item.id} 
        onClick={() => navigate(item.route)} 
        // Tarjeta de lista más cuadrada: rounded-[16px]
        className={`w-full px-5 py-4 rounded-[16px] border flex items-center justify-between active:scale-[0.97] transition-all duration-200 mb-2 relative overflow-hidden
            ${card3DStyle}
            before:absolute before:inset-0 before:bg-white/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity
        `}
    >
      <div className="flex items-center gap-4 relative z-10">
        {/* Icono interno más cuadrado: rounded-lg */}
        <div className={`w-11 h-11 rounded-lg ${item.iconBg} ${item.iconColor} flex items-center justify-center shadow-sm`}>{item.icon}</div>
        <div className="text-left">
          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
          <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>
              {item.type === 'section' ? item.subLabel : (item.id.includes('card') ? 'Deuda Total' : 'Saldo Disponible')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 relative z-10">
        {item.type === 'section' ? (
            // PÍLDORA NUMÉRICA: rounded-full (CÍRCULO PERFECTO)
            <span className={`text-xs font-bold h-6 min-w-[1.5rem] px-2 flex items-center justify-center rounded-full shadow-inner ${isDark ? 'bg-zinc-800/80 text-gray-300' : 'bg-gray-100/80 text-slate-600'}`}>{item.value}</span>
        ) : (
            <span className={`font-bold text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>{item.value}</span>
        )}
        <ChevronRight size={18} className="text-gray-300" />
      </div>
    </button>
  );

  return (
    <div className={`h-screen w-full font-sans overflow-hidden flex flex-col relative transition-colors duration-500 ${isDark ? 'bg-black text-white' : 'bg-[#F2F4F7] text-slate-800'}`}>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      
      <div className="flex-1 overflow-y-auto pt-6 pb-32 px-5 no-scrollbar touch-pan-y">
        
        {/* === HEADER TIPO LLAVE (O=) MÁS CUADRADO === */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            
            {/* 1. LA CABEZA (Avatar) - rounded-[16px] */}
            <div className={`relative z-20 w-20 h-20 rounded-[16px] p-1 ${card3DStyleStrong}`}>
               {/* Imagen interna rounded-[12px] */}
               <img src={userAvatar} alt="Avatar" className="w-full h-full rounded-[12px] object-cover shadow-inner"/>
               <div className={`absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-[3px] ${isDark ? 'border-[#2c2c2e]' : 'border-white'} rounded-full`}></div>
            </div>

            {/* 2. EL CUERPO (Nombre) - rounded-r-[16px] */}
            <div className={`relative z-10 -ml-7 pl-9 pr-6 py-3 rounded-r-[16px] rounded-l-none h-14 flex items-center shadow-sm border-y border-r backdrop-blur-md ${isDark ? 'bg-[#1c1c1e]/90 border-[#3a3a3c]' : 'bg-white/90 border-white'} ${card3DStyle}`}>
              <span className={`font-bold text-lg whitespace-nowrap ${isDark ? 'text-white' : 'text-slate-800'}`}>Hola, {userName}</span>
            </div>

          </div>
          
          {/* Botón Vista - rounded-[12px] */}
          <button 
            onClick={(e) => {e.stopPropagation(); setViewMode(viewMode === 'grid' ? 'list' : 'grid')}} 
            className={`w-12 h-12 rounded-[12px] flex items-center justify-center shadow-md border active:scale-90 transition-transform text-[#007AFF] ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-white'} ${card3DStyle}`}
          >
            {viewMode === 'grid' ? <List size={24} /> : <LayoutGrid size={24} />}
          </button>
        </div>

        {/* TARJETA DE SALDO - rounded-[20px] (Más cuadrada) */}
        <div className={`rounded-[20px] p-6 mb-5 border relative overflow-hidden ${card3DStyleStrong}`}>
           <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/20' : 'via-white/60'} to-transparent`}></div>
           
           <div className="relative z-10 flex flex-col gap-4">
              
              {/* FILA 1: SOLES */}
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    {/* Icono interno rounded-lg */}
                    <div className={`w-10 h-10 rounded-lg bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/20`}>S/</div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total Soles</p>
                 </div>
                 <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                    {totalCuentasSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                 </h2>
              </div>

              <div className={`h-px w-full ${isDark ? 'bg-zinc-700/50' : 'bg-gray-200/50'}`}></div>

              {/* FILA 2: DÓLARES */}
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    {/* Icono interno rounded-lg */}
                    <div className={`w-10 h-10 rounded-lg bg-blue-50 text-[#007AFF] flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/20`}>$</div>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Ahorros USD</p>
                 </div>
                 <h2 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                    {totalCuentasDolares.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                 </h2>
              </div>

           </div>
        </div>

        {/* BOTONES DE SECCIÓN */}
        {viewMode === 'grid' ? (
          <div className="flex justify-between gap-3 mb-5">
            {sectionsItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => navigate(item.route)} 
                // Botón principal: rounded-[12px] (Más cuadrado)
                className={`flex-1 p-2 rounded-[12px] border flex items-center group active:scale-[0.96] transition-all duration-200 relative overflow-hidden ${card3DStyle}`}
              >
                {/* PÍLDORA NUMÉRICA: rounded-full (CÍRCULO PERFECTO) */}
                <div className={`h-11 w-11 bg-[#007AFF] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30 z-10`}>{item.value}</div>
                <span className={`flex-1 text-center text-sm font-semibold z-10 ${isDark ? 'text-gray-200' : 'text-slate-700'}`}>{item.title}</span>
              </button>
            ))}
          </div>
        ) : (<div className="flex flex-col mb-6 space-y-2">{sectionsItems.map((item) => renderListItem(item))}</div>)}

        {/* GRID DE TARJETAS FINANCIERAS - rounded-[20px] */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3">
            {financialItems.map((item) => (
              <button 
                key={item.id} 
                onClick={() => navigate(item.route)} 
                className={`
                  p-5 rounded-[20px] border 
                  flex active:scale-[0.97] transition-all duration-200 relative overflow-hidden
                  ${card3DStyleStrong}
                  ${item.span 
                    ? 'col-span-2 flex-row items-center justify-start gap-5' 
                    : 'flex-col justify-between h-44'
                  }
                `}
              >
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${isDark ? 'via-white/10' : 'via-white/40'} to-transparent`}></div>

                {/* Icono interno rounded-lg */}
                <div className={`${item.span ? 'w-14 h-14' : 'w-12 h-12'} ${item.iconBg} ${item.iconColor} ${iconContainerStyle} z-10`}>
                  {item.icon}
                </div>
                
                <div className="text-left z-10"> 
                  <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.title}</p>
                  <p className={`font-extrabold tracking-tight ${item.span ? 'text-3xl' : 'text-2xl'} ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.value}
                  </p>
                </div>

                {item.badge && item.span && (
                    // Badge de porcentaje: rounded-lg (un poco cuadrado)
                    <div className="absolute top-6 right-6 bg-green-100/80 backdrop-blur-sm text-green-700 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm z-10">
                        <TrendingUp size={12} /> {item.badge}
                    </div>
                )}
              </button>
            ))}
          </div>
        ) : (<div className="flex flex-col space-y-2">{financialItems.map((item) => renderListItem(item))}</div>)}
      </div>

      {/* BOTONES FLOTANTES (FABs) - rounded-[16px] (Squarcle) */}
      <div className={`fixed bottom-8 right-6 flex flex-col gap-4 items-end transition-all duration-500 ease-in-out z-50 ${showFab ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0'}`}>
        <button className={`w-14 h-14 rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] border flex items-center justify-center text-[#007AFF] active:scale-90 transition-transform ${isDark ? 'bg-gradient-to-b from-[#3a3a3c] to-[#2c2c2e] border-[#3a3a3c]' : 'bg-gradient-to-b from-white to-gray-50 border-white'}`}>
            <ArrowLeftRight size={24} />
        </button>
        <button className="w-16 h-16 rounded-[16px] flex items-center justify-center text-white active:scale-90 transition-transform bg-gradient-to-b from-[#3395ff] to-[#007AFF] shadow-[0_10px_25px_rgba(0,122,255,0.4),0_4px_10px_rgba(0,122,255,0.2)] border border-blue-400/20">
            <Plus size={32} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default MobileDashboard;