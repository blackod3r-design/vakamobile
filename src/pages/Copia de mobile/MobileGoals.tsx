import React, { useState } from 'react';
import { useData, Goal } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Target, Trophy, TrendingUp, X } from 'lucide-react';

export const MobileGoals = () => {
  const navigate = useNavigate();
  const { goals, addGoal, addContribution } = useData();
  
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showContribute, setShowContribute] = useState(false);
  const [amount, setAmount] = useState('');

  // --- LOGICA: ABONAR A LA META ---
  const handleContribute = () => {
    if (!selectedGoal) return;
    addContribution(selectedGoal.id, {
        amount: Number(amount),
        date: new Date().toISOString()
    });
    setShowContribute(false);
    setAmount('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
        
      {/* HEADER ROSA/MAGENTA */}
      <div className="bg-pink-600 text-white px-4 pt-10 pb-6 rounded-b-[24px] shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={() => selectedGoal ? setSelectedGoal(null) : navigate('/')} className="p-2 bg-pink-500/30 rounded-full backdrop-blur-md">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <h1 className="text-xl font-bold">
                    {selectedGoal ? selectedGoal.name : 'Mis Metas'}
                </h1>
                {!selectedGoal && <p className="text-pink-100 text-sm">Visualiza tus sueños</p>}
            </div>
        </div>
      </div>

      {/* LISTA DE METAS */}
      {!selectedGoal && (
        <div className="p-5 grid gap-4">
            {goals.map(goal => {
                const progress = (goal.currentAmount / goal.targetAmount) * 100;
                return (
                    <div 
                        key={goal.id} 
                        onClick={() => setSelectedGoal(goal)}
                        className="bg-white p-4 rounded-2xl shadow-sm border border-pink-50 active:scale-95 transition-transform"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <div className="bg-pink-50 p-2.5 rounded-xl text-pink-500">
                                <Target className="w-6 h-6" />
                            </div>
                            <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full font-bold">
                                {progress.toFixed(0)}%
                            </span>
                        </div>
                        
                        <h3 className="font-bold text-gray-800 text-lg">{goal.name}</h3>
                        <div className="flex justify-between text-sm mt-1 mb-3">
                            <span className="font-bold text-pink-600">{goal.currency} {goal.currentAmount.toLocaleString()}</span>
                            <span className="text-gray-400">/ {goal.targetAmount.toLocaleString()}</span>
                        </div>

                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-pink-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                );
            })}
             {/* Botón flotante para crear meta */}
             <button className="fixed bottom-8 right-6 bg-pink-600 text-white p-4 rounded-full shadow-lg shadow-pink-500/40">
                <Plus className="w-6 h-6" />
            </button>
        </div>
      )}

      {/* DETALLE META */}
      {selectedGoal && (
        <div className="p-5 animate-fade-in space-y-6">
            
            {/* Tarjeta Principal */}
            <div className="bg-white p-6 rounded-3xl shadow-sm text-center space-y-2">
                <div className="inline-block p-4 bg-pink-50 rounded-full mb-2">
                    <Trophy className="w-10 h-10 text-pink-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedGoal.currentAmount.toLocaleString()}</h2>
                <p className="text-gray-400 text-sm">Ahorrado de {selectedGoal.targetAmount.toLocaleString()}</p>
                
                <button 
                    onClick={() => setShowContribute(true)}
                    className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-500/30 mt-4 active:scale-95 transition"
                >
                    + Abonar Dinero
                </button>
            </div>

            {/* Historial (Simulado con contribuciones) */}
            <div>
                <h3 className="font-bold text-gray-500 text-xs uppercase mb-3 ml-1">Historial de Aportes</h3>
                <div className="space-y-3">
                    {selectedGoal.contributions && selectedGoal.contributions.length > 0 ? (
                        selectedGoal.contributions.map((cont, i) => (
                            <div key={i} className="bg-white p-3 rounded-xl flex justify-between items-center border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-50 p-2 rounded-lg text-green-600">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">Aporte</span>
                                </div>
                                <span className="font-bold text-green-600">+{cont.amount}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400 text-sm py-4">Aún no has hecho aportes.</p>
                    )}
                </div>
            </div>
        </div>
      )}

       {/* MODAL ABONAR */}
       {showContribute && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end backdrop-blur-sm animate-in slide-in-from-bottom-10">
            <div className="bg-white w-full p-6 rounded-t-[32px] space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-pink-900">Abonar a la Meta</h2>
                    <button onClick={() => setShowContribute(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-5 h-5"/></button>
                </div>
                
                <div className="bg-pink-50 p-4 rounded-2xl">
                    <label className="text-xs text-pink-400 font-bold uppercase">Monto a abonar</label>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-pink-300">$</span>
                        <input 
                            type="number" autoFocus value={amount} onChange={e => setAmount(e.target.value)}
                            className="w-full bg-transparent text-4xl font-bold text-pink-900 focus:outline-none" placeholder="0.00"
                        />
                    </div>
                </div>
                
                <button onClick={handleContribute} className="w-full bg-pink-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-pink-500/30">
                    Guardar Aporte
                </button>
                <div className="h-6"></div>
            </div>
        </div>
      )}

    </div>
  );
};