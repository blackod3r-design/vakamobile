import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // <--- ESTA ES LA CLAVE PARA CENTRARLO
import { RefreshCw, X, DollarSign, ArrowDown } from 'lucide-react';

interface TipoCambioData {
  compra: number;
  venta: number;
  fecha: string;
  timestamp: number;
}

interface Props {
  className?: string;
}

const STORAGE_KEY = 'tipoCambioData';
const UPDATE_INTERVAL = 6 * 60 * 60 * 1000;

const MobileExchangeBtn = ({ className = "" }: Props) => {
  const [data, setData] = useState<TipoCambioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [penAmount, setPenAmount] = useState<string>('');

  const fetchTipoCambio = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      setLoading(true);
      const response = await fetch('https://corsproxy.io/?https://api.apis.net.pe/v1/tipo-cambio-sunat');
      if (!response.ok) throw new Error('Error');
      const result = await response.json();
      const newData = { compra: result.compra, venta: result.venta, fecha: result.fecha, timestamp: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (err) {
      console.error(err);
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setData(JSON.parse(stored));
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const storedData = JSON.parse(stored);
      setData(storedData);
      if (Date.now() - storedData.timestamp > UPDATE_INTERVAL) fetchTipoCambio();
      else setLoading(false);
    } else {
      fetchTipoCambio();
    }
  }, []);

  const calculateUSD = () => {
    if (!penAmount || !data) return '0.00';
    return (parseFloat(penAmount) / data.venta).toFixed(2);
  };

  // --- CONTENIDO DEL MODAL (CALCULADORA) ---
  const ModalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" 
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 mx-auto" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between mb-6">
          <div>
            <h3 className="font-bold text-xl text-gray-900">Tipo de Cambio</h3>
            <p className="text-xs text-gray-400 font-medium">SUNAT Oficial</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
            <X size={18} className="text-gray-600"/>
          </button>
        </div>
        
        {/* Tarjetas Compra/Venta */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-gray-50 p-4 rounded-2xl text-center border border-gray-100">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Compra</div>
            <div className="text-2xl font-black text-gray-700">{data?.compra.toFixed(3)}</div>
          </div>
          <div className="flex-1 bg-blue-50 p-4 rounded-2xl text-center border border-blue-100 relative shadow-sm">
            <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1">Venta</div>
            <div className="text-2xl font-black text-blue-600">{data?.venta.toFixed(3)}</div>
          </div>
        </div>

        {/* Calculadora */}
        <div className="space-y-3">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex justify-between items-center focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
            <input 
              type="number" 
              value={penAmount} 
              onChange={e => setPenAmount(e.target.value)} 
              placeholder="0.00" 
              className="text-2xl font-bold outline-none w-full bg-transparent text-gray-900 placeholder:text-gray-300" 
              autoFocus 
            />
            <span className="font-bold text-gray-400 text-sm ml-2">PEN</span>
          </div>
          
          <div className="flex justify-center -my-3 relative z-10 pointer-events-none">
            <div className="bg-white p-1.5 rounded-full border border-gray-100 shadow-sm">
              <ArrowDown size={16} className="text-gray-400" />
            </div>
          </div>
          
          <div className="bg-blue-600 rounded-2xl p-4 flex justify-between items-center text-white shadow-lg shadow-blue-600/30">
            <div className="flex flex-col">
               <span className="text-[10px] uppercase opacity-70 font-bold tracking-wider">Recibes</span>
               <span className="text-3xl font-black tracking-tight">$ {calculateUSD()}</span>
            </div>
            <span className="font-bold text-blue-200 text-sm opacity-80">USD</span>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 flex justify-between items-center pt-5 border-t border-gray-100">
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
            {data?.fecha || '--/--'}
          </span>
          <button 
            onClick={() => fetchTipoCambio(true)} 
            className="text-xs font-bold text-blue-600 flex gap-2 items-center bg-blue-50 px-3 py-2 rounded-lg active:scale-95 transition-transform hover:bg-blue-100"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''}/> 
            Actualizar
          </button>
        </div>

      </div>
    </div>
  );

  return (
    <>
      {/* BOTÓN (Se mantiene en su lugar controlado por el padre) */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`w-14 h-14 bg-white border border-gray-100 rounded-full shadow-lg text-blue-600 flex items-center justify-center active:scale-90 transition-all hover:scale-105 ${className}`}
      >
        <DollarSign size={24} strokeWidth={3} />
      </button>

      {/* PORTAL MAGICO: Esto saca la ventana del botón y la pone en el centro real */}
      {isOpen && createPortal(ModalContent, document.body)}
    </>
  );
};

export default MobileExchangeBtn;