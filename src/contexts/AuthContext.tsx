import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await ensureUserProfile(session.user);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setLoading(true);
        setUser(session?.user ?? null);
        if (session?.user) {
          await ensureUserProfile(session.user);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureTrailingSlash = (url: string) => (url.endsWith('/') ? url : `${url}/`);

  const resolveRedirectUrl = () => {
    const configured = import.meta.env.VITE_SUPABASE_REDIRECT_URL?.trim();
    if (configured) return ensureTrailingSlash(configured);

    if (window.location.hostname === 'localhost') {
      return ensureTrailingSlash(window.location.origin);
    }

    return ensureTrailingSlash('https://aulasac.onassessoriamkt.com.br');
  };

  const getAuthUserFullName = (authUser: User) => {
    const metadata = authUser.user_metadata as Record<string, unknown>;
    const nameFromMetadata =
      (metadata?.full_name as string | undefined) ??
      (metadata?.name as string | undefined) ??
      [metadata?.given_name, metadata?.family_name]
        .filter((part): part is string => typeof part === 'string' && part.length > 0)
        .join(' ');

    return nameFromMetadata || authUser.email || '';
  };

  const ensureUserProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        setIsAdmin(false);
        return;
      }

      if (!data) {
        const { error: insertError } = await supabase.from('user_profiles').insert({
          id: authUser.id,
          full_name: getAuthUserFullName(authUser),
          is_admin: false,
        });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
        }

        setIsAdmin(false);
        return;
      }

      setIsAdmin(data.is_admin ?? false);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: resolveRedirectUrl(),
      },
    });
    if (error) throw error;
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: resolveRedirectUrl(),
        data: {
          full_name: fullName,
        },
      },
    });
    if (error) throw error;

    if (data.user) {
      const { error: insertError } = await supabase.from('user_profiles').insert({
        id: data.user.id,
        full_name: fullName,
        is_admin: false,
      });

      if (insertError) {
        // If the profile already exists (e.g. user completed OAuth previously), just log the error.
        console.error('Error creating user profile after sign up:', insertError);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAdmin, signInWithGoogle, signInWithEmail, signUpWithEmail, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
