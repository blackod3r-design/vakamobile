import React, { useState } from 'react';
import { Wallet, Plus, Trash2, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, ArrowLeftRight, FileSpreadsheet } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { useExport } from '@/hooks/usePdfExport';
import { ExportButton } from '@/components/ExportButton';

// --- MAIN COMPONENT ---
const Wallets = () => {
  const { wallets, addWallet, deleteWallet, addWalletMovement, deleteWalletMovement } = useData();
  const { exportWalletMovements } = useExport();
  
  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  
  // Selection States
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null); // For Detail Modal
  const [movementWalletId, setMovementWalletId] = useState<string | null>(null); // For Transaction Modal
  
  // Form States
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

  // --- HANDLERS ---

  const handleAddWallet = () => {
    if (!newWallet.name.trim()) {
      toast.error('El nombre de la billetera es obligatorio');
      return;
    }
    addWallet(newWallet);
    setNewWallet({ name: '', color: '#3b82f6', saldo: 0, currency: '$' });
    setIsAddDialogOpen(false);
    toast.success('Billetera creada exitosamente');
  };

  const handleAddMovement = () => {
    if (!movementWalletId) return;
    if (newMovement.monto <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }
    
    const wallet = wallets.find(w => w.id === movementWalletId);
    if (!wallet) return;

    if (newMovement.tipo === 'retiro' && newMovement.monto > wallet.saldo) {
      toast.error('Saldo insuficiente para realizar el retiro');
      return;
    }

    addWalletMovement(movementWalletId, {
      ...newMovement,
      fecha: new Date().toISOString().split('T')[0],
    });
    setNewMovement({ tipo: 'deposito', monto: 0, descripcion: '' });
    setIsMovementDialogOpen(false);
    toast.success('Movimiento registrado exitosamente');
  };

  const handleDeleteWallet = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta billetera?')) {
      deleteWallet(id);
      setSelectedWalletId(null); // Close modal if open
      toast.success('Billetera eliminada');
    }
  };

  const handleDeleteMovement = (walletId: string, movementId: string) => {
    if (confirm('¿Estás seguro de eliminar este movimiento?')) {
      deleteWalletMovement(walletId, movementId);
      toast.success('Movimiento eliminado');
    }
  };

  // Totales
  const totalSoles = wallets
    .filter(w => w.currency === 'S/')
    .reduce((sum, w) => sum + w.saldo, 0);

  const totalDolares = wallets
    .filter(w => w.currency === '$')
    .reduce((sum, w) => sum + w.saldo, 0);

  // --- RENDER UI ---

  return (
    <div className="p-8 animate-fade-in font-sans" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-1 tracking-tight">Billeteras</h1>
          <p className="text-muted-foreground">Gestiona tu efectivo y cuentas manuales</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-zinc-900 hover:bg-zinc-800 text-white shadow-lg shadow-zinc-200">
              <Plus className="w-4 h-4" />
              Nueva Billetera
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Billetera</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="wallet-name">Nombre</Label>
                <Input
                  id="wallet-name"
                  placeholder="Ej: Fondo de emergencia"
                  value={newWallet.name}
                  onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="wallet-color">Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="wallet-color"
                    type="color"
                    value={newWallet.color}
                    onChange={(e) => setNewWallet({ ...newWallet, color: e.target.value })}
                    className="w-16 h-10 cursor-pointer p-1"
                  />
                  <Input
                    type="text"
                    value={newWallet.color}
                    onChange={(e) => setNewWallet({ ...newWallet, color: e.target.value })}
                    className="flex-1"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="wallet-saldo">Saldo Inicial</Label>
                <Input
                  id="wallet-saldo"
                  type="number"
                  placeholder="0"
                  value={newWallet.saldo}
                  onChange={(e) => setNewWallet({ ...newWallet, saldo: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="wallet-currency">Moneda</Label>
                <Select value={newWallet.currency} onValueChange={(val) => setNewWallet({ ...newWallet, currency: val as '$' | 'S/' })}>
                  <SelectTrigger id="wallet-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">USD ($)</SelectItem>
                    <SelectItem value="S/">PEN (S/)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddWallet} className="w-full">
                Crear Billetera
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* --- TOTALES (Estilo Apple Glass) --- */}
      {wallets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Card Soles */}
          <div className="relative w-full overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-8 shadow-2xl shadow-blue-900/5 backdrop-blur-3xl ring-1 ring-white/70 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
            <p className="text-6xl font-light tracking-tight text-gray-900 tabular-nums drop-shadow-sm leading-none mb-2">
               S/ {totalSoles.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-600/70">Total Efectivo Soles</p>
          </div>

          {/* Card Dólares */}
          <div className="relative w-full overflow-hidden rounded-[32px] border border-white/60 bg-white/70 p-8 shadow-2xl shadow-emerald-900/5 backdrop-blur-3xl ring-1 ring-white/70 flex flex-col items-center justify-center text-center transition-transform hover:-translate-y-1">
             <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
            <p className="text-6xl font-light tracking-tight text-gray-900 tabular-nums drop-shadow-sm leading-none mb-2">
               $ {totalDolares.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/70">Total Efectivo Dólares</p>
          </div>
        </div>
      )}

      {/* --- GRID DE BILLETERAS (Estilo Apple Glass Personalizable) --- */}
      {wallets.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-2 bg-muted/20 rounded-[32px]">
          <Wallet className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-xl font-semibold mb-2 text-gray-700">No hay billeteras</h3>
          <p className="text-muted-foreground mb-4">Crea tu primera billetera para comenzar</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Estilos para animación y scrollbar */}
          <style>
            {`
              .scrollbar-hide::-webkit-scrollbar { display: none; }
              .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}
          </style>

          {wallets.map((wallet) => {
            // Estilos dinámicos basados en el color de la billetera
            const glowColor = wallet.color;
            const shadowStyle = { boxShadow: `0 25px 50px -12px ${wallet.color}30` }; // 30 = ~20% opacity
            
            return (
              <div
                key={wallet.id}
                onClick={() => setSelectedWalletId(wallet.id)}
                style={{ ...shadowStyle }}
                className="group relative w-full overflow-hidden rounded-[32px] border border-white/40 bg-white/70 p-8 backdrop-blur-3xl ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center"
              >
                {/* 1. Reflejo Superior */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>

                {/* 2. Glow de Fondo (Dinámico según color de billetera) */}
                <div 
                   className="absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full blur-3xl mix-blend-multiply transition-all duration-700 group-hover:bg-opacity-40"
                   style={{ backgroundColor: `${glowColor}20` }} // 20 = 12% opacity
                ></div>

                {/* 3. Badge (Billetera) */}
                <span 
                  className="absolute top-6 right-6 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform group-hover:scale-105"
                  style={{ 
                    borderColor: `${wallet.color}40`, 
                    backgroundColor: `${wallet.color}15`, 
                    color: wallet.color 
                  }}
                >
                  Billetera
                </span>

                <div className="mt-4"></div>

                {/* 4. Icono + Nombre */}
                <div className="mb-4 flex flex-col items-center">
                    <div 
                        className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-1 ring-white/50 backdrop-blur-md"
                        style={{ backgroundColor: `${wallet.color}15`, color: wallet.color }}
                    >
                        <Wallet className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-semibold tracking-tight text-gray-900 relative z-10">
                        {wallet.name}
                    </h3>
                </div>

                {/* 5. Saldo */}
                <div className="relative z-10 flex items-baseline justify-center gap-1.5 mb-2">
                  <span className="text-3xl font-light text-gray-400">{wallet.currency}</span>
                  <span className="text-[56px] font-light tracking-tight text-gray-900 leading-none drop-shadow-sm tabular-nums">
                    {wallet.saldo.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                
                <p className="text-xs font-medium text-gray-400 relative z-10">
                    {wallet.movimientos.length} movimientos registrados
                </p>

              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL DETALLE DE BILLETERA (Historial y Acciones) --- */}
      <Dialog open={!!selectedWalletId} onOpenChange={(open) => !open && setSelectedWalletId(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] h-[85vh] p-0 overflow-hidden flex flex-col bg-zinc-50/95 backdrop-blur-xl">
          {(() => {
            const wallet = wallets.find(w => w.id === selectedWalletId);
            if (!wallet) return null;

            return (
              <div className="flex flex-col h-full w-full">
                {/* Header */}
                <DialogHeader className="px-8 py-6 border-b border-gray-200/50 bg-white/50 shrink-0">
                  <DialogTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                     <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
                     >
                        <Wallet className="w-5 h-5" />
                     </div>
                     {wallet.name}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                  <div className="grid md:grid-cols-2 h-full">
                    
                    {/* IZQUIERDA: Info y Acciones */}
                    <div className="p-8 overflow-y-auto space-y-8 bg-white/40 h-full border-r border-gray-200/50">
                        
                        <div className="text-center space-y-2 py-8">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Saldo Disponible</p>
                            <div className="flex items-baseline justify-center gap-1">
                                <span className="text-4xl font-light text-muted-foreground">{wallet.currency}</span>
                                <span className="text-7xl font-bold tracking-tighter text-gray-900">{wallet.saldo.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <Button 
                                size="lg" 
                                className="w-full h-14 text-lg gap-3 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100"
                                onClick={() => { setMovementWalletId(wallet.id); setNewMovement({ ...newMovement, tipo: 'deposito' }); setIsMovementDialogOpen(true); }}
                            >
                                <ArrowUpCircle className="w-6 h-6" />
                                Ingresar Dinero
                            </Button>
                            <Button 
                                size="lg" 
                                variant="outline"
                                className="w-full h-14 text-lg gap-3 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                onClick={() => { setMovementWalletId(wallet.id); setNewMovement({ ...newMovement, tipo: 'retiro' }); setIsMovementDialogOpen(true); }}
                            >
                                <ArrowDownCircle className="w-6 h-6" />
                                Retirar Dinero
                            </Button>
                        </div>
                        
                        <div className="pt-8 flex justify-center">
                            <Button 
                                variant="ghost" 
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 gap-2"
                                onClick={() => handleDeleteWallet(wallet.id)}
                            >
                                <Trash2 className="w-4 h-4" /> Eliminar Billetera
                            </Button>
                        </div>
                    </div>

                    {/* DERECHA: Historial */}
                    <div className="flex flex-col h-full bg-white p-8 overflow-hidden">
                        <div className="flex items-center justify-between mb-6 shrink-0">
                            <h3 className="text-xl font-bold text-gray-900">Movimientos</h3>
                            {wallet.movimientos.length > 0 && (
                                <ExportButton variant="ghost" size="sm" onExport={(f) => exportWalletMovements(wallet.name, wallet.currency, wallet.movimientos, f)} />
                            )}
                        </div>

                        {wallet.movimientos.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                                <p>Sin movimientos</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                                {wallet.movimientos.slice().reverse().map((mov) => (
                                    <div key={mov.id} className="flex justify-between items-center p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors group">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${mov.tipo === 'deposito' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {mov.tipo === 'deposito' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 truncate">{mov.descripcion || 'Sin descripción'}</p>
                                                <p className="text-xs text-gray-400">{new Date(mov.fecha).toLocaleDateString('es-PE')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`font-bold text-lg ${mov.tipo === 'deposito' ? 'text-green-600' : 'text-red-600'}`}>
                                                {mov.tipo === 'deposito' ? '+' : '-'}{wallet.currency}{mov.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-gray-300 hover:text-red-500"
                                                onClick={() => handleDeleteMovement(wallet.id, mov.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
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

      {/* --- MODAL CREAR MOVIMIENTO --- */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {newMovement.tipo === 'deposito' ? 'Registrar Ingreso' : 'Registrar Retiro'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="movement-amount">Monto</Label>
              <div className="relative">
                <Input
                  id="movement-amount"
                  type="number"
                  placeholder="0.00"
                  className="pl-8 text-lg font-bold"
                  value={newMovement.monto || ''}
                  onChange={(e) => setNewMovement({ ...newMovement, monto: Number(e.target.value) })}
                  autoFocus
                />
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
              </div>
            </div>
            <div>
              <Label htmlFor="movement-description">Descripción (Opcional)</Label>
              <Input
                id="movement-description"
                placeholder={newMovement.tipo === 'deposito' ? 'Ej: Venta de producto' : 'Ej: Almuerzo'}
                value={newMovement.descripcion}
                onChange={(e) => setNewMovement({ ...newMovement, descripcion: e.target.value })}
              />
            </div>
            <Button 
                onClick={handleAddMovement} 
                className={`w-full ${newMovement.tipo === 'deposito' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Confirmar {newMovement.tipo === 'deposito' ? 'Ingreso' : 'Retiro'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Wallets;