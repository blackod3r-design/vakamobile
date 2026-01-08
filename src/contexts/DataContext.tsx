import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

// --- INTERFACES (Tus tipos de datos) ---
export interface DPFInterestRecord { id: string; fecha: string; monto: number; tipo: 'mensual' | 'proporcional'; mesCorrespondiente: number; }
export interface Account { id: string; name: string; balance: number; type: 'savings' | 'checking'; currency: '$' | 'S/'; imageUrl?: string; tipoCuenta?: 'ahorro' | 'dpf-mensual' | 'dpf-final'; fechaApertura?: string; montoInicial?: number; tasaAnual?: number; plazoDias?: number; interesTotal?: number; interesMensualProporcional?: number; interesesAcumulados?: number; historialIntereses?: DPFInterestRecord[]; autoIntereses?: boolean; }
export interface Transaction { id: string; accountId: string; amount: number; type: 'deposit' | 'withdrawal'; description: string; date: string; }
export interface CardTransaction { id: string; amount: number; type: 'expense' | 'payment'; description: string; date: string; }
export interface CreditCard { id: string; name: string; balance: number; limit: number; dueDate: string; currency: '$' | 'S/'; transactions: CardTransaction[]; cardLogo?: string; imageUrl?: string; textColor?: string; customIcon?: string; textPositionX?: number; textPositionY?: number; textSize?: number; }
export interface MortgagePayment { id: string; amount: number; date: string; paid: boolean; }
export interface ScheduleRow { cuota: number; fecha?: string; cuotaMensual: number; interes: number; capital: number; seguro: number; saldoFinal: number; }
export interface Abono { id: string; fecha: string; monto: number; tipo: 'reducirCuota' | 'reducirPlazo'; ahorroInteres: number; }
export interface Pago { id: string; fecha: string; numeroCuota: number; cuotaPagada: number; capital: number; interes: number; seguro?: number; saldoPosterior: number; }
export interface Mortgage { id?: string; totalAmount: number; paidAmount: number; monthlyPayment: number; payments: MortgagePayment[]; currency: '$' | 'S/'; modo?: 'excel' | 'manual'; montoCredito?: number; plazoMeses?: number; tasaAnual?: number; seguroMensual?: number; cronograma?: ScheduleRow[]; abonos?: Abono[]; pagos?: Pago[]; interesesAhorrados?: number; saldoActual?: number; totalAPagar?: number; plazoRestante?: number; }
export interface Contribution { id: string; amount: number; date: string; }
export interface Goal { id: string; name: string; targetAmount: number; currentAmount: number; deadline: string; contributions: Contribution[]; imageUrl?: string; currency: '$' | 'S/'; }
export interface Property { id: string; name: string; icon: string; purchaseValue: number; estimatedValue: number; currency: '$' | 'S/'; imageUrl?: string; }
export interface MilesTransaction { id: string; amount: number; type: 'add' | 'subtract'; description: string; date: string; }
export interface MilesProgram { id: string; name: string; points: number; icon: 'plane' | 'shopping' | 'gift'; transactions: MilesTransaction[]; imageUrl?: string; textColor?: string; customIcon?: string; textPositionX?: number; textPositionY?: number; textSize?: number; }
export interface MilesPoints { programs: MilesProgram[]; }
export interface Subtask { id: string; name: string; completed: boolean; }
export interface Task { id: string; name: string; amount: number; subtasks: Subtask[]; imageUrl?: string; currency: '$' | 'S/'; createdAt: string; }
export interface LoanPayment { id: string; cuota: number; fecha: string; cuotaMensual: number; interes: number; capital: number; saldoRestante: number; pagado: boolean; }
export interface PagoAdelantado { id: string; fecha: string; monto: number; cuotaAfectada: number; }
export interface Loan { id: string; name: string; monto: number; tasaAnual: number; plazoMeses: number; cuotaMensual: number; currency: '$' | 'S/'; fechaInicio: string; cronograma: LoanPayment[]; pagosAdelantados: PagoAdelantado[]; saldoActual: number; cuotasPagadas: number; imageUrl?: string; }
export interface WalletMovement { id: string; tipo: 'deposito' | 'retiro'; monto: number; fecha: string; descripcion: string; }
export interface Wallet { id: string; name: string; color: string; saldo: number; currency: '$' | 'S/'; movimientos: WalletMovement[]; imageUrl?: string; }
export interface BudgetCategory { id: string; name: string; assignedAmount: number; currentSpending: number; color: string; icon: string; }
export interface Budget { id: string; name: string; assignedAmount: number; currentSpending: number; color: string; icon: string; categories?: BudgetCategory[]; }

