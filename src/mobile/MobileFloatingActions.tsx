import React, { useState, useEffect } from 'react';
import { Plus, X, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface QuickAction {
  label: string;
  icon?: React.ElementType;
  action: () => void;
}

interface MobileFloatingActionsProps {
  actions: QuickAction[];
  showSettings?: boolean;
}

const MobileFloatingActions: React.FC<MobileFloatingActionsProps> = ({ 
  actions,
  showSettings = false 
}) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Quick Actions Sheet */}
      <Sheet open={showActions} onOpenChange={setShowActions}>
        <SheetContent side="bottom" className="bg-[#F8F8FA] rounded-t-[30px] pb-10">
          <SheetHeader className="pb-4">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <SheetTitle className="text-xl font-bold text-gray-900 text-center">
              Acciones rápidas
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3 px-2">
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => {
                    setShowActions(false);
                    action.action();
                  }}
                  className="w-full bg-white rounded-2xl py-4 px-5 font-semibold text-base text-gray-900 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform text-left flex items-center gap-3"
                >
                  {Icon && <Icon className="w-5 h-5 text-[#007AFF]" />}
                  {action.label}
                </button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Floating Buttons Container */}
      <div 
        className={cn(
          "fixed right-5 bottom-8 z-50 flex flex-col gap-3 transition-all duration-300 safe-area-bottom",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0"
        )}
      >
        {/* Settings Button */}
        {showSettings && (
          <button
            onClick={() => navigate('/settings')}
            className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] active:scale-95 transition-transform"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Main Action Button */}
        <button
          onClick={() => setShowActions(true)}
          className="w-14 h-14 bg-[#007AFF] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,122,255,0.4)] active:scale-95 transition-transform"
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
};

export default MobileFloatingActions;
