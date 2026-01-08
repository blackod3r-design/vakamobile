import React, { useState, useRef, useEffect } from 'react';
import { Lock, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import loginBg from '@/assets/login-background.jpg';

interface PinAuthProps {
  isSetup?: boolean;
}

const PinAuth: React.FC<PinAuthProps> = ({ isSetup = false }) => {
  const { login, setPin } = useAuth();
  const { pinBackground, customPinBackground } = useTheme();
  
  const [pin, setLocalPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');
  
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const backgroundStyles: Record<string, string> = {
    default: `url(${loginBg})`,
    sunset: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    ocean: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
    forest: 'linear-gradient(to top, #0ba360 0%, #3cba92 100%)',
    lavender: 'linear-gradient(to top, #cd9cf2 0%, #f6f3ff 100%)',
    dark: 'linear-gradient(to top, #09203f 0%, #537895 100%)',
    custom: customPinBackground ? `url(${customPinBackground})` : `url(${loginBg})`,
  };

  useEffect(() => {
    setTimeout(() => inputRefs[0].current?.focus(), 100);
  }, []);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const currentPin = isConfirming ? confirmPin : pin;
    const setCurrentPin = isConfirming ? setConfirmPin : setLocalPin;

    const newPin = [...currentPin];
    newPin[index] = value.slice(-1);
    setCurrentPin(newPin);
    setError('');

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (newPin.every(digit => digit !== '')) {
      const pinString = newPin.join('');
      
      if (isSetup) {
        if (!isConfirming) {
          setIsConfirming(true);
          setConfirmPin(['', '', '', '']); 
          setTimeout(() => inputRefs[0].current?.focus(), 100);
        } else {
          if (pinString === pin.join('')) {
            setPin(pinString);
            login(pinString);
          } else {
            setError('Los PINs no coinciden');
            setConfirmPin(['', '', '', '']);
            setIsConfirming(false);
            setLocalPin(['', '', '', '']); 
            setTimeout(() => inputRefs[0].current?.focus(), 100);
          }
        }
      } else {
        if (!login(pinString)) {
          setError('PIN incorrecto');
          setLocalPin(['', '', '', '']);
          setTimeout(() => inputRefs[0].current?.focus(), 100);
        }
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    const currentPin = isConfirming ? confirmPin : pin;
    if (e.key === 'Backspace' && !currentPin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const activePin = isConfirming ? confirmPin : pin;

  return (
    // CAMBIO 1: bg-black de base para que sea oscuro
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans text-white bg-black">
      
      {/* --- CAPA DE FONDO (IMAGEN) --- */}
      <div 
        className="absolute inset-0 z-0 transition-all duration-1000 ease-in-out"
        style={{
          background: backgroundStyles[pinBackground] || backgroundStyles.default,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.20 // Opacidad baja para que se vea oscuro
        }}
      />

      {/* --- TARJETA DARK GLASS --- */}
      {/* bg-black/40, border-white/10, ring-white/5 */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-[40px] border border-white/10 bg-black/40 p-10 shadow-2xl shadow-black/50 backdrop-blur-2xl ring-1 ring-white/5 animate-in zoom-in-95 duration-500">
        
        {/* Reflejo Superior Sutil */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent opacity-30"></div>
        
        {/* Glow animado detrás del icono (Colores ajustados para fondo negro) */}
        <div className={`absolute -top-20 -right-20 h-64 w-64 rounded-full blur-[80px] mix-blend-screen animate-pulse ${error ? 'bg-red-600/20' : 'bg-blue-600/20'}`}></div>

        <div className="relative z-10 flex flex-col items-center">
          
          {/* Icono en Squircle Dark Glass */}
          <div className={`flex h-20 w-20 items-center justify-center rounded-[24px] shadow-lg ring-1 ring-white/10 backdrop-blur-md transition-all duration-500 mb-8 ${
            error 
              ? 'bg-red-500/10 text-red-500 shadow-red-900/20' 
              : isConfirming 
                ? 'bg-green-500/10 text-green-500 shadow-green-900/20'
                : 'bg-white/5 text-white shadow-white/5'
          }`}>
             {error ? (
                <AlertCircle className="w-10 h-10 animate-pulse" strokeWidth={1.5} />
             ) : isConfirming ? (
                <Check className="w-10 h-10" strokeWidth={1.5} />
             ) : (
                <Lock className="w-10 h-10" strokeWidth={1.5} />
             )}
          </div>

          {/* Título y Descripción */}
          <div className="text-center space-y-2 mb-10">
            <h1 className="text-3xl font-bold tracking-tight text-white">
               {isSetup ? (isConfirming ? 'Confirmar PIN' : 'Crear PIN') : 'Bienvenido'}
            </h1>
            <p className="text-sm font-medium text-white/50">
               {isSetup 
                  ? (isConfirming ? 'Repite tu código secreto' : 'Configura tu código de acceso') 
                  : 'Ingresa tu PIN para continuar'}
            </p>
          </div>

          {/* PIN INPUTS DARK */}
          <div className={`flex gap-4 mb-8 ${error ? 'animate-shake' : ''}`}>
            {activePin.map((digit, index) => (
              <div key={index} className="relative group">
                <input
                  ref={inputRefs[index]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`
                    flex h-16 w-14 items-center justify-center rounded-2xl border text-center text-3xl font-bold transition-all duration-300 outline-none
                    ${error 
                      ? 'border-red-500/50 bg-red-900/20 text-red-500 placeholder:text-red-300' 
                      : 'border-white/10 bg-white/5 text-white focus:bg-white/10 focus:ring-1 focus:ring-white/30 focus:border-white/30 shadow-inner'
                    }
                  `}
                />
              </div>
            ))}
          </div>

          {/* Error Message */}
          <div className="h-6 text-center">
             {error && (
                <p className="text-sm font-medium text-red-400 animate-in fade-in slide-in-from-bottom-2">
                   {error}
                </p>
             )}
          </div>

          {/* Footer en modo Setup */}
          {isSetup && !isConfirming && (
             <p className="mt-8 text-[10px] uppercase tracking-widest text-white/30 font-bold">
                Seguridad Local
             </p>
          )}

        </div>
      </div>
      
      {/* Animación de error */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
};

export default PinAuth;