import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { AppRole } from "@/modules/publication-impact/types";

// Re-export so consumers can import from either location
export type UserRole = AppRole;

/** Roles that grant access to the Editor / Publication dashboard */
export const EDITOR_ROLES: UserRole[] = [
  "production_editor",
  "managing_editor",
  "associate_editor",
  "editor_in_chief",
  "system_admin",
];

/** Data captured from the registration form and passed to supabase.auth.signUp */
export interface SignUpData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  affiliation?: string;
  orcid_id?: string;
  role?: AppRole;
}

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string; role?: UserRole }>;
  signUp: (data: SignUpData) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Fetch a user's role from the public.profiles table.
 * Returns 'author' as default if no row or role is found.
 */
async function fetchRoleFromProfiles(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data?.role) return "author";
  return data.role as UserRole;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate user + role from an existing or changing session
  const hydrateUser = useCallback(async (currentUser: User | null) => {
    setUser(currentUser);
    if (currentUser) {
      const fetchedRole = await fetchRoleFromProfiles(currentUser.id);
      setRole(fetchedRole);
    } else {
      setRole(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      hydrateUser(session?.user ?? null);
    });

    // Listen for future auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      hydrateUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [hydrateUser]);

  /**
   * Sign in with email + password.
   * Returns the resolved role so callers (e.g., LoginPage) can redirect accordingly.
   */
  const signIn = useCallback(
    async (
      email: string,
      password: string
    ): Promise<{ error?: string; role?: UserRole }> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };

      // Immediately resolve role for the calling page's redirect logic
      const userId = data.user?.id;
      const resolvedRole = userId
        ? await fetchRoleFromProfiles(userId)
        : "author";
      setRole(resolvedRole);

      return { role: resolvedRole };
    },
    []
  );

  /**
   * Register a new user with email + password.
   * All fields are passed via options.data (raw_user_meta_data) so the DB
   * trigger `on_auth_user_created` can extract them into the profiles row.
   */
  const signUp = useCallback(
    async (formData: SignUpData): Promise<{ error?: string }> => {
      // Build the metadata payload — only include optional fields if they
      // have a value so the trigger receives NULL instead of empty strings
      const metadata: Record<string, string> = {
        first_name: formData.first_name,
        last_name: formData.last_name,
      };
      if (formData.middle_name) metadata.middle_name = formData.middle_name;
      if (formData.suffix) metadata.suffix = formData.suffix;
      if (formData.affiliation) metadata.affiliation = formData.affiliation;
      if (formData.orcid_id) metadata.orcid_id = formData.orcid_id;
      if (formData.role) metadata.role = formData.role;

      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: metadata },
      });
      if (error) return { error: error.message };
      return {};
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
