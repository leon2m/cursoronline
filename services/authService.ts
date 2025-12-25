
import { User } from '../types';

const USERS_KEY = 'cursor_users';
const CURRENT_USER_KEY = 'cursor_current_user';

// Helper for realistic delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const AuthService = {
  login: async (email: string, password: string): Promise<User> => {
    await delay(800);

    try {
      const usersStr = localStorage.getItem(USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : [];
      
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (user) {
        const { password, ...safeUser } = user;
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
        return safeUser;
      }
    } catch (e) {
      console.error("Auth DB Error", e);
    }
    
    throw new Error('Invalid credentials');
  },

  register: async (email: string, password: string, displayName: string): Promise<User> => {
    await delay(800);

    try {
      const usersStr = localStorage.getItem(USERS_KEY);
      const users = usersStr ? JSON.parse(usersStr) : [];

      if (users.find((u: any) => u.email === email)) {
        throw new Error('User already exists');
      }

      const newUser = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        password,
        displayName,
        avatar: displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
      };

      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      
      const { password: _, ...safeUser } = newUser;
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));
      return safeUser;
    } catch (e: any) {
      throw new Error(e.message || 'Registration failed');
    }
  },

  logout: async () => {
    await delay(200);
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  // Synchronous check for initial load
  getCurrentUser: (): User | null => {
    try {
      const userStr = localStorage.getItem(CURRENT_USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  }
};
