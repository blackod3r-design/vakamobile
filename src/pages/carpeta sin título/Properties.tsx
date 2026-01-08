import React, { useState } from 'react';
import { Building2, Plus, TrendingUp, TrendingDown, DollarSign, Home, Car, MapPin, Store, Factory, Warehouse, Trash2, ArrowUpRight } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const iconOptions = [
  { value: 'home', label: 'Casa', Icon: Home },
  { value: 'building', label: 'Edificio', Icon: Building2 },
  { value: 'car', label: 'Auto', Icon: Car },
  { value: 'map', label: 'Terreno', Icon: MapPin },
  { value: 'store', label: 'Local', Icon: Store },
  { value: 'factory', label: 'Fábrica', Icon: Factory },
  { value: 'warehouse', label: 'Bodega', Icon: Warehouse },
];

const getIconComponent = (iconValue: string) => {
  const option = iconOptions.find(opt => opt.value === iconValue);
  return option?.Icon || Building2;
};

const Properties = () => {
  const { properties, addProperty, deleteProperty } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('home');
  const [purchaseValue, setPurchaseValue] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [currency, setCurrency] = useState<'$' | 'S/'>('$');

  const handleAddProperty = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !purchaseValue || !estimatedValue) {
      toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
      return;
    }

    addProperty({
      name,
      icon,
      purchaseValue: parseFloat(purchaseValue),
      estimatedValue: parseFloat(estimatedValue),
      currency
    });

    toast({ title: "¡Éxito!", description: "Propiedad agregada correctamente" });
    setIsOpen(false);
    setName('');
    setIcon('home');
    setPurchaseValue('');
    setEstimatedValue('');
    setCurrency('$');
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta propiedad?')) {
      deleteProperty(id);
      toast({ title: "Eliminado", description: "Propiedad eliminada correctamente" });
    }
  };

  const totalPurchase = properties.reduce((sum, prop) => sum + prop.purchaseValue, 0);
  const totalEstimated = properties.reduce((sum, prop) => sum + prop.estimatedValue, 0);
  const totalGain = totalEstimated - totalPurchase;
  const totalGainPercent = totalPurchase > 0 ? (totalGain / totalPurchase) * 100 : 0;

  if (properties.length === 0) {
    return (
      <div className="p-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Propiedades</h1>
        </div>

        <div className="text-center py-12 bg-muted/20 rounded-[32px] border border-dashed border-muted-foreground/20">
          <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No tienes propiedades registradas</h3>
          <p className="text-muted-foreground mb-6">Agrega tu primera propiedad para comenzar</p>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Propiedad
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Propiedad</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProperty} className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    placeholder="Casa en la playa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Tipo *</Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.Icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                     <Label htmlFor="purchase">Valor de Compra</Label>
                     <Input
                        id="purchase"
                        type="number"
                        placeholder="0.00"
                        value={purchaseValue}
                        onChange={(e) => setPurchaseValue(e.target.value)}
                        required
                      />
                   </div>
                </div>
                <div>
                  <Label htmlFor="estimated">Valor Estimado Actual</Label>
                  <Input
                    id="estimated"
                    type="number"
                    placeholder="0.00"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Agregar Propiedad</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 animate-fade-in font-sans" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      
      {/* HEADER */}
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Propiedades</h1>
          <p className="text-muted-foreground">Patrimonio y activos inmobiliarios</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200">
                <Plus className="h-4 w-4" />
                Nueva Propiedad
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Propiedad</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddProperty} className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    placeholder="Casa en la playa"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Tipo *</Label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.Icon className="h-4 w-4" />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                     <Label htmlFor="purchase">Valor de Compra</Label>
                     <Input
                        id="purchase"
                        type="number"
                        placeholder="0.00"
                        value={purchaseValue}
                        onChange={(e) => setPurchaseValue(e.target.value)}
                        required
                      />
                   </div>
                </div>
                <div>
                  <Label htmlFor="estimated">Valor Estimado Actual</Label>
                  <Input
                    id="estimated"
                    type="number"
                    placeholder="0.00"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">Agregar Propiedad</Button>
              </form>
            </DialogContent>
        </Dialog>
      </div>

      {/* TOTALS SECTION (Apple Glass Style) */}
      <div className="grid gap-6 md:grid-cols-3 mb-10">
        
        {/* Total Inversión */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/70 p-6 shadow-xl shadow-gray-200/50 backdrop-blur-3xl ring-1 ring-white/70 flex flex-col items-center justify-center text-center">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent opacity-60"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Inversión Total</p>
            <p className="text-3xl font-light tracking-tight text-gray-900 tabular-nums">
                ${totalPurchase.toLocaleString()}
            </p>
        </div>

        {/* Valor Estimado */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/70 p-6 shadow-xl shadow-emerald-900/5 backdrop-blur-3xl ring-1 ring-white/70 flex flex-col items-center justify-center text-center">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent opacity-60"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600/70 mb-2">Valor Estimado</p>
            <p className="text-4xl font-semibold tracking-tight text-emerald-900 tabular-nums">
                ${totalEstimated.toLocaleString()}
            </p>
        </div>

        {/* Ganancia */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/70 p-6 shadow-xl shadow-gray-200/50 backdrop-blur-3xl ring-1 ring-white/70 flex flex-col items-center justify-center text-center">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent opacity-60"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Plusvalía / Ganancia</p>
            <div className={`flex items-center gap-2 ${totalGain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGain >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                <p className="text-3xl font-light tracking-tight tabular-nums">
                    ${totalGain.toLocaleString()}
                </p>
            </div>
            <span className={`text-xs font-bold mt-1 ${totalGain >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {totalGain >= 0 ? '+' : ''}{totalGainPercent.toFixed(1)}%
            </span>
        </div>
      </div>

      {/* PROPERTIES GRID */}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Animation Style */}
        <style>
            {`
              @keyframes shimmer {
                100% { transform: translateX(100%); }
              }
            `}
        </style>

        {properties.map((property) => {
          const IconComponent = getIconComponent(property.icon);
          const gain = property.estimatedValue - property.purchaseValue;
          const gainPercentage = ((gain / property.purchaseValue) * 100).toFixed(1);
          
          // Theme setup
          const badgeColor = 'border-emerald-200/50 bg-emerald-50/50 text-emerald-700';
          const shadowStyle = 'shadow-emerald-900/5 hover:shadow-emerald-900/10';

          return (
            <div 
              key={property.id} 
              className={`group relative w-full overflow-hidden rounded-[32px] border border-white/40 bg-white/70 p-8 shadow-2xl ${shadowStyle} backdrop-blur-3xl ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center text-center`}
            >
              {/* 1. Reflection */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
              
              {/* 2. Glow */}
              <div className="absolute -right-20 -top-20 h-64 w-64 animate-pulse rounded-full bg-emerald-500/10 blur-3xl mix-blend-multiply transition-all duration-700 group-hover:bg-emerald-500/20"></div>

              {/* 3. Badge (Type Icon) */}
              <span className={`absolute top-6 right-6 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-transform group-hover:scale-105 flex items-center gap-1.5 ${badgeColor}`}>
                <IconComponent className="w-3 h-3" />
                {iconOptions.find(opt => opt.value === property.icon)?.label}
              </span>
              
              {/* Delete Button (Visible on Hover) */}
              <button 
                onClick={() => handleDelete(property.id)}
                className="absolute top-6 left-6 p-2 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                  <Trash2 className="w-4 h-4" />
              </button>

              <div className="mt-4"></div>

              {/* 4. Property Name */}
              <h3 className="mb-4 text-2xl font-semibold tracking-tight text-gray-900 relative z-10">
                {property.name}
              </h3>

              {/* 5. Main Value (Estimated) */}
              <div className="relative z-10 flex items-baseline justify-center gap-1.5 mb-8">
                <span className="text-3xl font-light text-gray-400">{property.currency}</span>
                <span className="text-[56px] font-light tracking-tight text-gray-900 leading-none drop-shadow-sm tabular-nums">
                  {property.estimatedValue.toLocaleString()}
                </span>
              </div>

              {/* 6. Footer Details (Purchase vs Gain) */}
              <div className="relative z-10 w-full border-t border-emerald-100/50 pt-4 mt-auto">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Compra</p>
                        <p className="text-sm font-medium text-gray-600">{property.currency}{property.purchaseValue.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] font-bold uppercase text-gray-400">Ganancia</p>
                        <div className={`flex items-center justify-center gap-1 text-sm font-bold ${gain >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {gain >= 0 ? '+' : ''}{property.currency}{gain.toLocaleString()} 
                            <span className="text-[10px] bg-emerald-100 px-1.5 rounded-full ml-1">
                                {gainPercentage}%
                            </span>
                        </div>
                    </div>
                 </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Properties;