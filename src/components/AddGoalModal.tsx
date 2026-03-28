import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Target, Calendar, DollarSign, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupleId: string;
}

const CATEGORIES = ['Casa', 'Móveis', 'Casamento', 'Viagem', 'Reserva', 'Outros'];

export function AddGoalModal({ isOpen, onClose, coupleId }: AddGoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .insert([
          {
            couple_id: coupleId,
            name,
            target_amount: Number(targetAmount),
            current_amount: 0,
            deadline,
            category,
          },
        ]);

      if (error) throw error;
      
      toast.success('Meta criada com sucesso! 🚀');
      onClose();
      setName('');
      setTargetAmount('');
      setDeadline('');
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Erro ao criar meta.');
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
              <h2 className="text-3xl font-bold flex items-center gap-2">
                <Target className="w-8 h-8 text-brand-purple" /> Nova Meta
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">O que vocês querem conquistar?</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Casa Própria"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-brand-dark/50 border border-slate-700 text-white p-4 rounded-2xl focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Valor Total</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      required
                      type="number"
                      placeholder="0.00"
                      value={targetAmount}
                      onChange={(e) => setTargetAmount(e.target.value)}
                      className="w-full bg-brand-dark/50 border border-slate-700 text-white p-4 pl-10 rounded-2xl focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Prazo</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      required
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-brand-dark/50 border border-slate-700 text-white p-4 pl-10 rounded-2xl focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-3 rounded-xl text-xs font-bold transition-all ${
                        category === cat ? 'bg-brand-purple text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full bg-brand-purple hover:bg-brand-purple/80 text-white font-bold py-4 px-6 rounded-2xl transition-all disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Começar Projeto'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
