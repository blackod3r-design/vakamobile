import React, { useState, useEffect, useRef } from 'react';
import { LucideIcon, MoreVertical, Palette, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useEditMode } from '@/contexts/EditModeContext';
import { EditableWrapper } from './EditableWrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface DashboardCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down';
  trendValue?: string;
  onClick?: () => void;
  gradient?: boolean;
  cardId?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  onClick,
  gradient = false,
  cardId,
}) => {
  const { theme } = useTheme();
  const { editMode } = useEditMode();
  const finalCardId = cardId || title.toLowerCase().replace(/\s+/g, '-');
  const [customBgColor, setCustomBgColor] = useState<string>('');
  const [customBgImage, setCustomBgImage] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);
  const [tempBgColor, setTempBgColor] = useState<string>('');
  const colorPickerRef = useRef<HTMLDivElement | null>(null);
  const colorInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`card-custom-${finalCardId}`);
    if (stored) {
      const { bgColor, bgImage } = JSON.parse(stored);
      setCustomBgColor(bgColor || '');
      setCustomBgImage(bgImage || '');
    }
  }, [finalCardId]);

  const handleClick = (e: React.MouseEvent) => {
    if (!editMode && onClick) {
      onClick();
    }
  };

  const saveCustomization = (bgColor: string, bgImage: string) => {
    localStorage.setItem(`card-custom-${finalCardId}`, JSON.stringify({ bgColor, bgImage }));
  };

  const handleColorChange = (color: string) => {
    setTempBgColor(color);
  };
  const handleImageChange = (imageUrl: string) => {
    setCustomBgImage(imageUrl);
    saveCustomization(customBgColor, imageUrl);
    setShowImageInput(false);
  };

  const handleReset = () => {
    setCustomBgColor('');
    setCustomBgImage('');
    localStorage.removeItem(`card-custom-${finalCardId}`);
  };

  const commitColor = () => {
    const color = tempBgColor || '';
    setCustomBgColor(color);
    saveCustomization(color, customBgImage);
    setShowColorPicker(false);
  };

  useEffect(() => {
    if (!showColorPicker) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        commitColor();
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [showColorPicker, commitColor]);

  useEffect(() => {
    if (showColorPicker) {
      // Initialize temporary color and focus the input
      setTempBgColor(customBgColor || '#000000');
      setTimeout(() => colorInputRef.current?.focus(), 0);
    }
  }, [showColorPicker, customBgColor]);

  const getCardStyle = () => {
    const style: React.CSSProperties = {};
    if (customBgImage) {
      style.backgroundImage = `url(${customBgImage})`;
      style.backgroundSize = 'cover';
      style.backgroundPosition = 'center';
    } else if (customBgColor) {
      style.backgroundColor = customBgColor;
    }
    return style;
  };

  const hasCustomization = customBgColor || customBgImage;

  return (
    <div
      onClick={handleClick}
      style={{
        ...(hasCustomization ? getCardStyle() : undefined),
        boxShadow: !hasCustomization && !gradient ? 'var(--card-shadow)' : undefined
      }}
      className={cn(
        'rounded-2xl p-6 transition-smooth relative',
        !editMode && 'hover-lift cursor-pointer',
        !hasCustomization && (gradient 
          ? 'gradient-primary text-white' 
          : theme === 'glass' 
            ? 'glass-card' 
            : 'bg-card'),
        hasCustomization && 'bg-card'
      )}
    >
      {editMode && (
        <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "p-1.5 rounded-lg transition-smooth hover:bg-background/10",
                hasCustomization ? "text-white" : gradient ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground"
              )}>
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
              <DropdownMenuItem onClick={() => { setTempBgColor(customBgColor || '#000000'); setShowColorPicker((v) => !v); }} className="cursor-pointer">
                <Palette className="w-4 h-4 mr-2" />
                Color de fondo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowImageInput(!showImageInput)} className="cursor-pointer">
                <ImageIcon className="w-4 h-4 mr-2" />
                Imagen de fondo
              </DropdownMenuItem>
              {hasCustomization && (
                <DropdownMenuItem onClick={handleReset} className="cursor-pointer text-destructive">
                  <X className="w-4 h-4 mr-2" />
                  Restablecer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {showColorPicker && (
        <div
          ref={colorPickerRef}
          className="absolute top-14 right-3 z-30 bg-popover border border-border rounded-lg p-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <label className="text-xs font-medium">Seleccionar color</label>
            <Input
              ref={colorInputRef}
              type="color"
              value={tempBgColor || '#000000'}
              onChange={(e) => handleColorChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitColor();
                }
              }}
              className="w-full h-10 cursor-pointer"
            />
          </div>
        </div>
      )}

      {showImageInput && (
        <div className="absolute top-14 right-3 z-30 bg-popover border border-border rounded-lg p-3 shadow-lg" onClick={(e) => e.stopPropagation()}>
          <div className="space-y-2">
            <label className="text-xs font-medium">URL de la imagen</label>
            <Input
              type="text"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={customBgImage}
              onChange={(e) => setCustomBgImage(e.target.value)}
              className="w-full"
            />
            <button
              onClick={() => handleImageChange(customBgImage)}
              className="w-full px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col mb-4">
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-3',
          hasCustomization ? 'bg-white/20' : gradient ? 'bg-white/20' : 'bg-primary/10'
        )}>
          <Icon className={cn('w-6 h-6', hasCustomization || gradient ? 'text-white' : 'text-primary')} />
        </div>

        <EditableWrapper
          id={`${finalCardId}-title`}
          defaultConfig={{
            bgColor: 'transparent',
            textColor: hasCustomization || gradient ? 'rgba(255, 255, 255, 0.8)' : 'currentColor',
            align: 'text-center',
            fontSize: 14,
            rounded: false,
            shadow: 'none',
          }}
        >
          <h3 className={cn(
            'font-semibold mb-3',
            hasCustomization || gradient ? 'text-white/80' : 'text-muted-foreground'
          )}>
            {title}
          </h3>
        </EditableWrapper>
      </div>
      
      <div className="flex flex-col space-y-2">
        <EditableWrapper
          id={`${finalCardId}-value`}
          defaultConfig={{
            bgColor: 'transparent',
            textColor: hasCustomization || gradient ? '#ffffff' : 'currentColor',
            align: 'text-center',
            fontSize: 30,
            rounded: false,
            shadow: 'none',
          }}
        >
          <p className={cn(
            'text-3xl font-bold',
            hasCustomization || gradient ? 'text-white' : 'text-foreground'
          )}>
            {value}
          </p>
        </EditableWrapper>
        
        {subtitle && (
          <EditableWrapper
            id={`${finalCardId}-subtitle`}
            defaultConfig={{
              bgColor: 'transparent',
              textColor: hasCustomization || gradient ? 'rgba(255, 255, 255, 0.7)' : 'currentColor',
              align: 'text-center',
              fontSize: 14,
              rounded: false,
              shadow: 'none',
            }}
          >
            <p className={cn(
              'text-sm',
              hasCustomization || gradient ? 'text-white/70' : 'text-muted-foreground'
            )}>
              {subtitle}
            </p>
          </EditableWrapper>
        )}

        {trend && trendValue && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg mt-2',
            trend === 'up' 
              ? hasCustomization || gradient ? 'bg-white/20 text-white' : 'bg-success/10 text-success'
              : hasCustomization || gradient ? 'bg-white/20 text-white' : 'bg-destructive/10 text-destructive'
          )}>
            <span>{trend === 'up' ? '↑' : '↓'}</span>
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;
