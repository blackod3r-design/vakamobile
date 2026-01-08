import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wallet, Plus, Trash2, TrendingUp, TrendingDown, 
  ArrowUpCircle, ArrowDownCircle, ChevronLeft 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

// --- GENERADOR DE ID SEGURO (Igual que en MobileCards) ---
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const MobileWallets = () => {
  const navigate = useNavigate();
  // Importamos updateWallet para hacer la actualización manual y evitar el error del context
  const { wallets = [], addWallet, updateWallet, deleteWallet } = useData();
  const { theme } = useTheme();
  
  const isDark = theme === 'dark' || theme === 'solid' || theme === 'dark-glass';

  // --- ESTADOS ---
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  
  const [newWallet, setNewWallet] = useState({
    name: '',
    color: '#3b82f6',
    saldo: 0,
    currency: '$' as '$' | 'S/',
  });
  
  const [newMovement, setNewMovement] = useState({
    tipo: 'deposito' as 'deposito' | 'retiro',
    monto: 0,
    descripcion: '',
  });

  // --- SAFE DATA ---
  const safeWallets = useMemo(() => {
    if (!wallets || !Array.isArray(wallets)) return [];
    return wallets;
  }, [wallets]);

  const totalSoles = safeWallets
    .filter(w => w.currency === 'S/')
    .reduce((sum, w) => sum + (Number(w.saldo) || 0), 0);

  const totalDolares = safeWallets
    .filter(w => w.currency === '$')
    .reduce((sum, w) => sum + (Number(w.saldo) || 0), 0);

  // --- HANDLERS ---

  const handleAddWallet = () => {
    if (!newWallet.name.trim()) {
      toast.error('Nombre obligatorio');
      return;
    }
    
    // Si addWallet del contexto también falla, aquí podrías generar el ID manual también,
    // pero usualmente el error estaba en los movimientos.
    addWallet(newWallet);
    
    setNewWallet({ name: '', color: '#3b82f6', saldo: 0, currency: '$' });
    setIsAddDialogOpen(false);
    toast.success('Billetera creada');
  };

  // --- LÓGICA MANUAL (Igual que MobileCards) ---
  const handleAddMovement = () => {
    if (!selectedWalletId) return;
    if (newMovement.monto <= 0) {
      toast.error('Monto inválido');
      return;
    }
    
    const wallet = safeWallets.find(w => w.id === selectedWalletId);
    if (!wallet) return;

    if (newMovement.tipo === 'retiro' && newMovement.monto > (Number(wallet.saldo) || 0)) {
      toast.error('Saldo insuficiente');
      return;
    }

    // 1. Generamos el movimiento manualmente con ID seguro
    const newTx = {
      id: generateId(),
      tipo: newMovement.tipo,
      monto: Number(newMovement.monto),
      descripcion: newMovement.descripcion || (newMovement.tipo === 'deposito' ? 'Ingreso' : 'Retiro'),
      fecha: new Date().toISOString(), // Usamos ISOString completo para consistencia
    };

    // 2. Calculamos el nuevo saldo
    const currentBalance = Number(wallet.saldo) || 0;
    const newBalance = newMovement.tipo === 'deposito' 
      ? currentBalance + newTx.monto 
      : currentBalance - newTx.monto;

    // 3. Obtenemos los movimientos actuales asegurando que sea un array
    const currentMovs = Array.isArray(wallet.movimientos) ? wallet.movimientos : [];

    // 4. Actualizamos usando updateWallet (bypass addWalletMovement)
    updateWallet(selectedWalletId, {
      saldo: newBalance,
      movimientos: [...currentMovs, newTx]
    });
    
    setNewMovement({ tipo: 'deposito', monto: 0, descripcion: '' });
    setIsMovementDialogOpen(false);
    toast.success('Movimiento registrado');
  };

  const handleDeleteWallet = (id: string) => {
    if (confirm('¿Eliminar billetera?')) {
      deleteWallet(id);
      setSelectedWalletId(null); 
    }
  };

  const handleDeleteMovement = (walletId: string, movementId: string) => {
    if (confirm('¿Borrar movimiento?')) {
      const wallet = safeWallets.find(w => w.id === walletId);
      if (!wallet) return;

      const movToDelete = wallet.movimientos?.find((m: any) => m.id === movementId);
      if (!movToDelete) return;

      // Calcular reverso del saldo
      const currentBalance = Number(wallet.saldo) || 0;
      const amount = Number(movToDelete.monto) || 0;
      
      // Si borro un depósito, resto saldo. Si borro retiro, sumo saldo.
      const newBalance = movToDelete.tipo === 'deposito'
        ? currentBalance - amount
        : currentBalance + amount;

      // Filtrar la lista
      const newMovs = wallet.movimientos.filter((m: any) => m.id !== movementId);

      // Guardar
      updateWallet(walletId, {
        saldo: newBalance,
        movimientos: newMovs
      });
      
      toast.success('Movimiento eliminado');
    }
  };

  // =================================================================================
  // VISTA 2: DETALLE
  // =================================================================================
  if (selectedWalletId) {
    const wallet = safeWallets.find(w => w.id === selectedWalletId);
    
    if (!wallet) {
      setSelectedWalletId(null);
      return null;
    }

    const safeMovements = Array.isArray(wallet.movimientos) ? wallet.movimientos : [];

    return (
      <div className={`min-h-screen w-full animate-fade-in flex flex-col ${isDark ? 'bg-[#000000] text-white' : 'bg-[#F2F2F7] text-gray-900'}`}>
        
        {/* HEADER */}
        <div className={`px-4 py-4 flex items-center justify-between shrink-0 ${isDark ? 'bg-[#121212]' : 'bg-white shadow-sm'}`}>
          <Button variant="ghost" size="icon" onClick={() => setSelectedWalletId(null)} className="-ml-2">
             <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-2">
             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: wallet.color }}></div>
             <span className="font-semibold text-lg">{wallet.name}</span>
          </div>
          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDeleteWallet(wallet.id)}>
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        {/* CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="flex flex-col items-center justify-center py-8 space-y-2">
            <span className={`text-sm font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Saldo Disponible
            </span>
            <div className="flex items-baseline gap-1">
               <span className="text-3xl font-light opacity-50">{wallet.currency}</span>
               <span className="text-6xl font-bold tracking-tight">
                 {(Number(wallet.saldo) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button 
              className="h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl flex items-center gap-2"
              onClick={() => {
                setNewMovement({ ...newMovement, tipo: 'deposito' });
                setIsMovementDialogOpen(true);
              }}
            >
              <ArrowUpCircle className="w-5 h-5" /> <span>Ingresar</span>
            </Button>

            <Button 
              className="h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl flex items-center gap-2"
              onClick={() => {
                setNewMovement({ ...newMovement, tipo: 'retiro' });
                setIsMovementDialogOpen(true);
              }}
            >
               <ArrowDownCircle className="w-5 h-5" /> <span>Retirar</span>
            </Button>
          </div>

          <div>
            <h3 className={`font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Historial</h3>
            
            {safeMovements.length === 0 ? (
              <div className={`p-8 border-2 border-dashed rounded-2xl text-center ${isDark ? 'border-zinc-800 text-zinc-600' : 'border-gray-200 text-gray-400'}`}>
                Sin movimientos recientes
              </div>
            ) : (
              <div className="space-y-3 pb-20">
                {safeMovements.slice().reverse().map((mov: any) => (
                   <div key={mov.id || Math.random()} className={`flex items-center justify-between p-4 rounded-2xl border ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${mov.tipo === 'deposito' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                           {mov.tipo === 'deposito' ? <TrendingUp className="w-5 h-5"/> : <TrendingDown className="w-5 h-5"/>}
                        </div>
                        <div className="flex flex-col min-w-0">
                           <span className={`font-medium truncate max-w-[140px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                             {mov.descripcion || (mov.tipo === 'deposito' ? 'Ingreso' : 'Retiro')}
                           </span>
                           <span className="text-xs text-gray-500">
                             {mov.fecha ? new Date(mov.fecha).toLocaleDateString('es-PE') : '-'}
                           </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${mov.tipo === 'deposito' ? 'text-green-500' : 'text-red-500'}`}>
                           {mov.tipo === 'deposito' ? '+' : '-'}{wallet.currency}{(Number(mov.monto) || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </span>
                        <button 
                          onClick={() => handleDeleteMovement(wallet.id, mov.id)}
                          className="text-gray-400 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DIALOG MOVIMIENTO */}
        <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
          <DialogContent className={`w-[90%] rounded-2xl ${isDark ? 'bg-[#1c1c1e] border-zinc-800 text-white' : 'bg-white'}`}>
            <DialogHeader>
              <DialogTitle>{newMovement.tipo === 'deposito' ? 'Registrar Ingreso' : 'Registrar Retiro'}</DialogTitle>
              <DialogDescription className="sr-only">Detalles del movimiento</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
               <div>
                  <Label>Monto ({wallet.currency})</Label>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    className={`text-2xl font-bold h-14 ${isDark ? 'bg-[#2c2c2e] border-transparent' : ''}`}
                    value={newMovement.monto || ''}
                    onChange={e => setNewMovement({...newMovement, monto: parseFloat(e.target.value)})}
                  />
               </div>
               <div>
                  <Label>Descripción</Label>
                  <Input 
                    placeholder="Opcional" 
                    className={isDark ? 'bg-[#2c2c2e] border-transparent' : ''}
                    value={newMovement.descripcion}
                    onChange={e => setNewMovement({...newMovement, descripcion: e.target.value})}
                  />
               </div>
               <Button 
                 className={`w-full h-12 text-lg ${newMovement.tipo === 'deposito' ? 'bg-green-600' : 'bg-red-600'}`}
                 onClick={handleAddMovement}
               >
                 Confirmar
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // =================================================================================
  // VISTA 1: DASHBOARD
  // =================================================================================
  return (
    <div className={`min-h-screen w-full font-sans pb-24 ${isDark ? 'bg-black text-white' : 'bg-[#FCFCFC] text-gray-900'}`}>
      
      {/* HEADER MAIN */}
      <div className="pt-12 pb-2 px-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="-ml-2 rounded-full" onClick={() => navigate(-1)}>
            <ChevronLeft className={`w-6 h-6 ${isDark ? 'text-white' : 'text-black'}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Billeteras</h1>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Control de efectivo</p>
          </div>
        </div>
        <Button 
          size="icon" 
          className="rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/30"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* TOTALES */}
      <div className="px-6 mb-8 mt-4 space-y-4">
          {/* Soles */}
          <div className={`p-6 rounded-[24px] relative overflow-hidden ${isDark ? 'bg-[#1c1c1e] border border-[#2c2c2e]' : 'bg-white shadow-sm border border-gray-100'}`}>
             <div className="relative z-10 flex justify-between items-end">
                <div>
                   <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Total Soles</p>
                   <p className="text-3xl font-bold tracking-tight">
                     S/ {totalSoles.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                   </p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-full text-blue-500">
                  <Wallet className="w-5 h-5" />
                </div>
             </div>
          </div>
          
          {/* Dólares */}
          <div className={`p-6 rounded-[24px] relative overflow-hidden ${isDark ? 'bg-[#1c1c1e] border border-[#2c2c2e]' : 'bg-white shadow-sm border border-gray-100'}`}>
             <div className="relative z-10 flex justify-between items-end">
                <div>
                   <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Dólares</p>
                   <p className="text-3xl font-bold tracking-tight">
                     $ {totalDolares.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                   </p>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500">
                  <Wallet className="w-5 h-5" />
                </div>
             </div>
          </div>
      </div>

      {/* LISTA */}
      <div className="px-6 pb-20">
         <h2 className={`text-sm font-semibold mb-4 px-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mis Cuentas</h2>
         
         {safeWallets.length === 0 ? (
           <div className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-3xl ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
              <Wallet className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-400 text-center text-sm">No hay billeteras</p>
           </div>
         ) : (
           <div className="space-y-4">
             {safeWallets.map((wallet) => (
                <div
                  key={wallet.id}
                  onClick={() => setSelectedWalletId(wallet.id)}
                  className={`relative p-6 rounded-[24px] active:scale-95 transition-transform cursor-pointer overflow-hidden border ${isDark ? 'bg-[#1c1c1e] border-[#2c2c2e]' : 'bg-white border-gray-100 shadow-sm'}`}
                >
                   <div 
                     className="absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-20"
                     style={{ backgroundColor: wallet.color }}
                   ></div>

                   <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div 
                           className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
                           style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
                         >
                            <Wallet className="w-6 h-6" />
                         </div>
                         <div>
                            <h3 className={`font-bold text-lg leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{wallet.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">{(Array.isArray(wallet.movimientos) ? wallet.movimientos.length : 0)} movimientos</p>
                         </div>
                      </div>
                      
                      <div className="text-right">
                         <p className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                           {(Number(wallet.saldo) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </p>
                         <p className="text-xs font-medium text-gray-400">{wallet.currency}</p>
                      </div>
                   </div>
                </div>
             ))}
           </div>
         )}
      </div>

      {/* DIALOG CREAR */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className={`w-[90%] rounded-2xl ${isDark ? 'bg-[#1c1c1e] border-zinc-800 text-white' : 'bg-white'}`}>
          <DialogHeader>
            <DialogTitle>Nueva Billetera</DialogTitle>
            <DialogDescription className="sr-only">Formulario crear billetera</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nombre</Label>
              <Input 
                 placeholder="Ej: Caja Chica" 
                 value={newWallet.name}
                 onChange={e => setNewWallet({...newWallet, name: e.target.value})}
                 className={isDark ? 'bg-[#2c2c2e] border-transparent' : ''}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                 <Label>Moneda</Label>
                 <Select value={newWallet.currency} onValueChange={(val: any) => setNewWallet({...newWallet, currency: val})}>
                    <SelectTrigger className={isDark ? 'bg-[#2c2c2e] border-transparent' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">Dólares ($)</SelectItem>
                      <SelectItem value="S/">Soles (S/)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              <div>
                 <Label>Color</Label>
                 <div className="flex h-10 w-full items-center gap-2">
                    <Input 
                      type="color" 
                      className="w-12 h-10 p-1 cursor-pointer"
                      value={newWallet.color}
                      onChange={e => setNewWallet({...newWallet, color: e.target.value})}
                    />
                 </div>
              </div>
            </div>
            <div>
              <Label>Saldo Inicial</Label>
              <Input 
                 type="number"
                 placeholder="0.00" 
                 value={newWallet.saldo}
                 onChange={e => setNewWallet({...newWallet, saldo: parseFloat(e.target.value)})}
                 className={isDark ? 'bg-[#2c2c2e] border-transparent' : ''}
              />
            </div>
            <Button className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 mt-2" onClick={handleAddWallet}>
              Crear Billetera
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MobileWallets;