import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  // Mantenemos estas funciones vacías por compatibilidad con tu código antiguo
  // para que Settings.tsx no se rompa por ahora.
  changePin: (oldPin: string, newPin: string) => boolean; 
  checkPin: (pin: string) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Ver si ya hay sesión activa al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Escuchar cambios (login, logout) en tiempo real
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Funciones Legacy (Dummies) para no romper Settings.tsx todavía
  const changePin = () => true; 
  const checkPin = () => true;

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut, changePin, checkPin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return context;
};