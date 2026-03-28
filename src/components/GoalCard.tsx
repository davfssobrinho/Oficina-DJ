import React from 'react';
import { Goal } from '../types';
import { supabase } from '../lib/supabase';
import { Trash2, Calendar, Target, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { ContributionModal } from './ContributionModal';

interface GoalCardProps {
  goal: Goal;
  coupleId: string;
  userId: string;
  key?: React.Key;
}

export function GoalCard({ goal, coupleId, userId }: GoalCardProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = React.useState(false);
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goal.id);

      if (error) throw error;
      toast.success('Meta removida com sucesso!');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Erro ao remover meta.');
    }
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isConfirmingDelete) return;
    setIsModalOpen(true);
  };

  return (
    <>
      <motion.div 
        whileTap={{ scale: 0.98 }}
        onClick={handleOpenModal}
        className="glass p-5 rounded-3xl space-y-5 flex flex-col justify-between cursor-pointer active:bg-white/5 transition-colors relative overflow-hidden group"
      >
      {/* Background Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-purple/10 blur-3xl rounded-full group-hover:bg-brand-purple/20 transition-all"></div>
 
      <div className="space-y-4 relative">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-brand-purple/20 text-brand-purple">
            <Target className="w-5 h-5" />
          </div>
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 z-20">
              <button 
                onClick={handleDelete}
                className="text-[10px] font-bold uppercase text-red-400 hover:text-red-300"
              >
                Sim
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(false); }}
                className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300"
              >
                Não
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsConfirmingDelete(true); }} 
              className="p-2 text-slate-600 hover:text-red-400 transition-colors z-10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-white leading-tight">{goal.name}</h3>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">{goal.category}</p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider">
            <span className="text-slate-500">Progresso</span>
            <span className="text-brand-purple">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-800/50 h-2.5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              className="bg-brand-purple h-full shadow-[0_0_10px_rgba(124,58,237,0.5)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-0.5">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Acumulado</p>
            <p className="text-sm font-bold text-white">{formatCurrency(goal.currentAmount)}</p>
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-[9px] text-slate-500 uppercase font-bold">Meta</p>
            <p className="text-sm font-bold text-slate-300">{formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 flex items-center justify-between relative">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
          <Calendar className="w-3 h-3" />
          <span>{new Date(goal.deadline).toLocaleDateString()}</span>
        </div>
        <button 
          onClick={handleOpenModal}
          className="flex items-center gap-1 text-xs font-bold text-brand-purple hover:text-brand-purple/80 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Contribuir</span>
        </button>
      </div>
    </motion.div>

    <ContributionModal 
      isOpen={isModalOpen} 
      onClose={() => setIsModalOpen(false)} 
      goal={goal} 
      coupleId={coupleId} 
      userId={userId}
    />
  </>
);
}
