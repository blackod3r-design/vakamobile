import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

interface ExportOptions {
  title: string;
  subtitle?: string;
  filename: string;
}

interface MovementRow {
  fecha: string;
  descripcion: string;
  tipo: string;
  monto: string;
}

export type ExportFormat = 'pdf' | 'excel';

// Helper para guardar archivo con selector de ubicación
const saveFileWithPicker = async (
  blob: Blob,
  filename: string,
  extension: 'pdf' | 'xlsx'
): Promise<boolean> => {
  // Verificar si la API está disponible
  if ('showSaveFilePicker' in window) {
    try {
      const options = {
        suggestedName: `${filename}.${extension}`,
        types: [
          extension === 'pdf'
            ? {
                description: 'Documento PDF',
                accept: { 'application/pdf': ['.pdf'] },
              }
            : {
                description: 'Archivo Excel',
                accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
              },
        ],
      };

      // @ts-ignore - showSaveFilePicker no está en todos los tipos de TypeScript
      const handle = await window.showSaveFilePicker(options);
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (error: any) {
      // Si el usuario cancela, no mostrar error
      if (error.name === 'AbortError') {
        return false;
      }
      console.error('Error using file picker:', error);
      // Fallback al método tradicional
    }
  }

  // Fallback: descarga directa
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${extension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
};

export const useExport = () => {
  const exportToPdf = async (
    data: MovementRow[],
    options: ExportOptions
  ) => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(options.title, 14, 22);
      
      if (options.subtitle) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(options.subtitle, 14, 30);
      }
      
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, options.subtitle ? 38 : 30);
      
      autoTable(doc, {
        startY: options.subtitle ? 45 : 38,
        head: [['Fecha', 'Descripción', 'Tipo', 'Monto']],
        body: data.map(row => [row.fecha, row.descripcion, row.tipo, row.monto]),
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 30 },
          3: { cellWidth: 35, halign: 'right' },
        },
      });
      
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
      
      const blob = doc.output('blob');
      const saved = await saveFileWithPicker(blob, options.filename, 'pdf');
      if (saved) {
        toast.success('PDF exportado exitosamente');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al exportar PDF');
    }
  };

  const exportToExcel = async (
    data: MovementRow[],
    options: ExportOptions
  ) => {
    try {
      const ws = XLSX.utils.json_to_sheet(data.map(row => ({
        'Fecha': row.fecha,
        'Descripción': row.descripcion,
        'Tipo': row.tipo,
        'Monto': row.monto,
      })));
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
      
      ws['!cols'] = [
        { wch: 12 },
        { wch: 40 },
        { wch: 12 },
        { wch: 15 },
      ];
      
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const saved = await saveFileWithPicker(blob, options.filename, 'xlsx');
      if (saved) {
        toast.success('Excel exportado exitosamente');
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Error al exportar Excel');
    }
  };

  const exportAccountTransactions = async (
    accountName: string,
    currency: string,
    transactions: Array<{
      date: string;
      description: string;
      type: 'deposit' | 'withdrawal';
      amount: number;
    }>,
    format: ExportFormat = 'pdf'
  ) => {
    const data = transactions.map(t => ({
      fecha: new Date(t.date).toLocaleDateString('es-PE'),
      descripcion: t.description,
      tipo: t.type === 'deposit' ? 'Depósito' : 'Retiro',
      monto: `${t.type === 'deposit' ? '+' : '-'}${currency}${t.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
    }));

    const options = {
      title: `Movimientos - ${accountName}`,
      subtitle: `Total de movimientos: ${transactions.length}`,
      filename: `movimientos_${accountName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    };

    format === 'pdf' ? await exportToPdf(data, options) : await exportToExcel(data, options);
  };

  const exportWalletMovements = async (
    walletName: string,
    currency: string,
    movements: Array<{
      fecha: string;
      descripcion: string;
      tipo: 'deposito' | 'retiro';
      monto: number;
    }>,
    format: ExportFormat = 'pdf'
  ) => {
    const data = movements.map(m => ({
      fecha: new Date(m.fecha).toLocaleDateString('es-PE'),
      descripcion: m.descripcion || 'Sin descripción',
      tipo: m.tipo === 'deposito' ? 'Depósito' : 'Retiro',
      monto: `${m.tipo === 'deposito' ? '+' : '-'}${currency}${m.monto.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
    }));

    const options = {
      title: `Movimientos - ${walletName}`,
      subtitle: `Total de movimientos: ${movements.length}`,
      filename: `movimientos_billetera_${walletName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    };

    format === 'pdf' ? await exportToPdf(data, options) : await exportToExcel(data, options);
  };

  const exportCreditCardTransactions = async (
    cardName: string,
    currency: string,
    transactions: Array<{
      date: string;
      description: string;
      type: 'expense' | 'payment';
      amount: number;
    }>,
    format: ExportFormat = 'pdf'
  ) => {
    const data = transactions.map(t => ({
      fecha: new Date(t.date).toLocaleDateString('es-PE'),
      descripcion: t.description,
      tipo: t.type === 'expense' ? 'Gasto' : 'Pago',
      monto: `${t.type === 'expense' ? '+' : '-'}${currency}${t.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
    }));

    const options = {
      title: `Movimientos - ${cardName}`,
      subtitle: `Total de movimientos: ${transactions.length}`,
      filename: `movimientos_tarjeta_${cardName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    };

    format === 'pdf' ? await exportToPdf(data, options) : await exportToExcel(data, options);
  };

  const exportGoalMovements = async (
    goalName: string,
    currency: string,
    movements: Array<{
      date: string;
      type: 'deposit' | 'withdrawal';
      amount: number;
    }>,
    format: ExportFormat = 'pdf'
  ) => {
    const data = movements.map(m => ({
      fecha: new Date(m.date).toLocaleDateString('es-PE'),
      descripcion: m.type === 'deposit' ? 'Aporte a meta' : 'Retiro de meta',
      tipo: m.type === 'deposit' ? 'Aporte' : 'Retiro',
      monto: `${m.type === 'deposit' ? '+' : '-'}${currency}${m.amount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
    }));

    const options = {
      title: `Movimientos - ${goalName}`,
      subtitle: `Total de movimientos: ${movements.length}`,
      filename: `movimientos_meta_${goalName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`,
    };

    format === 'pdf' ? await exportToPdf(data, options) : await exportToExcel(data, options);
  };

  const exportLoanPayments = async (
    loanName: string,
    currency: string,
    payments: Array<{
      fecha: string;
      numeroCuota: number;
      cuota: number;
      capital: number;
      interes: number;
      pagado: boolean;
    }>,
    format: ExportFormat = 'pdf'
  ) => {
    const filename = `cronograma_${loanName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
    
    if (format === 'excel') {
      try {
        const ws = XLSX.utils.json_to_sheet(payments.map(p => ({
          '#': p.numeroCuota,
          'Fecha': new Date(p.fecha).toLocaleDateString('es-PE'),
          'Cuota': `${currency}${p.cuota.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
          'Capital': `${currency}${p.capital.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
          'Interés': `${currency}${p.interes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
          'Estado': p.pagado ? 'Pagado' : 'Pendiente',
        })));
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Cronograma');
        ws['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
        
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        
        const saved = await saveFileWithPicker(blob, filename, 'xlsx');
        if (saved) {
          toast.success('Excel exportado exitosamente');
        }
      } catch (error) {
        console.error('Error exporting Excel:', error);
        toast.error('Error al exportar Excel');
      }
      return;
    }

    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(`Cronograma - ${loanName}`, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 30);
      
      autoTable(doc, {
        startY: 38,
        head: [['#', 'Fecha', 'Cuota', 'Capital', 'Interés', 'Estado']],
        body: payments.map(p => [
          p.numeroCuota.toString(),
          new Date(p.fecha).toLocaleDateString('es-PE'),
          `${currency}${p.cuota.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
          `${currency}${p.capital.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
          `${currency}${p.interes.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
          p.pagado ? 'Pagado' : 'Pendiente',
        ]),
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });
      
      const blob = doc.output('blob');
      const saved = await saveFileWithPicker(blob, filename, 'pdf');
      if (saved) {
        toast.success('PDF exportado exitosamente');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al exportar PDF');
    }
  };

  return {
    exportToPdf,
    exportToExcel,
    exportAccountTransactions,
    exportWalletMovements,
    exportCreditCardTransactions,
    exportGoalMovements,
    exportLoanPayments,
  };
};

// Mantener compatibilidad con el nombre anterior
export const usePdfExport = useExport;
