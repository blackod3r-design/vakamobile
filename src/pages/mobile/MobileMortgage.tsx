import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Home, Upload, Calculator, DollarSign, TrendingDown, Wallet, 
  Plus, FileSpreadsheet, Clock, Calendar, CreditCard, 
  Trash2, AlertTriangle, ArrowDownCircle, ArrowRight, Save, 
  ArrowLeft, MoreVertical, ChevronRight, CheckCircle2
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { useTheme } from '@/contexts/ThemeContext';

// --- GENERADOR DE ID SEGURO (Fix para móviles) ---
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// --- TIPOS ---
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

const MobileMortgage = () => {
  const navigate = useNavigate();
  const { mortgage, updateMortgage } = useData();
  const { theme } = useTheme(); 

  const isDark = theme === 'dark' || theme === 'solid' || theme === 'dark-glass';

  // --- ESTADOS ---
  const [setupMode, setSetupMode] = useState<'excel' | 'manual' | null>(null);
  const [showAbonoDialog, setShowAbonoDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Setup Manual
  const [montoCredito, setMontoCredito] = useState('');
  const [plazoMeses, setPlazoMeses] = useState('');
  const [tasaAnual, setTasaAnual] = useState('');
  const [seguroMensual, setSeguroMensual] = useState('');

  // Abonos
  const [montoAbono, setMontoAbono] = useState('');
  const [tipoAbono, setTipoAbono] = useState<'reducirCuota' | 'reducirPlazo'>('reducirCuota');
  const [tasaReferencialAbono, setTasaReferencialAbono] = useState('');
  
  // Simulación
  const [simulacion, setSimulacion] = useState<{
    nuevoValor: number;
    valorActual: number;
    ahorro: number;
    diferencia: number;
    esPlazo: boolean;
    tasaUsada: number;
  } | null>(null);

  // ========== EFECTO SIMULACIÓN (Cálculo en tiempo real) ==========
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
    
    let tasaUsada = mortgage.tasaAnual || 0;
    if (tasaUsada === 0 && tasaReferencialAbono) {
        tasaUsada = parseFloat(tasaReferencialAbono);
    }

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
        tasaUsada
    });

  }, [montoAbono, tipoAbono, tasaReferencialAbono, mortgage, showAbonoDialog]);

  // ========== HANDLERS ==========

  const handleRegistrarPago = () => {
    const cronograma = mortgage.cronograma || [];
    if (cronograma.length === 0) { toast.error("No hay cronograma configurado"); return; }
    const saldoActual = mortgage.saldoActual || 0;
    if (saldoActual <= 0) { toast.success("¡Crédito pagado totalmente!"); return; }

    const pagosActuales = mortgage.pagos || [];
    const numeroCuotaActual = pagosActuales.length + 1;
    let nuevoPago: Pago;
    let nuevoSaldo = 0;
    let nuevoTotalAPagar = mortgage.totalAPagar || 0; 

    if (mortgage.modo === 'excel' && cronograma.length > 0) {
      const idx = pagosActuales.length; 
      const fila = cronograma[idx];
      if (!fila) { toast.info('Cronograma finalizado'); return; }

      nuevoPago = {
        id: generateId(),
        fecha: new Date().toISOString(), 
        numeroCuota: fila.cuota,
        cuotaPagada: fila.cuotaMensual, 
        capital: fila.capital, 
        interes: fila.interes, 
        seguro: fila.seguro, 
        saldoPosterior: fila.saldoFinal
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
      toast.success(`Pago registrado. Capital: ${mortgage.currency || '$'}${fila.capital.toLocaleString()}`);
    } else {
        const tasaMensual = Math.pow(1 + (mortgage.tasaAnual || 8.5) / 100, 1 / 12) - 1;
        const interesPagado = (mortgage.saldoActual || 0) * tasaMensual;
        const capitalPagado = (mortgage.monthlyPayment || 0) - interesPagado;
        nuevoSaldo = Math.max(0, (mortgage.saldoActual || 0) - capitalPagado);

        nuevoPago = {
            id: generateId(),
            fecha: new Date().toISOString(), 
            numeroCuota: numeroCuotaActual,
            cuotaPagada: mortgage.monthlyPayment || 0, 
            capital: capitalPagado, 
            interes: interesPagado, 
            saldoPosterior: nuevoSaldo
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
        toast.success(`Pago registrado. Capital: ${mortgage.currency || '$'}${capitalPagado.toLocaleString(undefined, {minimumFractionDigits: 2})}`);
    }
  };

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
             
             updateMortgage({ 
                 modo:'excel', cronograma, monthlyPayment: cuotaMensual, saldoActual: saldoInicial, 
                 totalAPagar: cuotaMensual*totalCuotas, interesesAhorrados:0, totalAmount:saldoInicial, 
                 abonos:[], pagos:[], plazoRestante:totalCuotas 
             });
             toast.success("Excel cargado correctamente"); 
             setSetupMode(null);
         } catch(err) { toast.error("Error al leer el archivo Excel"); }
      };
      reader.readAsBinaryString(file);
  };
  
  const handleGenerarCronograma = () => {
      const P=parseFloat(montoCredito), n=parseInt(plazoMeses), TREA=parseFloat(tasaAnual), seg=parseFloat(seguroMensual);
      if(!P||!n||!TREA) return toast.error("Faltan datos");
      
      const r = Math.pow(1+TREA/100, 1/12)-1;
      const C = (P*r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1);
      const cronograma: ScheduleRow[] = [];
      let saldo = P;
      for(let i=1; i<=n; i++){
          const int = saldo*r; const cap = C-int; saldo-=cap;
          cronograma.push({ cuota:i, cuotaMensual:C+seg, interes:int, capital:cap, seguro:seg, saldoFinal:Math.max(0,saldo) });
      }
      
      updateMortgage({ 
          modo:'manual', montoCredito:P, plazoMeses:n, tasaAnual:TREA, seguroMensual:seg, 
          cronograma, monthlyPayment:C+seg, saldoActual:P, totalAPagar:(C+seg)*n, 
          interesesAhorrados:0, totalAmount:P, abonos:[], pagos:[], plazoRestante:n 
      });
      toast.success("Cronograma generado"); 
      setSetupMode(null);
  };

  const handleAbonarCapital = () => {
    if (!simulacion) return;

    const abono = parseFloat(montoAbono);
    const saldoAntes = mortgage.saldoActual || 0;
    const nuevoSaldo = Math.max(0, saldoAntes - abono);
    const nuevoPlazo = simulacion.esPlazo ? simulacion.nuevoValor : (mortgage.plazoRestante ?? 0);
    const interesesAhorradosTotal = (mortgage.interesesAhorrados || 0) + simulacion.ahorro;

    const nuevoAbono: Abono = {
        id: generateId(), 
        fecha: new Date().toISOString(), monto: abono, tipo: tipoAbono, ahorroInteres: simulacion.ahorro
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

    if ((!mortgage.tasaAnual || mortgage.tasaAnual === 0) && tasaReferencialAbono) {
        updates.tasaAnual = parseFloat(tasaReferencialAbono);
    }

    updateMortgage(updates);
    toast.success("Abono registrado correctamente");
    setShowAbonoDialog(false);
    setMontoAbono('');
    setTasaReferencialAbono('');
    setSimulacion(null);
  };

  const handleEliminarHipoteca = () => {
    updateMortgage({ 
        modo: undefined, cronograma: [], monthlyPayment: 0, saldoActual: 0, totalAPagar: 0, 
        interesesAhorrados: 0, totalAmount: 0, abonos: [], pagos: [], plazoRestante: 0, 
        montoCredito: 0, plazoMeses: 0, tasaAnual: 0, seguroMensual: 0 
    });
    setShowDeleteConfirm(false);
    toast.success("Hipoteca eliminada");
  };

  // =================================================================================
  // VISTA 1: CONFIGURACIÓN INICIAL (EMPTY STATE)
  // =================================================================================
  if (!mortgage.cronograma || mortgage.cronograma.length === 0) {
    return (
      <div className={`min-h-screen w-full flex flex-col font-sans ${isDark ? 'bg-black text-white' : 'bg-[#F2F2F7] text-gray-900'}`}>
        {/* Header */}
        <div className="pt-12 pb-4 px-6">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="-ml-2 rounded-full" onClick={() => navigate(-1)}>
                    <ArrowLeft className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
                </Button>
                <h1 className="text-2xl font-bold">Hipoteca</h1>
            </div>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Configura tu crédito para empezar</p>
        </div>

        <div className="flex-1 px-6 flex flex-col justify-center items-center gap-6 pb-20">
            <div className={`w-full p-8 rounded-[32px] border flex flex-col items-center text-center gap-4 ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-200'}`}>
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-2">
                    <Home className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold">Sin configuración</h2>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Puedes cargar un Excel de tu banco o crear un cronograma manual.
                </p>
                
                <div className="grid w-full gap-3 mt-4">
                    <Button className="h-14 text-lg bg-indigo-600 hover:bg-indigo-700 rounded-xl" onClick={() => setSetupMode('manual')}>
                        <Calculator className="mr-2 w-5 h-5" /> Calcular Manual
                    </Button>
                    <div className="relative">
                        <input type="file" className="absolute inset-0 opacity-0 z-10 w-full h-full" onChange={handleFileUpload} accept=".xlsx,.xls" />
                        <Button variant="outline" className={`w-full h-14 text-lg rounded-xl ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white'}`}>
                            <FileSpreadsheet className="mr-2 w-5 h-5" /> Cargar Excel
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        {/* DIALOG SETUP MANUAL */}
        <Dialog open={setupMode === 'manual'} onOpenChange={() => setSetupMode(null)}>
            <DialogContent className={`w-[90%] rounded-2xl ${isDark ? 'bg-[#1c1c1e] border-zinc-800 text-white' : 'bg-white'}`}>
                <DialogHeader><DialogTitle>Configuración Manual</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                    <div><Label>Monto Préstamo</Label><Input type="number" placeholder="Ej: 300000" value={montoCredito} onChange={e=>setMontoCredito(e.target.value)} className={isDark ? 'bg-[#2c2c2e] border-transparent' : ''}/></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><Label>Plazo (Meses)</Label><Input type="number" placeholder="240" value={plazoMeses} onChange={e=>setPlazoMeses(e.target.value)} className={isDark ? 'bg-[#2c2c2e] border-transparent' : ''}/></div>
                        <div><Label>Tasa Anual %</Label><Input type="number" placeholder="8.5" value={tasaAnual} onChange={e=>setTasaAnual(e.target.value)} className={isDark ? 'bg-[#2c2c2e] border-transparent' : ''}/></div>
                    </div>
                    <div><Label>Seguro Mensual (Opcional)</Label><Input type="number" placeholder="50" value={seguroMensual} onChange={e=>setSeguroMensual(e.target.value)} className={isDark ? 'bg-[#2c2c2e] border-transparent' : ''}/></div>
                    <Button onClick={handleGenerarCronograma} className="w-full h-12 bg-indigo-600 text-lg mt-2">Generar</Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    );
  }

  // =================================================================================
  // VISTA 2: DASHBOARD HIPOTECA
  // =================================================================================
  return (
    <div className={`min-h-screen w-full flex flex-col font-sans pb-20 ${isDark ? 'bg-black text-white' : 'bg-[#F2F2F7] text-gray-900'}`}>
        
        {/* Header */}
        <div className={`px-6 pt-12 pb-4 flex justify-between items-center ${isDark ? 'bg-black' : 'bg-[#F2F2F7]'}`}>
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="-ml-2 rounded-full" onClick={() => navigate(-1)}>
                    <ArrowLeft className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
                </Button>
                <h1 className="text-2xl font-bold">Mi Hipoteca</h1>
            </div>
            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="w-5 h-5" />
            </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-6">
            
            {/* HERO CARD (Saldo) */}
            <div className="relative w-full h-[200px] rounded-[32px] bg-gradient-to-br from-indigo-600 to-violet-800 shadow-xl overflow-hidden text-white p-6 flex flex-col justify-between">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <p className="text-xs uppercase opacity-70 font-bold tracking-widest">Saldo Pendiente</p>
                        <p className="text-4xl font-mono font-bold tracking-tighter mt-1">
                            {mortgage.currency || '$'}{(Number(mortgage.saldoActual) || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                    </div>
                    <Home className="w-8 h-8 opacity-50" />
                </div>
                
                <div className="relative z-10 grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[10px] uppercase opacity-70 mb-1">Próxima Cuota</p>
                        <p className="text-xl font-bold">{mortgage.currency || '$'}{(Number(mortgage.monthlyPayment) || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] uppercase opacity-70 mb-1">Restante</p>
                        <p className="text-xl font-bold">{mortgage.plazoRestante} meses</p>
                    </div>
                </div>
                
                {/* Decoración Fondo */}
                <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* BOTONES ACCIÓN */}
            <div className="grid grid-cols-2 gap-4">
                <Button 
                    className={`h-24 rounded-[24px] flex flex-col items-center justify-center gap-2 shadow-sm ${isDark ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white border border-[#2c2c2e]' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-100'}`}
                    onClick={handleRegistrarPago}
                >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold">Pagar Mes</span>
                </Button>

                <Button 
                    className={`h-24 rounded-[24px] flex flex-col items-center justify-center gap-2 shadow-sm ${isDark ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white border border-[#2c2c2e]' : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-100'}`}
                    onClick={() => setShowAbonoDialog(true)}
                >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <ArrowDownCircle className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold">Amortizar</span>
                </Button>
            </div>

            {/* STATS SECUNDARIOS */}
            <div className={`p-5 rounded-[24px] border flex justify-between items-center ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100'}`}>
                <div>
                    <p className="text-xs text-emerald-500 font-bold uppercase mb-1">Ahorro en Intereses</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {mortgage.currency || '$'}{(Number(mortgage.interesesAhorrados) || 0).toLocaleString()}
                    </p>
                </div>
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                    <Wallet className="w-5 h-5" />
                </div>
            </div>

            {/* HISTORIAL RECIENTE (Pagos y Abonos mezclados por fecha si quisieras, aquí mostramos pagos) */}
            <div>
                <h3 className={`font-bold mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Últimos Pagos</h3>
                <div className="space-y-3">
                    {(mortgage.pagos || []).slice().reverse().slice(0, 5).map((pago: any) => (
                        <div key={pago.id} className={`p-4 rounded-[20px] border flex justify-between items-center ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                                    #{pago.numeroCuota}
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Pago Cuota</p>
                                    <p className="text-xs text-gray-500">{new Date(pago.fecha).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {mortgage.currency}{(Number(pago.cuotaPagada) || 0).toLocaleString()}
                            </span>
                        </div>
                    ))}
                    {(mortgage.pagos || []).length === 0 && <p className="text-center text-sm text-gray-400 py-4">No hay pagos registrados</p>}
                </div>
            </div>

        </div>

        {/* DIALOGO ABONO / SIMULADOR */}
        <Dialog open={showAbonoDialog} onOpenChange={setShowAbonoDialog}>
            <DialogContent className={`w-[95%] rounded-[24px] ${isDark ? 'bg-[#1c1c1e] border-zinc-800 text-white' : 'bg-white'}`}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-indigo-500"/> Simulador</DialogTitle>
                    <DialogDescription>Calcula cuánto ahorrarás abonando a capital.</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 pt-2">
                    <div>
                        <Label>Monto a abonar</Label>
                        <Input 
                            type="number" 
                            className={`h-14 text-2xl font-bold ${isDark ? 'bg-[#2c2c2e] border-transparent' : 'bg-gray-50'}`} 
                            placeholder="0.00" 
                            value={montoAbono} 
                            onChange={e => setMontoAbono(e.target.value)} 
                            autoFocus
                        />
                    </div>

                    {(!mortgage.tasaAnual || mortgage.tasaAnual === 0) && (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                            <Label className="text-amber-600 flex items-center gap-2 text-xs mb-2"><AlertTriangle className="h-3 w-3"/> Tasa Anual requerida</Label>
                            <Input 
                                type="number" 
                                placeholder="Ej: 8.5" 
                                value={tasaReferencialAbono} 
                                onChange={e => setTasaReferencialAbono(e.target.value)} 
                                className={isDark ? 'bg-[#2c2c2e] border-transparent' : 'bg-white'} 
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${tipoAbono==='reducirCuota' ? 'bg-indigo-600 text-white border-indigo-600' : (isDark ? 'bg-[#2c2c2e] border-transparent text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600')}`} 
                            onClick={()=>setTipoAbono('reducirCuota')}
                        >
                            Reducir Cuota
                        </button>
                        <button 
                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${tipoAbono==='reducirPlazo' ? 'bg-indigo-600 text-white border-indigo-600' : (isDark ? 'bg-[#2c2c2e] border-transparent text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600')}`} 
                            onClick={()=>setTipoAbono('reducirPlazo')}
                        >
                            Reducir Plazo
                        </button>
                    </div>

                    <AnimatePresence>
                        {simulacion && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-sm"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-emerald-600 font-bold uppercase text-xs">Ahorro Estimado</span>
                                    <span className="text-emerald-600 font-bold text-lg">{mortgage.currency || '$'}{simulacion.ahorro.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Nueva Cuota/Plazo:</span>
                                    <span className="font-semibold text-emerald-600">
                                        {simulacion.esPlazo ? `${simulacion.nuevoValor} meses` : `${mortgage.currency}${simulacion.nuevoValor.toLocaleString(undefined, {maximumFractionDigits: 0})}`}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button onClick={handleAbonarCapital} className="w-full h-12 text-lg bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                        Confirmar Abono
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* DIALOG DELETE */}
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className={`w-[80%] rounded-2xl ${isDark ? 'bg-[#1c1c1e] border-zinc-800 text-white' : 'bg-white'}`}>
                <DialogHeader><DialogTitle>¿Eliminar Hipoteca?</DialogTitle></DialogHeader>
                <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                    <Button variant="destructive" className="flex-1" onClick={handleEliminarHipoteca}>Eliminar</Button>
                </div>
            </DialogContent>
        </Dialog>

    </div>
  );
};

export default MobileMortgage;