import React from 'react';

// 1. Importamos TU diseño actual y bueno (Escritorio)
import Dash30 from './dash30'; 

// 2. Importamos el diseño nuevo (iPhone)
import { MobileDashboard } from './dashboard/MobileDashboard'; 

export default function Dashboard() {
  return (
    <div className="w-full min-h-screen">
      
      {/* --- SI ES IPHONE (Pantalla chica) -> Muestra el diseño nuevo --- */}
      <div className="md:hidden">
        <MobileDashboard />
      </div>

      {/* --- SI ES PC (Pantalla mediana/grande) -> Muestra tu Dash30 actual --- */}
      <div className="hidden md:block">
        <Dash30 /> 
      </div>

    </div>
  );
}