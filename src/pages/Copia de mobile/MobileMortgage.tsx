import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, TrendingDown, Calendar, DollarSign, Info } from 'lucide-react';

export const MobileMortgage = () => {
  const navigate = useNavigate();
  const { mortgage } = useData();

  // Cálculos rápidos
  const paidPercent = mortgage.totalAmount > 0 
    ? ((mortgage.paidAmount / mortgage.totalAmount) * 100).toFixed(1) 
    : '0';

  const remainingAmount = mortgage.totalAmount - mortgage.paidAmount;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HEADER AZUL */}
      <div className="bg-blue-600 text-white px-4 pt-10 pb-12 rounded-b-[32px] shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => navigate('/')} className="p-2 bg-blue-500/30 rounded-full backdrop-blur-md">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Mi Hipoteca</h1>
        </div>

        {/* Círculo de Progreso */}
        <div className="flex items-center justify-between px-4">
            <div>
                <p className="text-blue-200 text-sm uppercase mb-1">Deuda Restante</p>
                <h2 className="text-3xl font-bold tracking-tight">
                    {mortgage.currency} {remainingAmount.toLocaleString()}
                </h2>
                <p className="text-sm text-blue-100 mt-1">
                    Original: {mortgage.totalAmount.toLocaleString()}
                </p>
            </div>
            
            {/* Donut Chart Simulado CSS */}
            <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-blue-500/30" />
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={226} 
                        strokeDashoffset={226 - (226 * Number(paidPercent) / 100)} 
                        className="text-white transition-all duration-1000 ease-out" 
                    />
                </svg>
                <span className="absolute text-sm font-bold">{paidPercent}%</span>
            </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="px-5 -mt-8 relative z-30 space-y-4">
        
        {/* Tarjeta de Próximo Pago */}
        <div className="bg-white p-5 rounded-2xl shadow-lg shadow-blue-900/5 flex justify-between items-center border border-blue-50">
            <div>
                <p className="text-xs text-gray-400 font-bold uppercase mb-1">Próxima Cuota</p>
                <p className="text-2xl font-bold text-gray-800">
                    {mortgage.currency} {mortgage.monthlyPayment.toLocaleString()}
                </p>
                <p className="text-xs text-blue-500 mt-1 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Vence el 30 de mes
                </p>
            </div>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition">
                Pagar
            </button>
        </div>

        {/* Estadísticas Rápidas */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="bg-green-50 w-8 h-8 rounded-lg flex items-center justify-center text-green-600 mb-2">
                    <TrendingDown className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-400">Capital Pagado</p>
                <p className="font-bold text-gray-700">{mortgage.currency} {mortgage.paidAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="bg-purple-50 w-8 h-8 rounded-lg flex items-center justify-center text-purple-600 mb-2">
                    <Info className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-400">Plazo Restante</p>
                <p className="font-bold text-gray-700">{mortgage.plazoRestante} meses</p>
            </div>
        </div>

        {/* Botón Detalles del Inmueble */}
        <div className="bg-slate-800 text-white p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="bg-slate-700 p-3 rounded-xl">
                <Home className="w-6 h-6 text-blue-300" />
            </div>
            <div>
                <h3 className="font-bold text-sm">Detalles del Inmueble</h3>
                <p className="text-xs text-slate-400">Ver valorización y datos</p>
            </div>
        </div>

      </div>
    </div>
  );
};