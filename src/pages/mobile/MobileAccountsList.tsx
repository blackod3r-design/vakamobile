import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, TrendingUp, Clock, ChevronRight, Plus, 
  ArrowLeftRight, ArrowLeft, X, ArrowUpCircle, ArrowDownCircle, 
  Pencil, Check, History
} from 'lucide-react';
import { useData, Account } from '@/contexts/DataContext';
import { toast } from 'sonner';

// --- UI COMPONENTS ---
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// ----------------------------------------------------------------------
// 1. HELPERS & CÁLCULOS FINANCIEROS
// ----------------------------------------------------------------------
const calcularDPF = (monto: number, tasaAnual: number, plazoDias: number) => {
  const tea = tasaAnual / 100;
  // A. Para pago mensual
  const tem = Math.pow(1 + tea, 30 / 360) - 1;
  const cuotaMensual = monto * tem; 
  const totalAritmeticoMensual = cuotaMensual * (plazoDias / 30); 
  // B. Para pago al vencimiento
  const factorPlazo = Math.pow(1 + tea, plazoDias / 360) - 1;
  const totalAlVencimiento = monto * factorPlazo;

  return {
    interesMensual: cuotaMensual, 
    totalAritmeticoMensual, 
    interesTotalVencimiento: totalAlVencimiento,
    numeroMeses: parseFloat((plazoDias / 30).toFixed(1)),
  };
};

const calcularDiasDPF = (fechaApertura: string, plazoDias: number) => {
  const hoy = new Date();
  const apertura = new Date(fechaApertura);
  const diffTime = hoy.getTime() - apertura.getTime();
  const diasTranscurridos = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const progreso = Math.min(100, (diasTranscurridos / plazoDias) * 100);
  return { diasTranscurridos, progreso };
};

const calcularMesesTranscurridos = (fechaApertura: string) => {
  const hoy = new Date();
  const apertura = new Date(fechaApertura);
  const diffTime = hoy.getTime() - apertura.getTime();
  const diasTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diasTranscurridos / 30);
};

const getAccountDisplayInfo = (account: Account) => {
  const isDPF = account.tipoCuenta === 'dpf-mensual' || account.tipoCuenta === 'dpf-final';
  if (!isDPF || !account.fechaApertura || !account.plazoDias) {
    return { isDPF: false, tipoLabel: 'Ahorro', diasInfo: null, progreso: 0 };
  }
  const { diasTranscurridos, progreso } = calcularDiasDPF(account.fechaApertura, account.plazoDias);
  const tipoLabel = account.tipoCuenta === 'dpf-mensual' ? 'DPF Mensual' : 'DPF Final';
  return { isDPF: true, tipoLabel, diasInfo: `${diasTranscurridos}/${account.plazoDias} días`, progreso };
};

