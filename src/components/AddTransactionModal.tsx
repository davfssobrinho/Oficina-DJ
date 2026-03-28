import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, TrendingUp, TrendingDown, Calendar, DollarSign, Tag, FileText, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string;
  userId: string;
}

const CATEGORIES = {
  income: ['Salário', 'Renda Extra', 'Outros'],
  expense: ['Aluguel', 'Contas', 'Lazer', 'Comida', 'Investimentos', 'Outros']
};

const BANKS = ['Nubank', 'PicPay', 'Inter', 'Itaú', 'Bradesco', 'Santander', 'Caixa', 'Outros'];

export function AddTransactionModal({ isOpen, onClose, coupleId, userId }: AddTransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES.expense[0]);
  const [bank, setBank] = useState(BANKS[0]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([
          {
            user_id: userId,
            couple_id: coupleId,
            amount: Number(amount),
            type,
            description,
            category,
            bank,
            date,
          },
        ]);

      if (transactionError) throw transactionError;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            couple_id: coupleId,
            message: `${type === 'income' ? 'Entrada' : 'Saída'} de ${formatCurrency(Number(amount))} no ${bank} (${description})`,
            type: 'transaction',
            read: false,
          },
        ]);

      if (notificationError) throw notificationError;
      
      toast.success('Lançamento registrado! 💰', {
        description: `Notificação enviada para o parceiro.`,
      });
      onClose();
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Erro ao salvar lançamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg glass p-8 rounded-3xl space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold">Novo Lançamento</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex p-1 bg-slate-800 rounded-2xl">
              <button
                onClick={() => { setType('income'); setCategory(CATEGORIES.income[0]); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                  type === 'income' ? 'bg-brand-green text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> Entrada
              </button>
              <button
                onClick={() => { setType('expense'); setCategory(CATEGORIES.expense[0]); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                  type === 'expense' ? 'bg-red-400 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <TrendingDown className="w-4 h-4" /> Saída
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Valor</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-brand-dark/50 border border-slate-700 text-white text-3xl font-bold p-6 pl-14 rounded-2xl focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Descrição</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    required
                    type="text"
                    placeholder="Ex: Supermercado"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-brand-dark/50 border border-slate-700 text-white p-4 pl-10 rounded-2xl focus:outline-none focus:border-brand-purple"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Banco</label>
                  <div className="relative">
                    <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full bg-brand-dark/50 border border-slate-700 text-white p-4 pl-10 rounded-2xl focus:outline-none focus:border-brand-purple appearance-none"
                    >
                      {BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-brand-dark/50 border border-slate-700 text-white p-4 rounded-2xl focus:outline-none focus:border-brand-purple appearance-none"
                  >
                    {CATEGORIES[type].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Data</label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-slate-700 text-white p-4 rounded-2xl focus:outline-none focus:border-brand-purple"
                />
              </div>

              <button
                disabled={loading}
                className={`w-full font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50 ${
                  type === 'income' ? 'bg-brand-green hover:bg-brand-green/80' : 'bg-red-400 hover:bg-red-400/80'
                } text-white`}
              >
                {loading ? 'Salvando...' : 'Confirmar Lançamento'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
