import React, { useState, useEffect, useMemo } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  googleProvider, 
  auth, 
  db, 
  OperationType, 
  handleFirestoreError 
} from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  limit, 
  where,
  Timestamp
} from 'firebase/firestore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  History, 
  LogOut, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  ChevronRight, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  XCircle, 
  User as UserIcon, 
  Menu, 
  X, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Users 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { authService } from './services/authService';
import { dataService, useFirebase } from './services/dataService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UserProfile, Product, CartItem, Transaction, TransactionItem } from './types';

// Register GSAP plugin
gsap.registerPlugin(useGSAP);

// --- Components ---

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full mb-4"
    />
    <p className="text-stone-500 font-medium">Loading P53. POS...</p>
  </div>
);

const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (user: UserProfile) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLocal, setIsLocal] = useState(false);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await authService.loginLocal(username, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-stone-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">P53. POS</h1>
          <p className="text-stone-500">Simple, lightweight, and powerful Point of Sale for your business.</p>
        </div>

        {!isLocal ? (
          <div className="space-y-4">
            <button
              onClick={() => authService.loginWithGoogle()}
              className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 text-stone-700 py-3 rounded-xl font-medium hover:bg-stone-50 transition-all shadow-sm"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
              Continue with Google
            </button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-stone-400">Or</span></div>
            </div>
            <button
              onClick={() => setIsLocal(true)}
              className="w-full py-3 text-stone-500 hover:text-stone-900 font-medium transition-all"
            >
              Use Local Account
            </button>
          </div>
        ) : (
          <form onSubmit={handleLocalLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                placeholder="admin or staff"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                placeholder="admin or staff"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-all shadow-md"
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLocal(false)}
              className="w-full py-2 text-stone-400 hover:text-stone-600 text-sm font-medium transition-all"
            >
              Back to Google Login
            </button>
          </form>
        )}
        
        {!useFirebase && (
          <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-xs text-amber-700 text-center">
              <strong>Offline Mode:</strong> Firebase is not configured. Data will be saved locally in your browser.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'history' | 'dashboard'>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProductModal, setShowProductModal] = useState<{ show: boolean, product?: Product }>({ show: false });
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // --- Auth & Data Fetching ---

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      if (user && user.uid.startsWith('local-')) {
        setUser(user);
        setLoading(false);
      } else if (user) {
        // Firebase user detected, fetch full profile
        const profile = await dataService.getCurrentUser(user.uid);
        if (profile) {
          setUser(profile);
        } else {
          // Create new user profile in Firebase
          const newUser: UserProfile = {
            ...user,
            role: 'staff',
            createdAt: Timestamp.now(),
          };
          await dataService.saveUser(newUser);
          setUser(newUser);
        }
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribeProducts = dataService.getProducts(setProducts);
    const unsubscribeTransactions = dataService.getTransactions(setTransactions);

    return () => {
      unsubscribeProducts();
      unsubscribeTransactions();
    };
  }, [user]);

  // --- POS Logic ---

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.stock));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  // --- GSAP Animations ---
  useGSAP(() => {
    if (activeTab === 'pos' && filteredProducts.length > 0) {
      gsap.from('.product-card', {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: 'power3.out',
        clearProps: 'all'
      });
    }
  }, [activeTab, filteredProducts.length]);

  useGSAP(() => {
    if (activeTab === 'dashboard') {
      gsap.from('.stat-card', {
        scale: 0.9,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)'
      });
    }
  }, [activeTab]);

  useGSAP(() => {
    gsap.from('.nav-item', {
      x: -20,
      opacity: 0,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out',
      delay: 0.2
    });
  }, []);

  const handleCheckout = async () => {
    if (cart.length === 0 || !user) return;
    setCheckoutStatus('processing');

    try {
      const transactionItems: TransactionItem[] = cart.map(item => ({
        productId: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      }));

      const newTransaction: Omit<Transaction, 'id'> = {
        items: transactionItems,
        totalAmount: cartTotal,
        paymentMethod,
        status: 'completed',
        createdBy: user.uid,
        createdAt: Timestamp.now()
      };

      // Add transaction
      await dataService.addTransaction(newTransaction);

      // Update stock
      for (const item of cart) {
        await dataService.updateProduct(item.id, {
          stock: item.stock - item.quantity
        });
      }

      setCheckoutStatus('success');
      setCart([]);
      setTimeout(() => {
        setShowCheckoutModal(false);
        setCheckoutStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutStatus('error');
    }
  };

  // --- Inventory Logic ---

  const handleSaveProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      category: formData.get('category') as string,
      imageUrl: formData.get('imageUrl') as string || `https://picsum.photos/seed/${formData.get('name')}/200/200`,
      updatedAt: Timestamp.now(),
      createdBy: user.uid
    };

    try {
      if (showProductModal.product) {
        await dataService.updateProduct(showProductModal.product.id, productData);
      } else {
        await dataService.addProduct(productData);
      }
      setShowProductModal({ show: false });
    } catch (error) {
      console.error('Save product error:', error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await dataService.deleteProduct(id);
    } catch (error) {
      console.error('Delete product error:', error);
    }
  };

  // --- UI Helpers ---

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginScreen onLoginSuccess={setUser} />;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row font-sans text-stone-900">
        
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-stone-200 transform transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static
        `}>
          <div className="h-full flex flex-col p-6">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-stone-900 rounded-xl flex items-center justify-center">
                <ShoppingCart className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">P53. POS</span>
            </div>

            <nav className="flex-1 space-y-2">
              <button
                onClick={() => { setActiveTab('pos'); setIsSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'pos' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
              >
                <LayoutDashboard size={20} />
                <span className="font-medium">Point of Sale</span>
              </button>
              <button
                onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
              >
                <Package size={20} />
                <span className="font-medium">Inventory</span>
              </button>
              <button
                onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
              >
                <History size={20} />
                <span className="font-medium">Transactions</span>
              </button>
              <button
                onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
              >
                <TrendingUp size={20} />
                <span className="font-medium">Dashboard</span>
              </button>
            </nav>

            <div className="mt-auto pt-6 border-t border-stone-100">
              <div className="flex items-center gap-3 px-4 py-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden border border-stone-200">
                  <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Profile" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.displayName}</p>
                  <p className="text-xs text-stone-500 capitalize">{user.role}</p>
                </div>
              </div>
              <button
                onClick={() => authService.logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-stone-200 p-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-stone-900 w-6 h-6" />
            <span className="text-lg font-bold">P53.</span>
            {!useFirebase && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Offline</span>
            )}
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-stone-100 rounded-lg">
            <Menu size={24} />
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <AnimatePresence mode="wait">
              {activeTab === 'pos' && (
                <motion.div
                  key="pos"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col lg:flex-row gap-8 h-full"
                >
                  {/* Product Grid */}
                  <div className="flex-1 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold">Menu</h2>
                        {!useFirebase && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Offline</span>
                        )}
                      </div>
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 product-grid">
                      {filteredProducts.map((product, index) => (
                        <motion.button
                          key={product.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => addToCart(product)}
                          disabled={product.stock <= 0}
                          className={`
                            product-card group relative bg-white border border-stone-200 rounded-2xl p-3 text-left transition-all hover:shadow-lg hover:border-stone-300
                            ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                          `}
                        >
                          <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-stone-100">
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                          </div>
                          <h3 className="font-semibold text-stone-900 truncate">{product.name}</h3>
                          <p className="text-sm text-stone-500 mb-2">{product.category || 'Uncategorized'}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-stone-900">{formatCurrency(product.price)}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-600'}`}>
                              Stock: {product.stock}
                            </span>
                          </div>
                          {product.stock <= 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-2xl">
                              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Sold Out</span>
                            </div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Cart Sidebar */}
                  <div className="w-full lg:w-96 bg-white border border-stone-200 rounded-3xl shadow-xl flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                      <h2 className="text-xl font-bold">Current Order</h2>
                      <button onClick={() => setCart([])} className="text-stone-400 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-stone-400 text-center">
                          <ShoppingCart size={48} className="mb-4 opacity-20" />
                          <p>Your cart is empty</p>
                        </div>
                      ) : (
                        cart.map(item => (
                          <div key={item.id} className="flex gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0">
                              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-stone-900 truncate">{item.name}</h4>
                              <p className="text-sm text-stone-500">{formatCurrency(item.price)}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <button onClick={() => updateCartQuantity(item.id, -1)} className="w-6 h-6 rounded-md border border-stone-200 flex items-center justify-center hover:bg-stone-50">-</button>
                                <span className="text-sm font-medium">{item.quantity}</span>
                                <button onClick={() => updateCartQuantity(item.id, 1)} className="w-6 h-6 rounded-md border border-stone-200 flex items-center justify-center hover:bg-stone-50">+</button>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">{formatCurrency(item.price * item.quantity)}</p>
                              <button onClick={() => removeFromCart(item.id)} className="text-stone-300 hover:text-red-500 mt-2 transition-colors">
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-4">
                      <div className="flex justify-between items-center text-stone-500">
                        <span>Subtotal</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-500">
                        <span>Tax (0%)</span>
                        <span>{formatCurrency(0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold text-stone-900 pt-2 border-t border-stone-200">
                        <span>Total</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      <button
                        onClick={() => setShowCheckoutModal(true)}
                        disabled={cart.length === 0}
                        className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        Checkout
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'inventory' && (
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold">Inventory Management</h2>
                      {!useFirebase && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Offline Mode</span>
                      )}
                    </div>
                    {user.role === 'admin' && (
                      <button
                        onClick={() => setShowProductModal({ show: true })}
                        className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-stone-800 transition-all"
                      >
                        <Plus size={20} />
                        Add Product
                      </button>
                    )}
                  </div>

                  <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-stone-50 border-b border-stone-200">
                          <tr>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Price</th>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {products.map(product => (
                            <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-stone-100">
                                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                  <span className="font-semibold">{product.name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-stone-500">{product.category || '-'}</td>
                              <td className="px-6 py-4 font-medium">{formatCurrency(product.price)}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                  {product.stock} units
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {user.role === 'admin' && (
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setShowProductModal({ show: true, product })}
                                      className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                                    >
                                      <Edit2 size={18} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(product.id)}
                                      className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold">Transaction History</h2>
                  <div className="grid gap-4">
                    {transactions.map(tx => (
                      <div key={tx.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.paymentMethod === 'qris' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                            {tx.paymentMethod === 'qris' ? <CreditCard size={24} /> : <Banknote size={24} />}
                          </div>
                          <div>
                            <p className="font-bold text-lg">Order #{tx.id.slice(-6).toUpperCase()}</p>
                            <p className="text-sm text-stone-500">{tx.createdAt.toDate().toLocaleString()} • {tx.items.length} items</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-1">Total Amount</p>
                            <p className="text-xl font-black text-stone-900">{formatCurrency(tx.totalAmount)}</p>
                          </div>
                          <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {tx.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'dashboard' && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Business Overview</h2>
                    {user.role === 'admin' && products.length === 0 && (
                      <button
                        onClick={async () => {
                          const initialProducts = [
                            { name: 'Espresso', price: 25000, stock: 100, category: 'Coffee', imageUrl: 'https://picsum.photos/seed/espresso/200/200', createdBy: user.uid, updatedAt: Timestamp.now() },
                            { name: 'Latte', price: 35000, stock: 80, category: 'Coffee', imageUrl: 'https://picsum.photos/seed/latte/200/200', createdBy: user.uid, updatedAt: Timestamp.now() },
                            { name: 'Croissant', price: 20000, stock: 30, category: 'Pastry', imageUrl: 'https://picsum.photos/seed/croissant/200/200', createdBy: user.uid, updatedAt: Timestamp.now() },
                            { name: 'Iced Tea', price: 15000, stock: 200, category: 'Tea', imageUrl: 'https://picsum.photos/seed/icedtea/200/200', createdBy: user.uid, updatedAt: Timestamp.now() },
                          ];
                          for (const p of initialProducts) {
                            await dataService.addProduct(p);
                          }
                        }}
                        className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full hover:bg-stone-200"
                      >
                        Seed Initial Data
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="stat-card bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                          <DollarSign size={24} />
                        </div>
                        <span className="text-stone-500 font-medium">Total Revenue</span>
                      </div>
                      <p className="text-3xl font-black">{formatCurrency(transactions.reduce((sum, tx) => sum + tx.totalAmount, 0))}</p>
                      <div className="mt-4 flex items-center gap-2 text-green-600 text-sm font-bold">
                        <TrendingUp size={16} />
                        <span>+12.5% from last month</span>
                      </div>
                    </div>

                    <div className="stat-card bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center">
                          <ShoppingCart size={24} />
                        </div>
                        <span className="text-stone-500 font-medium">Total Sales</span>
                      </div>
                      <p className="text-3xl font-black">{transactions.length}</p>
                      <div className="mt-4 flex items-center gap-2 text-stone-400 text-sm font-bold">
                        <span>Across all branches</span>
                      </div>
                    </div>

                    <div className="stat-card bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                          <Users size={24} />
                        </div>
                        <span className="text-stone-500 font-medium">Top Products</span>
                      </div>
                      <div className="space-y-2">
                        {products.slice(0, 3).map(p => (
                          <div key={p.id} className="flex justify-between items-center text-sm">
                            <span className="text-stone-600 font-medium">{p.name}</span>
                            <span className="font-bold">{p.stock} in stock</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm">
                    <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
                    <div className="space-y-6">
                      {transactions.slice(0, 5).map(tx => (
                        <div key={tx.id} className="flex items-center gap-4">
                          <div className="w-2 h-2 rounded-full bg-stone-900" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              New order of <span className="font-bold">{formatCurrency(tx.totalAmount)}</span> completed
                            </p>
                            <p className="text-xs text-stone-400">{tx.createdAt.toDate().toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Modals */}

        {/* Product Modal */}
        <AnimatePresence>
          {showProductModal.show && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowProductModal({ show: false })}
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              >
                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold">{showProductModal.product ? 'Edit Product' : 'Add New Product'}</h3>
                  <button onClick={() => setShowProductModal({ show: false })} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Product Name</label>
                      <input
                        name="name"
                        required
                        defaultValue={showProductModal.product?.name}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        placeholder="e.g. Espresso"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Price (IDR)</label>
                        <input
                          name="price"
                          type="number"
                          required
                          defaultValue={showProductModal.product?.price}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                          placeholder="25000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Stock</label>
                        <input
                          name="stock"
                          type="number"
                          required
                          defaultValue={showProductModal.product?.stock}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                          placeholder="100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Category</label>
                      <input
                        name="category"
                        defaultValue={showProductModal.product?.category}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        placeholder="e.g. Coffee"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Image URL (Optional)</label>
                      <input
                        name="imageUrl"
                        defaultValue={showProductModal.product?.imageUrl}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-stone-800 transition-all"
                  >
                    {showProductModal.product ? 'Update Product' : 'Create Product'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Checkout Modal */}
        <AnimatePresence>
          {showCheckoutModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCheckoutModal(false)}
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Payment</h3>
                  <button onClick={() => setShowCheckoutModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  {checkoutStatus === 'idle' && (
                    <>
                      <div className="text-center">
                        <p className="text-stone-400 font-bold uppercase tracking-widest text-xs mb-2">Total Amount</p>
                        <p className="text-4xl font-black text-stone-900">{formatCurrency(cartTotal)}</p>
                      </div>

                      <div className="space-y-4">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Select Payment Method</p>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'cash' ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'}`}
                          >
                            <Banknote size={32} className={paymentMethod === 'cash' ? 'text-stone-900' : 'text-stone-300'} />
                            <span className="font-bold">Cash</span>
                          </button>
                          <button
                            onClick={() => setPaymentMethod('qris')}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'qris' ? 'border-stone-900 bg-stone-50' : 'border-stone-100 hover:border-stone-200'}`}
                          >
                            <CreditCard size={32} className={paymentMethod === 'qris' ? 'text-stone-900' : 'text-stone-300'} />
                            <span className="font-bold">QRIS</span>
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'qris' && (
                        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex flex-col items-center">
                          <div className="w-48 h-48 bg-white p-4 rounded-xl shadow-inner mb-4 flex items-center justify-center border border-stone-100">
                             {/* Mock QR Code */}
                             <div className="grid grid-cols-4 gap-1 opacity-80">
                               {[...Array(16)].map((_, i) => (
                                 <div key={i} className={`w-8 h-8 ${Math.random() > 0.5 ? 'bg-stone-900' : 'bg-transparent'}`} />
                               ))}
                             </div>
                          </div>
                          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Scan to Pay</p>
                        </div>
                      )}

                      <button
                        onClick={handleCheckout}
                        className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-stone-800 transition-all"
                      >
                        Confirm Payment
                      </button>
                    </>
                  )}

                  {checkoutStatus === 'processing' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 border-4 border-stone-200 border-t-stone-900 rounded-full mb-6"
                      />
                      <h4 className="text-xl font-bold mb-2">Processing Payment</h4>
                      <p className="text-stone-500">Please wait while we confirm your transaction...</p>
                    </div>
                  )}

                  {checkoutStatus === 'success' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6"
                      >
                        <CheckCircle2 size={48} />
                      </motion.div>
                      <h4 className="text-2xl font-bold mb-2 text-green-600">Payment Success!</h4>
                      <p className="text-stone-500">Transaction has been recorded successfully.</p>
                    </div>
                  )}

                  {checkoutStatus === 'error' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <XCircle size={48} />
                      </div>
                      <h4 className="text-2xl font-bold mb-2 text-red-600">Payment Failed</h4>
                      <p className="text-stone-500">There was an error processing your payment. Please try again.</p>
                      <button
                        onClick={() => setCheckoutStatus('idle')}
                        className="mt-6 text-stone-900 font-bold underline"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </ErrorBoundary>
  );
}
