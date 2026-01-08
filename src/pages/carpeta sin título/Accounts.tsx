// ----------------------------------------------------------------------
// 1. IMPORTS & DEPENDENCIAS
// ----------------------------------------------------------------------
import React, { useState, useEffect } from 'react';
import { Plus, Wallet, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, Upload, Trash2, Pencil, Check, X, Clock, Calendar, Percent, TrendingUp } from 'lucide-react';
import { ImageEditor } from '@/components/ImageEditor';
import { useExport } from '@/hooks/usePdfExport';
import { ExportButton } from '@/components/ExportButton';
import { Button } from '@/components/ui/button';
import { useData, Account, DPFInterestRecord } from '@/contexts/DataContext';
import { useEditMode } from '@/contexts/EditModeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
// import { TipoCambioCard } from '@/components/TipoCambioCard'; 

// ----------------------------------------------------------------------
// 2. FUNCIONES DE AYUDA (CÁLCULOS FINANCIEROS)
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
    interesDiario: monto * (Math.pow(1 + tea, 1/360) - 1)
  };
};

const calcularDiasDPF = (fechaApertura: string, plazoDias: number) => {
  const hoy = new Date();
  const apertura = new Date(fechaApertura);
  const diffTime = hoy.getTime() - apertura.getTime();
  const diasTranscurridos = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const diasRestantes = Math.max(0, plazoDias - diasTranscurridos);
  const progreso = Math.min(100, (diasTranscurridos / plazoDias) * 100);
  return { diasTranscurridos, diasRestantes, progreso };
};

const calcularMesesTranscurridos = (fechaApertura: string) => {
  const hoy = new Date();
  const apertura = new Date(fechaApertura);
  const diffTime = hoy.getTime() - apertura.getTime();
  const diasTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diasTranscurridos / 30);
};

