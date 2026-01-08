import React, { useState } from 'react';
import { Plane, ShoppingBag, Gift, Plus, TrendingUp, TrendingDown, Trash2, Upload, Settings, ArrowRightLeft } from 'lucide-react';
import { ImageEditor } from '@/components/ImageEditor';
import { useData } from '@/contexts/DataContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// 1. IMPORTAR TEMA
import { useTheme } from '@/contexts/ThemeContext';

const iconOptions = [
  { value: 'plane', label: 'Viajes', Icon: Plane, color: 'blue' },
  { value: 'shopping', label: 'Compras', Icon: ShoppingBag, color: 'purple' },
  { value: 'gift', label: 'Canje', Icon: Gift, color: 'pink' },
];

const getProgramConfig = (iconValue: string) => {
  const option = iconOptions.find(opt => opt.value === iconValue);
  return option || iconOptions[0];
};

const MilesPoints = () => {
  const { milesPoints, updateMilesPoints } = useData();
  const { editMode } = useEditMode();
  
  // 2. OBTENER TEMA
  const { theme } = useTheme();
  const isDark = theme === 'dark' || theme === 'solid';
  
  // Modal States
  const [isOpen, setIsOpen] = useState(false);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [customizeProgramId, setCustomizeProgramId] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [points, setPoints] = useState('');
  const [icon, setIcon] = useState<'plane' | 'shopping' | 'gift'>('plane');
  
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [transactionType, setTransactionType] = useState<'add' | 'subtract'>('add');
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // --- HANDLERS ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        if (selectedProgramId) {
          const updatedPrograms = milesPoints.programs.map(p =>
            p.id === selectedProgramId ? { ...p, imageUrl } : p
          );
          updateMilesPoints({ programs: updatedPrograms });
          toast({ title: "¡Imagen agregada!" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    if (selectedProgramId) {
      const updatedPrograms = milesPoints.programs.map(p =>
        p.id === selectedProgramId ? { ...p, imageUrl: undefined } : p
      );
      updateMilesPoints({ programs: updatedPrograms });
      setImagePreview(null);
      toast({ title: "Imagen eliminada" });
    }
  };

  const handleAddProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !points) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }

    const newProgram = {
      id: crypto.randomUUID(),
      name,
      points: parseInt(points),
      icon,
      transactions: []
    };

    updateMilesPoints({
      programs: [...milesPoints.programs, newProgram]
    });

    toast({ title: "¡Éxito!", description: "Programa agregado correctamente" });
    setIsOpen(false);
    setName('');
    setPoints('');
    setIcon('plane');
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionAmount || !transactionDescription) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }

    const program = milesPoints.programs.find(p => p.id === selectedProgramId);
    if (!program) return;

    const amount = parseInt(transactionAmount);
    const newTransaction = {
      id: crypto.randomUUID(),
      amount,
      type: transactionType,
      description: transactionDescription,
      date: new Date().toISOString()
    };

    const newPoints = transactionType === 'add' 
      ? program.points + amount 
      : Math.max(0, program.points - amount);

    updateMilesPoints({
      programs: milesPoints.programs.map(p => 
        p.id === selectedProgramId 
          ? { ...p, points: newPoints, transactions: [...p.transactions, newTransaction] }
          : p
      )
    });

    toast({ title: "Transacción registrada" });
    setIsTransactionOpen(false);
    setTransactionAmount('');
    setTransactionDescription('');
    setTransactionType('add');
  };

  const handleDeleteProgram = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este programa?')) {
      updateMilesPoints({
        programs: milesPoints.programs.filter(p => p.id !== id)
      });
      toast({ title: "Programa eliminado" });
      if (selectedProgramId === id) setSelectedProgramId(null);
    }
  };

  const selectedProgram = milesPoints.programs.find(p => p.id === selectedProgramId);

  // --- RENDER UI ---

  return (
    <div 
        className={`p-8 animate-fade-in font-sans transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`} 
        style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}
    >
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Millas y Puntos</h1>
          <p className={isDark ? "text-gray-400" : "text-muted-foreground"}>Gestiona tus programas de lealtad</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Programa
            </Button>
          </DialogTrigger>
          <DialogContent className={isDark ? 'bg-[#181818] border-zinc-800 text-white' : ''}>
            <DialogHeader>
              <DialogTitle>Agregar Programa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddProgram} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Programa</Label>
                <Input 
                    id="name" 
                    placeholder="Ej: LATAM Pass" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className={isDark ? 'bg-zinc-900 border-zinc-700' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">Tipo de Programa</Label>
                <Select value={icon} onValueChange={(value: any) => setIcon(value)}>
                  <SelectTrigger className={isDark ? 'bg-zinc-900 border-zinc-700' : ''}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.Icon className="w-4 h-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="points">Puntos Iniciales</Label>
                <Input 
                    id="points" 
                    type="number" 
                    placeholder="0" 
                    value={points} 
                    onChange={(e) => setPoints(e.target.value)} 
                    required 
                    className={isDark ? 'bg-zinc-900 border-zinc-700' : ''}
                />
              </div>
              <Button type="submit" className="w-full">Guardar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- GRID DE PROGRAMAS (Estilo Apple/Black Glass) --- */}
      {milesPoints.programs.length === 0 ? (
        <div className={`text-center py-20 rounded-[32px] border border-dashed ${isDark ? 'bg-[#181818]/50 border-[#27272a]' : 'bg-muted/20 border-muted-foreground/20'}`}>
          <Plane className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Sin programas registrados</h3>
          <p className="text-muted-foreground mt-2">Agrega tu primer programa de millas o puntos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {milesPoints.programs.map((program) => {
            const config = getProgramConfig(program.icon);
            
            // Configuración de colores dinámicos
            const colorMap = {
                blue: {
                    badge: isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-100/50 text-blue-700 border-blue-200/50',
                    shadow: isDark ? 'shadow-black' : 'shadow-blue-900/5 hover:shadow-blue-900/10',
                    glow: 'bg-blue-500/20'
                },
                purple: {
                    badge: isDark ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-purple-100/50 text-purple-700 border-purple-200/50',
                    shadow: isDark ? 'shadow-black' : 'shadow-purple-900/5 hover:shadow-purple-900/10',
                    glow: 'bg-purple-500/20'
                },
                pink: {
                    badge: isDark ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : 'bg-pink-100/50 text-pink-700 border-pink-200/50',
                    shadow: isDark ? 'shadow-black' : 'shadow-pink-900/5 hover:shadow-pink-900/10',
                    glow: 'bg-pink-500/20'
                }
            };

            // @ts-ignore
            const themeConfig = colorMap[config.color] || colorMap.blue;

            return (
              <div 
                key={program.id} 
                onClick={() => setSelectedProgramId(program.id)}
                className={`group relative w-full overflow-hidden rounded-[32px] border p-8 shadow-2xl backdrop-blur-3xl transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center
                    ${isDark 
                        ? `bg-[#181818] border-[#27272a] ${themeConfig.shadow} hover:border-zinc-700` 
                        : `bg-white/70 border-white/40 ${themeConfig.shadow} ring-1 ring-white/70`
                    }
                `}
              >
                {/* 1. Reflejo Superior */}
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b to-transparent opacity-50 ${isDark ? 'from-white/5' : 'from-white/50'}`}></div>
                
                {/* 2. Glow de Fondo Dinámico */}
                <div className={`absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full blur-3xl mix-blend-multiply transition-all duration-700 group-hover:scale-110 ${themeConfig.glow}`}></div>

                {/* 3. BADGE (Top Right) */}
                <span className={`absolute top-6 right-6 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform group-hover:scale-105 flex items-center gap-1.5 ${themeConfig.badge}`}>
                  <config.Icon className="w-3 h-3" />
                  {config.label}
                </span>

                {/* Botón Edit */}
                {editMode && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); setCustomizeProgramId(program.id); setIsCustomizeOpen(true); }}
                     className={`absolute top-6 left-6 p-2 rounded-full transition-colors z-20 ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-gray-500 hover:text-black hover:bg-black/10'}`}
                   >
                       <Settings className="w-4 h-4" />
                   </button>
                )}

                <div className="mt-6"></div>

                {/* 4. Nombre del Programa */}
                <h3 className={`mb-2 text-2xl font-bold tracking-tight relative z-10 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {program.name}
                </h3>

                {/* 5. Cantidad de Puntos */}
                <div className="relative z-10 mb-8">
                  <span className={`text-[56px] font-light tracking-tight leading-none drop-shadow-sm tabular-nums ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {program.points.toLocaleString()}
                  </span>
                  <p className={`text-sm font-medium mt-1 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>puntos acumulados</p>
                </div>

                {/* 6. Footer Discreto */}
                <div className={`relative z-10 w-full border-t pt-4 mt-auto ${isDark ? 'border-zinc-800' : 'border-gray-200/50'}`}>
                   <div className={`flex justify-between items-center text-xs font-medium ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                      <span>Último: {program.transactions.length > 0 ? new Date(program.transactions[program.transactions.length - 1].date).toLocaleDateString() : '-'}</span>
                      <span>{program.transactions.length} movimientos</span>
                   </div>
                </div>

              </div>
            );
          })}
        </div>
      )}


      {/* --- MODAL DETALLE DEL PROGRAMA --- */}
      <Dialog open={!!selectedProgramId} onOpenChange={(open) => !open && setSelectedProgramId(null)}>
        <DialogContent className={`max-w-4xl h-[80vh] p-0 overflow-hidden flex flex-col backdrop-blur-xl ${isDark ? 'bg-[#0f0f0f]/95 border-zinc-800 text-white' : 'bg-zinc-50/95'}`}>
          {(() => {
            if (!selectedProgram) return null;
            const config = getProgramConfig(selectedProgram.icon);

            return (
              <div className="flex flex-col h-full w-full">
                
                {/* Header */}
                <DialogHeader className={`px-8 py-6 border-b shrink-0 ${isDark ? 'bg-black/20 border-zinc-800' : 'bg-white/50 border-gray-200/50'}`}>
                  <DialogTitle className={`text-2xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <config.Icon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-zinc-900'}`} />
                      {selectedProgram.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                  <div className="grid md:grid-cols-2 h-full">
                    
                    {/* IZQUIERDA: Info y Acciones */}
                    <div className={`p-8 overflow-y-auto space-y-8 h-full border-r ${isDark ? 'bg-black/20 border-zinc-800' : 'bg-white/40 border-gray-200/50'}`}>
                        
                        {/* Visual Card */}
                        <div className="relative w-full h-[200px] rounded-[24px] bg-gradient-to-br from-zinc-800 to-black shadow-2xl overflow-hidden text-white p-8 flex flex-col justify-between shrink-0">
                            {selectedProgram.imageUrl && <img src={selectedProgram.imageUrl} alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-60" />}
                            
                            <div className="relative z-10 flex justify-between items-start">
                                <h3 className="text-2xl font-bold tracking-tight">{selectedProgram.name}</h3>
                                <div className="p-2 bg-white/10 backdrop-blur-md rounded-lg">
                                   <config.Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="relative z-10">
                                <p className="text-xs font-bold uppercase opacity-60 mb-1">Balance Actual</p>
                                <p className="text-4xl font-mono font-bold tracking-tight">{selectedProgram.points.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="grid grid-cols-1 gap-3">
                            <Button 
                                size="lg" 
                                className="w-full h-12 bg-zinc-900 hover:bg-black text-white gap-2 shadow-md"
                                onClick={() => { setIsTransactionOpen(true); setTransactionType('add'); }}
                            >
                                <Plus className="w-5 h-5" /> Agregar Puntos
                            </Button>
                            <Button 
                                size="lg" 
                                variant="outline" 
                                className={`w-full h-12 gap-2 ${isDark ? 'bg-transparent border-zinc-700 text-white hover:bg-white/5' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => { setIsTransactionOpen(true); setTransactionType('subtract'); }}
                            >
                                <ArrowRightLeft className="w-5 h-5" /> Canjear / Usar
                            </Button>
                        </div>

                        {/* Configuración */}
                        <div className={`pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-gray-200/50'}`}>
                            {!selectedProgram.imageUrl ? (
                                <div className={`relative group cursor-pointer border-2 border-dashed rounded-xl p-4 text-center hover:border-zinc-400 transition-all ${isDark ? 'border-zinc-800 bg-white/5 hover:bg-white/10' : 'border-gray-300 hover:bg-gray-100'}`}>
                                    <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                                    <Upload className="w-6 h-6 mx-auto text-gray-400 group-hover:text-zinc-600 mb-2" />
                                    <span className="text-sm font-medium text-gray-500 group-hover:text-zinc-700">Subir imagen de fondo</span>
                                </div>
                            ) : (
                                <Button variant="ghost" size="sm" onClick={removeImage} className="w-full text-red-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" /> Quitar imagen
                                </Button>
                            )}

                            {editMode && (
                                <Button variant="destructive" className="w-full mt-4" onClick={() => handleDeleteProgram(selectedProgram.id)}>
                                    Eliminar Programa
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* DERECHA: Historial (Scroll Independiente) */}
                    <div className={`flex flex-col h-full p-8 overflow-hidden ${isDark ? 'bg-[#181818]' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Historial</h3>
                        </div>

                        {selectedProgram.transactions.length === 0 ? (
                            <div className={`flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed rounded-2xl ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                                <p>Sin movimientos</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                                {selectedProgram.transactions.slice().reverse().map((t) => (
                                    <div key={t.id} className={`flex justify-between items-center p-4 rounded-xl border transition-colors ${isDark ? 'bg-[#202020] border-zinc-800 hover:bg-[#252525]' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === 'add' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {t.type === 'add' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.description}</p>
                                                <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`font-bold text-lg ${t.type === 'add' ? 'text-green-600' : 'text-orange-600'}`}>
                                            {t.type === 'add' ? '+' : '-'}{t.amount.toLocaleString()}
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

      {/* --- MODAL TRANSACCIONES --- */}
      <Dialog open={isTransactionOpen} onOpenChange={setIsTransactionOpen}>
        <DialogContent className={isDark ? 'bg-[#181818] border-zinc-800 text-white' : ''}>
            <DialogHeader>
                <DialogTitle>{transactionType === 'add' ? 'Agregar Puntos' : 'Canjear Puntos'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTransaction} className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input 
                        type="number" 
                        value={transactionAmount} 
                        onChange={(e) => setTransactionAmount(e.target.value)} 
                        autoFocus 
                        className={isDark ? 'bg-zinc-900 border-zinc-700' : ''}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input 
                        value={transactionDescription} 
                        onChange={(e) => setTransactionDescription(e.target.value)} 
                        placeholder={transactionType === 'add' ? 'Vuelo a Madrid' : 'Canje de producto'} 
                        className={isDark ? 'bg-zinc-900 border-zinc-700' : ''}
                    />
                </div>
                <Button type="submit" className={`w-full ${transactionType === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
                    Confirmar
                </Button>
            </form>
        </DialogContent>
      </Dialog>

      {/* --- MODAL PERSONALIZAR --- */}
      <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
        <DialogContent className={isDark ? 'bg-[#181818] border-zinc-800 text-white' : ''}>
            <DialogHeader><DialogTitle>Personalizar</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <Label>Imagen de Fondo</Label>
                <Input type="file" accept="image/*" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if(file && customizeProgramId) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            const updatedPrograms = milesPoints.programs.map(p => p.id === customizeProgramId ? { ...p, imageUrl: reader.result as string } : p);
                            updateMilesPoints({ programs: updatedPrograms });
                            toast({ title: "Fondo actualizado" });
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

export default MilesPoints;