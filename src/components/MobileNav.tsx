import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CreditCard, Wallet, Settings, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const MobileNav = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'solid';

  const navItems = [
    { icon: LayoutDashboard, label: 'Inicio', path: '/' },
    { icon: CreditCard, label: 'Tarjetas', path: '/cards' },
    { icon: Wallet, label: 'Billetera', path: '/wallet' },
    { icon: Target, label: 'Metas', path: '/goals' },
    { icon: Settings, label: 'Ajustes', path: '/settings' },
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-3 md:hidden", // md:hidden = Se oculta en PC
      "backdrop-blur-xl border-t transition-all duration-300",
      isDark 
        ? "bg-[#181818]/90 border-white/10" 
        : "bg-white/90 border-gray-200"
    )}>
      <div className="flex justify-between items-center max-w-sm mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 transition-all duration-300",
              isActive 
                ? (isDark ? "text-indigo-400 scale-110" : "text-indigo-600 scale-110") 
                : (isDark ? "text-zinc-500 hover:text-zinc-300" : "text-gray-400 hover:text-gray-600")
            )}
          >
            <Icon className="w-6 h-6" strokeWidth={2} />
            {/* Opcional: Ocultar texto en pantallas muy pequeñas si quieres un look más limpio */}
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default MobileNav;