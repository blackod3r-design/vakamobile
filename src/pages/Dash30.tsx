import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Target, CheckSquare, Edit2, Wallet } from 'lucide-react';
import { Dash30Card } from '@/components/Dash30Card';
import { FlipCard } from '@/components/FlipCard';
import { TipoCambioCard } from '@/components/TipoCambioCard';
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

const Dash30 = () => {
  const navigate = useNavigate();
  const { editMode } = useEditMode();
  const { accounts, creditCards, mortgage, goals, milesPoints, properties, tasks, loans, wallets } = useData();

  // Customization for "Saldo disponible" - separate for text and number
  const [saldoTextStyles, setSaldoTextStyles] = useState(() => {
    const stored = localStorage.getItem('dash30-saldo-text-styles');
    return stored ? JSON.parse(stored) : {
      textColor: '',
      fontSize: 20,
      positionX: 0,
      positionY: 0,
    };
  });

  const [saldoNumberStyles, setSaldoNumberStyles] = useState(() => {
    const stored = localStorage.getItem('dash30-saldo-number-styles');
    return stored ? JSON.parse(stored) : {
      textColor: '',
      fontSize: 60,
      positionX: 0,
      positionY: 0,
    };
  });

  useEffect(() => {
    localStorage.setItem('dash30-saldo-text-styles', JSON.stringify(saldoTextStyles));
  }, [saldoTextStyles]);

  useEffect(() => {
    localStorage.setItem('dash30-saldo-number-styles', JSON.stringify(saldoNumberStyles));
  }, [saldoNumberStyles]);

  const handleSaldoTextStyleChange = (key: string, value: string | number) => {
    setSaldoTextStyles((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSaldoNumberStyleChange = (key: string, value: string | number) => {
    setSaldoNumberStyles((prev: any) => ({ ...prev, [key]: value }));
  };

  // Calculate totals
  const accountsUSD = accounts.filter(acc => acc.currency === '$');
  const accountsPEN = accounts.filter(acc => acc.currency === 'S/');
  const totalSavingsUSD = accountsUSD.reduce((sum, acc) => sum + acc.balance, 0);
  const totalSavingsPEN = accountsPEN.reduce((sum, acc) => sum + acc.balance, 0);

  const accountsItems = accounts.map(acc => ({
    name: `${acc.name} (${acc.currency})`,
    balance: acc.balance,
    currency: acc.currency
  }));

  // Mortgage
  const totalMortgagePaid = mortgage.pagos?.reduce((sum, pago) => sum + pago.cuotaPagada, 0) || 0;
  const remainingMortgage = (mortgage.totalAmount || 0) - totalMortgagePaid;
  const mortgageProgress = mortgage.totalAmount > 0 
    ? ((totalMortgagePaid / mortgage.totalAmount) * 100) 
    : 0;
  const paidMonths = mortgage.pagos?.length || 0;
  const remainingMonths = (mortgage.plazoMeses || 0) - paidMonths;
  const nextMortgagePayment = mortgage.pagos?.[mortgage.pagos.length - 1]?.fecha || 'N/A';

  // Credit cards
  const totalCreditDebt = creditCards.reduce((sum, card) => sum + card.balance, 0);
  const totalCreditLimit = creditCards.reduce((sum, card) => sum + card.limit, 0);
  const creditUsagePercent = totalCreditLimit > 0 ? (totalCreditDebt / totalCreditLimit) * 100 : 0;
  const nextCreditPayment = creditCards.length > 0
    ? creditCards.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0]?.dueDate || 'N/A'
    : 'N/A';

  // Miles and points
  const totalMilesPoints = milesPoints?.programs?.reduce((sum, program) => sum + program.points, 0) || 0;
  const programsCount = milesPoints?.programs?.length || 0;

  // Tasks
  const tasksProgress = tasks.length > 0
    ? (tasks.reduce((sum, task) => {
        const completed = task.subtasks.filter(st => st.completed).length;
        return sum + (task.subtasks.length > 0 ? (completed / task.subtasks.length) * 100 : 0);
      }, 0) / tasks.length)
    : 0;

  const tasksItems = tasks.map(task => {
    const completed = task.subtasks.filter(st => st.completed).length;
    const progress = task.subtasks.length > 0 ? (completed / task.subtasks.length) * 100 : 0;
    return {
      name: task.name,
      value: `${progress.toFixed(0)}%`,
      subtitle: `${completed}/${task.subtasks.length} completadas`
    };
  });

  // Goals
  const goalsProgress = goals.length > 0
    ? (goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount) * 100, 0) / goals.length)
    : 0;

  const goalsItems = goals.map(goal => {
    const progress = (goal.currentAmount / goal.targetAmount) * 100;
    return {
      name: goal.name,
      value: `${progress.toFixed(0)}%`,
      subtitle: `${goal.currency}${goal.currentAmount.toLocaleString()} / ${goal.currency}${goal.targetAmount.toLocaleString()}`
    };
  });

  // Loans
  const totalLoansAmount = loans.reduce((sum, loan) => sum + loan.saldoActual, 0);
  const totalLoansPaid = loans.reduce((sum, loan) => sum + loan.cuotasPagadas, 0);
  const totalLoansPayments = loans.reduce((sum, loan) => sum + loan.plazoMeses, 0);
  const loansProgress = totalLoansPayments > 0 ? ((totalLoansPaid / totalLoansPayments) * 100) : 0;
  const nextLoanPayment = loans.length > 0
    ? (() => {
        const nextPayments = loans
          .map(loan => loan.cronograma.find(p => !p.pagado))
          .filter(Boolean)
          .sort((a, b) => new Date(a!.fecha).getTime() - new Date(b!.fecha).getTime());
        return nextPayments[0]?.fecha || 'N/A';
      })()
    : 'N/A';

  // Properties
  const totalPropertiesValue = properties.reduce((sum, prop) => sum + prop.estimatedValue, 0);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 animate-fade-in overflow-auto scrollbar-hide">
      {/* Header with exchange rate */}
      <div className="flex-shrink-0 mb-6 flex justify-end">
        <TipoCambioCard />
      </div>

      {/* Main balance section */}
      <div className="flex-shrink-0 text-center mb-12 relative">
        {editMode && (
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="absolute top-0 right-0 z-20 p-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-smooth"
                onClick={(e) => e.stopPropagation()}
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </DialogTrigger>
            <DialogContent onClick={(e) => e.stopPropagation()}>
              <DialogHeader>
                <DialogTitle>Personalizar Saldo Disponible</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="text">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">Texto</TabsTrigger>
                  <TabsTrigger value="number">Número</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label>Color de texto (HEX o RGB)</Label>
                    <Input
                      value={saldoTextStyles.textColor}
                      onChange={(e) => handleSaldoTextStyleChange('textColor', e.target.value)}
                      placeholder="#000000 o rgb(0,0,0)"
                    />
                  </div>
                  <div>
                    <Label>Tamaño de texto (px)</Label>
                    <Input
                      type="number"
                      value={saldoTextStyles.fontSize}
                      onChange={(e) => handleSaldoTextStyleChange('fontSize', parseInt(e.target.value) || 20)}
                    />
                  </div>
                  <div>
                    <Label>Posición horizontal (%)</Label>
                    <Input
                      type="number"
                      value={saldoTextStyles.positionX}
                      onChange={(e) => handleSaldoTextStyleChange('positionX', parseInt(e.target.value) || 0)}
                      min="-100"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label>Posición vertical (%)</Label>
                    <Input
                      type="number"
                      value={saldoTextStyles.positionY}
                      onChange={(e) => handleSaldoTextStyleChange('positionY', parseInt(e.target.value) || 0)}
                      min="-100"
                      max="100"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="number" className="space-y-4">
                  <div>
                    <Label>Color de número (HEX o RGB)</Label>
                    <Input
                      value={saldoNumberStyles.textColor}
                      onChange={(e) => handleSaldoNumberStyleChange('textColor', e.target.value)}
                      placeholder="#000000 o rgb(0,0,0)"
                    />
                  </div>
                  <div>
                    <Label>Tamaño de número (px)</Label>
                    <Input
                      type="number"
                      value={saldoNumberStyles.fontSize}
                      onChange={(e) => handleSaldoNumberStyleChange('fontSize', parseInt(e.target.value) || 60)}
                    />
                  </div>
                  <div>
                    <Label>Posición horizontal (%)</Label>
                    <Input
                      type="number"
                      value={saldoNumberStyles.positionX}
                      onChange={(e) => handleSaldoNumberStyleChange('positionX', parseInt(e.target.value) || 0)}
                      min="-100"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label>Posición vertical (%)</Label>
                    <Input
                      type="number"
                      value={saldoNumberStyles.positionY}
                      onChange={(e) => handleSaldoNumberStyleChange('positionY', parseInt(e.target.value) || 0)}
                      min="-100"
                      max="100"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              
              <Button
                onClick={() => {
                  setSaldoTextStyles({
                    textColor: '',
                    fontSize: 20,
                    positionX: 0,
                    positionY: 0,
                  });
                  setSaldoNumberStyles({
                    textColor: '',
                    fontSize: 60,
                    positionX: 0,
                    positionY: 0,
                  });
                }}
                variant="outline"
                className="w-full"
              >
                Restablecer
              </Button>
            </DialogContent>
          </Dialog>
        )}
        <h1 
          className="text-xl text-muted-foreground mb-4"
          style={{
            color: saldoTextStyles.textColor || undefined,
            fontSize: `${saldoTextStyles.fontSize}px`,
            transform: `translate(${saldoTextStyles.positionX}%, ${saldoTextStyles.positionY}%)`
          }}
        >
          Saldo disponible
        </h1>
        <div 
          className="text-5xl md:text-6xl font-bold"
          style={{
            color: saldoNumberStyles.textColor || undefined,
            fontSize: `${saldoNumberStyles.fontSize}px`,
            transform: `translate(${saldoNumberStyles.positionX}%, ${saldoNumberStyles.positionY}%)`
          }}
        >
          <span>S/ {totalSavingsPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
          <span className="mx-4 text-muted-foreground">/</span>
          <span>$ {totalSavingsUSD.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Cards grid - 3 columns, 2 rows with proper spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-12 auto-rows-fr">
        {/* Row 1 - Each takes 2 columns (3 cards = 6 columns total) */}
        <div className="lg:col-span-2 min-h-[280px]">
          <Dash30Card
            cardId="accounts-soles"
            title="Cuentas Soles"
            mainValue={`S/ ${totalSavingsPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
            subtitle={`${accountsPEN.length} ${accountsPEN.length === 1 ? 'cuenta' : 'cuentas'}`}
            onClick={() => navigate('/accounts')}
          />
        </div>

        <div className="lg:col-span-2 min-h-[280px]">
          <Dash30Card
            cardId="accounts-dollars"
            title="Cuentas Dólares"
            mainValue={`$ ${totalSavingsUSD.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
            subtitle={`${accountsUSD.length} ${accountsUSD.length === 1 ? 'cuenta' : 'cuentas'}`}
            onClick={() => navigate('/accounts')}
          />
        </div>

        <div className="lg:col-span-2 min-h-[280px]">
          <Dash30Card
            cardId="mortgage"
            title="Hipoteca"
            mainValue={`${mortgage.currency}${remainingMortgage.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`}
            subtitle={`${paidMonths} / ${remainingMonths} cuotas | Próximo: ${nextMortgagePayment}`}
            showProgress
            progressValue={mortgageProgress}
            onClick={() => navigate('/mortgage')}
          />
        </div>

        {/* Row 2 */}
        <div className="lg:col-span-2 min-h-[280px]">
          <Dash30Card
            cardId="cards"
            title="Tarjetas"
            mainValue={`-$${totalCreditDebt.toLocaleString()}`}
            subtitle={`${creditCards.length} / ${creditCards.length} cuotas | Próximo: ${nextCreditPayment}`}
            onClick={() => navigate('/cards')}
          />
        </div>

        <div className="lg:col-span-2 min-h-[280px]">
          <Dash30Card
            cardId="miles"
            title="Millas y Puntos"
            mainValue={totalMilesPoints.toLocaleString()}
            subtitle={`${programsCount} ${programsCount === 1 ? 'programa' : 'programas'}`}
            onClick={() => navigate('/miles')}
          />
        </div>

        {/* Row 3 - Tasks, Goals, Loans, Properties, Wallets */}
        <div className="lg:col-span-1 min-h-[280px]">
          <Dash30Card
            cardId="tasks"
            title="Tareas"
            mainValue={`${tasks.length}`}
            subtitle={`Progreso: ${tasksProgress.toFixed(0)}%`}
            showProgress
            progressValue={tasksProgress}
            onClick={() => navigate('/tasks')}
          />
        </div>
        
        <div className="lg:col-span-1 min-h-[280px]">
          <Dash30Card
            cardId="goals"
            title="Metas"
            mainValue={`${goals.length}`}
            subtitle={`Progreso: ${goalsProgress.toFixed(0)}%`}
            showProgress
            progressValue={goalsProgress}
            onClick={() => navigate('/goals')}
          />
        </div>

        <div className="lg:col-span-2 min-h-[280px]">
          <Dash30Card
            cardId="loans"
            title="Préstamos"
            mainValue={`$${totalLoansAmount.toLocaleString()}`}
            subtitle={`${totalLoansPaid} / ${totalLoansPayments} cuotas | Próximo: ${nextLoanPayment}`}
            showProgress
            progressValue={loansProgress}
            onClick={() => navigate('/loans')}
          />
        </div>

        <div className="lg:col-span-2 min-h-[280px]">
          <Dash30Card
            cardId="properties"
            title="Propiedades"
            mainValue={`$${totalPropertiesValue.toLocaleString()}`}
            subtitle={`${properties.length} ${properties.length === 1 ? 'propiedad' : 'propiedades'}`}
            onClick={() => navigate('/properties')}
          />
        </div>

        {/* Wallets Section - Individual Cards */}
        <div className="lg:col-span-2 min-h-[280px]">
          <h3 className="text-lg font-semibold mb-4 text-muted-foreground">Billeteras</h3>
          {wallets.length === 0 ? (
            <div 
              className="flex flex-col items-center justify-center h-[200px] text-muted-foreground bg-card/50 backdrop-blur-md rounded-2xl cursor-pointer hover:scale-[1.02] transition-all duration-300"
              style={{ boxShadow: 'var(--card-shadow)' }}
              onClick={() => navigate('/wallets')}
            >
              <Wallet className="w-12 h-12 mb-2" />
              <p className="text-sm">No hay billeteras</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-card/50 backdrop-blur-md cursor-pointer hover:scale-[1.02] transition-all duration-300"
                  style={{ boxShadow: 'var(--card-shadow)' }}
                  onClick={() => navigate('/wallets')}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: wallet.color }}
                    >
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{wallet.name}</p>
                      <p className="text-xs text-muted-foreground">{wallet.movimientos.length} mov.</p>
                    </div>
                  </div>
                  <p className="font-bold" style={{ color: wallet.color }}>
                    {wallet.currency}{wallet.saldo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dash30;
