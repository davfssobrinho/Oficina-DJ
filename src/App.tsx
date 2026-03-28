/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { UserProfile, Couple } from './types';
import { Auth } from './components/Auth';
import { CoupleSetup } from './components/CoupleSetup';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
