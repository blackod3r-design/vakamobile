import React, { useState } from 'react';
import { CheckSquare, Plus, Upload, Trash2, Check, X, Calendar, DollarSign, ListTodo } from 'lucide-react';
import { ImageEditor } from '@/components/ImageEditor';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const Tasks = () => {
  const { tasks, addTask, updateTask, deleteTask } = useData();
  const [isOpen, setIsOpen] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'$' | 'S/'>('$');
  
  // Detail States
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- HANDLERS ---

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !amount) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }

    addTask({
      name,
      amount: parseFloat(amount),
      currency
    });

    toast({ title: "¡Tarea creada!", description: "Nueva tarea agregada exitosamente" });
    setIsOpen(false);
    setName('');
    setAmount('');
    setCurrency('$');
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskName.trim()) {
      toast({ title: "Error", description: "Ingresa un nombre para la subtarea", variant: "destructive" });
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newSubtask = {
      id: crypto.randomUUID(),
      name: newSubtaskName,
      completed: false
    };

    updateTask(taskId, {
      subtasks: [...task.subtasks, newSubtask]
    });

    setNewSubtaskName('');
    toast({ title: "Subtarea agregada" });
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    updateTask(taskId, {
      subtasks: task.subtasks.filter(st => st.id !== subtaskId)
    });

    toast({ title: "Subtarea eliminada" });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        if (selectedTaskId) {
          updateTask(selectedTaskId, { imageUrl });
          toast({ title: "¡Imagen agregada!" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    if (selectedTaskId) {
      updateTask(selectedTaskId, { imageUrl: undefined });
      setImagePreview(null);
      toast({ title: "Imagen eliminada" });
    }
  };

  const calculateProgress = (task: any) => {
    if (task.subtasks.length === 0) return 0;
    const completed = task.subtasks.filter((st: any) => st.completed).length;
    return (completed / task.subtasks.length) * 100;
  };

  // --- RENDER UI ---

  return (
    <div className="p-8 animate-fade-in font-sans" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tareas y Proyectos</h1>
          <p className="text-muted-foreground">Gestiona tus actividades y presupuestos</p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 gap-2">
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Tarea</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4 pt-4">
              <div>
                <Label htmlFor="name">Nombre de la Tarea *</Label>
                <Input
                  id="name"
                  placeholder="Ej: Comprar laptop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="currency">Moneda</Label>
                    <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="$">Dólares ($)</SelectItem>
                            <SelectItem value="S/">Soles (S/)</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
                 <div>
                    <Label htmlFor="amount">Presupuesto *</Label>
                    <Input
                        id="amount"
                        type="number"
                        placeholder="1500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                 </div>
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Crear Tarea</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- GRID DE TAREAS (Estilo Apple Glass) --- */}
      {tasks.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-[32px] border border-dashed border-muted-foreground/20">
          <CheckSquare className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">No tienes tareas</h3>
          <p className="text-muted-foreground mt-2">Crea tu primera tarea para comenzar.</p>
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

          {tasks.map((task) => {
            const progress = calculateProgress(task);
            const isCompleted = progress >= 100 && task.subtasks.length > 0;
            
            // Theme setup
            const theme = isCompleted ? {
                badge: 'bg-green-100/50 text-green-700 border-green-200/50',
                shadow: 'shadow-green-900/5 hover:shadow-green-900/10',
                glow: 'bg-green-500/20',
                progress: 'from-green-400 to-emerald-500'
            } : {
                badge: 'bg-indigo-100/50 text-indigo-700 border-indigo-200/50',
                shadow: 'shadow-indigo-900/5 hover:shadow-indigo-900/10',
                glow: 'bg-indigo-500/20',
                progress: 'from-indigo-400 to-blue-500'
            };

            return (
              <div 
                key={task.id} 
                onClick={() => setSelectedTaskId(task.id)}
                className={`group relative w-full overflow-hidden rounded-[32px] border border-white/40 bg-white/70 p-8 shadow-2xl ${theme.shadow} backdrop-blur-3xl ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center`}
              >
                {/* 1. Reflection */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
                
                {/* 2. Glow */}
                <div className={`absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full blur-3xl mix-blend-multiply transition-all duration-700 group-hover:scale-110 ${theme.glow}`}></div>

                {/* 3. Badge (Status) */}
                <span className={`absolute top-6 right-6 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform group-hover:scale-105 flex items-center gap-1.5 ${theme.badge}`}>
                  {isCompleted ? <Check className="w-3 h-3" /> : <ListTodo className="w-3 h-3" />}
                  {isCompleted ? 'Completado' : 'Pendiente'}
                </span>

                <div className="mt-4"></div>

                {/* 4. Name */}
                <h3 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900 relative z-10">
                  {task.name}
                </h3>

                {/* 5. Main Amount (Budget) */}
                <div className="relative z-10 flex items-baseline justify-center gap-1.5 mb-8">
                  <span className="text-3xl font-light text-gray-400">{task.currency}</span>
                  <span className="text-[56px] font-light tracking-tight text-gray-900 leading-none drop-shadow-sm tabular-nums">
                    {task.amount.toLocaleString()}
                  </span>
                </div>

                {/* 6. Progress Bar */}
                <div className="relative z-10 w-full">
                    <div className="mb-2 flex justify-between gap-2 text-xs font-medium text-gray-500">
                      <span>Progreso: <span className="font-bold text-indigo-600">{progress.toFixed(0)}%</span></span>
                      <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} tareas</span>
                    </div>
                    
                    <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200/50 p-0.5 backdrop-blur-sm">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${theme.progress} shadow-sm relative overflow-hidden transition-all duration-1000`}
                        style={{ width: `${progress}%` }}
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

      {/* --- MODAL DETALLE DE TAREA --- */}
      <Dialog open={!!selectedTaskId} onOpenChange={(open) => !open && setSelectedTaskId(null)}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col bg-zinc-50/95 backdrop-blur-xl">
          {(() => {
            const task = tasks.find(t => t.id === selectedTaskId);
            if (!task) return null;
            const progress = calculateProgress(task);

            return (
              <div className="flex flex-col h-full w-full">
                
                {/* Header */}
                <DialogHeader className="px-8 py-6 border-b border-gray-200/50 bg-white/50 shrink-0">
                  <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                     <CheckSquare className="w-6 h-6 text-indigo-600" />
                     {task.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                  <div className="grid md:grid-cols-2 h-full">
                    
                    {/* IZQUIERDA: Info y Acciones */}
                    <div className="p-8 overflow-y-auto space-y-8 bg-white/40 h-full border-r border-gray-200/50">
                        
                        {/* Visual Card Detail */}
                        <div className="relative w-full h-[220px] rounded-[24px] bg-gradient-to-br from-indigo-500 to-violet-700 shadow-2xl overflow-hidden text-white p-8 flex flex-col justify-between shrink-0">
                            {task.imageUrl && <img src={task.imageUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                            
                            <div className="relative z-10 flex justify-between items-start">
                                <h3 className="text-2xl font-bold tracking-tight max-w-[80%]">{task.name}</h3>
                                <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
                                    {progress.toFixed(0)}%
                                </div>
                            </div>
                            
                            <div className="relative z-10 space-y-2">
                                <p className="text-xs uppercase opacity-70 font-bold tracking-widest">Presupuesto Total</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-light opacity-80">{task.currency}</span>
                                    <span className="text-5xl font-mono font-bold tracking-tighter">{task.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Config */}
                        <div className="pt-4 border-t border-gray-200/50">
                            {!task.imageUrl ? (
                                <div className="relative group cursor-pointer border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                                    <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                                    <Upload className="w-6 h-6 mx-auto text-gray-400 group-hover:text-indigo-600 mb-2" />
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-indigo-700">Subir imagen de referencia</span>
                                </div>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={removeImage} className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" /> Quitar imagen
                                </Button>
                            )}
                            
                            <Button 
                                variant="destructive" 
                                className="w-full mt-4 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 shadow-sm"
                                onClick={() => {
                                    if(confirm('¿Eliminar tarea?')) { deleteTask(task.id); setSelectedTaskId(null); }
                                }}
                            >
                                Eliminar Tarea
                            </Button>
                        </div>
                    </div>

                    {/* DERECHA: Checklist (Scroll Independiente) */}
                    <div className="flex flex-col h-full bg-white p-8 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-lg font-bold text-gray-900">Lista de Actividades</h3>
                            <span className="text-xs text-muted-foreground bg-gray-100 px-2 py-1 rounded-md font-medium">
                                {task.subtasks.filter(st => st.completed).length} / {task.subtasks.length}
                            </span>
                        </div>
                        
                        {/* Input Nueva Subtarea */}
                        <div className="flex gap-2 mb-6 shrink-0">
                            <Input 
                                placeholder="Nueva actividad..." 
                                value={newSubtaskName} 
                                onChange={(e) => setNewSubtaskName(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask(task.id)}
                                className="bg-gray-50 border-gray-200"
                            />
                            <Button onClick={() => handleAddSubtask(task.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>

                        {task.subtasks.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <p>No hay actividades</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                                {task.subtasks.map((subtask) => (
                                    <div key={subtask.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group">
                                        <Checkbox 
                                            checked={subtask.completed} 
                                            onCheckedChange={() => handleToggleSubtask(task.id, subtask.id)}
                                            className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                                        />
                                        <span className={`flex-1 text-sm font-medium ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                            {subtask.name}
                                        </span>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="opacity-0 group-hover:opacity-100 h-8 w-8 text-gray-400 hover:text-red-500"
                                            onClick={() => handleDeleteSubtask(task.id, subtask.id)}
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </Button>
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
    </div>
  );
};

export default Tasks;