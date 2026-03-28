import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Couple, Goal, Transaction } from '../types';
import { LayoutDashboard, Target, History, Plus, LogOut, TrendingUp, TrendingDown, Wallet, Sparkles, ChevronRight, Menu, X, Trophy, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoalCard } from './GoalCard';
import { TransactionList } from './TransactionList';
import { AddGoalModal } from './AddGoalModal';
import { AddTransactionModal } from './AddTransactionModal';
import { formatCurrency } from '../lib/utils';
import { Toaster, toast } from 'sonner';
import { Notification } from '../types';

interface DashboardProps {
  user: UserProfile;
  couple: Couple;
}

const LEVELS = [
  { name: 'Oficina Aberta', min: 0, icon: '🛠️' },
  { name: 'Casal Aprendiz', min: 500, icon: '🌱' },
  { name: 'Casal Iniciante', min: 2000, icon: '🚀' },
  { name: 'Casal em Evolução', min: 5000, icon: '📈' },
  { name: 'Casal Próspero', min: 15000, icon: '💎' },
  { name: 'Casal Milionário', min: 50000, icon: '👑' },
];

export function Dashboard({ user, couple }: DashboardProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'transactions'>('overview');

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false });
      if (goalsData) setGoals(goalsData.map(g => ({
        id: g.id,
        coupleId: g.couple_id,
        name: g.name,
        targetAmount: g.target_amount,
        currentAmount: g.current_amount,
        deadline: g.deadline,
        category: g.category,
        createdAt: g.created_at
      } as Goal)));

      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('*')
        .eq('couple_id', couple.id)
        .order('date', { ascending: false })
        .limit(50);
      if (transactionsData) setTransactions(transactionsData.map(t => ({
        id: t.id,
        coupleId: t.couple_id,
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.description,
        bank: t.bank,
        date: t.date,
        userId: t.user_id,
        createdAt: t.created_at
      } as Transaction)));

      const { data: notificationsData } = await supabase
        .from('notifications')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })
        .limit(10);
      if (notificationsData) setNotifications(notificationsData.map(n => ({
        id: n.id,
        coupleId: n.couple_id,
        userId: n.user_id,
        message: n.message,
        type: n.type,
        read: n.read,
        createdAt: n.created_at
      } as Notification)));
    };

    fetchInitialData();

    // Set up real-time subscriptions
    const goalsChannel = supabase
      .channel('goals-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `couple_id=eq.${couple.id}` }, () => fetchInitialData())
      .subscribe();

    const transactionsChannel = supabase
      .channel('transactions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `couple_id=eq.${couple.id}` }, () => fetchInitialData())
      .subscribe();

    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `couple_id=eq.${couple.id}` }, () => fetchInitialData())
      .subscribe();

    return () => {
      supabase.removeChannel(goalsChannel);
      supabase.removeChannel(transactionsChannel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [couple.id]);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const goalProgress = goals.length > 0 
    ? (goals.reduce((acc, g) => acc + (Math.min(g.currentAmount / g.targetAmount, 1)), 0) / goals.length) * 100
    : 0;

  const currentLevel = [...LEVELS].reverse().find(l => balance >= l.min) || LEVELS[0];
  const nextLevel = LEVELS[LEVELS.indexOf(currentLevel) + 1];
  const levelProgress = nextLevel ? ((balance - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100;

  // Track level up
  const [prevLevelName, setPrevLevelName] = useState(currentLevel.name);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);

  useEffect(() => {
    if (currentLevel.name !== prevLevelName) {
      const isHigher = LEVELS.findIndex(l => l.name === currentLevel.name) > LEVELS.findIndex(l => l.name === prevLevelName);
      if (isHigher) {
        toast.success(`PARABÉNS! Vocês subiram para o nível: ${currentLevel.name} ${currentLevel.icon}`, {
          duration: 5000,
          description: 'A oficina está prosperando! Continuem assim.'
        });
      }
      setPrevLevelName(currentLevel.name);
    }
  }, [currentLevel.name, prevLevelName]);

  const insights = [
    balance < totalExpense ? "Atenção: Gastos superando as entradas." : "Parabéns! Vocês estão poupando.",
    goals.length > 0 && goals.some(g => new Date(g.deadline) < new Date() && g.currentAmount < g.targetAmount) ? "Algumas metas estão atrasadas." : "Metas no cronograma.",
    totalExpense > totalIncome * 0.7 ? "Dica: Reduzam gastos variáveis." : "Ótimo controle de gastos!"
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', n.id);
    }
    setIsNotificationsOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const TabButton = ({ id, icon: Icon, label }: { id: 'overview' | 'goals' | 'transactions', icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all ${
        activeTab === id ? 'text-brand-purple' : 'text-slate-500'
      }`}
    >
      <div className={`p-2 rounded-xl transition-all ${activeTab === id ? 'bg-brand-purple/10' : ''}`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-brand-dark pb-24 md:pb-0 md:pl-72">
      <Toaster position="top-center" theme="dark" richColors />
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-72 glass p-6 flex-col gap-8 z-40">
        <div>
          <h1 className="text-3xl font-bold tracking-tighter">OFICINA <span className="text-brand-purple">DJ</span></h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Oficina de Sonhos</p>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'overview' ? 'bg-brand-purple text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard className="w-5 h-5" /> <span className="font-bold">Dashboard</span>
          </button>
          <button onClick={() => setActiveTab('goals')} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'goals' ? 'bg-brand-purple text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Target className="w-5 h-5" /> <span className="font-bold">Metas</span>
          </button>
          <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all ${activeTab === 'transactions' ? 'bg-brand-purple text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <History className="w-5 h-5" /> <span className="font-bold">Extrato</span>
          </button>
        </nav>

        <div className="space-y-4 pt-6 border-t border-slate-700/50">
          <div className="flex items-center gap-3">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-brand-purple" alt="" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.displayName}</p>
              <p className="text-xs text-slate-500 truncate">Código: {couple.inviteCode}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-slate-500 hover:text-white hover:bg-red-500/10 transition-all text-sm font-bold">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 z-50 flex items-center justify-around px-2 py-1 safe-area-bottom">
        <TabButton id="overview" icon={LayoutDashboard} label="Início" />
        <TabButton id="goals" icon={Target} label="Metas" />
        <div className="flex-1 flex justify-center -mt-12">
          <button 
            onClick={() => setIsTransactionModalOpen(true)}
            className="w-14 h-14 bg-brand-purple rounded-full shadow-lg shadow-brand-purple/40 flex items-center justify-center text-white active:scale-90 transition-transform border-4 border-brand-dark"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
        <TabButton id="transactions" icon={History} label="Extrato" />
        <button onClick={handleSignOut} className="flex flex-col items-center justify-center gap-1 flex-1 py-2 text-slate-500">
          <div className="p-2">
            <LogOut className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Sair</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Mobile Header */}
            <div className="md:hidden flex items-center justify-between pt-2">
              <div>
                <h1 className="text-2xl font-bold tracking-tighter">OFICINA <span className="text-brand-purple">DJ</span></h1>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Oficina de Sonhos</p>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsNotificationsOpen(true)}
                  className="relative p-2 rounded-xl bg-white/5 text-slate-400"
                >
                  <Bell className="w-6 h-6" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-brand-purple text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-brand-dark">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-brand-purple" alt="" />
              </div>
            </div>

            {/* Desktop Header (Hidden on Mobile) */}
            <div className="hidden md:flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Olá, {user.displayName?.split(' ')[0]}! 👋</h2>
                <p className="text-slate-500">Bem-vindos de volta à sua oficina financeira.</p>
              </div>
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-3 rounded-2xl bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-brand-purple text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-brand-dark">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Balance Card */}
            <div className="glass p-6 rounded-[2.5rem] bg-gradient-to-br from-brand-purple/20 to-transparent border-brand-purple/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                <Wallet className="w-24 h-24" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Saldo Total do Casal</p>
                <h2 className="text-4xl font-bold text-white tracking-tight">{formatCurrency(balance)}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Entradas</p>
                  <p className="text-brand-green font-bold">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Saídas</p>
                  <p className="text-red-400 font-bold">{formatCurrency(totalExpense)}</p>
                </div>
              </div>
            </div>

            {/* Level Progression */}
            <motion.div 
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsLevelModalOpen(true)}
              className="glass p-6 rounded-[2.5rem] space-y-4 cursor-pointer active:bg-white/5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-brand-purple/20 flex items-center justify-center text-2xl">
                    {currentLevel.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Nível Atual</p>
                    <h3 className="font-bold text-lg text-white">{currentLevel.name}</h3>
                  </div>
                </div>
                <Trophy className="w-6 h-6 text-brand-purple" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-500">Progresso de Nível</span>
                  <span className="text-brand-purple">{Math.round(levelProgress)}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${levelProgress}%` }}
                    className="bg-brand-purple h-full shadow-[0_0_10px_rgba(124,58,237,0.3)]"
                  />
                </div>
                {nextLevel && (
                  <p className="text-[10px] text-slate-500 text-center">
                    Faltam <span className="text-white font-bold">{formatCurrency(nextLevel.min - balance)}</span> para o nível <span className="text-brand-purple font-bold">{nextLevel.name}</span>
                  </p>
                )}
              </div>
            </motion.div>

            {/* Level Modal */}
            <AnimatePresence>
              {isLevelModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsLevelModalOpen(false)}
                    className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-lg glass p-8 rounded-3xl space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-brand-purple" /> Níveis da Oficina
                      </h2>
                      <button onClick={() => setIsLevelModalOpen(false)} className="p-2">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      {LEVELS.map((l, i) => {
                        const isReached = balance >= l.min;
                        const isCurrent = currentLevel.name === l.name;
                        return (
                          <div 
                            key={i} 
                            className={`p-4 rounded-2xl flex items-center justify-between border ${
                              isCurrent ? 'bg-brand-purple/20 border-brand-purple' : 
                              isReached ? 'bg-white/5 border-white/10 opacity-60' : 
                              'bg-slate-900/50 border-slate-800 opacity-30'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{l.icon}</span>
                              <div>
                                <p className={`font-bold ${isReached ? 'text-white' : 'text-slate-500'}`}>{l.name}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">A partir de {formatCurrency(l.min)}</p>
                              </div>
                            </div>
                            {isReached && <Sparkles className="w-4 h-4 text-brand-purple" />}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Insights */}
            <div className="glass p-5 rounded-[2rem] border-brand-purple/20 bg-brand-purple/5">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-brand-purple" />
                <h4 className="font-bold text-sm uppercase tracking-widest">Insights da Oficina</h4>
              </div>
              <div className="flex flex-col gap-2">
                {insights.map((insight, i) => (
                  <div key={i} className="text-xs bg-slate-800/40 p-3 rounded-xl text-slate-300 border border-white/5 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-brand-purple" />
                    {insight}
                  </div>
                ))}
              </div>
            </div>

            {/* Goals Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold">Nossos Sonhos</h3>
                <button onClick={() => setActiveTab('goals')} className="text-brand-purple text-xs font-bold flex items-center gap-1">
                  Ver todos <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goals.slice(0, 4).map(goal => (
                  <GoalCard key={goal.id} goal={goal} coupleId={couple.id} userId={user.uid} />
                ))}
                <button 
                  onClick={() => setIsGoalModalOpen(true)}
                  className="glass p-8 rounded-[2rem] border-dashed border-2 border-slate-700 hover:border-brand-purple hover:bg-brand-purple/5 transition-all flex flex-col items-center justify-center gap-3 text-slate-500"
                >
                  <Plus className="w-8 h-8" />
                  <span className="font-bold text-sm">Novo Projeto</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'goals' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center justify-between pt-2">
              <h2 className="text-3xl font-bold">Metas</h2>
              <button 
                onClick={() => setIsGoalModalOpen(true)}
                className="p-3 bg-brand-purple rounded-2xl text-white active:scale-90 transition-transform"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {goals.map(goal => (
                <GoalCard key={goal.id} goal={goal} coupleId={couple.id} userId={user.uid} />
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="flex items-center justify-between pt-2">
              <h2 className="text-3xl font-bold">Extrato</h2>
              <button 
                onClick={() => setIsTransactionModalOpen(true)}
                className="p-3 bg-brand-purple rounded-2xl text-white active:scale-90 transition-transform"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
            <div className="glass rounded-[2rem] overflow-hidden">
              <TransactionList transactions={transactions} coupleId={couple.id} />
            </div>
          </motion.div>
        )}
      </main>

      {/* Modals */}
      <AddGoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} coupleId={couple.id} />
      <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} coupleId={couple.id} userId={user.uid} />
      
      {/* Notifications Modal */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass p-8 rounded-3xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Bell className="w-6 h-6 text-brand-purple" /> Notificações
                </h2>
                <button onClick={() => setIsNotificationsOpen(false)} className="p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>Nenhuma notificação por enquanto.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 rounded-2xl border ${
                        n.read ? 'bg-white/5 border-white/5 opacity-60' : 'bg-brand-purple/10 border-brand-purple/20'
                      }`}
                    >
                      <p className="text-sm text-white">{n.message}</p>
                      <p className="text-[10px] text-slate-500 mt-2">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="w-full py-4 bg-brand-purple text-white font-bold rounded-2xl"
                >
                  Marcar todas como lidas
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
