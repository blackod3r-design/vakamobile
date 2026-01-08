import React, { useState } from 'react';
import { Target, Plus, TrendingUp, Calendar, DollarSign, Upload, Trash2, CheckCircle2, AlertCircle, ArrowUpCircle } from 'lucide-react';
import { ImageEditor } from '@/components/ImageEditor';
import { useExport } from '@/hooks/usePdfExport';
import { ExportButton } from '@/components/ExportButton';
import { useData } from '@/contexts/DataContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Goals = () => {
  const { goals, addGoal, updateGoal, addContribution, deleteGoal } = useData();
  const { exportGoalMovements } = useExport();
  const { editMode } = useEditMode();
  
  // Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [isContributionOpen, setIsContributionOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  
  // Form States
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [currency, setCurrency] = useState<'$' | 'S/'>('$');
  
  // Contribution Form
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- HANDLERS ---

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !targetAmount || !deadline) {
      toast({ title: "Error", description: "Completa todos los campos obligatorios", variant: "destructive" });
      return;
    }

    addGoal({
      name,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount) || 0,
      deadline,
      currency
    });

    toast({ title: "¡Éxito!", description: "Meta creada correctamente" });
    setIsOpen(false);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setCurrency('$');
  };

  const handleAddContribution = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGoalId || !contributionAmount) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }

    const amount = parseFloat(contributionAmount);
    addContribution(selectedGoalId, {
      amount,
      date: contributionDate,
    });

    toast({ title: "¡Aporte registrado!", description: `${amount.toLocaleString()} agregado a la meta` });
    setIsContributionOpen(false);
    setContributionAmount('');
    setContributionDate(new Date().toISOString().split('T')[0]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        if (selectedGoalId) {
          updateGoal(selectedGoalId, { imageUrl });
          toast({ title: "¡Imagen agregada!" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    if (selectedGoalId) {
      updateGoal(selectedGoalId, { imageUrl: undefined });
      setImagePreview(null);
      toast({ title: "Imagen eliminada" });
    }
  };

  // --- RENDER UI ---

  return (
    <div className="p-8 animate-fade-in font-sans" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Metas de Ahorro</h1>
          <p className="text-muted-foreground">Visualiza y alcanza tus objetivos financieros</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-200 gap-2">
              <Plus className="h-4 w-4" />
              Nueva Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Meta de Ahorro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddGoal} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Nombre de la Meta *</Label>
                <Input id="name" placeholder="Vacaciones 2026" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="$">Dólares ($)</SelectItem>
                            <SelectItem value="S/">Soles (S/)</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label htmlFor="target">Monto Objetivo *</Label>
                    <Input id="target" type="number" placeholder="0.00" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
                 </div>
              </div>
              <div>
                <Label htmlFor="current">Monto Inicial (Opcional)</Label>
                <Input id="current" type="number" placeholder="0.00" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="deadline">Fecha Límite *</Label>
                <Input id="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">Crear Meta</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- GRID DE METAS (Estilo Apple Glass) --- */}
      {goals.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-[32px] border border-dashed border-muted-foreground/20">
          <Target className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">No tienes metas definidas</h3>
          <p className="text-muted-foreground mt-2">Crea tu primera meta de ahorro para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <style>
            {`
              @keyframes shimmer {
                100% { transform: translateX(100%); }
              }
              .scrollbar-hide::-webkit-scrollbar { display: none; }
              .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}
          </style>

          {goals.map((goal) => {
            const progressPercentage = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
            const remainingAmount = goal.targetAmount - goal.currentAmount;
            const daysRemaining = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            
            let status = 'En Progreso';
            let theme = {
                badge: 'bg-sky-100/50 text-sky-700 border-sky-200/50',
                shadow: 'shadow-sky-900/5 hover:shadow-sky-900/10',
                glow: 'bg-sky-500/20',
                progress: 'from-sky-400 to-blue-500'
            };

            if (progressPercentage >= 100) {
              status = 'Completado';
              theme = {
                  badge: 'bg-green-100/50 text-green-700 border-green-200/50',
                  shadow: 'shadow-green-900/5 hover:shadow-green-900/10',
                  glow: 'bg-green-500/20',
                  progress: 'from-green-400 to-emerald-500'
              };
            } else if (daysRemaining < 0) {
              status = 'Atrasado';
               theme = {
                  badge: 'bg-red-100/50 text-red-700 border-red-200/50',
                  shadow: 'shadow-red-900/5 hover:shadow-red-900/10',
                  glow: 'bg-red-500/20',
                  progress: 'from-orange-400 to-red-500'
              };
            }

            return (
              <div 
                key={goal.id} 
                onClick={() => setSelectedGoalId(goal.id)}
                className={`group relative w-full overflow-hidden rounded-[32px] border border-white/40 bg-white/70 p-8 shadow-2xl ${theme.shadow} backdrop-blur-3xl ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center`}
              >
                {/* 1. Reflection */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
                
                {/* 2. Glow */}
                <div className={`absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full blur-3xl mix-blend-multiply transition-all duration-700 group-hover:scale-110 ${theme.glow}`}></div>

                {/* 3. Badge (Status) */}
                <span className={`absolute top-6 right-6 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform group-hover:scale-105 flex items-center gap-1.5 ${theme.badge}`}>
                  {progressPercentage >= 100 ? <CheckCircle2 className="w-3 h-3" /> : (daysRemaining < 0 ? <AlertCircle className="w-3 h-3" /> : <Target className="w-3 h-3" />)}
                  {status}
                </span>

                <div className="mt-4"></div>

                {/* 4. Name */}
                <h3 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900 relative z-10">
                  {goal.name}
                </h3>

                {/* 5. Main Amount (Current Saved) */}
                <div className="relative z-10 flex items-baseline justify-center gap-1.5 mb-8">
                  <span className="text-3xl font-light text-gray-400">{goal.currency}</span>
                  <span className="text-[56px] font-light tracking-tight text-gray-900 leading-none drop-shadow-sm tabular-nums">
                    {goal.currentAmount.toLocaleString()}
                  </span>
                </div>

                {/* 6. Progress Bar */}
                <div className="relative z-10 w-full">
                    <div className="mb-2 flex justify-between gap-2 text-xs font-medium text-gray-500">
                      <span>Meta: {goal.currency}{goal.targetAmount.toLocaleString()}</span>
                      <span className={daysRemaining < 0 ? 'text-red-500' : ''}>{daysRemaining > 0 ? `${daysRemaining} días` : 'Finalizado'}</span>
                    </div>
                    
                    <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200/50 p-0.5 backdrop-blur-sm">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${theme.progress} shadow-sm relative overflow-hidden transition-all duration-1000`}
                        style={{ width: `${progressPercentage}%` }}
                      >
                          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full" style={{ animation: 'shimmer 2s infinite' }}></div>
                      </div>
                    </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL DETALLE DE META --- */}
      <Dialog open={!!selectedGoalId} onOpenChange={(open) => !open && setSelectedGoalId(null)}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col bg-zinc-50/95 backdrop-blur-xl">
          {(() => {
            const goal = goals.find(g => g.id === selectedGoalId);
            if (!goal) return null;
            
            const progressPercentage = (goal.currentAmount / goal.targetAmount) * 100;
            const remainingAmount = goal.targetAmount - goal.currentAmount;

            return (
              <div className="flex flex-col h-full w-full">
                
                {/* Header */}
                <DialogHeader className="px-8 py-6 border-b border-gray-200/50 bg-white/50 shrink-0">
                  <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                     <Target className="w-6 h-6 text-sky-600" />
                     {goal.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                  <div className="grid md:grid-cols-2 h-full">
                    
                    {/* IZQUIERDA: Info y Acciones */}
                    <div className="p-8 overflow-y-auto space-y-8 bg-white/40 h-full border-r border-gray-200/50">
                        
                        {/* Visual Card Detail */}
                        <div className="relative w-full h-[220px] rounded-[24px] bg-gradient-to-br from-sky-500 to-blue-700 shadow-2xl overflow-hidden text-white p-8 flex flex-col justify-between shrink-0">
                            {goal.imageUrl && <img src={goal.imageUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                            
                            <div className="relative z-10 flex justify-between items-start">
                                <h3 className="text-2xl font-bold tracking-tight">{goal.name}</h3>
                                <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                                    {progressPercentage >= 100 ? 'Completado' : 'En Progreso'}
                                </div>
                            </div>
                            
                            <div className="relative z-10 space-y-2">
                                <p className="text-xs uppercase opacity-70 font-bold tracking-widest">Ahorro Actual</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-light opacity-80">{goal.currency}</span>
                                    <span className="text-5xl font-mono font-bold tracking-tighter">{goal.currentAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                             <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Meta Total</p>
                                <p className="text-xl font-bold text-gray-800">{goal.currency}{goal.targetAmount.toLocaleString()}</p>
                            </div>
                             <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Falta</p>
                                <p className="text-xl font-bold text-sky-600">{remainingAmount > 0 ? goal.currency + remainingAmount.toLocaleString() : '¡Logrado!'}</p>
                            </div>
                        </div>

                        {/* Action Button */}
                        <Button 
                            size="lg" 
                            className="w-full h-14 text-lg gap-3 bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-100"
                            onClick={() => setIsContributionOpen(true)}
                            disabled={progressPercentage >= 100}
                        >
                            <ArrowUpCircle className="w-6 h-6" />
                            Agregar Aporte
                        </Button>

                        {/* Config */}
                        <div className="pt-4 border-t border-gray-200/50">
                            {!goal.imageUrl ? (
                                <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-sky-400 hover:bg-sky-50 transition-all">
                                    <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                                    <Upload className="w-6 h-6 mx-auto text-gray-400 group-hover:text-sky-600 mb-2" />
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-sky-700">Subir imagen de meta</span>
                                </div>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={removeImage} className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" /> Quitar imagen
                                </Button>
                            )}

                            {editMode && (
                                <Button variant="destructive" className="w-full mt-4" onClick={() => {
                                    if(confirm('¿Eliminar meta?')) { deleteGoal(goal.id); setSelectedGoalId(null); }
                                }}>
                                    Eliminar Meta
                                </Button>
                            )}
                        </div>

                    </div>

                    {/* DERECHA: Historial (Scroll Independiente) */}
                    <div className="flex flex-col h-full bg-white p-8 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">Historial de Aportes</h3>
                            {goal.contributions && goal.contributions.length > 0 && (
                                <ExportButton variant="ghost" size="sm" onExport={(f) => exportGoalMovements(goal.name, goal.currency, goal.contributions.map(c => ({ date: c.date, type: 'deposit' as const, amount: c.amount })), f)} />
                            )}
                        </div>

                        {!goal.contributions || goal.contributions.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <p>Sin aportes registrados</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                                {[...goal.contributions].reverse().map((c) => (
                                    <div key={c.id} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-sky-50/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                                <TrendingUp className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">Aporte</p>
                                                <p className="text-xs text-gray-400">{new Date(c.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className="font-bold text-lg text-green-600">
                                            +{goal.currency}{c.amount.toLocaleString()}
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

      {/* --- MODAL APORTAR --- */}
      <Dialog open={isContributionOpen} onOpenChange={setIsContributionOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Registrar Aporte</DialogTitle></DialogHeader>
            <form onSubmit={handleAddContribution} className="space-y-4 pt-4">
                <div>
                    <Label>Monto del Aporte</Label>
                    <Input type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} autoFocus placeholder="0.00" />
                </div>
                <div>
                    <Label>Fecha</Label>
                    <Input type="date" value={contributionDate} onChange={(e) => setContributionDate(e.target.value)} />
                </div>
                <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700">Guardar Aporte</Button>
            </form>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Goals;