// ----------------------------------------------------------------------
// 2. COMPONENTE MAESTRO
// ----------------------------------------------------------------------
const MobileAccountsList = () => {
  const navigate = useNavigate();
  const { accounts, addAccount, updateAccount, addTransaction, transactions } = useData();

  // --- ESTADO CENTRAL ---
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // --- ESTADOS GLOBALES ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // --- ESTADOS DE DETALLE ---
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDesc, setTransactionDesc] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // --- ESTADOS DE NUEVA CUENTA ---
  const [tipoCuentaForm, setTipoCuentaForm] = useState<'ahorro' | 'dpf'>('ahorro');
  const [modalidadInteres, setModalidadInteres] = useState<'mensual' | 'final'>('mensual');
  const [newAccount, setNewAccount] = useState({
    name: '', balance: '', currency: '$' as '$' | 'S/',
    fechaApertura: new Date().toISOString().split('T')[0],
    plazoDias: '', tasaAnual: '',
  });

  // --- ESTADOS DE TRANSFERENCIA ---
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [tAmount, setTAmount] = useState('');
  const [tConcept, setTConcept] = useState('');

  // --- EFECTO: PROCESAR INTERESES DPF ---
  useEffect(() => {
    accounts.forEach(account => {
      if (account.tipoCuenta?.startsWith('dpf')) processDPFAccount(account);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processDPFAccount = (account: Account) => {
    if (!account.fechaApertura || !account.plazoDias || !account.interesMensualProporcional) return;
    const mesesTranscurridos = calcularMesesTranscurridos(account.fechaApertura);
    const historial = account.historialIntereses || [];
    const mesesRegistrados = historial.length;

    if (mesesTranscurridos > mesesRegistrados) {
      if (account.tipoCuenta === 'dpf-final' || (account.tipoCuenta === 'dpf-mensual' && account.autoIntereses)) {
        const nuevoHistorial = [...historial];
        for (let mes = mesesRegistrados + 1; mes <= mesesTranscurridos; mes++) {
          nuevoHistorial.push({
            id: crypto.randomUUID(),
            fecha: new Date().toISOString(),
            monto: account.interesMensualProporcional,
            tipo: account.tipoCuenta === 'dpf-final' ? 'proporcional' : 'mensual',
            mesCorrespondiente: mes,
          });
        }
        const interesesAcumulados = nuevoHistorial.reduce((sum, i) => sum + i.monto, 0);
        updateAccount(account.id, {
          historialIntereses: nuevoHistorial,
          interesesAcumulados,
          balance: (account.montoInicial || account.balance) + interesesAcumulados,
        });
      }
    }
  };

  // --- HANDLER: CREAR CUENTA ---
  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.balance) return toast.error('Faltan datos básicos');
    const monto = parseFloat(newAccount.balance);
    
    if (tipoCuentaForm === 'dpf') {
      if (!newAccount.plazoDias || !newAccount.tasaAnual) return toast.error('Faltan datos DPF');
      const plazo = parseInt(newAccount.plazoDias);
      const tasa = parseFloat(newAccount.tasaAnual);
      const calc = calcularDPF(monto, tasa, plazo);
      
      // ERROR CORREGIDO AQUI: Usar 'modalidadInteres' en lugar de 'modalityInterest'
      let tipo: 'dpf-mensual' | 'dpf-final' = modalidadInteres === 'mensual' ? 'dpf-mensual' : 'dpf-final';
      
      addAccount({
        name: newAccount.name, balance: monto, type: 'savings', currency: newAccount.currency,
        tipoCuenta: tipo, fechaApertura: newAccount.fechaApertura, montoInicial: monto,
        tasaAnual: tasa, plazoDias: plazo, 
        interesTotal: tipo === 'dpf-mensual' ? calc.totalAritmeticoMensual : calc.interesTotalVencimiento,
        interesMensualProporcional: tipo === 'dpf-mensual' ? calc.interesMensual : (calc.interesTotalVencimiento / (plazo/30)),
        interesesAcumulados: 0, historialIntereses: [], autoIntereses: false
      });
      toast.success('DPF Creado');
    } else {
      addAccount({ name: newAccount.name, balance: monto, type: 'savings', currency: newAccount.currency, tipoCuenta: 'ahorro' });
      toast.success('Cuenta Creada');
    }
    setIsCreateOpen(false);
    setNewAccount({ name: '', balance: '', currency: '$', fechaApertura: new Date().toISOString().split('T')[0], plazoDias: '', tasaAnual: '' });
  };

  // --- HANDLER: TRANSFERIR ---
  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo || !tAmount) return toast.error('Datos incompletos');
    const amt = parseFloat(tAmount);
    const from = accounts.find(a => a.id === transferFrom);
    const to = accounts.find(a => a.id === transferTo);
    
    if (!from || !to) return;
    if (amt > from.balance) return toast.error('Saldo insuficiente');

    updateAccount(from.id, { balance: from.balance - amt });
    updateAccount(to.id, { balance: to.balance + amt });

    addTransaction({ accountId: from.id, type: 'withdrawal', amount: amt, description: `Trf a ${to.name}`, date: new Date().toISOString() });
    addTransaction({ accountId: to.id, type: 'deposit', amount: amt, description: `Trf de ${from.name}`, date: new Date().toISOString() });
    
    toast.success('Transferencia exitosa');
    setIsTransferOpen(false);
    setTAmount('');
  };

  // --- HANDLER: TRANSACCIÓN EN DETALLE ---
  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountId || !transactionAmount) return;
    const val = parseFloat(transactionAmount);
    const acc = accounts.find(a => a.id === selectedAccountId);
    if (!acc) return;

    if (transactionType === 'withdrawal' && val > acc.balance) return toast.error('Saldo insuficiente');

    addTransaction({
      accountId: selectedAccountId,
      type: transactionType,
      amount: val,
      description: transactionDesc || (transactionType === 'deposit' ? 'Depósito móvil' : 'Retiro móvil'),
      date: new Date().toISOString()
    });
    toast.success('Transacción registrada');
    setIsTransactionOpen(false);
    setTransactionAmount('');
    setTransactionDesc('');
  };

  const handleRename = () => {
    if (selectedAccountId && editedName.trim()) {
      updateAccount(selectedAccountId, { name: editedName.trim() });
      toast.success('Nombre actualizado');
      setIsEditingName(false);
    }
  };

  // --- DATOS COMPUTADOS ---
  const totalSoles = accounts.filter(a => a.currency === 'S/').reduce((sum, a) => sum + a.balance, 0);
  const totalDolares = accounts.filter(a => a.currency === '$').reduce((sum, a) => sum + a.balance, 0);

  // Cuenta activa para la vista detalle
  const activeAccount = accounts.find(a => a.id === selectedAccountId);
  const activeTransactions = transactions.filter(t => t.accountId === selectedAccountId).reverse();

  // =========================================================================
  // RENDERIZADO CONDICIONAL: ¿VISTA DETALLE O VISTA LISTA?
  // =========================================================================

  // ---> VISTA DETALLE
  if (selectedAccountId && activeAccount) {
    const info = getAccountDisplayInfo(activeAccount);
    
    return (
      <div className="min-h-screen bg-[#FCFCFC] flex flex-col font-sans animate-in slide-in-from-right-10 duration-300">
        
        {/* Navbar Detalle (Con botón para cerrar detalle) */}
        <div className="flex items-center gap-4 px-5 pt-8 pb-4">
          <button 
            onClick={() => setSelectedAccountId(null)} 
            className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-slate-700 shadow-sm active:scale-90 transition-transform"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-lg font-bold text-slate-900">Detalles de Cuenta</span>
        </div>

        <div className="px-5 flex-1 overflow-y-auto pb-32">
          {/* Hero Card Detalle */}
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center mb-6 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
             {info.isDPF && <div className="absolute top-2 right-2 bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">{info.tipoLabel}</div>}
             
             <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
               {info.isDPF ? <Clock size={32} /> : <Wallet size={32} />}
             </div>

             {/* Rename Logic */}
             {isEditingName ? (
               <div className="flex items-center gap-2 mb-2 w-full justify-center">
                 <input value={editedName} onChange={(e) => setEditedName(e.target.value)} className="text-xl font-bold text-center border-b-2 border-blue-500 outline-none w-[150px] bg-transparent" autoFocus />
                 <button onClick={handleRename} className="bg-green-100 text-green-600 p-2 rounded-full"><Check size={16}/></button>
               </div>
             ) : (
               <div className="flex items-center gap-2 mb-2">
                 <h2 className="text-xl font-bold text-slate-900">{activeAccount.name}</h2>
                 <button onClick={() => { setEditedName(activeAccount.name); setIsEditingName(true); }} className="text-gray-300 hover:text-blue-500"><Pencil size={14}/></button>
               </div>
             )}

             <div className="flex items-baseline gap-1">
               <span className="text-2xl text-gray-400 font-light">{activeAccount.currency}</span>
               <span className="text-5xl font-black text-slate-900 tracking-tighter">{activeAccount.balance.toLocaleString()}</span>
             </div>

             {info.isDPF && (
               <div className="mt-6 w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                 <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${info.progreso}%` }}></div>
                 <p className="text-center text-xs text-gray-400 mt-2 font-medium">{info.diasInfo} transcurridos</p>
               </div>
             )}
          </div>

          {/* Botones de Acción Detalle */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={() => { setTransactionType('deposit'); setIsTransactionOpen(true); }} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><ArrowDownCircle size={24} /></div>
              <span className="font-bold text-slate-700">Ingresar</span>
            </button>
            <button onClick={() => { setTransactionType('withdrawal'); setIsTransactionOpen(true); }} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><ArrowUpCircle size={24} /></div>
              <span className="font-bold text-slate-700">Retirar</span>
            </button>
          </div>

          {/* Historial Detalle */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-10">
            <div className="p-4 border-b border-gray-50 flex gap-2 items-center">
              <History size={16} className="text-gray-400"/>
              <h3 className="font-bold text-slate-900 text-sm">Historial</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {activeTransactions.length === 0 ? <p className="p-6 text-center text-gray-400 text-xs">Sin movimientos recientes</p> : 
                activeTransactions.map(t => (
                  <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{t.description}</p>
                      <p className="text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`font-bold text-sm ${t.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'deposit' ? '+' : '-'}{activeAccount.currency}{t.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        </div>

        {/* Modal Transacción (Overlay en Detalle) */}
        <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
          <DialogContent className="w-[90%] rounded-[32px] bg-white top-[30%]">
            <DialogHeader><DialogTitle>{transactionType === 'deposit' ? 'Ingresar' : 'Retirar'} Dinero</DialogTitle></DialogHeader>
            <form onSubmit={handleTransaction} className="space-y-4 pt-4">
               <div>
                 <Label className="text-xs uppercase text-gray-400 font-bold">Monto ({activeAccount.currency})</Label>
                 <Input type="number" value={transactionAmount} onChange={e => setTransactionAmount(e.target.value)} className="text-4xl font-black border-0 border-b bg-transparent rounded-none px-0 h-14" placeholder="0.00" autoFocus />
               </div>
               <div>
                 <Label className="text-xs uppercase text-gray-400 font-bold">Concepto</Label>
                 <Input value={transactionDesc} onChange={e => setTransactionDesc(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="Opcional" />
               </div>
               <Button type="submit" className={`w-full h-12 rounded-xl text-lg font-bold ${transactionType === 'deposit' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>Confirmar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ---> VISTA LISTA (DEFAULT)
  return (
    <div className="pb-32 px-5 pt-6 space-y-6 animate-in fade-in bg-[#FCFCFC] min-h-screen font-sans">
      
      {/* Header Lista */}
      <div className="flex items-center gap-4">
        {/* Usamos navigate(-1) para salir del módulo cuentas, o un botón home */}
        <button onClick={() => navigate('/')} className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-700 shadow-sm active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mis Cuentas</h1>
      </div>

      {/* Totales Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100 flex flex-col justify-between h-36 relative overflow-hidden">
           <Wallet size={56} className="absolute -top-2 -right-2 opacity-[0.05]" />
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Soles</span>
           <div><span className="text-lg text-gray-400 font-medium">S/</span><span className="text-3xl font-black text-slate-900 block leading-none mt-1">{totalSoles.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</span></div>
        </div>
        <div className="bg-[#1D1D1F] p-4 rounded-[28px] shadow-lg flex flex-col justify-between h-36 relative overflow-hidden text-white">
           <TrendingUp size={56} className="absolute -top-2 -right-2 opacity-10" />
           <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Dólares</span>
           <div><span className="text-lg text-gray-500 font-medium">$</span><span className="text-3xl font-black text-white block leading-none mt-1">{totalDolares.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
        </div>
      </div>

      {/* Botones Globales */}
      <div className="flex gap-3">
        <button onClick={() => setIsCreateOpen(true)} className="flex-1 bg-blue-50 py-3.5 rounded-[20px] flex items-center justify-center gap-2 text-[#007AFF] font-bold text-sm active:scale-95 transition-transform"><Plus size={18} /> Nueva Cuenta</button>
        <button onClick={() => setIsTransferOpen(true)} className="flex-1 bg-white border border-gray-200 py-3.5 rounded-[20px] flex items-center justify-center gap-2 text-slate-700 font-bold text-sm active:scale-95 transition-transform"><ArrowLeftRight size={18} /> Transferir</button>
      </div>

      {/* Lista de Tarjetas */}
      <div className="space-y-3">
        {accounts.length === 0 && <div className="text-center py-10 opacity-50"><p>No tienes cuentas</p></div>}
        {accounts.map(acc => {
           const info = getAccountDisplayInfo(acc);
           return (
             <div 
               key={acc.id} 
               onClick={() => setSelectedAccountId(acc.id)} // <--- ESTO CAMBIA A LA VISTA DETALLE
               className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 relative overflow-hidden active:scale-95 transition-all cursor-pointer"
             >
               {info.isDPF && <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">{info.tipoLabel}</div>}
               
               <div className="flex gap-4 items-center mb-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${info.isDPF ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                   {info.isDPF ? <Clock size={24}/> : <Wallet size={24}/>}
                 </div>
                 <div><h3 className="font-bold text-slate-900 leading-tight text-lg">{acc.name}</h3><p className="text-xs text-gray-400 font-medium">{info.isDPF ? info.diasInfo : 'Ahorros Vista'}</p></div>
               </div>

               <div className="flex items-baseline gap-1"><span className="text-sm text-gray-400 font-semibold">{acc.currency}</span><span className="text-4xl font-black text-slate-900 tracking-tight">{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
               
               {info.isDPF && (
                 <div className="mt-4 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-600" style={{ width: `${info.progreso}%` }}></div>
                 </div>
               )}
               <div className="absolute bottom-6 right-6 text-gray-200"><ChevronRight size={24}/></div>
             </div>
           );
        })}
      </div>

      {/* --- MODAL CREAR --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[90%] rounded-[32px] bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Crear Cuenta</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
               <button onClick={() => setTipoCuentaForm('ahorro')} className={`py-2 text-sm font-bold rounded-lg transition-all ${tipoCuentaForm === 'ahorro' ? 'bg-white shadow text-black' : 'text-gray-400'}`}>Ahorro</button>
               <button onClick={() => setTipoCuentaForm('dpf')} className={`py-2 text-sm font-bold rounded-lg transition-all ${tipoCuentaForm === 'dpf' ? 'bg-white shadow text-indigo-600' : 'text-gray-400'}`}>DPF</button>
            </div>
            <div className="space-y-1"><Label>Nombre</Label><Input value={newAccount.name} onChange={e => setNewAccount({...newAccount, name: e.target.value})} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="Ej: BCP Ahorros"/></div>
            <div className="grid grid-cols-3 gap-3">
               <div className="col-span-2"><Label>Monto</Label><Input type="number" value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: e.target.value})} className="bg-gray-50 border-0 rounded-xl h-12"/></div>
               <div><Label>Divisa</Label><select value={newAccount.currency} onChange={e => setNewAccount({...newAccount, currency: e.target.value as any})} className="w-full h-12 rounded-xl bg-gray-50 border-0 px-2 font-bold"><option value="$">$</option><option value="S/">S/</option></select></div>
            </div>
            {tipoCuentaForm === 'dpf' && (
              <div className="space-y-3 pt-2 border-t border-gray-100 animate-in slide-in-from-top-2">
                 <div className="grid grid-cols-2 gap-3">
                    <div><Label>Plazo (Días)</Label><Input type="number" value={newAccount.plazoDias} onChange={e => setNewAccount({...newAccount, plazoDias: e.target.value})} className="bg-gray-50 border-0 rounded-xl h-12"/></div>
                    <div><Label>TEA (%)</Label><Input type="number" value={newAccount.tasaAnual} onChange={e => setNewAccount({...newAccount, tasaAnual: e.target.value})} className="bg-gray-50 border-0 rounded-xl h-12"/></div>
                 </div>
                 <div><Label>Apertura</Label><Input type="date" value={newAccount.fechaApertura} onChange={e => setNewAccount({...newAccount, fechaApertura: e.target.value})} className="bg-gray-50 border-0 rounded-xl h-12"/></div>
                 <RadioGroup value={modalidadInteres} onValueChange={(v) => setModalidadInteres(v as any)} className="flex gap-2 text-sm">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="mensual" id="m1"/><Label htmlFor="m1">Mensual</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="final" id="m2"/><Label htmlFor="m2">Final</Label></div>
                 </RadioGroup>
              </div>
            )}
            <Button onClick={handleAddAccount} className="w-full h-12 rounded-[16px] text-lg font-bold bg-[#007AFF]">Crear</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL TRANSFERIR --- */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <DialogContent className="w-[90%] rounded-[32px] bg-white">
          <DialogHeader><DialogTitle>Transferir</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
             <div className="space-y-1"><Label>Origen</Label><select value={transferFrom} onChange={e => setTransferFrom(e.target.value)} className="w-full h-12 bg-gray-50 border-0 rounded-xl px-2 text-sm"><option value="">Seleccionar...</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency}{a.balance})</option>)}</select></div>
             <div className="space-y-1"><Label>Destino</Label><select value={transferTo} onChange={e => setTransferTo(e.target.value)} className="w-full h-12 bg-gray-50 border-0 rounded-xl px-2 text-sm"><option value="">Seleccionar...</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.currency}{a.balance})</option>)}</select></div>
             <div><Label>Monto</Label><Input type="number" value={tAmount} onChange={e => setTAmount(e.target.value)} className="text-2xl font-bold bg-gray-50 border-0 rounded-xl h-12"/></div>
             <Button onClick={handleTransfer} className="w-full h-12 rounded-xl font-bold bg-slate-900">Transferir</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileAccountsList;