import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, TrendingUp, DollarSign, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { Goal } from '../types';
import { toast } from 'sonner';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal;
  coupleId: string;
  userId: string;
}

export function ContributionModal({ isOpen, onClose, goal, coupleId, userId }: ContributionModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    setLoading(true);
    try {
      const val = Number(amount);
      
      // Update goal amount
      const { error: goalError } = await supabase
        .from('goals')
        .update({
          current_amount: goal.currentAmount + val,
        })
        .eq('id', goal.id);

      if (goalError) throw goalError;

      // Create notification for the couple
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            couple_id: coupleId,
            message: `Novo aporte de ${formatCurrency(val)} na meta: ${goal.name}! 🎯`,
            type: 'goal',
            read: false,
          },
        ]);

      if (notificationError) throw notificationError;

      // Create a transaction for the contribution to reflect in dashboard
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: userId,
            couple_id: coupleId,
            amount: val,
            type: 'expense',
            description: `Aporte: ${goal.name}`,
            category: 'Investimentos',
            bank: 'Meta',
            date: new Date().toISOString().split('T')[0],
          },
        ]);

      if (transactionError) throw transactionError;

      toast.success(`+ ${formatCurrency(val)} aplicado em ${goal.name}! 🚀`, {
        description: 'Cada real é um passo para o sonho.',
        icon: <TrendingUp className="w-4 h-4 text-brand-green" />,
      });

      setAmount('');
      onClose();
    } catch (error) {
      console.error('Error adding contribution:', error);
      toast.error('Erro ao adicionar contribuição.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass p-8 rounded-3xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-brand-purple/20 text-brand-purple">
                  <Target className="w-5 h-5" />
                </div>
                <h2 className="text-2xl font-bold">Contribuir</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
              <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Meta Selecionada</p>
              <p className="font-bold text-white">{goal.name}</p>
              <div className="flex justify-between mt-2 text-[10px] font-bold uppercase text-slate-500">
                <span>Atual: {formatCurrency(goal.currentAmount)}</span>
                <span>Alvo: {formatCurrency(goal.targetAmount)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Valor do Aporte</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                  <input
                    required
                    autoFocus
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-brand-dark/50 border border-slate-700 text-white text-3xl font-bold p-6 pl-14 rounded-2xl focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>

              <button
                disabled={loading || !amount}
                className="w-full bg-brand-purple hover:bg-brand-purple/80 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-brand-purple/20"
              >
                {loading ? 'Processando...' : 'Confirmar Aporte'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
