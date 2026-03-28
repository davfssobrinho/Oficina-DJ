import React from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function Auth() {
  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 oficina-grid">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="space-y-2">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="inline-block p-4 rounded-3xl bg-brand-purple/20 border border-brand-purple/30 mb-4"
          >
            <Sparkles className="w-12 h-12 text-brand-purple" />
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tighter text-white">
            OFICINA <span className="text-brand-purple">DJ</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Construindo o futuro, um real de cada vez.
          </p>
        </div>

        <div className="glass p-8 rounded-3xl space-y-6">
          <p className="text-slate-300">
            A oficina onde sonhos de casal se tornam projetos de vida.
          </p>
          <button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-brand-dark font-bold py-4 px-6 rounded-2xl hover:bg-slate-100 transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            Entrar com Google
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 uppercase tracking-widest font-bold">
          <div className="glass p-4 rounded-2xl">Planejamento</div>
          <div className="glass p-4 rounded-2xl">Conquista</div>
        </div>
      </motion.div>
    </div>
  );
}
