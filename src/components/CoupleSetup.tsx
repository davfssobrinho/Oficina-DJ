import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Couple } from '../types';
import { Heart, Copy, Check, Users, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface CoupleSetupProps {
  user: UserProfile;
}

export function CoupleSetup({ user }: CoupleSetupProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const createCouple = async () => {
    const newInviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    try {
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .insert([
          {
            partner1_id: user.uid,
            invite_code: newInviteCode,
          },
        ])
        .select()
        .single();

      if (coupleError) throw coupleError;

      const { error: userError } = await supabase
        .from('profiles')
        .update({
          couple_id: coupleData.id,
          role: 'partner1',
        })
        .eq('id', user.uid);

      if (userError) throw userError;
      
      // Refresh page or trigger state update in App.tsx
      window.location.reload();
    } catch (err) {
      console.error('Error creating couple:', err);
      setError('Erro ao criar casal.');
    }
  };

  const joinCouple = async () => {
    setError('');
    if (!inviteCode) return;

    try {
      const { data: coupleData, error: coupleError } = await supabase
        .from('couples')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (coupleError || !coupleData) {
        setError('Código de convite inválido.');
        return;
      }

      if (coupleData.partner2_id) {
        setError('Este casal já está completo.');
        return;
      }

      const { error: updateCoupleError } = await supabase
        .from('couples')
        .update({
          partner2_id: user.uid,
        })
        .eq('id', coupleData.id);

      if (updateCoupleError) throw updateCoupleError;

      const { error: userError } = await supabase
        .from('profiles')
        .update({
          couple_id: coupleData.id,
          role: 'partner2',
        })
        .eq('id', user.uid);

      if (userError) throw userError;

      window.location.reload();
    } catch (err) {
      console.error('Error joining couple:', err);
      setError('Erro ao entrar no casal.');
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 oficina-grid">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass p-8 rounded-3xl space-y-8"
      >
        <div className="text-center space-y-2">
          <Heart className="w-12 h-12 text-brand-purple mx-auto" />
          <h2 className="text-3xl font-bold">Oficina do Casal</h2>
          <p className="text-slate-400">
            Para começar, crie um novo casal ou entre em um existente.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={createCouple}
            className="w-full bg-brand-purple hover:bg-brand-purple/80 text-white font-bold py-4 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Users className="w-5 h-5" />
            Criar Novo Casal
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-brand-slate px-2 text-slate-500">Ou entre em um</span>
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Código de convite"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full bg-brand-dark/50 border border-slate-700 text-white p-4 rounded-2xl focus:outline-none focus:border-brand-purple"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={joinCouple}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-6 rounded-2xl transition-all"
            >
              Entrar no Casal
            </button>
          </div>
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </motion.div>
    </div>
  );
}
