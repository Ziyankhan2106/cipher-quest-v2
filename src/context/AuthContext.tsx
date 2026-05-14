import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  xp: number;
  level: number;
  gameData?: {
    tutorialFinished?: boolean;
    tutorialStepIndex?: number;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  updateXp: (delta: number) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  updateXp: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUser({ uid: data.uid, ...data.profile });
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateXp = async (delta: number) => {
    try {
      const res = await fetch('/api/me/xp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ delta }),
      });
      if (res.ok) {
        await refreshUser();
      }
    } catch (err) {
      console.error("Failed to update XP:", err);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    window.location.href = '/account?mode=login';
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, updateXp, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
