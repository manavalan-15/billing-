import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ScanBarcode,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  UserCheck,
  UserPlus,
  Clock,
  RotateCcw,
  Percent,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Printer,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, CATEGORIES, Customer, Product, ProductVariant, Sale } from '../../types';
import { formatCurrency, generateNextInvoiceNumber } from '../../utils/formatters';
import { VariantPickerModal } from './VariantPickerModal';
import { PaymentModal } from './PaymentModal';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { HeldBillsModal } from './HeldBillsModal';
import confetti from 'canvas-confetti';

export const BillingScreen: React.FC = () => {
  const {
    products,
    cart,
    addToCart,
    updateCartItemQty,
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    selectedCustomer,
    setSelectedCustomer,
    customers,
    addCustomer,
    billDiscountPercent,
    setBillDiscountPercent,
    cartTotals,
    completeCheckout,
    heldBills,
    holdCurrentCart,
    recallHeldBill,
    deleteHeldBill,
    sales,
    settings,
  } = useApp();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [pickerProduct, setPickerProduct] = useState<Product | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHeldOpen, setIsHeldOpen] = useState(false);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Customer search dropdown state
  const [custSearchQuery, setCustSearchQuery] = useState('');
  const [showCustDropdown, setShowCustDropdown] = useState(false);
  const [scanToast, setScanToast] = useState<string | null>(null);

  // Audio retail beep synthesizer for real POS feel
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio context blocked until user interaction
    }
  };

  // Keyboard Shortcuts & USB Barcode Gun Handler
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();

      // Detect hardware barcode scanner (rapid typing sequence < 50ms per key)
      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 4 && (now - lastKeyTime < 300)) {
          // Hardware barcode gun scanned!
          e.preventDefault();
          handleBarcodeScanned(barcodeBuffer);
          barcodeBuffer = '';
          return;
        }
        barcodeBuffer = '';
      } else if (e.key.length === 1) {
        if (now - lastKeyTime < 50) {
          barcodeBuffer += e.key;
        } else {
          barcodeBuffer = e.key;
        }
        lastKeyTime = now;
      }

      // Avoid triggering function shortcuts when typing inside regular inputs
      if (e.key === 'F2') {
        e.preventDefault();
        clearCart();
      } else if (e.key === 'F4') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (cart.length > 0) {
          holdCurrentCart();
        }
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsPaymentOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, clearCart, holdCurrentCart, products]);

  // Next Invoice Number Preview
  const nextInvoiceNum = generateNextInvoiceNumber(settings.invoicePrefix, sales.length);

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesName = prod.name.toLowerCase().includes(query);
    const matchesSku = prod.sku.toLowerCase().includes(query);
    const matchesBarcode = prod.barcode.toLowerCase().includes(query);
    const matchesVariant = prod.variants.some(
      (v) =>
        v.barcode.toLowerCase().includes(query) ||
        v.sku.toLowerCase().includes(query) ||
        v.color.toLowerCase().includes(query) ||
        v.size.toLowerCase().includes(query)
    );

    return matchesCategory && (matchesName || matchesSku || matchesBarcode || matchesVariant);
  });

  // Handle direct barcode scan or SKU submit
  const handleBarcodeScanned = (code: string) => {
    const cleanCode = code.trim().toLowerCase();
    
    // Check if it directly matches a specific variant barcode or SKU
    for (const prod of products) {
      const matchedVariant = prod.variants.find(
        (v) => v.barcode.toLowerCase() === cleanCode || v.sku.toLowerCase() === cleanCode
      );
      if (matchedVariant) {
        const res = addToCart(prod, matchedVariant, 1);
        if (res.success) {
          playBeep();
          setScanToast(`Scanned: ${prod.name} (${matchedVariant.size}/${matchedVariant.color})`);
          setTimeout(() => setScanToast(null), 2500);
        } else if (res.message) {
          alert(res.message);
        }
        return;
      }
    }

    // Check if it matches base product barcode or SKU
    const matchedProduct = products.find(
      (p) => p.barcode.toLowerCase() === cleanCode || p.sku.toLowerCase() === cleanCode
    );
    if (matchedProduct) {
      playBeep();
      setPickerProduct(matchedProduct);
      return;
    }

    alert(`No product found with Barcode or SKU "${code}".`);
  };

  const handleProductCardClick = (product: Product) => {
    setPickerProduct(product);
  };

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const created = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim() || undefined,
      address: '',
      dueBalance: 0,
    });

    setSelectedCustomer(created);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustEmail('');
    setIsNewCustomerOpen(false);
  };

  const handleCheckoutComplete = (
    paymentMethod: any,
    splitDetails?: any,
    amountReceived?: number,
    notes?: string,
    redeemLoyaltyPoints?: number
  ) => {
    const res = completeCheckout(
      paymentMethod,
      splitDetails,
      amountReceived,
      notes,
      redeemLoyaltyPoints
    );

    if (res.success && res.sale) {
      setIsPaymentOpen(false);
      setLastCompletedSale(res.sale);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } else if (res.error) {
      alert(res.error);
    }
  };

  // Filtered customer list for autocomplete dropdown
  const filteredCustomers = custSearchQuery.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(custSearchQuery.toLowerCase()) ||
          c.phone.includes(custSearchQuery)
      )
    : [];

  return (
    <div className="relative flex flex-col lg:flex-row h-full gap-3 overflow-hidden">
      {/* Floating Barcode Scan Notification */}
      {scanToast && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-black px-4 py-1.5 rounded-full font-bold text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <ScanBarcode className="w-4 h-4" />
          <span>{scanToast}</span>
        </div>
      )}

      {/* LEFT COLUMN: Product Catalog, Barcode Scanner, Category Tabs */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        {/* Top Control Bar */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/90 flex flex-wrap items-center justify-between gap-2.5">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  handleBarcodeScanned(searchQuery.trim());
                }
              }}
              placeholder="Search Menswear, Scan Barcode or SKU (F4)..."
              className="w-full px-3 py-2 pl-9 pr-20 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400 font-medium"
            />
            <span className="absolute right-2.5 top-2 text-[10px] text-zinc-500 font-mono border border-zinc-700 rounded px-1.5 py-0.5">
              Enter ↵
            </span>
          </div>

          {/* Barcode Scanner Modal Button */}
          <button
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-colors shrink-0 shadow-xs"
          >
            <ScanBarcode className="w-4 h-4 text-amber-400" />
            <span>Scan Tag</span>
          </button>
        </div>

        {/* Category Navigation Bar */}
        <div className="px-3 py-2 border-b border-zinc-800/80 bg-zinc-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-amber-400 text-black font-bold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
            }`}
          >
            All Items ({products.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            if (count === 0) return null;
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-amber-400 text-black font-bold shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] ${active ? 'text-black/70' : 'text-zinc-500'}`}>({count})</span>
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-zinc-500 text-xs">
              No products found matching "{searchQuery}".
            </div>
          ) : (
            filteredProducts.map((product) => {
              const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);
              const isOutOfStock = totalStock <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => handleProductCardClick(product)}
                  className={`group relative bg-zinc-950/70 border rounded-lg p-2.5 flex flex-col justify-between transition-all cursor-pointer ${
                    isOutOfStock
                      ? 'border-zinc-800/50 opacity-60'
                      : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/40'
                  }`}
                >
                  <div>
                    {/* Image / Icon Thumbnail */}
                    <div className="relative aspect-4/3 w-full rounded-md bg-zinc-900 overflow-hidden mb-2 border border-zinc-800/60">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-zinc-600" />
                        </div>
                      )}
                      {/* GST Badge */}
                      <span className="absolute top-1.5 right-1.5 bg-black/80 backdrop-blur-xs text-[10px] font-mono text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700/50">
                        GST {product.gstRate}%
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-zinc-100 line-clamp-1 group-hover:text-amber-300 transition-colors">
                      {product.name}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-0.5">
                      <span className="truncate">{product.brand}</span>
                      <span className="font-mono text-zinc-500">{product.sku}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-amber-400">
                        {formatCurrency(product.sellingPrice)}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {isOutOfStock ? (
                          <span className="text-red-400 font-medium">Out of stock</span>
                        ) : (
                          <span>{totalStock} in stock</span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      className={`p-1.5 rounded-md transition-colors ${
                        isOutOfStock
                          ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                          : 'bg-zinc-800 hover:bg-amber-400 hover:text-black text-zinc-200'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active POS Cart, Customer Details, Calculations & Checkout */}
      <div className="w-full lg:w-[460px] xl:w-[490px] flex flex-col bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm shrink-0">
        {/* Cart Top Header: Invoice No & Customer Select */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-900/90 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold font-mono text-zinc-200">
                {nextInvoiceNum}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {heldBills.length > 0 && (
                <button
                  onClick={() => setIsHeldOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 rounded-md text-[11px] font-semibold transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Held ({heldBills.length})</span>
                </button>
              )}

              <button
                onClick={clearCart}
                disabled={cart.length === 0}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  cart.length === 0
                    ? 'text-zinc-600 cursor-not-allowed'
                    : 'text-zinc-400 hover:text-red-400 hover:bg-zinc-800'
                }`}
                title="Clear current cart (F2)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear (F2)</span>
              </button>
            </div>
          </div>

          {/* Customer Selection Bar */}
          <div className="relative">
            {selectedCustomer ? (
              <div className="p-2 bg-zinc-950 border border-zinc-700/80 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="font-semibold text-white leading-tight">
                      {selectedCustomer.name}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {selectedCustomer.phone} · Loyalty: <span className="text-amber-400 font-semibold">{selectedCustomer.loyaltyPoints} pts</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[11px] text-zinc-400 hover:text-red-400 px-2 py-0.5 rounded hover:bg-zinc-800"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={custSearchQuery}
                    onChange={(e) => {
                      setCustSearchQuery(e.target.value);
                      setShowCustDropdown(true);
                    }}
                    onFocus={() => setShowCustDropdown(true)}
                    placeholder="Attach Customer (Mobile / Name)..."
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400"
                  />
                  {showCustDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-950 border border-zinc-700 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto divide-y divide-zinc-800">
                      {filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setCustSearchQuery('');
                            setShowCustDropdown(false);
                          }}
                          className="p-2 hover:bg-zinc-800/80 cursor-pointer text-xs flex justify-between items-center"
                        >
                          <div>
                            <div className="font-semibold text-white">{cust.name}</div>
                            <div className="text-[11px] text-zinc-400">{cust.phone}</div>
                          </div>
                          <div className="text-[11px] text-amber-400 font-medium">
                            {cust.loyaltyPoints} pts
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsNewCustomerOpen(true)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold flex items-center gap-1 border border-zinc-700 shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                  <span>New</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-2.5 divide-y divide-zinc-800/70">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12 text-center">
              <ShoppingBag className="w-10 h-10 text-zinc-700 mb-2 stroke-1" />
              <p className="text-xs font-medium text-zinc-400">Cart is empty</p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Scan tags or click items from the left to start billing
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartItemId} className="py-2.5 space-y-1.5 first:pt-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white truncate">
                      {item.productName}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                      <span className="font-semibold text-amber-300">
                        {item.size} / {item.color}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-zinc-500">{item.sku}</span>
                      <span>·</span>
                      <span>GST {item.gstRate}%</span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors shrink-0"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  {/* Quantity adjustment */}
                  <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-md p-0.5">
                    <button
                      onClick={() => updateCartItemQty(item.cartItemId, item.quantity - 1)}
                      className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-white rounded hover:bg-zinc-800"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center font-bold text-white font-mono text-xs">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateCartItemQty(item.cartItemId, item.quantity + 1)}
                      disabled={item.quantity >= item.maxStock}
                      className={`w-5 h-5 flex items-center justify-center rounded ${
                        item.quantity >= item.maxStock
                          ? 'text-zinc-600 cursor-not-allowed'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Item Discount % */}
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-zinc-500">Disc%:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={item.itemDiscountPercent || ''}
                      onChange={(e) => updateCartItemDiscount(item.cartItemId, parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-11 px-1.5 py-0.5 bg-zinc-950 border border-zinc-700 rounded text-center text-xs text-white"
                    />
                  </div>

                  {/* Net Amount */}
                  <div className="text-right">
                    <div className="font-bold text-white text-xs">
                      {formatCurrency(item.totalAmount)}
                    </div>
                    {item.itemDiscountPercent > 0 && (
                      <div className="text-[10px] text-emerald-400">
                        -{item.itemDiscountPercent}% off
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950 space-y-2 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items):</span>
              <span>{formatCurrency(cartTotals.subtotal)}</span>
            </div>

            {cartTotals.itemDiscountTotal > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Item Discount:</span>
                <span>-{formatCurrency(cartTotals.itemDiscountTotal)}</span>
              </div>
            )}

            {/* Bill Discount Input */}
            <div className="flex justify-between items-center text-zinc-400">
              <span className="flex items-center gap-1">
                <span>Bill Discount:</span>
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={billDiscountPercent || ''}
                  onChange={(e) => setBillDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                  placeholder="0"
                  className="w-12 px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-center text-xs text-white"
                />
                <span className="text-zinc-400">%</span>
                {cartTotals.billDiscountAmount > 0 && (
                  <span className="text-emerald-400 font-medium">
                    (-{formatCurrency(cartTotals.billDiscountAmount)})
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between text-zinc-400">
              <span>Taxable Value:</span>
              <span>{formatCurrency(cartTotals.taxableTotal)}</span>
            </div>

            <div className="flex justify-between text-zinc-400">
              <span>Total GST (CGST + SGST):</span>
              <span>{formatCurrency(cartTotals.totalGst)}</span>
            </div>

            {cartTotals.roundOff !== 0 && (
              <div className="flex justify-between text-zinc-500 text-[11px]">
                <span>Round Off:</span>
                <span>{cartTotals.roundOff > 0 ? `+${cartTotals.roundOff}` : cartTotals.roundOff}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="pt-2 border-t border-zinc-800 flex justify-between items-baseline">
            <span className="text-sm font-bold uppercase tracking-wider text-white">
              Grand Total:
            </span>
            <span className="text-xl font-black text-amber-400">
              {formatCurrency(cartTotals.grandTotal)}
            </span>
          </div>

          {/* Actions Bar */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => holdCurrentCart()}
              className={`flex-1 py-2 px-3 border rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                cart.length === 0
                  ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
              }`}
              title="Park bill (F6)"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Hold (F6)</span>
            </button>

            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setIsPaymentOpen(true)}
              className={`flex-2 py-2.5 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md ${
                cart.length === 0
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-black hover:shadow-amber-500/20'
              }`}
            >
              <span>Pay & Print (F8)</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {pickerProduct && (
        <VariantPickerModal
          product={pickerProduct}
          onAddToCart={(variant, qty) => {
            const res = addToCart(pickerProduct, variant, qty);
            if (!res.success && res.message) {
              alert(res.message);
            }
          }}
          onClose={() => setPickerProduct(null)}
        />
      )}

      {isPaymentOpen && (
        <PaymentModal
          grandTotal={cartTotals.grandTotal}
          customer={selectedCustomer}
          settings={settings}
          onClose={() => setIsPaymentOpen(false)}
          onConfirm={handleCheckoutComplete}
        />
      )}

      {lastCompletedSale && (
        <ThermalReceiptModal
          sale={lastCompletedSale}
          settings={settings}
          onClose={() => setLastCompletedSale(null)}
          onNewBill={() => {
            setLastCompletedSale(null);
            clearCart();
          }}
        />
      )}

      {isScannerOpen && (
        <BarcodeScannerModal
          products={products}
          onScan={handleBarcodeScanned}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {isHeldOpen && (
        <HeldBillsModal
          heldBills={heldBills}
          onRecall={recallHeldBill}
          onDelete={deleteHeldBill}
          onClose={() => setIsHeldOpen(false)}
        />
      )}

      {/* Quick New Customer Modal */}
      {isNewCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 max-w-sm w-full shadow-2xl text-zinc-100">
            <h3 className="font-bold text-sm text-white mb-3">Add Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="10 digit mobile"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="rahul@example.com"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerOpen(false)}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
