import React, { useState, useEffect, ReactNode } from 'react';
import { MoreVertical, RotateCcw } from 'lucide-react';
import { useEditMode } from '@/contexts/EditModeContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface CardConfig {
  bgColor: string;
  textColor: string;
  align: 'text-left' | 'text-center' | 'text-right';
  verticalAlign: 'justify-start' | 'justify-center' | 'justify-end';
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  rounded: boolean;
  shadow: 'none' | 'light' | 'medium' | 'strong';
  width: string;
  height: string;
  posX: number;
  posY: number;
}

interface EditableWrapperProps {
  id: string;
  children: ReactNode;
  defaultConfig?: Partial<CardConfig>;
  className?: string;
}

const defaultCardConfig: CardConfig = {
  bgColor: 'transparent',
  textColor: 'currentColor',
  align: 'text-left',
  verticalAlign: 'justify-start',
  fontSize: 16,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textDecoration: 'none',
  rounded: true,
  shadow: 'medium',
  width: 'auto',
  height: 'auto',
  posX: 50,
  posY: 50,
};

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
  id,
  children,
  defaultConfig = {},
  className = '',
}) => {
  const { editMode } = useEditMode();
  const [editing, setEditing] = useState(false);
  const [config, setConfig] = useState<CardConfig>(() => {
    const saved = localStorage.getItem(`cardConfig_${id}`);
    return saved ? JSON.parse(saved) : { ...defaultCardConfig, ...defaultConfig };
  });
  const [textColorInput, setTextColorInput] = useState<string>('');
  const [bgColorInput, setBgColorInput] = useState<string>('');

  useEffect(() => {
    localStorage.setItem(`cardConfig_${id}`, JSON.stringify(config));
  }, [config, id]);

  // Mantener sincronizados los inputs de texto de color con el config
  useEffect(() => {
    setTextColorInput(config.textColor);
    setBgColorInput(config.bgColor);
  }, [config.textColor, config.bgColor]);

  const handleReset = () => {
    setConfig({ ...defaultCardConfig, ...defaultConfig });
    setEditing(false);
  };

  const getShadowClass = (shadow: string) => {
    switch (shadow) {
      case 'strong':
        return 'shadow-[0_8px_20px_rgba(0,0,0,0.25)]';
      case 'medium':
        return 'shadow-[0_4px_12px_rgba(0,0,0,0.15)]';
      case 'light':
        return 'shadow-[0_2px_6px_rgba(0,0,0,0.1)]';
      default:
        return 'shadow-none';
    }
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-300',
        config.rounded ? 'rounded-2xl' : 'rounded-md',
        getShadowClass(config.shadow),
        className
      )}
      style={{
        backgroundColor: config.bgColor === 'transparent' ? undefined : config.bgColor,
        width: config.width === 'auto' ? undefined : config.width,
        height: config.height === 'auto' ? undefined : config.height,
        minHeight: '100px',
      }}
    >
      {editMode && (
        <button
          onClick={() => setEditing(!editing)}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-background/90 backdrop-blur-sm hover:bg-background shadow-md transition-all hover:scale-110"
        >
          <MoreVertical className="w-4 h-4 text-foreground" />
        </button>
      )}

      <div
        className={cn('absolute', config.align)}
        style={{
          top: `${config.posY}%`,
          left: `${config.posX}%`,
          color: config.textColor === 'currentColor' ? undefined : config.textColor,
          fontSize: `${config.fontSize}px`,
          fontWeight: config.fontWeight,
          fontStyle: config.fontStyle,
          textDecoration: config.textDecoration,
        }}
      >
        {children}
      </div>

      {editing && (
        <div 
          className="absolute top-12 right-2 bg-background/95 backdrop-blur-md shadow-elegant rounded-xl p-4 space-y-3 w-64 z-30 border border-border animate-fade-in"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Personalizar</h4>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              className="h-7 w-7"
              title="Restaurar valores predeterminados"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Alineación Horizontal</label>
            <select
              value={config.align}
              onChange={(e) => setConfig({ ...config, align: e.target.value as CardConfig['align'] })}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="text-left">Izquierda</option>
              <option value="text-center">Centro</option>
              <option value="text-right">Derecha</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Alineación Vertical</label>
            <select
              value={config.verticalAlign}
              onChange={(e) => setConfig({ ...config, verticalAlign: e.target.value as CardConfig['verticalAlign'] })}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="justify-start">Arriba</option>
              <option value="justify-center">Medio</option>
              <option value="justify-end">Abajo</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Tamaño de texto (px)</label>
            <input
              type="number"
              value={config.fontSize}
              onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) || 16 })}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              min="8"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Estilos de texto</label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={config.fontWeight === 'bold' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig({ ...config, fontWeight: config.fontWeight === 'bold' ? 'normal' : 'bold' })}
                className="flex-1"
              >
                <span className="font-bold">B</span>
              </Button>
              <Button
                type="button"
                variant={config.fontStyle === 'italic' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig({ ...config, fontStyle: config.fontStyle === 'italic' ? 'normal' : 'italic' })}
                className="flex-1"
              >
                <span className="italic">I</span>
              </Button>
              <Button
                type="button"
                variant={config.textDecoration === 'underline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setConfig({ ...config, textDecoration: config.textDecoration === 'underline' ? 'none' : 'underline' })}
                className="flex-1"
              >
                <span className="underline">U</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Posición Horizontal (%)</label>
            <input
              type="number"
              value={config.posX}
              onChange={(e) => setConfig({ ...config, posX: Number(e.target.value) || 0 })}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              min="0"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Posición Vertical (%)</label>
            <input
              type="number"
              value={config.posY}
              onChange={(e) => setConfig({ ...config, posY: Number(e.target.value) || 0 })}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              min="0"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Ancho</label>
            <input
              type="text"
              value={config.width}
              onChange={(e) => setConfig({ ...config, width: e.target.value })}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="auto, 350px, 90%"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Alto</label>
            <input
              type="text"
              value={config.height}
              onChange={(e) => setConfig({ ...config, height: e.target.value })}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="auto, 200px, 50%"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Color de texto (HEX)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.textColor === 'currentColor' ? '#000000' : textColorInput || '#000000'}
                onChange={(e) => setTextColorInput(e.target.value)}
                onBlur={() => {
                  const v = (textColorInput || '').trim();
                  if (v === '') {
                    setConfig({ ...config, textColor: 'currentColor' });
                    setTextColorInput('currentColor');
                  } else if (v === 'currentColor' || /^#[0-9A-Fa-f]{6}$/.test(v)) {
                    setConfig({ ...config, textColor: v });
                  } else {
                    setTextColorInput(config.textColor);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = (textColorInput || '').trim();
                    if (v === 'currentColor' || /^#[0-9A-Fa-f]{6}$/.test(v)) {
                      setConfig({ ...config, textColor: v });
                    }
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                className="w-12 h-10 border border-border rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={textColorInput}
                onChange={(e) => setTextColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = textColorInput.trim();
                    if (v === '') {
                      setConfig({ ...config, textColor: 'currentColor' });
                      setTextColorInput('currentColor');
                    } else if (v === 'currentColor' || /^#[0-9A-Fa-f]{6}$/.test(v)) {
                      setConfig({ ...config, textColor: v });
                    }
                  }
                }}
                onBlur={() => {
                  const v = textColorInput.trim();
                  if (v === '') {
                    setConfig({ ...config, textColor: 'currentColor' });
                    setTextColorInput('currentColor');
                  } else if (v === 'currentColor' || /^#[0-9A-Fa-f]{6}$/.test(v)) {
                    setConfig({ ...config, textColor: v });
                  } else {
                    // Revertir si es inválido
                    setTextColorInput(config.textColor);
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="#000000"
                maxLength={7}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Color de fondo (HEX)</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={config.bgColor === 'transparent' ? '#ffffff' : bgColorInput || config.bgColor}
                onChange={(e) => setBgColorInput(e.target.value)}
                onBlur={() => {
                  const v = (bgColorInput || '').trim();
                  if (v === '') {
                    setConfig({ ...config, bgColor: 'transparent' });
                    setBgColorInput('transparent');
                  } else if (v === 'transparent' || /^#[0-9A-Fa-f]{6}$/.test(v)) {
                    setConfig({ ...config, bgColor: v });
                  } else {
                    setBgColorInput(config.bgColor);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = (bgColorInput || '').trim();
                    if (v === 'transparent' || /^#[0-9A-Fa-f]{6}$/.test(v)) {
                      setConfig({ ...config, bgColor: v });
                    }
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                className="w-12 h-10 border border-border rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={bgColorInput}
                onChange={(e) => setBgColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const v = bgColorInput.trim();
                    if (v === '') {
                      setConfig({ ...config, bgColor: 'transparent' });
                      setBgColorInput('transparent');
                    } else if (v === 'transparent' || /^#[0-9A-Fa-f]{6}$/.test(v)) {
                      setConfig({ ...config, bgColor: v });
                    }
                  }
                }}
                onBlur={() => {
                  const v = bgColorInput.trim();
                  if (v === '') {
                    setConfig({ ...config, bgColor: 'transparent' });
                    setBgColorInput('transparent');
                  } else if (v === 'transparent' || /^#[0-9A-Fa-f]{6}$/.test(v)) {
                    setConfig({ ...config, bgColor: v });
                  } else {
                    setBgColorInput(config.bgColor);
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onFocus={(e) => e.stopPropagation()}
                className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="transparent"
                maxLength={7}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Bordes</label>
            <select
              value={config.rounded ? 'rounded' : 'square'}
              onChange={(e) => setConfig({ ...config, rounded: e.target.value === 'rounded' })}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="rounded">Redondeado</option>
              <option value="square">Cuadrado</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Sombra</label>
            <select
              value={config.shadow}
              onChange={(e) => setConfig({ ...config, shadow: e.target.value as CardConfig['shadow'] })}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="none">Sin sombra</option>
              <option value="light">Ligera</option>
              <option value="medium">Media</option>
              <option value="strong">Fuerte</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
