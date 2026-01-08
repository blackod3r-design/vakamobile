import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
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

interface FlipCardItem {
  name: string;
  progress: number;
}

interface FlipCardProps {
  title: string;
  count: number;
  progress: number;
  icon: LucideIcon;
  navigateTo: string;
  cardId: string;
  items: FlipCardItem[];
}

export const FlipCard: React.FC<FlipCardProps> = ({
  title,
  count,
  progress,
  icon: Icon,
  navigateTo,
  cardId,
  items,
}) => {
  const navigate = useNavigate();
  const { editMode } = useEditMode();
  const [isFlipped, setIsFlipped] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      
      if (newCount === 1) {
        // First click: flip
        setIsFlipped(prev => !prev);
        // Reset after a delay
        setTimeout(() => setClickCount(0), 500);
      } else if (newCount === 2) {
        // Second click: navigate
        navigate(navigateTo);
        setClickCount(0);
      }
      
      return newCount;
    });
  };

  const [customStyles, setCustomStyles] = useState(() => {
    const stored = localStorage.getItem(`dash30-card-${cardId}`);
    return stored ? JSON.parse(stored) : {
      bgColor: '',
      textColor: '',
      fontSize: 16,
      positionX: 0,
      positionY: 0,
    };
  });

  useEffect(() => {
    localStorage.setItem(`dash30-card-${cardId}`, JSON.stringify(customStyles));
  }, [customStyles, cardId]);

  const handleStyleChange = (key: string, value: string | number) => {
    setCustomStyles((prev: any) => ({ ...prev, [key]: value }));
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: customStyles.bgColor || undefined,
    color: customStyles.textColor || undefined,
    fontSize: `${customStyles.fontSize}px`,
  };

  const displayItems = items.slice(0, 5);

  return (
    <div
      className="relative h-full cursor-pointer"
      onClick={handleClick}
      style={{ perspective: '1000px' }}
    >
      {editMode && (
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="absolute top-2 right-2 z-10 p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-smooth"
              onClick={(e) => e.stopPropagation()}
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </DialogTrigger>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Personalizar {title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Color de fondo (HEX o RGB)</Label>
                <Input
                  value={customStyles.bgColor}
                  onChange={(e) => handleStyleChange('bgColor', e.target.value)}
                  placeholder="#ffffff o rgb(255,255,255)"
                />
              </div>
              <div>
                <Label>Color de texto (HEX o RGB)</Label>
                <Input
                  value={customStyles.textColor}
                  onChange={(e) => handleStyleChange('textColor', e.target.value)}
                  placeholder="#000000 o rgb(0,0,0)"
                />
              </div>
              <div>
                <Label>Tamaño de texto (px)</Label>
                <Input
                  type="number"
                  value={customStyles.fontSize}
                  onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Posición horizontal (%)</Label>
                <Input
                  type="number"
                  value={customStyles.positionX}
                  onChange={(e) => handleStyleChange('positionX', parseInt(e.target.value))}
                  min="-100"
                  max="100"
                />
              </div>
              <div>
                <Label>Posición vertical (%)</Label>
                <Input
                  type="number"
                  value={customStyles.positionY}
                  onChange={(e) => handleStyleChange('positionY', parseInt(e.target.value))}
                  min="-100"
                  max="100"
                />
              </div>
              <Button
                onClick={() => {
                  setCustomStyles({
                    bgColor: '',
                    textColor: '',
                    fontSize: 16,
                    positionX: 0,
                    positionY: 0,
                  });
                }}
                variant="outline"
                className="w-full"
              >
                Restablecer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <div
        className={`relative w-full h-full transition-transform duration-500 preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden bg-card/50 backdrop-blur-md rounded-xl p-4 flex flex-col items-center justify-center gap-2"
          style={{ 
            ...cardStyle,
            backfaceVisibility: 'hidden',
            boxShadow: 'var(--card-shadow)',
            transform: `translate(${customStyles.positionX}%, ${customStyles.positionY}%)`
          }}
        >
          <Icon className="w-6 h-6 text-primary" />
          <p className="text-2xl font-bold">{count}</p>
          <p className="text-xs text-muted-foreground">{title}</p>
          <Progress value={progress} className="w-full h-1.5 mt-1" />
          <p className="text-sm font-bold text-primary">{progress.toFixed(0)}%</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 backface-hidden bg-card/50 backdrop-blur-md rounded-xl p-3 flex flex-col overflow-hidden"
          style={{ 
            ...cardStyle,
            transform: `rotateY(180deg) translate(${customStyles.positionX}%, ${customStyles.positionY}%)`,
            backfaceVisibility: 'hidden',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          <p className="text-xs text-muted-foreground mb-2 text-center">{title}</p>
          <div className="space-y-2 overflow-y-auto flex-1">
            {displayItems.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs truncate flex-1">{item.name}</p>
                  <p className="text-xs font-bold text-primary ml-2">{item.progress.toFixed(0)}%</p>
                </div>
                <Progress value={item.progress} className="h-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
