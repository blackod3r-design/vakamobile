import React, { useState, useEffect } from 'react';
import { Plus, CreditCard, ArrowRightLeft, Banknote } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import MobileExchangeBtn from './MobileExchangeBtn';

interface QuickAction {
  label: string;
  icon?: React.ElementType;
  action: () => void;
}

interface MobileFloatingActionsProps {
  actions?: QuickAction[];
}

const MobileFloatingActions: React.FC<MobileFloatingActionsProps> = ({ 
  actions = [] 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Umbral de 60px como en tu JS original
      if (currentScrollY > 50 && currentScrollY > lastScrollY) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const finalActions = actions.length > 0 ? actions : [
    { label: 'Nuevo Movimiento', icon: Banknote, action: () => console.log('Nuevo') },
    { label: 'Transferencia', icon: ArrowRightLeft, action: () => console.log('Transfer') },
    { label: 'Pagar Tarjeta', icon: CreditCard, action: () => console.log('Pagar') }
  ];

  return (
    <>
      <Sheet open={showActions} onOpenChange={setShowActions}>
        <SheetContent side="bottom" className="bg-[#F2F2F7] rounded-t-[30px] pb-8 px-4 border-none z-[100]">
          <SheetHeader className="pb-6 pt-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto" />
            <SheetTitle className="text-center text-lg font-bold text-[#1D1D1F] pt-4">
              Acciones Rápidas
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3">
            {finalActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    setShowActions(false);
                    action.action();
                  }}
                  className="w-full bg-white active:bg-gray-50 rounded-2xl p-4 flex items-center gap-4 transition-transform active:scale-[0.98] shadow-sm border border-black/5"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[#007AFF]">
                    {Icon ? <Icon size={20} /> : <Plus size={20} />}
                  </div>
                  <span className="font-semibold text-gray-700 text-lg">{action.label}</span>
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* CONTENEDOR FLOTANTE */}
      <div 
        className={cn(
          "fixed right-6 bottom-8 z-50 flex flex-col gap-4 items-center transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)",
          isVisible 
            ? "translate-y-0 opacity-100" 
            : "translate-y-32 opacity-0 pointer-events-none"
        )}
      >
        
        {/* 1. Botón de Cambio ($) - Estilo Blanco Secundario (.fab-sec) */}
        <div className="pointer-events-auto">
             {/* Le pasamos estilos para que sea blanco con icono azul */}
            <MobileExchangeBtn className="bg-white text-[#007AFF] w-[50px] h-[50px] rounded-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.03)] border border-black/5" />
        </div>

        {/* 2. Botón Principal (+) - Estilo Azul Mac (.fab-main) */}
        <button
          onClick={() => setShowActions(true)}
          className="pointer-events-auto w-16 h-16 bg-[#007AFF] text-white rounded-[24px] flex items-center justify-center shadow-[0_10px_25px_rgba(0,122,255,0.25)] active:scale-90 transition-transform"
        >
          <Plus size={28} strokeWidth={3} />
        </button>

      </div>
    </>
  );
};

export default MobileFloatingActions;