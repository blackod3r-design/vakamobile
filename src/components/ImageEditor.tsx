import React, { useState, useEffect } from 'react';
import { ZoomIn, ZoomOut, Move, X, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PinConfirmDialog } from '@/components/PinConfirmDialog';

interface ImageEditorProps {
  imageUrl: string;
  alt: string;
  onRemove: () => void;
}

interface ImageState {
  scale: number;
  position: { x: number; y: number };
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ imageUrl, alt, onRemove }) => {
  // Generar una key única para el localStorage basada en la URL de la imagen
  const storageKey = `image-editor-${btoa(imageUrl).substring(0, 20)}`;

  // Cargar el estado guardado desde localStorage
  const loadSavedState = (): ImageState => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading image state:', error);
    }
    return { scale: 1, position: { x: 0, y: 0 } };
  };

  const savedState = loadSavedState();
  const [scale, setScale] = useState(savedState.scale);
  const [position, setPosition] = useState(savedState.position);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showPinDialog, setShowPinDialog] = useState(false);

  // Guardar el estado en localStorage cada vez que cambia
  useEffect(() => {
    const state: ImageState = { scale, position };
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving image state:', error);
    }
  }, [scale, position, storageKey]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleDeleteClick = () => {
    setShowPinDialog(true);
  };

  const handlePinSuccess = () => {
    setShowPinDialog(false);
    onRemove();
  };

  return (
    <div className="relative">
      <div className="relative w-full h-80 bg-muted rounded-xl overflow-hidden">
        <div
          className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={imageUrl}
            alt={alt}
            className="w-full h-full object-contain select-none"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
            draggable={false}
          />
        </div>
      </div>

      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 bg-background/90 backdrop-blur-sm hover:bg-background"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background">
            <DropdownMenuItem onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4 mr-2" />
              Acercar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4 mr-2" />
              Alejar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReset}>
              <Move className="h-4 w-4 mr-2" />
              Restablecer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteClick} className="text-destructive focus:text-destructive">
              <X className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 text-xs text-muted-foreground text-center">
        Arrastra para mover la imagen
      </div>

      <PinConfirmDialog
        isOpen={showPinDialog}
        onClose={() => setShowPinDialog(false)}
        onSuccess={handlePinSuccess}
        title="Confirmar Eliminación"
        description="Ingresa tu PIN para eliminar esta imagen"
      />
    </div>
  );
};