// ----------------------------------------------------------------------
// 3. COMPONENTE PRINCIPAL
// ----------------------------------------------------------------------
const Accounts = () => {
  const { accounts, addAccount, transactions, addTransaction, updateAccount, deleteAccount } = useData();
  const { editMode } = useEditMode();
  const { exportAccountTransactions } = useExport();
  
  // --- ESTADOS ---
  const [tipoCuentaForm, setTipoCuentaForm] = useState<'ahorro' | 'dpf'>('ahorro');
  const [modalidadInteres, setModalidadInteres] = useState<'mensual' | 'final'>('mensual');
  const [newAccount, setNewAccount] = useState({
    name: '',
    balance: '',
    currency: '$' as '$' | 'S/',
    fechaApertura: new Date().toISOString().split('T')[0],
    plazoDias: '',
    tasaAnual: '',
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  
  // Transfer Form States
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferConcept, setTransferConcept] = useState('');

  // Transaction Form States
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [transactionAccountId, setTransactionAccountId] = useState<string | null>(null);
  
  // Editing States
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  // ----------------------------------------------------------------------
  // 4. EFFECTS & LOGIC
  // ----------------------------------------------------------------------
  
  useEffect(() => {
    accounts.forEach(account => {
      if (account.tipoCuenta === 'dpf-mensual' || account.tipoCuenta === 'dpf-final') {
        processDPFAccount(account);
      }
    });
  }, []); 

  const processDPFAccount = (account: Account) => {
    if (!account.fechaApertura || !account.plazoDias || !account.interesMensualProporcional) return;
    
    const mesesTranscurridos = calcularMesesTranscurridos(account.fechaApertura);
    const historial = account.historialIntereses || [];
    const mesesRegistrados = historial.length;
    
    if (account.tipoCuenta === 'dpf-final' && mesesTranscurridos > mesesRegistrados) {
      const nuevoHistorial = [...historial];
      for (let mes = mesesRegistrados + 1; mes <= mesesTranscurridos; mes++) {
        nuevoHistorial.push({
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          monto: account.interesMensualProporcional,
          tipo: 'proporcional',
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
    
    if (account.tipoCuenta === 'dpf-mensual' && account.autoIntereses && mesesTranscurridos > mesesRegistrados) {
      const nuevoHistorial = [...historial];
      for (let mes = mesesRegistrados + 1; mes <= mesesTranscurridos; mes++) {
        nuevoHistorial.push({
          id: crypto.randomUUID(),
          fecha: new Date().toISOString(),
          monto: account.interesMensualProporcional,
          tipo: 'mensual',
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
  };

  // ----------------------------------------------------------------------
  // 5. HANDLERS
  // ----------------------------------------------------------------------

  const handleAddAccount = () => {
    if (!newAccount.name || !newAccount.balance) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const monto = parseFloat(newAccount.balance);
    
    if (tipoCuentaForm === 'dpf') {
      if (!newAccount.plazoDias || !newAccount.tasaAnual) {
        toast.error('Por favor completa todos los campos del DPF');
        return;
      }
      
      const plazoDias = parseInt(newAccount.plazoDias);
      const tasaAnual = parseFloat(newAccount.tasaAnual);
      const calculos = calcularDPF(monto, tasaAnual, plazoDias);
      
      let tipoCuenta: 'dpf-mensual' | 'dpf-final';
      let interesTotalAGuardar = 0;
      let interesMensualAGuardar = 0;

      if (modalidadInteres === 'mensual') {
        tipoCuenta = 'dpf-mensual';
        interesMensualAGuardar = calculos.interesMensual;
        interesTotalAGuardar = calculos.totalAritmeticoMensual;
      } else {
        tipoCuenta = 'dpf-final';
        interesTotalAGuardar = calculos.interesTotalVencimiento;
        interesMensualAGuardar = calculos.interesTotalVencimiento / (plazoDias / 30);
      }
      
      addAccount({
        name: newAccount.name,
        balance: monto,
        type: 'savings',
        currency: newAccount.currency,
        tipoCuenta,
        fechaApertura: newAccount.fechaApertura,
        montoInicial: monto,
        tasaAnual,
        plazoDias,
        interesTotal: interesTotalAGuardar,
        interesMensualProporcional: interesMensualAGuardar,
        interesesAcumulados: 0,
        historialIntereses: [],
        autoIntereses: false,
      });
      toast.success('DPF creado exitosamente');
    } else {
      addAccount({
        name: newAccount.name,
        balance: monto,
        type: 'savings',
        currency: newAccount.currency,
        tipoCuenta: 'ahorro',
      });
      toast.success('Cuenta de ahorro agregada exitosamente');
    }

    setNewAccount({
      name: '',
      balance: '',
      currency: '$',
      fechaApertura: new Date().toISOString().split('T')[0],
      plazoDias: '',
      tasaAnual: '',
    });
    setTipoCuentaForm('ahorro');
    setModalidadInteres('mensual');
    setIsDialogOpen(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        if (selectedAccountId) {
          updateAccount(selectedAccountId, { imageUrl });
          toast.success('Imagen agregada');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    if (selectedAccountId) {
      updateAccount(selectedAccountId, { imageUrl: undefined });
      setImagePreview(null);
      toast.success('Imagen eliminada');
    }
  };

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionAccountId || !transactionAmount) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    const account = accounts.find(a => a.id === transactionAccountId);
    if (!account) return;
    const amount = parseFloat(transactionAmount);

    if (transactionType === 'withdrawal' && amount > account.balance) {
      toast.error('Saldo insuficiente');
      return;
    }

    addTransaction({
      accountId: transactionAccountId,
      type: transactionType,
      amount,
      description: transactionDescription || (transactionType === 'deposit' ? 'Depósito en cuenta' : 'Retiro de cuenta'),
      date: new Date().toISOString(),
    });

    toast.success(`${transactionType === 'deposit' ? 'Depósito' : 'Retiro'} de ${account.currency}${amount.toLocaleString()} realizado`);
    setIsTransactionOpen(false);
    setTransactionAmount('');
    setTransactionDescription('');
    setTransactionType('deposit');
    setTransactionAccountId(null);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferFrom || !transferTo || !transferAmount) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    if (transferFrom === transferTo) {
      toast.error('No puedes transferir a la misma cuenta');
      return;
    }
    const fromAccount = accounts.find(a => a.id === transferFrom);
    const toAccount = accounts.find(a => a.id === transferTo);
    if (!fromAccount || !toAccount) return;
    const amount = parseFloat(transferAmount);

    if (amount <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    if (amount > fromAccount.balance) {
      toast.error('Saldo insuficiente en la cuenta de origen');
      return;
    }

    updateAccount(transferFrom, { balance: fromAccount.balance - amount });
    updateAccount(transferTo, { balance: toAccount.balance + amount });

    const concept = transferConcept || 'Transferencia entre cuentas';
    
    addTransaction({
      accountId: transferFrom,
      type: 'withdrawal',
      amount,
      description: `${concept} → ${toAccount.name}`,
      date: new Date().toISOString(),
    });

    addTransaction({
      accountId: transferTo,
      type: 'deposit',
      amount,
      description: `${concept} ← ${fromAccount.name}`,
      date: new Date().toISOString(),
    });

    toast.success(`Transferencia de ${fromAccount.currency}${amount.toLocaleString()} realizada exitosamente`);
    setIsTransferOpen(false);
    setTransferFrom('');
    setTransferTo('');
    setTransferAmount('');
    setTransferConcept('');
  };

  const handleDepositarInteresMensual = (account: Account) => {
    if (!account.interesMensualProporcional || !account.montoInicial) return;
    const historial = account.historialIntereses || [];
    const nuevoMes = historial.length + 1;
    
    const nuevoRegistro: DPFInterestRecord = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      monto: account.interesMensualProporcional,
      tipo: 'mensual',
      mesCorrespondiente: nuevoMes,
    };
    
    const nuevoHistorial = [...historial, nuevoRegistro];
    const interesesAcumulados = nuevoHistorial.reduce((sum, i) => sum + i.monto, 0);
    
    updateAccount(account.id, {
      historialIntereses: nuevoHistorial,
      interesesAcumulados,
      balance: account.montoInicial + interesesAcumulados,
    });
    
    addTransaction({
      accountId: account.id,
      type: 'deposit',
      amount: account.interesMensualProporcional,
      description: `Interés DPF - Mes ${nuevoMes}`,
      date: new Date().toISOString(),
    });
    toast.success(`Interés del mes ${nuevoMes} depositado`);
  };

  const handleRegistrarInteresProporcional = (account: Account) => {
    if (!account.interesMensualProporcional || !account.montoInicial) return;
    const historial = account.historialIntereses || [];
    const nuevoMes = historial.length + 1;
    
    const nuevoRegistro: DPFInterestRecord = {
      id: crypto.randomUUID(),
      fecha: new Date().toISOString(),
      monto: account.interesMensualProporcional,
      tipo: 'proporcional',
      mesCorrespondiente: nuevoMes,
    };
    
    const nuevoHistorial = [...historial, nuevoRegistro];
    const interesesAcumulados = nuevoHistorial.reduce((sum, i) => sum + i.monto, 0);
    
    updateAccount(account.id, {
      historialIntereses: nuevoHistorial,
      interesesAcumulados,
      balance: account.montoInicial + interesesAcumulados,
    });
    
    addTransaction({
      accountId: account.id,
      type: 'deposit',
      amount: account.interesMensualProporcional,
      description: `Interés proporcional DPF - Mes ${nuevoMes}`,
      date: new Date().toISOString(),
    });
    toast.success(`Interés proporcional del mes ${nuevoMes} registrado`);
  };

  const handleToggleAutoIntereses = (account: Account, enabled: boolean) => {
    updateAccount(account.id, { autoIntereses: enabled });
    if (enabled && account.fechaApertura && account.interesMensualProporcional && account.montoInicial) {
      const mesesTranscurridos = calcularMesesTranscurridos(account.fechaApertura);
      const historial = account.historialIntereses || [];
      const mesesRegistrados = historial.length;
      
      if (mesesTranscurridos > mesesRegistrados) {
        const nuevoHistorial = [...historial];
        for (let mes = mesesRegistrados + 1; mes <= mesesTranscurridos; mes++) {
          nuevoHistorial.push({
            id: crypto.randomUUID(),
            fecha: new Date().toISOString(),
            monto: account.interesMensualProporcional,
            tipo: 'mensual',
            mesCorrespondiente: mes,
          });
        }
        const interesesAcumulados = nuevoHistorial.reduce((sum, i) => sum + i.monto, 0);
        updateAccount(account.id, {
          historialIntereses: nuevoHistorial,
          interesesAcumulados,
          balance: account.montoInicial + interesesAcumulados,
          autoIntereses: true,
        });
        toast.success(`${mesesTranscurridos - mesesRegistrados} intereses pendientes depositados automáticamente`);
      }
    }
    toast.success(enabled ? 'Intereses automáticos activados' : 'Intereses automáticos desactivados');
  };

  const getPendingInterests = (account: Account) => {
    if (account.tipoCuenta !== 'dpf-mensual' || account.autoIntereses || !account.fechaApertura) return 0;
    const mesesTranscurridos = calcularMesesTranscurridos(account.fechaApertura);
    const mesesRegistrados = (account.historialIntereses || []).length;
    return Math.max(0, mesesTranscurridos - mesesRegistrados);
  };

  const totalSoles = accounts
    .filter(acc => acc.currency === 'S/')
    .reduce((sum, acc) => sum + acc.balance, 0);
  
  const totalDolares = accounts
    .filter(acc => acc.currency === '$')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const getAccountDisplayInfo = (account: Account) => {
    const isDPF = account.tipoCuenta === 'dpf-mensual' || account.tipoCuenta === 'dpf-final';
    if (!isDPF || !account.fechaApertura || !account.plazoDias) {
      return { isDPF: false, tipoLabel: 'Ahorro', diasInfo: null, progreso: 0 };
    }
    const { diasTranscurridos, progreso } = calcularDiasDPF(account.fechaApertura, account.plazoDias);
    const tipoLabel = account.tipoCuenta === 'dpf-mensual' ? 'DPF – Mensual' : 'DPF – Final';
    return {
      isDPF: true,
      tipoLabel,
      diasInfo: `${diasTranscurridos} / ${account.plazoDias}`,
      progreso,
    };
  };

  // ----------------------------------------------------------------------
  // 6. RENDER UI
  // ----------------------------------------------------------------------
  return (
    <div className="p-8 animate-fade-in" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Cuentas</h1>
        </div>
        
        {/* Componente Tipo Cambio si lo tienes, descomenta:
        <div className="hidden md:block mx-auto">
           <TipoCambioCard />
        </div>
        */}

        <div className="flex gap-2">
          {/* Modal Transferencias */}
          <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowLeftRight className="w-4 h-4" />
                Transferir
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transferir entre Cuentas</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleTransfer} className="space-y-4 py-4">
                <div>
                  <Label htmlFor="transfer-from">Cuenta de Origen</Label>
                  <select
                    id="transfer-from"
                    value={transferFrom}
                    onChange={(e) => setTransferFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    required
                  >
                    <option value="">Selecciona una cuenta</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.currency}{account.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="transfer-to">Cuenta de Destino</Label>
                  <select
                    id="transfer-to"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                    required
                  >
                    <option value="">Selecciona una cuenta</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} - {account.currency}{account.balance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="transfer-amount">Monto a Transferir</Label>
                  <Input
                    id="transfer-amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="transfer-concept">Concepto</Label>
                  <Input
                    id="transfer-concept"
                    placeholder="Ej: Ahorro, Pago de servicio, etc."
                    value={transferConcept}
                    onChange={(e) => setTransferConcept(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Realizar Transferencia
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Modal Nueva Cuenta */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nueva Cuenta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Agregar Nueva Cuenta</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label className="mb-3 block">Tipo de Cuenta</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTipoCuentaForm('ahorro')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        tipoCuentaForm === 'ahorro' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Wallet className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-semibold">Ahorro</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoCuentaForm('dpf')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        tipoCuentaForm === 'dpf' 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Clock className="w-6 h-6 mx-auto mb-2" />
                      <p className="font-semibold">DPF</p>
                      <p className="text-xs text-muted-foreground">Depósito a Plazo Fijo</p>
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="name">Nombre de la Cuenta</Label>
                  <Input
                    id="name"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder={tipoCuentaForm === 'dpf' ? 'Ej: DPF BCP 180 días' : 'Ej: Cuenta de Ahorros'}
                  />
                </div>
                
                <div>
                  <Label htmlFor="balance">{tipoCuentaForm === 'dpf' ? 'Monto del Depósito' : 'Saldo Inicial'}</Label>
                  <Input
                    id="balance"
                    type="number"
                    step="0.01"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="currency">Moneda</Label>
                  <select
                    id="currency"
                    value={newAccount.currency}
                    onChange={(e) => setNewAccount({ ...newAccount, currency: e.target.value as '$' | 'S/' })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="$">Dólares ($)</option>
                    <option value="S/">Soles (S/)</option>
                  </select>
                </div>

                {tipoCuentaForm === 'dpf' && (
                  <>
                    <div>
                      <Label htmlFor="fechaApertura">Fecha de Apertura</Label>
                      <Input
                        id="fechaApertura"
                        type="date"
                        value={newAccount.fechaApertura}
                        onChange={(e) => setNewAccount({ ...newAccount, fechaApertura: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="plazoDias">Plazo en Días</Label>
                      <Input
                        id="plazoDias"
                        type="number"
                        value={newAccount.plazoDias}
                        onChange={(e) => setNewAccount({ ...newAccount, plazoDias: e.target.value })}
                        placeholder="Ej: 90, 180, 360"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tasaAnual">Tasa de Interés Anual (TEA %)</Label>
                      <Input
                        id="tasaAnual"
                        type="number"
                        step="0.01"
                        value={newAccount.tasaAnual}
                        onChange={(e) => setNewAccount({ ...newAccount, tasaAnual: e.target.value })}
                        placeholder="Ej: 5.5"
                      />
                    </div>
                    
                    <div>
                      <Label className="mb-3 block">Tipo de Pago de Intereses</Label>
                      <RadioGroup value={modalidadInteres} onValueChange={(v) => setModalidadInteres(v as 'mensual' | 'final')}>
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="mensual" id="mensual" />
                          <Label htmlFor="mensual" className="cursor-pointer flex-1">
                            <p className="font-medium">Intereses mensuales</p>
                            <p className="text-sm text-muted-foreground">Recibe intereses cada mes</p>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="final" id="final" />
                          <Label htmlFor="final" className="cursor-pointer flex-1">
                            <p className="font-medium">Intereses al final (Capitalizable)</p>
                            <p className="text-sm text-muted-foreground">Mayor ganancia por interés compuesto</p>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {newAccount.balance && newAccount.tasaAnual && newAccount.plazoDias && (
                      <div className="p-4 bg-muted/50 rounded-lg space-y-2 border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Simulación de Ganancia
                        </p>
                        {(() => {
                          const calc = calcularDPF(
                            parseFloat(newAccount.balance),
                            parseFloat(newAccount.tasaAnual),
                            parseInt(newAccount.plazoDias)
                          );
                          return (
                            <div className="space-y-3">
                              {modalidadInteres === 'mensual' ? (
                                <>
                                  <div className="flex justify-between items-center">
                                     <span className="text-sm">Pago mensual estimado:</span>
                                     <span className="font-bold text-green-600 text-lg">
                                       {newAccount.currency}{calc.interesMensual.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                     </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    *Total aprox. en {calc.numeroMeses} meses: {newAccount.currency}{calc.totalAritmeticoMensual.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="flex justify-between items-center">
                                     <span className="text-sm">Ganancia total al final:</span>
                                     <span className="font-bold text-blue-600 text-lg">
                                       {newAccount.currency}{calc.interesTotalVencimiento.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                     </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    *Incluye interés compuesto capitalizado.
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </>
                )}

                <Button onClick={handleAddAccount} className="w-full">
                  {tipoCuentaForm === 'dpf' ? 'Crear DPF' : 'Agregar Cuenta'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* --- TOTALES (Diseño Apple Glass UPDATED) --- */}
      {accounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Card Soles */}
          <div className="relative w-full overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-8 shadow-2xl shadow-blue-900/5 backdrop-blur-3xl ring-1 ring-white/70 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
            
            {/* Saldo Arriba (Sin Icono) */}
            <p className="text-6xl font-light tracking-tight text-gray-900 tabular-nums drop-shadow-sm leading-none mb-2">
               S/ {totalSoles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            
            {/* Etiqueta Abajo */}
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600/70">Saldo Total Soles</p>
          </div>

          {/* Card Dólares */}
          <div className="relative w-full overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-8 shadow-2xl shadow-emerald-900/5 backdrop-blur-3xl ring-1 ring-white/70 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
             <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
            
            {/* Saldo Arriba (Sin Icono) */}
            <p className="text-6xl font-light tracking-tight text-gray-900 tabular-nums drop-shadow-sm leading-none mb-2">
               $ {totalDolares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            
            {/* Etiqueta Abajo */}
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Saldo Total Dólares</p>
          </div>
        </div>
      )}

      {/* --- GRID DE TARJETAS (ESTILO APPLE GLASS) --- */}
      {accounts.length === 0 ? (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tienes cuentas todavía</h3>
          <p className="text-muted-foreground mb-4">Agrega tu primera cuenta para comenzar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <style>
            {`
              @keyframes shimmer {
                100% { transform: translateX(100%); }
              }
              
              /* ESTO OCULTA LA BARRA GRIS DEL HISTORIAL */
              .scrollbar-hide::-webkit-scrollbar {
                  display: none;
              }
              .scrollbar-hide {
                  -ms-overflow-style: none;
                  scrollbar-width: none;
              }
            `}
          </style>

          {accounts.map((account) => {
            const displayInfo = getAccountDisplayInfo(account);
            const isDPF = displayInfo.isDPF;
            const pendingInterests = getPendingInterests(account);
            
            const badgeColor = isDPF 
              ? 'border-purple-200/50 bg-purple-100/50 text-purple-700' 
              : 'border-blue-200/50 bg-blue-100/50 text-blue-700';
            
            const shadowStyle = isDPF
              ? 'shadow-purple-900/5 hover:shadow-purple-900/10'
              : 'shadow-blue-900/5 hover:shadow-blue-900/10';

            return (
              <div
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
                className={`group relative w-full overflow-hidden rounded-[32px] border border-white/40 bg-white/70 p-8 shadow-2xl ${shadowStyle} backdrop-blur-3xl ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>

                {isDPF && (
                   <div className="absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-purple-500/20 blur-3xl mix-blend-multiply transition-all duration-700 group-hover:bg-purple-500/30"></div>
                )}

                <span className={`absolute top-6 right-6 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform group-hover:scale-105 ${badgeColor}`}>
                  {displayInfo.tipoLabel}
                </span>
                
                {pendingInterests > 0 && (
                   <span className="absolute top-6 left-6 text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full border border-amber-200">
                     ! {pendingInterests} pend.
                   </span>
                )}

                <div className="mt-4"></div>

                {/* NOMBRE DE LA CUENTA (Separación extra mb-4) */}
                <h3 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900 relative z-10">
                  {account.name}
                </h3>

                {/* SALDO (Separación extra mb-6) */}
                <div className={`relative z-10 flex items-baseline justify-center gap-1.5 ${isDPF ? 'mb-10' : 'mb-6'}`}>
                  <span className="text-3xl font-light text-gray-400">{account.currency}</span>
                  <span className="text-[56px] font-light tracking-tight text-gray-900 leading-none drop-shadow-sm tabular-nums">
                    {account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {isDPF && (
                  <div className="relative z-10 w-full">
                    <div className="mb-2 flex justify-center gap-2 text-xs font-medium text-gray-500">
                      <span>Progreso:</span>
                      <span className="font-bold text-purple-600">{Math.round(displayInfo.progreso)}%</span>
                    </div>
                    
                    <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200/50 p-0.5 backdrop-blur-sm">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 shadow-[0_0_15px_rgba(168,85,247,0.6)] relative overflow-hidden"
                        style={{ width: `${displayInfo.progreso}%` }}
                      >
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full" style={{ animation: 'shimmer 2s infinite' }}></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-4 text-[10px] font-medium text-gray-400 pt-2">
                      <span>{displayInfo.diasInfo} días</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL DETALLE DE CUENTA --- */}
      <Dialog open={!!selectedAccountId} onOpenChange={(open) => !open && setSelectedAccountId(null)}>
        {/* FIX: overflow-hidden en el contenedor padre para que el modal no scrollee entero */}
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
          {(() => {
            const account = accounts.find(a => a.id === selectedAccountId);
            if (!account) return null;
            const accountTransactions = transactions.filter(t => t.accountId === selectedAccountId);
            const displayInfo = getAccountDisplayInfo(account);
            const pendingInterests = getPendingInterests(account);

            return (
              <div className="flex flex-col h-full overflow-hidden space-y-6">
                <DialogHeader className="shrink-0">
                  <DialogTitle className="text-2xl">Detalles de la Cuenta</DialogTitle>
                </DialogHeader>

                <div className="grid md:grid-cols-2 gap-6 h-full overflow-hidden">
                  
                  {/* --- COLUMNA IZQUIERDA (Info y Acciones - Scroll Independiente) --- */}
                  <div className="space-y-4 overflow-y-auto pr-2">
                    {account.imageUrl && (
                      <ImageEditor
                        imageUrl={account.imageUrl}
                        alt={account.name}
                        onRemove={removeImage}
                      />
                    )}

                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      {displayInfo.isDPF ? (
                        <Clock className="w-6 h-6 text-primary" />
                      ) : (
                        <Wallet className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    
                    {/* Nombre y Saldo con Espaciado Mejorado */}
                    <div className="text-center space-y-4">
                        {isEditingName ? (
                            <div className="flex items-center justify-center gap-2">
                            <Input
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                className="text-lg font-semibold text-center w-48"
                                autoFocus
                            />
                            <Button size="icon" variant="ghost" onClick={() => {
                                if (editedName.trim()) {
                                    updateAccount(account.id, { name: editedName.trim() });
                                    toast.success('Nombre actualizado');
                                }
                                setIsEditingName(false);
                                }}>
                                <Check className="w-4 h-4 text-green-500" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setIsEditingName(false)}>
                                <X className="w-4 h-4 text-destructive" />
                            </Button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 group">
                            <h3 className="text-2xl font-bold text-gray-800">{account.name}</h3> 
                            <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                setEditedName(account.name);
                                setIsEditingName(true);
                                }}>
                                <Pencil className="w-3 h-3 text-muted-foreground" />
                            </Button>
                            </div>
                        )}
                        
                        <div className="flex items-baseline justify-center gap-1 mt-2">
                            <span className="text-3xl text-muted-foreground font-light">{account.currency}</span>
                            <span className="text-6xl font-bold tracking-tight text-gray-900">{account.balance.toLocaleString()}</span>
                        </div>
                        
                        <p className="text-sm font-medium text-muted-foreground bg-secondary/50 inline-block px-3 py-1 rounded-full">
                            {displayInfo.tipoLabel}
                        </p>
                    </div>

                    {/* DPF Detalles */}
                    {displayInfo.isDPF && account.plazoDias && account.fechaApertura && (
                      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-semibold flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Detalles del DPF
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Monto inicial</p>
                            <p className="font-semibold">{account.currency}{account.montoInicial?.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Tasa anual (TEA)</p>
                            <p className="font-semibold">{account.tasaAnual}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Plazo</p>
                            <p className="font-semibold">{account.plazoDias} días</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Fecha apertura</p>
                            <p className="font-semibold">{new Date(account.fechaApertura).toLocaleDateString('es-PE')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Interés total proyectado</p>
                            <p className="font-semibold text-green-500">{account.currency}{account.interesTotal?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">{account.tipoCuenta === 'dpf-mensual' ? 'Pago mensual' : 'Promedio mensual'}</p>
                            <p className="font-semibold">{account.currency}{account.interesMensualProporcional?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Intereses acumulados</p>
                            <p className="font-semibold text-green-500">{account.currency}{(account.interesesAcumulados || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Progreso</p>
                            <p className="font-semibold">Días: {displayInfo.diasInfo}</p>
                          </div>
                        </div>

                        <Progress value={displayInfo.progreso} className="h-3" />

                        {account.tipoCuenta === 'dpf-mensual' && (
                          <div className="space-y-3 pt-2 border-t border-border">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="auto-intereses" className="text-sm">Intereses automáticos</Label>
                              <Switch
                                id="auto-intereses"
                                checked={account.autoIntereses || false}
                                onCheckedChange={(checked) => handleToggleAutoIntereses(account, checked)}
                              />
                            </div>
                            {pendingInterests > 0 && !account.autoIntereses && (
                              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg text-sm">
                                Tiene <strong>{pendingInterests}</strong> intereses mensuales pendientes por registrar.
                              </div>
                            )}
                            <Button onClick={() => handleDepositarInteresMensual(account)} className="w-full gap-2" variant="outline">
                              <ArrowUpCircle className="w-4 h-4" />
                              Depositar intereses manualmente
                            </Button>
                          </div>
                        )}

                        {account.tipoCuenta === 'dpf-final' && (
                          <div className="space-y-3 pt-2 border-t border-border">
                            <Button onClick={() => handleRegistrarInteresProporcional(account)} className="w-full gap-2" variant="outline">
                              <Percent className="w-4 h-4" />
                              Registrar interés proporcional del mes
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {!account.imageUrl && (
                      <div className="border-2 border-dashed border-border rounded-xl p-4">
                        <Label htmlFor="account-image-upload" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Agregar foto de referencia</span>
                        </Label>
                        <Input id="account-image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                      <Button size="lg" className="gap-2 w-full" onClick={() => {
                          setTransactionAccountId(account.id);
                          setTransactionType('deposit');
                          setIsTransactionOpen(true);
                        }}>
                        <ArrowUpCircle className="w-4 h-4" />
                        Depositar
                      </Button>
                      <Button size="lg" variant="outline" className="gap-2 w-full" onClick={() => {
                          setTransactionAccountId(account.id);
                          setTransactionType('withdrawal');
                          setIsTransactionOpen(true);
                        }}>
                        <ArrowDownCircle className="w-4 h-4" />
                        Retirar
                      </Button>
                      {editMode && (
                        <Button size="lg" variant="destructive" className="gap-2 w-full" onClick={() => {
                            if (window.confirm('¿Estás seguro de eliminar esta cuenta? Esta acción no se puede deshacer.')) {
                              deleteAccount(account.id);
                              setSelectedAccountId(null);
                              toast.success('Cuenta eliminada');
                            }
                          }}>
                          <Trash2 className="w-4 h-4" />
                          Eliminar Cuenta
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* --- COLUMNA DERECHA (Historial - Altura Fija 550px con Scroll Invisible) --- */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between shrink-0">
                      <h3 className="text-xl font-bold">Historial de Transacciones</h3>
                      {accountTransactions.length > 0 && (
                        <ExportButton
                          onExport={(format) => exportAccountTransactions(account.name, account.currency, accountTransactions, format)}
                        />
                      )}
                    </div>
                    
                    {accountTransactions.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-xl border border-dashed min-h-[200px]">
                        <p className="text-muted-foreground">No hay transacciones registradas</p>
                      </div>
                    ) : (
                      // CAMBIO: h-[550px] para altura fija y scrollbar-hide para ocultar barra
                      <div className="h-[550px] overflow-y-auto scrollbar-hide space-y-3 pr-1">
                        {accountTransactions.slice().reverse().map((transaction) => (
                          <div key={transaction.id} className="flex justify-between items-center p-6 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                            <div className="flex-1">
                              <p className="font-semibold text-xl">{transaction.description}</p>
                              <p className="text-base text-muted-foreground">
                                {new Date(transaction.date).toLocaleDateString('es-CL')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold text-2xl ${transaction.type === 'deposit' ? 'text-green-500' : 'text-destructive'}`}>
                                {transaction.type === 'deposit' ? '+' : '-'}{account.currency}{transaction.amount.toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">{transaction.type === 'deposit' ? 'Depósito' : 'Retiro'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* --- MODAL TRANSACCIÓN RÁPIDA --- */}
      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{transactionType === 'deposit' ? 'Depositar' : 'Retirar'} Dinero</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTransaction} className="space-y-4">
            <div>
              <Label htmlFor="transaction-amount">Monto</Label>
              <Input
                id="transaction-amount"
                type="number"
                placeholder="0.00"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="transaction-description">Descripción (opcional)</Label>
              <Input
                id="transaction-description"
                placeholder={transactionType === 'deposit' ? 'Depósito en cuenta' : 'Retiro de cuenta'}
                value={transactionDescription}
                onChange={(e) => setTransactionDescription(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              {transactionType === 'deposit' ? 'Depositar' : 'Retirar'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Accounts;