import React, { useState } from 'react';
import { useData, Account } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Wallet, X, ArrowUpRight, ArrowDownLeft, Trash2, Save 
} from 'lucide-react';

export const MobileAccounts = () => {
  const navigate = useNavigate();
  const { accounts, addAccount, deleteAccount, addTransaction, transactions } = useData();
  
  // Estados para controlar qué pantalla vemos
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedAcc, setSelectedAcc] = useState<Account | null>(null);
  
  // Estados para formularios (Depósitos/Retiros)
  const [txType, setTxType] = useState<'deposit' | 'withdrawal' | null>(null);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  // --- LOGICA: CREAR CUENTA ---
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    addAccount({
        name: formData.get('name') as string,
        balance: Number(formData.get('balance')),
        currency: formData.get('currency') as '$' | 'S/',
        type: 'savings',
        imageUrl: ''
    });
    setView('list');
  };

  // --- LOGICA: TRANSACCIONES ---
  const handleTransaction = () => {
    if (!selectedAcc || !txType) return;
    addTransaction({
        accountId: selectedAcc.id,
        amount: Number(amount),
        type: txType,
        description: desc || (txType === 'deposit' ? 'Depósito' : 'Retiro'),
        date: new Date().toISOString()
    });
    setTxType(null); // Cerrar modal
    setAmount('');
    setDesc('');
  };

  // --- FILTRO DE TRANSACCIONES DE LA CUENTA SELECCIONADA ---
  const accTransactions = transactions.filter(t => t.accountId === selectedAcc?.id);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* ================= HEADER VERDE ================= */}
      <div className="bg-emerald-600 text-white px-4 pt-10 pb-6 rounded-b-[24px] shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={() => view === 'list' ? navigate('/') : setView('list')} className="p-2 bg-emerald-500/30 rounded-full backdrop-blur-md">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-xl font-bold">
                    {view === 'list' ? 'Mis Cuentas' : view === 'create' ? 'Nueva Cuenta' : selectedAcc?.name}
                </h1>
                {view === 'detail' && selectedAcc && (
                    <p className="text-emerald-100 text-sm">
                        {selectedAcc.currency} {Number(selectedAcc.balance).toLocaleString()}
                    </p>
                )}
            </div>
        </div>
      </div>

      {/* ================= VISTA 1: LISTA DE CUENTAS ================= */}
      {view === 'list' && (
        <div className="p-5 space-y-4">
            {accounts.map(acc => (
                <div 
                    key={acc.id}
                    onClick={() => { setSelectedAcc(acc); setView('detail'); }}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center active:scale-95 transition-transform"
                >
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700">{acc.name}</h3>
                            <p className="text-xs text-gray-400 uppercase">{acc.type === 'savings' ? 'Ahorros' : 'Corriente'}</p>
                        </div>
                    </div>
                    <p className="font-bold text-lg text-gray-800">
                        {acc.currency} {Number(acc.balance).toLocaleString()}
                    </p>
                </div>
            ))}

            {/* BOTÓN FLOTANTE PARA CREAR */}
            <button 
                onClick={() => setView('create')}
                className="fixed bottom-24 right-6 bg-emerald-600 text-white p-4 rounded-full shadow-lg shadow-emerald-500/40 active:scale-90 transition-transform"
            >
                <Plus className="w-6 h-6" />
            </button>
        </div>
      )}

      {/* ================= VISTA 2: CREAR CUENTA ================= */}
      {view === 'create' && (
        <form onSubmit={handleCreate} className="p-6 space-y-6 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Nombre de la Cuenta</label>
                    <input name="name" required className="w-full text-lg font-bold border-b border-gray-200 py-2 focus:outline-none focus:border-emerald-500" placeholder="Ej. Ahorros Viaje" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Moneda</label>
                    <select name="currency" className="w-full bg-transparent text-lg font-bold border-b border-gray-200 py-2">
                        <option value="$">Dólares ($)</option>
                        <option value="S/">Soles (S/)</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 uppercase">Saldo Inicial</label>
                    <input name="balance" type="number" step="0.01" required className="w-full text-2xl font-bold border-b border-gray-200 py-2 focus:outline-none focus:border-emerald-500" placeholder="0.00" />
                </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30">
                Guardar Cuenta
            </button>
        </form>
      )}

      {/* ================= VISTA 3: DETALLE Y ACCIONES ================= */}
      {view === 'detail' && selectedAcc && (
        <div className="animate-fade-in">
            {/* ACCIONES RÁPIDAS */}
            <div className="grid grid-cols-2 gap-4 p-5 -mt-2">
                <button 
                    onClick={() => setTxType('deposit')}
                    className="bg-emerald-100 text-emerald-700 py-3 rounded-xl font-bold flex flex-col items-center gap-1 active:bg-emerald-200"
                >
                    <ArrowDownLeft className="w-6 h-6" />
                    Ingresar
                </button>
                <button 
                    onClick={() => setTxType('withdrawal')}
                    className="bg-orange-100 text-orange-700 py-3 rounded-xl font-bold flex flex-col items-center gap-1 active:bg-orange-200"
                >
                    <ArrowUpRight className="w-6 h-6" />
                    Retirar
                </button>
            </div>

            {/* LISTA DE MOVIMIENTOS */}
            <div className="bg-white rounded-t-[32px] p-6 min-h-[50vh] shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-700">Movimientos</h3>
                    <button 
                        onClick={() => { deleteAccount(selectedAcc.id); setView('list'); }}
                        className="text-red-400 p-2 bg-red-50 rounded-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    {accTransactions.length === 0 ? (
                        <p className="text-center text-gray-400 py-10">Sin movimientos</p>
                    ) : (
                        accTransactions.map(tx => (
                            <div key={tx.id} className="flex justify-between items-center border-b border-gray-50 pb-3">
                                <div>
                                    <p className="font-bold text-gray-800">{tx.description}</p>
                                    <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                                <span className={`font-bold ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-gray-800'}`}>
                                    {tx.type === 'deposit' ? '+' : '-'} {tx.amount}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

      {/* ================= MODAL: TRANSACCIÓN (OVERLAY) ================= */}
      {txType && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end backdrop-blur-sm animate-in slide-in-from-bottom-10">
            <div className="bg-white w-full p-6 rounded-t-[32px] space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">
                        {txType === 'deposit' ? 'Depositar Dinero' : 'Retirar Dinero'}
                    </h2>
                    <button onClick={() => setTxType(null)} className="p-2 bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl">
                    <label className="text-xs text-gray-400 font-bold uppercase">Monto</label>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-gray-400">{selectedAcc?.currency}</span>
                        <input 
                            type="number" 
                            autoFocus
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="w-full bg-transparent text-4xl font-bold text-gray-800 focus:outline-none"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <input 
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    placeholder="Descripción (Opcional)"
                    className="w-full border-b border-gray-200 py-3 text-lg focus:outline-none focus:border-emerald-500"
                />

                <button 
                    onClick={handleTransaction}
                    className={`w-full py-4 rounded-2xl font-bold text-white text-lg shadow-lg ${
                        txType === 'deposit' ? 'bg-emerald-600 shadow-emerald-500/30' : 'bg-gray-800 shadow-gray-500/30'
                    }`}
                >
                    Confirmar {txType === 'deposit' ? 'Ingreso' : 'Retiro'}
                </button>
                <div className="h-4" /> {/* Espaciador para iPhone home bar */}
            </div>
        </div>
      )}

    </div>
  );
};