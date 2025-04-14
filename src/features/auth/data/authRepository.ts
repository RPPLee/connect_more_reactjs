import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "../../../config/firebase";
import { User } from "../domain/User";
import api from "../../../services/api";

export const authRepository = {
  // Register a new user
  register: async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    displayName?: string,
    phone?: string
  ): Promise<User> => {
    try {
      // First, create the Firebase user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Update profile if display name is provided
      if (displayName) {
        await updateProfile(firebaseUser, { displayName });
      } else if (firstName && lastName) {
        const fullName = `${firstName} ${lastName}`;
        await updateProfile(firebaseUser, { displayName: fullName });
      }

      // Get token
      const token = await firebaseUser.getIdToken();

      // Now register with our backend
      const response = await api.post("/auth/signup", {
        firebase_uid: firebaseUser.uid,
        email: email,
        display_name:
          displayName ||
          (firstName && lastName ? `${firstName} ${lastName}` : null),
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        role_id: 3, // Basic user role
        self: true,
      });

      // Combine Firebase user with backend data
      return {
        ...mapFirebaseUserToUser(firebaseUser, token),
        ...mapBackendUserToUser(response.data.data),
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Login existing user
  login: async (email: string, password: string): Promise<User> => {
    try {
      // First, authenticate with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Get token
      const token = await firebaseUser.getIdToken();

      // Then get user data from our backend - PASS THE EMAIL as a query parameter
      const response = await api.get("/auth/login", {
        params: { email: email },
      });

      console.log("Backend login response:", response);
      console.log("Backend login response structure:", {
        type: typeof response,
        hasData: 'data' in response,
        dataType: response.data ? typeof response.data : 'N/A',
        responseKeys: Object.keys(response),
        dataKeys: response.data ? Object.keys(response.data) : [],
      });
      
      // Extract the data based on the Lambda function response format
      // The Lambda returns { data: { ... }, message: string, success: boolean }
      const userData = response.data?.data || {};
      
      console.log("Extracted user data:", userData);
      console.log("User data keys:", Object.keys(userData));
      
      // Check specifically for organizer information
      console.log("Organizer info check:", {
        organizerId: userData.organizer_id,
        organizerObj: userData.organizer,
        hasOrganizerField: 'organizer' in userData,
        hasOrganizerIdField: 'organizer_id' in userData,
      });
      
      // Combine Firebase user with backend data
      const combinedUser = {
        ...mapFirebaseUserToUser(firebaseUser, token),
        ...mapBackendUserToUser(userData),
      };
      
      console.log("Combined user with organizer info:", {
        id: combinedUser.id,
        email: combinedUser.email,
        organizerId: combinedUser.organizerId,
        isOrganizer: combinedUser.isOrganizer,
        roles: combinedUser.roles,
      });
      
      return combinedUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout user
  logout: async (): Promise<void> => {
    await signOut(auth);
    localStorage.removeItem("authToken");
  },

  // Send password reset email
  sendPasswordReset: async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  },

  // Also update this in getCurrentUser method
  getCurrentUser: async (): Promise<User | null> => {
    return new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        unsubscribe();

        if (firebaseUser) {
          try {
            const token = await firebaseUser.getIdToken();
            // Get user data from backend - PASS THE EMAIL here too
            const response = await api.get("/auth/login", {
              params: { email: firebaseUser.email },
            });

            console.log("Backend getCurrentUser response:", response);
            console.log("Backend getCurrentUser response structure:", {
              type: typeof response,
              hasData: 'data' in response,
              dataType: response.data ? typeof response.data : 'N/A',
              responseKeys: Object.keys(response),
              dataKeys: response.data ? Object.keys(response.data) : [],
            });
            
            // Extract the data based on the Lambda function response format
            // The Lambda returns { data: { ... }, message: string, success: boolean }
            const userData = response.data?.data || {};
            
            console.log("Extracted user data in getCurrentUser:", userData);
            console.log("User data keys in getCurrentUser:", Object.keys(userData));
            
            // Check specifically for organizer information
            console.log("Organizer info check in getCurrentUser:", {
              organizerId: userData.organizer_id,
              organizerObj: userData.organizer,
              hasOrganizerField: 'organizer' in userData,
              hasOrganizerIdField: 'organizer_id' in userData,
            });
            
            const user = {
              ...mapFirebaseUserToUser(firebaseUser, token),
              ...mapBackendUserToUser(userData),
            };
            
            console.log("Combined user with organizer info in getCurrentUser:", {
              id: user.id,
              email: user.email,
              organizerId: user.organizerId,
              isOrganizer: user.isOrganizer,
              roles: user.roles,
            });
            
            resolve(user);
          } catch (error) {
            console.error("Error getting current user data:", error);
            // Fall back to just Firebase user data
            const token = await firebaseUser.getIdToken();
            const user = mapFirebaseUserToUser(firebaseUser, token);
            resolve(user);
          }
        } else {
          resolve(null);
        }
      });
    });
  },
};

// Helper function to map Firebase user to our User model
const mapFirebaseUserToUser = (
  firebaseUser: FirebaseUser,
  token: string
): User => {
  return {
    id: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    email: firebaseUser.email || "",
    displayName: firebaseUser.displayName || undefined,
    photoURL: firebaseUser.photoURL || undefined,
    phoneNumber: firebaseUser.phoneNumber || undefined,
    emailVerified: firebaseUser.emailVerified,
    token: token,
  };
};

// Helper function to map backend user data to our User model
const mapBackendUserToUser = (backendData: Record<string, unknown>): Partial<User> => {
  // Convert role objects to just IDs
  const roleIds = backendData?.roles
    ? (backendData.roles as Array<{ id: number }>).map((role: { id: number }) => role.id)
    : [];

  return {
    id: String(backendData?.id || ""),
    email: String(backendData?.email || ""),
    displayName: backendData?.display_name as string | undefined,
    firstName: backendData?.first_name as string | undefined,
    lastName: backendData?.last_name as string | undefined,
    phoneNumber: backendData?.phone as string | undefined,
    roles: roleIds,
    isActive: Boolean(backendData?.is_active),
    self: Boolean(backendData?.self),
    upcomingEvents: backendData?.upcoming_events as Array<Record<string, unknown>> | undefined,
    firebaseUid: backendData?.firebase_uid as string | undefined,
    organizerId:
      (backendData?.organizer_id as number | undefined) ||
      (backendData?.organizer ? (backendData.organizer as Record<string, unknown>).id as number : undefined),
    isOrganizer: Boolean(backendData?.organizer_id) || Boolean(backendData?.organizer),
  };
};
