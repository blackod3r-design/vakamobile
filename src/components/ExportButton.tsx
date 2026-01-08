import React from 'react';
import { FileDown, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ExportFormat } from '@/hooks/usePdfExport';

interface ExportButtonProps {
  onExport: (format: ExportFormat) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  variant = 'outline',
  size = 'sm',
  className = '',
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={`gap-2 ${className}`}>
          <FileDown className="w-4 h-4" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onExport('pdf')} className="gap-2 cursor-pointer">
          <FileText className="w-4 h-4 text-red-500" />
          Exportar a PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onExport('excel')} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 text-green-500" />
          Exportar a Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
