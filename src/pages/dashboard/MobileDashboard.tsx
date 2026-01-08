import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useSunatExchangeRate } from '@/hooks/useSunatExchangeRate';
import { AccountCards } from '@/components/AccountCards';
import { 
  Bell, Settings, CreditCard, Home, HandCoins, Wallet, 
  Target, CheckSquare, Building2, Plane, AlertCircle, 
  RefreshCw, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';

export const MobileDashboard = () => {
  const navigate = useNavigate();
  const { accounts, creditCards, mortgage, goals, milesPoints, properties, tasks, loans, wallets, transactions } = useData();
  const { exchangeRate, loading: loadingRate, refresh, isRefreshing } = useSunatExchangeRate();

  // --- 1. LÓGICA DE CÁLCULO (Traída del Escritorio) ---
  
  // Saldos
  const accountsUSD = accounts.filter(acc => acc.currency === '$');
  const accountsPEN = accounts.filter(acc => acc.currency === 'S/');
  const totalSavingsUSD = accountsUSD.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const totalSavingsPEN = accountsPEN.reduce((sum, acc) => sum + Number(acc.balance), 0);
  
  // Calculamos un "Patrimonio Total Estimado" en USD para el Header
  const exchangeVal = exchangeRate?.venta || 3.75;
  const totalGlobalUSD = totalSavingsUSD + (totalSavingsPEN / exchangeVal);

  // Deudas y Progresos
  const totalCreditDebt = creditCards.reduce((sum, card) => sum + Number(card.balance), 0);
  
  const mortgageProgress = mortgage.totalAmount > 0 
    ? ((mortgage.paidAmount / mortgage.totalAmount) * 100).toFixed(0) 
    : '0';

  const loansPaid = loans.reduce((sum, loan) => sum + loan.cuotasPagadas, 0);
  const loansTotal = loans.reduce((sum, loan) => sum + loan.plazoMeses, 0);
  const loansProgress = loansTotal > 0 ? ((loansPaid / loansTotal) * 100).toFixed(0) : '0';

  const goalsProgress = goals.length > 0
    ? (goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount) * 100, 0) / goals.length).toFixed(0)
    : '0';

  const tasksProgress = tasks.length > 0
    ? (tasks.reduce((sum, task) => {
        const completed = task.subtasks.filter(st => st.completed).length;
        return sum + (task.subtasks.length > 0 ? (completed / task.subtasks.length) * 100 : 0);
      }, 0) / tasks.length).toFixed(0)
    : '0';

  const totalProperties = properties.reduce((sum, prop) => sum + Number(prop.estimatedValue), 0);
  const totalMiles = milesPoints?.programs?.reduce((sum, p) => sum + Number(p.points), 0) || 0;
  const totalWallets = wallets.reduce((sum, w) => sum + Number(w.saldo), 0); // Simplificado sin conv

  // Alertas de Pago (Próximos 7 días)
  const upcomingPayments = creditCards.filter(card => {
    const daysUntil = Math.ceil((new Date(card.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  });

  // Transacciones recientes (Últimas 5)
  const recentTx = transactions.slice(0, 5);

  // --- 2. INTERFAZ VISUAL (Diseño iPhone) ---

  return (
    <div className="min-h-screen bg-gray-50 pb-36"> {/* Padding extra para que no se corte al final */}
      
      {/* HEADER VERDE */}
      <div className="bg-emerald-600 text-white px-6 pt-10 pb-8 rounded-b-[32px] shadow-lg relative z-10">
        
        {/* Barra Superior: Saludo + Tipo de Cambio */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-emerald-200 text-xs font-medium uppercase tracking-wider">Patrimonio Disponible</p>
            <h1 className="text-3xl font-bold mt-1 tracking-tight">
              $ {totalGlobalUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h1>
          </div>

          {/* Widget Tipo de Cambio (Pequeño y funcional) */}
          <div className="flex flex-col items-end">
             <div className="flex items-center gap-2 bg-emerald-700/40 px-3 py-1.5 rounded-lg backdrop-blur-md border border-emerald-500/20">
                {loadingRate ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-200" />
                ) : (
                    <>
                        <span className="text-[10px] text-emerald-200 font-medium">USD/PEN</span>
                        <span className="text-sm font-bold text-white">
                            {exchangeRate?.venta.toFixed(3)}
                        </span>
                        <button onClick={refresh} disabled={isRefreshing}>
                             <RefreshCw className={`w-3 h-3 text-emerald-200 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                    </>
                )}
             </div>
          </div>
        </div>

        {/* Botones de Acción Rápida (Estéticos) */}
        <div className="flex gap-4 mt-2">
            <button onClick={() => navigate('/settings')} className="bg-emerald-500/30 p-2 rounded-full backdrop-blur-md hover:bg-emerald-500/50 transition">
                <Settings className="w-5 h-5 text-white" />
            </button>
            <button className="bg-emerald-500/30 p-2 rounded-full backdrop-blur-md hover:bg-emerald-500/50 transition">
                <Bell className="w-5 h-5 text-white" />
            </button>
             {/* Pestañas decorativas */}
            <div className="flex-1 flex bg-emerald-800/30 p-1 rounded-full backdrop-blur-sm">
                <button className="flex-1 bg-white text-emerald-700 py-1.5 rounded-full text-xs font-bold shadow-sm">
                    Resumen
                </button>
                <button className="flex-1 text-emerald-100 py-1.5 text-xs font-medium">
                    Análisis
                </button>
            </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="px-5 -mt-6 relative z-20 space-y-5">
        
        {/* 1. ALERTAS DE PAGO (Solo si hay pagos próximos) */}
        {upcomingPayments.length > 0 && (
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3 shadow-sm animate-pulse">
                <div className="bg-orange-100 p-2 rounded-full text-orange-500">
                    <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className="text-xs font-bold text-orange-800 uppercase">Pagos Pendientes</h4>
                    <p className="text-sm text-orange-700 leading-tight">
                        Tienes {upcomingPayments.length} tarjetas por vencer en 7 días.
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/cards')}
                    className="bg-white text-orange-600 px-3 py-1 rounded-lg text-xs font-bold shadow-sm"
                >
                    Ver
                </button>
            </div>
        )}

        {/* 2. CUENTAS BANCARIAS (Componente Grilla) */}
        <AccountCards accounts={accounts} />

        {/* 3. MENU DE MÓDULOS (La funcionalidad completa del escritorio convertida en botones móviles) */}
        <div>
            <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wider ml-1 mb-3">
                Mis Finanzas
            </h3>
            <div className="grid grid-cols-2 gap-3">
                
                {/* Tarjetas de Crédito */}
                <MobileCard 
                    title="Tarjetas"
                    value={`$ ${totalCreditDebt.toLocaleString()}`}
                    subtitle={`${creditCards.length} activas`}
                    icon={CreditCard}
                    color="bg-purple-50 text-purple-600"
                    onClick={() => navigate('/cards')}
                />

                {/* Hipoteca */}
                <MobileCard 
                    title="Hipoteca"
                    value={`${mortgageProgress}%`}
                    subtitle="Pagado"
                    icon={Home}
                    color="bg-blue-50 text-blue-600"
                    onClick={() => navigate('/mortgage')}
                />

                 {/* Préstamos */}
                 <MobileCard 
                    title="Préstamos"
                    value={`${loansProgress}%`}
                    subtitle="Completado"
                    icon={HandCoins}
                    color="bg-amber-50 text-amber-600"
                    onClick={() => navigate('/loans')}
                />

                {/* Metas */}
                <MobileCard 
                    title="Metas"
                    value={`${goalsProgress}%`}
                    subtitle="Logrado"
                    icon={Target}
                    color="bg-pink-50 text-pink-600"
                    onClick={() => navigate('/goals')}
                />

                 {/* Billeteras */}
                 <MobileCard 
                    title="Billeteras"
                    value={`$ ${totalWallets.toLocaleString()}`}
                    subtitle="Efectivo"
                    icon={Wallet}
                    color="bg-teal-50 text-teal-600"
                    onClick={() => navigate('/wallets')}
                />
                
                {/* Tareas */}
                <MobileCard 
                    title="Tareas"
                    value={`${tasksProgress}%`}
                    subtitle="Avance"
                    icon={CheckSquare}
                    color="bg-indigo-50 text-indigo-600"
                    onClick={() => navigate('/tasks')}
                />

                {/* Propiedades (Ancho completo si quieres destacar) */}
                <div 
                    onClick={() => navigate('/properties')}
                    className="col-span-2 bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between active:scale-95 transition-transform cursor-pointer border border-gray-100"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-50 p-2.5 rounded-xl text-slate-600">
                            <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Propiedades</p>
                            <p className="font-bold text-gray-800 text-sm">$ {totalProperties.toLocaleString()}</p>
                        </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-300" />
                </div>
            </div>
        </div>

        {/* 4. TRANSACCIONES RECIENTES */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-8">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700 text-sm">Movimientos Recientes</h3>
                <span className="text-xs text-emerald-600 font-medium cursor-pointer">Ver todo</span>
            </div>
            
            <div className="space-y-5">
                {recentTx.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No hay movimientos aún</p>
                ) : (
                    recentTx.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                                    tx.type === 'deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'
                                }`}>
                                    {tx.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{tx.description}</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                                        {new Date(tx.date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <span className={`font-bold text-sm ${
                                tx.type === 'deposit' ? 'text-emerald-600' : 'text-gray-800'
                            }`}>
                                {tx.type === 'deposit' ? '+' : '-'} {Number(tx.amount).toFixed(2)}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

// --- Sub-componente para las tarjetas pequeñas ---
const MobileCard = ({ title, value, subtitle, icon: Icon, color, onClick }: any) => (
    <div 
        onClick={onClick}
        className="bg-white p-3 rounded-2xl shadow-sm flex flex-col justify-between h-28 border border-gray-100 active:scale-95 transition-transform cursor-pointer"
    >
        <div className={`self-start p-2 rounded-xl ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-xs text-gray-400 font-medium mb-0.5">{title}</p>
            <p className="font-bold text-gray-800 text-lg leading-tight">{value}</p>
            <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>
        </div>
    </div>
);