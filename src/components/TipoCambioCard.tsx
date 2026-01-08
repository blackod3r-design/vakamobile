import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, RefreshCw } from 'lucide-react';

interface TipoCambioData {
  compra: number;
  venta: number;
  fecha: string;
  timestamp: number;
}

const STORAGE_KEY = 'tipoCambioData';
const UPDATE_INTERVAL = 6 * 60 * 60 * 1000; // 6 horas

export const TipoCambioCard = () => {
  const [data, setData] = useState<TipoCambioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [penAmount, setPenAmount] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const fetchTipoCambio = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      setLoading(true);
      const response = await fetch('https://corsproxy.io/?https://api.apis.net.pe/v1/tipo-cambio-sunat');
      
      if (!response.ok) throw new Error('Error al obtener datos');

      const result = await response.json();
      
      const newData: TipoCambioData = {
        compra: result.compra,
        venta: result.venta,
        fecha: result.fecha,
        timestamp: Date.now()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Error al actualizar');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setData(JSON.parse(stored));
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  const handleManualRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    fetchTipoCambio(true);
  };

  const calculateUSD = (): string => {
    if (!penAmount || !data) return '0.00';
    const pen = parseFloat(penAmount);
    if (isNaN(pen)) return '0.00';
    return (pen / data.venta).toFixed(2);
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const storedData = JSON.parse(stored);
      setData(storedData);
      const timeSinceUpdate = Date.now() - storedData.timestamp;
      if (timeSinceUpdate > UPDATE_INTERVAL) fetchTipoCambio();
      else setLoading(false);
    } else {
      fetchTipoCambio();
    }
    const interval = setInterval(fetchTipoCambio, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="inline-flex h-[68px] w-full max-w-[350px] items-center gap-4 rounded-full border border-gray-100 bg-white p-2 shadow-sm">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
           <Skeleton className="h-3 w-20" />
           <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="group cursor-pointer inline-flex h-[68px] items-center gap-5 rounded-full border border-gray-200/80 bg-white/90 pl-3 pr-3 shadow-lg shadow-gray-200/50 backdrop-blur-md transition-all hover:border-blue-200 hover:shadow-xl hover:scale-[1.01]">
          
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30">
            <TrendingUp size={22} strokeWidth={2.5} />
          </div>

          <div className="flex items-center gap-6 px-2">
            <div className="flex flex-col justify-center leading-none">
              <span className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">Compra</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-medium text-gray-500">S/</span>
                <span className="text-[22px] font-bold tracking-tight text-gray-800">
                  {data?.compra.toFixed(3) || '---'}
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-gray-200"></div>

            <div className="flex flex-col justify-center leading-none">
              <span className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-blue-600">Venta</span>
              <div className="flex items-baseline gap-1">
                <span className="text-xs font-medium text-blue-500">S/</span>
                <span className="text-[22px] font-bold tracking-tight text-blue-600">
                  {data?.venta.toFixed(3) || '---'}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="group/btn flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/30 transition-all hover:scale-105 hover:shadow-blue-500/50 active:scale-95 disabled:opacity-70"
            title="Actualizar tipo de cambio"
          >
            <RefreshCw 
              size={20} 
              strokeWidth={2.5} 
              className={`transition-transform duration-700 ease-in-out group-hover/btn:rotate-180 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </button>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 overflow-hidden border-border z-50 rounded-2xl shadow-xl" align="center" sideOffset={10}>
        <div className="bg-gradient-to-br from-white to-gray-50 p-5">
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="pen-amount" className="text-sm font-semibold text-gray-700">
                        Calculadora Rápida
                        </Label>
                        <span className="text-[10px] text-muted-foreground">TC Venta: {data?.venta.toFixed(3)}</span>
                    </div>
                    
                    {/* INPUT CORREGIDO: Texto centrado, sin icono cruzado */}
                    <div className="relative">
                        <Input
                            id="pen-amount"
                            type="number"
                            placeholder="S/ 0.00"
                            value={penAmount}
                            onChange={(e) => setPenAmount(e.target.value)}
                            className="text-center text-lg font-bold h-12 bg-white border-gray-200 focus:ring-blue-500/20 placeholder:text-gray-300"
                            autoFocus
                        />
                    </div>
                </div>
            
                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Recibes</span>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700 tracking-tight">
                            $ {calculateUSD()}
                        </p>
                        <p className="text-[10px] text-blue-400 font-medium">Dólares Americanos</p>
                    </div>
                </div>
            
                {error && <p className="text-xs text-red-500 text-center bg-red-50 p-1 rounded">{error}</p>}
            </div>
        </div>
        <div className="bg-gray-50 px-5 py-2 border-t border-gray-100 flex justify-between items-center">
             <span className="text-[10px] text-gray-400">Actualizado: {data?.fecha}</span>
             <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </PopoverContent>
    </Popover>
  );
};