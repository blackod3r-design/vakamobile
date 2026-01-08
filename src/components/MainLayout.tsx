import React from 'react';
import { AppSidebar } from './AppSidebar';
import { SidebarTrigger } from './ui/sidebar';
import MobileNav from './MobileNav'; // <--- IMPORTANTE: Importamos tu nueva barra móvil

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen w-full bg-transparent">
      
      {/* 1. SIDEBAR: OCULTO EN MÓVIL (md:hidden) / VISIBLE EN PC (md:flex) */}
      {/* Usamos un wrapper para controlar la visibilidad sin romper la lógica interna del Sidebar */}
      <div className="hidden md:flex h-full z-30">
         <AppSidebar />
      </div>
      
      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
        
        {/* Header: El botón 'Trigger' solo tiene sentido en PC */}
        <header className="sticky top-0 z-20 w-full h-16 flex items-center px-4">
          <div className="hidden md:block">
             <SidebarTrigger />
          </div>
          
          {/* Opcional: En móvil podrías poner aquí un logo centrado o el título de la sección */}
          <div className="md:hidden w-full text-center font-bold text-lg opacity-80">
             Vaka
          </div>
        </header>
        
        {/* 2. CONTENIDO: 
            - pb-28: Agregamos mucho padding abajo SOLO en móvil para que la barra no tape el contenido.
            - md:pb-0: En PC quitamos ese padding extra.
        */}
        <div className="flex-1 overflow-auto relative z-10 scrollbar-hide pb-28 md:pb-0 px-4 md:px-0">
          {children}
        </div>

      </main>

      {/* 3. BARRA MÓVIL: El componente ya tiene 'fixed bottom-0', así que solo lo renderizamos */}
      <MobileNav />
      
    </div>
  );
};

export default MainLayout;