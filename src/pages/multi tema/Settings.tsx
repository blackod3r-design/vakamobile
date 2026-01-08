import React, { useState, useRef } from 'react';
import { Moon, Sun, Droplets, Palette, SidebarIcon, Lock, Type, Sparkles, Image, Camera, User, Upload, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

// Helper component for the Glass Style container
const GlassCard = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("relative overflow-hidden rounded-[32px] border border-white/40 bg-white/70 p-8 shadow-2xl backdrop-blur-3xl ring-1 ring-white/70", className)}>
    <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
    <div className="relative z-10">{children}</div>
  </div>
);

const Settings = () => {
  const { 
    theme, setTheme, 
    primaryColor, setPrimaryColor, 
    sidebarSize, setSidebarSize,
    dashboardFontSize, setDashboardFontSize,
    appFontSize, setAppFontSize,
    fontFamily, setFontFamily,
    customFontName, setCustomFontName,
    customFontUrl, setCustomFontUrl,
    customFontFile, setCustomFontFile,
    customTheme, setCustomTheme,
    pinBackground, setPinBackground,
    customPinBackground, setCustomPinBackground,
    customHexColor, setCustomHexColor
  } = useTheme();
  const { changePin } = useAuth();
  
  const [oldPin, setOldPin] = useState(['', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
  const [isCustomThemeOpen, setIsCustomThemeOpen] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: '245 75% 60%',
    background: '240 20% 99%',
    foreground: '240 10% 10%',
    card: '0 0% 100%',
  });
  const [profilePhoto, setProfilePhoto] = useState<string>(() => {
    return localStorage.getItem('profile-photo') || '';
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pinBackgroundInputRef = useRef<HTMLInputElement>(null);
  
  // --- LISTA DE TEMAS ACTUALIZADA (SOLO LOS 3 ELEGIDOS) ---
  const themes = [
    { value: 'glass', label: 'Glass Claro', icon: Droplets },
    { value: 'dark', label: 'Negro Sólido', icon: Moon },
    { value: 'light', label: 'Blanco Sólido', icon: Sun },
  ];

  const colors = [
    { value: 'blue', label: 'Azul', color: 'hsl(245, 75%, 60%)' },
    { value: 'green', label: 'Verde', color: 'hsl(142, 76%, 45%)' },
    { value: 'purple', label: 'Morado', color: 'hsl(270, 75%, 60%)' },
    { value: 'red', label: 'Rojo', color: 'hsl(0, 84%, 60%)' },
    { value: 'orange', label: 'Naranja', color: 'hsl(38, 92%, 50%)' },
    { value: 'pink', label: 'Rosa', color: 'hsl(330, 75%, 60%)' },
  ];

  const sidebarSizes = [
    { value: 'compact', label: 'Compacto', description: 'Solo iconos' },
    { value: 'normal', label: 'Normal', description: 'Iconos + texto' },
    { value: 'expanded', label: 'Expandido', description: 'Más espacioso' },
  ];

  const fontSizes = [
    { value: 'small', label: 'Pequeño' },
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Grande' },
  ];

  const fontFamilies = [
    { value: 'inter', label: 'Inter', preview: 'font-sans' },
    { value: 'roboto', label: 'Roboto', preview: 'font-["Roboto"]' },
    { value: 'opensans', label: 'Open Sans', preview: 'font-["Open_Sans"]' },
    { value: 'lato', label: 'Lato', preview: 'font-["Lato"]' },
    { value: 'montserrat', label: 'Montserrat', preview: 'font-["Montserrat"]' },
    { value: 'poppins', label: 'Poppins', preview: 'font-["Poppins"]' },
    { value: 'custom', label: 'Fuente Personalizada', preview: 'font-sans' },
  ];

  const handleChangePin = () => {
    const oldPinStr = oldPin.join('');
    const newPinStr = newPin.join('');

    if (oldPinStr.length !== 4 || newPinStr.length !== 4) {
      toast.error('El PIN debe tener 4 dígitos');
      return;
    }

    if (changePin(oldPinStr, newPinStr)) {
      toast.success('PIN cambiado exitosamente');
      setOldPin(['', '', '', '']);
      setNewPin(['', '', '', '']);
      setIsPinDialogOpen(false);
    } else {
      toast.error('PIN actual incorrecto');
    }
  };

  const handleApplyCustomTheme = () => {
    setCustomTheme(JSON.stringify(customColors));
    setIsCustomThemeOpen(false);
    toast.success('Paleta personalizada aplicada');
  };

  const handleResetTheme = () => {
    setCustomTheme(null);
    toast.success('Paleta restaurada a valores predeterminados');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfilePhoto(result);
        localStorage.setItem('profile-photo', result);
        window.dispatchEvent(new Event('storage-update'));
        toast.success('Foto de perfil actualizada');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePinBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setCustomPinBackground(result);
        setPinBackground('custom');
        toast.success('Fondo de PIN actualizado');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFontFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValid) {
      toast.error('Por favor, sube un archivo de fuente válido (.ttf, .otf, .woff, .woff2)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const fontName = file.name.split('.')[0];
      setCustomFontFile(base64);
      setCustomFontName(fontName);
      setCustomFontUrl(null); 
      setFontFamily('custom');
      toast.success('Fuente personalizada cargada correctamente');
    };
    reader.onerror = () => {
      toast.error('Error al cargar el archivo de fuente');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-8 animate-fade-in font-sans" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configuración</h1>
        <p className="text-muted-foreground">Personaliza la apariencia y seguridad de tu aplicación</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        
        {/* COLUMNA 1 */}
        <div className="space-y-8">
            
            {/* Profile Photo */}
            <GlassCard className="flex flex-col items-center justify-center text-center">
                {/* Glow */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply animate-pulse"></div>

                <div className="relative mb-6">
                    <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/80 shadow-xl">
                        {profilePhoto ? (
                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <User className="w-16 h-16 text-white" />
                        </div>
                        )}
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 p-2.5 rounded-full bg-black text-white hover:scale-110 transition-transform shadow-lg"
                    >
                        <Camera className="w-4 h-4" />
                    </button>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Tu Perfil</h2>
                <p className="text-sm text-gray-500 mb-4">Actualiza tu foto para personalizar la experiencia</p>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
            </GlassCard>

            {/* Theme & Color */}
            <GlassCard>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply animate-pulse"></div>
                
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><Palette className="w-5 h-5" /></div>
                    Apariencia
                </h2>
                
                <div className="space-y-6">
                    <div>
                        <Label className="mb-3 block font-semibold text-gray-600">Tema</Label>
                        {/* AQUI SE MUESTRAN SOLO LOS 3 TEMAS ELEGIDOS */}
                        <div className="grid grid-cols-3 gap-3">
                            {themes.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    onClick={() => setTheme(value as any)}
                                    className={cn(
                                        'flex flex-col items-center justify-center p-3 rounded-xl border transition-all',
                                        theme === value
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm'
                                        : 'border-transparent bg-white/50 hover:bg-white/80'
                                    )}
                                >
                                    <Icon className="w-6 h-6 mb-1.5" />
                                    <span className="text-xs font-medium">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label className="mb-3 block font-semibold text-gray-600">Color Principal</Label>
                        <div className="flex flex-wrap gap-3">
                            {colors.map(({ value, color }) => (
                                <button
                                    key={value}
                                    onClick={() => setPrimaryColor(value)}
                                    className={cn(
                                        'w-10 h-10 rounded-full border-2 transition-transform hover:scale-110',
                                        primaryColor === value ? 'border-gray-900 scale-110' : 'border-transparent'
                                    )}
                                    style={{ background: color }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200/50">
                        <Dialog open={isCustomThemeOpen} onOpenChange={setIsCustomThemeOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-between">
                                    <span>Crear paleta personalizada</span>
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Crear Paleta Personalizada</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div><Label>Color Primario (HSL)</Label><Input value={customColors.primary} onChange={(e) => setCustomColors({ ...customColors, primary: e.target.value })} placeholder="245 75% 60%" /></div>
                                    <div><Label>Fondo (HSL)</Label><Input value={customColors.background} onChange={(e) => setCustomColors({ ...customColors, background: e.target.value })} placeholder="240 20% 99%" /></div>
                                    <div><Label>Texto (HSL)</Label><Input value={customColors.foreground} onChange={(e) => setCustomColors({ ...customColors, foreground: e.target.value })} placeholder="240 10% 10%" /></div>
                                    <div><Label>Tarjetas (HSL)</Label><Input value={customColors.card} onChange={(e) => setCustomColors({ ...customColors, card: e.target.value })} placeholder="0 0% 100%" /></div>
                                    <Button onClick={handleApplyCustomTheme} className="w-full">Aplicar</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </GlassCard>

        </div>

        {/* COLUMNA 2 */}
        <div className="space-y-8">
            
            {/* Typography */}
            <GlassCard>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Type className="w-5 h-5" /></div>
                    Tipografía
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <Label className="mb-2 block text-gray-600">Fuente</Label>
                        <Select value={fontFamily} onValueChange={(value: any) => setFontFamily(value)}>
                            <SelectTrigger className="bg-white/50 border-gray-200"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {fontFamilies.map(font => (
                                    <SelectItem key={font.value} value={font.value}>
                                        <span style={{ fontFamily: font.label }}>{font.label}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="mb-2 block text-gray-600">Tamaño Títulos</Label>
                            <Select value={dashboardFontSize} onValueChange={(value: any) => setDashboardFontSize(value)}>
                                <SelectTrigger className="bg-white/50 border-gray-200"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {fontSizes.map(size => <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="mb-2 block text-gray-600">Tamaño Texto</Label>
                            <Select value={appFontSize} onValueChange={(value: any) => setAppFontSize(value)}>
                                <SelectTrigger className="bg-white/50 border-gray-200"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {fontSizes.map(size => <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                     {fontFamily === 'custom' && (
                        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50">
                            <div>
                                <Label className="mb-2 block">Subir Archivo de Fuente</Label>
                                <Input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleFontFileUpload} className="cursor-pointer" />
                                <p className="text-xs text-muted-foreground mt-2">Sube un archivo de fuente (.ttf, .otf, .woff, .woff2)</p>
                                {customFontFile && customFontName && (
                                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">✓ Fuente cargada: {customFontName}</p>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-50 px-2 text-gray-500">o</span></div>
                            </div>
                            <div>
                                <Label className="mb-2 block">Nombre de la fuente</Label>
                                <Input placeholder="Raleway" value={customFontName || ''} onChange={(e) => setCustomFontName(e.target.value || null)} />
                            </div>
                            <div>
                                <Label className="mb-2 block">URL de Google Fonts (opcional)</Label>
                                <Input placeholder="https://fonts.googleapis.com/css2?family=..." value={customFontUrl || ''} onChange={(e) => setCustomFontUrl(e.target.value || null)} />
                            </div>
                            {(customFontName || customFontUrl || customFontFile) && (
                                <Button variant="outline" size="sm" onClick={() => {
                                    setCustomFontName(null);
                                    setCustomFontUrl(null);
                                    setCustomFontFile(null);
                                    setFontFamily('inter');
                                    toast.success('Fuente personalizada eliminada');
                                }} className="w-full">Limpiar fuente</Button>
                            )}
                        </div>
                    )}
                </div>
            </GlassCard>

            {/* Interface & Sidebar Size */}
            <GlassCard>
                 <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="p-2 bg-green-100 rounded-lg text-green-600"><SidebarIcon className="w-5 h-5" /></div>
                    Interfaz
                </h2>
                <div>
                    <Label className="mb-3 block text-gray-600">Estilo de Barra Lateral</Label>
                    <div className="grid grid-cols-3 gap-3">
                        {sidebarSizes.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setSidebarSize(value as any)}
                                className={cn(
                                    'py-2 px-3 rounded-lg border text-sm font-medium transition-all',
                                    sidebarSize === value
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-transparent bg-white/50 hover:bg-white/80'
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </GlassCard>

            {/* Security */}
            <GlassCard>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-400/10 rounded-full blur-2xl mix-blend-multiply"></div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <div className="p-2 bg-red-100 rounded-lg text-red-600"><Lock className="w-5 h-5" /></div>
                    Seguridad & Acceso
                </h2>
                
                <div className="space-y-4">
                     <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start h-12 bg-white/50 hover:bg-white">
                                Cambiar PIN de acceso
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Cambiar PIN</DialogTitle></DialogHeader>
                            <div className="space-y-4 py-4 text-center">
                                <Label className="text-left block mb-2">PIN Actual</Label>
                                <div className="flex gap-2 justify-center">{oldPin.map((_, i) => <input key={i} type="password" maxLength={1} className="w-12 h-12 text-center text-xl border rounded-lg" value={oldPin[i]} onChange={(e) => { const n = [...oldPin]; n[i] = e.target.value.slice(-1); setOldPin(n); }} />)}</div>
                                
                                <Label className="text-left block mb-2 mt-4">Nuevo PIN</Label>
                                <div className="flex gap-2 justify-center">{newPin.map((_, i) => <input key={i} type="password" maxLength={1} className="w-12 h-12 text-center text-xl border rounded-lg" value={newPin[i]} onChange={(e) => { const n = [...newPin]; n[i] = e.target.value.slice(-1); setNewPin(n); }} />)}</div>
                                
                                <Button onClick={handleChangePin} className="w-full mt-6">Confirmar Cambio</Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div>
                        <Label className="mb-3 block text-gray-600">Fondo de Pantalla de Bloqueo</Label>
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {[
                                { value: 'default', color: 'linear-gradient(135deg, hsl(245, 75%, 60%), hsl(260, 75%, 65%))' },
                                { value: 'sunset', color: 'linear-gradient(135deg, hsl(0, 84%, 60%), hsl(38, 92%, 50%))' },
                                { value: 'ocean', color: 'linear-gradient(135deg, hsl(200, 84%, 60%), hsl(160, 70%, 55%))' },
                                { value: 'forest', label: 'Bosque', preview: 'linear-gradient(135deg, hsl(142, 76%, 45%), hsl(160, 70%, 50%))' },
                                { value: 'lavender', label: 'Lavanda', preview: 'linear-gradient(135deg, hsl(270, 75%, 60%), hsl(320, 75%, 60%))' },
                                { value: 'dark', label: 'Oscuro', preview: 'linear-gradient(135deg, hsl(240, 10%, 8%), hsl(240, 10%, 20%))' },
                            ].map(({ value, label, preview, color }) => (
                                <button
                                    key={value}
                                    onClick={() => setPinBackground(value)}
                                    className={cn(
                                        'w-12 h-12 rounded-full border-2 shrink-0 transition-transform hover:scale-110',
                                        pinBackground === value ? 'border-primary scale-110' : 'border-transparent'
                                    )}
                                    style={{ background: color || preview }}
                                />
                            ))}
                             <button
                                onClick={() => pinBackgroundInputRef.current?.click()}
                                className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:border-gray-400 shrink-0"
                             >
                                 <Upload className="w-4 h-4" />
                             </button>
                             <input ref={pinBackgroundInputRef} type="file" accept="image/*" onChange={handlePinBackgroundChange} className="hidden" />
                        </div>
                    </div>
                </div>
            </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Settings;