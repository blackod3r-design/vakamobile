// ----------------------------------------------------------------------
// 1. IMPORTS & DEPENDENCIAS
// ----------------------------------------------------------------------
import React, { useState, useRef } from 'react';
import { CreditCard, Plus, FileSpreadsheet, Settings, Wifi, Upload, Trash2, Calendar, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { useExport } from '@/hooks/usePdfExport';
import { ExportButton } from '@/components/ExportButton';
import { ImageEditor } from '@/components/ImageEditor';
import { useData } from '@/contexts/DataContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';

// IMPORTAR USE THEME
import { useTheme } from '@/contexts/ThemeContext';

// --- CONSTANTS ---
const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
const CreditCards = () => {
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useData();
  const { editMode } = useEditMode();
  const { exportCreditCardTransactions } = useExport();
  const { theme } = useTheme(); // Obtenemos el tema
  
  // Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  
  // Selection States
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [customizeCardId, setCustomizeCardId] = useState<string | null>(null);
  const [expenseCardId, setExpenseCardId] = useState<string | null>(null);
  const [paymentCardId, setPaymentCardId] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [balance, setBalance] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState<'$' | 'S/'>('$');
  const [cardLogo, setCardLogo] = useState<string>('visa');

  // Transactions Form States
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- LOGICA DE FONDO (PÁGINA) ---
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

  // --- HANDLERS (Sin cambios) ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        if (selectedCardId) {
          updateCreditCard(selectedCardId, { imageUrl });
          toast.success('Imagen agregada');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    if (selectedCardId) {
      updateCreditCard(selectedCardId, { imageUrl: undefined });
      setImagePreview(null);
      toast.success('Imagen eliminada');
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !limit) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }

    addCreditCard({
      name,
      limit: parseFloat(limit),
      balance: parseFloat(balance) || 0,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      currency,
      cardLogo,
      transactions: []
    });

    toast.success('Tarjeta agregada correctamente');
    setIsOpen(false);
    setName('');
    setLimit('');
    setBalance('');
    setDueDate('');
    setCurrency('$');
    setCardLogo('visa');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseCardId || !expenseAmount) {
      toast.error('Completa todos los campos');
      return;
    }
    const card = creditCards.find(c => c.id === expenseCardId);
    if (!card) return;

    const amount = parseFloat(expenseAmount);
    const newTransaction = {
      id: crypto.randomUUID(),
      amount,
      type: 'expense' as const,
      description: expenseDescription || 'Gasto',
      date: new Date().toISOString()
    };

    updateCreditCard(expenseCardId, { 
      balance: card.balance + amount,
      transactions: [...card.transactions, newTransaction]
    });

    toast.success(`Gasto registrado: ${card.currency}${amount.toLocaleString()}`);
    setIsExpenseOpen(false);
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseCardId(null);
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCardId || !paymentAmount) {
      toast.error('Completa todos los campos');
      return;
    }
    const card = creditCards.find(c => c.id === paymentCardId);
    if (!card) return;

    const amount = parseFloat(paymentAmount);
    
    const newTransaction = {
      id: crypto.randomUUID(),
      amount,
      type: 'payment' as const,
      description: 'Pago de tarjeta',
      date: new Date().toISOString()
    };

    updateCreditCard(paymentCardId, { 
      balance: Math.max(0, card.balance - amount),
      transactions: [...card.transactions, newTransaction]
    });

    toast.success(`Pago registrado: ${card.currency}${amount.toLocaleString()}`);
    setIsPaymentOpen(false);
    setPaymentAmount('');
    setPaymentCardId(null);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          toast.error('El archivo está vacío');
          return;
        }

        let importedCount = 0;
        jsonData.forEach((row: any) => {
          const cardName = row['Tarjeta'] || row['tarjeta'];
          const amount = parseFloat(row['Monto'] || row['monto']);
          const type = (row['Tipo'] || row['tipo'])?.toLowerCase();
          const description = row['Descripción'] || row['descripcion'] || 'Movimiento importado';
          const date = row['Fecha'] || row['fecha'] || new Date().toISOString();

          if (!cardName || isNaN(amount) || !type) return;

          const card = creditCards.find(c => c.name.toLowerCase() === cardName.toLowerCase());
          if (!card) return;

          const newTransaction = {
            id: crypto.randomUUID(),
            amount,
            type: type === 'pago' ? 'payment' as const : 'expense' as const,
            description,
            date: new Date(date).toISOString()
          };

          updateCreditCard(card.id, {
            balance: type === 'pago' ? card.balance - amount : card.balance + amount,
            transactions: [...card.transactions, newTransaction]
          });
          importedCount++;
        });

        toast.success(`${importedCount} movimientos importados`);
        setIsImportOpen(false);
      } catch (error) {
        toast.error('Error al leer el archivo');
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- RENDER UI ---

  return (
    // APLICAMOS EL FONDO DINAMICO AQUI
    <div className={`p-8 animate-fade-in font-sans min-h-screen w-full transition-colors duration-500 ${pageBgClass}`} style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${theme && theme.includes('dark') ? 'text-white' : 'text-gray-900'}`}>
            Tarjetas de Crédito
          </h1>
          <p className="text-muted-foreground">Gestiona tus líneas de crédito y consumos</p>
        </div>
        
        <div className="flex gap-2">
          {/* Import Button */}
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Importar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importar Movimientos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">Click para seleccionar Excel/CSV</p>
                  <Input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileImport} className="hidden" />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* New Card Button */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-zinc-900 hover:bg-black text-white shadow-lg shadow-zinc-200">
                <Plus className="h-4 w-4" />
                Nueva Tarjeta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Tarjeta</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddCard} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input placeholder="Ej: Visa Platinum" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Moneda</Label>
                    <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="$">Dólares ($)</SelectItem>
                        <SelectItem value="S/">Soles (S/)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Red / Marca</Label>
                    <Select value={cardLogo} onValueChange={setCardLogo}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visa">Visa</SelectItem>
                        <SelectItem value="mastercard">Mastercard</SelectItem>
                        <SelectItem value="amex">Amex</SelectItem>
                        <SelectItem value="diners">Diners</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Línea de Crédito</Label>
                  <Input type="number" placeholder="0.00" value={limit} onChange={(e) => setLimit(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Deuda Actual</Label>
                  <Input type="number" placeholder="0.00" value={balance} onChange={(e) => setBalance(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Pago</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <Button type="submit" className="w-full">Guardar Tarjeta</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* --- GRID DE TARJETAS --- */}
      {creditCards.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-[32px] border border-dashed border-muted-foreground/20">
          <CreditCard className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">Tu billetera está vacía</h3>
          <p className="text-muted-foreground mt-2">Agrega tu primera tarjeta de crédito para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <style>
            {`
              @keyframes shimmer {
                100% { transform: translateX(100%); }
              }
            `}
          </style>

          {creditCards.map((card) => {
            const usagePercent = Math.min(100, (card.balance / card.limit) * 100);
            const available = card.limit - card.balance;
            
            // --- LÓGICA DE ESTILOS DE TARJETA SEGÚN TEMA ---
            let cardContainerClass = '';
            let textMainClass = 'text-gray-900';
            let textSubClass = 'text-gray-400';
            let progressBgClass = 'bg-gray-200/50';
            let badgeStyle = 'border-indigo-200/50 bg-indigo-50/50 text-indigo-700';

            if (theme === 'dark' || theme === 'dark-glass' || theme.includes('dark')) {
                // TEMA OSCURO (NEGRO)
                cardContainerClass = 'bg-[#181818] border-[#27272a] shadow-black hover:border-zinc-600 shadow-2xl';
                textMainClass = 'text-white';
                textSubClass = 'text-zinc-500';
                progressBgClass = 'bg-[#27272a]';
                badgeStyle = 'border-indigo-900/50 bg-indigo-900/20 text-indigo-400';
            } else if (theme === 'glass') {
                // TEMA GLASS
                cardContainerClass = 'bg-white/70 border-white/40 shadow-indigo-900/5 backdrop-blur-3xl ring-1 ring-white/70 hover:shadow-indigo-900/10 shadow-2xl';
                textMainClass = 'text-gray-900';
                textSubClass = 'text-gray-400';
            } else {
                // TEMA LIGHT (SOLID)
                cardContainerClass = 'bg-white border-gray-100 shadow-xl shadow-indigo-900/10 hover:shadow-indigo-900/20';
                textMainClass = 'text-gray-900';
                textSubClass = 'text-gray-400';
                progressBgClass = 'bg-gray-100';
                badgeStyle = 'border-indigo-100 bg-indigo-50 text-indigo-700';
            }

            const progressGradient = 'from-indigo-500 via-purple-500 to-pink-500';

            return (
              <div 
                key={card.id} 
                onClick={() => setSelectedCardId(card.id)}
                // APLICAMOS LA CLASE DINÁMICA AQUI
                className={`group relative w-full overflow-hidden rounded-[32px] border p-8 transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center ${cardContainerClass}`}
              >
                {/* 1. Reflejo Superior (Solo visible en glass/light) */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>

                {/* 2. Glow de Fondo */}
                <div className="absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-indigo-500/10 blur-3xl mix-blend-multiply transition-all duration-700 group-hover:bg-indigo-500/20"></div>

                {/* 3. BADGE */}
                <span className={`absolute top-6 right-6 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform group-hover:scale-105 ${badgeStyle}`}>
                  {card.cardLogo || 'Visa'}
                </span>

                <div className="mt-4"></div>

                {/* 4. Nombre de la Tarjeta */}
                <h3 className={`mb-4 text-2xl font-semibold tracking-tight relative z-10 ${textMainClass}`}>
                  {card.name}
                </h3>

                {/* 5. Monto Principal (DEUDA) */}
                <div className="relative z-10 flex items-baseline justify-center gap-1.5 mb-10">
                  <span className={`text-3xl font-light ${textSubClass}`}>{card.currency}</span>
                  <span className={`text-[56px] font-light tracking-tight leading-none drop-shadow-sm tabular-nums ${textMainClass}`}>
                    {card.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* 6. Barra de Progreso */}
                <div className="relative z-10 w-full">
                    <div className={`mb-2 flex justify-between gap-2 text-xs font-medium ${textSubClass}`}>
                      <span>Uso: <span className="text-indigo-600 font-bold">{usagePercent.toFixed(0)}%</span></span>
                      <span>Disp: {card.currency}{available.toLocaleString()}</span>
                    </div>
                    
                    <div className={`h-4 w-full overflow-hidden rounded-full p-0.5 backdrop-blur-sm ${progressBgClass}`}>
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${progressGradient} shadow-[0_0_15px_rgba(99,102,241,0.5)] relative overflow-hidden`}
                        style={{ width: `${usagePercent}%` }}
                      >
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full" style={{ animation: 'shimmer 2s infinite' }}></div>
                      </div>
                    </div>
                    
                    <div className={`flex justify-center gap-4 text-[10px] font-medium pt-2 ${textSubClass}`}>
                      <span>Línea Total: {card.currency}{card.limit.toLocaleString()}</span>
                    </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL DETALLE DE TARJETA --- */}
      <Dialog open={!!selectedCardId} onOpenChange={(open) => !open && setSelectedCardId(null)}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden flex flex-col bg-zinc-50/95 backdrop-blur-xl">
          {(() => {
            const card = creditCards.find(c => c.id === selectedCardId);
            if (!card) return null;
            
            const availableCredit = card.limit - card.balance;
            const daysUntilDue = Math.ceil((new Date(card.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

            return (
              <div className="flex flex-col h-full w-full">
                
                {/* Header */}
                <DialogHeader className="px-8 py-6 border-b border-gray-200/50 bg-white/50 shrink-0">
                  <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-indigo-600" />
                      {card.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                  <div className="grid md:grid-cols-2 h-full">
                    
                    {/* IZQUIERDA: Tarjeta Visual y Botones */}
                    <div className="p-8 overflow-y-auto space-y-8 bg-white/40 h-full border-r border-gray-200/50">
                        
                        {/* Tarjeta Visual Grande (Diseño Midnight Glass en detalle para contraste) */}
                        <div className="relative w-full h-[250px] rounded-[24px] bg-gradient-to-br from-[#4c4ddc] to-[#2a2b85] shadow-2xl shadow-indigo-900/20 overflow-hidden text-white p-8 flex flex-col justify-between shrink-0 transform transition-transform hover:scale-[1.02]">
                            {card.imageUrl && <img src={card.imageUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay" />}
                            <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: NOISE_BG }}></div>
                            
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <h3 className="text-3xl font-bold italic tracking-tight">{card.name}</h3>
                                    <p className="text-xs uppercase tracking-widest opacity-70 mt-1">{card.cardLogo || 'Crédito'}</p>
                                </div>
                                <Wifi className="w-10 h-10 opacity-50 rotate-90" />
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase opacity-60 mb-2">Deuda Total</p>
                                <p className="text-4xl font-mono font-bold tracking-tight">{card.currency}{card.balance.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Disponible</p>
                                <p className="text-2xl font-bold text-green-600">{card.currency}{availableCredit.toLocaleString()}</p>
                            </div>
                            <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Cierre</p>
                                <div className="flex items-center gap-2">
                                    <Calendar className={`w-5 h-5 ${daysUntilDue < 3 ? 'text-red-500' : 'text-indigo-500'}`} />
                                    <span className={`text-xl font-bold ${daysUntilDue < 3 ? 'text-red-500' : 'text-gray-800'}`}>
                                        {daysUntilDue} días
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="space-y-3">
                            <Button size="lg" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-md" onClick={() => { setPaymentCardId(card.id); setIsPaymentOpen(true); }}>
                                <ArrowDownCircle className="w-5 h-5" /> Pagar Tarjeta
                            </Button>
                            <Button size="lg" variant="outline" className="w-full h-12 gap-2" onClick={() => { setExpenseCardId(card.id); setIsExpenseOpen(true); }}>
                                <ArrowUpCircle className="w-5 h-5" /> Registrar Gasto
                            </Button>
                        </div>

                        {/* Configuración Extra */}
                        <div className="pt-4 border-t border-gray-200/50">
                             {!card.imageUrl ? (
                                <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                                    <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                                    <Upload className="w-6 h-6 mx-auto text-gray-400 group-hover:text-indigo-500 mb-2" />
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-indigo-600">Subir imagen de tarjeta</span>
                                </div>
                             ) : (
                                <Button variant="ghost" size="sm" onClick={removeImage} className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" /> Quitar imagen
                                </Button>
                             )}
                             
                             {editMode && (
                                <Button variant="destructive" className="w-full mt-4" onClick={() => {
                                    if(confirm('¿Eliminar tarjeta?')) { deleteCreditCard(card.id); setSelectedCardId(null); }
                                }}>
                                    Eliminar Tarjeta
                                </Button>
                             )}
                        </div>
                    </div>

                    {/* DERECHA: Historial */}
                    <div className="flex flex-col h-full bg-white p-8 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">Movimientos Recientes</h3>
                            {card.transactions.length > 0 && <ExportButton onExport={(f) => exportCreditCardTransactions(card.name, card.currency, card.transactions, f)} />}
                        </div>

                        {card.transactions.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <FileSpreadsheet className="w-12 h-12 mb-3 opacity-20" />
                                <p>Sin movimientos registrados</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                                {card.transactions.slice().reverse().map((t) => (
                                    <div key={t.id} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-indigo-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'expense' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {t.type === 'expense' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{t.description}</p>
                                                <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-lg ${t.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                                            {t.type === 'expense' ? '-' : '+'}{card.currency}{t.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* --- MODALES ACCIONES --- */}
      <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
            <form onSubmit={handleAddExpense} className="space-y-4">
                <div><Label>Monto</Label><Input type="number" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} autoFocus /></div>
                <div><Label>Descripción</Label><Input value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} placeholder="Ej: Supermercado" /></div>
                <Button type="submit" className="w-full">Guardar</Button>
            </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Registrar Pago</DialogTitle></DialogHeader>
            <form onSubmit={handlePayment} className="space-y-4">
                <div><Label>Monto a Pagar</Label><Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} autoFocus /></div>
                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">Confirmar Pago</Button>
            </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Personalizar</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <Label>Imagen de fondo</Label>
                <Input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if(file && customizeCardId) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            updateCreditCard(customizeCardId, { imageUrl: reader.result as string });
                            toast.success('Fondo actualizado');
                        };
                        reader.readAsDataURL(file);
                    }
                }} />
                <Button onClick={() => setIsCustomizeOpen(false)} className="w-full">Cerrar</Button>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CreditCards;