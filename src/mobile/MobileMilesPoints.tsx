import React from 'react';
import { useData } from '@/contexts/DataContext';
import { Plane, Plus, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import MobilePageWrapper from './MobilePageWrapper';

const MobileMilesPoints: React.FC = () => {
  const { milesPoints } = useData();

  const programs = milesPoints?.programs || [];
  const totalPoints = programs.reduce((sum, p) => sum + p.points, 0);

  const quickActions = [
    { label: 'Crear programa', icon: Plus, action: () => console.log('Crear programa') },
    { label: 'Eliminar programa', icon: Trash2, action: () => console.log('Eliminar programa') },
    { label: 'Agregar millas', icon: ArrowUpCircle, action: () => console.log('Agregar millas') },
    { label: 'Quitar millas', icon: ArrowDownCircle, action: () => console.log('Quitar millas') },
  ];

  return (
    <MobilePageWrapper title="Millas y Puntos" quickActions={quickActions}>
      <div className="py-4">
        {/* Summary */}
        <div className="bg-gradient-to-br from-[#5856D6] to-[#AF52DE] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(88,86,214,0.3)] mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <p className="text-white/80 font-medium">Total acumulado</p>
          </div>
          <p className="text-4xl font-black text-white">
            {totalPoints.toLocaleString()}
          </p>
          <p className="text-white/60 text-sm mt-1">puntos / millas</p>
        </div>

        {/* Programs List */}
        <h3 className="text-lg font-bold text-gray-900 mb-4">Programas</h3>
        <div className="space-y-3">
          {programs.map((program, index) => (
            <div
              key={index}
              className="bg-white rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#5856D6]/10 flex items-center justify-center">
                  <Plane className="w-5 h-5 text-[#5856D6]" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{program.name}</p>
                  <p className="text-sm text-gray-500">{program.icon === 'plane' ? 'Aerolínea' : program.icon === 'shopping' ? 'Compras' : 'Puntos'}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-gray-900">{program.points.toLocaleString()}</p>
                <p className="text-xs text-gray-500">puntos</p>
              </div>
            </div>
          ))}

          {programs.length === 0 && (
            <div className="text-center py-12">
              <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay programas registrados</p>
            </div>
          )}
        </div>
      </div>
    </MobilePageWrapper>
  );
};

export default MobileMilesPoints;
