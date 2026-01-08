import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Wallet, CreditCard, Target, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent } from '@/components/ui/sheet';

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
}

const navItems: NavItem[] = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/accounts', icon: Wallet, label: 'Cuentas' },
  { to: '/cards', icon: CreditCard, label: 'Tarjetas' },
  { to: '/goals', icon: Target, label: 'Metas' },
];

interface MobileTabBarProps {
  onAddClick?: () => void;
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({ onAddClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showQuickActions, setShowQuickActions] = useState(false);

  const quickActions = [
    { label: 'Nueva Cuenta', path: '/accounts', action: 'add-account' },
    { label: 'Nueva Tarjeta', path: '/cards', action: 'add-card' },
    { label: 'Nueva Meta', path: '/goals', action: 'add-goal' },
    { label: 'Transferir', path: '/transfers', action: 'transfer' },
  ];

  return (
    <>
      {/* Quick Actions Sheet */}
      <Sheet open={showQuickActions} onOpenChange={setShowQuickActions}>
        <SheetContent side="bottom" className="bg-[#F8F8FA] rounded-t-[30px] pb-10">
          <div className="pt-2 pb-6">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 text-center mb-6">Acciones rápidas</h3>
            <div className="space-y-3 px-2">
              {quickActions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => {
                    setShowQuickActions(false);
                    navigate(action.path);
                  }}
                  className="w-full bg-white rounded-2xl py-4 px-5 font-semibold text-base text-gray-900 shadow-[0_2px_12px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-transform text-left"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 safe-area-bottom">
        <div className="flex items-center justify-around h-20 px-4 max-w-lg mx-auto relative">
          {/* Left side nav items */}
          {navItems.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-2 touch-manipulation",
                  "active:scale-95 transition-transform"
                )}
              >
                <Icon 
                  className={cn(
                    "h-6 w-6 mb-1 transition-colors",
                    isActive ? "text-[#007AFF]" : "text-gray-400"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[11px] font-medium transition-colors",
                  isActive ? "text-[#007AFF]" : "text-gray-400"
                )}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}

          {/* Center Add Button */}
          <div className="flex-1 flex items-center justify-center">
            <button
              onClick={() => setShowQuickActions(true)}
              className="absolute -top-5 w-14 h-14 bg-[#007AFF] rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,122,255,0.4)] active:scale-95 transition-transform"
            >
              <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
            </button>
          </div>

          {/* Right side nav items */}
          {navItems.slice(2).map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-2 touch-manipulation",
                  "active:scale-95 transition-transform"
                )}
              >
                <Icon 
                  className={cn(
                    "h-6 w-6 mb-1 transition-colors",
                    isActive ? "text-[#007AFF]" : "text-gray-400"
                  )} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[11px] font-medium transition-colors",
                  isActive ? "text-[#007AFF]" : "text-gray-400"
                )}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileTabBar;
