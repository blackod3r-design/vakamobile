import React, { useState, useRef } from 'react';
import { Home, Upload, Calculator, DollarSign, TrendingDown, Plus, FileSpreadsheet, X, Clock, Calendar, CreditCard, ChevronRight, Trash2, Edit, AlertTriangle, ArrowDownCircle, Wallet } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

// IMPORTAR USE THEME
import { useTheme } from '@/contexts/ThemeContext';

// --- DEFINICIÓN DE TIPOS LOCALES ---
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
  const { theme } = useTheme(); // Obtenemos el tema

  // --- LÓGICA DE FONDO (Igual que en CreditCards/Accounts) ---
  const getPageBackground = () => {
    if (theme === 'dark' || theme === 'dark-glass' || theme.includes('dark')) {
        return 'bg-[#0f0f0f] text-white';
    }
    if (theme === 'glass') {
        return 'bg-gradient-to-br from-gray-50 to-blue-50 text-gray-900';
    }
    return 'bg-white text-gray-900';
  };

  const pageBgClass = getPageBackground();

  // --- ESTILOS DINÁMICOS PARA TARJETAS ---
  let cardContainerClass = '';
  let textMainClass = 'text-gray-900';
  let textSubClass = 'text-gray-500';
  let tableHeaderClass = 'bg-gray-50/80 border-b border-gray-100 text-gray-600';
  let tableRowClass = 'hover:bg-indigo-50/30 transition-colors border-t border-gray-100';
  let tableTextClass = 'text-gray-600';

  if (theme === 'dark' || theme === 'dark-glass' || theme.includes('dark')) {
      // Dark Mode
      cardContainerClass = 'bg-[#181818] border-[#27272a] shadow-black text-white';
      textMainClass = 'text-white';
      textSubClass = 'text-gray-400';
      tableHeaderClass = 'bg-[#27272a] border-b border-[#3f3f46] text-gray-300';
      tableRowClass = 'hover:bg-[#27272a] transition-colors border-t border-[#3f3f46]';
      tableTextClass = 'text-gray-300';
  } else if (theme === 'glass') {
      // Glass Mode
      cardContainerClass = 'bg-white/70 border-white/40 shadow-xl backdrop-blur-3xl ring-1 ring-white/70 text-gray-900';
      textMainClass = 'text-gray-900';
      textSubClass = 'text-gray-500';
  } else {
      // Light Mode
      cardContainerClass = 'bg-white border-gray-100 shadow-xl shadow-gray-200/50 text-gray-900';
      textMainClass = 'text-gray-900';
      textSubClass = 'text-gray-500';
  }
  
  // Protección contra contexto nulo
  if (!dataContext) return <div className={`p-8 ${pageBgClass}`}>Cargando datos...</div>;
  const { mortgage, updateMortgage } = dataContext;

  // Protección contra objeto mortgage nulo
  if (!mortgage) return <div className={`p-8 ${pageBgClass}`}>Inicializando hipoteca...</div>;

  const [setupMode, setSetupMode] = useState<'excel' | 'manual' | null>(null);
  const [showAbonoDialog, setShowAbonoDialog] = useState(false);
  const [showAllPagos, setShowAllPagos] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingPago, setEditingPago] = useState<Pago | null>(null);
  const [editCuota, setEditCuota] = useState('');
  const [editInteres, setEditInteres] = useState('');
  const [editCapital, setEditCapital] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para setup manual
  const [montoCredito, setMontoCredito] = useState('');
  const [plazoMeses, setPlazoMeses] = useState('');
  const [tasaAnual, setTasaAnual] = useState('');
  const [seguroMensual, setSeguroMensual] = useState('');

  // Estados para abono
  const [montoAbono, setMontoAbono] = useState('');
  const [tipoAbono, setTipoAbono] = useState<'reducirCuota' | 'reducirPlazo'>('reducirCuota');

  // ========== REGISTRAR PAGO MENSUAL ==========
  const handleRegistrarPago = () => {
    const cronograma = mortgage.cronograma || [];
    
    if (cronograma.length === 0) {
      toast({ title: "Error", description: "No hay cronograma configurado", variant: "destructive" });
      return;
    }

    const saldoActual = mortgage.saldoActual || 0;
    
    if (saldoActual <= 0) {
      toast({ title: "Info", description: "El crédito ya está pagado completamente", variant: "default" });
      return;
    }

    const pagosActuales = mortgage.pagos || [];
    const numeroCuotaActual = pagosActuales.length + 1;

    // Si el cronograma viene de Excel
    if (mortgage.modo === 'excel' && cronograma.length > 0) {
      const idx = pagosActuales.length; 
      const fila = cronograma[idx];

      if (!fila) {
        toast({ title: 'Info', description: 'El cronograma ya está completamente pagado' });
        return;
      }

      const nuevoPago: Pago = {
        id: crypto.randomUUID(),
        fecha: new Date().toISOString(),
        numeroCuota: fila.cuota,
        cuotaPagada: fila.cuotaMensual,
        capital: fila.capital,
        interes: fila.interes,
        seguro: fila.seguro,
        saldoPosterior: fila.saldoFinal
      };

      const nuevosPagos = [...pagosActuales, nuevoPago];
      const nuevoPlazoRestante = Math.max(0, cronograma.length - (idx + 1));

      updateMortgage({
        saldoActual: fila.saldoFinal,
        pagos: nuevosPagos,
        plazoRestante: nuevoPlazoRestante
      });

      toast({ 
        title: '✅ Pago registrado', 
        description: `Capital: ${mortgage.currency || '$'}${fila.capital.toLocaleString('es-PE', { maximumFractionDigits: 2 })}` 
      });
      return;
    }

    // Modo manual
    const tasaMensual = Math.pow(1 + (mortgage.tasaAnual || 8.5) / 100, 1 / 12) - 1;
    const interesPagado = (mortgage.saldoActual || 0) * tasaMensual;
    const capitalPagado = (mortgage.monthlyPayment || 0) - interesPagado;
    const nuevoSaldo = Math.max(0, (mortgage.saldoActual || 0) - capitalPagado);

    const nuevoPago: Pago = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      numeroCuota: numeroCuotaActual,
      cuotaPagada: mortgage.monthlyPayment || 0,
      capital: capitalPagado,
      interes: interesPagado,
      saldoPosterior: nuevoSaldo
    };

    const nuevosPagos = [...pagosActuales, nuevoPago];
    const nuevoPlazoRestante = Math.max(0, (mortgage.plazoRestante || cronograma.length || 0) - 1);

    updateMortgage({
      saldoActual: nuevoSaldo,
      pagos: nuevosPagos,
      plazoRestante: nuevoPlazoRestante
    });

    toast({ 
      title: '✅ Pago registrado', 
      description: `Capital: ${mortgage.currency || '$'}${capitalPagado.toLocaleString('es-PE', { maximumFractionDigits: 2 })}` 
    });
  };

  // ========== CARGA DE EXCEL ==========
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        if (jsonData.length === 0) {
          toast({ title: "Error", description: "El archivo está vacío", variant: "destructive" });
          return;
        }

        const parseNumber = (val: any): number => {
          if (typeof val === 'number') return val;
          if (!val) return 0;
          const str = String(val).replace(/[,\s]/g, '');
          const parsed = parseFloat(str);
          return isNaN(parsed) ? 0 : parsed;
        };

        const cronograma: ScheduleRow[] = jsonData.map((row, idx) => {
          return {
            cuota: row['N° Cuota'] || idx + 1,
            fecha: row['Fecha'] || '',
            cuotaMensual: parseNumber(row['Cuota']),
            interes: parseNumber(row['Interés']),
            capital: parseNumber(row['Capital']),
            seguro: parseNumber(row['Seguro']),
            saldoFinal: parseNumber(row['Saldo Final'])
          };
        });

        const totalCuotas = cronograma.length;
        const cuotaMensual = cronograma[0]?.cuotaMensual || 0;
        const saldoInicial = (cronograma[0]?.saldoFinal || 0) + (cronograma[0]?.capital || 0);
        
        if (saldoInicial <= 0 || cuotaMensual <= 0) {
          toast({ 
            title: "Error de formato", 
            description: "Los valores del Excel no son válidos.", 
            variant: "destructive" 
          });
          return;
        }
        
        const totalAPagar = cuotaMensual * totalCuotas;

        updateMortgage({
          modo: 'excel',
          cronograma,
          monthlyPayment: cuotaMensual,
          saldoActual: saldoInicial,
          totalAPagar,
          interesesAhorrados: 0,
          totalAmount: saldoInicial,
          abonos: [],
          pagos: [],
          plazoRestante: totalCuotas
        });

        toast({ title: "✅ Excel cargado", description: `Saldo inicial: S/ ${saldoInicial.toLocaleString()}` });
        setSetupMode(null);
      } catch (error) {
        toast({ title: "Error", description: "No se pudo leer el archivo", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
  };

  // ========== GENERACIÓN MANUAL ==========
  const handleGenerarCronograma = (e: React.FormEvent) => {
    e.preventDefault();

    const P = parseFloat(montoCredito);
    const n = parseInt(plazoMeses);
    const TREA = parseFloat(tasaAnual);
    const seguro = parseFloat(seguroMensual);

    if (!P || !n || !TREA) {
      toast({ title: "Error", description: "Completa todos los campos obligatorios", variant: "destructive" });
      return;
    }

    const r = Math.pow(1 + TREA / 100, 1 / 12) - 1;
    const C = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const cronograma: ScheduleRow[] = [];
    let saldo = P;

    for (let i = 1; i <= n; i++) {
      const interes = saldo * r;
      const capital = C - interes;
      saldo = saldo - capital;

      cronograma.push({
        cuota: i,
        cuotaMensual: C + seguro,
        interes,
        capital,
        seguro,
        saldoFinal: Math.max(0, saldo)
      });
    }

    const totalAPagar = (C + seguro) * n;

    updateMortgage({
      modo: 'manual',
      montoCredito: P,
      plazoMeses: n,
      tasaAnual: TREA,
      seguroMensual: seguro,
      cronograma,
      monthlyPayment: C + seguro,
      saldoActual: P,
      totalAPagar,
      interesesAhorrados: 0,
      totalAmount: P,
      abonos: [],
      pagos: [],
      plazoRestante: n
    });

    toast({ title: "✅ Cronograma generado", description: `${n} cuotas calculadas` });
    setSetupMode(null);
    setMontoCredito('');
    setPlazoMeses('');
    setTasaAnual('');
    setSeguroMensual('');
  };

  // ========== ABONAR A CAPITAL ==========
  const handleAbonarCapital = (e: React.FormEvent) => {
    e.preventDefault();

    const abono = parseFloat(montoAbono);
    if (!abono || abono <= 0) {
      toast({ title: "Error", description: "Ingresa un monto válido", variant: "destructive" });
      return;
    }

    const saldoAntes = mortgage.saldoActual || 0;
    const pagosHechos = (mortgage.pagos || []).length;
    const plazoRestanteActual = mortgage.plazoRestante ?? Math.max(0, (mortgage.cronograma?.length || 0) - pagosHechos);
    const cuotaActualConSeguro = mortgage.monthlyPayment || 0;
    const seguro = mortgage.seguroMensual || 0;
    const cuotaActual = Math.max(0, cuotaActualConSeguro - seguro);
    const r = mortgage.tasaAnual ? Math.pow(1 + mortgage.tasaAnual / 100, 1 / 12) - 1 : 0;
    const totalOriginal = cuotaActualConSeguro * plazoRestanteActual;
    const nuevoSaldo = Math.max(0, saldoAntes - abono);

    let nuevoTotal = 0;
    let nuevoPlazo = plazoRestanteActual;

    if (tipoAbono === 'reducirCuota') {
      const nRest = plazoRestanteActual;
      if (nRest <= 0 || r <= 0) {
        nuevoTotal = cuotaActualConSeguro * nRest;
      } else {
        const nuevaCuotaSinSeguro = (nuevoSaldo * r * Math.pow(1 + r, nRest)) / (Math.pow(1 + r, nRest) - 1);
        nuevoTotal = (nuevaCuotaSinSeguro + seguro) * nRest;
      }
    } else {
      if (cuotaActual <= nuevoSaldo * r) {
        toast({ title: "Error", description: "La cuota actual no cubre intereses", variant: "destructive" });
        return;
      }
      const denom = cuotaActual - nuevoSaldo * r;
      nuevoPlazo = Math.ceil(Math.log(cuotaActual / denom) / Math.log(1 + r));
      nuevoTotal = (cuotaActual + seguro) * nuevoPlazo;
    }

    const ahorroInteres = Math.max(0, totalOriginal - nuevoTotal);

    const nuevoAbono: Abono = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      monto: abono,
      tipo: tipoAbono,
      ahorroInteres: ahorroInteres
    };

    const nuevosAbonos = [...(mortgage.abonos || []), nuevoAbono];
    const interesesAhorradosTotal = nuevosAbonos.reduce((sum, a) => sum + a.ahorroInteres, 0);

    updateMortgage({
      saldoActual: nuevoSaldo,
      abonos: nuevosAbonos,
      interesesAhorrados: interesesAhorradosTotal,
      totalAPagar: nuevoTotal,
      plazoRestante: tipoAbono === 'reducirPlazo' ? nuevoPlazo : plazoRestanteActual
    });

    toast({
      title: "💰 Abono registrado",
      description: `Ahorraste ${mortgage.currency || '$'}${ahorroInteres.toLocaleString('es-PE', { maximumFractionDigits: 2 })} en intereses`
    });

    setShowAbonoDialog(false);
    setMontoAbono('');
  };

  const handleEliminarHipoteca = () => {
    updateMortgage({
      modo: undefined, cronograma: [], monthlyPayment: 0, saldoActual: 0,
      totalAPagar: 0, interesesAhorrados: 0, totalAmount: 0, abonos: [],
      pagos: [], plazoRestante: 0, montoCredito: 0, plazoMeses: 0, tasaAnual: 0, seguroMensual: 0
    });
    setShowDeleteConfirm(false);
    toast({ title: "🗑️ Hipoteca eliminada" });
  };

  const handleEliminarPago = (pagoId: string) => {
    const pagos = mortgage.pagos || [];
    const pagoAEliminar = pagos.find(p => p.id === pagoId);
    if (!pagoAEliminar) return;

    const nuevosPagos = pagos.filter(p => p.id !== pagoId);
    const saldoAnterior = pagoAEliminar.saldoPosterior + pagoAEliminar.capital;
    const nuevoPlazoRestante = (mortgage.plazoRestante || 0) + 1;

    updateMortgage({
      pagos: nuevosPagos,
      saldoActual: saldoAnterior,
      plazoRestante: nuevoPlazoRestante
    });

    toast({ title: "✅ Pago eliminado" });
  };

  const handleEditarPago = (pago: Pago) => {
    setEditingPago(pago);
    setEditCuota(pago.cuotaPagada.toString());
    setEditInteres(pago.interes.toString());
    setEditCapital(pago.capital.toString());
  };

  const handleGuardarEdicion = () => {
    if (!editingPago) return;
    const cuotaEditada = parseFloat(editCuota);
    const interesEditado = parseFloat(editInteres);
    const capitalEditado = parseFloat(editCapital);

    if (!cuotaEditada || !interesEditado || !capitalEditado) {
      toast({ title: "Error", description: "Valores inválidos", variant: "destructive" });
      return;
    }

    const nuevosPagos = (mortgage.pagos || []).map(p => 
      p.id === editingPago.id 
        ? {
            ...p,
            cuotaPagada: cuotaEditada,
            interes: interesEditado,
            capital: capitalEditado,
            saldoPosterior: p.saldoPosterior - p.capital + capitalEditado
          }
        : p
    );

    updateMortgage({ pagos: nuevosPagos });
    setEditingPago(null);
    toast({ title: "✅ Pago actualizado" });
  };

  // Asegurar acceso seguro a arrays
  const pagosList = mortgage.pagos || [];
  const abonosList = mortgage.abonos || [];
  const cronogramaList = mortgage.cronograma || [];

  // ========== UI SIN CONFIGURAR (GLASS + THEME) ==========
  if (cronogramaList.length === 0) {
    return (
      // APLICACIÓN DEL FONDO DINÁMICO
      <div className={`p-8 animate-fade-in font-sans min-h-screen transition-colors duration-500 ${pageBgClass}`} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
        <div className="mb-10">
          <h1 className={`text-3xl font-bold mb-2 tracking-tight ${textMainClass}`}>Hipoteca</h1>
          <p className={textSubClass}>Configura tu crédito hipotecario para comenzar</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* TARJETA DINÁMICA */}
          <div className={`relative overflow-hidden rounded-[32px] border p-10 transition-all ${cardContainerClass}`}>
            
            {/* Reflection (solo en light/glass) */}
            {theme !== 'dark' && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>}
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-indigo-50 flex items-center justify-center mb-6 shadow-sm">
                    <Home className="w-10 h-10 text-indigo-600" />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${textMainClass}`}>No tienes hipoteca configurada</h2>
                <p className={`${textSubClass} mb-8 max-w-md`}>Elige cómo deseas cargar la información de tu crédito para empezar a realizar el seguimiento.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <Button 
                        size="lg" 
                        className="h-16 text-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-sm hover:shadow-md transition-all gap-3"
                        onClick={() => setSetupMode('excel')}
                    >
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        </div>
                        Subir Excel
                    </Button>

                    <Button 
                        size="lg" 
                        className="h-16 text-lg bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 shadow-sm hover:shadow-md transition-all gap-3"
                        onClick={() => setSetupMode('manual')}
                    >
                         <div className="p-2 bg-blue-100 rounded-lg">
                            <Calculator className="h-5 w-5 text-blue-600" />
                        </div>
                        Manual
                    </Button>
                </div>
            </div>
          </div>

          {/* MODALES DE CONFIGURACIÓN (Sin cambios funcionales) */}
          <Dialog open={setupMode === 'excel'} onOpenChange={(open) => !open && setSetupMode(null)}>
             <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                     <DialogTitle>Subir Excel</DialogTitle>
                 </DialogHeader>
                 <div className="space-y-4 pt-4">
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-600">Click para seleccionar archivo</p>
                        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Columnas requeridas: N° Cuota, Cuota, Interés, Capital, Saldo Final</p>
                 </div>
             </DialogContent>
          </Dialog>

          <Dialog open={setupMode === 'manual'} onOpenChange={(open) => !open && setSetupMode(null)}>
             <DialogContent>
                 <DialogHeader>
                     <DialogTitle>Configuración Manual</DialogTitle>
                 </DialogHeader>
                 <form onSubmit={handleGenerarCronograma} className="space-y-4 pt-4">
                    <div><Label>Monto del Crédito</Label><Input type="number" value={montoCredito} onChange={e => setMontoCredito(e.target.value)} required /></div>
                    <div><Label>Plazo (meses)</Label><Input type="number" value={plazoMeses} onChange={e => setPlazoMeses(e.target.value)} required /></div>
                    <div><Label>Tasa Anual (TREA %)</Label><Input type="number" step="0.01" value={tasaAnual} onChange={e => setTasaAnual(e.target.value)} required /></div>
                    <div><Label>Seguro Mensual</Label><Input type="number" step="0.01" value={seguroMensual} onChange={e => setSeguroMensual(e.target.value)} /></div>
                    <Button type="submit" className="w-full">Generar Cronograma</Button>
                 </form>
             </DialogContent>
          </Dialog>

        </div>
      </div>
    );
  }

  // ========== UI CON HIPOTECA (GLASS/DARK + THEME) ==========
  return (
    // APLICACIÓN DEL FONDO DINÁMICO
    <div className={`p-8 animate-fade-in font-sans min-h-screen transition-colors duration-500 ${pageBgClass}`} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      
      {/* HEADER */}
      <div className="mb-10 flex justify-between items-start">
        <div>
          <h1 className={`text-3xl font-bold mb-2 tracking-tight ${textMainClass}`}>Hipoteca</h1>
          <p className={textSubClass}>Control total de tu crédito hipotecario</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="mr-2 h-4 w-4" /> Eliminar
        </Button>
      </div>

      {/* DASHBOARD GRID (Glass Style con clases inyectadas) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {[
            { label: "Saldo Actual", value: mortgage.saldoActual, color: theme?.includes('dark') ? "text-white" : "text-gray-900", icon: DollarSign, glow: "bg-gray-500/20" },
            { label: "Intereses Ahorrados", value: mortgage.interesesAhorrados, color: "text-emerald-600", icon: Wallet, glow: "bg-emerald-500/20" },
            { label: "Total a Pagar", value: mortgage.totalAPagar, color: "text-red-500", icon: TrendingDown, glow: "bg-red-500/20" },
            { label: "Cuota Mensual", value: mortgage.monthlyPayment, color: "text-indigo-600", icon: Calendar, glow: "bg-indigo-500/20" },
            { label: "Plazo Restante", value: mortgage.plazoRestante, isText: true, suffix: "meses", color: "text-blue-600", icon: Clock, glow: "bg-blue-500/20" }
        ].map((item, index) => (
            // INYECCIÓN DE ESTILO DE TARJETA
            <div key={index} className={`group relative overflow-hidden rounded-[28px] border p-6 transition-all hover:-translate-y-1 text-center ${cardContainerClass}`}>
                {/* Glow */}
                <div className={`absolute -right-10 -top-10 h-32 w-32 animate-pulse rounded-full blur-3xl mix-blend-multiply ${item.glow}`}></div>
                {theme !== 'dark' && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent opacity-50"></div>}
                
                <div className="relative z-10 flex flex-col items-center justify-between h-full">
                    <div className="mb-2 p-2 rounded-xl bg-white/50 border border-white/60 shadow-sm">
                        <item.icon className={`h-5 w-5 ${item.color.replace('text-', 'text-opacity-80 ')}`} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{item.label}</p>
                    <p className={`text-3xl font-light tracking-tight ${item.color}`}>
                        {item.isText 
                            ? `${item.value} ${item.suffix}` 
                            // @ts-ignore
                            : `${mortgage.currency || '$'}${item.value?.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`
                        }
                    </p>
                </div>
            </div>
        ))}
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-4 mb-10">
        <Button size="lg" onClick={handleRegistrarPago} className="flex-1 sm:flex-none h-14 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 gap-2 rounded-2xl">
          <CreditCard className="w-5 h-5" /> Registrar pago del mes
        </Button>
        <Button size="lg" onClick={() => setShowAbonoDialog(true)} variant="outline" className="flex-1 sm:flex-none h-14 text-lg border-gray-300 hover:bg-white/80 gap-2 rounded-2xl">
          <ArrowDownCircle className="w-5 h-5 text-emerald-600" /> Abonar a capital
        </Button>
      </div>

      {/* HISTORIAL (Glass Container + Tema Inyectado) */}
      <div className={`relative overflow-hidden rounded-[32px] border p-8 ${cardContainerClass}`}>
         {theme !== 'dark' && <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>}
         
         <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-bold ${textMainClass}`}>Historial de Pagos</h3>
                {pagosList.length > 5 && (
                    <Button variant="ghost" size="sm" onClick={() => setShowAllPagos(true)} className={textSubClass}>Ver todos <ChevronRight className="ml-1 h-4 w-4" /></Button>
                )}
            </div>

            {pagosList.length > 0 ? (
                <div className={`overflow-x-auto rounded-2xl border ${theme === 'dark' ? 'bg-[#181818] border-[#3f3f46]' : 'bg-white/50 border-white/60'}`}>
                    <table className="w-full text-sm">
                        <thead className={tableHeaderClass}>
                            <tr>
                                <th className="text-left p-4 font-semibold">N° Cuota</th>
                                <th className="text-left p-4 font-semibold">Fecha</th>
                                <th className="text-right p-4 font-semibold">Cuota</th>
                                <th className="text-right p-4 font-semibold">Interés</th>
                                <th className="text-right p-4 font-semibold">Capital</th>
                                <th className="text-right p-4 font-semibold">Saldo</th>
                                <th className="text-center p-4 font-semibold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#3f3f46]' : 'divide-gray-100'}`}>
                            {pagosList.slice().reverse().slice(0, 5).map((pago) => (
                                <tr key={pago.id} className={tableRowClass}>
                                    <td className="p-4 font-bold text-indigo-600">#{pago.numeroCuota}</td>
                                    <td className={`p-4 ${tableTextClass}`}>{new Date(pago.fecha).toLocaleDateString('es-PE')}</td>
                                    <td className={`text-right p-4 font-medium ${textMainClass}`}>{mortgage.currency || '$'}{pago.cuotaPagada.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="text-right p-4 text-red-500">{mortgage.currency || '$'}{pago.interes.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="text-right p-4 text-emerald-600">{mortgage.currency || '$'}{pago.capital.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className={`text-right p-4 font-bold ${textMainClass}`}>{mortgage.currency || '$'}{pago.saldoPosterior.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="text-center p-4">
                                        <div className="flex justify-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-indigo-600" onClick={() => handleEditarPago(pago)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600" onClick={() => handleEliminarPago(pago.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className={`text-center py-10 ${textSubClass}`}>No hay pagos registrados aún.</div>
            )}
         </div>
      </div>

      {/* Historial Abonos */}
      {abonosList.length > 0 && (
          <div className={`mt-8 relative overflow-hidden rounded-[32px] border p-8 ${cardContainerClass}`}>
               <h3 className={`text-xl font-bold mb-6 relative z-10 ${textMainClass}`}>Historial de Abonos</h3>
               <div className={`relative z-10 overflow-x-auto rounded-2xl border ${theme === 'dark' ? 'bg-[#181818] border-[#3f3f46]' : 'bg-white/50 border-white/60'}`}>
                   <table className="w-full text-sm">
                       <thead className={tableHeaderClass}>
                           <tr>
                               <th className="text-left p-4 font-semibold">Fecha</th>
                               <th className="text-right p-4 font-semibold">Monto</th>
                               <th className="text-center p-4 font-semibold">Tipo</th>
                               <th className="text-right p-4 font-semibold">Ahorro Interés</th>
                           </tr>
                       </thead>
                       <tbody className={`divide-y ${theme === 'dark' ? 'divide-[#3f3f46]' : 'divide-gray-100'}`}>
                           {abonosList.slice().reverse().map(abono => (
                               <tr key={abono.id} className={tableRowClass}>
                                   <td className={`p-4 ${tableTextClass}`}>{new Date(abono.fecha).toLocaleDateString()}</td>
                                   <td className={`text-right p-4 font-bold ${textMainClass}`}>{mortgage.currency || '$'}{abono.monto.toLocaleString()}</td>
                                   <td className="text-center p-4"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{abono.tipo === 'reducirCuota' ? 'Cuota' : 'Plazo'}</span></td>
                                   <td className="text-right p-4 text-emerald-600 font-bold">-{mortgage.currency || '$'}{abono.ahorroInteres.toLocaleString()}</td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
          </div>
      )}

      {/* --- MODALES --- */}
      
      {/* Abono Dialog */}
      <Dialog open={showAbonoDialog} onOpenChange={setShowAbonoDialog}>
        <DialogContent>
            <DialogHeader><DialogTitle>Abonar a Capital</DialogTitle></DialogHeader>
            <form onSubmit={handleAbonarCapital} className="space-y-4 pt-4">
                <div>
                    <Label>Monto</Label>
                    <Input type="number" value={montoAbono} onChange={e => setMontoAbono(e.target.value)} autoFocus placeholder="0.00" />
                </div>
                <div className="space-y-2">
                    <Label>Tipo de Ajuste</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-4 border rounded-xl cursor-pointer transition-all text-center ${tipoAbono === 'reducirCuota' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`} onClick={() => setTipoAbono('reducirCuota')}>
                            <span className="text-sm font-semibold">Reducir Cuota</span>
                        </div>
                        <div className={`p-4 border rounded-xl cursor-pointer transition-all text-center ${tipoAbono === 'reducirPlazo' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`} onClick={() => setTipoAbono('reducirPlazo')}>
                            <span className="text-sm font-semibold">Reducir Plazo</span>
                        </div>
                    </div>
                </div>
                <Button type="submit" className="w-full">Confirmar Abono</Button>
            </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
            <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> Eliminar Hipoteca</DialogTitle></DialogHeader>
            <p className="text-gray-600">Se borrará todo el historial y configuración. Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                <Button variant="destructive" onClick={handleEliminarHipoteca}>Eliminar</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Edit Payment */}
      <Dialog open={!!editingPago} onOpenChange={() => setEditingPago(null)}>
        <DialogContent>
             <DialogHeader><DialogTitle>Editar Pago #{editingPago?.numeroCuota}</DialogTitle></DialogHeader>
             <div className="space-y-4 pt-4">
                 <div><Label>Cuota Pagada</Label><Input value={editCuota} onChange={e => setEditCuota(e.target.value)} type="number" /></div>
                 <div><Label>Interés</Label><Input value={editInteres} onChange={e => setEditInteres(e.target.value)} type="number" /></div>
                 <div><Label>Capital</Label><Input value={editCapital} onChange={e => setEditCapital(e.target.value)} type="number" /></div>
                 <Button onClick={handleGuardarEdicion} className="w-full">Guardar Cambios</Button>
             </div>
        </DialogContent>
      </Dialog>
      
      {/* All Payments Modal */}
      <Dialog open={showAllPagos} onOpenChange={setShowAllPagos}>
         <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
             <DialogHeader><DialogTitle>Historial Completo</DialogTitle></DialogHeader>
             <div className="flex-1 overflow-auto mt-4 rounded-xl border">
                 <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="p-3 text-left">N°</th>
                            <th className="p-3 text-left">Fecha</th>
                            <th className="p-3 text-right">Cuota</th>
                            <th className="p-3 text-right">Capital</th>
                            <th className="p-3 text-right">Saldo</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {pagosList.slice().reverse().map(p => (
                            <tr key={p.id}>
                                <td className="p-3 font-bold text-indigo-600">#{p.numeroCuota}</td>
                                <td className="p-3">{new Date(p.fecha).toLocaleDateString()}</td>
                                <td className="p-3 text-right">{mortgage.currency || '$'}{p.cuotaPagada.toLocaleString()}</td>
                                <td className="p-3 text-right text-emerald-600">{mortgage.currency || '$'}{p.capital.toLocaleString()}</td>
                                <td className="p-3 text-right font-bold">{mortgage.currency || '$'}{p.saldoPosterior.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
             </div>
         </DialogContent>
      </Dialog>

    </div>
  );
};

export default Mortgage;