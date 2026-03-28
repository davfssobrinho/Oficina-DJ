import React from 'react';
import { Transaction } from '../types';
import { supabase } from '../lib/supabase';
import { Trash2, TrendingUp, TrendingDown, Calendar, Tag, History } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';

interface TransactionListProps {
  transactions: Transaction[];
  coupleId: string;
}

export function TransactionList({ transactions, coupleId }: TransactionListProps) {
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Lançamento excluído com sucesso!');
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao excluir lançamento.');
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="p-4 rounded-full bg-slate-800 w-16 h-16 mx-auto flex items-center justify-center text-slate-600">
          <History className="w-8 h-8" />
        </div>
        <p className="text-slate-500">Nenhum lançamento encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-700/50 text-xs text-slate-500 uppercase tracking-widest font-bold">
              <th className="p-6">Data</th>
              <th className="p-6">Descrição</th>
              <th className="p-6">Categoria</th>
              <th className="p-6">Valor</th>
              <th className="p-6">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-6 text-sm text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{t.description}</span>
                    {t.bank && <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.bank}</span>}
                  </div>
                </td>
                <td className="p-6 text-sm text-slate-400">{t.category}</td>
                <td className="p-6">
                  <span className={`font-bold ${t.type === 'income' ? 'text-brand-green' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                </td>
                <td className="p-6">
                  {deletingId === t.id ? (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} 
                        className="text-[10px] font-bold uppercase text-red-400 hover:text-red-300"
                      >
                        Confirmar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} 
                        className="text-[10px] font-bold uppercase text-slate-500 hover:text-slate-300"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(t.id); }} 
                      className="p-2 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-white/5">
        {transactions.map((t) => (
          <div key={t.id} className="p-4 flex items-center justify-between active:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-2xl ${t.type === 'income' ? 'bg-brand-green/20 text-brand-green' : 'bg-red-400/20 text-red-400'}`}>
                {t.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-sm text-white">{t.description}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>{t.bank || t.category}</span>
                  <span>•</span>
                  <span>{new Date(t.date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className={`font-bold text-sm ${t.type === 'income' ? 'text-brand-green' : 'text-red-400'}`}>
                {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
              </p>
              {deletingId === t.id ? (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }} 
                    className="text-[10px] font-bold uppercase text-red-400"
                  >
                    Sim
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} 
                    className="text-[10px] font-bold uppercase text-slate-500"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); setDeletingId(t.id); }} 
                  className="p-2 text-slate-700 active:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
