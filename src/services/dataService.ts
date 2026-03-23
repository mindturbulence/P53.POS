import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  addDoc 
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Product, Transaction, UserProfile } from '../types';

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  try {
    // This is a simple check, we could do more robust validation
    return !!db && !!auth;
  } catch (e) {
    return false;
  }
};

export const useFirebase = isFirebaseConfigured();

// Local Storage Keys
const STORAGE_KEYS = {
  PRODUCTS: 'pos_local_products',
  TRANSACTIONS: 'pos_local_transactions',
  USERS: 'pos_local_users',
  CURRENT_USER: 'pos_local_current_user'
};

// --- Local Storage Helpers ---
const getLocal = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveLocal = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// --- Data Service ---
export const dataService = {
  // Products
  getProducts: (callback: (products: Product[]) => void) => {
    if (useFirebase) {
      const q = query(collection(db, 'products'), orderBy('name'));
      return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    } else {
      const products = getLocal<Product>(STORAGE_KEYS.PRODUCTS);
      callback(products);
      return () => {}; // No-op for local
    }
  },

  addProduct: async (product: Omit<Product, 'id'>) => {
    if (useFirebase) {
      try {
        const docRef = await addDoc(collection(db, 'products'), {
          ...product,
          updatedAt: Timestamp.now()
        });
        return docRef.id;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'products');
      }
    } else {
      const products = getLocal<Product>(STORAGE_KEYS.PRODUCTS);
      const newProduct = { ...product, id: Date.now().toString(), updatedAt: new Date() as any } as Product;
      saveLocal(STORAGE_KEYS.PRODUCTS, [...products, newProduct]);
      return newProduct.id;
    }
  },

  updateProduct: async (id: string, updates: Partial<Product>) => {
    if (useFirebase) {
      try {
        const docRef = doc(db, 'products', id);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'products');
      }
    } else {
      const products = getLocal<Product>(STORAGE_KEYS.PRODUCTS);
      const updated = products.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date() as any } : p);
      saveLocal(STORAGE_KEYS.PRODUCTS, updated);
    }
  },

  deleteProduct: async (id: string) => {
    if (useFirebase) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'products');
      }
    } else {
      const products = getLocal<Product>(STORAGE_KEYS.PRODUCTS);
      saveLocal(STORAGE_KEYS.PRODUCTS, products.filter(p => p.id !== id));
    }
  },

  // Transactions
  getTransactions: (callback: (transactions: Transaction[]) => void) => {
    if (useFirebase) {
      const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        callback(transactions);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));
    } else {
      const transactions = getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS);
      callback(transactions.sort((a, b) => (b.createdAt as any) - (a.createdAt as any)));
      return () => {};
    }
  },

  addTransaction: async (transaction: Omit<Transaction, 'id'>) => {
    if (useFirebase) {
      try {
        const docRef = await addDoc(collection(db, 'transactions'), {
          ...transaction,
          createdAt: Timestamp.now()
        });
        return docRef.id;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'transactions');
      }
    } else {
      const transactions = getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS);
      const newTransaction = { ...transaction, id: Date.now().toString(), createdAt: new Date() as any } as Transaction;
      saveLocal(STORAGE_KEYS.TRANSACTIONS, [...transactions, newTransaction]);
      return newTransaction.id;
    }
  },

  // Auth / User
  getCurrentUser: async (uid: string): Promise<UserProfile | null> => {
    if (useFirebase) {
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
        return null;
      }
    } else {
      const users = getLocal<UserProfile>(STORAGE_KEYS.USERS);
      return users.find(u => u.uid === uid) || null;
    }
  },

  saveUser: async (user: UserProfile) => {
    if (useFirebase) {
      try {
        await setDoc(doc(db, 'users', user.uid), user);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'users');
      }
    } else {
      const users = getLocal<UserProfile>(STORAGE_KEYS.USERS);
      const existing = users.findIndex(u => u.uid === user.uid);
      if (existing > -1) {
        users[existing] = user;
      } else {
        users.push(user);
      }
      saveLocal(STORAGE_KEYS.USERS, users);
    }
  }
};
