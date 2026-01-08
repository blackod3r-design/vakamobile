import React from 'react';
import { useTheme } from '@/contexts/ThemeContext'; 

interface FinancialCardProps {
  title: string;
  badgeText: string;
  badgeColor?: 'blue' | 'purple';
  currency: string;
  amount: string;
  hasProgress?: boolean;
  progressValue?: number;
  progressTotalDays?: string;
  showButtons?: boolean;
  overrideTheme?: 'glass' | 'dark' | 'light';
  className?: string;
  variant?: 'account' | 'total';
}

export const FinancialCard: React.FC<FinancialCardProps> = ({
  title,
  badgeText,
  badgeColor = 'blue',
  currency,
  amount,
  hasProgress = false,
  progressValue = 0,
  progressTotalDays = '',
  showButtons = false,
  overrideTheme,
  className = '',
  variant = 'account',
}) => {
  const { theme } = useTheme();

  // 1. Lógica de Tema
  let activeDesign = 'light';
  const themeToUse = overrideTheme || theme;

  if (themeToUse === 'glass') {
    activeDesign = 'glass';
  } else if (['dark', 'dark-glass'].includes(themeToUse)) {
    activeDesign = 'dark';
  } else if (['light', 'solid-light', 'mint', 'gray', 'pinkpurple'].includes(themeToUse)) {
    activeDesign = 'light';
  }

  // 2. Estilos Visuales
  const styles = {
    glass: {
      wrapper: "bg-white/70 border-white/40 shadow-blue-900/5 backdrop-blur-3xl ring-1 ring-white/70 hover:shadow-blue-900/10",
      textMain: "text-gray-900",
      textSub: "text-gray-400",
      textMuted: "text-gray-500",
      badgeBlue: "bg-blue-100/50 border-blue-200/50 text-blue-700",
      badgePurple: "bg-purple-100/50 border-purple-200/50 text-purple-700",
      progressTrack: "bg-gray-200/50",
      btnPrimary: "bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.6)] hover:bg-purple-500",
      btnSecondary: "bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100",
      shine: "bg-gradient-to-b from-white/50 to-transparent opacity-50",
      glow: true,
    },
    dark: {
      wrapper: "bg-[#181818] border-[#27272a] shadow-2xl shadow-black hover:border-zinc-600",
      textMain: "text-white",
      textSub: "text-[#52525b]",
      textMuted: "text-[#71717a]",
      badgeBlue: "bg-blue-900/20 border-blue-900/50 text-blue-400",
      badgePurple: "bg-purple-900/20 border-purple-900/50 text-purple-400",
      progressTrack: "bg-[#27272a]",
      btnPrimary: "bg-purple-600 text-white shadow-lg shadow-purple-900/20 hover:bg-purple-500",
      btnSecondary: "bg-purple-900/10 border-purple-900/50 text-purple-400 hover:bg-purple-900/20",
      shine: "bg-gradient-to-b from-white/5 to-transparent opacity-100",
      glow: true,
    },
    light: {
      wrapper: "bg-white border-gray-100 shadow-xl shadow-blue-900/10 hover:shadow-blue-900/20",
      textMain: "text-gray-900",
      textSub: "text-gray-400",
      textMuted: "text-gray-500",
      badgeBlue: "bg-blue-100 border-blue-200 text-blue-700",
      badgePurple: "bg-purple-100 border-purple-200 text-purple-700",
      progressTrack: "bg-gray-100",
      btnPrimary: "bg-purple-600 text-white shadow-sm hover:bg-purple-500",
      btnSecondary: "bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100",
      shine: "hidden",
      glow: false,
    }
  };

  const s = styles[activeDesign as keyof typeof styles];
  const currentBadge = badgeColor === 'blue' ? s.badgeBlue : s.badgePurple;

  // --- RENDERIZADO ---

  // A. Variante TOTAL (Resumen grande)
  if (variant === 'total') {
    return (
        <div className={`group relative w-full h-full overflow-hidden rounded-[32px] border p-8 transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center text-center ${s.wrapper} ${className}`}>
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-1/2 transition-opacity ${s.shine}`}></div>
            <div className="relative z-10 flex items-baseline justify-center gap-1.5 mb-2">
                <span className={`text-3xl font-light ${s.textSub}`}>{currency}</span>
                <span className={`text-6xl font-light tracking-tight drop-shadow-sm leading-none tabular-nums ${s.textMain}`}>
                    {amount}
                </span>
            </div>
            <p className={`text-xs font-bold uppercase tracking-widest relative z-10 ${badgeColor === 'purple' ? 'text-purple-600/70' : 'text-blue-600/70'}`}>
                {title}
            </p>
        </div>
    );
  }

  // B. Variante ACCOUNT (Lista de cuentas)
  return (
    // 'h-full' es CLAVE aquí para que ocupe toda la altura de la celda del grid
    <div className={`group relative w-full h-full overflow-hidden rounded-[32px] border p-8 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center ${s.wrapper} ${className}`}>
      
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-1/2 transition-opacity ${s.shine}`}></div>

      {s.glow && hasProgress && (
         <div className="absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-purple-500/20 blur-3xl mix-blend-screen transition-all duration-700 group-hover:bg-purple-500/30"></div>
      )}

      {/* Badge Posicionado Absolutamente (Top Right) */}
      <span className={`absolute top-6 right-6 z-20 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform group-hover:scale-105 ${currentBadge}`}>
        {badgeText}
      </span>

      <div className="mt-4"></div>

      <h3 className={`mb-4 text-2xl font-semibold tracking-tight relative z-10 ${s.textMain}`}>
        {title}
      </h3>

      <div className={`relative z-10 flex items-baseline justify-center gap-1.5 ${hasProgress ? 'mb-10' : 'mb-6'}`}>
        <span className={`text-3xl font-light ${s.textSub}`}>{currency}</span>
        <span className={`text-[56px] font-light tracking-tight drop-shadow-sm leading-none tabular-nums ${s.textMain}`}>
            {amount}
        </span>
      </div>

      {/* Sección DPF (Si existe, empuja hacia abajo. Si no, queda vacío pero la tarjeta mantiene su alto por h-full en el padre) */}
      {hasProgress && (
        <div className="relative z-10 w-full mt-auto">
          <div className={`mb-2 flex justify-center gap-2 text-xs font-medium ${s.textMuted}`}>
            <span>Progreso:</span>
            <span className={`font-bold ${badgeColor === 'purple' ? 'text-purple-500' : 'text-blue-500'}`}>{progressValue}%</span>
          </div>
          
          <div className={`h-4 w-full overflow-hidden rounded-full p-0.5 backdrop-blur-sm ${s.progressTrack}`}>
            <div 
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 relative overflow-hidden"
                style={{ width: `${progressValue}%` }}
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          
          <div className={`flex justify-center gap-4 text-[10px] font-medium pt-2 ${s.textSub}`}>
            <span>{progressTotalDays}</span>
          </div>
        </div>
      )}

      {showButtons && (
        <div className="relative z-10 flex gap-2 w-full mt-6 mt-auto">
          <button className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-95 ${s.btnPrimary}`}>
            Depositar
          </button>
          <button className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition-all active:scale-95 ${s.btnSecondary}`}>
            Retirar
          </button>
        </div>
      )}

      <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
    </div>
  );
};