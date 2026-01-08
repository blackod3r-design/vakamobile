import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // <--- 1. Importamos el GPS

export default function Login() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); 
  
  const navigate = useNavigate(); // <--- 2. Activamos el GPS

  // Efecto de seguridad: Si ya estás logueado, te manda adentro automáticamente
  useEffect(() => {
    const checkSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
            navigate('/'); // Te manda al Dashboard
        }
    };
    checkSession();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
        toast.error('El PIN debe tener exactamente 6 números');
        return;
    }

    setLoading(true);

    const fakeEmail = `${username.toLowerCase().replace(/\s/g, '')}@vaka.app`;

    try {
      if (isSignUp) {
        // REGISTRO
        const { error } = await supabase.auth.signUp({ 
            email: fakeEmail, 
            password: pin 
        });
        if (error) throw error;
        toast.success('¡Usuario creado! Entrando...');
        
        // Auto-login
        const { error: loginError } = await supabase.auth.signInWithPassword({ 
            email: fakeEmail, 
            password: pin 
        });
        if (loginError) throw loginError;
        
        navigate('/'); // <--- 3. EMPUJÓN AL DASHBOARD DESPUÉS DE REGISTRO

      } else {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({ 
            email: fakeEmail, 
            password: pin 
        });
        if (error) throw error;
        toast.success('Bienvenido');
        
        navigate('/'); // <--- 4. EMPUJÓN AL DASHBOARD DESPUÉS DE LOGIN
      }
    } catch (error: any) {
      if (error.message.includes('Invalid login')) {
          toast.error('Usuario o PIN incorrectos');
      } else if (error.message.includes('already registered')) {
          toast.error('Este usuario ya existe. Intenta entrar.');
      } else {
          toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] p-4 text-white font-sans">
      <div className="w-full max-w-sm p-8 rounded-[32px] bg-[#181818] border border-[#27272a] shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 shadow-inner">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1 tracking-tight text-white">Vaka Financiero</h1>
          <p className="text-zinc-500 text-sm">
            {isSignUp ? 'Crear nueva cuenta' : 'Ingresa tus credenciales'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6 relative z-10">
          
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 pl-1">Usuario</Label>
            <div className="relative">
                <Input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                placeholder="Ej: vaka"
                style={{ color: 'white', backgroundColor: '#0f0f0f' }} 
                className="border-[#27272a] pl-10 h-12 rounded-xl focus:ring-indigo-500/20 placeholder:text-zinc-600"
                />
                <User className="w-5 h-5 text-zinc-600 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500 pl-1">PIN de 6 Dígitos</Label>
            <div className="relative">
                <Input 
                type="password" 
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin} 
                onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPin(val);
                }} 
                required 
                placeholder="••••••"
                style={{ color: 'white', backgroundColor: '#0f0f0f' }}
                className="border-[#27272a] pl-10 h-12 rounded-xl tracking-[0.5em] font-mono text-center focus:ring-indigo-500/20 placeholder:text-zinc-600 placeholder:tracking-normal"
                />
                <Lock className="w-5 h-5 text-zinc-600 absolute left-3 top-3.5" />
            </div>
          </div>

          <Button 
            type="submit" 
            className={`w-full h-12 text-base font-medium rounded-xl shadow-lg transition-all ${isSignUp ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20' : 'bg-white text-black hover:bg-gray-200 shadow-white/10'}`}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Registrar Usuario' : 'Entrar')}
          </Button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-zinc-500 hover:text-white transition-colors underline decoration-zinc-700 underline-offset-4"
          >
            {isSignUp ? '¿Ya tienes usuario? Entrar' : '¿Nuevo usuario? Crear acceso'}
          </button>
        </div>
      </div>
    </div>
  );
}