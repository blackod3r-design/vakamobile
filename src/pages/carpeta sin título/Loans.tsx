import React, { useState } from 'react';
import { 
  Plus, 
  DollarSign, 
  Calendar, 
  Percent, 
  Clock, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Wallet, 
  Trash2,      // <--- Agregado
  Edit,        // <--- Agregado
  AlertTriangle // <--- Agregado
} from 'lucide-react';
import { useExport } from '@/hooks/usePdfExport';
import { ExportButton } from '@/components/ExportButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

const Loans = () => {
  const dataContext = useData();
  
  // Protección 1: Si el contexto no carga
  if (!dataContext) return <div className="p-8">Cargando...</div>;
  const { loans, addLoan, deleteLoan, registrarPagoLoan, registrarPagoAdelantado } = dataContext;
  
  const { exportLoanPayments } = useExport();
  
  // Modal States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [pagoAdelantadoDialog, setPagoAdelantadoDialog] = useState(false);

  // Form States
  const [newLoan, setNewLoan] = useState({
    name: '',
    monto: '',
    tasaAnual: '',
    plazoMeses: '',
    currency: '$' as '$' | 'S/',
    fechaInicio: new Date().toISOString().split('T')[0],
  });

  const [pagoAdelantado, setPagoAdelantado] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
  });

  // --- HANDLERS ---

  const handleAddLoan = () => {
    if (!newLoan.name || !newLoan.monto || !newLoan.tasaAnual || !newLoan.plazoMeses) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    addLoan({
      name: newLoan.name,
      monto: parseFloat(newLoan.monto),
      tasaAnual: parseFloat(newLoan.tasaAnual),
      plazoMeses: parseInt(newLoan.plazoMeses),
      currency: newLoan.currency,
      fechaInicio: newLoan.fechaInicio,
    });

    toast.success('Préstamo agregado exitosamente');
    setNewLoan({
      name: '',
      monto: '',
      tasaAnual: '',
      plazoMeses: '',
      currency: '$',
      fechaInicio: new Date().toISOString().split('T')[0],
    });
    setIsAddDialogOpen(false);
  };

  const handlePagarCuota = (loanId: string, cuotaNumero: number) => {
    registrarPagoLoan(loanId, cuotaNumero);
    toast.success(`Cuota ${cuotaNumero} registrada como pagada`);
  };

  const handlePagoAdelantado = () => {
    if (!selectedLoanId || !pagoAdelantado.monto) {
      toast.error('Ingresa un monto válido');
      return;
    }

    registrarPagoAdelantado(selectedLoanId, parseFloat(pagoAdelantado.monto), pagoAdelantado.fecha);
    toast.success('Pago adelantado registrado exitosamente');
    setPagoAdelantado({ monto: '', fecha: new Date().toISOString().split('T')[0] });
    setPagoAdelantadoDialog(false);
  };

  const handleDeleteLoan = (id: string) => {
    if(confirm("¿Estás seguro de eliminar este préstamo?")) {
        deleteLoan(id);
        setSelectedLoanId(null);
        toast.success("Préstamo eliminado");
    }
  }

  // --- RENDER UI ---

  return (
    <div className="p-8 animate-fade-in font-sans" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Préstamos</h1>
          <p className="text-muted-foreground">Sistema Francés de Amortización</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Préstamo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Préstamo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="loan-name">Nombre del Préstamo</Label>
                <Input id="loan-name" placeholder="Ej: Préstamo Personal" value={newLoan.name} onChange={(e) => setNewLoan({ ...newLoan, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="loan-currency">Moneda</Label>
                    <Select value={newLoan.currency} onValueChange={(val: any) => setNewLoan({ ...newLoan, currency: val })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="$">Dólares ($)</SelectItem>
                            <SelectItem value="S/">Soles (S/)</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label htmlFor="loan-amount">Monto</Label>
                    <Input id="loan-amount" type="number" placeholder="10000" value={newLoan.monto} onChange={(e) => setNewLoan({ ...newLoan, monto: e.target.value })} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="loan-rate">Tasa Anual (%)</Label>
                    <Input id="loan-rate" type="number" step="0.01" placeholder="12.5" value={newLoan.tasaAnual} onChange={(e) => setNewLoan({ ...newLoan, tasaAnual: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="loan-term">Plazo (meses)</Label>
                    <Input id="loan-term" type="number" placeholder="24" value={newLoan.plazoMeses} onChange={(e) => setNewLoan({ ...newLoan, plazoMeses: e.target.value })} />
                  </div>
              </div>
              <div>
                <Label htmlFor="loan-start">Fecha de Inicio</Label>
                <Input id="loan-start" type="date" value={newLoan.fechaInicio} onChange={(e) => setNewLoan({ ...newLoan, fechaInicio: e.target.value })} />
              </div>
              <Button onClick={handleAddLoan} className="w-full bg-orange-600 hover:bg-orange-700">Agregar Préstamo</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- GRID DE PRÉSTAMOS (Protección contra arrays vacíos) --- */}
      {(!loans || loans.length === 0) ? (
        <div className="text-center py-20 bg-muted/20 rounded-[32px] border border-dashed border-muted-foreground/20">
          <Wallet className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">No tienes préstamos registrados</h3>
          <p className="text-muted-foreground mt-2">Agrega tu primer préstamo para ver el cronograma.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loans.map((loan) => {
            // Protección 2: Valores por defecto si los datos son antiguos
            const cuotasPagadas = loan.cuotasPagadas || 0;
            const plazoMeses = loan.plazoMeses || 1;
            const saldoActual = loan.saldoActual || 0;
            const cuotaMensual = loan.cuotaMensual || 0;
            
            const progreso = (cuotasPagadas / plazoMeses) * 100;
            const isCompleted = progreso >= 100;
            
            // Theme setup (Orange/Red for Debt)
            const theme = isCompleted ? {
                badge: 'bg-green-100/50 text-green-700 border-green-200/50',
                shadow: 'shadow-green-900/5 hover:shadow-green-900/10',
                glow: 'bg-green-500/20',
                progress: 'from-green-400 to-emerald-500'
            } : {
                badge: 'bg-orange-100/50 text-orange-700 border-orange-200/50',
                shadow: 'shadow-orange-900/5 hover:shadow-orange-900/10',
                glow: 'bg-orange-500/20',
                progress: 'from-orange-400 to-red-500'
            };

            return (
              <div 
                key={loan.id} 
                onClick={() => setSelectedLoanId(loan.id)}
                className={`group relative w-full overflow-hidden rounded-[32px] border border-white/40 bg-white/70 p-8 shadow-2xl ${theme.shadow} backdrop-blur-3xl ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center`}
              >
                {/* 1. Reflection */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
                
                {/* 2. Glow */}
                <div className={`absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full blur-3xl mix-blend-multiply transition-all duration-700 group-hover:scale-110 ${theme.glow}`}></div>

                {/* 3. Badge (Status) */}
                <span className={`absolute top-6 right-6 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform group-hover:scale-105 flex items-center gap-1.5 ${theme.badge}`}>
                  {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {isCompleted ? 'Pagado' : 'En Curso'}
                </span>

                <div className="mt-4"></div>

                {/* 4. Name */}
                <h3 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900 relative z-10">
                  {loan.name}
                </h3>

                {/* 5. Main Amount (Saldo Actual) */}
                <div className="relative z-10 flex items-baseline justify-center gap-1.5 mb-8">
                  <span className="text-3xl font-light text-gray-400">{loan.currency}</span>
                  <span className="text-[56px] font-light tracking-tight text-gray-900 leading-none drop-shadow-sm tabular-nums">
                    {saldoActual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* 6. Progress Bar */}
                <div className="relative z-10 w-full">
                    <div className="mb-2 flex justify-between gap-2 text-xs font-medium text-gray-500">
                      <span>Pagado: <span className="font-bold text-orange-600">{progreso.toFixed(0)}%</span></span>
                      <span>{cuotasPagadas} / {plazoMeses} cuotas</span>
                    </div>
                    
                    <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200/50 p-0.5 backdrop-blur-sm">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${theme.progress} shadow-sm relative overflow-hidden transition-all duration-1000`}
                        style={{ width: `${progreso}%` }}
                      >
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full" style={{ animation: 'shimmer 2s infinite' }}></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-4 text-[10px] font-medium text-gray-400 pt-2">
                      <span>Cuota Mensual: {loan.currency}{cuotaMensual.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL DETALLE DE PRÉSTAMO --- */}
      <Dialog open={!!selectedLoanId} onOpenChange={(open) => !open && setSelectedLoanId(null)}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden flex flex-col bg-zinc-50/95 backdrop-blur-xl">
          {(() => {
            const loan = loans?.find(l => l.id === selectedLoanId);
            if (!loan) return null;
            
            // Protección 3: Asegurar que cronograma existe
            const cronograma = loan.cronograma || [];

            return (
              <div className="flex flex-col h-full w-full">
                
                {/* Header */}
                <DialogHeader className="px-8 py-6 border-b border-gray-200/50 bg-white/50 shrink-0 flex flex-row items-center justify-between">
                  <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                     <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><Wallet className="w-6 h-6" /></div>
                     {loan.name}
                  </DialogTitle>
                  <div className="flex gap-2">
                     <Dialog open={pagoAdelantadoDialog} onOpenChange={setPagoAdelantadoDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50">
                                <TrendingDown className="h-4 w-4" /> Pago Adelantado
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Registrar Pago Adelantado</DialogTitle></DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div><Label>Monto</Label><Input type="number" value={pagoAdelantado.monto} onChange={(e) => setPagoAdelantado({ ...pagoAdelantado, monto: e.target.value })} /></div>
                                <div><Label>Fecha</Label><Input type="date" value={pagoAdelantado.fecha} onChange={(e) => setPagoAdelantado({ ...pagoAdelantado, fecha: e.target.value })} /></div>
                                <Button onClick={handlePagoAdelantado} className="w-full bg-orange-600 hover:bg-orange-700">Confirmar</Button>
                            </div>
                        </DialogContent>
                     </Dialog>
                     
                     {/* Export Button con protección */}
                     {cronograma.length > 0 && (
                        <ExportButton 
                            onExport={(format) => exportLoanPayments(
                                loan.name, 
                                loan.currency, 
                                cronograma.map(c => ({
                                    fecha: c.fecha,
                                    numeroCuota: c.cuota,
                                    cuota: c.cuotaMensual,
                                    capital: c.capital,
                                    interes: c.interes,
                                    pagado: c.pagado
                                })), 
                                format
                            )} 
                        />
                     )}
                     <Button variant="ghost" size="icon" onClick={() => handleDeleteLoan(loan.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4"/></Button>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col">
                    
                    {/* Top Stats Bar */}
                    <div className="grid grid-cols-4 gap-4 p-6 bg-white/40 border-b border-gray-200/50 shrink-0">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monto Original</p>
                            <p className="text-xl font-bold text-gray-900">{loan.currency}{(loan.monto || 0).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tasa (TEA)</p>
                            <p className="text-xl font-bold text-gray-900">{loan.tasaAnual || 0}%</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cuota Fija</p>
                            <p className="text-xl font-bold text-indigo-600">{loan.currency}{(loan.cuotaMensual || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                         <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Saldo Pendiente</p>
                            <p className="text-xl font-bold text-orange-600">{loan.currency}{(loan.saldoActual || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="w-[80px] text-center">Cuota</TableHead>
                                        <TableHead className="text-center">Fecha</TableHead>
                                        <TableHead className="text-right">Monto Cuota</TableHead>
                                        <TableHead className="text-right">Interés</TableHead>
                                        <TableHead className="text-right">Capital</TableHead>
                                        <TableHead className="text-right">Saldo Restante</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cronograma.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                No hay cronograma generado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cronograma.map((cuota) => (
                                            <TableRow key={cuota.id || Math.random()} className={cuota.pagado ? 'bg-green-50/50 hover:bg-green-50' : 'hover:bg-gray-50'}>
                                                <TableCell className="font-bold text-center text-gray-700">#{cuota.cuota}</TableCell>
                                                <TableCell className="text-center text-gray-600">
                                                    {cuota.fecha ? new Date(cuota.fecha).toLocaleDateString('es-PE') : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">{loan.currency}{cuota.cuotaMensual.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                                <TableCell className="text-right text-red-500">{loan.currency}{cuota.interes.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                                <TableCell className="text-right text-emerald-600">{loan.currency}{cuota.capital.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                                <TableCell className="text-right font-bold text-gray-800">{loan.currency}{cuota.saldoRestante.toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                                                <TableCell className="text-center">
                                                    {cuota.pagado ? (
                                                        <div className="flex items-center justify-center text-green-600 gap-1 text-xs font-bold uppercase tracking-wider">
                                                            <CheckCircle2 className="w-4 h-4" /> Pagado
                                                        </div>
                                                    ) : (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="h-7 text-xs border-orange-200 text-orange-700 hover:bg-orange-50"
                                                            onClick={() => handlePagarCuota(loan.id, cuota.cuota)}
                                                        >
                                                            Pagar
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>

              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Estilos adicionales para animación */}
      <style>
        {`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}
      </style>

    </div>
  );
};

export default Loans;