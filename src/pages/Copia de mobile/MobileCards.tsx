import React, { useState } from 'react';
import { useData, CreditCard } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CreditCard as CardIcon, Calendar, TrendingUp, DollarSign, X, ShoppingBag } from 'lucide-react';

export const MobileCards = () => {
  const navigate = useNavigate();
  const { creditCards, addCreditCard, updateCreditCard } = useData(); // Asumiendo que updateCreditCard maneja transacciones o saldo
  
  // Estados
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  
  // Modal de Gasto
  const [showExpense, setShowExpense] = useState(false);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  // --- LOGICA: NUEVO GASTO ---
  const handleExpense = () => {
    if (!selectedCard) return;
    // Aquí actualizamos el saldo de la tarjeta (Deuda aumenta)
    const newBalance = Number(selectedCard.balance) + Number(amount);
    
    // Si tuvieras una función para agregar transacción a tarjeta, la usarías aquí.
    // Por ahora simulamos actualizando el saldo:
    updateCreditCard(selectedCard.id, { balance: newBalance });
    
    setShowExpense(false);
    setAmount('');
    setDesc('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HEADER PURPURA (Diferente color para distinguir sección) */}
      <div className="bg-indigo-600 text-white px-4 pt-10 pb-6 rounded-b-[24px] shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={() => view === 'list' ? navigate('/') : setView('list')} className="p-2 bg-indigo-500/30 rounded-full backdrop-blur-md">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-xl font-bold">
                    {view === 'list' ? 'Mis Tarjetas' : selectedCard?.name}
                </h1>
                {view === 'detail' && selectedCard && (
                    <p className="text-indigo-200 text-sm">
                        Disponible: {selectedCard.currency} {(selectedCard.limit - selectedCard.balance).toLocaleString()}
                    </p>
                )}
            </div>
        </div>
      </div>

      {/* LISTA DE TARJETAS */}
      {view === 'list' && (
        <div className="p-5 space-y-4">
            {creditCards.map(card => {
                const available = card.limit - card.balance;
                const progress = (card.balance / card.limit) * 100;

                return (
                    <div 
                        key={card.id}
                        onClick={() => { setSelectedCard(card); setView('detail'); }}
                        className="bg-slate-800 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden active:scale-95 transition-transform"
                    >
                        {/* Decoración Fondo */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <CardIcon className="w-8 h-8 text-indigo-300" />
                            <span className="font-mono text-xs text-slate-400">{card.dueDate}</span>
                        </div>

                        <div className="relative z-10">
                            <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">{card.name}</p>
                            <h3 className="text-2xl font-bold tracking-tight">{card.currency} {card.balance.toLocaleString()}</h3>
                            <p className="text-xs text-indigo-300 mt-1">Deuda Actual</p>
                        </div>

                        {/* Barra de Progreso (Límite) */}
                        <div className="mt-4 bg-slate-700 h-1.5 rounded-full overflow-hidden relative z-10">
                            <div className={`h-full rounded-full ${progress > 80 ? 'bg-red-500' : 'bg-indigo-400'}`} style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between mt-1 relative z-10">
                            <span className="text-[10px] text-slate-500">Disp: {available.toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500">Lim: {card.limit.toLocaleString()}</span>
                        </div>
                    </div>
                );
            })}
        </div>
      )}

      {/* DETALLE TARJETA */}
      {view === 'detail' && selectedCard && (
        <div className="p-5 animate-fade-in">
            {/* Acciones */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                    onClick={() => setShowExpense(true)}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 flex flex-col items-center gap-2 active:bg-gray-50"
                >
                    <div className="bg-indigo-50 p-2 rounded-full text-indigo-600">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-gray-700 text-sm">Registrar Gasto</span>
                </button>
                <button 
                    className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50 flex flex-col items-center gap-2 active:bg-gray-50"
                >
                    <div className="bg-emerald-50 p-2 rounded-full text-emerald-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <span className="font-bold text-gray-700 text-sm">Pagar Tarjeta</span>
                </button>
            </div>

            <h3 className="font-bold text-gray-500 text-xs uppercase mb-3">Historial Reciente</h3>
            <div className="bg-white rounded-2xl p-4 shadow-sm min-h-[300px]">
                <p className="text-center text-gray-400 py-10 text-sm">
                   Aquí aparecerán los gastos registrados de esta tarjeta.
                </p>
            </div>
        </div>
      )}

      {/* MODAL NUEVO GASTO */}
      {showExpense && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end backdrop-blur-sm animate-in slide-in-from-bottom-10">
            <div className="bg-white w-full p-6 rounded-t-[32px] space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-indigo-900">Nuevo Gasto</h2>
                    <button onClick={() => setShowExpense(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="bg-indigo-50 p-4 rounded-2xl">
                    <label className="text-xs text-indigo-400 font-bold uppercase">Monto</label>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-indigo-300">{selectedCard?.currency}</span>
                        <input 
                            type="number" autoFocus value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full bg-transparent text-4xl font-bold text-indigo-900 focus:outline-none" placeholder="0.00"
                        />
                    </div>
                </div>
                <input 
                    value={desc} onChange={e => setDesc(e.target.value)} placeholder="¿En qué gastaste?"
                    className="w-full border-b border-gray-200 py-3 text-lg focus:outline-none focus:border-indigo-500"
                />
                <button onClick={handleExpense} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-500/30">
                    Confirmar Gasto
                </button>
                <div className="h-6"></div>
            </div>
        </div>
      )}

    </div>
  );
};