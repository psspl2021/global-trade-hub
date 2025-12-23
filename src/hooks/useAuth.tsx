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

  const signUp = async (email: string, password: string, data: any, referralCode?: string | null) => {
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...data,
            referral_code: referralCode || undefined,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        // Handle specific database errors with user-friendly messages
        let errorMessage = error.message;
        
        if (error.message.includes('Database error saving new user')) {
          // This usually means a unique constraint violation on email or phone
          errorMessage = 'This email or phone number is already registered. Please use different credentials or try logging in.';
        } else if (error.message.includes('duplicate key') || error.message.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please try logging in instead.';
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'This email is already registered. Please try logging in instead.';
        }
        
        throw new Error(errorMessage);
      }

      // If user was created and we have a referral code, update the referral record with their ID
      if (authData?.user && referralCode) {
        await supabase
          .from('referrals')
          .update({ 
            referred_id: authData.user.id,
            status: 'signed_up',
            signed_up_at: new Date().toISOString()
          })
          .eq('referral_code', referralCode)
          .is('referred_id', null);
      }

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

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Google login failed',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Password reset email sent',
        description: 'Check your inbox for the reset link.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Password reset failed',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Password updated',
        description: 'Your password has been successfully changed.',
      });
      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Password update failed',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Clear local state first
      setUser(null);
      setSession(null);
      
      // Then sign out from Supabase (use local scope to avoid session_not_found errors)
      await supabase.auth.signOut({ scope: 'local' });

      toast({
        title: 'Signed out successfully',
      });
    } catch (error: any) {
      // Even if server signout fails, local state is already cleared
      if (import.meta.env.DEV) console.error('Sign out error:', error);
      toast({
        title: 'Signed out',
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
    signInWithGoogle,
    resetPassword,
    updatePassword,
  };
};
