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
} from 'lucide-react';
import { DAIRY_PRODUCTS, DAIRY_CATEGORIES, DairyProduct } from '@/data/dairy-products';

interface CartItem {
  product: DairyProduct;
  quantity: number;
}

const DAIRY_FALLBACK_IMG =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect fill="%23f0fdf4" width="400" height="400"/><text fill="%23059669" font-family="sans-serif" font-size="64" font-weight="bold" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle">🥛 ألبان الخير</text></svg>';

export default function AlKhairDairyStore({ isAdmin }: { isAdmin?: boolean }) {
  // Page title override for complete camouflage
  useEffect(() => {
    const originalTitle = document.title;
    document.title = 'متجر ألبان الخير الطازجة 🥛🇸🇦 | منتجات المزارع السعودية الطبيعية';
    return () => {
      document.title = originalTitle;
    };
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);

  // Secret admin backdoor from "كاش عند الاستلام" button
  const [isAdminBackdoorOpen, setIsAdminBackdoorOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

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
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
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

  // Filtered products
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
            <span>🚚 توصيل مبرد وسريع خلال 3 ساعات داخل الرياض وجدة - الشحن مجاني للطلبات فوق 100 ر.س</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-emerald-100 justify-center">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>الرقم الموحد: 920033814</span>
            </span>
            <span className="hidden md:inline">|</span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>طبيعي 100% بدون إضافات 🇸🇦</span>
            </span>
            {isAdmin && (
              <Link
                href="/admin-dashboard"
                className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 font-black transition text-[10px] flex items-center gap-1 shadow-sm"
              >
                <span>🚨 لوحة الأدمن</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN STORE HEADER */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center text-2xl shadow-md shadow-emerald-700/20">
                🥛
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight">
                    ألبان الخير
                  </h1>
                  <span className="text-sm">🇸🇦</span>
                </div>
                <p className="text-[10px] text-emerald-700 font-bold -mt-0.5">
                  منتجات المزارع السعودية الطازجة | Al-Khair Fresh Dairy
                </p>
              </div>
            </div>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <div className="relative w-full">
                <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث عن حليب، لبن، جبن، قشطة، سمن بري..."
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
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Quick Actions */}
            <div className="flex items-center gap-3">
              {/* WhatsApp Quick Order */}
              <a
                href="https://wa.me/966548234431?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%D8%8C%20%D8%A3%D8%B1%D8%BA%D8%A8%20%D9%81%D9%8A%20%D8%B7%D9%84%D8%A8%20%D9%85%D9%86%D8%AA%D8%AC%D8%A7%D8%AA%20%D8%A3%D9%84%D8%A8%D8%A7%D9%86%20%D8%A7%D9%84%D8%AE%D9%8A%D8%B1%20%D8%A7%D9%84%D8%B7%D8%A7%D8%B2%D8%AC%D8%A9"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>واتساب المزرعة</span>
              </a>

              {/* Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="relative px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-xs shadow-md shadow-emerald-700/20 active:scale-95 transition flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">سلة المشتريات</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white text-emerald-800 text-[11px] font-black min-w-[20px] text-center">
                  {totalItemsCount}
                </span>
                {subtotal > 0 && (
                  <span className="border-r border-emerald-500/60 pr-2 mr-1 hidden sm:inline font-mono">
                    {subtotal.toFixed(2)} ر.س
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Input */}
          <div className="mt-3 md:hidden">
            <div className="relative w-full">
              <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث عن حليب، لبن، جبن، قشطة، سمن بري..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-xs rounded-xl bg-slate-100 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </header>

      {/* 3. HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-900 via-emerald-800 to-green-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4 text-center md:text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-700/60 border border-emerald-500/40 text-emerald-200 text-xs font-bold">
              <span>🇸🇦 مزارع الخرج والقصيم الوطنية</span>
              <span>•</span>
              <span>حلبة الصباح الباكر</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight text-white">
              طبيعية 100% من مزارعنا <br />
              <span className="text-emerald-300">مباشرة إلى باب بيتك 🥛</span>
            </h2>
            <p className="text-sm sm:text-base text-emerald-100 leading-relaxed max-w-xl">
              نقدم لكم أطايب المزارع السعودية من الحليب البقري والنياق الصافي، والأجبان والزبدة والسمن البري الخالص. تُنتج يومياً بدون أي بودرة مسترجعة أو مواد حافظة لضمان صحة عائلتك.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              <a
                href="#products-section"
                className="px-6 py-3 rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs sm:text-sm shadow-xl active:scale-95 transition flex items-center gap-2"
              >
                <span>تسوق المنتجات الطازجة الآن</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </a>
              <div className="flex items-center gap-2 text-xs text-emerald-200 font-bold px-3 py-2 bg-emerald-800/40 rounded-xl border border-emerald-700/50">
                <Truck className="w-4 h-4 text-emerald-300" />
                <span>توصيل مبرد 3 ساعات</span>
              </div>
            </div>
          </div>

          {/* Hero Feature Badges */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-md">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center space-y-1">
              <span className="text-2xl">🌿</span>
              <h4 className="text-xs font-black text-white">بدون إضافات</h4>
              <p className="text-[10px] text-emerald-200">حليب نقي وطبيعي 100%</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center space-y-1">
              <span className="text-2xl">🔬</span>
              <h4 className="text-xs font-black text-white">مفحوص مخبرياً</h4>
              <p className="text-[10px] text-emerald-200">مطابق لمواصفات الغذاء والدواء</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center space-y-1">
              <span className="text-2xl">🐪</span>
              <h4 className="text-xs font-black text-white">ألبان إبل ونياق</h4>
              <p className="text-[10px] text-emerald-200">مبسترة ونقية بأعلى معايير</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center space-y-1">
              <span className="text-2xl">💵</span>
              <h4 className="text-xs font-black text-white">دفع عند الاستلام</h4>
              <p className="text-[10px] text-emerald-200">كاش أو مدى عند وصول المندوب</p>
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
            <p className="text-xs text-slate-500 mt-0.5">اختر من تشكيلتنا المميزة من الحليب، الأجبان، السمن، وألبان الإبل</p>
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

      {/* 5. PRODUCTS GRID */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((prod) => {
              const qtyInCart = getItemQuantity(prod.id);
              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-500/50 shadow-xs hover:shadow-xl hover:shadow-emerald-900/5 transition duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Image container */}
                  <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
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
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-emerald-700/95 text-white text-[10px] font-black shadow-md backdrop-blur-xs">
                        {prod.badge}
                      </span>
                    )}
                    <span className="absolute bottom-3 left-3 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                      {prod.unit}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="text-emerald-700 font-bold">{prod.categoryLabel}</span>
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{prod.rating}</span>
                          <span className="text-slate-400 text-[10px]">({prod.reviewsCount})</span>
                        </div>
                      </div>

                      <h4 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-700 transition">
                        {prod.name}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {prod.description}
                      </p>
                    </div>

                    {/* Price and Add button */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg font-black text-emerald-800 font-mono">
                            {prod.price.toFixed(2)}
                          </span>
                          <span className="text-xs font-bold text-slate-600">ر.س</span>
                        </div>
                        {prod.originalPrice && (
                          <span className="text-[11px] text-slate-400 line-through font-mono">
                            {prod.originalPrice.toFixed(2)} ر.س
                          </span>
                        )}
                      </div>

                      {qtyInCart > 0 ? (
                        <div className="flex items-center gap-2 bg-emerald-50 rounded-xl p-1 border border-emerald-200">
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, -1)}
                            className="w-7 h-7 rounded-lg bg-white text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-bold text-sm shadow-xs transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-black text-emerald-900 min-w-[16px] text-center font-mono">
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(prod.id, 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center font-bold text-sm shadow-xs transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => addToCart(prod)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black shadow-md shadow-emerald-700/15 active:scale-95 transition flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>أضف للسلة</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 6. CART DRAWER (SLIDE-OVER) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" dir="rtl">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Drawer Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-800 text-white">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-emerald-200" />
                  <h3 className="text-base font-black">سلة المشتريات الطازجة</h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                    {totalItemsCount} منتجات
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/20 text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Free Delivery Bar Progress */}
              <div className="p-3 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-900 font-bold">
                {isFreeDelivery ? (
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>مبروك! لقد حصلت على توصيل مبرد مجاني 🎉</span>
                  </div>
                ) : (
                  <div>
                    <span>أضف بـ </span>
                    <span className="font-black text-emerald-800 font-mono">{(100 - subtotal).toFixed(2)} ر.س</span>
                    <span> إضافية لتفعيل الشحن المجاني! 🚚</span>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (subtotal / 100) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-16 space-y-3 text-slate-400">
                    <ShoppingBag className="w-12 h-12 mx-auto text-slate-300" />
                    <p className="text-sm font-bold text-slate-700">سلتك فارغة حالياً</p>
                    <p className="text-xs text-slate-400">اختر أشهى منتجات الألبان والأجبان الطبيعية لإضافتها للسلة.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = DAIRY_FALLBACK_IMG;
                        }}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-black text-slate-900 truncate">{item.product.name}</h5>
                        <p className="text-[10px] text-slate-400">{item.product.unit}</p>
                        <div className="text-xs font-black text-emerald-800 mt-1 font-mono">
                          {(item.product.price * item.quantity).toFixed(2)} ر.س
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 bg-white rounded-xl p-1 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black min-w-[16px] text-center font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 flex items-center justify-center text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Drawer Footer & Checkout Button */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 space-y-3">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>مجموع المنتجات:</span>
                      <span className="font-mono font-bold">{subtotal.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة (15%):</span>
                      <span className="font-mono font-bold">{vatAmount.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>التوصيل المبرد:</span>
                      <span className="font-bold">
                        {isFreeDelivery ? (
                          <span className="text-emerald-700 font-black">مجاني 🚚</span>
                        ) : (
                          <span className="font-mono">15.00 ر.س</span>
                        )}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                      <span>الإجمالي النهائي:</span>
                      <span className="text-base text-emerald-800 font-mono">{grandTotal.toFixed(2)} ر.س</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-700 to-green-700 hover:from-emerald-600 hover:to-green-600 text-white font-black text-sm shadow-lg shadow-emerald-700/25 active:scale-98 transition flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>متابعة الشحن والدفع ({grandTotal.toFixed(2)} ر.س) 💳</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">إتمام الطلب والتوصيل المبرد</h3>
                  <p className="text-[11px] text-slate-500">التوصيل متاح لجميع مناطق المملكة خلال 3 ساعات</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكريم بالكامل:</label>
                <input
                  type="text"
                  required
                  placeholder="اكتب اسم المستلم..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الجوال السعودي:</label>
                  <input
                    type="tel"
                    required
                    placeholder="05XXXXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المدينة:</label>
                  <select
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="الرياض">📍 الرياض (توصيل فوري 3 ساعات)</option>
                    <option value="جدة">📍 جدة (توصيل فوري 3 ساعات)</option>
                    <option value="الدمام">📍 الدمام والخبر والظهران</option>
                    <option value="مكة المكرمة">📍 مكة المكرمة</option>
                    <option value="المدينة المنورة">📍 المدينة المنورة</option>
                    <option value="القصيم">📍 القصيم (بريدة وعنيزة)</option>
                    <option value="الأحساء">📍 الأحساء والهفوف</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">العنوان بالتفصيل (الحي، الشارع، رقم البيت):</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: حي النرجس، شارع عثمان بن عفان، فيلا 12..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات خاصة للمندوب (اختياري):</label>
                <input
                  type="text"
                  placeholder="مثال: يرجى الاتصال قبل الوصول بـ 15 دقيقة..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">طريقة الدفع المفضلة:</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-3 rounded-2xl border text-right transition flex items-center gap-2.5 ${
                      paymentMethod === 'cod'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="text-[11px] leading-tight">
                      <div>الدفع عند الاستلام</div>
                      <span className="text-[10px] text-slate-500 font-normal">كاش أو مدى مع المندوب</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-right transition flex items-center gap-2.5 ${
                      paymentMethod === 'card'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-black'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="text-[11px] leading-tight">
                      <div>بطاقة مدى / فيزا</div>
                      <span className="text-[10px] text-slate-500 font-normal">دفع إلكتروني آمن 100%</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Order Final Summary */}
              <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs space-y-1 font-bold">
                <div className="flex justify-between text-slate-600">
                  <span>إجمالي المنتجات ({totalItemsCount} قطع):</span>
                  <span className="font-mono">{subtotal.toFixed(2)} ر.س</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>الشحن المبرد لـ {customerCity}:</span>
                  <span>{isFreeDelivery ? 'مجاني 🚚' : '15.00 ر.س'}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-slate-200">
                  <span>المبلغ المطلوب سداده:</span>
                  <span className="text-emerald-800 font-mono">{grandTotal.toFixed(2)} ر.س</span>
                </div>
              </div>

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

      {/* 8. ORDER SUCCESS MODAL */}
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
                تم استلام طلبك من مزارع ألبان الخير وسيقوم مندوب التوصيل المبرد بالتواصل معك والوصول خلال موعد أقصاه 3 ساعات.
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

      {/* 9. STORE FOOTER */}
      <footer className="bg-emerald-950 text-emerald-100 border-t border-emerald-900/80 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Col 1: Brand Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥛</span>
                <span className="text-lg font-black text-white">متجر ألبان الخير</span>
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
                <div>البريد: care@alkhair-dairy.sa</div>
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
            <span>© 2026 متجر ألبان الخير للتجارة. جميع الحقوق محفوظة للمملكة العربية السعودية 🇸🇦.</span>
            <span>الأسعار تشمل ضريبة القيمة المضافة 15% (VAT) رقم: 310294857100003</span>
          </div>
        </div>
      </footer>

      {/* Secret Admin Backdoor Modal from "كاش عند الاستلام" */}
      {isAdminBackdoorOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">التحقق الإداري 🔐</h4>
                  <p className="text-[10px] text-slate-400">لوحة تحكم منصة ملخصات تمريض</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdminBackdoorOpen(false);
                  setAdminPinInput('');
                  setAdminPinError('');
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdminBackdoorSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  رمز المرور الإداري (PIN):
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    setAdminPinError('');
                  }}
                  placeholder="••••••••••"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-center font-mono tracking-widest text-base focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {adminPinError && (
                  <p className="text-xs text-rose-400 font-bold mt-1.5 text-center">
                    {adminPinError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isVerifyingPin}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isVerifyingPin ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>دخول لوحة التحكم 🚀</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminBackdoorOpen(false);
                    setAdminPinInput('');
                    setAdminPinError('');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
