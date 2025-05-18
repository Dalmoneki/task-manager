// mkdir -p src/app/stores
import { create } from "zustand";
import { supabase } from "../../lib/supabaseClient";
import type { User } from "../types/task";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  getUser: () => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  error: null,

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError) {
        // Create fallback profile
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            username: email.split("@")[0],
            avatar_url: null,
          })
          .select("id, username, avatar_url")
          .single();

        if (insertError) throw insertError;
        set({ user: newProfile, isLoading: false });
      } else {
        set({ user: profile, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  signUp: async (email, password, username) => {
    set({ isLoading: true, error: null });

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;

      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            username,
            avatar_url: null,
          })
          .select("id, username, avatar_url")
          .single();

        if (profileError) throw profileError;

        set({
          user: profileData,
          isLoading: false,
          error:
            "Please check your email for the confirmation link before signing in.",
        });
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ user: null, isLoading: false });
  },

  getUser: async () => {
    set({ isLoading: true, error: null });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user logged in");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileError) {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            username: user.email?.split("@")[0] || "user",
            avatar_url: null,
          })
          .select("id, username, avatar_url")
          .single();

        if (insertError) throw insertError;
        set({ user: newProfile, isLoading: false });
      } else {
        set({ user: profile, isLoading: false });
      }
    } catch (error) {
      set({ error: (error as Error).message, user: null, isLoading: false });
    }
  },

  resendConfirmation: async (email) => {
    set({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) throw error;

      set({
        error: "Confirmation email has been resent. Please check your inbox.",
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
