import React from 'react';
import { Wallet, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Colores estilo "Banco Moderno"
const colors = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 
  'bg-blue-600', 'bg-sky-500', 'bg-emerald-500', 
  'bg-slate-600', 'bg-indigo-500'
];

export const AccountCards = ({ accounts }: { accounts: any[] }) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-500 text-xs uppercase tracking-wider ml-1">
        Mis Cuentas
      </h3>
      
      {/* Grilla de 2 columnas para celular */}
      <div className="grid grid-cols-2 gap-3">
        {accounts.map((acc, index) => {
          const colorClass = colors[index % colors.length];
          
          return (
            <div 
              key={acc.id} 
              onClick={() => navigate('/accounts')}
              className={`${colorClass} p-4 rounded-2xl shadow-sm text-white flex flex-col justify-between h-24 relative overflow-hidden transition-transform active:scale-95 cursor-pointer`}
            >
              {/* Icono decorativo de fondo */}
              <div className="absolute -right-2 -bottom-4 opacity-20 transform rotate-12">
                 <Wallet className="w-16 h-16 text-white" />
              </div>

              {/* Nombre de la cuenta */}
              <div className="text-[10px] font-bold uppercase tracking-wide opacity-90 truncate pr-2">
                {acc.name}
              </div>

              {/* Saldo */}
              <div className="font-bold text-lg truncate">
                {acc.currency} {Number(acc.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
        
        {/* Botón de "Agregar Nueva" */}
        <div 
            onClick={() => navigate('/accounts')}
            className="border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center h-24 text-gray-400 gap-1 bg-gray-50/50 cursor-pointer active:bg-gray-100 transition"
        >
           <Plus className="w-6 h-6" />
           <span className="text-[10px] font-medium">Nueva</span>
        </div>
      </div>
    </div>
  );
};