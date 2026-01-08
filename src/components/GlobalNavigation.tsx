import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const GlobalNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === '/'; 

  if (isDashboard) return null;

  return (
    <button 
      onClick={() => navigate(-1)}
      // top-1/2: Lo pone a la mitad de la altura
      // -translate-y-1/2: Ajuste fino para que sea el centro matemático exacto
      className="fixed top-1/2 left-2 -translate-y-1/2 z-[9999] 
                 p-3
                 text-[#007AFF]
                 active:scale-90 active:opacity-60 transition-all duration-300"
      aria-label="Volver atrás"
    >
      <ChevronLeft size={40} strokeWidth={2.5} />
    </button>
  );
};

export default GlobalNavigation;