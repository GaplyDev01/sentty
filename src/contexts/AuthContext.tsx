import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { historyService } from '../services/historyService';
import { bookmarkService } from '../services/bookmarkService';
import { articleCache } from '../utils/cacheUtils';
import { getDefaultPreferences, updateUserPreferences } from '../services/preferencesService';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile } from '../types/newsapi';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any, data: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        setProfile(data);
        // Check if user has admin role
        setIsAdmin(data.role === 'admin');
        console.log('User role:', data.role, 'isAdmin:', data.role === 'admin');
        
        // Ensure user preferences exist
        await ensureUserPreferences(userId);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setLoading(false);
    }
  }

  async function ensureUserPreferences(userId: string) {
    try {
      const { count } = await supabase
        .from('user_preferences')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (count === 0) {
        console.log('Creating default preferences for user:', userId);
        const defaultPrefs = getDefaultPreferences(userId);
        await updateUserPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Error ensuring user preferences:', error);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      console.error('Error signing in:', error);
      return { error };
    }
  }

  async function signUp(email: string, password: string, username: string) {
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (!error && data.user) {
        try {
          // Use the RPC function to bypass RLS and create the profile
          await supabase.rpc('insert_user_profile', {
            user_id: data.user.id,
            user_email: email,
            user_name: username,
            user_role: email.toLowerCase().endsWith('@blindvibe.com') ? 'admin' : 'user'
          });
          
          // Create default user preferences
          console.log('Creating default preferences for new user');
          const defaultPrefs = getDefaultPreferences(data.user.id);
          await updateUserPreferences(defaultPrefs);
        } catch (err) {
          console.error('Error creating profile or preferences:', err);
          return { data, error: err };
        }
      }

      return { data, error };
    } catch (error) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  }

  async function signOut() {
    try {
      // Clear caches before signing out
      articleCache.clear();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};