import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { directus, User } from '@/lib/directus';
import { readMe, logout } from '@directus/sdk';

export type UserRole = 'Super Admin' | 'Dispatcher' | 'Maintenance Officer' | 'Driver';

interface DirectusAuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isDriver: boolean;
}

const DirectusAuthContext = createContext<DirectusAuthContextType>({
  user: null,
  role: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
  isAdmin: false,
  isDriver: false,
});

export const useDirectusAuth = () => useContext(DirectusAuthContext);

export const DirectusAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setTokens = (accessToken: string, refreshToken: string, expiresIn: number) => {
    localStorage.setItem('directus_access_token', accessToken);
    localStorage.setItem('directus_refresh_token', refreshToken);
    localStorage.setItem('directus_token_expires', String(Date.now() + expiresIn));
    
    // Schedule token refresh before expiration (5 minutes before)
    const refreshTime = expiresIn - 5 * 60 * 1000;
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    refreshTimeoutRef.current = setTimeout(() => {
      refreshAccessToken();
    }, refreshTime);
  };

  const clearTokens = () => {
    localStorage.removeItem('directus_access_token');
    localStorage.removeItem('directus_refresh_token');
    localStorage.removeItem('directus_token_expires');
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  };

  const getAccessToken = () => localStorage.getItem('directus_access_token');
  const getRefreshToken = () => localStorage.getItem('directus_refresh_token');

  const refreshAccessToken = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055'}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      setTokens(data.data.access_token, data.data.refresh_token, data.data.expires);
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearTokens();
      setUser(null);
      setRole(null);
      navigate('/auth');
    }
  };

  const fetchUser = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('No access token');
      }

      const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055'}/users/me?fields=*,role.name`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }

      const result = await response.json();
      const userData = result.data;
      
      setUser(userData as any);
      setRole((userData.role as any)?.name || null);
    } catch (error) {
      console.error('Error fetching user:', error);
      clearTokens();
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for existing session
    const token = getAccessToken();
    const expiresAt = localStorage.getItem('directus_token_expires');
    
    if (token && expiresAt) {
      const now = Date.now();
      const expires = parseInt(expiresAt, 10);
      
      if (now < expires) {
        // Token is still valid
        fetchUser();
        
        // Schedule refresh
        const refreshTime = expires - now - 5 * 60 * 1000;
        if (refreshTime > 0) {
          refreshTimeoutRef.current = setTimeout(() => {
            refreshAccessToken();
          }, refreshTime);
        } else {
          // Token expires soon, refresh now
          refreshAccessToken();
        }
      } else {
        // Token expired, try to refresh
        refreshAccessToken().then(() => fetchUser());
      }
    } else {
      setLoading(false);
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055'}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const result = await response.json();
      const { access_token, refresh_token, expires } = result.data;
      
      setTokens(access_token, refresh_token, expires);
      await fetchUser();
      
      // Redirect based on role will be handled by the app after user is fetched
      // The role check happens in the component that called signIn
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await fetch(`${import.meta.env.VITE_DIRECTUS_URL || 'http://localhost:8055'}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      setUser(null);
      setRole(null);
      navigate('/auth');
    }
  };

  const isAdmin = role === 'Super Admin' || role === 'Dispatcher' || role === 'Maintenance Officer';
  const isDriver = role === 'Driver';

  return (
    <DirectusAuthContext.Provider value={{ 
      user, 
      role, 
      loading, 
      signIn, 
      signOut,
      isAdmin,
      isDriver
    }}>
      {children}
    </DirectusAuthContext.Provider>
  );
};
