import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HandCoins, CheckCircle2, AlertCircle } from 'lucide-react';

export const MobileLoans = () => {
  const navigate = useNavigate();
  const { loans } = useData();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HEADER AMBAR */}
      <div className="bg-amber-500 text-white px-4 pt-10 pb-6 rounded-b-[24px] shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 bg-amber-400/30 rounded-full backdrop-blur-md">
                <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Mis Préstamos</h1>
        </div>
        <p className="mt-2 text-amber-100 text-sm px-2">
            Tienes {loans.length} préstamos activos
        </p>
      </div>

      {/* LISTA DE PRÉSTAMOS */}
      <div className="p-5 space-y-4">
        {loans.map(loan => {
            const progress = (loan.cuotasPagadas / loan.plazoMeses) * 100;
            return (
                <div key={loan.id} className="bg-white p-5 rounded-2xl shadow-sm border border-amber-50 relative overflow-hidden">
                    {/* Barra de progreso sutil en el fondo */}
                    <div className="absolute bottom-0 left-0 h-1 bg-amber-100 w-full">
                        <div className="h-full bg-amber-500" style={{ width: `${progress}%` }}></div>
                    </div>

                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
                                <HandCoins className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{loan.name}</h3>
                                <p className="text-xs text-gray-400">Tasa: {loan.tasaAnual}%</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">
                            {loan.cuotasPagadas}/{loan.plazoMeses}
                        </span>
                    </div>

                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Cuota Mensual</p>
                            <p className="text-xl font-bold text-gray-800">
                                {loan.currency} {loan.cuotaMensual.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase font-bold">Saldo</p>
                            <p className="text-lg font-bold text-amber-600">
                                {loan.currency} {loan.saldoActual.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            );
        })}

        {loans.length === 0 && (
            <div className="text-center py-10">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-gray-600">¡Estás libre de deudas!</h3>
                <p className="text-sm text-gray-400 mt-2">No tienes préstamos personales activos.</p>
            </div>
        )}
      </div>

    </div>
  );
};