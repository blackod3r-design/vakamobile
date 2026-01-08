import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckSquare, Plus, Upload, Trash2, Check, ArrowLeft, 
  ListTodo, Calendar, MoreVertical, ChevronLeft
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTheme } from '@/contexts/ThemeContext';

// --- GENERADOR DE ID SEGURO ---
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const MobileTasks = () => {
  const navigate = useNavigate();
  const { tasks = [], addTask, updateTask, deleteTask } = useData();
  const { theme } = useTheme();
  
  const isDark = theme === 'dark' || theme === 'solid' || theme === 'dark-glass';
  
  // --- ESTADOS ---
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  // Form Create
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'$' | 'S/'>('$');
  
  // Form Subtask
  const [newSubtaskName, setNewSubtaskName] = useState('');

  // --- HANDLERS ---

  const handleCreateTask = () => {
    if (!name || !amount) {
      toast.error("Completa todos los campos");
      return;
    }

    addTask({
      name,
      amount: parseFloat(amount),
      currency
    });

    toast.success("Proyecto creado");
    setIsCreateOpen(false);
    setName('');
    setAmount('');
    setCurrency('$');
  };

  const handleAddSubtask = (taskId: string) => {
    if (!newSubtaskName.trim()) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];

    updateTask(taskId, {
      subtasks: [...currentSubtasks, {
        id: generateId(),
        name: newSubtaskName,
        completed: false
      }]
    });

    setNewSubtaskName('');
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const updatedSubtasks = currentSubtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    updateTask(taskId, { subtasks: updatedSubtasks });
  };

  const handleDeleteSubtask = (taskId: string, subtaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const currentSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    updateTask(taskId, {
      subtasks: currentSubtasks.filter(st => st.id !== subtaskId)
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedTaskId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateTask(selectedTaskId, { imageUrl: reader.result as string });
        toast.success("Imagen actualizada");
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateProgress = (task: any) => {
    const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
    if (subs.length === 0) return 0;
    const completed = subs.filter((st: any) => st.completed).length;
    return (completed / subs.length) * 100;
  };

  // =================================================================================
  // VISTA 2: DETALLE (FULL SCREEN) - IGUAL QUE WALLETS
  // =================================================================================
  if (selectedTaskId) {
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) { setSelectedTaskId(null); return null; }
    
    const progress = calculateProgress(task);
    const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
    const completedCount = subs.filter((s:any) => s.completed).length;

    return (
      <div className={`min-h-screen w-full animate-fade-in flex flex-col ${isDark ? 'bg-[#000000] text-white' : 'bg-[#F2F2F7] text-gray-900'}`}>
        
        {/* HEADER DETALLE */}
        <div className={`px-4 py-4 flex items-center justify-between shrink-0 ${isDark ? 'bg-[#121212]' : 'bg-white shadow-sm'}`}>
          <Button variant="ghost" size="icon" onClick={() => setSelectedTaskId(null)} className="-ml-2">
             <ChevronLeft className="w-6 h-6" />
          </Button>
          <span className="font-semibold text-lg truncate max-w-[200px]">{task.name}</span>
          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
             if(confirm('¿Eliminar proyecto?')) { deleteTask(task.id); setSelectedTaskId(null); }
          }}>
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* CONTENIDO DETALLE */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* HERO CARD (IMAGEN O GRADIENTE) */}
            <div className="relative w-full h-[220px] rounded-[24px] bg-gradient-to-br from-indigo-600 to-purple-700 shadow-xl overflow-hidden text-white p-6 flex flex-col justify-end">
                {task.imageUrl && <img src={task.imageUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                
                <div className="relative z-10">
                   <div className="flex justify-between items-end mb-2">
                       <div>
                           <p className="text-xs uppercase opacity-70 font-bold tracking-widest mb-1">Presupuesto</p>
                           <p className="text-4xl font-mono font-bold tracking-tighter">
                               {task.currency}{(Number(task.amount) || 0).toLocaleString()}
                           </p>
                       </div>
                       <div className="text-right">
                           <span className="text-3xl font-bold">{progress.toFixed(0)}%</span>
                       </div>
                   </div>
                   {/* Barra de progreso visual en la tarjeta */}
                   <div className="h-2 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                       <div className="h-full bg-white/90 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                   </div>
                </div>
            </div>

            {/* BOTÓN SUBIR FOTO (Si no hay foto) */}
            {!task.imageUrl && (
                <div className="relative">
                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                    <Button variant="outline" className={`w-full h-12 border-dashed ${isDark ? 'bg-zinc-900 border-zinc-700 hover:bg-zinc-800' : 'bg-white hover:bg-gray-50'}`}>
                        <Upload className="w-4 h-4 mr-2" /> Agregar Portada
                    </Button>
                </div>
            )}

            {/* LISTA DE ACTIVIDADES */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Actividades</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-200 text-gray-600'}`}>
                        {completedCount} / {subs.length}
                    </span>
                </div>

                <div className={`flex gap-2 mb-4 p-2 rounded-xl ${isDark ? 'bg-[#1c1c1e]' : 'bg-white shadow-sm'}`}>
                    <Input 
                        placeholder="Nueva actividad..." 
                        value={newSubtaskName}
                        onChange={(e) => setNewSubtaskName(e.target.value)}
                        className="border-0 bg-transparent focus-visible:ring-0"
                    />
                    <Button size="icon" onClick={() => handleAddSubtask(task.id)} className="bg-indigo-600 rounded-lg">
                        <Plus className="h-5 w-5" />
                    </Button>
                </div>

                <div className="space-y-3 pb-20">
                    {subs.map((subtask: any) => (
                        <div key={subtask.id} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <Checkbox 
                                checked={subtask.completed} 
                                onCheckedChange={() => handleToggleSubtask(task.id, subtask.id)}
                                className="w-6 h-6 rounded-md data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                            />
                            <span className={`flex-1 font-medium ${subtask.completed ? 'line-through text-gray-500' : (isDark ? 'text-white' : 'text-gray-800')}`}>
                                {subtask.name}
                            </span>
                            <button onClick={() => handleDeleteSubtask(task.id, subtask.id)} className="text-gray-400 p-2">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                    {subs.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-4">No hay actividades aún.</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    );
  }

  // =================================================================================
  // VISTA 1: LISTADO (DASHBOARD)
  // =================================================================================
  return (
    <div className={`min-h-screen w-full font-sans pb-24 ${isDark ? 'bg-black text-white' : 'bg-[#FCFCFC] text-gray-900'}`}>
      
      {/* HEADER MAIN */}
      <div className="pt-12 pb-2 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="-ml-2 rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gestión de tareas</p>
          </div>
        </div>
        <Button 
          size="icon" 
          className="rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* LISTA DE PROYECTOS */}
      <div className="px-6 pb-20 mt-6">
         {tasks.length === 0 ? (
           <div className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-3xl ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
              <CheckSquare className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-400 text-center text-sm">No hay proyectos activos</p>
           </div>
         ) : (
           <div className="space-y-4">
             {tasks.map((task) => {
                const progress = calculateProgress(task);
                const isCompleted = progress >= 100 && (task.subtasks || []).length > 0;
                
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`relative p-6 rounded-[24px] active:scale-95 transition-transform cursor-pointer overflow-hidden border ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100 shadow-sm'}`}
                  >
                     {/* Fondo Glow Sutil */}
                     <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20 ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}></div>

                     {/* Contenido Card */}
                     <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${isCompleted ? (isDark ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-green-100 text-green-700 border-green-200') : (isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-100')}`}>
                                {isCompleted ? 'Completado' : 'En Progreso'}
                            </div>
                            <span className={`text-sm font-bold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{progress.toFixed(0)}%</span>
                        </div>

                        <h3 className={`text-xl font-bold leading-tight mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.name}</h3>
                        <p className={`text-sm font-medium mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                           {task.currency} {(Number(task.amount) || 0).toLocaleString()}
                        </p>

                        {/* Barra de progreso */}
                        <div className={`h-2 w-full rounded-full overflow-hidden ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-indigo-600'}`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                     </div>
                  </div>
                );
             })}
           </div>
         )}
      </div>

      {/* DIALOG CREAR */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={`w-[90%] rounded-[32px] ${isDark ? 'bg-[#1c1c1e] border-zinc-800 text-white' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle>Nuevo Proyecto</DialogTitle>
            <DialogDescription className="sr-only">Formulario crear tarea</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nombre del Proyecto</Label>
              <Input 
                 placeholder="Ej: Comprar Laptop" 
                 value={name}
                 onChange={e => setName(e.target.value)}
                 className={`h-12 rounded-xl ${isDark ? 'bg-[#2c2c2e] border-transparent' : 'bg-gray-50'}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                   <Label>Moneda</Label>
                   <Select value={currency} onValueChange={(val: any) => setCurrency(val)}>
                       <SelectTrigger className={`h-12 rounded-xl ${isDark ? 'bg-[#2c2c2e] border-transparent' : 'bg-gray-50'}`}><SelectValue /></SelectTrigger>
                       <SelectContent>
                           <SelectItem value="$">Dólares ($)</SelectItem>
                           <SelectItem value="S/">Soles (S/)</SelectItem>
                       </SelectContent>
                   </Select>
                 </div>
                 <div>
                   <Label>Presupuesto</Label>
                   <Input
                       type="number"
                       placeholder="0.00"
                       value={amount}
                       onChange={(e) => setAmount(e.target.value)}
                       className={`h-12 rounded-xl ${isDark ? 'bg-[#2c2c2e] border-transparent' : 'bg-gray-50'}`}
                   />
                 </div>
            </div>
            <Button className="w-full h-12 rounded-xl text-lg bg-indigo-600 hover:bg-indigo-700 mt-2" onClick={handleCreateTask}>
              Crear Proyecto
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default MobileTasks;