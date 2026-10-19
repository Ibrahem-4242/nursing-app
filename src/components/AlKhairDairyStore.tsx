'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  ShoppingCart,
  X,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Truck,
  ShieldCheck,
  PhoneCall,
  MessageCircle,
  Search,
  Star,
  Sparkles,
  ArrowRight,
  CreditCard,
  Banknote,
  MapPin,
  Clock,
  Layers,
  Heart,
  ChevronDown,
  Loader2,
  AlertCircle,
  Lock,
  Info,
} from 'lucide-react';
import { DAIRY_PRODUCTS, DAIRY_CATEGORIES, DairyProduct } from '@/data/dairy-products';

interface CartItem {
  product: DairyProduct;
  quantity: number;
}

const DAIRY_FALLBACK_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="%23f0fdf4" width="400" height="400"/><text fill="%23059669" font-family="sans-serif" font-size="64" font-weight="bold" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle">🥛 حليب الخير</text></svg>';

interface AlKhairDairyStoreProps {
  isAdmin?: boolean;
  initialProductId?: string;
}

export default function AlKhairDairyStore({ isAdmin, initialProductId }: AlKhairDairyStoreProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Selected Product for Full Details, Ingredients, Nutrition Facts & Simulated URL
  const [selectedProduct, setSelectedProduct] = useState<DairyProduct | null>(() => {
    if (initialProductId) {
      return DAIRY_PRODUCTS.find((p) => p.id === initialProductId) || null;
    }
    return null;
  });

  // Secret admin backdoor from "كاش عند الاستلام" button
  const [isAdminBackdoorOpen, setIsAdminBackdoorOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  const openProductDetail = (prod: DairyProduct) => {
    setSelectedProduct(prod);
    try {
      window.history.pushState({ productId: prod.id }, '', `/product/${prod.id}`);
      document.title = `${prod.name} | متجر حليب الخير 🥛🇸🇦`;
    } catch {
      // ignore
    }
  };

  const closeProductDetail = () => {
    setSelectedProduct(null);
    try {
      window.history.pushState({ page: 'store' }, '', '/store');
      document.title = 'متجر حليب الخير الطازجة 🥛🇸🇦 | منتجات المزارع السعودية الطبيعية';
    } catch {
      // ignore
    }
  };

  // URL Masking on Mount & Browser PopState (Back/Forward) handling
  useEffect(() => {
    try {
      // 1. Initial document title
      if (!selectedProduct) {
        document.title = 'متجر حليب الخير الطازجة 🥛🇸🇦 | منتجات المزارع السعودية الطبيعية';
      } else {
        document.title = `${selectedProduct.name} | متجر حليب الخير 🥛🇸🇦`;
      }

      // 2. Check if user landed on or has /product/prod-XX in pathname
      const currentPath = window.location.pathname;
      const productMatch = currentPath.match(/\/product\/([^/]+)/);
      if (productMatch && productMatch[1]) {
        const found = DAIRY_PRODUCTS.find((p) => p.id === productMatch[1]);
        if (found) {
          setSelectedProduct(found);
          document.title = `${found.name} | متجر حليب الخير 🥛🇸🇦`;
        }
      } else {
        // Mask the URL cleanly to /store so it never shows nursing paths
        if (!currentPath.startsWith('/admin-dashboard') && !currentPath.startsWith('/admin-login')) {
          window.history.replaceState({ page: 'store' }, '', '/store');
        }
      }

      // 3. Popstate event listener for natural browser Back/Forward navigation
      const handlePopState = (e: PopStateEvent) => {
        if (e.state?.productId) {
          const found = DAIRY_PRODUCTS.find((p) => p.id === e.state.productId);
          if (found) {
            setSelectedProduct(found);
            document.title = `${found.name} | متجر حليب الخير 🥛🇸🇦`;
            return;
          }
        }
        const match = window.location.pathname.match(/\/product\/([^/]+)/);
        if (match && match[1]) {
          const found = DAIRY_PRODUCTS.find((p) => p.id === match[1]);
          if (found) {
            setSelectedProduct(found);
            document.title = `${found.name} | متجر حليب الخير 🥛🇸🇦`;
            return;
          }
        }
        setSelectedProduct(null);
        document.title = 'متجر حليب الخير الطازجة 🥛🇸🇦 | منتجات المزارع السعودية الطبيعية';
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    } catch {
      // ignore
    }
  }, [selectedProduct]);

  const handleAdminBackdoorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPinInput.trim()) return;
    setIsVerifyingPin(true);
    setAdminPinError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPinInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        window.location.href = '/admin-dashboard';
      } else {
        setAdminPinError(data.message || 'كلمة السر غير صحيحة ❌');
      }
    } catch {
      setAdminPinError('فشل الاتصال بالخادم، يرجى إعادة المحاولة');
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Hydration-safe localStorage cart persistence
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alkhair_dairy_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('alkhair_dairy_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<{
    orderNumber: string;
    customerName: string;
    phone: string;
    city: string;
    total: number;
    paymentMethod: string;
  } | null>(null);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('الرياض');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [checkoutError, setCheckoutError] = useState('');

  // Cart operations
  const addToCart = (product: DairyProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const getItemQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const vatAmount = subtotal * 0.15;
  const isFreeDelivery = subtotal >= 100;
  const deliveryFee = subtotal > 0 ? (isFreeDelivery ? 0 : 15) : 0;
  const grandTotal = subtotal > 0 ? subtotal + vatAmount + deliveryFee : 0;

  // Filtered products (30 products)
  const filteredProducts = DAIRY_PRODUCTS.filter((prod) => {
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!customerName.trim() || customerName.trim().length < 3) {
      setCheckoutError('يرجى إدخال الاسم الكريم بالكامل');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('05') || cleanPhone.length !== 10) {
      setCheckoutError('يرجى إدخال رقم جوال سعودي صحيح يبدأ بـ 05 ويتكون من 10 أرقام (مثال: 0548234431)');
      return;
    }

    if (!customerAddress.trim() || customerAddress.trim().length < 5) {
      setCheckoutError('يرجى كتابة تفاصيل الحي والشارع لتسهيل وصول المندوب');
      return;
    }

    setIsSubmittingOrder(true);

    // Realistic simulated checkout delivery dispatch (1.5 seconds)
    setTimeout(() => {
      const randomOrderNum = Math.floor(100000 + Math.random() * 900000);
      setOrderSuccessData({
        orderNumber: `HK-${randomOrderNum}`,
        customerName: customerName.trim(),
        phone: cleanPhone,
        city: customerCity,
        total: grandTotal,
        paymentMethod: paymentMethod === 'cod' ? 'الدفع نقداً / مدى عند الاستلام' : 'بطاقة مدى / فيزا',
      });
      setCart([]);
      setIsSubmittingOrder(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-cairo selection:bg-emerald-600 selection:text-white" dir="rtl">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-800 text-white text-xs py-2 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-right font-bold">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Truck className="w-4 h-4 text-emerald-200 animate-pulse flex-shrink-0" />
            <span>🚚 توصيل مبرد وسريع خلال 3 ساعات داخل الرياض وجدة ومكة - الشحن مجاني للطلبات فوق 100 ر.س</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-emerald-100 justify-center">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>الرقم الموحد: 920033814</span>
            </span>
            <span className="hidden md:inline">|</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>طبيعي 100% بحلبة الصباح 🇸🇦</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN STORE NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div
              onClick={() => {
                closeProductDetail();
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-700/20 group-hover:scale-105 transition">
                🥛
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
                    حليب الخير
                  </h1>
                  <span className="text-sm">🇸🇦</span>
                </div>
                <p className="text-[10px] text-emerald-700 font-bold -mt-0.5">
                  منتجات المزارع والألبان الطازجة | Haleeb Al-Khair Dairy KSA
                </p>
              </div>
            </div>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن حليب، لبن نياق، جبن حلوم، قشطة، سمن بري..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-slate-100/90 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* WhatsApp Quick Order button */}
              <a
                href="https://wa.me/966548234431?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%B7%D9%84%D8%A8%20%D9%85%D9%86%D8%AA%D8%AC%D8%A7%D8%AA%20%D8%AD%D9%84%D9%8A%D8%A8%20%D8%A7%D9%84%D8%AE%D9%8A%D8%B1%20%D8%A7%D9%84%D8%B7%D8%A7%D8%B2%D8%AC%D8%A9"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>واتساب الطلبات</span>
              </a>

              {/* Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 active:scale-95 transition"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">سلة الطلبات</span>
                {totalItemsCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black flex items-center justify-center font-mono">
                    {totalItemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar mobile */}
          <div className="md:hidden mt-3">
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن حليب، لبن نياق، أجبان، سمن..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-slate-100/90 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 3. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-950 text-white py-6 sm:py-14 px-3.5 sm:px-6 lg:px-8 border-b-4 border-emerald-500/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          <div className="max-w-2xl space-y-3 sm:space-y-4 text-center md:text-right">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-[10px] sm:text-xs font-bold">
              <span>🇸🇦 مزارع الخرج والقصيم الوطنية</span>
              <span>•</span>
              <span>حلبة الصباح الباكر</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black leading-snug sm:leading-tight tracking-tight text-white">
              طبيعية 100% من مزارعنا <br />
              <span className="text-emerald-300">مباشرة إلى باب بيتك 🥛</span>
            </h2>
            <p className="text-xs sm:text-base text-emerald-100 leading-relaxed max-w-xl">
              نقدم لكم أطايب المزارع السعودية من الحليب البقري والنياق الصافي، والأجبان والزبدة والسمن البري الخالص. تُنتج يومياً بدون أي بودرة مسترجعة أو مواد حافظة لضمان صحة عائلتك.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 pt-1 sm:pt-2">
              <a
                href="#products-section"
                className="px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs sm:text-sm shadow-xl active:scale-95 transition flex items-center gap-2"
              >
                <span>تسوق المنتجات الطازجة الآن</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180" />
              </a>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-emerald-200 font-bold px-2.5 py-2 sm:px-3 sm:py-2 bg-emerald-800/40 rounded-xl border border-emerald-700/50">
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300" />
                <span>توصيل مبرد 3 ساعات</span>
              </div>
            </div>
          </div>

          {/* Hero Feature Badges */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-md">
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center space-y-0.5 sm:space-y-1">
              <span className="text-xl sm:text-2xl">🌿</span>
              <h4 className="text-[11px] sm:text-xs font-black text-white">بدون إضافات</h4>
              <p className="text-[9px] sm:text-[10px] text-emerald-200">حليب نقي وطبيعي 100%</p>
            </div>
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center space-y-0.5 sm:space-y-1">
              <span className="text-xl sm:text-2xl">🔬</span>
              <h4 className="text-[11px] sm:text-xs font-black text-white">مفحوص مخبرياً</h4>
              <p className="text-[9px] sm:text-[10px] text-emerald-200">مطابق لمواصفات الغذاء والدواء</p>
            </div>
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center space-y-0.5 sm:space-y-1">
              <span className="text-xl sm:text-2xl">🐪</span>
              <h4 className="text-[11px] sm:text-xs font-black text-white">ألبان إبل ونياق</h4>
              <p className="text-[9px] sm:text-[10px] text-emerald-200">مبسترة ونقية بأعلى معايير</p>
            </div>
            <div className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center space-y-0.5 sm:space-y-1">
              <span className="text-xl sm:text-2xl">💵</span>
              <h4 className="text-[11px] sm:text-xs font-black text-white">دفع عند الاستلام</h4>
              <p className="text-[9px] sm:text-[10px] text-emerald-200">كاش أو مدى عند وصول المندوب</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CATEGORIES TABS */}
      <section id="products-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>تشكيلة المنتجات الطازجة</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {filteredProducts.length} منتج
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">انقر على أي منتج لعرض مكوناته الطبيعية، جدول الحقائق الغذائية، ومعلومات المنشأ</p>
          </div>
        </div>

        {/* Categories scrollable pill list */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {DAIRY_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition active:scale-95 ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. PRODUCTS GRID (30 Products) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <div className="text-4xl">🥛</div>
            <h4 className="text-base font-black text-slate-800">لا توجد منتجات تطابق بحثك</h4>
            <p className="text-xs text-slate-500">جرب البحث بكلمات أخرى أو اختر تصنيفاً آخر من القائمة أعلاه.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
            >
              عرض جميع المنتجات
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((prod) => {
              const qtyInCart = getItemQuantity(prod.id);
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-emerald-500/50 shadow-xs hover:shadow-xl hover:shadow-emerald-900/5 transition duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Clickable Image container */}
                  <div
                    onClick={() => openProductDetail(prod)}
                    className="relative aspect-square w-full bg-slate-100 overflow-hidden cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={prod.image}
                      alt={prod.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DAIRY_FALLBACK_IMG;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    {prod.badge && (
                      <span className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl bg-emerald-700/95 text-white text-[9px] sm:text-[10px] font-black shadow-md backdrop-blur-xs">
                        {prod.badge}
                      </span>
                    )}
                    <span className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-1.5 py-0.5 rounded-md sm:rounded-lg bg-black/60 text-white text-[9px] sm:text-[10px] font-bold backdrop-blur-xs">
                      {prod.unit}
                    </span>

                    {/* Hover Hint */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-xl bg-white/95 text-emerald-900 text-xs font-black shadow-lg flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-emerald-600" />
                        <span>عرض المكونات والتفاصيل</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-2.5 sm:p-5 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                    <div
                      onClick={() => openProductDetail(prod)}
                      className="space-y-1 sm:space-y-1.5 cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
                        <span className="text-emerald-700 font-bold truncate max-w-[90px] sm:max-w-none">{prod.categoryLabel}</span>
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
                          <span>{prod.rating}</span>
                        </div>
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 leading-tight sm:leading-snug group-hover:text-emerald-700 transition">
                        {prod.name}
                      </h4>

                      <p className="hidden sm:block text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    {/* Price and Add button */}
                    <div className="pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 sm:gap-2">
                      <div>
                        <div className="flex items-baseline gap-0.5 sm:gap-1">
                          <span className="text-sm sm:text-lg font-black text-emerald-800 font-mono">
                            {prod.price.toFixed(2)}
                          </span>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-600">ر.س</span>
                        </div>
                        {prod.originalPrice && (
                          <span className="hidden sm:inline text-[11px] text-slate-400 line-through font-mono">
                            {prod.originalPrice.toFixed(2)} ر.س
                          </span>
                        )}
                      </div>

                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-1 sm:gap-2 bg-emerald-50 rounded-lg sm:rounded-xl p-0.5 sm:p-1 border border-emerald-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, -1)}
                            className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-white text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs transition"
                          >
                            <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                          <span className="text-[11px] sm:text-xs font-black text-emerald-900 min-w-[12px] sm:min-w-[16px] text-center font-mono">
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, 1)}
                            className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs transition"
                          >
                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openProductDetail(prod)}
                            className="p-1.5 sm:px-2.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] sm:text-[11px] font-bold transition flex items-center gap-1"
                            title="عرض مكونات وحقائق المنتج"
                          >
                            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
                            <span className="hidden sm:inline">تفاصيل</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => addToCart(prod)}
                            className="px-2 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] sm:text-xs font-black shadow-md shadow-emerald-700/15 active:scale-95 transition flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            <span>أضف</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. REALISTIC PRODUCT DETAIL & INGREDIENTS MODAL */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          dir="rtl"
          onClick={closeProductDetail}
        >
          <div
            className="relative w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-100 bg-slate-50/70">
              {/* Breadcrumb navigation */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-bold overflow-hidden text-ellipsis whitespace-nowrap">
                <span
                  onClick={closeProductDetail}
                  className="text-emerald-700 hover:underline cursor-pointer"
                >
                  متجر حليب الخير 🥛
                </span>
                <span>/</span>
                <span className="text-slate-600">{selectedProduct.categoryLabel}</span>
                <span>/</span>
                <span className="text-slate-800 font-black truncate">{selectedProduct.name}</span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={closeProductDetail}
                className="w-9 h-9 rounded-2xl bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center transition shadow-sm border border-slate-200"
                title="إغلاق والرجوع للمتجر"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto p-5 sm:p-8 space-y-6 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
                {/* Left/Right Grid - Image & Trust Column (5 cols) */}
                <div className="md:col-span-5 space-y-4">
                  {/* High-res image container */}
                  <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DAIRY_FALLBACK_IMG;
                      }}
                      className="w-full h-full object-cover hover:scale-105 transition duration-500"
                    />
                    {selectedProduct.badge && (
                      <span className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-emerald-700 text-white text-xs font-black shadow-lg">
                        {selectedProduct.badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 text-white text-xs font-bold">
                      {selectedProduct.unit}
                    </span>
                  </div>

                  {/* Realistic International Saudi Barcode (EAN-13) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <span>الرمز الشريطي والباركود (EAN-13):</span>
                      <span className="text-emerald-700 font-mono">كود: {selectedProduct.sku}</span>
                    </div>
                    {/* Barcode graphic lines simulation */}
                    <div className="flex flex-col items-center justify-center pt-1 pb-0.5">
                      <div className="flex items-end justify-center gap-[2.5px] h-9 px-4 py-1 bg-white border border-slate-200 rounded-lg w-full">
                        {[4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 4, 1, 3, 2, 1, 3, 1, 4, 2].map((w, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-900 rounded-xs"
                            style={{ width: `${w}px`, height: `${idx % 4 === 0 ? '100%' : '85%'}` }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-xs font-black text-slate-700 tracking-[0.25em] mt-1">
                        {selectedProduct.barcode}
                      </span>
                    </div>
                  </div>

                  {/* Origin & Quality Certifications Badges */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-emerald-900 font-bold">
                      <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{selectedProduct.origin}</span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-800">
                      <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span><strong>فترة الصلاحية:</strong> {selectedProduct.shelfLife}</span>
                    </div>
                    <div className="flex items-start gap-2 text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span><strong>تعليمات التخزين:</strong> {selectedProduct.storage}</span>
                    </div>
                  </div>

                  {/* Trust Stamps */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-700">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                      <span className="text-base">🇸🇦</span>
                      <span>ترخيص SFDA سعودي</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                      <span className="text-base">🏅</span>
                      <span>أيزو ISO 22000</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                      <span className="text-base">🌿</span>
                      <span>طبيعي بدون بودرة</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs">
                      <span className="text-base">✅</span>
                      <span>معتمد حلال 100%</span>
                    </div>
                  </div>
                </div>

                {/* Info & Specifications Column (7 cols) */}
                <div className="md:col-span-7 space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                        {selectedProduct.categoryLabel}
                      </span>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-mono text-sm">{selectedProduct.rating}</span>
                        <span className="text-slate-400">({selectedProduct.reviewsCount} تقييم موثق)</span>
                      </div>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">كود الصنف: <span className="font-mono font-bold text-slate-700">{selectedProduct.sku}</span> • العبوة: {selectedProduct.unit}</p>
                  </div>

                  {/* Price Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-green-50 to-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-bold block mb-0.5">السعر للعبوة:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-emerald-900 font-mono">
                          {selectedProduct.price.toFixed(2)}
                        </span>
                        <span className="text-sm font-bold text-emerald-800">ريال سعودي (ر.س)</span>
                        {selectedProduct.originalPrice && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            {selectedProduct.originalPrice.toFixed(2)} ر.س
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        الأسعار شاملة ضريبة القيمة المضافة 15%
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>متوفر بالمستودع 🟢</span>
                      </span>
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>عن المنتج وجودة الحليب:</span>
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      {selectedProduct.description}
                    </p>
                  </div>

                  {/* 🥗 FULL INGREDIENTS LIST */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>🌿</span>
                      <span>المكونات الطبيعية والمحتويات:</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.ingredients.map((ing, iIdx) => (
                        <div
                          key={iIdx}
                          className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-2xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{ing}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 📊 NUTRITION FACTS TABLE */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <span>📊</span>
                      <span>جدول الحقائق الغذائية (لكل {selectedProduct.nutritionFacts.servingSize}):</span>
                    </h4>
                    <div className="bg-white rounded-2xl border-2 border-slate-900 p-4 font-mono text-xs shadow-sm">
                      <div className="border-b-4 border-slate-900 pb-1.5 mb-2 flex items-center justify-between">
                        <span className="font-cairo font-black text-sm text-slate-900">الحقائق الغذائية / Nutrition Facts</span>
                        <span className="text-[11px] text-slate-600 font-cairo">حجم الحصة: {selectedProduct.nutritionFacts.servingSize}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-slate-300 font-bold">
                        <span className="font-cairo">السعرات الحرارية (Calories):</span>
                        <span className="text-sm font-black text-emerald-900">{selectedProduct.nutritionFacts.calories} ك.سعرة</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 pt-2 text-[11px] text-slate-700">
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="font-cairo">البروتين (Protein):</span>
                          <span className="font-bold">{selectedProduct.nutritionFacts.protein}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="font-cairo">الدهون الكلية (Total Fat):</span>
                          <span className="font-bold">{selectedProduct.nutritionFacts.totalFat}</span>
                        </div>
                        {selectedProduct.nutritionFacts.saturatedFat && (
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="font-cairo">منها دهون مشبعة:</span>
                            <span className="font-bold">{selectedProduct.nutritionFacts.saturatedFat}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-b border-slate-100 pb-1">
                          <span className="font-cairo">الكالسيوم الطبيعي:</span>
                          <span className="font-bold text-emerald-700">{selectedProduct.nutritionFacts.calcium}</span>
                        </div>
                        {selectedProduct.nutritionFacts.carbs && (
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="font-cairo">الكربوهيدرات:</span>
                            <span className="font-bold">{selectedProduct.nutritionFacts.carbs}</span>
                          </div>
                        )}
                        {selectedProduct.nutritionFacts.sugar && (
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="font-cairo">السكريات الطبيعية:</span>
                            <span className="font-bold">{selectedProduct.nutritionFacts.sugar}</span>
                          </div>
                        )}
                        {selectedProduct.nutritionFacts.sodium && (
                          <div className="flex justify-between border-b border-slate-100 pb-1">
                            <span className="font-cairo">الصوديوم:</span>
                            <span className="font-bold">{selectedProduct.nutritionFacts.sodium}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1.5 border border-slate-200 w-full sm:w-auto justify-between sm:justify-start">
                      <span className="text-xs font-bold text-slate-600 px-2 font-cairo">الكمية:</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(selectedProduct.id, -1)}
                          disabled={getItemQuantity(selectedProduct.id) <= 0}
                          className="w-8 h-8 rounded-xl bg-white text-emerald-900 disabled:opacity-40 flex items-center justify-center font-bold shadow-xs hover:bg-slate-50 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-black text-emerald-900 min-w-[20px] text-center font-mono">
                          {Math.max(1, getItemQuantity(selectedProduct.id))}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(selectedProduct)}
                          className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs hover:bg-emerald-800 transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addToCart(selectedProduct);
                      }}
                      className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-700/20 active:scale-98 transition flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة للسلة ({getItemQuantity(selectedProduct.id)} حالياً)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (getItemQuantity(selectedProduct.id) === 0) {
                          addToCart(selectedProduct);
                        }
                        closeProductDetail();
                        setIsCheckoutOpen(true);
                      }}
                      className="w-full sm:w-auto py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-amber-600/20 active:scale-98 transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                    >
                      <span>شراء وتوصيل فوري ⚡</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-bold">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>شحن مبرد 3 ساعات داخل الرياض وجدة ومكة والمدينة والدمام</span>
              </div>
              <button
                type="button"
                onClick={closeProductDetail}
                className="text-emerald-700 hover:text-emerald-900 flex items-center gap-1 font-black cursor-pointer"
              >
                <span>العودة لجميع منتجات المزرعة ↩️</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. SLIDE-OVER CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-black text-slate-900">سلة المشتريات</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  {totalItemsCount} عناصر
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-200/80 text-slate-600 hover:bg-slate-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl">
                    🛒
                  </div>
                  <h4 className="text-sm font-black text-slate-800">السلة فارغة حالياً</h4>
                  <p className="text-xs text-slate-500">اختر من منتجات الحليب والأجبان الطازجة واستمتع بتوصيل سريع ومبرد.</p>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold"
                  >
                    تصفح المنتجات
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center gap-3 shadow-2xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = DAIRY_FALLBACK_IMG;
                      }}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {item.product.name}
                      </h4>
                      <span className="text-[10px] text-slate-500 block">
                        {item.product.price.toFixed(2)} ر.س / {item.product.unit}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-5 h-5 rounded-md bg-white text-emerald-800 flex items-center justify-center text-xs font-bold"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-bold px-1 font-mono">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center text-xs font-bold"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <span className="text-xs font-black text-emerald-900 font-mono">
                          {(item.product.price * item.quantity).toFixed(2)} ر.س
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 transition p-1"
                      title="حذف من السلة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span className="font-mono font-bold">{subtotal.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-mono">{vatAmount.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>رسوم التوصيل المبرد:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {isFreeDelivery ? 'مجاني 🎉' : `${deliveryFee.toFixed(2)} ر.س`}
                    </span>
                  </div>
                  {!isFreeDelivery && (
                    <div className="text-[10px] text-amber-700 font-bold bg-amber-50 p-1.5 rounded-lg border border-amber-200 text-center">
                      أضف منتجات بقيمة {(100 - subtotal).toFixed(2)} ر.س للحصول على شحن مجاني! 🚚
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>الإجمالي النهائي:</span>
                    <span className="text-emerald-800 font-mono text-base">
                      {grandTotal.toFixed(2)} ر.س
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-700/20 active:scale-98 transition flex items-center justify-center gap-2"
                >
                  <span>متابعة إتمام الطلب</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. CHECKOUT DRAWER */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200" dir="rtl">
          <div className="w-full max-w-lg bg-white h-full flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-700" />
                <h3 className="text-base font-black text-slate-900">تأكيد بيانات التوصيل والدفع</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-200/80 text-slate-600 hover:bg-slate-300 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {checkoutError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{checkoutError}</span>
                </div>
              )}

              {/* Order summary pill */}
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 block">إجمالي الطلب شامل الضريبة والتوصيل</span>
                  <span className="text-[11px] text-emerald-700">توصيل مبرد خلال 3 ساعات</span>
                </div>
                <span className="text-lg font-black text-emerald-800 font-mono">
                  {grandTotal.toFixed(2)} ر.س
                </span>
              </div>

              {/* Full name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الاسم الكامل الكريم <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تركي بن فهد القحطاني"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>

              {/* Saudi Mobile */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رقم الجوال للتوصيل <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="05XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition font-mono"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] text-slate-400 font-bold">
                    🇸🇦 السعودية
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  سيتواصل معك مندوب سيارة التبريد على الواتساب أو اتصال عند وصوله لباب منزلك.
                </span>
              </div>

              {/* City Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المدينة <span className="text-rose-500">*</span>
                </label>
                <select
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition font-bold"
                >
                  <option value="الرياض">الرياض (توصيل فوري 3 ساعات)</option>
                  <option value="جدة">جدة (توصيل فوري 3 ساعات)</option>
                  <option value="مكة المكرمة">مكة المكرمة</option>
                  <option value="المدينة المنورة">المدينة المنورة</option>
                  <option value="الدمام">الدمام والخبر</option>
                  <option value="الخرج">الخرج (من مزارعنا مباشرة)</option>
                  <option value="القصيم">بريدة وعنيزة (القصيم)</option>
                  <option value="الأحساء">الأحساء والهفوف</option>
                  <option value="أبها">أبها وخميس مشيط</option>
                  <option value="تبوك">تبوك</option>
                  <option value="حائل">حائل</option>
                </select>
              </div>

              {/* Detailed Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  العنوان بالتفصيل (الحي، الشارع، رقم المنزل) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="مثال: حي النرجس، شارع أنس بن مالك، فيلا رقم 14..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition leading-relaxed"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات للمندوب (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: اترك الطلب عند الباب، يرجى الاتصال قبل الوصول بـ 15 دقيقة..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  طريقة الدفع المعتمدة <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-2xl border text-right transition ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-black shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs mb-1">
                      <Banknote className="w-4 h-4 text-emerald-700" />
                      <span>الدفع عند الاستلام</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      كاش أو مدى مع المندوب
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-right transition ${
                      paymentMethod === 'card'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-black shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs mb-1">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>بطاقة مدى / فيزا</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      Apple Pay أو بطاقة بنكية
                    </span>
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-600 hover:to-green-600 text-white font-black text-sm shadow-xl shadow-emerald-700/25 active:scale-98 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmittingOrder ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>جارِ تأكيد طلبك وتخصيص سيارة التبريد...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>تأكيد طلب التوصيل المبرد الآن 🚚</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 9. ORDER SUCCESS MODAL */}
      {orderSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in zoom-in-95 duration-200" dir="rtl">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-lg shadow-emerald-700/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                تم اعتماد الطلب بنجاح 🎉
              </span>
              <h3 className="text-xl font-black text-slate-900">شكراً لك! طلبك قيد التجهيز</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                تم استلام طلبك من مزارع حليب الخير وسيقوم مندوب التوصيل المبرد بالتواصل معك والوصول خلال موعد أقصاه 3 ساعات.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-right font-bold">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">رقم الطلب:</span>
                <span className="text-emerald-800 font-mono font-black">{orderSuccessData.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">اسم العميل:</span>
                <span className="text-slate-800">{orderSuccessData.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المدينة:</span>
                <span className="text-slate-800">{orderSuccessData.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="text-emerald-700">{orderSuccessData.paymentMethod}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>الإجمالي:</span>
                <span className="text-emerald-800 font-mono">{orderSuccessData.total.toFixed(2)} ر.س</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-bold flex items-center justify-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>لمتابعة شحنتك المبردة تواصل على: 920033814</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setOrderSuccessData(null);
                setIsCheckoutOpen(false);
              }}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition"
            >
              العودة للتسوق والمزيد من المنتجات 🥛
            </button>
          </div>
        </div>
      )}

      {/* 10. STORE FOOTER */}
      <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-900/80 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥛</span>
                <span className="text-lg font-black text-white">متجر حليب الخير</span>
                <span className="text-xs">🇸🇦</span>
              </div>
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                مزارع سعودية رائدة في إنتاج الألبان الطبيعية والأجبان والسمن البري بأعلى معايير الجودة والنقاء بدون أي بودرة أو إضافات صناعية.
              </p>
              <div className="text-[11px] text-emerald-400 font-mono">
                سجل تجاري رقم: 1010582914 - الرياض
              </div>
            </div>

            {/* Col 2: Fast Delivery Cities */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>مناطق التوصيل المبرد</span>
              </h5>
              <ul className="text-xs text-emerald-300/80 space-y-1.5">
                <li>• منطقة الرياض (توصيل فوري 3 ساعات)</li>
                <li>• منطقة مكة المكرمة وجدة</li>
                <li>• المنطقة الشرقية (الدمام والخبر)</li>
                <li>• منطقة المدينة المنورة والقصيم</li>
                <li>• جميع مدن ومحافظات المملكة</li>
              </ul>
            </div>

            {/* Col 3: Customer Care & Hotlines */}
            <div className="space-y-2.5">
              <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>خدمة العملاء والطلبات</span>
              </h5>
              <div className="text-xs text-emerald-300/80 space-y-2 font-mono">
                <div>الرقم الموحد: 920033814</div>
                <div>واتساب الطلبات: 0548234431</div>
                <div>البريد: care@haleeb-alkhair.sa</div>
                <div className="text-[10px] text-emerald-400 font-cairo">
                  متاحون لخدمتكم يومياً من 6 صباحاً حتى 12 ليلاً
                </div>
              </div>
            </div>

            {/* Col 4: Quality & Payment Trust */}
            <div className="space-y-3">
              <h5 className="text-xs font-black text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>طرق الدفع والاعتماد</span>
              </h5>
              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                جميع المنتجات معتمدة ومطابقة للاشتراطات الصحية للهيئة العامة للغذاء والدواء السعودية 🇸🇦.
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-1">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 border border-emerald-800 text-white">مدى mada</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 border border-emerald-800 text-white">Apple Pay</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-900/80 border border-emerald-800 text-white">Visa</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminBackdoorOpen(true);
                    setAdminPinInput('');
                    setAdminPinError('');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-emerald-900/80 border border-emerald-800 text-white hover:bg-emerald-800 hover:border-emerald-700 active:scale-95 transition cursor-pointer text-xs font-bold"
                  title="الدفع كاش عند الاستلام"
                >
                  كاش عند الاستلام
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-emerald-900 text-center text-[11px] text-emerald-400/80 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 متجر حليب الخير للتجارة. جميع الحقوق محفوظة للمملكة العربية السعودية 🇸🇦.</span>
            <span>الأسعار تشمل ضريبة القيمة المضافة 15% (VAT) رقم: 310294857100003</span>
          </div>
        </div>
      </footer>

      {/* Secret Admin Backdoor Modal from "كاش عند الاستلام" */}
      {isAdminBackdoorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
          dir="rtl"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto text-xl shadow-xs">
              <Lock className="w-6 h-6 text-emerald-700" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">
                التحقق الإداري (Admin Gateway)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                أدخل رمز PIN الإداري للولوج المباشر إلى لوحة التحكم
              </p>
            </div>

            <form onSubmit={handleAdminBackdoorSubmit} className="space-y-3">
              <input
                type="password"
                autoFocus
                placeholder="رمز المرور الإداري..."
                value={adminPinInput}
                onChange={(e) => setAdminPinInput(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-sm font-bold tracking-widest focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />

              {adminPinError && (
                <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {adminPinError}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAdminBackdoorOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPin}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isVerifyingPin ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>دخول 🔓</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
