import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { UserProfile } from '../types';

// Local Storage Keys
const STORAGE_KEYS = {
  CURRENT_USER: 'pos_local_current_user',
  USERS: 'pos_local_users'
};

// --- Local Auth Helpers ---
const getLocalUser = (): UserProfile | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

const saveLocalUser = (user: UserProfile) => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
};

const removeLocalUser = () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// --- Auth Service ---
export const authService = {
  onAuthStateChange: (callback: (user: UserProfile | null) => void) => {
    // Firebase Auth Listener
    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // We'll let App.tsx handle the profile fetching/creation
        // But we return a basic profile for now
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          role: 'staff',
          createdAt: new Date() as any
        });
      } else {
        // If no firebase user, check local
        const localUser = getLocalUser();
        callback(localUser);
      }
    });

    return () => {
      unsubscribeFirebase();
    };
  },

  loginWithGoogle: async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Login Error:', error);
      throw error;
    }
  },

  loginLocal: async (username: string, password: string): Promise<UserProfile> => {
    // Simple local auth for demo/offline mode
    // In a real app, this would call a backend
    if (username === 'admin' && password === 'admin') {
      const user: UserProfile = {
        uid: 'local-admin',
        email: 'admin@local.pos',
        displayName: 'Local Admin',
        role: 'admin',
        createdAt: new Date() as any
      };
      saveLocalUser(user);
      return user;
    } else if (username === 'staff' && password === 'staff') {
      const user: UserProfile = {
        uid: 'local-staff',
        email: 'staff@local.pos',
        displayName: 'Local Staff',
        role: 'staff',
        createdAt: new Date() as any
      };
      saveLocalUser(user);
      return user;
    } else {
      throw new Error('Invalid credentials. Use admin/admin or staff/staff.');
    }
  },

  logout: async () => {
    try {
      await signOut(auth);
      removeLocalUser();
    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  }
};
