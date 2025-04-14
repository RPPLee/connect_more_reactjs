export interface User {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  photoURL?: string;
  emailVerified: boolean;
  isOrganizer?: boolean;
  organizerId?: number;
  token?: string;
  firebaseUid?: string;
  roles?: number[];
  isActive?: boolean;
  self?: boolean;
  upcomingEvents?: any[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
} 