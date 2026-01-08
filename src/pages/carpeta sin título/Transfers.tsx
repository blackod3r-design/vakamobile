import React, { useState } from 'react';
import { ArrowRight, Wallet, Target, CreditCard, ArrowLeftRight, ArrowDownUp } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type TransferType = 'account-to-account' | 'account-to-goal' | 'account-to-card' | 'goal-to-account' | 'card-to-account';

const Transfers = () => {
  const { accounts, goals, creditCards, addTransaction, updateAccount, updateGoal, addContribution, updateCreditCard } = useData();
  const { toast } = useToast();
  const [transferType, setTransferType] = useState<TransferType>('account-to-account');
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [amount, setAmount] = useState('');

  const handleTransfer = () => {
    const transferAmount = parseFloat(amount);
    if (!transferAmount || transferAmount <= 0) {
      toast({ title: 'Error', description: 'Ingresa un monto válido', variant: 'destructive' });
      return;
    }
    if (!fromId || !toId) {
      toast({ title: 'Error', description: 'Selecciona origen y destino', variant: 'destructive' });
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];

      switch (transferType) {
        case 'account-to-account': {
          const fromAccount = accounts.find(a => a.id === fromId);
          const toAccount = accounts.find(a => a.id === toId);
          if (!fromAccount || !toAccount) return;
          if (fromAccount.balance < transferAmount) {
            toast({ title: 'Error', description: 'Saldo insuficiente', variant: 'destructive' });
            return;
          }
          updateAccount(fromId, { balance: fromAccount.balance - transferAmount });
          updateAccount(toId, { balance: toAccount.balance + transferAmount });
          addTransaction({ accountId: fromId, amount: transferAmount, type: 'withdrawal', description: `Transferencia a ${toAccount.name}`, date: today });
          addTransaction({ accountId: toId, amount: transferAmount, type: 'deposit', description: `Transferencia desde ${fromAccount.name}`, date: today });
          break;
        }
        case 'account-to-goal': {
          const fromAccount = accounts.find(a => a.id === fromId);
          const toGoal = goals.find(g => g.id === toId);
          if (!fromAccount || !toGoal) return;
          if (fromAccount.balance < transferAmount) {
            toast({ title: 'Error', description: 'Saldo insuficiente', variant: 'destructive' });
            return;
          }
          updateAccount(fromId, { balance: fromAccount.balance - transferAmount });
          addContribution(toId, { amount: transferAmount, date: today });
          addTransaction({ accountId: fromId, amount: transferAmount, type: 'withdrawal', description: `Transferencia a meta ${toGoal.name}`, date: today });
          break;
        }
        case 'account-to-card': {
          const fromAccount = accounts.find(a => a.id === fromId);
          const toCard = creditCards.find(c => c.id === toId);
          if (!fromAccount || !toCard) return;
          if (fromAccount.balance < transferAmount) {
            toast({ title: 'Error', description: 'Saldo insuficiente', variant: 'destructive' });
            return;
          }
          updateAccount(fromId, { balance: fromAccount.balance - transferAmount });
          const newCardBalance = Math.max(0, toCard.balance - transferAmount);
          updateCreditCard(toId, { balance: newCardBalance });
          addTransaction({ accountId: fromId, amount: transferAmount, type: 'withdrawal', description: `Pago a tarjeta ${toCard.name}`, date: today });
          break;
        }
        case 'goal-to-account': {
          const fromGoal = goals.find(g => g.id === fromId);
          const toAccount = accounts.find(a => a.id === toId);
          if (!fromGoal || !toAccount) return;
          if (fromGoal.currentAmount < transferAmount) {
            toast({ title: 'Error', description: 'Saldo insuficiente en la meta', variant: 'destructive' });
            return;
          }
          updateGoal(fromId, { currentAmount: fromGoal.currentAmount - transferAmount });
          updateAccount(toId, { balance: toAccount.balance + transferAmount });
          addTransaction({ accountId: toId, amount: transferAmount, type: 'deposit', description: `Retiro de meta ${fromGoal.name}`, date: today });
          break;
        }
        case 'card-to-account': {
          const fromCard = creditCards.find(c => c.id === fromId);
          const toAccount = accounts.find(a => a.id === toId);
          if (!fromCard || !toAccount) return;
          const newCardBalance = fromCard.balance + transferAmount;
          if (newCardBalance > fromCard.limit) {
            toast({ title: 'Error', description: 'Excede el límite de la tarjeta', variant: 'destructive' });
            return;
          }
          updateCreditCard(fromId, { balance: newCardBalance });
          updateAccount(toId, { balance: toAccount.balance - transferAmount });
          addTransaction({ accountId: toId, amount: transferAmount, type: 'withdrawal', description: `Gasto con tarjeta ${fromCard.name}`, date: today });
          break;
        }
      }

      toast({ title: 'Éxito', description: 'Transferencia realizada correctamente' });
      setFromId('');
      setToId('');
      setAmount('');
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo completar la transferencia', variant: 'destructive' });
    }
  };

  const getSourceOptions = () => {
    switch (transferType) {
      case 'account-to-account':
      case 'account-to-goal':
      case 'account-to-card':
        return accounts;
      case 'goal-to-account':
        return goals;
      case 'card-to-account':
        return creditCards;
      default:
        return [];
    }
  };

  const getDestinationOptions = () => {
    switch (transferType) {
      case 'account-to-account':
      case 'goal-to-account':
      case 'card-to-account':
        return accounts.filter(a => a.id !== fromId);
      case 'account-to-goal':
        return goals;
      case 'account-to-card':
        return creditCards;
      default:
        return [];
    }
  };

  const getSourceIcon = () => {
    switch (transferType) {
      case 'goal-to-account': return Target;
      case 'card-to-account': return CreditCard;
      default: return Wallet;
    }
  };

  const getDestIcon = () => {
    switch (transferType) {
      case 'account-to-goal': return Target;
      case 'account-to-card': return CreditCard;
      default: return Wallet;
    }
  };

  const SourceIcon = getSourceIcon();
  const DestIcon = getDestIcon();

  return (
    <div className="p-8 animate-fade-in font-sans" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif" }}>
      
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Transferencias</h1>
        <p className="text-muted-foreground">Mueve dinero entre tus cuentas, metas y tarjetas</p>
      </div>

      {/* GLASS CONTAINER */}
      <div className="relative max-w-2xl mx-auto">
        
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl mix-blend-multiply animate-pulse"></div>

        <div className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/70 p-8 shadow-2xl backdrop-blur-3xl ring-1 ring-white/70">
            {/* Reflection */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent opacity-50"></div>

            <div className="relative z-10 space-y-8">
                
                {/* Title inside Card */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                        <ArrowLeftRight className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-800">Nueva Transferencia</h2>
                </div>

                {/* Transfer Type Selector */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Tipo de movimiento</Label>
                    <Select value={transferType} onValueChange={(v) => { setTransferType(v as TransferType); setFromId(''); setToId(''); }}>
                    <SelectTrigger className="h-12 bg-white/50 border-gray-200/60 text-base">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="account-to-account">Cuenta → Cuenta</SelectItem>
                        <SelectItem value="account-to-goal">Cuenta → Meta</SelectItem>
                        <SelectItem value="account-to-card">Cuenta → Tarjeta (Pago)</SelectItem>
                        <SelectItem value="goal-to-account">Meta → Cuenta</SelectItem>
                        <SelectItem value="card-to-account">Tarjeta → Cuenta (Gasto)</SelectItem>
                    </SelectContent>
                    </Select>
                </div>

                {/* From -> To Section */}
                <div className="bg-white/40 rounded-2xl p-6 border border-white/50 shadow-sm space-y-6 md:space-y-0 md:grid md:grid-cols-[1fr,auto,1fr] md:gap-4 md:items-center">
                    
                    {/* FROM */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-gray-600 font-medium">
                            <SourceIcon className="w-4 h-4 text-indigo-500" /> Origen
                        </Label>
                        <Select value={fromId} onValueChange={setFromId}>
                            <SelectTrigger className="bg-white/80 border-gray-200 h-11">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                {getSourceOptions().map((item: any) => (
                                <SelectItem key={item.id} value={item.id}>
                                    <span className="font-medium">{item.name}</span> 
                                    <span className="text-gray-400 ml-2 text-xs">
                                        ({item.currency || '$'}{(item.balance || item.currentAmount || 0).toLocaleString()})
                                    </span>
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Arrow Icon */}
                    <div className="flex justify-center text-gray-400">
                        <ArrowRight className="w-6 h-6 hidden md:block" />
                        <ArrowDownUp className="w-6 h-6 md:hidden" />
                    </div>

                    {/* TO */}
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-gray-600 font-medium">
                            <DestIcon className="w-4 h-4 text-green-500" /> Destino
                        </Label>
                        <Select value={toId} onValueChange={setToId}>
                            <SelectTrigger className="bg-white/80 border-gray-200 h-11">
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                {getDestinationOptions().map((item: any) => (
                                <SelectItem key={item.id} value={item.id}>
                                    <span className="font-medium">{item.name}</span>
                                </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Amount Input */}
                <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-gray-500">Monto a transferir</Label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.01"
                            className="pl-8 h-14 text-2xl font-light bg-white/50 border-gray-200/60 focus:bg-white transition-all"
                        />
                        <span className="absolute left-4 top-4 text-gray-400 text-xl font-light">$</span>
                    </div>
                </div>

                {/* Action Button */}
                <Button 
                    onClick={handleTransfer} 
                    className="w-full h-14 text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                    Confirmar Transferencia
                </Button>

            </div>
        </div>
      </div>

    </div>
  );
};

export default Transfers;