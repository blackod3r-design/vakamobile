import React, { useState, useRef, useEffect } from 'react';
import { Home, Upload, Calculator, DollarSign, TrendingDown, Wallet, Plus, FileSpreadsheet, X, Clock, Calendar, CreditCard, ChevronRight, Trash2, Edit, AlertTriangle, ArrowDownCircle, ArrowRight, Save, Percent } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

// IMPORTAR USE THEME
import { useTheme } from '@/contexts/ThemeContext';

// --- DEFINICIÓN DE TIPOS ---
interface ScheduleRow {
  cuota: number;
  fecha?: string;
  cuotaMensual: number;
  interes: number;
  capital: number;
  seguro: number;
  saldoFinal: number;
}

interface Abono {
  id: string;
  fecha: string;
  monto: number;
  tipo: 'reducirCuota' | 'reducirPlazo';
  ahorroInteres: number;
}

interface Pago {
  id: string;
  fecha: string;
  numeroCuota: number;
  cuotaPagada: number;
  capital: number;
  interes: number;
  seguro?: number;
  saldoPosterior: number;
}

const Mortgage = () => {
  const dataContext = useData();
  const { theme } = useTheme(); 

  // --- LÓGICA DE FONDO ---
  const getPageBackground = () => {
    if (theme === 'dark' || theme === 'dark-glass' || theme.includes('dark')) return 'bg-[#0f0f0f] text-white';
    if (theme === 'glass') return 'bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900';
    return 'bg-white text-gray-900';
  };
  const pageBgClass = getPageBackground();

  // --- ESTILOS DINÁMICOS ---
  let cardContainerClass = '';
  let textMainClass = 'text-gray-900';
  let textSubClass = 'text-gray-500';
  let tableHeaderClass = 'bg-gray-50/80 border-b border-gray-100 text-gray-600';
  let tableRowClass = 'hover:bg-indigo-50/30 transition-colors border-t border-gray-100';
  let tableTextClass = 'text-gray-600';

  if (theme === 'dark' || theme === 'dark-glass' || theme.includes('dark')) {
      cardContainerClass = 'bg-[#181818] border-[#27272a] shadow-black text-white';
      textMainClass = 'text-white';
      textSubClass = 'text-gray-400';
      tableHeaderClass = 'bg-[#27272a] border-b border-[#3f3f46] text-gray-300';
      tableRowClass = 'hover:bg-[#27272a] transition-colors border-t border-[#3f3f46]';
      tableTextClass = 'text-gray-300';
  } else if (theme === 'glass') {
      cardContainerClass = 'bg-white/70 border-white/40 shadow-xl backdrop-blur-3xl ring-1 ring-white/70 text-gray-900';
      textMainClass = 'text-gray-900';
      textSubClass = 'text-gray-500';
  } else {
      cardContainerClass = 'bg-white border-gray-100 shadow-xl shadow-gray-200/50 text-gray-900';
      textMainClass = 'text-gray-900';
      textSubClass = 'text-gray-500';
  }

  if (!dataContext) return <div className={`p-8 ${pageBgClass}`}>Cargando...</div>;
  const { mortgage, updateMortgage } = dataContext;

  const [setupMode, setSetupMode] = useState<'excel' | 'manual' | null>(null);
  const [showAbonoDialog, setShowAbonoDialog] = useState(false);
  const [showAllPagos, setShowAllPagos] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingPago, setEditingPago] = useState<Pago | null>(null);
  
  // Estados de edición
  const [editCuota, setEditCuota] = useState('');
  const [editInteres, setEditInteres] = useState('');
  const [editCapital, setEditCapital] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados setup manual
  const [montoCredito, setMontoCredito] = useState('');
  const [plazoMeses, setPlazoMeses] = useState('');
  const [tasaAnual, setTasaAnual] = useState('');
  const [seguroMensual, setSeguroMensual] = useState('');

  // Estados para abono
  const [montoAbono, setMontoAbono] = useState('');
  const [tipoAbono, setTipoAbono] = useState<'reducirCuota' | 'reducirPlazo'>('reducirCuota');
  const [tasaReferencialAbono, setTasaReferencialAbono] = useState('');
  
  // Estado para la simulación visual
  const [simulacion, setSimulacion] = useState<{
    nuevoValor: number;
    valorActual: number;
    ahorro: number;
    diferencia: number;
    esPlazo: boolean;
    tasaUsada: number; // NUEVO: Para mostrar qué tasa se usó
  } | null>(null);

  // ========== EFECTO PARA SIMULAR EN TIEMPO REAL ==========
  useEffect(() => {
    const abono = parseFloat(montoAbono);
    if (!showAbonoDialog || !abono || abono <= 0) {
        setSimulacion(null);
        return;
    }

    const saldoActual = mortgage.saldoActual || 0;
    const pagosHechos = (mortgage.pagos || []).length;
    const plazoRestanteActual = mortgage.plazoRestante ?? Math.max(0, (mortgage.cronograma?.length || 0) - pagosHechos);
    const cuotaActualConSeguro = mortgage.monthlyPayment || 0;
    const seguro = mortgage.seguroMensual || 0;
    
    // --- AQUÍ ESTÁ LA CLAVE DEL INTERÉS ---
    // 1. Intentamos tomar la tasa guardada en el sistema.
    // 2. Si es 0 (porque vino de Excel), intentamos tomar la que el usuario acaba de escribir en el input.
    let tasaUsada = mortgage.tasaAnual || 0;
    if (tasaUsada === 0 && tasaReferencialAbono) {
        tasaUsada = parseFloat(tasaReferencialAbono);
    }

    // Si sigue siendo 0 o inválida, no podemos simular reducción de plazo
    if (tasaUsada <= 0 && tipoAbono === 'reducirPlazo') {
        setSimulacion(null);
        return;
    }

    const r = Math.pow(1 + tasaUsada / 100, 1 / 12) - 1;
    const cuotaBase = Math.max(0, cuotaActualConSeguro - seguro);
    const nuevoSaldo = Math.max(0, saldoActual - abono);
    const totalOriginal = cuotaActualConSeguro * plazoRestanteActual;

    let nuevoTotal = 0;
    let nuevoValor = 0;
    let valorActual = 0;
    let diferencia = 0;

    if (tipoAbono === 'reducirCuota') {
        valorActual = cuotaActualConSeguro;
        const nRest = plazoRestanteActual;
        let nuevaCuotaConSeguro = 0;
        
        if (nRest <= 0 || r <= 0) {
             nuevaCuotaConSeguro = (nuevoSaldo / nRest) + seguro;
        } else {
             const nuevaCuotaSinSeguro = (nuevoSaldo * r * Math.pow(1 + r, nRest)) / (Math.pow(1 + r, nRest) - 1);
             nuevaCuotaConSeguro = nuevaCuotaSinSeguro + seguro;
        }
        
        nuevoValor = nuevaCuotaConSeguro;
        nuevoTotal = nuevaCuotaConSeguro * nRest;
        diferencia = valorActual - nuevoValor;

    } else {
        valorActual = plazoRestanteActual;
        if (cuotaBase <= nuevoSaldo * r) {
            setSimulacion(null); 
            return;
        }
        const denom = cuotaBase - nuevoSaldo * r;
        const nuevoPlazo = Math.ceil(Math.log(cuotaBase / denom) / Math.log(1 + r));
        nuevoValor = nuevoPlazo;
        nuevoTotal = (cuotaBase + seguro) * nuevoPlazo;
        diferencia = valorActual - nuevoValor;
    }

    const ahorroInteres = Math.max(0, totalOriginal - nuevoTotal);

    setSimulacion({
        nuevoValor,
        valorActual,
        ahorro: ahorroInteres,
        diferencia,
        esPlazo: tipoAbono === 'reducirPlazo',
        tasaUsada // Guardamos la tasa usada para mostrarla
    });

  }, [montoAbono, tipoAbono, tasaReferencialAbono, mortgage, showAbonoDialog]);


  // ========== REGISTRAR PAGO (INTACTO) ==========
  const handleRegistrarPago = () => {
    const cronograma = mortgage.cronograma || [];
    if (cronograma.length === 0) { toast({ title: "Error", description: "No hay cronograma", variant: "destructive" }); return; }
    const saldoActual = mortgage.saldoActual || 0;
    if (saldoActual <= 0) { toast({ title: "Crédito pagado", description: "El saldo es 0" }); return; }

    const pagosActuales = mortgage.pagos || [];
    const numeroCuotaActual = pagosActuales.length + 1;
    let nuevoPago: Pago;
    let nuevoSaldo = 0;
    let nuevoTotalAPagar = mortgage.totalAPagar || 0; 

    if (mortgage.modo === 'excel' && cronograma.length > 0) {
      const idx = pagosActuales.length; 
      const fila = cronograma[idx];
      if (!fila) { toast({ title: 'Info', description: 'Cronograma finalizado' }); return; }

      nuevoPago = {
        id: crypto.randomUUID(), fecha: new Date().toISOString(), numeroCuota: fila.cuota,
        cuotaPagada: fila.cuotaMensual, capital: fila.capital, interes: fila.interes, seguro: fila.seguro, saldoPosterior: fila.saldoFinal
      };
      nuevoSaldo = fila.saldoFinal;
      nuevoTotalAPagar = Math.max(0, nuevoTotalAPagar - fila.cuotaMensual); 

      const nuevosPagos = [...pagosActuales, nuevoPago];
      const nuevoPlazoRestante = Math.max(0, cronograma.length - (idx + 1));

      updateMortgage({ 
          saldoActual: nuevoSaldo, 
          pagos: nuevosPagos, 
          plazoRestante: nuevoPlazoRestante,
          totalAPagar: nuevoTotalAPagar 
      });
      toast({ title: '✅ Pago registrado', description: `Capital: ${mortgage.currency || '$'}${fila.capital.toLocaleString()}` });
    } else {
        const tasaMensual = Math.pow(1 + (mortgage.tasaAnual || 8.5) / 100, 1 / 12) - 1;
        const interesPagado = (mortgage.saldoActual || 0) * tasaMensual;
        const capitalPagado = (mortgage.monthlyPayment || 0) - interesPagado;
        nuevoSaldo = Math.max(0, (mortgage.saldoActual || 0) - capitalPagado);

        nuevoPago = {
            id: crypto.randomUUID(), fecha: new Date().toISOString(), numeroCuota: numeroCuotaActual,
            cuotaPagada: mortgage.monthlyPayment || 0, capital: capitalPagado, interes: interesPagado, saldoPosterior: nuevoSaldo
        };
        nuevoTotalAPagar = Math.max(0, nuevoTotalAPagar - (mortgage.monthlyPayment || 0));

        const nuevosPagos = [...pagosActuales, nuevoPago];
        const nuevoPlazoRestante = Math.max(0, (mortgage.plazoRestante || cronograma.length || 0) - 1);
        
        updateMortgage({ 
            saldoActual: nuevoSaldo, 
            pagos: nuevosPagos, 
            plazoRestante: nuevoPlazoRestante,
            totalAPagar: nuevoTotalAPagar 
        });
        toast({ title: '✅ Pago registrado', description: `Capital: ${mortgage.currency || '$'}${capitalPagado.toLocaleString()}` });
    }
  };

  // ========== CARGA EXCEL / MANUAL (Intacto) ==========
  const handleFileUpload = (e: any) => { 
      const file = e.target.files?.[0]; if(!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
         try {
             const data = evt.target?.result;
             const workbook = XLSX.read(data, {type:'binary'});
             const sheet = workbook.Sheets[workbook.SheetNames[0]];
             const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];
             if(jsonData.length===0) return;
             const parseNumber = (val:any) => { if(typeof val==='number') return val; if(!val) return 0; return parseFloat(String(val).replace(/[,\s]/g,'')) || 0; };
             const cronograma: ScheduleRow[] = jsonData.map((r,i) => ({
                 cuota: r['N° Cuota']||i+1, fecha: r['Fecha']||'', cuotaMensual: parseNumber(r['Cuota']),
                 interes: parseNumber(r['Interés']), capital: parseNumber(r['Capital']), seguro: parseNumber(r['Seguro']), saldoFinal: parseNumber(r['Saldo Final'])
             }));
             const totalCuotas = cronograma.length;
             const cuotaMensual = cronograma[0]?.cuotaMensual || 0;
             const saldoInicial = (cronograma[0]?.saldoFinal||0) + (cronograma[0]?.capital||0);
             updateMortgage({ modo:'excel', cronograma, monthlyPayment: cuotaMensual, saldoActual: saldoInicial, totalAPagar: cuotaMensual*totalCuotas, interesesAhorrados:0, totalAmount:saldoInicial, abonos:[], pagos:[], plazoRestante:totalCuotas });
             toast({ title:"✅ Excel cargado", description:`Saldo: ${saldoInicial}` }); setSetupMode(null);
         } catch(err) { toast({title:"Error", variant:"destructive"}); }
      };
      reader.readAsBinaryString(file);
  };
  
  const handleGenerarCronograma = (e: React.FormEvent) => {
      e.preventDefault();
      const P=parseFloat(montoCredito), n=parseInt(plazoMeses), TREA=parseFloat(tasaAnual), seg=parseFloat(seguroMensual);
      if(!P||!n||!TREA) return;
      const r = Math.pow(1+TREA/100, 1/12)-1;
      const C = (P*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
      const cronograma: ScheduleRow[] = [];
      let saldo = P;
      for(let i=1; i<=n; i++){
          const int = saldo*r; const cap = C-int; saldo-=cap;
          cronograma.push({ cuota:i, cuotaMensual:C+seg, interes:int, capital:cap, seguro:seg, saldoFinal:Math.max(0,saldo) });
      }
      updateMortgage({ modo:'manual', montoCredito:P, plazoMeses:n, tasaAnual:TREA, seguroMensual:seg, cronograma, monthlyPayment:C+seg, saldoActual:P, totalAPagar:(C+seg)*n, interesesAhorrados:0, totalAmount:P, abonos:[], pagos:[], plazoRestante:n });
      toast({ title:"✅ Cronograma generado" }); setSetupMode(null);
  };

  // ========== ABONAR A CAPITAL (CONFIRMAR) ==========
  const handleAbonarCapital = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulacion) {
        toast({ title: "Error", description: "No se pudo calcular el abono. Verifica la tasa.", variant: "destructive" });
        return;
    }

    const abono = parseFloat(montoAbono);
    const saldoAntes = mortgage.saldoActual || 0;
    const nuevoSaldo = Math.max(0, saldoAntes - abono);
    
    const nuevoPlazo = simulacion.esPlazo ? simulacion.nuevoValor : (mortgage.plazoRestante ?? 0);
    const interesesAhorradosTotal = (mortgage.interesesAhorrados || 0) + simulacion.ahorro;

    const nuevoAbono: Abono = {
        id: crypto.randomUUID(), fecha: new Date().toISOString(), monto: abono, tipo: tipoAbono, ahorroInteres: simulacion.ahorro
    };
    const nuevosAbonos = [...(mortgage.abonos || []), nuevoAbono];

    const updates: any = {
        saldoActual: nuevoSaldo,
        abonos: nuevosAbonos,
        interesesAhorrados: interesesAhorradosTotal,
        totalAPagar: (mortgage.totalAPagar || 0) - simulacion.ahorro - abono,
        plazoRestante: nuevoPlazo
    };
    
    if (tipoAbono === 'reducirCuota') {
        updates.monthlyPayment = simulacion.nuevoValor;
    }

    // Guardar la tasa que ingresó el usuario para no pedirla de nuevo
    if ((!mortgage.tasaAnual || mortgage.tasaAnual === 0) && tasaReferencialAbono) {
        updates.tasaAnual = parseFloat(tasaReferencialAbono);
    }

    updateMortgage(updates);
    toast({ title: "💰 Abono registrado", description: `Has guardado el cambio correctamente.` });
    setShowAbonoDialog(false);
    setMontoAbono('');
    setTasaReferencialAbono('');
    setSimulacion(null);
  };

  // ========== CRUD PAGOS ==========
  const handleEliminarHipoteca = () => {
    updateMortgage({ modo: undefined, cronograma: [], monthlyPayment: 0, saldoActual: 0, totalAPagar: 0, interesesAhorrados: 0, totalAmount: 0, abonos: [], pagos: [], plazoRestante: 0, montoCredito: 0, plazoMeses: 0, tasaAnual: 0, seguroMensual: 0 });
    setShowDeleteConfirm(false);
  };
  const handleEliminarPago = (id: string) => {
      const p = mortgage.pagos?.find(x=>x.id===id); if(!p)return;
      const news = mortgage.pagos?.filter(x=>x.id!==id)||[];
      updateMortgage({ pagos: news, saldoActual: p.saldoPosterior+p.capital, plazoRestante: (mortgage.plazoRestante||0)+1 });
  };
  const handleGuardarEdicion = () => { setEditingPago(null); };

  const pagosList = mortgage.pagos || [];
  const abonosList = mortgage.abonos || [];

  // ========== RENDER UI ==========
  
  if (!mortgage.cronograma || mortgage.cronograma.length === 0) {
    return (
      <div className={`p-8 animate-fade-in font-sans min-h-screen transition-colors duration-500 ${pageBgClass}`} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
        <div className="mb-10">
          <h1 className={`text-3xl font-bold mb-2 tracking-tight ${textMainClass}`}>Hipoteca</h1>
          <p className={textSubClass}>Configura tu crédito hipotecario para comenzar</p>
        </div>
        <div className="max-w-2xl mx-auto">
          <div className={`relative overflow-hidden rounded-[32px] border p-10 transition-all ${cardContainerClass}`}>
             <div className="flex flex-col items-center">
                 <Home className="w-16 h-16 text-indigo-600 mb-4" />
                 <h2 className={`text-2xl font-bold mb-4 ${textMainClass}`}>No tienes hipoteca configurada</h2>
                 <div className="grid grid-cols-2 gap-4 w-full">
                     <Button size="lg" className="h-16 bg-white text-gray-800 border" onClick={()=>setSetupMode('excel')}><FileSpreadsheet className="mr-2"/> Excel</Button>
                     <Button size="lg" className="h-16 bg-white text-gray-800 border" onClick={()=>setSetupMode('manual')}><Calculator className="mr-2"/> Manual</Button>
                 </div>
             </div>
          </div>
          {/* Modales setup (sin cambios) */}
          <Dialog open={setupMode === 'excel'} onOpenChange={()=>setSetupMode(null)}><DialogContent><div className="p-4"><input type="file" onChange={handleFileUpload} /></div></DialogContent></Dialog>
          <Dialog open={setupMode === 'manual'} onOpenChange={()=>setSetupMode(null)}><DialogContent><form onSubmit={handleGenerarCronograma} className="space-y-4"><Input placeholder="Monto" value={montoCredito} onChange={e=>setMontoCredito(e.target.value)}/><Input placeholder="Plazo" value={plazoMeses} onChange={e=>setPlazoMeses(e.target.value)}/><Input placeholder="Tasa %" value={tasaAnual} onChange={e=>setTasaAnual(e.target.value)}/><Button className="w-full">Generar</Button></form></DialogContent></Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-8 animate-fade-in font-sans min-h-screen transition-colors duration-500 ${pageBgClass}`} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className={`text-3xl font-bold mb-2 tracking-tight ${textMainClass}`}>Hipoteca</h1>
          <p className={textSubClass}>Control total de tu crédito hipotecario</p>
        </div>
        <Button variant="ghost" onClick={() => setShowDeleteConfirm(true)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Eliminar</Button>
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {[
            { label: "Saldo Actual", value: mortgage.saldoActual, color: theme?.includes('dark') ? "text-white" : "text-gray-900", icon: DollarSign, glow: "bg-gray-500/20" },
            { label: "Intereses Ahorrados", value: mortgage.interesesAhorrados || 0, color: "text-emerald-600", icon: Wallet, glow: "bg-emerald-500/20" },
            { label: "Total a Pagar", value: mortgage.totalAPagar || 0, color: "text-red-500", icon: TrendingDown, glow: "bg-red-500/20" },
            { label: "Cuota Mensual", value: mortgage.monthlyPayment, color: "text-indigo-600", icon: Calendar, glow: "bg-indigo-500/20" },
            { label: "Plazo Restante", value: mortgage.plazoRestante, isText: true, suffix: "meses", color: "text-blue-600", icon: Clock, glow: "bg-blue-500/20" }
        ].map((item, index) => (
            <div key={index} className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all hover:-translate-y-1 text-center ${cardContainerClass}`}>
                <div className={`absolute -right-10 -top-10 h-32 w-32 animate-pulse rounded-full blur-3xl mix-blend-multiply ${item.glow}`}></div>
                {theme !== 'dark' && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent opacity-50"></div>}
                <div className="relative z-10 flex flex-col items-center justify-between h-full">
                    <div className="mb-2 p-2 rounded-xl bg-white/50 border border-white/60 shadow-sm"><item.icon className={`h-5 w-5 ${item.color.replace('text-', 'text-opacity-80 ')}`} /></div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{item.label}</p>
                    <p className={`text-3xl font-light tracking-tight ${item.color}`}>{item.isText ? `${item.value} ${item.suffix}` : `${mortgage.currency || '$'}${item.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}</p>
                </div>
            </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <Button size="lg" onClick={handleRegistrarPago} className="flex-1 sm:flex-none h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl gap-2"><CreditCard /> Registrar pago del mes</Button>
        <Button size="lg" onClick={() => setShowAbonoDialog(true)} variant="outline" className="flex-1 sm:flex-none h-14 rounded-2xl gap-2"><ArrowDownCircle className="text-emerald-600"/> Abonar a capital / Simular</Button>
      </div>

      {/* HISTORIAL PAGOS Y ABONOS (Sin cambios) */}
      <div className={`relative overflow-hidden rounded-[32px] border p-8 ${cardContainerClass}`}>
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${textMainClass}`}>Historial de Pagos</h3>
                {pagosList.length > 5 && <Button variant="ghost" onClick={() => setShowAllPagos(true)} className={textSubClass}>Ver todos</Button>}
            </div>
            {pagosList.length > 0 ? (
                <div className={`overflow-x-auto rounded-2xl border ${theme === 'dark' ? 'bg-[#181818] border-[#3f3f46]' : 'bg-white/50 border-white/60'}`}>
                    <table className="w-full text-sm">
                        <thead className={tableHeaderClass}><tr><th className="p-4 text-left">N°</th><th className="p-4 text-left">Fecha</th><th className="p-4 text-right">Cuota</th><th className="p-4 text-right">Capital</th><th className="p-4 text-right">Saldo</th><th className="p-4 text-center">Acciones</th></tr></thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#3f3f46]' : 'divide-gray-100'}`}>
                            {pagosList.slice().reverse().slice(0, 5).map(p => (
                                <tr key={p.id} className={tableRowClass}>
                                    <td className="p-4 font-bold text-indigo-600">#{p.numeroCuota}</td>
                                    <td className={`p-4 ${tableTextClass}`}>{new Date(p.fecha).toLocaleDateString()}</td>
                                    <td className={`p-4 text-right ${textMainClass}`}>{p.cuotaPagada.toLocaleString()}</td>
                                    <td className="p-4 text-right text-emerald-600">{p.capital.toLocaleString()}</td>
                                    <td className={`p-4 text-right font-bold ${textMainClass}`}>{p.saldoPosterior.toLocaleString()}</td>
                                    <td className="p-4 text-center"><Button size="icon" variant="ghost" onClick={() => handleEliminarPago(p.id)}><Trash2 className="h-4 w-4 text-red-500"/></Button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <p className={`text-center py-10 ${textSubClass}`}>No hay pagos.</p>}
         </div>
      </div>
      
      {abonosList.length > 0 && (
          <div className={`mt-8 relative overflow-hidden rounded-[32px] border p-8 ${cardContainerClass}`}>
               <h3 className={`text-xl font-bold mb-6 relative z-10 ${textMainClass}`}>Historial de Abonos</h3>
               <div className={`relative z-10 overflow-x-auto rounded-2xl border ${theme === 'dark' ? 'bg-[#181818] border-[#3f3f46]' : 'bg-white/50 border-white/60'}`}>
                   <table className="w-full text-sm">
                       <thead className={tableHeaderClass}><tr><th className="p-4 text-left">Fecha</th><th className="p-4 text-right">Monto</th><th className="p-4 text-center">Tipo</th><th className="p-4 text-right">Ahorro</th></tr></thead>
                       <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#3f3f46]' : 'divide-gray-100'}`}>
                           {abonosList.slice().reverse().map(abono => (
                               <tr key={abono.id} className={tableRowClass}>
                                   <td className={`p-4 ${tableTextClass}`}>{new Date(abono.fecha).toLocaleDateString()}</td>
                                   <td className={`p-4 text-right font-bold ${textMainClass}`}>{mortgage.currency || '$'}{abono.monto.toLocaleString()}</td>
                                   <td className="p-4 text-center"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{abono.tipo === 'reducirCuota' ? 'Cuota' : 'Plazo'}</span></td>
                                   <td className="p-4 text-right text-emerald-600 font-bold">-{mortgage.currency || '$'}{abono.ahorroInteres.toLocaleString()}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
          </div>
      )}

      {/* DIALOGO ABONO CON SIMULACIÓN Y BOTONES SEPARADOS */}
      <Dialog open={showAbonoDialog} onOpenChange={setShowAbonoDialog}>
        <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Calculator className="h-5 w-5"/> Simulador y Abono</DialogTitle></DialogHeader>
            <form onSubmit={handleAbonarCapital} className="space-y-4 pt-2">
                <div><Label>Monto a abonar</Label><Input type="number" value={montoAbono} onChange={e => setMontoAbono(e.target.value)} autoFocus placeholder="0.00" /></div>
                
                {(!mortgage.tasaAnual || mortgage.tasaAnual === 0) && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                        <Label className="text-amber-800 flex items-center gap-2"><AlertTriangle className="h-4 w-4"/> Tasa Anual requerida</Label>
                        <Input type="number" step="0.01" placeholder="Ej: 8.5" value={tasaReferencialAbono} onChange={e => setTasaReferencialAbono(e.target.value)} className="bg-white mt-2" />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div className={`p-4 border rounded-xl cursor-pointer text-center transition-all ${tipoAbono==='reducirCuota'?'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold ring-1 ring-indigo-500':'hover:bg-gray-50'}`} onClick={()=>setTipoAbono('reducirCuota')}>Reducir Cuota</div>
                    <div className={`p-4 border rounded-xl cursor-pointer text-center transition-all ${tipoAbono==='reducirPlazo'?'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold ring-1 ring-indigo-500':'hover:bg-gray-50'}`} onClick={()=>setTipoAbono('reducirPlazo')}>Reducir Plazo</div>
                </div>

                {/* VISUALIZACIÓN DE LA SIMULACIÓN */}
                <AnimatePresence>
                    {simulacion && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm mt-4"
                        >
                            <div className="flex justify-between items-center mb-3 pb-3 border-b border-emerald-200/50">
                                <div>
                                    <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Simulación (No guardado)</p>
                                    <p className="text-xs text-emerald-600/70">
                                        Tasa usada: <strong>{simulacion.tasaUsada}%</strong>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-emerald-800 font-medium block">Intereses ahorrados:</span>
                                    <span className="text-emerald-700 font-bold text-lg">{mortgage.currency || '$'}{simulacion.ahorro.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 items-center text-center">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Actual</p>
                                    <p className="font-semibold text-gray-700">
                                        {simulacion.esPlazo ? `${simulacion.valorActual} meses` : `${mortgage.currency}${simulacion.valorActual.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
                                    </p>
                                </div>
                                <div className="flex justify-center"><ArrowRight className="h-4 w-4 text-emerald-400" /></div>
                                <div>
                                    <p className="text-xs text-emerald-600 font-bold mb-1">Nueva</p>
                                    <p className="font-bold text-emerald-700 text-lg">
                                        {simulacion.esPlazo ? `${simulacion.nuevoValor} meses` : `${mortgage.currency}${simulacion.nuevoValor.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* BOTONES DE ACCIÓN DIFERENCIADOS */}
                <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowAbonoDialog(false); setMontoAbono(''); setSimulacion(null); }}>
                        Cerrar (Solo ver)
                    </Button>
                    <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2">
                        <Save className="h-4 w-4" /> Registrar Real
                    </Button>
                </div>
            </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}><DialogContent><DialogTitle>¿Eliminar?</DialogTitle><Button variant="destructive" onClick={handleEliminarHipoteca}>Si, eliminar</Button></DialogContent></Dialog>
    </div>
  );
};

export default Mortgage;