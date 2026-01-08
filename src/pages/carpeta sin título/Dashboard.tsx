import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, CreditCard, Home as HomeIcon, Target, Plane, TrendingUp, Building2, AlertCircle, CheckSquare, GripVertical, RefreshCw, HandCoins } from 'lucide-react';
import DashboardCard from '@/components/DashboardCard';
import { Card } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSunatExchangeRate } from '@/hooks/useSunatExchangeRate';

const Dashboard = () => {
  const navigate = useNavigate();
  const { accounts, creditCards, mortgage, goals, milesPoints, properties, tasks, loans, wallets } = useData();
  const { dashboardFontSize } = useTheme();
  const { exchangeRate, loading: loadingRate, isRefreshing, refresh } = useSunatExchangeRate();

  // Separar cuentas por moneda
  const accountsUSD = accounts.filter(acc => acc.currency === '$');
  const accountsPEN = accounts.filter(acc => acc.currency === 'S/');
  const totalSavingsUSD = accountsUSD.reduce((sum, acc) => sum + acc.balance, 0);
  const totalSavingsPEN = accountsPEN.reduce((sum, acc) => sum + acc.balance, 0);

  const totalCreditDebt = creditCards.reduce((sum, card) => sum + card.balance, 0);
  const mortgageProgress = mortgage.totalAmount > 0 
    ? ((mortgage.paidAmount / mortgage.totalAmount) * 100).toFixed(1) 
    : '0';
  const totalGoalsProgress = goals.length > 0
    ? (goals.reduce((sum, goal) => sum + (goal.currentAmount / goal.targetAmount) * 100, 0) / goals.length).toFixed(0)
    : '0';
  const totalPropertiesValue = properties.reduce((sum, prop) => sum + prop.estimatedValue, 0);
  const totalMilesPoints = milesPoints?.programs?.reduce((sum, program) => sum + program.points, 0) || 0;

  // Calcular progreso de tareas
  const tasksProgress = tasks.length > 0
    ? (tasks.reduce((sum, task) => {
        const completed = task.subtasks.filter(st => st.completed).length;
        return sum + (task.subtasks.length > 0 ? (completed / task.subtasks.length) * 100 : 0);
      }, 0) / tasks.length).toFixed(0)
    : '0';

  // Calcular datos de préstamos
  const totalLoansAmount = loans.reduce((sum, loan) => sum + loan.saldoActual, 0);
  const totalLoansPaid = loans.reduce((sum, loan) => sum + loan.cuotasPagadas, 0);
  const totalLoansPayments = loans.reduce((sum, loan) => sum + loan.plazoMeses, 0);
  const loansProgress = totalLoansPayments > 0 ? ((totalLoansPaid / totalLoansPayments) * 100).toFixed(0) : '0';

  // Calcular datos de billeteras
  const totalWalletsAmount = wallets.reduce((sum, wallet) => {
    // Convertir todo a dólares para el total (simplificado)
    const amount = wallet.currency === '$' ? wallet.saldo : wallet.saldo / 3.75;
    return sum + amount;
  }, 0);
  const latestWalletMovement = wallets
    .flatMap(w => w.movimientos.map(m => ({ ...m, walletName: w.name })))
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];


  // Check for upcoming credit card payments (within 7 days)
  const upcomingPayments = creditCards.filter(card => {
    const daysUntil = Math.ceil((new Date(card.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  });

  const fontSizeClass = dashboardFontSize === 'small' ? 'text-sm' : dashboardFontSize === 'large' ? 'text-lg' : 'text-base';

  // Cards configuration
  const defaultCardOrder = [
    {
      id: 'accounts-usd',
      title: "Cuentas en Dólares",
      getValue: () => `$${totalSavingsUSD.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      subtitle: `${accountsUSD.length} ${accountsUSD.length === 1 ? 'cuenta' : 'cuentas'}`,
      icon: Wallet,
      trend: "up" as const,
      trendValue: "USD",
      onClick: () => navigate('/accounts'),
      gradient: true
    },
    {
      id: 'accounts-pen',
      title: "Cuentas en Soles",
      getValue: () => `S/${totalSavingsPEN.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      subtitle: `${accountsPEN.length} ${accountsPEN.length === 1 ? 'cuenta' : 'cuentas'}`,
      icon: Wallet,
      trend: "up" as const,
      trendValue: "PEN",
      onClick: () => navigate('/accounts'),
      gradient: true
    },
    {
      id: 'credit-cards',
      title: "Tarjetas de Crédito",
      getValue: () => `$${totalCreditDebt.toLocaleString()}`,
      subtitle: `${creditCards.length} tarjetas`,
      icon: CreditCard,
      onClick: () => navigate('/cards')
    },
    {
      id: 'mortgage',
      title: "Hipoteca",
      getValue: () => {
        const totalPagado = mortgage.pagos?.reduce((sum, pago) => sum + pago.cuotaPagada, 0) || 0;
        return `${mortgage.currency}${totalPagado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
      },
      subtitle: (() => {
        const mesesPagados = mortgage.pagos?.length || 0;
        const mesesRestantes = (mortgage.plazoMeses || 0) - mesesPagados;
        return `Pagados: ${mesesPagados} / ${mortgage.plazoMeses || 0} meses`;
      })(),
      icon: HomeIcon,
      trend: "up" as const,
      trendValue: `${mortgageProgress}%`,
      onClick: () => navigate('/mortgage')
    },
    {
      id: 'loans',
      title: "Préstamos",
      getValue: () => `${loansProgress}%`,
      subtitle: `${totalLoansPaid} / ${totalLoansPayments} cuotas pagadas`,
      icon: HandCoins,
      trend: "up" as const,
      trendValue: `$${totalLoansAmount.toLocaleString()}`,
      onClick: () => navigate('/loans'),
      gradient: true
    },
    {
      id: 'wallets',
      title: "Billeteras",
      getValue: () => `$${totalWalletsAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      subtitle: latestWalletMovement 
        ? `Último: ${latestWalletMovement.tipo === 'deposito' ? '+' : '-'}$${latestWalletMovement.monto.toLocaleString()} en ${latestWalletMovement.walletName}`
        : `${wallets.length} ${wallets.length === 1 ? 'billetera' : 'billeteras'}`,
      icon: Wallet,
      onClick: () => navigate('/wallets'),
      gradient: true
    },
    {
      id: 'goals',
      title: "Metas",
      getValue: () => `${totalGoalsProgress}%`,
      subtitle: `${goals.length} metas activas`,
      icon: Target,
      onClick: () => navigate('/goals')
    },
    {
      id: 'tasks',
      title: "Tareas",
      getValue: () => `${tasksProgress}%`,
      subtitle: `${tasks.length} ${tasks.length === 1 ? 'tarea activa' : 'tareas activas'}`,
      icon: CheckSquare,
      onClick: () => navigate('/tasks')
    },
    {
      id: 'properties',
      title: "Propiedades",
      getValue: () => `$${totalPropertiesValue.toLocaleString()}`,
      subtitle: `${properties.length} propiedades`,
      icon: Building2,
      trend: "up" as const,
      onClick: () => navigate('/properties'),
      gradient: true
    },
    {
      id: 'miles',
      title: "Millas y Puntos",
      getValue: () => totalMilesPoints.toLocaleString(),
      subtitle: `${milesPoints?.programs?.length || 0} programas`,
      icon: Plane,
      onClick: () => navigate('/miles')
    }
  ];

  const defaultIds = defaultCardOrder.map(c => c.id);
  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('dashboardCardOrder');
      const parsed: unknown = stored ? JSON.parse(stored) : null;
      const base = Array.isArray(parsed) ? (parsed as string[]) : [];
      const cleaned = base.filter((id) => defaultIds.includes(id));
      const missing = defaultIds.filter((id) => !cleaned.includes(id));
      return [...cleaned, ...missing];
    } catch {
      return defaultIds;
    }
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    localStorage.setItem('dashboardCardOrder', JSON.stringify(cardOrder));
  }, [cardOrder]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newOrder = [...cardOrder];
    const [draggedCard] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedCard);

    setCardOrder(newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const orderedCards = cardOrder.map(id => defaultCardOrder.find(c => c.id === id)).filter(Boolean);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col p-4 md:p-6 animate-fade-in overflow-hidden">
      <div className="flex-shrink-0 mb-4 md:mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">VAKA FINANCIERO</h1>
        </div>
        <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md rounded-xl px-3 md:px-4 py-2 md:py-3" style={{ boxShadow: 'var(--card-shadow)' }}>
          {loadingRate ? (
            <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">USD/PEN</p>
                <p className="font-bold text-primary">S/ {exchangeRate?.venta.toFixed(3)}</p>
              </div>
              <button
                onClick={refresh}
                disabled={isRefreshing}
                className="p-1.5 hover:bg-accent rounded-lg transition-smooth disabled:opacity-50"
                title="Actualizar tipo de cambio"
              >
                <RefreshCw className={`w-4 h-4 text-muted-foreground hover:text-primary transition-smooth ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 auto-rows-fr overflow-auto"
           style={{ gridAutoRows: 'minmax(0, 1fr)' }}>
        {orderedCards.map((card, index) => {
          if (!card) return null;
          return (
            <div
              key={card.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative ${dragOverIndex === index ? 'opacity-50' : ''}`}
            >
              <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5 text-muted-foreground/50 hover:text-muted-foreground" />
              </div>
              <DashboardCard
                title={card.title}
                value={card.getValue()}
                subtitle={card.subtitle}
                icon={card.icon}
                trend={card.trend}
                trendValue={card.trendValue}
                onClick={card.onClick}
                gradient={card.gradient}
                cardId={card.id}
              />
            </div>
          );
        })}
      </div>

      {upcomingPayments.length > 0 && (
        <div className="flex-shrink-0 mt-4 md:mt-6">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">Próximos Pagos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {upcomingPayments.map((card) => {
              const daysUntil = Math.ceil((new Date(card.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
              return (
                <Card
                  key={card.id}
                  onClick={() => navigate('/cards')}
                  className="p-4 hover:shadow-elegant transition-smooth cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-smooth">{card.name}</h3>
                        <p className="text-sm text-muted-foreground">Tarjeta de Crédito</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-orange-500">{card.currency}{card.balance.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Vence en {daysUntil} {daysUntil === 1 ? 'día' : 'días'}
                      </p>
                    </div>
                    <CreditCard className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-smooth" />
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
