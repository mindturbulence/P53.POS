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
import { Product, Transaction, UserProfile, Tenant } from '../types';

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
  CURRENT_USER: 'pos_local_current_user',
  TENANTS: 'pos_local_tenants'
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
  getProducts: (tenantId: string, callback: (products: Product[]) => void) => {
    if (useFirebase) {
      const q = query(collection(db, 'products'), where('tenantId', '==', tenantId), orderBy('name'));
      return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    } else {
      const products = getLocal<Product>(STORAGE_KEYS.PRODUCTS).filter(p => p.tenantId === tenantId);
      callback(products);
      return () => {}; // No-op for local
    }
  },

  getAllProducts: (callback: (products: Product[]) => void) => {
    if (useFirebase) {
      const q = query(collection(db, 'products'), orderBy('name'));
      return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        callback(products);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'products'));
    } else {
      const products = getLocal<Product>(STORAGE_KEYS.PRODUCTS);
      callback(products);
      return () => {};
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
  getTransactions: (tenantId: string, callback: (transactions: Transaction[]) => void) => {
    if (useFirebase) {
      const q = query(collection(db, 'transactions'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'), limit(50));
      return onSnapshot(q, (snapshot) => {
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        callback(transactions);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'transactions'));
    } else {
      const transactions = getLocal<Transaction>(STORAGE_KEYS.TRANSACTIONS).filter(t => t.tenantId === tenantId);
      callback(transactions.sort((a, b) => (b.createdAt as any) - (a.createdAt as any)));
      return () => {};
    }
  },

  getAllTransactions: (callback: (transactions: Transaction[]) => void) => {
    if (useFirebase) {
      const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(100));
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
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          // Migration: Ensure tenantId exists for old users
          if (!data.tenantId) {
            data.tenantId = uid;
          }
          return data;
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'users');
        return null;
      }
    } else {
      const users = getLocal<UserProfile>(STORAGE_KEYS.USERS);
      const user = users.find(u => u.uid === uid) || null;
      if (user && !user.tenantId) {
        user.tenantId = 'default';
      }
      return user;
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
  },

  getUsersByTenant: (tenantId: string, callback: (users: UserProfile[]) => void) => {
    if (useFirebase) {
      const q = query(collection(db, 'users'), where('tenantId', '==', tenantId), orderBy('createdAt', 'desc'));
      return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
        callback(users);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    } else {
      const users = getLocal<UserProfile>(STORAGE_KEYS.USERS).filter(u => u.tenantId === tenantId);
      callback(users);
      return () => {};
    }
  },

  deleteUser: async (uid: string) => {
    if (useFirebase) {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'users');
      }
    } else {
      const users = getLocal<UserProfile>(STORAGE_KEYS.USERS);
      saveLocal(STORAGE_KEYS.USERS, users.filter(u => u.uid !== uid));
    }
  },

  // Tenants
  getTenants: (callback: (tenants: Tenant[]) => void) => {
    if (useFirebase) {
      const q = query(collection(db, 'tenants'), orderBy('name'));
      return onSnapshot(q, (snapshot) => {
        const tenants = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tenant));
        callback(tenants);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'tenants'));
    } else {
      const tenants = getLocal<Tenant>(STORAGE_KEYS.TENANTS);
      callback(tenants);
      return () => {};
    }
  },

  updateTenantSubscription: async (tenantId: string, subscription: Tenant['subscription']) => {
    if (useFirebase) {
      try {
        const docRef = doc(db, 'tenants', tenantId);
        await updateDoc(docRef, { subscription });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'tenants');
      }
    } else {
      const tenants = getLocal<Tenant>(STORAGE_KEYS.TENANTS);
      const updated = tenants.map(t => t.id === tenantId ? { ...t, subscription } : t);
      saveLocal(STORAGE_KEYS.TENANTS, updated);
    }
  },

  addTenant: async (tenant: Omit<Tenant, 'id'>) => {
    if (useFirebase) {
      try {
        const docRef = await addDoc(collection(db, 'tenants'), {
          ...tenant,
          createdAt: Timestamp.now()
        });
        return docRef.id;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'tenants');
      }
    } else {
      const tenants = getLocal<Tenant>(STORAGE_KEYS.TENANTS);
      const newTenant = { ...tenant, id: Date.now().toString(), createdAt: new Date() as any } as Tenant;
      saveLocal(STORAGE_KEYS.TENANTS, [...tenants, newTenant]);
      return newTenant.id;
    }
  },

  getTenant: async (id: string): Promise<Tenant | null> => {
    if (useFirebase) {
      try {
        const docRef = doc(db, 'tenants', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Tenant : null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'tenants');
        return null;
      }
    } else {
      const tenants = getLocal<Tenant>(STORAGE_KEYS.TENANTS);
      return tenants.find(t => t.id === id) || null;
    }
  },

  // System Management
  exportData: async () => {
    if (useFirebase) {
      const collections = ['products', 'transactions', 'tenants', 'users'];
      const data: Record<string, any> = {};
      
      for (const colName of collections) {
        const snapshot = await getDocs(collection(db, colName));
        data[colName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      return data;
    } else {
      return {
        products: getLocal(STORAGE_KEYS.PRODUCTS),
        transactions: getLocal(STORAGE_KEYS.TRANSACTIONS),
        tenants: getLocal(STORAGE_KEYS.TENANTS),
        users: getLocal(STORAGE_KEYS.USERS)
      };
    }
  },

  importData: async (data: Record<string, any[]>) => {
    if (useFirebase) {
      for (const [colName, docs] of Object.entries(data)) {
        for (const docData of docs) {
          const { id, ...rest } = docData;
          await setDoc(doc(db, colName, id), rest);
        }
      }
    } else {
      if (data.products) saveLocal(STORAGE_KEYS.PRODUCTS, data.products);
      if (data.transactions) saveLocal(STORAGE_KEYS.TRANSACTIONS, data.transactions);
      if (data.tenants) saveLocal(STORAGE_KEYS.TENANTS, data.tenants);
      if (data.users) saveLocal(STORAGE_KEYS.USERS, data.users);
    }
  }
};
