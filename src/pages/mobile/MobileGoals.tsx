import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Target, Plus, TrendingUp, Calendar, Upload, Trash2, 
  ArrowUpCircle, ArrowLeft, MoreVertical, CheckCircle2, AlertCircle
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

// ✅ FUNCIÓN SEGURA LOCAL (La misma de Tarjetas)
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const MobileGoals = () => {
  const navigate = useNavigate();
  // Nota: No necesitamos 'addContribution' porque haremos la lógica manual con 'updateGoal'
  const { goals, addGoal, updateGoal, deleteGoal } = useData();

  // --- ESTADO DE NAVEGACIÓN ---
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // --- ESTADOS MODALES ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- ESTADOS FORMULARIOS ---
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [currency, setCurrency] = useState<'$' | 'S/'>('$');

  // Aporte
  const [contributionAmount, setContributionAmount] = useState('');
  
  // Refs
  const imageInputRef = useRef<HTMLInputElement>(null);

  // --- HANDLER: CREAR META ---
  const handleAddGoal = () => {
    if (!name || !targetAmount || !deadline) return toast.error('Completa los campos obligatorios');

    // Intentamos pasar un ID local por si el Contexto lo acepta
    addGoal({
      id: generateId(), // Intento de ID seguro
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline,
      currency,
      contributions: []
    });

    toast.success('Meta creada');
    setIsCreateOpen(false);
    // Reset
    setName(''); setTargetAmount(''); setCurrentAmount(''); setDeadline(''); setCurrency('$');
  };

  // --- HANDLER: APORTE (🛠️ SOLUCIÓN "TIPO TARJETAS") ---
  const handleAddContribution = () => {
    if (!selectedGoalId || !contributionAmount) return toast.error('Ingresa un monto');
    
    // 1. Buscamos la meta actual
    const currentGoal = goals.find(g => g.id === selectedGoalId);
    if (!currentGoal) return;

    const montoAporte = parseFloat(contributionAmount);

    // 2. Creamos el objeto aporte con ID SEGURO LOCAL
    const newContribution = {
      id: generateId(), // <--- Aquí evitamos el error de crypto
      amount: montoAporte,
      date: new Date().toISOString()
    };

    // 3. Calculamos los nuevos valores nosotros mismos
    const updatedContributions = [...(currentGoal.contributions || []), newContribution];
    const newCurrentAmount = currentGoal.currentAmount + montoAporte;

    // 4. Usamos updateGoal (que solo guarda datos) en lugar de addContribution (que intenta generar IDs)
    updateGoal(selectedGoalId, {
      currentAmount: newCurrentAmount,
      contributions: updatedContributions
    });

    toast.success('Aporte registrado');
    setIsContributionOpen(false);
    setContributionAmount('');
  };

  // --- HANDLER: IMAGEN ---
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedGoalId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateGoal(selectedGoalId, { imageUrl: reader.result as string });
        toast.success('Imagen actualizada');
        setIsSettingsOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // =========================================================================
  // VISTA DETALLE
  // =========================================================================
  const activeGoal = goals.find(g => g.id === selectedGoalId);

  if (selectedGoalId && activeGoal) {
    const progress = Math.min(100, (activeGoal.currentAmount / activeGoal.targetAmount) * 100);
    const remaining = activeGoal.targetAmount - activeGoal.currentAmount;
    const daysLeft = Math.ceil((new Date(activeGoal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <div className="min-h-screen bg-[#FCFCFC] flex flex-col font-sans animate-in slide-in-from-right-10 duration-300">
        
        {/* Navbar Detalle (Limpio: Sin texto ni flecha izquierda) */}
        <div className="flex items-center justify-end px-5 pt-8 pb-4">
          <button onClick={() => setIsSettingsOpen(true)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 bg-white rounded-full shadow-sm border border-gray-100 active:scale-90 transition-transform">
            <MoreVertical size={20} />
          </button>
        </div>

        {/* Contenedor con Scroll Invisible */}
        <div className="px-5 flex-1 overflow-y-auto pb-32 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          
          {/* HERO CARD VISUAL */}
          <div className="relative w-full h-[280px] rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-900/20 overflow-hidden text-white p-8 flex flex-col justify-between mb-6">
             {activeGoal.imageUrl && <img src={activeGoal.imageUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" />}
             <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: NOISE_BG }}></div>
             
             <div className="relative z-10 flex justify-between items-start">
               <div>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md`}>
                   {progress >= 100 ? 'Completado' : (daysLeft < 0 ? 'Vencido' : 'En Progreso')}
                 </span>
               </div>
               <Target className="w-8 h-8 opacity-50" />
             </div>
             
             <div className="relative z-10 text-center">
               <h3 className="text-2xl font-bold mb-2">{activeGoal.name}</h3>
               <p className="text-5xl font-black tracking-tighter">{activeGoal.currency}{activeGoal.currentAmount.toLocaleString()}</p>
               <p className="text-xs font-medium opacity-70 mt-2 uppercase tracking-widest">Ahorrado hasta hoy</p>
             </div>

             <div className="relative z-10">
               <div className="flex justify-between text-xs font-bold opacity-80 mb-2">
                 <span>Progreso</span>
                 <span>{progress.toFixed(0)}%</span>
               </div>
               <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                 <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
               </div>
             </div>
          </div>

          {/* INFO GRID */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Meta</p>
              <p className="text-xl font-black text-slate-900">{activeGoal.currency}{activeGoal.targetAmount.toLocaleString()}</p>
            </div>
            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Falta</p>
              <p className="text-xl font-black text-blue-600">{remaining > 0 ? activeGoal.currency + remaining.toLocaleString() : '¡Listo!'}</p>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <Button onClick={() => setIsContributionOpen(true)} className="w-full h-14 rounded-[20px] bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold shadow-lg shadow-blue-200 mb-8 gap-2">
            <ArrowUpCircle size={24} /> Agregar Aporte
          </Button>

          {/* HISTORIAL */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm ml-1">Historial de Aportes</h3>
            {!activeGoal.contributions || activeGoal.contributions.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-8">Aún no has realizado aportes</p>
            ) : (
              <div className="space-y-3">
                {[...activeGoal.contributions].reverse().map((c, i) => (
                  <div key={i} className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                        <TrendingUp size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">Aporte</p>
                        <p className="text-[10px] text-gray-400">{new Date(c.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="font-bold text-green-600">+{activeGoal.currency}{c.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* --- MODAL SETTINGS --- */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="w-[90%] rounded-[24px] bg-white">
            <DialogHeader><DialogTitle>Opciones</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-4">
              <div className="relative">
                <input type="file" accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                <Button variant="outline" className="w-full justify-start gap-2 h-12" onClick={() => imageInputRef.current?.click()}>
                  <Upload size={18} /> Cambiar Imagen
                </Button>
              </div>
              <Button variant="destructive" className="w-full justify-start gap-2 h-12 bg-red-50 text-red-600 hover:bg-red-100 border-0" onClick={() => {
                if(confirm('¿Eliminar meta?')) { deleteGoal(activeGoal.id); setSelectedGoalId(null); }
              }}>
                <Trash2 size={18} /> Eliminar Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* --- MODAL APORTE --- */}
        <Dialog open={isContributionOpen} onOpenChange={setIsContributionOpen}>
          <DialogContent className="w-[90%] rounded-[32px] bg-white top-[30%]">
            <DialogHeader><DialogTitle>Registrar Aporte</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Monto</Label><Input type="number" value={contributionAmount} onChange={e => setContributionAmount(e.target.value)} className="text-3xl font-black border-0 border-b bg-transparent h-12 rounded-none px-0" placeholder="0.00" autoFocus /></div>
              <Button onClick={handleAddContribution} className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-lg font-bold text-white">Guardar</Button>
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mis Metas</h1>
        </div>
        <button onClick={() => setIsCreateOpen(true)} className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"><Plus size={20}/></button>
      </div>

      {/* Lista Metas */}
      <div className="space-y-4">
        {goals.length === 0 && <div className="text-center py-10 opacity-50"><Target className="mx-auto w-12 h-12 mb-2"/><p>No tienes metas</p></div>}
        
        {goals.map(goal => {
          const progress = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <div key={goal.id} onClick={() => setSelectedGoalId(goal.id)} className="relative w-full h-[160px] rounded-[24px] overflow-hidden bg-white border border-gray-100 shadow-sm active:scale-95 transition-transform cursor-pointer p-5 flex flex-col justify-between">
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Target size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{goal.name}</h3>
                    <p className="text-xs text-gray-400 font-medium">{daysLeft > 0 ? `${daysLeft} días restantes` : 'Finalizado'}</p>
                  </div>
                </div>
                <span className="text-lg font-black text-slate-900">{goal.currency}{goal.currentAmount.toLocaleString()}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                  <span>Progreso</span>
                  <span className="text-blue-600">{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-right text-[10px] text-gray-400 font-medium">Meta: {goal.currency}{goal.targetAmount.toLocaleString()}</p>
              </div>

            </div>
          );
        })}
      </div>

      {/* --- MODAL CREAR META --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="w-[90%] rounded-[32px] bg-white max-h-[85vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <DialogHeader><DialogTitle>Nueva Meta</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1"><Label>Nombre</Label><Input value={name} onChange={e => setName(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="Ej: Viaje a Europa" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Meta</Label><Input type="number" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="5000" /></div>
              <div>
                <Label>Moneda</Label>
                <Select value={currency} onValueChange={(v:any) => setCurrency(v)}>
                  <SelectTrigger className="bg-gray-50 border-0 rounded-xl h-12"><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="$">Dólares</SelectItem><SelectItem value="S/">Soles</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Ahorro Inicial</Label><Input type="number" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" placeholder="0" /></div>
            <div><Label>Fecha Límite</Label><Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="bg-gray-50 border-0 rounded-xl h-12" /></div>
            <Button onClick={handleAddGoal} className="w-full h-12 rounded-xl bg-slate-900 text-lg font-bold text-white">Crear Meta</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MobileGoals;