/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { UserProfile, Couple } from './types';
import { Auth } from './components/Auth';
import { CoupleSetup } from './components/CoupleSetup';
import { Dashboard } from './components/Dashboard';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleUserSession(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        handleUserSession(session.user);
      } else {
        setUser(null);
        setCouple(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserSession = async (supabaseUser: any) => {
    try {
      // Fetch or create profile
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([
            {
              id: supabaseUser.id,
              display_name: supabaseUser.user_metadata.full_name || supabaseUser.email,
              email: supabaseUser.email,
              photo_url: supabaseUser.user_metadata.avatar_url,
            },
          ])
          .select()
          .single();

        if (createError) throw createError;
        profile = newProfile;
      } else if (error) {
        throw error;
      }

      const userData: UserProfile = {
        uid: profile.id,
        displayName: profile.display_name,
        email: profile.email,
        photoURL: profile.photo_url,
        coupleId: profile.couple_id,
        role: profile.role,
      };
      setUser(userData);

      if (userData.coupleId) {
        const { data: coupleData, error: coupleError } = await supabase
          .from('couples')
          .select('*')
          .eq('id', userData.coupleId)
          .single();

        if (coupleError) throw coupleError;
        setCouple({
          id: coupleData.id,
          partner1Id: coupleData.partner1_id,
          partner2Id: coupleData.partner2_id,
          inviteCode: coupleData.invite_code,
          createdAt: coupleData.created_at,
        } as Couple);
      }
    } catch (error) {
      console.error('Error handling user session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 text-center">
          <div className="bg-brand-purple/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-brand-purple" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Configuração Necessária</h1>
          <p className="text-gray-300 mb-6">
            Para que o aplicativo funcione, você precisa configurar as variáveis de ambiente do Supabase no menu <strong>Settings &gt; Secrets</strong>:
          </p>
          <div className="bg-black/30 rounded-lg p-4 mb-6 text-left font-mono text-sm">
            <div className="text-brand-purple mb-2">VITE_SUPABASE_URL</div>
            <div className="text-gray-400 mb-4">https://xyz.supabase.co</div>
            <div className="text-brand-purple mb-2">VITE_SUPABASE_ANON_KEY</div>
            <div className="text-gray-400">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
          </div>
          <p className="text-xs text-gray-400">
            Após configurar as chaves, reinicie o servidor ou atualize a página.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-brand-purple animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!user.coupleId || !couple) {
    return <CoupleSetup user={user} />;
  }

  return <Dashboard user={user} couple={couple} />;
}
