import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Plus, FileSpreadsheet, Wifi, Upload, Trash2, 
  Calendar, ArrowDownCircle, ArrowUpCircle, ArrowLeft, MoreVertical
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

// --- UI COMPONENTS ---
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- CONSTANTES & UTILS ---
const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

// Función segura para generar IDs en móviles sin HTTPS
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const MobileCards = () => {
  const navigate = useNavigate();
  const { creditCards, addCreditCard, updateCreditCard, deleteCreditCard } = useData();

  // --- ESTADO DE NAVEGACIÓN ---
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // --- ESTADOS MODALES ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- ESTADOS FORMULARIOS ---
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [balance, setBalance] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState<'$' | 'S/'>('$');
  const [cardLogo, setCardLogo] = useState<string>('visa');

  // Transacciones
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- LOGICA: CREAR TARJETA ---
  const handleAddCard = () => {
    if (!name || !limit) return toast.error('Faltan datos obligatorios');
    
    addCreditCard({
      name,
      limit: parseFloat(limit),
      balance: parseFloat(balance) || 0,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      currency,
      cardLogo,
      transactions: []
    });

    toast.success('Tarjeta creada');
    setIsCreateOpen(false);
    setName(''); setLimit(''); setBalance(''); setDueDate(''); setCurrency('$');
  };

  // --- LOGICA: GASTO / PAGO ---
  const handleTransaction = (type: 'expense' | 'payment') => {
    if (!selectedCardId || !amount) return toast.error('Monto requerido');
    const card = creditCards.find(c => c.id === selectedCardId);
    if (!card) return;

    const val = parseFloat(amount);
    const newTx = {
      id: generateId(),
      amount: val,
      type,
      description: description || (type === 'expense' ? 'Compra' : 'Pago de tarjeta'),
      date: new Date().toISOString()
    };

    updateCreditCard(selectedCardId, {
      balance: type === 'expense' ? card.balance + val : Math.max(0, card.balance - val),
      transactions: [...card.transactions, newTx]
    });

    toast.success(type === 'expense' ? 'Gasto registrado' : 'Pago realizado');
    if(type === 'expense') setIsExpenseOpen(false);
    else setIsPaymentOpen(false);
    setAmount(''); setDescription('');
  };

  // --- LOGICA: IMPORTAR EXCEL ---
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) return toast.error('Archivo vacío');

        let count = 0;
        jsonData.forEach((row: any) => {
          const cName = row['Tarjeta'] || row['tarjeta'];
          const amt = parseFloat(row['Monto'] || row['monto']);
          const type = (row['Tipo'] || row['tipo'])?.toLowerCase();
          
          if (!cName || isNaN(amt)) return;
          const card = creditCards.find(c => c.name.toLowerCase() === cName.toLowerCase());
          if (!card) return;

          const newTx = {
            id: generateId(),
            amount: amt,
            type: type === 'pago' ? 'payment' as const : 'expense' as const,
            description: row['Descripción'] || 'Importado',
            date: new Date().toISOString()
          };

          updateCreditCard(card.id, {
            balance: type === 'pago' ? card.balance - amt : card.balance + amt,
            transactions: [...card.transactions, newTx]
          });
          count++;
        });
        toast.success(`${count} movimientos importados`);
      } catch (err) {
        toast.error('Error al leer Excel');
      }
    };
    reader.readAsBinaryString(file);
  };

  // --- LOGICA: IMAGEN ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedCardId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCreditCard(selectedCardId, { imageUrl: reader.result as string });
        toast.success('Imagen actualizada');
        setIsSettingsOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- VARIABLES ---
  const activeCard = creditCards.find(c => c.id === selectedCardId);
  const totalDebtSoles = creditCards.filter(c => c.currency === 'S/').reduce((sum, c) => sum + c.balance, 0);
  const totalDebtDollars = creditCards.filter(c => c.currency === '$').reduce((sum, c) => sum + c.balance, 0);

  // =========================================================================
  // VISTA DETALLE
  // =========================================================================
  if (selectedCardId && activeCard) {
    const usagePercent = Math.min(100, (activeCard.balance / activeCard.limit) * 100);
    const available = activeCard.limit - activeCard.balance;
    const daysUntilDue = Math.ceil((new Date(activeCard.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <div className="min-h-screen bg-[#FCFCFC] flex flex-col font-sans animate-in slide-in-from-right-10 duration-300">
        
        {/* Header Detalle (Modificado: Sin flecha ni texto) */}
        <div className="flex items-center justify-end px-5 pt-8 pb-4">
          <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-white rounded-full shadow-sm border border-gray-100 active:scale-90 transition-transform">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Contenedor Principal con Scroll Invisible */}
        <div className="px-5 flex-1 overflow-y-auto pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          
          {/* HERO CARD VISUAL */}
          <div className="relative w-full h-[220px] rounded-[24px] bg-gradient-to-br from-[#1e1e1e] to-[#434343] shadow-2xl shadow-gray-400/20 overflow-hidden text-white p-6 flex flex-col justify-between mb-6 transform transition-all">
             {activeCard.imageUrl && <img src={activeCard.imageUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />}
             <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: NOISE_BG }}></div>
             
             <div className="relative z-10 flex justify-between items-start">
               <div>
                 <h3 className="text-2xl font-bold italic tracking-tight">{activeCard.name}</h3>
                 <p className="text-[10px] uppercase tracking-widest opacity-70 mt-1">{activeCard.cardLogo}</p>
               </div>
               <Wifi className="w-8 h-8 opacity-50 rotate-90" />
             </div>
             
             <div className="relative z-10">
               <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Deuda Actual</p>
               <p className="text-3xl font-mono font-bold tracking-tight">{activeCard.currency}{activeCard.balance.toLocaleString()}</p>
             </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Disponible</p>
              <p className="text-xl font-bold text-green-600">{activeCard.currency}{available.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Cierre en</p>
              <div className="flex items-center gap-2">
                <Calendar size={16} className={daysUntilDue < 5 ? "text-red-500" : "text-indigo-500"} />
                <p className={`text-xl font-bold ${daysUntilDue < 5 ? "text-red-500" : "text-slate-800"}`}>{daysUntilDue} días</p>
              </div>
            </div>
          </div>

          {/* BARRA PROGRESO */}
          <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm mb-6">
            <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
              <span>Línea Usada</span>
              <span className={usagePercent > 80 ? 'text-red-500' : 'text-indigo-600'}>{usagePercent.toFixed(0)}%</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${usagePercent > 80 ? 'bg-red-500' : 'bg-indigo-600'}`} 
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-2">Línea Total: {activeCard.currency}{activeCard.limit.toLocaleString()}</p>
          </div>

          {/* ACTIONS */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button onClick={() => setIsExpenseOpen(true)} className="bg-white py-4 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center"><ArrowUpCircle size={24} /></div>
              <span className="font-bold text-slate-700 text-sm">Nuevo Gasto</span>
            </button>
            <button onClick={() => setIsPaymentOpen(true)} className="bg-white py-4 rounded-[20px] border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center"><ArrowDownCircle size={24} /></div>
              <span className="font-bold text-slate-700 text-sm">Pagar Tarjeta</span>
            </button>
          </div>

          {/* HISTORIAL */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm ml-1">Últimos Movimientos</h3>
            {activeCard.transactions.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-8">No hay movimientos registrados</p>
            ) : (
              <div className="space-y-3">
                {activeCard.transactions.slice().reverse().map(t => (
                  <div key={t.id} className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'expense' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                        {t.type === 'expense' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{t.description}</p>
                        <p className="text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-sm ${t.type === 'expense' ? 'text-red-600' : 'text-green-600'}`}>
                      {t.type === 'expense' ? '-' : '+'}{activeCard.currency}{t.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- MODAL AJUSTES (Delete/Image) --- */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="w-[90%] rounded-[24px] bg-white">
            <DialogHeader><DialogTitle>Opciones</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-4">
              <div className="relative">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <Button variant="outline" className="w-full justify-start gap-2 h-12" onClick={() => imageInputRef.current?.click()}>
                  <Upload size={18} /> Cambiar Fondo
                </Button>
              </div>
              <Button variant="destructive" className="w-full justify-start gap-2 h-12 bg-red-50 text-red-600 hover:bg-red-100 border-0" onClick={() => {
                if(confirm('¿Eliminar tarjeta?')) { deleteCreditCard(activeCard.id); setSelectedCardId(null); }
              }}>
                <Trash2 size={18} /> Eliminar Tarjeta
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* --- MODAL GASTO --- */}
        <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
          <DialogContent className="w-[90%] rounded-[32px] bg-white top-[30%]">
            <DialogHeader><DialogTitle>Registrar Gasto</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Monto</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="text-3xl font-black border-0 border-b bg-transparent h-12 rounded-none px-0" placeholder="0.00" autoFocus /></div>
              <div><Label>Concepto</Label><Input value={description} onChange={e => setDescription(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="Opcional" /></div>
              <Button onClick={() => handleTransaction('expense')} className="w-full h-12 rounded-xl bg-red-500 hover:bg-red-600 text-lg font-bold">Guardar Gasto</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* --- MODAL PAGO --- */}
        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
          <DialogContent className="w-[90%] rounded-[32px] bg-white top-[30%]">
            <DialogHeader><DialogTitle>Pagar Tarjeta</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Monto a Pagar</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="text-3xl font-black border-0 border-b bg-transparent h-12 rounded-none px-0" placeholder="0.00" autoFocus /></div>
              <Button onClick={() => handleTransaction('payment')} className="w-full h-12 rounded-xl bg-green-500 hover:bg-green-600 text-lg font-bold">Confirmar Pago</Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    );
  }

  // =========================================================================
  // VISTA LISTA
  // =========================================================================
  return (
    <div className="pb-32 px-5 pt-6 space-y-6 animate-in fade-in bg-[#FCFCFC] min-h-screen font-sans">
      
      {/* Header Lista (Mantiene la flecha global) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-700 shadow-sm active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mis Tarjetas</h1>
        </div>
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileImport} />
          <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center shadow-sm"><FileSpreadsheet size={20}/></button>
          <button onClick={() => setIsCreateOpen(true)} className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-md"><Plus size={20}/></button>
        </div>
      </div>

      {/* Resumen Deuda */}
      <div className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Deuda Total</h3>
        <div className="flex justify-between items-end">
          <div><p className="text-xs text-gray-400 mb-1">Soles</p><p className="text-2xl font-black text-slate-900">S/ {totalDebtSoles.toLocaleString()}</p></div>
          <div className="text-right"><p className="text-xs text-gray-400 mb-1">Dólares</p><p className="text-2xl font-black text-slate-900">$ {totalDebtDollars.toLocaleString()}</p></div>
        </div>
      </div>

      {/* Lista Cards */}
      <div className="space-y-4">
        {creditCards.length === 0 && <div className="text-center py-10 opacity-50"><CreditCard className="mx-auto w-12 h-12 mb-2"/><p>No tienes tarjetas</p></div>}
        
        {creditCards.map(card => {
          const usage = Math.min(100, (card.balance / card.limit) * 100);
          return (
            <div key={card.id} onClick={() => setSelectedCardId(card.id)} className="relative w-full h-[180px] rounded-[24px] overflow-hidden text-white p-5 flex flex-col justify-between shadow-lg active:scale-95 transition-transform cursor-pointer">
              {/* Fondo Dinámico */}
              <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-900 z-0"></div>
              {card.imageUrl && <img src={card.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-overlay z-0" alt="card-bg" />}
              <div className="absolute inset-0 opacity-10 mix-blend-overlay z-0" style={{ backgroundImage: NOISE_BG }}></div>

              <div className="relative z-10 flex justify-between items-start">
                <span className="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold uppercase">{card.cardLogo}</span>
                <Wifi className="w-6 h-6 opacity-60 rotate-90" />
              </div>

              <div className="relative z-10">
                <h3 className="text-xl font-bold mb-1">{card.name}</h3>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[9px] uppercase opacity-70">Deuda</p>
                    <p className="text-2xl font-mono font-bold">{card.currency}{card.balance.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase opacity-70">Disponible</p>
                    <p className="text-sm font-bold opacity-90">{card.currency}{(card.limit - card.balance).toLocaleString()}</p>
                  </div>
                </div>
                {/* Mini barra de progreso */}
                <div className="w-full bg-white/20 h-1 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full ${usage > 80 ? 'bg-red-400' : 'bg-green-400'}`} style={{ width: `${usage}%` }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL CREAR TARJETA --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[90%] rounded-[32px] bg-white max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <DialogHeader><DialogTitle>Nueva Tarjeta</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1"><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="Ej: Visa Signature" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Línea</Label><Input type="number" value={limit} onChange={e => setLimit(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="10000" /></div>
              <div><Label>Deuda Inicial</Label><Input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="0" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Moneda</Label>
                <Select value={currency} onValueChange={(v:any) => setCurrency(v)}>
                  <SelectTrigger className="bg-gray-50 border-0 rounded-xl h-12"><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="$">Dólares</SelectItem><SelectItem value="S/">Soles</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Marca</Label>
                <Select value={cardLogo} onValueChange={setCardLogo}>
                  <SelectTrigger className="bg-gray-50 border-0 rounded-xl h-12"><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="visa">Visa</SelectItem><SelectItem value="mastercard">Mastercard</SelectItem><SelectItem value="amex">Amex</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Fecha de Corte</Label><Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" /></div>
            <Button onClick={handleAddCard} className="w-full h-12 rounded-xl bg-slate-900 text-lg font-bold">Guardar Tarjeta</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MobileCards;