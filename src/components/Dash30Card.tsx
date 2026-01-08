import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Edit2 } from 'lucide-react';
import { useEditMode } from '@/contexts/EditModeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Dash30CardProps {
  cardId: string;
  title: string;
  mainValue: string;
  subtitle?: string;
  showProgress?: boolean;
  progressValue?: number;
  onClick?: () => void;
  backContent?: {
    type: 'mortgage' | 'cards' | 'miles' | 'loans' | 'properties' | 'details';
    data?: any;
  };
}

export const Dash30Card: React.FC<Dash30CardProps> = ({
  cardId,
  title,
  mainValue,
  subtitle,
  showProgress,
  progressValue,
  onClick,
  backContent,
}) => {
  const { editMode } = useEditMode();
  const [isFlipped, setIsFlipped] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  const [customStyles, setCustomStyles] = useState(() => {
    const defaultStyles = {
      bgColor: '',
      textColor: '',
      title: { color: '', size: 24, posX: 0, posY: 0 },
      mainValue: { color: '', size: 48, posX: 0, posY: 0 },
      subtitle: { color: '', size: 14, posX: 0, posY: 0 },
      cuotas: { color: '', size: 14, posX: 0, posY: 0 },
      fecha: { color: '', size: 14, posX: 0, posY: 0 },
    };
    
    const stored = localStorage.getItem(`dash30-card-${cardId}`);
    if (!stored) return defaultStyles;
    
    try {
      const parsed = JSON.parse(stored);
      return {
        bgColor: parsed.bgColor || '',
        textColor: parsed.textColor || '',
        title: parsed.title || defaultStyles.title,
        mainValue: parsed.mainValue || defaultStyles.mainValue,
        subtitle: parsed.subtitle || defaultStyles.subtitle,
        cuotas: parsed.cuotas || defaultStyles.cuotas,
        fecha: parsed.fecha || defaultStyles.fecha,
      };
    } catch {
      return defaultStyles;
    }
  });

  useEffect(() => {
    localStorage.setItem(`dash30-card-${cardId}`, JSON.stringify(customStyles));
  }, [customStyles, cardId]);

  const handleClick = () => {
    if (!backContent) {
      onClick?.();
      return;
    }
    
    setClickCount(prev => {
      const newCount = prev + 1;
      
      if (newCount === 1) {
        setIsFlipped(prev => !prev);
        setTimeout(() => setClickCount(0), 500);
      } else if (newCount === 2) {
        onClick?.();
        setClickCount(0);
      }
      
      return newCount;
    });
  };

  const handleStyleChange = (element: string, key: string, value: string | number) => {
    setCustomStyles((prev: any) => ({
      ...prev,
      [element]: { ...prev[element], [key]: value }
    }));
  };

  const handleBgColorChange = (value: string) => {
    setCustomStyles((prev: any) => ({ ...prev, bgColor: value }));
  };

  const renderBackContent = () => {
    if (!backContent) return null;

    switch (backContent.type) {
      case 'mortgage':
        return (
          <div className="space-y-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Saldo Actual</p>
              <p className="text-3xl font-light tracking-tight text-gray-900">{backContent.data?.saldoActual || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200/50">
              <div>
                <p className="text-xs text-gray-500 mb-1">Meses Restantes</p>
                <p className="text-lg font-semibold">{backContent.data?.mesesRestantes || 0}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Valor Cuota</p>
                <p className="text-lg font-semibold">{backContent.data?.valorCuota || 'N/A'}</p>
              </div>
            </div>
          </div>
        );
      case 'cards':
        return (
          <div className="space-y-3 overflow-y-auto max-h-[180px] scrollbar-hide pr-1">
            {backContent.data?.cards?.map((card: any, idx: number) => (
              <div key={idx} className="p-3 bg-white/50 border border-white/60 rounded-xl shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-800 text-sm">{card.name}</p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Línea:</span>
                    <span className="font-medium">${card.totalLimit?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Disponible:</span>
                    <span className="font-medium text-green-600">${card.availableBalance?.toLocaleString()}</span>
                  </div>
                  <Progress value={card.usagePercent || 0} className="h-1.5 mt-2 bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        );
      case 'miles':
        return (
          <div className="space-y-3 overflow-y-auto max-h-[180px] scrollbar-hide pr-1">
            {backContent.data?.programs?.map((prog: any, idx: number) => (
              <div key={idx} className="p-3 bg-white/50 border border-white/60 rounded-xl shadow-sm backdrop-blur-sm flex items-center justify-between">
                <span className="font-medium text-gray-800 text-sm">{prog.name}</span>
                <span className="text-lg font-bold text-indigo-600">{prog.points?.toLocaleString()}</span>
              </div>
            ))}
          </div>
        );
      case 'loans':
        return (
          <div className="space-y-4 text-center">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Saldo Actual</p>
              <p className="text-3xl font-light tracking-tight text-gray-900">{backContent.data?.saldoActual || 'N/A'}</p>
            </div>
            <div className="pt-2 border-t border-gray-200/50">
               <p className="text-xs text-gray-500 mb-1">Total a Pagar</p>
               <p className="text-xl font-semibold text-gray-800">{backContent.data?.totalAPagar || 'N/A'}</p>
            </div>
          </div>
        );
      case 'properties':
        return (
          <div className="space-y-3 overflow-y-auto max-h-[180px] scrollbar-hide pr-1">
            {backContent.data?.properties?.map((prop: any, idx: number) => (
              <div key={idx} className="p-3 bg-white/50 border border-white/60 rounded-xl shadow-sm backdrop-blur-sm flex justify-between items-center">
                <p className="font-medium text-gray-800 text-sm">{prop.name}</p>
                <p className="text-lg font-bold text-emerald-600">${prop.value?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        );
      case 'details':
        return (
          <div className="space-y-3 overflow-y-auto max-h-[180px] scrollbar-hide pr-1">
            {backContent.data?.items?.map((item: any, idx: number) => (
              <div key={idx} className="p-3 bg-white/50 border border-white/60 rounded-xl shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                  <span className="text-lg font-bold text-indigo-600">{item.value !== undefined ? item.value : ''}</span>
                </div>
                {item.subtitle && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
                )}
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  const parseCuotas = () => {
    if (!subtitle) return null;
    const match = subtitle.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
      return { paid: match[1], remaining: match[2] };
    }
    return null;
  };

  const parseDate = () => {
    if (!subtitle) return null;
    const dateMatch = subtitle.match(/Próximo:\s*(.+)/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      if (dateStr === 'N/A') return 'N/A';
      
      try {
        const date = new Date(dateStr);
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${date.getDate()} de ${months[date.getMonth()]}`;
      } catch {
        return dateStr;
      }
    }
    return null;
  };

  const cuotas = parseCuotas();
  const nextDate = parseDate();

  // Clase base para el efecto Glass con bordes y sombras
  const glassCardClasses = "absolute inset-0 backface-hidden rounded-[32px] border border-white/40 bg-white/70 p-6 shadow-xl backdrop-blur-3xl ring-1 ring-white/70 flex flex-col transition-all duration-300";

  return (
    <div
      className={`relative w-full h-[300px] cursor-pointer transition-all duration-500 preserve-3d group hover:-translate-y-2 ${
        isFlipped ? 'rotate-y-180' : ''
      }`}
      onClick={handleClick}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
    >
      {/* Botón de Edición (Flotante) */}
      {editMode && (
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 hover:bg-white text-gray-600 shadow-sm transition-all hover:scale-110"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </DialogTrigger>
          <DialogContent onClick={(e) => e.stopPropagation()} className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Personalizar {title}</DialogTitle>
            </DialogHeader>
            <Tabs defaultValue="general">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="title">Título</TabsTrigger>
                <TabsTrigger value="content">Contenido</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div>
                  <Label>Color de fondo (HEX o RGB)</Label>
                  <Input
                    value={customStyles.bgColor}
                    onChange={(e) => handleBgColorChange(e.target.value)}
                    placeholder="#ffffff"
                  />
                </div>
              </TabsContent>

              <TabsContent value="title" className="space-y-4">
                <div>
                  <Label>Color de texto</Label>
                  <Input
                    value={customStyles.title.color}
                    onChange={(e) => handleStyleChange('title', 'color', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Tamaño (px)</Label>
                  <Input
                    type="number"
                    value={customStyles.title.size}
                    onChange={(e) => handleStyleChange('title', 'size', parseInt(e.target.value))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pos X (%)</Label>
                    <Input
                      type="number"
                      value={customStyles.title.posX}
                      onChange={(e) => handleStyleChange('title', 'posX', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Pos Y (%)</Label>
                    <Input
                      type="number"
                      value={customStyles.title.posY}
                      onChange={(e) => handleStyleChange('title', 'posY', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <h4 className="font-semibold">Valor Principal</h4>
                <div>
                    <Label>Color</Label>
                    <Input value={customStyles.mainValue.color} onChange={(e) => handleStyleChange('mainValue', 'color', e.target.value)} />
                </div>
                <div>
                    <Label>Tamaño (px)</Label>
                    <Input type="number" value={customStyles.mainValue.size} onChange={(e) => handleStyleChange('mainValue', 'size', parseInt(e.target.value))} />
                </div>
                
                <div className="pt-4 border-t">
                     <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                            setCustomStyles({
                                bgColor: '',
                                textColor: '',
                                title: { color: '', size: 24, posX: 0, posY: 0 },
                                mainValue: { color: '', size: 48, posX: 0, posY: 0 },
                                subtitle: { color: '', size: 14, posX: 0, posY: 0 },
                                cuotas: { color: '', size: 14, posX: 0, posY: 0 },
                                fecha: { color: '', size: 14, posX: 0, posY: 0 },
                            });
                        }}
                     >
                        Restablecer Estilos
                     </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* --- FRONT SIDE --- */}
      <div
        className={cn(glassCardClasses, "items-center text-center justify-between group-hover:shadow-2xl group-hover:shadow-indigo-500/10")}
        style={{ 
            backgroundColor: customStyles.bgColor || undefined,
            backfaceVisibility: 'hidden',
        }}
      >
        {/* Reflection */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
        
        {/* Glow Activado por Hover del Grupo */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl mix-blend-multiply transition-all duration-700 group-hover:scale-125 group-hover:bg-indigo-500/20"></div>

        <h3 
          className="relative z-10 font-bold tracking-tight text-gray-900 mt-2"
          style={{
            color: customStyles.title.color || undefined,
            fontSize: `${customStyles.title.size}px`,
            transform: `translate(${customStyles.title.posX}%, ${customStyles.title.posY}%)`
          }}
        >
          {title}
        </h3>

        <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full">
          <p 
            className="font-light tracking-tighter text-gray-900 drop-shadow-sm tabular-nums leading-none"
            style={{
              color: customStyles.mainValue.color || undefined,
              fontSize: `${customStyles.mainValue.size}px`,
              transform: `translate(${customStyles.mainValue.posX}%, ${customStyles.mainValue.posY}%)`
            }}
          >
            {mainValue}
          </p>

          {showProgress && progressValue !== undefined && (
            <div className="w-full mt-6 px-4">
                 <Progress value={progressValue} className="h-2 bg-gray-200/50" />
            </div>
          )}
        </div>

        <div className="relative z-10 w-full">
            {cuotas && nextDate ? (
                <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                    <p style={{ color: customStyles.cuotas.color, fontSize: `${customStyles.cuotas.size}px` }}>
                        {cuotas.paid} / {cuotas.remaining} cuotas
                    </p>
                    <p style={{ color: customStyles.fecha.color, fontSize: `${customStyles.fecha.size}px` }}>
                        {nextDate}
                    </p>
                </div>
            ) : subtitle && (
                <p 
                    className="text-sm font-medium text-gray-500"
                    style={{
                        color: customStyles.subtitle.color,
                        fontSize: `${customStyles.subtitle.size}px`,
                        transform: `translate(${customStyles.subtitle.posX}%, ${customStyles.subtitle.posY}%)`
                    }}
                >
                    {subtitle}
                </p>
            )}
        </div>
      </div>

      {/* --- BACK SIDE --- */}
      {backContent && (
        <div
          className={cn(glassCardClasses, "justify-center group-hover:shadow-2xl group-hover:shadow-indigo-500/10")}
          style={{ 
            backgroundColor: customStyles.bgColor || undefined,
            transform: 'rotateY(180deg)',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* Reflection */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>
          
           {/* Glow (También en la parte trasera) */}
           <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl mix-blend-multiply transition-all duration-700 group-hover:scale-125 group-hover:bg-indigo-500/20"></div>

          <h3 
            className="text-center font-bold mb-6 text-gray-900 relative z-10"
            style={{
              color: customStyles.title.color || undefined,
              fontSize: `${customStyles.title.size}px`
            }}
          >
            {title}
          </h3>
          
          <div className="flex-1 flex flex-col justify-center relative z-10 w-full">
            {renderBackContent()}
          </div>
        </div>
      )}
    </div>
  );
};