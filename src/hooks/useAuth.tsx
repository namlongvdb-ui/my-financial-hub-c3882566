import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '@/lib/api-client';

type AppRole = 'admin' | 'lanh_dao' | 'nguoi_lap' | 'ke_toan' | 'phu_trach_dia_ban';

interface AppUser {
  id: string;
  email: string;
}

interface AuthContextType {
  user: AppUser | null;
  session: { token: string } | null;
  loading: boolean;
  roles: AppRole[];
  profile: { full_name: string; email: string | null; username: string | null; assigned_area: string | null } | null;
  isAdmin: boolean;
  hasRole: (role: AppRole) => boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<{ token: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  // On mount, check if we have a saved token
  useEffect(() => {
    const checkAuth = async () => {
      if (!authApi.isLoggedIn()) {
        setLoading(false);
        return;
      }

      const { data, error } = await authApi.getMe();
      if (data && !error) {
        setUser(data.user);
        setSession({ token: authApi.getToken()! });
        setRoles((data.roles || []) as AppRole[]);
        setProfile(data.profile);
      } else {
        // Token invalid, clear it
        authApi.logout();
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authApi.login(email, password);
    if (error) return { error };

    if (data) {
      setUser(data.user);
      setSession({ token: data.token });
      setRoles((data.roles || []) as AppRole[]);
      setProfile(data.profile);
    }
    return { error: null };
  };

  const signOut = async () => {
    authApi.logout();
    setUser(null);
    setSession(null);
    setRoles([]);
    setProfile(null);
  };

  const isAdmin = roles.includes('admin');
  const hasRole = (role: AppRole) => roles.includes(role);

  return (
    <AuthContext.Provider value={{ user, session, loading, roles, profile, isAdmin, hasRole, signIn, signOut }}>
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

export default useAuth;
