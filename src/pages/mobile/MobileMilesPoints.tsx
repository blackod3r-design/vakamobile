import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plane, ShoppingBag, Gift, Plus, TrendingUp, TrendingDown, Trash2, 
  Upload, ArrowRightLeft, ArrowLeft, MoreVertical, Settings
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';

// --- UI COMPONENTS ---
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- CONSTANTES & UTILS ---
const NOISE_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`;

// ✅ ID Seguro para Móvil
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const iconOptions = [
  { value: 'plane', label: 'Viajes', Icon: Plane, color: 'blue' },
  { value: 'shopping', label: 'Compras', Icon: ShoppingBag, color: 'purple' },
  { value: 'gift', label: 'Canje', Icon: Gift, color: 'pink' },
];

const getProgramConfig = (iconValue: string) => {
  const option = iconOptions.find(opt => opt.value === iconValue);
  return option || iconOptions[0];
};

const MobileMilesPoints = () => {
  const navigate = useNavigate();
  const { milesPoints, updateMilesPoints } = useData();

  // --- NAVEGACIÓN ---
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  // --- MODALES ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- FORMULARIOS ---
  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [icon, setIcon] = useState<'plane' | 'shopping' | 'gift'>('plane');

  // Transacción
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'add' | 'subtract'>('add');

  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLER: CREAR PROGRAMA ---
  const handleAddProgram = () => {
    if (!name || !points) return toast.error('Completa los campos');

    const newProgram = {
      id: generateId(), // ID Seguro
      name,
      points: parseInt(points),
      icon,
      transactions: []
    };

    updateMilesPoints({
      programs: [...milesPoints.programs, newProgram]
    });

    toast.success('Programa creado');
    setIsCreateOpen(false);
    setName(''); setPoints(''); setIcon('plane');
  };

  // --- HANDLER: TRANSACCIÓN ---
  const handleAddTransaction = () => {
    if (!transactionAmount || !transactionDescription) return toast.error('Datos incompletos');
    
    const amount = parseInt(transactionAmount);
    
    // Construimos la transacción localmente
    const newTransaction = {
      id: generateId(), // ID Seguro
      amount,
      type: transactionType,
      description: transactionDescription,
      date: new Date().toISOString()
    };

    // Actualizamos el estado global manipulando el array nosotros mismos
    const updatedPrograms = milesPoints.programs.map(p => {
      if (p.id === selectedProgramId) {
        const newPoints = transactionType === 'add' 
          ? p.points + amount 
          : Math.max(0, p.points - amount);
        
        return {
          ...p,
          points: newPoints,
          transactions: [...p.transactions, newTransaction]
        };
      }
      return p;
    });

    updateMilesPoints({ programs: updatedPrograms });

    toast.success(transactionType === 'add' ? 'Puntos agregados' : 'Canje realizado');
    setIsTransactionOpen(false);
    setTransactionAmount(''); setTransactionDescription('');
  };

  // --- HANDLER: IMAGEN ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedProgramId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedPrograms = milesPoints.programs.map(p => 
          p.id === selectedProgramId ? { ...p, imageUrl: reader.result as string } : p
        );
        updateMilesPoints({ programs: updatedPrograms });
        toast.success('Imagen actualizada');
        setIsSettingsOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- HANDLER: ELIMINAR ---
  const handleDelete = () => {
    if (confirm('¿Eliminar este programa?')) {
      const updatedPrograms = milesPoints.programs.filter(p => p.id !== selectedProgramId);
      updateMilesPoints({ programs: updatedPrograms });
      setSelectedProgramId(null);
      toast.success('Programa eliminado');
    }
  };

  // =========================================================================
  // VISTA DETALLE
  // =========================================================================
  const activeProgram = milesPoints.programs.find(p => p.id === selectedProgramId);

  if (selectedProgramId && activeProgram) {
    const config = getProgramConfig(activeProgram.icon);
    
    // Colores dinámicos según el tipo
    const gradients = {
      blue: 'from-blue-600 to-indigo-800',
      purple: 'from-purple-600 to-fuchsia-800',
      pink: 'from-pink-500 to-rose-700'
    };
    // @ts-ignore
    const bgGradient = gradients[config.color] || gradients.blue;

    return (
      <div className="min-h-screen bg-[#FCFCFC] flex flex-col font-sans animate-in slide-in-from-right-10 duration-300">
        
        {/* Navbar Detalle (Limpio) */}
        <div className="flex items-center justify-end px-5 pt-8 pb-4">
          <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-white rounded-full shadow-sm border border-gray-100 active:scale-90 transition-transform">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Contenedor Scroll Invisible */}
        <div className="px-5 flex-1 overflow-y-auto pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          
          {/* HERO CARD */}
          <div className={`relative w-full h-[260px] rounded-[32px] bg-gradient-to-br ${bgGradient} shadow-2xl shadow-indigo-900/20 overflow-hidden text-white p-8 flex flex-col justify-between mb-6`}>
             {activeProgram.imageUrl && <img src={activeProgram.imageUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />}
             <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: NOISE_BG }}></div>
             
             <div className="relative z-10 flex justify-between items-start">
               <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-2">
                 <config.Icon size={14} />
                 <span className="text-[10px] font-bold uppercase tracking-wider">{config.label}</span>
               </div>
             </div>
             
             <div className="relative z-10">
               <h3 className="text-2xl font-bold mb-1 opacity-90">{activeProgram.name}</h3>
               <p className="text-5xl font-black tracking-tighter">{activeProgram.points.toLocaleString()}</p>
               <p className="text-xs font-medium opacity-60 mt-2 uppercase tracking-widest">Puntos Acumulados</p>
             </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <button onClick={() => { setTransactionType('add'); setIsTransactionOpen(true); }} className="bg-white py-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><Plus size={24} /></div>
              <span className="font-bold text-slate-700 text-sm">Acumular</span>
            </button>
            <button onClick={() => { setTransactionType('subtract'); setIsTransactionOpen(true); }} className="bg-white py-4 rounded-[24px] border border-gray-100 shadow-sm flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><ArrowRightLeft size={24} /></div>
              <span className="font-bold text-slate-700 text-sm">Canjear</span>
            </button>
          </div>

          {/* HISTORIAL */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm ml-1">Últimos Movimientos</h3>
            {activeProgram.transactions.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-8">Sin movimientos recientes</p>
            ) : (
              <div className="space-y-3">
                {[...activeProgram.transactions].reverse().map((t) => (
                  <div key={t.id} className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'add' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                        {t.type === 'add' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">{t.description}</p>
                        <p className="text-[10px] text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className={`font-bold ${t.type === 'add' ? 'text-green-600' : 'text-orange-600'}`}>
                      {t.type === 'add' ? '+' : '-'}{t.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- MODAL SETTINGS (Fondo / Eliminar) --- */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="w-[90%] rounded-[24px] bg-white">
            <DialogHeader><DialogTitle>Configuración</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-4">
              <div className="relative">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <Button variant="outline" className="w-full justify-start gap-2 h-12" onClick={() => imageInputRef.current?.click()}>
                  <Upload size={18} /> Cambiar Fondo
                </Button>
              </div>
              <Button variant="destructive" className="w-full justify-start gap-2 h-12 bg-red-50 text-red-600 hover:bg-red-100 border-0" onClick={handleDelete}>
                <Trash2 size={18} /> Eliminar Programa
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* --- MODAL TRANSACCION --- */}
        <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
          <DialogContent className="w-[90%] rounded-[32px] bg-white top-[30%]">
            <DialogHeader><DialogTitle>{transactionType === 'add' ? 'Acumular' : 'Canjear'} Puntos</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Cantidad</Label><Input type="number" value={transactionAmount} onChange={e => setTransactionAmount(e.target.value)} className="text-3xl font-black border-0 border-b bg-transparent h-12 rounded-none px-0" placeholder="0" autoFocus /></div>
              <div><Label>Detalle</Label><Input value={transactionDescription} onChange={e => setTransactionDescription(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder={transactionType === 'add' ? 'Vuelo a Miami' : 'Canje de producto'} /></div>
              <Button onClick={handleAddTransaction} className={`w-full h-12 rounded-xl text-lg font-bold text-white ${transactionType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-500 hover:bg-orange-600'}`}>Confirmar</Button>
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
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-700 shadow-sm active:scale-90 transition-transform"><ArrowLeft size={20}/></button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Millas y Puntos</h1>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Plus size={20}/></button>
      </div>

      {/* Lista Programas */}
      <div className="space-y-4">
        {milesPoints.programs.length === 0 && <div className="text-center py-10 opacity-50"><Plane className="mx-auto w-12 h-12 mb-2"/><p>No tienes programas</p></div>}
        
        {milesPoints.programs.map(program => {
          const config = getProgramConfig(program.icon);
          return (
            <div key={program.id} onClick={() => setSelectedProgramId(program.id)} className="relative w-full h-[140px] rounded-[24px] overflow-hidden bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform cursor-pointer p-5 flex flex-col justify-between">
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    config.color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                    config.color === 'purple' ? 'bg-purple-50 text-purple-600' : 'bg-pink-50 text-pink-600'
                  }`}>
                    <config.Icon size={20} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">{program.name}</h3>
                </div>
              </div>

              <div className="flex items-end justify-between">
                <p className="text-xs text-gray-400 font-medium">{program.transactions.length} movimientos</p>
                <p className="text-3xl font-black text-slate-900">{program.points.toLocaleString()}</p>
              </div>

            </div>
          );
        })}
      </div>

      {/* --- MODAL CREAR --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[90%] rounded-[32px] bg-white max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <DialogHeader><DialogTitle>Nuevo Programa</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="Ej: LATAM Pass" /></div>
            <div>
              <Label>Tipo</Label>
              <Select value={icon} onValueChange={(v:any) => setIcon(v)}>
                <SelectTrigger className="bg-gray-50 border-0 rounded-xl h-12"><SelectValue/></SelectTrigger>
                <SelectContent>
                  {iconOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2"><opt.Icon size={14}/> {opt.label}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Puntos Iniciales</Label><Input type="number" value={points} onChange={e => setPoints(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="0" /></div>
            <Button onClick={handleAddProgram} className="w-full h-12 rounded-xl bg-indigo-600 text-lg font-bold text-white">Crear</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MobileMilesPoints;