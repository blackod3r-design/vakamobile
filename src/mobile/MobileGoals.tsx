import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Target, Plus, Trash2, DollarSign } from 'lucide-react';
import MobilePageWrapper from './MobilePageWrapper';

const MobileGoals: React.FC = () => {
  const { goals } = useData();

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.currentAmount >= g.targetAmount).length;

  const quickActions = [
    { label: 'Crear meta', icon: Plus, action: () => console.log('Crear meta') },
    { label: 'Eliminar meta', icon: Trash2, action: () => console.log('Eliminar meta') },
    { label: 'Agregar fondos', icon: DollarSign, action: () => console.log('Agregar fondos') },
  ];

  return (
    <MobilePageWrapper title="Metas" quickActions={quickActions}>
      <div className="py-4">
        {/* Summary */}
        <div className="bg-white rounded-[24px] p-5 shadow-[0_2px_16px_rgba(0,0,0,0.04)] mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Metas activas</p>
              <p className="text-3xl font-black text-gray-900">{totalGoals}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Completadas</p>
              <p className="text-2xl font-bold text-green-500">{completedGoals}</p>
            </div>
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const isCompleted = progress >= 100;
            
            return (
              <div
                key={goal.id}
                className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCompleted ? 'bg-green-100' : 'bg-[#007AFF]/10'}`}
                    >
                      <Target className={`w-6 h-6 ${isCompleted ? 'text-green-500' : 'text-[#007AFF]'}`} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{goal.name}</p>
                      <p className="text-sm text-gray-500">General</p>
                    </div>
                  </div>
                  {isCompleted && (
                    <span className="bg-green-100 text-green-600 text-xs font-semibold px-2 py-1 rounded-full">
                      ¡Completada!
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progreso</span>
                    <span className="font-semibold text-gray-900">{Math.min(progress, 100).toFixed(0)}%</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-[#007AFF]'}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Amount Info */}
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-gray-500">Actual</p>
                    <p className="text-lg font-black text-gray-900">
                      {goal.currency}{goal.currentAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Meta</p>
                    <p className="font-semibold text-gray-700">
                      {goal.currency}{goal.targetAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {goals.length === 0 && (
            <div className="text-center py-12">
              <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay metas registradas</p>
            </div>
          )}
        </div>
      </div>
    </MobilePageWrapper>
  );
};

export default MobileGoals;