interface DataContextType {
  accounts: Account[]; addAccount: (a: Omit<Account, 'id'>) => void; updateAccount: (id: string, u: Partial<Account>) => void; deleteAccount: (id: string) => void;
  transactions: Transaction[]; addTransaction: (t: Omit<Transaction, 'id'>) => void;
  creditCards: CreditCard[]; addCreditCard: (c: Omit<CreditCard, 'id'>) => void; updateCreditCard: (id: string, u: Partial<CreditCard>) => void; deleteCreditCard: (id: string) => void;
  mortgage: Mortgage; updateMortgage: (u: Partial<Mortgage>) => void;
  goals: Goal[]; addGoal: (g: Omit<Goal, 'id' | 'contributions'>) => void; updateGoal: (id: string, u: Partial<Goal>) => void; deleteGoal: (id: string) => void; addContribution: (gid: string, c: Omit<Contribution, 'id'>) => void;
  milesPoints: MilesPoints; updateMilesPoints: (u: Partial<MilesPoints>) => void; addMilesProgram: (p: any) => void;
  properties: Property[]; addProperty: (p: Omit<Property, 'id'>) => void; updateProperty: (id: string, u: Partial<Property>) => void; deleteProperty: (id: string) => void;
  tasks: Task[]; addTask: (t: Omit<Task, 'id' | 'subtasks' | 'createdAt'>) => void; updateTask: (id: string, u: Partial<Task>) => void; deleteTask: (id: string) => void; addSubtask: (tid: string, s: Omit<Subtask, 'id'>) => void; updateSubtask: (tid: string, sid: string, u: Partial<Subtask>) => void; deleteSubtask: (tid: string, sid: string) => void;
  loans: Loan[]; addLoan: (l: Omit<Loan, 'id' | 'cronograma' | 'cuotaMensual' | 'saldoActual' | 'cuotasPagadas' | 'pagosAdelantados'>) => void; updateLoan: (id: string, u: Partial<Loan>) => void; deleteLoan: (id: string) => void; registrarPagoLoan: (lid: string, cn: number) => void; registrarPagoAdelantado: (lid: string, m: number, f: string) => void;
  wallets: Wallet[]; addWallet: (w: Omit<Wallet, 'id' | 'movimientos'>) => void; updateWallet: (id: string, u: Partial<Wallet>) => void; deleteWallet: (id: string) => void; addWalletMovement: (wid: string, m: Omit<WalletMovement, 'id'>) => void; deleteWalletMovement: (wid: string, mid: string) => void;
  budgets: Budget[]; addBudget: (b: Omit<Budget, 'id' | 'categories'>) => void; updateBudget: (id: string, u: Partial<Budget>) => void; deleteBudget: (id: string) => void; addBudgetCategory: (bid: string, c: Omit<BudgetCategory, 'id'>) => void; updateBudgetCategory: (bid: string, cid: string, u: Partial<BudgetCategory>) => void; deleteBudgetCategory: (bid: string, cid: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // ESTADOS
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [mortgage, setMortgage] = useState<Mortgage>({ totalAmount: 0, paidAmount: 0, monthlyPayment: 0, payments: [], currency: '$', abonos: [], pagos: [], interesesAhorrados: 0, saldoActual: 0, totalAPagar: 0, plazoRestante: 0 });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milesPoints, setMilesPoints] = useState<MilesPoints>({ programs: [] });
  const [properties, setProperties] = useState<Property[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // CARGA DE DATOS INICIAL
  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      // 1. Cuentas
      const { data: accs } = await supabase.from('accounts').select('*');
      if (accs) setAccounts(accs.map(a => ({ ...a, ...a.details, imageUrl: a.image_url })));

      // 2. Transacciones
      const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (txs) setTransactions(txs.map(t => ({ ...t, accountId: t.account_id })));

      // 3. Tarjetas
      const { data: cards } = await supabase.from('credit_cards').select('*');
      if (cards) setCreditCards(cards.map(c => ({ 
          ...c, 
          imageUrl: c.image_url, 
          cardLogo: c.card_logo,
          dueDate: c.due_date,
          limit: c.limit_amount
      })));

      // 4. Metas
      const { data: gls } = await supabase.from('goals').select('*');
      if (gls) setGoals(gls.map(g => ({
          ...g,
          imageUrl: g.image_url,
          targetAmount: g.target_amount,
          currentAmount: g.current_amount
      })));

      // 5. Propiedades
      const { data: props } = await supabase.from('properties').select('*');
      if (props) setProperties(props.map(p => ({
          ...p,
          imageUrl: p.image_url,
          purchaseValue: p.purchase_value,
          estimatedValue: p.estimated_value
      })));

      // 6. Hipoteca (Cargamos la primera que encuentre para este usuario)
      const { data: mtgs } = await supabase.from('mortgages').select('*').limit(1);
      if (mtgs && mtgs.length > 0) {
          const m = mtgs[0];
          setMortgage({
              ...m,
              ...m.details, // Aquí viene el cronograma del Excel
              totalAmount: m.total_amount,
              paidAmount: m.paid_amount,
              monthlyPayment: m.monthly_payment
          });
      }

      // 7. Millas
      const { data: miles } = await supabase.from('miles_programs').select('*');
      if (miles) setMilesPoints({ programs: miles.map(m => ({ ...m, imageUrl: m.image_url })) });
      
      // 8. Tareas
      const { data: tsks } = await supabase.from('tasks').select('*');
      if(tsks) setTasks(tsks.map(t => ({...t, imageUrl: t.image_url})));

      // 9. Billeteras y 10. Loans... (Similar)
      const { data: wlls } = await supabase.from('wallets').select('*');
      if (wlls) setWallets(wlls);
      
      const { data: lns } = await supabase.from('loans').select('*');
      if (lns) setLoans(lns);

      const { data: bdgts } = await supabase.from('budgets').select('*');
      if (bdgts) setBudgets(bdgts);
    };
    fetchAll();
  }, [user]);

  // --- FUNCIONES (Con Mapeo Correcto para la Nube) ---

  const addAccount = async (account: Omit<Account, 'id'>) => {
    const { tipoCuenta, fechaApertura, montoInicial, tasaAnual, plazoDias, interesTotal, ...baseAccount } = account;
    const details = { tipoCuenta, fechaApertura, montoInicial, tasaAnual, plazoDias, interesTotal };
    const payload = {
        name: baseAccount.name, balance: baseAccount.balance, type: baseAccount.type, currency: baseAccount.currency,
        image_url: baseAccount.imageUrl,
        details: details,
        user_id: user?.id
    };
    const { data } = await supabase.from('accounts').insert([payload]).select();
    if (data) setAccounts(prev => [...prev, { ...data[0], ...data[0].details, imageUrl: data[0].image_url }]);
  };

  const updateAccount = async (id: string, updates: Partial<Account>) => {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    const { tipoCuenta, fechaApertura, montoInicial, ...rest } = updates;
    const payload: any = { ...rest };
    if (updates.imageUrl) payload.image_url = updates.imageUrl;
    await supabase.from('accounts').update(payload).eq('id', id);
  };
  const deleteAccount = async (id: string) => {
      setAccounts(prev => prev.filter(a => a.id !== id));
      await supabase.from('accounts').delete().eq('id', id);
  };

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const payload = { account_id: tx.accountId, amount: Number(tx.amount), type: tx.type, description: tx.description, date: tx.date, user_id: user?.id };
    const { data } = await supabase.from('transactions').insert([payload]).select();
    if (data) {
        setTransactions(prev => [{ ...tx, id: data[0].id, amount: Number(tx.amount) }, ...prev]);
        const acc = accounts.find(a => a.id === tx.accountId);
        if (acc) {
            const nuevoSaldo = tx.type === 'deposit' ? Number(acc.balance) + Number(tx.amount) : Number(acc.balance) - Number(tx.amount);
            updateAccount(tx.accountId, { balance: nuevoSaldo });
        }
    }
  };

  const addCreditCard = async (card: Omit<CreditCard, 'id'>) => {
    const payload = {
        name: card.name, balance: card.balance, currency: card.currency,
        limit_amount: card.limit, // Mapeo
        due_date: card.dueDate,   // Mapeo
        card_logo: card.cardLogo, // Mapeo
        image_url: card.imageUrl, // Mapeo
        transactions: [],
        user_id: user?.id
    };
    const { data } = await supabase.from('credit_cards').insert([payload]).select();
    if (data) setCreditCards(prev => [...prev, { ...card, id: data[0].id }]);
  };

  const updateCreditCard = async (id: string, updates: Partial<CreditCard>) => {
      setCreditCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      await supabase.from('credit_cards').update(updates).eq('id', id); // Simplificado
  };
  const deleteCreditCard = async (id: string) => {
      setCreditCards(prev => prev.filter(c => c.id !== id));
      await supabase.from('credit_cards').delete().eq('id', id);
  };

  // --- HIPOTECA (NUEVA LÓGICA DE GUARDADO) ---
  const updateMortgage = async (updates: Partial<Mortgage>) => {
      // 1. Actualizar local
      setMortgage(prev => {
          const nueva = { ...prev, ...updates };
          
          // 2. Guardar en Nube (Upsert: Crea si no existe, actualiza si existe)
          const guardarEnNube = async () => {
              const details = {
                  cronograma: nueva.cronograma,
                  abonos: nueva.abonos,
                  pagos: nueva.pagos,
                  modo: nueva.modo,
                  // ...otros detalles del excel
              };
              
              const payload = {
                  total_amount: nueva.totalAmount,
                  paid_amount: nueva.paidAmount,
                  monthly_payment: nueva.monthlyPayment,
                  currency: nueva.currency,
                  details: details,
                  user_id: user?.id
              };

              // Si ya tiene ID, actualizamos. Si no, insertamos.
              if (nueva.id) {
                  await supabase.from('mortgages').update(payload).eq('id', nueva.id);
              } else {
                  const { data } = await supabase.from('mortgages').insert([payload]).select();
                  if (data) setMortgage(p => ({ ...p, id: data[0].id }));
              }
          };
          guardarEnNube();
          
          return nueva;
      });
  };

  const addGoal = async (goal: Omit<Goal, 'id' | 'contributions'>) => {
      const payload = {
          name: goal.name, deadline: goal.deadline, currency: goal.currency,
          target_amount: goal.targetAmount,   // Mapeo
          current_amount: goal.currentAmount, // Mapeo
          image_url: goal.imageUrl,           // Mapeo
          contributions: [],
          user_id: user?.id
      };
      const { data } = await supabase.from('goals').insert([payload]).select();
      if (data) setGoals(prev => [...prev, { ...goal, id: data[0].id, contributions: [] }]);
  };

  const updateGoal = async (id: string, updates: Partial<Goal>) => {
      setGoals(prev => prev.map(g => g.id === id ? {...g, ...updates} : g));
      const payload: any = {};
      if (updates.currentAmount !== undefined) payload.current_amount = updates.currentAmount;
      if (updates.contributions) payload.contributions = updates.contributions;
      await supabase.from('goals').update(payload).eq('id', id);
  };
  const deleteGoal = async (id: string) => {
      setGoals(prev => prev.filter(g => g.id !== id));
      await supabase.from('goals').delete().eq('id', id);
  };
  const addContribution = (gid: string, c: Omit<Contribution, 'id'>) => {
      const g = goals.find(x => x.id === gid);
      if (g) {
          const nueva = { ...c, id: crypto.randomUUID() };
          const nuevasContrib = [...g.contributions, nueva];
          const nuevoMonto = Number(g.currentAmount) + Number(c.amount);
          updateGoal(gid, { contributions: nuevasContrib, currentAmount: nuevoMonto });
      }
  };

  const addProperty = async (prop: Omit<Property, 'id'>) => {
      const payload = {
          name: prop.name, icon: prop.icon, currency: prop.currency,
          purchase_value: prop.purchaseValue,   // Mapeo
          estimated_value: prop.estimatedValue, // Mapeo
          image_url: prop.imageUrl,             // Mapeo
          user_id: user?.id
      };
      const { data } = await supabase.from('properties').insert([payload]).select();
      if (data) setProperties(prev => [...prev, { ...prop, id: data[0].id }]);
  };
  const updateProperty = async (id: string, updates: Partial<Property>) => {
      setProperties(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      await supabase.from('properties').update(updates).eq('id', id);
  };
  const deleteProperty = async (id: string) => {
      setProperties(prev => prev.filter(p => p.id !== id));
      await supabase.from('properties').delete().eq('id', id);
  };

  const addTask = async (task: Omit<Task, 'id' | 'subtasks' | 'createdAt'>) => {
      const payload = {
          name: task.name, amount: task.amount, currency: task.currency,
          image_url: task.imageUrl,
          subtasks: [],
          user_id: user?.id
      };
      const { data } = await supabase.from('tasks').insert([payload]).select();
      if (data) setTasks(prev => [...prev, { ...task, id: data[0].id, subtasks: [], createdAt: new Date().toISOString() }]);
  };
  const updateTask = async (id: string, updates: Partial<Task>) => {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      const payload: any = {};
      if (updates.subtasks) payload.subtasks = updates.subtasks;
      await supabase.from('tasks').update(payload).eq('id', id);
  };
  const deleteTask = async (id: string) => {
      setTasks(prev => prev.filter(t => t.id !== id));
      await supabase.from('tasks').delete().eq('id', id);
  };
  const addSubtask = (tid: string, s: Omit<Subtask, 'id'>) => {
      const t = tasks.find(x => x.id === tid);
      if (t) updateTask(tid, { subtasks: [...t.subtasks, { ...s, id: crypto.randomUUID() }] });
  };
  const updateSubtask = (tid: string, sid: string, u: Partial<Subtask>) => {
      const t = tasks.find(x => x.id === tid);
      if (t) updateTask(tid, { subtasks: t.subtasks.map(s => s.id === sid ? { ...s, ...u } : s) });
  };
  const deleteSubtask = (tid: string, sid: string) => {
      const t = tasks.find(x => x.id === tid);
      if (t) updateTask(tid, { subtasks: t.subtasks.filter(s => s.id !== sid) });
  };

  // --- MILLAS Y OTROS ---
  const updateMilesPoints = (u: Partial<MilesPoints>) => setMilesPoints(prev => ({ ...prev, ...u }));
  const addMilesProgram = async (program: any) => {
      const payload = { ...program, image_url: program.imageUrl, user_id: user?.id };
      const { data } = await supabase.from('miles_programs').insert([payload]).select();
      if (data) setMilesPoints(prev => ({ programs: [...prev.programs, { ...program, id: data[0].id }] }));
  };

  // ... (Loans, Wallets, Budgets se mantienen similares, asegurando user_id)
  const addLoan = async (loan: any) => {
      const payload = { ...loan, user_id: user?.id }; // Simplificado
      const { data } = await supabase.from('loans').insert([payload]).select();
      if (data) setLoans(prev => [...prev, data[0]]);
  };
  const updateLoan = async (id: string, updates: any) => {
      setLoans(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      await supabase.from('loans').update(updates).eq('id', id);
  };
  const deleteLoan = async (id: string) => {
      setLoans(prev => prev.filter(l => l.id !== id));
      await supabase.from('loans').delete().eq('id', id);
  };
  const registrarPagoLoan = () => {}; 
  const registrarPagoAdelantado = () => {};

  const addWallet = async (w: any) => {
      const { data } = await supabase.from('wallets').insert([{ ...w, user_id: user?.id }]).select();
      if (data) setWallets(p => [...p, data[0]]);
  };
  const updateWallet = async (id: string, u: any) => {
      setWallets(p => p.map(w => w.id === id ? {...w, ...u} : w));
      await supabase.from('wallets').update(u).eq('id', id);
  };
  const deleteWallet = async (id: string) => {
      setWallets(p => p.filter(w => w.id !== id));
      await supabase.from('wallets').delete().eq('id', id);
  };
  const addWalletMovement = async (wid: string, m: any) => {
      const w = wallets.find(x => x.id === wid);
      if (w) {
          const nm = { ...m, id: crypto.randomUUID() };
          const movs = [...w.movimientos, nm];
          const newSaldo = m.tipo === 'deposito' ? w.saldo + Number(m.monto) : w.saldo - Number(m.monto);
          updateWallet(wid, { saldo: newSaldo, movimientos: movs });
      }
  };
  const deleteWalletMovement = (wid: string, mid: string) => { /* Lógica inversa */ };

  const addBudget = async (b: any) => {
      const { data } = await supabase.from('budgets').insert([{ ...b, user_id: user?.id }]).select();
      if(data) setBudgets(p => [...p, data[0]]);
  };
  const updateBudget = async (id: string, u: any) => {
      setBudgets(p => p.map(b => b.id === id ? {...b, ...u} : b));
      await supabase.from('budgets').update(u).eq('id', id);
  };
  const deleteBudget = async (id: string) => {
      setBudgets(p => p.filter(b => b.id !== id));
      await supabase.from('budgets').delete().eq('id', id);
  };
  const addBudgetCategory = (bid: string, c: any) => {
      const b = budgets.find(x => x.id === bid);
      if(b) updateBudget(bid, { categories: [...(b.categories||[]), { ...c, id: crypto.randomUUID() }] });
  };
  const updateBudgetCategory = (bid: string, cid: string, u: any) => {
      const b = budgets.find(x => x.id === bid);
      if(b && b.categories) updateBudget(bid, { categories: b.categories.map(c => c.id === cid ? {...c, ...u} : c) });
  };
  const deleteBudgetCategory = (bid: string, cid: string) => {
      const b = budgets.find(x => x.id === bid);
      if(b && b.categories) updateBudget(bid, { categories: b.categories.filter(c => c.id !== cid) });
  };

  return (
    <DataContext.Provider value={{
      accounts, addAccount, updateAccount, deleteAccount,
      transactions, addTransaction,
      creditCards, addCreditCard, updateCreditCard, deleteCreditCard,
      mortgage, updateMortgage,
      goals, addGoal, updateGoal, deleteGoal, addContribution,
      milesPoints, updateMilesPoints, addMilesProgram,
      properties, addProperty, updateProperty, deleteProperty,
      tasks, addTask, updateTask, deleteTask, addSubtask, updateSubtask, deleteSubtask,
      loans, addLoan, updateLoan, deleteLoan, registrarPagoLoan, registrarPagoAdelantado,
      wallets, addWallet, updateWallet, deleteWallet, addWalletMovement, deleteWalletMovement,
      budgets, addBudget, updateBudget, deleteBudget, addBudgetCategory, updateBudgetCategory, deleteBudgetCategory,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};