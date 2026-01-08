import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Wallet, TrendingUp, Plus, Trash2, ArrowUpCircle, ArrowDownCircle, Pencil } from 'lucide-react';
import MobilePageWrapper from './MobilePageWrapper';

const MobileAccountsList: React.FC = () => {
  const { accounts } = useData();

  const accountsPEN = accounts.filter(acc => acc.currency === 'S/');
  const accountsUSD = accounts.filter(acc => acc.currency === '$');
  const totalPEN = accountsPEN.reduce((sum, acc) => sum + acc.balance, 0);
  const totalUSD = accountsUSD.reduce((sum, acc) => sum + acc.balance, 0);

  const getAccountTypeLabel = (acc: any) => {
    if (acc.tipoCuenta === 'dpf-mensual') return 'DPF – Mensual';
    if (acc.tipoCuenta === 'dpf-final') return 'DPF – Final';
    return 'Ahorro';
  };

  const getDaysProgress = (acc: any) => {
    if (!acc.fechaApertura || !acc.plazoDias) return null;
    const today = new Date();
    const openDate = new Date(acc.fechaApertura);
    const diasTranscurridos = Math.floor((today.getTime() - openDate.getTime()) / (1000 * 60 * 60 * 24));
    const diasRestantes = Math.max(0, acc.plazoDias - diasTranscurridos);
    const progress = Math.min(100, (diasTranscurridos / acc.plazoDias) * 100);
    return { diasTranscurridos, diasRestantes, progress };
  };

  const quickActions = [
    { label: 'Crear cuenta', icon: Plus, action: () => console.log('Crear cuenta') },
    { label: 'Eliminar cuenta', icon: Trash2, action: () => console.log('Eliminar cuenta') },
    { label: 'Agregar dinero', icon: ArrowUpCircle, action: () => console.log('Agregar dinero') },
    { label: 'Retirar dinero', icon: ArrowDownCircle, action: () => console.log('Retirar dinero') },
    { label: 'Cambiar nombre', icon: Pencil, action: () => console.log('Cambiar nombre') },
  ];

  return (
    <MobilePageWrapper title="Cuentas" quickActions={quickActions}>
      <div className="py-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-gray-500 mb-1">Soles</p>
            <p className="text-xl font-black text-gray-900">
              S/ {totalPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400">{accountsPEN.length} cuentas</p>
          </div>
          <div className="bg-white rounded-[24px] p-4 shadow-[0_2px_16px_rgba(0,0,0,0.04)]">
            <p className="text-sm text-gray-500 mb-1">Dólares</p>
            <p className="text-xl font-black text-gray-900">
              $ {totalUSD.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-400">{accountsUSD.length} cuentas</p>
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-3">
          {accounts.map((account) => {
            const daysInfo = getDaysProgress(account);
            const isDPF = account.tipoCuenta?.startsWith('dpf');
            
            return (
              <div
                key={account.id}
                className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-[#007AFF]" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{account.name}</p>
                      <p className="text-xs text-gray-500">{getAccountTypeLabel(account)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-gray-900">
                      {account.currency}{account.balance.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </p>
                    {isDPF && account.interesesAcumulados > 0 && (
                      <p className="text-xs text-green-600 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{account.currency}{account.interesesAcumulados.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </div>

                {/* DPF Progress Bar */}
                {isDPF && daysInfo && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Días: {daysInfo.diasTranscurridos} / {account.plazoDias}</span>
                      <span>{daysInfo.progress.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#007AFF] rounded-full transition-all"
                        style={{ width: `${daysInfo.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {accounts.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay cuentas registradas</p>
            </div>
          )}
        </div>
      </div>
    </MobilePageWrapper>
  );
};

export default MobileAccountsList;
