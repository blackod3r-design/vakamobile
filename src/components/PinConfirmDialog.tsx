import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

interface PinConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title: string; // Título por defecto (ej: "Ingrese su PIN")
  description?: string; // Lo ignoramos visualmente para el diseño minimalista
}

export const PinConfirmDialog: React.FC<PinConfirmDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
}) => {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reiniciar estados al abrir
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setSuccess(false);
    }
  }, [isOpen]);

  const handlePinChange = (value: string) => {
    setPin(value);
    setError(false);

    if (value.length === 4) {
      // Validar PIN
      if (login(value)) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 600); // Esperar un poco para ver el estado de éxito
      } else {
        setError(true);
        setPin(''); // Limpiar para reintentar
      }
    }
  };

  // Determinar texto y color del título según el estado
  const getTitleContent = () => {
    if (error) return { text: "PIN Incorrecto", color: "text-red-600" };
    if (success) return { text: "¡Correcto!", color: "text-emerald-600" };
    return { text: title, color: "text-gray-900" };
  };

  const { text: titleText, color: titleColor } = getTitleContent();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* CONTENEDOR GLASS (Diseño limpio sin bordes por defecto de shadcn) */}
      <DialogContent className="sm:max-w-sm w-full overflow-hidden rounded-[32px] border border-white/40 bg-white/70 p-10 shadow-2xl backdrop-blur-3xl ring-1 ring-white/70 [&>button]:hidden">
        
        {/* Estilos para animación Shake */}
        <style>
          {`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-4px); }
              75% { transform: translateX(4px); }
            }
            .animate-shake { animation: shake 0.3s ease-in-out; }
          `}
        </style>

        {/* Reflejo Superior */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50" />

        <div className="relative z-10 flex flex-col items-center">
          
          <DialogHeader className="mb-8 text-center">
            {/* Título Dinámico */}
            <DialogTitle className={cn("text-2xl font-bold tracking-tight transition-colors duration-300", titleColor)}>
              {titleText}
            </DialogTitle>
          </DialogHeader>

          {/* INPUTS OTP */}
          <InputOTP
            maxLength={4}
            value={pin}
            onChange={handlePinChange}
            render={({ slots }) => (
              <InputOTPGroup className={cn("gap-3", error && "animate-shake")}>
                {slots.map((slot, index) => (
                  <InputOTPSlot
                    key={index}
                    {...slot}
                    className={cn(
                      // Estilo Base (Glass Slot)
                      "flex h-16 w-14 items-center justify-center rounded-2xl border text-3xl font-semibold transition-all duration-300 shadow-sm",
                      
                      // Estado Normal
                      !error && !success && "bg-white/40 border-gray-200/60 text-gray-900 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10",
                      
                      // Estado Error
                      error && "border-red-300 bg-red-50/50 text-red-500 focus:ring-red-500/20",
                      
                      // Estado Éxito
                      success && "border-emerald-400 bg-emerald-50/50 text-emerald-600"
                    )}
                  />
                ))}
              </InputOTPGroup>
            )}
          />

        </div>
      </DialogContent>
    </Dialog>
  );
};