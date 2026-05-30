import type { Session, Subscription } from '@supabase/supabase-js';

import { supabase } from '@/shared/api/supabaseClient';
import { AppError, mapSupabaseError } from '@/shared/api/errors';

export const authRepo = {
  async getSession(): Promise<Session | null> {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw mapSupabaseError(error, 'Could not load session.');
    return data.session;
  },

  async signInWithPassword(email: string, password: string): Promise<Session> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      throw new AppError('auth', error?.message ?? 'Sign-in failed.', error);
    }
    return data.session;
  },

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw new AppError('auth', error.message, error);
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw new AppError('auth', error.message, error);
  },

  onAuthStateChange(callback: (session: Session | null) => void): Subscription {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return data.subscription;
  },
};
