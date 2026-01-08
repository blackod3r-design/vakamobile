import React from 'react';
import { useData } from '@/contexts/DataContext';
import { CreditCard, Calendar, Plus, Trash2, Receipt, DollarSign } from 'lucide-react';
import MobilePageWrapper from './MobilePageWrapper';

const MobileCreditCards: React.FC = () => {
  const { creditCards } = useData();

  const totalDebt = creditCards.reduce((sum, card) => sum + card.balance, 0);
  const totalLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  };

  const quickActions = [
    { label: 'Crear tarjeta', icon: Plus, action: () => console.log('Crear tarjeta') },
    { label: 'Eliminar tarjeta', icon: Trash2, action: () => console.log('Eliminar tarjeta') },
    { label: 'Registrar gasto', icon: Receipt, action: () => console.log('Registrar gasto') },
    { label: 'Agregar pago', icon: DollarSign, action: () => console.log('Agregar pago') },
  ];

  return (
    <MobilePageWrapper title="Tarjetas de Crédito" quickActions={quickActions}>
      <div className="py-4">
        {/* Summary */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] mb-6">
          <p className="text-sm text-gray-500 mb-1">Deuda total</p>
          <p className="text-3xl font-black text-red-500">
            -${totalDebt.toLocaleString()}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Límite total: ${totalLimit.toLocaleString()}
          </p>
        </div>

        {/* Cards List */}
        <div className="space-y-4">
          {creditCards.map((card) => {
            const usage = card.limit > 0 ? (card.balance / card.limit) * 100 : 0;
            
            return (
              <div
                key={card.id}
                className="bg-white rounded-[20px] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
              {/* Card Visual */}
              <div 
                className="h-32 p-4 flex flex-col justify-between"
                style={{ 
                  background: card.imageUrl ? `url(${card.imageUrl}) center/cover` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                }}
              >
                <div className="flex justify-between items-start">
                  <p className="text-white/80 text-sm font-medium">{card.cardLogo || 'Tarjeta'}</p>
                  <CreditCard className="w-6 h-6 text-white/60" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{card.name}</p>
                  <p className="text-white/70 text-sm">•••• ****</p>
                </div>
              </div>

                {/* Card Info */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <p className="text-sm text-gray-500">Saldo actual</p>
                      <p className="text-xl font-black text-gray-900">${card.balance.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Límite</p>
                      <p className="font-semibold text-gray-700">${card.limit.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="mb-3">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${usage > 80 ? 'bg-red-500' : usage > 50 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${Math.min(usage, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{usage.toFixed(0)}% utilizado</p>
                  </div>

                  {/* Due Date */}
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Vence: {formatDate(card.dueDate)}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {creditCards.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay tarjetas registradas</p>
            </div>
          )}
        </div>
      </div>
    </MobilePageWrapper>
  );
};

export default MobileCreditCards;
