import { create } from 'zustand';
import { auth } from '../../../config/firebase';
import { 
  onAuthStateChanged
} from 'firebase/auth';
import { User } from '../domain/User';
import { authRepository } from '../data/authRepository';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName?: string, lastName?: string, displayName?: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  
  initializeAuth: async () => {
    set({ isLoading: true });
    return new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            // Get user data from our repository
            const user = await authRepository.getCurrentUser();
            if (user) {
              set({ 
                user, 
                isAuthenticated: true, 
                isLoading: false,
                error: null 
              });
            } else {
              // User in Firebase but not in our system
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: 'User not found in system'
              });
            }
          } catch (error) {
            console.error('Error initializing auth:', error);
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: 'Failed to initialize authentication'
            });
          }
        } else {
          set({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false,
            error: null 
          });
          // Clear token if no user
          localStorage.removeItem('authToken');
        }
        unsubscribe();
        resolve();
      });
    });
  },
  
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepository.login(email, password);
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Login failed' 
      });
      throw error;
    }
  },
  
  register: async (email: string, password: string, firstName?: string, lastName?: string, displayName?: string, phone?: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authRepository.register(email, password, firstName, lastName, displayName, phone);
      
      set({ 
        user, 
        isAuthenticated: true, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      });
      throw error;
    }
  },
  
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authRepository.logout();
      set({ 
        user: null, 
        isAuthenticated: false, 
        isLoading: false,
        error: null 
      });
    } catch (error) {
      set({ 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Logout failed' 
      });
      throw error;
    }
  },
})); 