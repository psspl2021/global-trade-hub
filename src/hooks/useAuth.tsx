import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, data: any) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data,
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: 'Registration successful',
        description: 'You can now log in with your credentials.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      toast({
        title: 'Signed out successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Sign out failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
};
