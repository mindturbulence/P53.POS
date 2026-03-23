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
  Users,
  Settings as SettingsIcon,
  Download,
  Upload,
  ShieldCheck,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { authService } from './services/authService';
import { dataService, useFirebase } from './services/dataService';
import { ErrorBoundary } from './components/ErrorBoundary';
import { UserProfile, Product, CartItem, Transaction, TransactionItem, Tenant, TenantType } from './types';
import { Language, translations } from './translations';

// Register GSAP plugin
gsap.registerPlugin(useGSAP);

// --- Components ---

const LoadingScreen = ({ lang }: { lang: Language }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full mb-4"
    />
    <p className="text-stone-500 font-medium">{translations[lang].loading}</p>
  </div>
);

const LoginScreen = ({ 
  onLoginSuccess, 
  lang, 
  onLanguageChange 
}: { 
  onLoginSuccess: (user: UserProfile) => void,
  lang: Language,
  onLanguageChange: (lang: Language) => void
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState('default');
  const [error, setError] = useState('');
  const [isLocal, setIsLocal] = useState(false);

  const t = translations[lang];

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await authService.loginLocal(username, password, tenantId);
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-stone-100">
        <div className="flex justify-end mb-4">
          <select 
            value={lang} 
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="text-xs bg-stone-100 border-none rounded-lg px-2 py-1 focus:ring-0 cursor-pointer"
          >
            <option value="en">English</option>
            <option value="id">Bahasa Indonesia</option>
          </select>
        </div>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">{t.appName}</h1>
          <p className="text-stone-500">{t.appDescription}</p>
        </div>

        {!isLocal ? (
          <div className="space-y-4">
            <button
              onClick={() => authService.loginWithGoogle()}
              className="w-full flex items-center justify-center gap-3 bg-white border border-stone-200 text-stone-700 py-3 rounded-xl font-medium hover:bg-stone-50 transition-all shadow-sm"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" referrerPolicy="no-referrer" />
              {t.login.googleLogin}
            </button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-stone-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-stone-400">{lang === 'id' ? 'Atau' : 'Or'}</span></div>
            </div>
            <button
              onClick={() => setIsLocal(true)}
              className="w-full py-3 text-stone-500 hover:text-stone-900 font-medium transition-all"
            >
              {t.login.localLogin}
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
              <label className="block text-sm font-medium text-stone-700 mb-1">{t.login.storeId}</label>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                placeholder="e.g. my-store"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">{t.login.username}</label>
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
              <label className="block text-sm font-medium text-stone-700 mb-1">{t.login.password}</label>
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
              {t.login.loginButton}
            </button>
            <button
              type="button"
              onClick={() => setIsLocal(false)}
              className="w-full py-2 text-stone-400 hover:text-stone-600 text-sm font-medium transition-all"
            >
              {t.login.backToGoogle}
            </button>
          </form>
        )}
        
        {!useFirebase && (
          <div className="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
            <p className="text-xs text-amber-700 text-center">
              <strong>{t.common.offlineMode}:</strong> {lang === 'id' ? 'Firebase tidak dikonfigurasi. Data akan disimpan secara lokal di browser Anda.' : 'Firebase is not configured. Data will be saved locally in your browser.'}
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
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('pos_lang');
    return (saved as Language) || 'en';
  });
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'history' | 'dashboard' | 'settings' | 'users'>('pos');
  
  const t = translations[lang];

  useEffect(() => {
    localStorage.setItem('pos_lang', lang);
  }, [lang]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantUsers, setTenantUsers] = useState<UserProfile[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProductModal, setShowProductModal] = useState<{ show: boolean, product?: Product }>({ show: false });
  const [showUserModal, setShowUserModal] = useState<{ show: boolean, user?: UserProfile }>({ show: false });
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris'>('cash');
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // --- Auth & Data Fetching ---

  useEffect(() => {
    if (user) {
      if (user.role === 'superadmin') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('pos');
      }
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (user) => {
      try {
        if (user && user.uid.startsWith('local-')) {
          setUser(user);
        } else if (user) {
          // Firebase user detected, fetch full profile
          const profile = await dataService.getCurrentUser(user.uid);
          if (profile) {
            setUser(profile);
          } else {
            // Create new user profile in Firebase
            const newUser: UserProfile = {
              ...user,
              role: 'admin', // Default to tenant admin for first user
              tenantId: user.tenantId || user.uid, // Ensure tenantId is present
              createdAt: Timestamp.now(),
              status: 'active'
            };
            await dataService.saveUser(newUser);
            setUser(newUser);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !user.tenantId) return;

    let unsubscribeProducts = () => {};
    let unsubscribeTransactions = () => {};
    let unsubscribeTenants = () => {};
    let unsubscribeUsers = () => {};

    if (user.role === 'superadmin') {
      unsubscribeProducts = dataService.getAllProducts(setProducts);
      unsubscribeTransactions = dataService.getAllTransactions(setTransactions);
      unsubscribeTenants = dataService.getTenants(setTenants);
    } else {
      unsubscribeProducts = dataService.getProducts(user.tenantId, setProducts);
      unsubscribeTransactions = dataService.getTransactions(user.tenantId, setTransactions);
      dataService.getTenant(user.tenantId).then(setCurrentTenant);
      
      if (user.role === 'admin') {
        unsubscribeUsers = dataService.getUsersByTenant(user.tenantId, setTenantUsers);
      }
    }

    return () => {
      unsubscribeProducts();
      unsubscribeTransactions();
      unsubscribeTenants();
      unsubscribeUsers();
    };
  }, [user]);

  // --- POS Logic ---
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category || (lang === 'id' ? 'Tanpa Kategori' : 'Uncategorized')));
    return ['All', ...Array.from(cats)];
  }, [products, lang]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || (p.category || (lang === 'id' ? 'Tanpa Kategori' : 'Uncategorized')) === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory, lang]);

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
        tenantId: user.tenantId,
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
    
    const attributes: Record<string, any> = {};
    if (currentTenant?.type === 'fnb') {
      attributes.spiciness = formData.get('spiciness');
      attributes.toppings = formData.get('toppings');
    } else if (currentTenant?.type === 'clothing') {
      attributes.size = formData.get('size');
      attributes.color = formData.get('color');
    } else if (currentTenant?.type === 'service') {
      attributes.duration = formData.get('duration');
      attributes.specialist = formData.get('specialist');
    } else if (currentTenant?.type === 'grocery') {
      attributes.unit = formData.get('unit');
      attributes.expiryDate = formData.get('expiryDate');
    } else if (currentTenant?.type === 'electronics') {
      attributes.brand = formData.get('brand');
      attributes.warranty = formData.get('warranty');
    } else if (currentTenant?.type === 'pharmacy') {
      attributes.dosage = formData.get('dosage');
      attributes.prescriptionRequired = formData.get('prescriptionRequired');
    } else if (currentTenant?.type === 'bookstore') {
      attributes.author = formData.get('author');
      attributes.isbn = formData.get('isbn');
    }

    const productData = {
      name: formData.get('name') as string,
      price: Number(formData.get('price')),
      stock: Number(formData.get('stock')),
      category: formData.get('category') as string,
      imageUrl: formData.get('imageUrl') as string || `https://picsum.photos/seed/${formData.get('name')}/200/200`,
      tenantId: user.tenantId,
      updatedAt: Timestamp.now(),
      createdBy: user.uid,
      attributes
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
    return new Intl.NumberFormat(lang === 'id' ? 'id-ID' : 'en-US', { 
      style: 'currency', 
      currency: lang === 'id' ? 'IDR' : 'USD', 
      minimumFractionDigits: 0 
    }).format(amount);
  };

  if (loading) return <LoadingScreen lang={lang} />;
  if (!user) return <LoginScreen onLoginSuccess={setUser} lang={lang} onLanguageChange={setLang} />;

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
              <span className="text-xl font-bold tracking-tight">{t.appName}</span>
            </div>

            <nav className="flex-1 space-y-2">
              {user.role !== 'superadmin' && (
                <button
                  onClick={() => { setActiveTab('pos'); setIsSidebarOpen(false); }}
                  className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'pos' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
                >
                  <LayoutDashboard size={20} />
                  <span className="font-medium">{t.sidebar.pos}</span>
                </button>
              )}
              <button
                onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'inventory' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
              >
                <Package size={20} />
                <span className="font-medium">{t.sidebar.inventory}</span>
              </button>
              <button
                onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'history' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
              >
                <History size={20} />
                <span className="font-medium">{t.sidebar.history}</span>
              </button>
              <button
                onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
              >
                <TrendingUp size={20} />
                <span className="font-medium">{t.sidebar.dashboard}</span>
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => { setActiveTab('users'); setIsSidebarOpen(false); }}
                  className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
                >
                  <Users size={20} />
                  <span className="font-medium">{t.sidebar.users}</span>
                </button>
              )}
              {user.role === 'superadmin' && (
                <button
                  onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
                  className={`nav-item w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-500 hover:bg-stone-100'}`}
                >
                  <SettingsIcon size={20} />
                  <span className="font-medium">{t.sidebar.settings}</span>
                </button>
              )}
            </nav>

            <div className="mt-auto pt-6 border-t border-stone-100">
              <div className="flex items-center justify-between px-4 py-2 bg-stone-50 rounded-xl mb-4">
                <span className="text-xs font-medium text-stone-400 uppercase tracking-wider">{t.sidebar.language}</span>
                <select 
                  value={lang} 
                  onChange={(e) => setLang(e.target.value as Language)}
                  className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer text-stone-600 font-medium"
                >
                  <option value="en">EN</option>
                  <option value="id">ID</option>
                </select>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden border border-stone-200">
                  <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="Profile" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.displayName}</p>
                  <p className="text-xs text-stone-500 capitalize">{user.role === 'admin' ? t.common.admin : t.common.staff}</p>
                </div>
              </div>
              <button
                onClick={() => authService.logout()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
              >
                <LogOut size={20} />
                <span>{t.sidebar.logout}</span>
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{t.common.offlineMode}</span>
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
                          <h2 className="text-2xl font-bold">{t.sidebar.pos}</h2>
                          {!useFirebase && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{t.common.offlineMode}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
                            <input
                              type="text"
                              placeholder={t.pos.searchPlaceholder}
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Category Tabs */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`
                              px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all
                              ${selectedCategory === cat 
                                ? 'bg-stone-900 text-white shadow-lg shadow-stone-200' 
                                : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-400'}
                            `}
                          >
                            {cat === 'All' ? (lang === 'id' ? 'Semua' : 'All') : cat}
                          </button>
                        ))}
                      </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 product-grid">
                      {filteredProducts.map((product, index) => (
                          <motion.button
                            key={product.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => addToCart(product)}
                            disabled={product.stock <= 0}
                            className={`
                              product-card group relative bg-white border border-stone-200 rounded-3xl p-4 text-left transition-all hover:shadow-2xl hover:border-stone-300
                              ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                            `}
                          >
                            <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-stone-100 relative">
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
                              <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center shadow-xl">
                                  <Plus size={20} />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-bold text-stone-900 truncate text-lg leading-tight">{product.name}</h3>
                              <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{product.category || (lang === 'id' ? 'Tanpa Kategori' : 'Uncategorized')}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <span className="font-black text-xl text-stone-900">{formatCurrency(product.price)}</span>
                              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${product.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-stone-50 text-stone-500'}`}>
                                <Package size={12} />
                                <span className="text-[10px] font-black">{product.stock}</span>
                              </div>
                            </div>
                            {product.attributes && Object.values(product.attributes).some(v => !!v) && (
                              <div className="mt-3 flex flex-wrap gap-1">
                                {Object.entries(product.attributes).map(([key, val]) => val && (
                                  <span key={key} className="text-[9px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">
                                    {val}
                                  </span>
                                ))}
                              </div>
                            )}
                            {product.stock <= 0 && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-[2px] rounded-3xl z-10">
                                <span className="bg-red-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] shadow-lg">{t.pos.soldOut}</span>
                              </div>
                            )}
                          </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Cart Sidebar */}
                  <div className="w-full lg:w-96 bg-white border border-stone-200 rounded-3xl shadow-xl flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                      <h2 className="text-xl font-bold">{t.pos.cartTitle}</h2>
                      <button onClick={() => setCart([])} className="text-stone-400 hover:text-red-500 transition-colors">
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                          <div className="w-32 h-32 bg-stone-50 rounded-full flex items-center justify-center mb-6 relative">
                            <ShoppingCart size={48} className="text-stone-200" />
                            <motion.div 
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute -top-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center"
                            >
                              <Plus size={20} className="text-stone-400" />
                            </motion.div>
                          </div>
                          <h4 className="text-lg font-bold text-stone-900 mb-2">{t.pos.emptyCart}</h4>
                          <p className="text-sm text-stone-400 leading-relaxed">
                            {lang === 'id' ? 'Mulai tambahkan produk ke keranjang untuk membuat pesanan baru.' : 'Start adding products to the cart to create a new order.'}
                          </p>
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
                        <span>{t.pos.subtotal}</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-stone-500">
                        <span>{t.pos.tax} (0%)</span>
                        <span>{formatCurrency(0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold text-stone-900 pt-2 border-t border-stone-200">
                        <span>{t.pos.total}</span>
                        <span>{formatCurrency(cartTotal)}</span>
                      </div>
                      <button
                        onClick={() => setShowCheckoutModal(true)}
                        disabled={cart.length === 0}
                        className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                      >
                        {t.pos.checkout}
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
                      <h2 className="text-2xl font-bold">{t.inventory.title}</h2>
                      {!useFirebase && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">{t.common.offlineMode}</span>
                      )}
                    </div>
                    {user.role === 'staff' && (
                      <button
                        onClick={() => setShowProductModal({ show: true })}
                        className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-stone-800 transition-all"
                      >
                        <Plus size={20} />
                        {t.inventory.addProduct}
                      </button>
                    )}
                  </div>

                  <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-stone-50 border-b border-stone-200">
                          <tr>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider">{t.inventory.product}</th>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider">{t.inventory.category}</th>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider">{t.inventory.price}</th>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider">{t.inventory.stock}</th>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider">{t.settings.attributes}</th>
                            <th className="px-6 py-4 font-bold text-stone-500 text-xs uppercase tracking-wider text-right">{t.common.actions}</th>
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
                                  {product.stock} {lang === 'id' ? 'unit' : 'units'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {product.attributes && Object.entries(product.attributes).map(([key, val]) => val && (
                                    <span key={key} className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full border border-stone-200">
                                      {t.settings[key as keyof typeof t.settings] || key}: {val}
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                {user.role === 'staff' && (
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
                  <h2 className="text-2xl font-bold">{t.history.title}</h2>
                  <div className="grid gap-4">
                    {transactions.length === 0 ? (
                      <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center text-stone-400">
                        <p>{t.history.noTransactions}</p>
                      </div>
                    ) : (
                      transactions.map(tx => (
                      <div key={tx.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.paymentMethod === 'qris' ? 'bg-indigo-50 text-indigo-600' : 'bg-green-50 text-green-600'}`}>
                            {tx.paymentMethod === 'qris' ? <CreditCard size={24} /> : <Banknote size={24} />}
                          </div>
                          <div>
                            <p className="font-bold text-lg">{lang === 'id' ? 'Pesanan' : 'Order'} #{tx.id.slice(-6).toUpperCase()}</p>
                            <p className="text-sm text-stone-500">{tx.createdAt.toDate().toLocaleString()} • {tx.items.length} {lang === 'id' ? 'item' : 'items'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-xs text-stone-400 uppercase font-bold tracking-wider mb-1">{t.pos.total}</p>
                            <p className="text-xl font-black text-stone-900">{formatCurrency(tx.totalAmount)}</p>
                          </div>
                          <div className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {tx.status === 'completed' ? t.dashboard.completed : tx.status}
                          </div>
                        </div>
                      </div>
                    )))}
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
                    <h2 className="text-2xl font-bold">
                      {user.role === 'admin' ? t.dashboard.systemOverview : t.dashboard.title}
                    </h2>
                    {user.role === 'staff' && products.length === 0 && (
                      <button
                        onClick={async () => {
                          const initialProducts = [
                            { name: 'Espresso', price: 25000, stock: 100, category: 'Coffee', imageUrl: 'https://picsum.photos/seed/espresso/200/200', tenantId: user.tenantId, createdBy: user.uid, updatedAt: Timestamp.now() },
                            { name: 'Latte', price: 35000, stock: 80, category: 'Coffee', imageUrl: 'https://picsum.photos/seed/latte/200/200', tenantId: user.tenantId, createdBy: user.uid, updatedAt: Timestamp.now() },
                            { name: 'Croissant', price: 20000, stock: 30, category: 'Pastry', imageUrl: 'https://picsum.photos/seed/croissant/200/200', tenantId: user.tenantId, createdBy: user.uid, updatedAt: Timestamp.now() },
                            { name: 'Iced Tea', price: 15000, stock: 200, category: 'Tea', imageUrl: 'https://picsum.photos/seed/icedtea/200/200', tenantId: user.tenantId, createdBy: user.uid, updatedAt: Timestamp.now() },
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {user.role === 'admin' && (
                      <div className="stat-card bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                            <Users size={28} />
                          </div>
                          <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">{t.settings.tenants}</span>
                          <p className="text-5xl font-black mt-2 tracking-tighter">{tenants.length}</p>
                        </div>
                        <div className="mt-8 flex items-center gap-2 text-blue-600 text-sm font-bold">
                          <span>{t.dashboard.acrossBranches}</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="md:col-span-2 lg:col-span-2 stat-card bg-stone-900 p-8 rounded-[2rem] text-white shadow-2xl shadow-stone-200 flex flex-col justify-between relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center mb-6">
                          <DollarSign size={28} />
                        </div>
                        <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">{t.dashboard.totalRevenue}</span>
                        <p className="text-5xl font-black mt-2 tracking-tighter">{formatCurrency(transactions.reduce((sum, tx) => sum + tx.totalAmount, 0))}</p>
                      </div>
                      <div className="mt-8 flex items-center gap-2 text-emerald-400 text-sm font-bold relative z-10">
                        <TrendingUp size={16} />
                        <span>+12.5% {t.dashboard.fromLastMonth}</span>
                      </div>
                      {/* Abstract Background Element */}
                      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    </div>

                    <div className="stat-card bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="w-14 h-14 bg-stone-100 text-stone-900 rounded-2xl flex items-center justify-center mb-6">
                          <ShoppingCart size={28} />
                        </div>
                        <span className="text-stone-400 font-bold uppercase tracking-widest text-xs">{t.dashboard.totalSales}</span>
                        <p className="text-5xl font-black mt-2 tracking-tighter">{transactions.length}</p>
                      </div>
                      <div className="mt-8 flex items-center gap-2 text-stone-400 text-sm font-bold">
                        <span>{t.dashboard.acrossBranches}</span>
                      </div>
                    </div>

                    {/* Top Products Bento Card */}
                    <div className="md:col-span-2 lg:col-span-2 stat-card bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div>
                          <h3 className="text-xl font-black">{t.dashboard.topProducts}</h3>
                          <p className="text-stone-400 text-sm font-medium">{lang === 'id' ? 'Produk paling populer' : 'Most popular products'}</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                          <Package size={24} />
                        </div>
                      </div>
                      <div className="space-y-4">
                        {products.slice(0, 4).map((p, i) => (
                          <div key={p.id} className="group">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-stone-600 font-bold">{p.name}</span>
                              <span className="font-black text-stone-900">{p.stock} <span className="text-stone-400 text-[10px] uppercase">{t.dashboard.inStock}</span></span>
                            </div>
                            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (p.stock / 200) * 100)}%` }}
                                transition={{ duration: 1, delay: i * 0.1 }}
                                className="h-full bg-stone-900 rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Activity Bento Card */}
                    <div className="md:col-span-1 lg:col-span-2 stat-card bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm flex flex-col">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black">{t.dashboard.recentActivity}</h3>
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                          <History size={24} />
                        </div>
                      </div>
                      <div className="space-y-6 flex-1">
                        {transactions.slice(0, 4).map((tx, i) => (
                          <div key={tx.id} className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-stone-900 text-white' : 'bg-stone-50 text-stone-400'}`}>
                              <ChevronRight size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-stone-900 truncate">
                                {t.dashboard.newOrderOf} {formatCurrency(tx.totalAmount)}
                              </p>
                              <p className="text-xs text-stone-400 font-medium">{tx.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg">
                                {t.dashboard.completed}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {activeTab === 'settings' && user.role === 'superadmin' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{t.settings.title}</h2>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1">
                      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                        <h3 className="text-lg font-bold mb-6">{t.settings.addTenant}</h3>
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const name = formData.get('name') as string;
                          const type = formData.get('type') as TenantType;
                          if (name && type) {
                            await dataService.addTenant({ 
                              name, 
                              type, 
                              createdAt: Timestamp.now(),
                              subscription: {
                                plan: 'monthly',
                                status: 'trial',
                                expiryDate: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) // 14 days trial
                              }
                            });
                            e.currentTarget.reset();
                          }
                        }} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t.settings.tenantName}</label>
                            <input
                              name="name"
                              type="text"
                              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                              placeholder="e.g. My Awesome Store"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1">{t.settings.tenantType}</label>
                            <select
                              name="type"
                              className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                              required
                            >
                              <option value="general">{t.settings.general}</option>
                              <option value="fnb">{t.settings.fnb}</option>
                              <option value="clothing">{t.settings.clothing}</option>
                              <option value="service">{t.settings.service}</option>
                              <option value="grocery">{t.settings.grocery}</option>
                              <option value="electronics">{t.settings.electronics}</option>
                              <option value="pharmacy">{t.settings.pharmacy}</option>
                              <option value="bookstore">{t.settings.bookstore}</option>
                            </select>
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-stone-900 text-white py-3 rounded-xl font-medium hover:bg-stone-800 transition-all shadow-md flex items-center justify-center gap-2"
                          >
                            <Plus size={18} />
                            {t.settings.addTenant}
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-stone-100">
                          <h3 className="text-lg font-bold">{t.settings.tenants}</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-stone-50 border-b border-stone-200">
                              <tr>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">{t.settings.tenantName}</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">{t.subscription.title}</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">{t.common.actions}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                              {tenants.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="px-6 py-12 text-center text-stone-400">
                                    {t.settings.noTenants}
                                  </td>
                                </tr>
                              ) : (
                                tenants.map(tenant => (
                                  <tr key={tenant.id} className="hover:bg-stone-50 transition-colors">
                                    <td className="px-6 py-4">
                                      <p className="font-medium">{tenant.name}</p>
                                      <p className="text-xs text-stone-400 font-mono">{tenant.id}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                            tenant.subscription?.status === 'active' ? 'bg-green-100 text-green-700' : 
                                            tenant.subscription?.status === 'trial' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                          }`}>
                                            {tenant.subscription?.status || 'N/A'}
                                          </span>
                                          <span className="text-xs text-stone-500">{tenant.subscription?.plan}</span>
                                        </div>
                                        <p className="text-[10px] text-stone-400">
                                          {t.subscription.expiry}: {tenant.subscription?.expiryDate?.toDate().toLocaleDateString()}
                                        </p>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                        <button 
                                          onClick={async () => {
                                            const newPlan = tenant.subscription?.plan === 'monthly' ? 'yearly' : 'monthly';
                                            const newExpiry = new Date();
                                            newExpiry.setMonth(newExpiry.getMonth() + (newPlan === 'monthly' ? 1 : 12));
                                            
                                            await dataService.updateTenantSubscription(tenant.id, {
                                              plan: newPlan,
                                              status: 'active',
                                              expiryDate: Timestamp.fromDate(newExpiry)
                                            });
                                          }}
                                          className="text-xs bg-stone-100 text-stone-600 px-3 py-1 rounded-full hover:bg-stone-200"
                                        >
                                          {t.subscription.updatePlan}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Backup System */}
                        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                          <div className="flex items-center gap-3 mb-6">
                            <Database className="text-stone-900" size={24} />
                            <h3 className="text-lg font-bold">{t.settings.backupSystem}</h3>
                          </div>
                          <p className="text-sm text-stone-500 mb-6">{t.settings.backupDescription}</p>
                          <div className="flex flex-col gap-3">
                            <button
                              onClick={async () => {
                                const data = await dataService.exportData();
                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `p53_pos_backup_${new Date().toISOString().split('T')[0]}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-100 text-stone-900 rounded-xl font-medium hover:bg-stone-200 transition-all"
                            >
                              <Download size={18} />
                              {t.settings.exportData}
                            </button>
                            <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition-all cursor-pointer">
                              <Upload size={18} />
                              {t.settings.importData}
                              <input
                                type="file"
                                accept=".json"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      try {
                                        const data = JSON.parse(event.target?.result as string);
                                        await dataService.importData(data);
                                        alert(t.settings.importSuccess);
                                        window.location.reload();
                                      } catch (err) {
                                        alert(t.settings.importError);
                                      }
                                    };
                                    reader.readAsText(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Security & Risk Management */}
                        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
                          <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="text-stone-900" size={24} />
                            <h3 className="text-lg font-bold">{t.settings.securityTitle}</h3>
                          </div>
                          <p className="text-sm text-stone-500 mb-6">{t.settings.securityDescription}</p>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                              <span className="text-sm font-medium">{t.settings.dataEncryption}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">Active</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                              <span className="text-sm font-medium">{t.settings.accessControl}</span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">RBAC Enabled</span>
                            </div>
                            <button className="w-full py-2 text-stone-500 text-xs font-medium hover:text-stone-900 transition-colors">
                              {t.settings.viewAuditLogs}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'users' && user.role === 'admin' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{t.users.title}</h2>
                    <button
                      onClick={() => setShowUserModal({ show: true })}
                      className="bg-stone-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
                    >
                      <Plus size={20} />
                      {t.users.addUser}
                    </button>
                  </div>

                  <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-stone-50 border-b border-stone-200">
                          <tr>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">{t.users.email}</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">{t.users.role}</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400">{t.users.status}</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-stone-400 text-right">{t.common.actions}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {tenantUsers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-stone-400">
                                {t.users.noUsers}
                              </td>
                            </tr>
                          ) : (
                            tenantUsers.map(u => (
                              <tr key={u.uid} className="hover:bg-stone-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                                      <UserIcon size={16} />
                                    </div>
                                    <div>
                                      <p className="font-medium">{u.displayName || 'Unnamed User'}</p>
                                      <p className="text-xs text-stone-400">{u.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-2 py-1 bg-stone-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${u.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {u.status === 'active' ? t.users.active : t.users.inactive}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => setShowUserModal({ show: true, user: u })}
                                      className="p-2 text-stone-400 hover:text-stone-900 transition-colors"
                                    >
                                      <Edit2 size={18} />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm(t.users.deleteConfirm)) {
                                          await dataService.deleteUser(u.uid);
                                        }
                                      }}
                                      className="p-2 text-stone-400 hover:text-red-600 transition-colors"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Modals */}

        {/* User Modal */}
        <AnimatePresence>
          {showUserModal.show && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUserModal({ show: false })}
                className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
              >
                <div className="p-6 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold">{showUserModal.user ? t.users.editUser : t.users.addUser}</h3>
                  <button onClick={() => setShowUserModal({ show: false })} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const email = formData.get('email') as string;
                  const displayName = formData.get('displayName') as string;
                  const role = formData.get('role') as 'admin' | 'staff';
                  const status = formData.get('status') as 'active' | 'inactive';

                  if (email && role && user) {
                    const userData: UserProfile = {
                      uid: showUserModal.user?.uid || `user-${Date.now()}`,
                      email,
                      displayName,
                      role,
                      status,
                      tenantId: user.tenantId,
                      createdAt: showUserModal.user?.createdAt || Timestamp.now()
                    };
                    await dataService.saveUser(userData);
                    setShowUserModal({ show: false });
                  }
                }} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.users.email}</label>
                      <input
                        name="email"
                        type="email"
                        required
                        defaultValue={showUserModal.user?.email}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        placeholder="staff@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Display Name</label>
                      <input
                        name="displayName"
                        defaultValue={showUserModal.user?.displayName}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.users.role}</label>
                        <select
                          name="role"
                          defaultValue={showUserModal.user?.role || 'staff'}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        >
                          <option value="staff">{t.common.staff}</option>
                          <option value="admin">{t.common.admin}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.users.status}</label>
                        <select
                          name="status"
                          defaultValue={showUserModal.user?.status || 'active'}
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        >
                          <option value="active">{t.users.active}</option>
                          <option value="inactive">{t.users.inactive}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowUserModal({ show: false })}
                      className="flex-1 px-6 py-3 border border-stone-200 rounded-2xl font-bold hover:bg-stone-50 transition-all"
                    >
                      {t.common.cancel}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-stone-900 text-white rounded-2xl font-bold hover:bg-stone-800 transition-all shadow-lg shadow-stone-200"
                    >
                      {t.users.save}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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
                  <h3 className="text-xl font-bold">{showProductModal.product ? t.inventory.editProduct : t.inventory.addProduct}</h3>
                  <button onClick={() => setShowProductModal({ show: false })} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.inventory.name}</label>
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
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.inventory.price} ({lang === 'id' ? 'IDR' : 'USD'})</label>
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
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.inventory.stock}</label>
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
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.inventory.category}</label>
                      <input
                        name="category"
                        defaultValue={showProductModal.product?.category}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        placeholder="e.g. Coffee"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.inventory.imageUrl}</label>
                      <input
                        name="imageUrl"
                        defaultValue={showProductModal.product?.imageUrl}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                        placeholder="https://..."
                      />
                    </div>

                    {currentTenant?.type === 'fnb' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.spiciness}</label>
                          <select
                            name="spiciness"
                            defaultValue={showProductModal.product?.attributes?.spiciness}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                          >
                            <option value="none">None</option>
                            <option value="mild">Mild</option>
                            <option value="hot">Hot</option>
                            <option value="extra_hot">Extra Hot</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.toppings}</label>
                          <input
                            name="toppings"
                            defaultValue={showProductModal.product?.attributes?.toppings}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. Cheese, Egg"
                          />
                        </div>
                      </div>
                    )}

                    {currentTenant?.type === 'clothing' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.size}</label>
                          <input
                            name="size"
                            defaultValue={showProductModal.product?.attributes?.size}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. S, M, L, XL"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.color}</label>
                          <input
                            name="color"
                            defaultValue={showProductModal.product?.attributes?.color}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. Red, Blue"
                          />
                        </div>
                      </div>
                    )}

                    {currentTenant?.type === 'service' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.duration}</label>
                          <input
                            name="duration"
                            type="number"
                            defaultValue={showProductModal.product?.attributes?.duration}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. 30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.specialist}</label>
                          <input
                            name="specialist"
                            defaultValue={showProductModal.product?.attributes?.specialist}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. John Doe"
                          />
                        </div>
                      </div>
                    )}

                    {currentTenant?.type === 'grocery' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.unit}</label>
                          <input
                            name="unit"
                            defaultValue={showProductModal.product?.attributes?.unit}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. kg, pcs, box"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.expiryDate}</label>
                          <input
                            name="expiryDate"
                            type="date"
                            defaultValue={showProductModal.product?.attributes?.expiryDate}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                          />
                        </div>
                      </div>
                    )}

                    {currentTenant?.type === 'electronics' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.brand}</label>
                          <input
                            name="brand"
                            defaultValue={showProductModal.product?.attributes?.brand}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. Sony, Apple"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.warranty}</label>
                          <input
                            name="warranty"
                            defaultValue={showProductModal.product?.attributes?.warranty}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. 1 Year"
                          />
                        </div>
                      </div>
                    )}

                    {currentTenant?.type === 'pharmacy' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.dosage}</label>
                          <input
                            name="dosage"
                            defaultValue={showProductModal.product?.attributes?.dosage}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. 3x1 daily"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                          <input
                            name="prescriptionRequired"
                            type="checkbox"
                            defaultChecked={showProductModal.product?.attributes?.prescriptionRequired === 'on'}
                            className="w-5 h-5 rounded border-stone-200 text-stone-900 focus:ring-stone-900/10"
                          />
                          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">{t.settings.prescriptionRequired}</label>
                        </div>
                      </div>
                    )}

                    {currentTenant?.type === 'bookstore' && (
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-100">
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.author}</label>
                          <input
                            name="author"
                            defaultValue={showProductModal.product?.attributes?.author}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. J.K. Rowling"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">{t.settings.isbn}</label>
                          <input
                            name="isbn"
                            defaultValue={showProductModal.product?.attributes?.isbn}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                            placeholder="e.g. 978-3-16..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-stone-800 transition-all"
                  >
                    {showProductModal.product ? t.common.save : t.common.save}
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
                  <h3 className="text-xl font-bold">{t.pos.checkout}</h3>
                  <button onClick={() => setShowCheckoutModal(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="p-8 space-y-8">
                  {checkoutStatus === 'idle' && (
                    <>
                      <div className="bg-stone-50 p-8 rounded-[2rem] text-center border border-stone-100">
                        <p className="text-stone-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-3">{t.pos.total}</p>
                        <p className="text-5xl font-black text-stone-900 tracking-tighter">{formatCurrency(cartTotal)}</p>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-stone-400 uppercase tracking-widest">{t.checkout.paymentMethod}</p>
                          <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-1 rounded-md font-bold uppercase">{cart.length} {lang === 'id' ? 'Item' : 'Items'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setPaymentMethod('cash')}
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'cash' ? 'border-stone-900 bg-stone-50 shadow-xl shadow-stone-100' : 'border-stone-100 hover:border-stone-200 bg-white'}`}
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'cash' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                              <Banknote size={24} />
                            </div>
                            <span className="font-bold text-sm">{t.checkout.cash}</span>
                          </button>
                          <button
                            onClick={() => setPaymentMethod('qris')}
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'qris' ? 'border-stone-900 bg-stone-50 shadow-xl shadow-stone-100' : 'border-stone-100 hover:border-stone-200 bg-white'}`}
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${paymentMethod === 'qris' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                              <CreditCard size={24} />
                            </div>
                            <span className="font-bold text-sm">{t.checkout.qris}</span>
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'qris' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white p-8 rounded-[2rem] border-2 border-stone-100 flex flex-col items-center shadow-inner"
                        >
                          <div className="w-56 h-56 bg-white p-6 rounded-3xl shadow-2xl mb-6 flex items-center justify-center border border-stone-50 relative overflow-hidden">
                             {/* Mock QR Code with more detail */}
                             <div className="grid grid-cols-8 gap-1 opacity-90 relative z-10">
                               {[...Array(64)].map((_, i) => (
                                 <div key={i} className={`w-4 h-4 rounded-sm ${Math.random() > 0.4 ? 'bg-stone-900' : 'bg-transparent'}`} />
                               ))}
                             </div>
                             <div className="absolute inset-0 bg-stone-50/50 backdrop-blur-[1px]" />
                             <div className="absolute inset-0 flex items-center justify-center z-20">
                               <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center border border-stone-100">
                                 <CreditCard size={24} className="text-stone-900" />
                               </div>
                             </div>
                          </div>
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">{t.checkout.scanToPay}</p>
                        </motion.div>
                      )}

                      <button
                        onClick={handleCheckout}
                        className="w-full bg-stone-900 text-white py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-stone-200 hover:bg-stone-800 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        {t.checkout.confirmPayment}
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
                      <h4 className="text-xl font-bold mb-2">{t.checkout.processing}</h4>
                      <p className="text-stone-500">{t.checkout.processingWait}</p>
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
                      <h4 className="text-2xl font-bold mb-2 text-green-600">{t.checkout.success}</h4>
                      <p className="text-stone-500">{t.checkout.successMessage}</p>
                    </div>
                  )}

                  {checkoutStatus === 'error' && (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <XCircle size={48} />
                      </div>
                      <h4 className="text-2xl font-bold mb-2 text-red-600">{t.checkout.error}</h4>
                      <p className="text-stone-500">{t.checkout.errorMessage}</p>
                      <button
                        onClick={() => setCheckoutStatus('idle')}
                        className="mt-6 text-stone-900 font-bold underline"
                      >
                        {t.common.tryAgain}
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
