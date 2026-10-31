import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuditLog,
  CartItem,
  Customer,
  Expense,
  HeldBill,
  PaymentMethod,
  Product,
  ProductVariant,
  Purchase,
  Sale,
  ShopSettings,
  SplitPaymentDetail,
  StockMovement,
  Supplier,
  User
} from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_EXPENSES,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_SETTINGS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_SUPPLIERS,
  INITIAL_USERS
} from '../data/initialData';
import { calculateItemPricing, generateNextInvoiceNumber } from '../utils/formatters';

interface AppContextType {
  // Auth & Roles
  currentUser: User;
  users: User[];
  switchUser: (user: User, pin: string) => boolean;
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (user: User) => void;
  verifyAdminOrManagerPin: (pin: string) => boolean;

  // Products & Variants
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'totalStock' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  adjustStock: (
    productId: string,
    variantId: string,
    quantityChange: number,
    type: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE',
    reason: string
  ) => boolean;

  // POS & Cart
  cart: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => { success: boolean; message?: string };
  updateCartItemQty: (cartItemId: string, newQty: number) => { success: boolean; message?: string };
  updateCartItemDiscount: (cartItemId: string, discountPercent: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  billDiscountPercent: number;
  setBillDiscountPercent: (percent: number) => void;
  cartTotals: {
    subtotal: number;
    itemDiscountTotal: number;
    billDiscountAmount: number;
    taxableTotal: number;
    totalGst: number;
    roundOff: number;
    grandTotal: number;
  };
  completeCheckout: (
    paymentMethod: PaymentMethod,
    splitDetails?: SplitPaymentDetail,
    amountReceived?: number,
    notes?: string,
    redeemLoyaltyPoints?: number
  ) => { success: boolean; sale?: Sale; error?: string };

  // Held Bills
  heldBills: HeldBill[];
  holdCurrentCart: (notes?: string) => boolean;
  recallHeldBill: (id: string) => void;
  deleteHeldBill: (id: string) => void;

  // Sales History & Cancellation
  sales: Sale[];
  cancelOrRefundBill: (saleId: string, reason: string, pin: string, type: 'CANCELLED' | 'REFUNDED') => { success: boolean; message: string };

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'totalPurchases' | 'totalOrders' | 'loyaltyPoints' | 'createdAt'>) => Customer;
  updateCustomer: (customer: Customer) => void;

  // Suppliers & Purchases
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalPurchases' | 'outstandingBalance'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id' | 'invoiceNumber'>) => void;

  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  deleteExpense: (id: string) => void;

  // Stock Movements & Audit
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];

  // Settings & DB Management
  settings: ShopSettings;
  updateSettings: (newSettings: Partial<ShopSettings>) => void;
  resetAllData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonString: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'aura_menswear_pos_db_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load persisted state or initial data
  const [isLoaded, setIsLoaded] = useState(false);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]); // default admin
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(INITIAL_STOCK_MOVEMENTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    {
      id: 'log_init',
      action: 'SYSTEM_BOOT',
      entity: 'System',
      entityId: 'SYS_01',
      details: 'Aura Men\'s Atelier POS initialized with initial catalogue.',
      userId: 'usr_admin',
      userName: 'Alexander Wright',
      timestamp: '2026-03-01T09:00:00Z'
    }
  ]);
  const [settings, setSettings] = useState<ShopSettings>(INITIAL_SETTINGS);

  // Cart / POS state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [billDiscountPercent, setBillDiscountPercent] = useState<number>(0);
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.products) setProducts(parsed.products);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.suppliers) setSuppliers(parsed.suppliers);
        if (parsed.purchases) setPurchases(parsed.purchases);
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.auditLogs) setAuditLogs(parsed.auditLogs);
        if (parsed.users) setUsers(parsed.users);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.heldBills) setHeldBills(parsed.heldBills);
      }
    } catch (e) {
      console.error('Failed to load local storage database:', e);
    }
    setIsLoaded(true);
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    const dbState = {
      products,
      sales,
      customers,
      suppliers,
      purchases,
      expenses,
      stockMovements,
      auditLogs,
      users,
      settings,
      heldBills,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dbState));
    } catch (e) {
      console.error('Failed to write database to localStorage:', e);
    }
  }, [
    isLoaded,
    products,
    sales,
    customers,
    suppliers,
    purchases,
    expenses,
    stockMovements,
    auditLogs,
    users,
    settings,
    heldBills,
  ]);

  const logAudit = (action: string, entity: string, entityId: string, details: string) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      action,
      entity,
      entityId,
      details,
      userId: currentUser.id,
      userName: currentUser.name,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Auth methods
  const switchUser = (user: User, pin: string): boolean => {
    if (user.pin === pin) {
      setCurrentUser(user);
      logAudit('AUTH_SWITCH', 'User', user.id, `Switched active cashier/user to ${user.name} (${user.role})`);
      return true;
    }
    return false;
  };

  const verifyAdminOrManagerPin = (pin: string): boolean => {
    const authorized = users.some(
      (u) => (u.role === 'admin' || u.role === 'manager') && u.pin === pin && u.active
    );
    return authorized;
  };

  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [...prev, newUser]);
    logAudit('CREATE_USER', 'User', newUser.id, `Created user ${newUser.name} with role ${newUser.role}`);
  };

  const updateUser = (updated: User) => {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
    logAudit('UPDATE_USER', 'User', updated.id, `Updated user details for ${updated.name}`);
  };

  // Product management
  const addProduct = (prodData: Omit<Product, 'id' | 'totalStock' | 'createdAt' | 'updatedAt'>) => {
    const totalStock = prodData.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    const newProduct: Product = {
      ...prodData,
      id: `prod_${Date.now()}`,
      totalStock,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setProducts((prev) => [newProduct, ...prev]);
    logAudit('CREATE_PRODUCT', 'Product', newProduct.id, `Added product ${newProduct.name} (${newProduct.sku})`);
  };

  const updateProduct = (updated: Product) => {
    const totalStock = updated.variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    const refreshed: Product = {
      ...updated,
      totalStock,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? refreshed : p)));
    logAudit('UPDATE_PRODUCT', 'Product', updated.id, `Updated product ${updated.name} (${updated.sku})`);
  };

  const deleteProduct = (productId: string) => {
    const p = products.find((prod) => prod.id === productId);
    setProducts((prev) => prev.filter((prod) => prod.id !== productId));
    logAudit('DELETE_PRODUCT', 'Product', productId, `Deleted product ${p?.name || productId}`);
  };

  const adjustStock = (
    productId: string,
    variantId: string,
    quantityChange: number,
    type: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE',
    reason: string
  ): boolean => {
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    const variantIndex = product.variants.findIndex((v) => v.id === variantId);
    if (variantIndex === -1) return false;

    const currentStock = product.variants[variantIndex].stock;
    const newVariantStock = Math.max(0, currentStock + quantityChange);

    const updatedVariants = [...product.variants];
    updatedVariants[variantIndex] = {
      ...updatedVariants[variantIndex],
      stock: newVariantStock,
    };

    const newTotalStock = updatedVariants.reduce((s, v) => s + v.stock, 0);

    const updatedProduct = {
      ...product,
      variants: updatedVariants,
      totalStock: newTotalStock,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setProducts((prev) => prev.map((p) => (p.id === productId ? updatedProduct : p)));

    // Log Stock Movement
    const movement: StockMovement = {
      id: `sm_${Date.now()}`,
      productId: product.id,
      productName: product.name,
      variantId,
      size: product.variants[variantIndex].size,
      color: product.variants[variantIndex].color,
      type,
      quantityChange,
      newStockLevel: newVariantStock,
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      reason,
      performedBy: currentUser.name,
      timestamp: new Date().toISOString(),
    };

    setStockMovements((prev) => [movement, ...prev]);
    logAudit('STOCK_ADJUSTMENT', 'Inventory', `${productId}_${variantId}`, `${type}: ${quantityChange > 0 ? '+' : ''}${quantityChange} units for ${product.name} (${product.variants[variantIndex].size}/${product.variants[variantIndex].color}) - Reason: ${reason}`);

    return true;
  };

  // Cart operations
  const addToCart = (
    product: Product,
    variant: ProductVariant,
    quantity = 1
  ): { success: boolean; message?: string } => {
    if (variant.stock <= 0) {
      return { success: false, message: `Insufficient stock! ${product.name} (${variant.size}/${variant.color}) is out of stock.` };
    }

    const existingIndex = cart.findIndex((item) => item.variantId === variant.id);

    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      const newQty = existingItem.quantity + quantity;

      if (newQty > variant.stock) {
        return {
          success: false,
          message: `Cannot add more than available stock (${variant.stock} available).`,
        };
      }

      const pricing = calculateItemPricing(
        existingItem.unitPrice,
        newQty,
        existingItem.itemDiscountPercent,
        existingItem.gstRate,
        settings.taxInclusive
      );

      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQty,
        taxableAmount: pricing.taxableAmount,
        gstAmount: pricing.gstAmount,
        totalAmount: pricing.totalAmount,
      };

      setCart(updatedCart);
      return { success: true };
    }

    if (quantity > variant.stock) {
      return {
        success: false,
        message: `Requested quantity exceeds available stock (${variant.stock} units in stock).`,
      };
    }

    const unitPrice = variant.sellingPrice ?? product.sellingPrice;
    const pricing = calculateItemPricing(unitPrice, quantity, 0, product.gstRate, settings.taxInclusive);

    const newItem: CartItem = {
      cartItemId: `ci_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      productId: product.id,
      productName: product.name,
      category: product.category,
      brand: product.brand,
      variantId: variant.id,
      size: variant.size,
      color: variant.color,
      barcode: variant.barcode || product.barcode,
      sku: variant.sku || product.sku,
      purchasePrice: variant.purchasePrice ?? product.purchasePrice,
      unitPrice,
      mrp: product.mrp,
      quantity,
      maxStock: variant.stock,
      itemDiscountPercent: 0,
      gstRate: product.gstRate,
      taxableAmount: pricing.taxableAmount,
      gstAmount: pricing.gstAmount,
      totalAmount: pricing.totalAmount,
    };

    setCart((prev) => [newItem, ...prev]);
    return { success: true };
  };

  const updateCartItemQty = (cartItemId: string, newQty: number): { success: boolean; message?: string } => {
    if (newQty <= 0) {
      removeFromCart(cartItemId);
      return { success: true };
    }

    const item = cart.find((i) => i.cartItemId === cartItemId);
    if (!item) return { success: false, message: 'Item not found in cart.' };

    if (newQty > item.maxStock) {
      return {
        success: false,
        message: `Only ${item.maxStock} units available for size ${item.size} / ${item.color}.`,
      };
    }

    const pricing = calculateItemPricing(
      item.unitPrice,
      newQty,
      item.itemDiscountPercent,
      item.gstRate,
      settings.taxInclusive
    );

    setCart((prev) =>
      prev.map((i) =>
        i.cartItemId === cartItemId
          ? {
              ...i,
              quantity: newQty,
              taxableAmount: pricing.taxableAmount,
              gstAmount: pricing.gstAmount,
              totalAmount: pricing.totalAmount,
            }
          : i
      )
    );
    return { success: true };
  };

  const updateCartItemDiscount = (cartItemId: string, discountPercent: number) => {
    const boundedPct = Math.max(0, Math.min(100, discountPercent));
    setCart((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        const pricing = calculateItemPricing(
          item.unitPrice,
          item.quantity,
          boundedPct,
          item.gstRate,
          settings.taxInclusive
        );
        return {
          ...item,
          itemDiscountPercent: boundedPct,
          taxableAmount: pricing.taxableAmount,
          gstAmount: pricing.gstAmount,
          totalAmount: pricing.totalAmount,
        };
      })
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setBillDiscountPercent(0);
  };

  // Cart Totals calculation
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const itemsTotalAfterItemDiscount = cart.reduce((sum, item) => sum + item.totalAmount, 0);
  const itemDiscountTotal = subtotal - itemsTotalAfterItemDiscount;

  const billDiscountAmount = Math.round(((itemsTotalAfterItemDiscount * billDiscountPercent) / 100) * 100) / 100;
  const netPayablePreTax = itemsTotalAfterItemDiscount - billDiscountAmount;

  const totalGst = cart.reduce((sum, item) => {
    // scale gst proportional to bill discount
    const discountRatio = itemsTotalAfterItemDiscount > 0 ? netPayablePreTax / itemsTotalAfterItemDiscount : 1;
    return sum + item.gstAmount * discountRatio;
  }, 0);

  const taxableTotal = netPayablePreTax - (settings.taxInclusive ? totalGst : 0);
  const exactGrandTotal = settings.taxInclusive ? netPayablePreTax : taxableTotal + totalGst;
  const grandTotal = Math.round(exactGrandTotal);
  const roundOff = Math.round((grandTotal - exactGrandTotal) * 100) / 100;

  const cartTotals = {
    subtotal,
    itemDiscountTotal,
    billDiscountAmount,
    taxableTotal: Math.round(taxableTotal * 100) / 100,
    totalGst: Math.round(totalGst * 100) / 100,
    roundOff,
    grandTotal,
  };

  // Checkout execution
  const completeCheckout = (
    paymentMethod: PaymentMethod,
    splitDetails?: SplitPaymentDetail,
    amountReceived?: number,
    notes?: string,
    redeemLoyaltyPoints = 0
  ): { success: boolean; sale?: Sale; error?: string } => {
    if (cart.length === 0) {
      return { success: false, error: 'Cannot complete checkout with an empty cart.' };
    }

    // Check inventory availability for every cart item
    for (const item of cart) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return { success: false, error: `Product "${item.productName}" not found.` };
      const variant = prod.variants.find((v) => v.id === item.variantId);
      if (!variant) return { success: false, error: `Variant ${item.size}/${item.color} not found.` };
      if (variant.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.productName} (${item.size}/${item.color}). Only ${variant.stock} left in stock.`,
        };
      }
    }

    // Calculate loyalty discount
    const loyaltyDiscountAmount = Math.min(redeemLoyaltyPoints * settings.loyaltyRedeemValue, grandTotal);
    const finalGrandTotal = Math.max(0, grandTotal - loyaltyDiscountAmount);

    const invoiceNumber = generateNextInvoiceNumber(settings.invoicePrefix, sales.length);
    const saleDate = new Date().toISOString();

    const customerName = selectedCustomer ? selectedCustomer.name : 'Walk-in Customer';
    const customerPhone = selectedCustomer?.phone;

    // Calculate points earned: 1 point per ₹100
    const pointsEarned = Math.floor(finalGrandTotal / 100) * settings.loyaltyEarnRate;

    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      invoiceNumber,
      date: saleDate,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      customerId: selectedCustomer?.id,
      customerName,
      customerPhone,
      items: [...cart],
      subtotal: cartTotals.subtotal,
      itemDiscountTotal: cartTotals.itemDiscountTotal,
      billDiscountPercent,
      billDiscountAmount: cartTotals.billDiscountAmount,
      totalGst: cartTotals.totalGst,
      taxableTotal: cartTotals.taxableTotal,
      roundOff: cartTotals.roundOff,
      grandTotal: finalGrandTotal,
      paymentMethod,
      splitDetails: paymentMethod === 'Split' ? splitDetails : undefined,
      amountReceived: amountReceived ?? finalGrandTotal,
      changeReturned: amountReceived ? Math.max(0, amountReceived - finalGrandTotal) : 0,
      status: 'COMPLETED',
      loyaltyPointsEarned: pointsEarned,
      loyaltyPointsRedeemed: redeemLoyaltyPoints,
      loyaltyDiscountAmount,
      notes,
    };

    // Deduct stock for all items
    const updatedProducts = products.map((prod) => {
      const cartItemsForProd = cart.filter((ci) => ci.productId === prod.id);
      if (cartItemsForProd.length === 0) return prod;

      const updatedVariants = prod.variants.map((v) => {
        const item = cartItemsForProd.find((ci) => ci.variantId === v.id);
        if (!item) return v;
        return {
          ...v,
          stock: Math.max(0, v.stock - item.quantity),
        };
      });

      const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);

      return {
        ...prod,
        variants: updatedVariants,
        totalStock: newTotalStock,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    });

    // Create stock movement records
    const newMovements: StockMovement[] = cart.map((item) => {
      const prod = updatedProducts.find((p) => p.id === item.productId);
      const variant = prod?.variants.find((v) => v.id === item.variantId);
      return {
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        type: 'SALE',
        quantityChange: -item.quantity,
        newStockLevel: variant?.stock ?? 0,
        referenceId: invoiceNumber,
        performedBy: currentUser.name,
        timestamp: saleDate,
      };
    });

    // Update customer stats
    if (selectedCustomer) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== selectedCustomer.id) return c;
          const newPoints = Math.max(0, c.loyaltyPoints - redeemLoyaltyPoints + pointsEarned);
          return {
            ...c,
            totalPurchases: c.totalPurchases + finalGrandTotal,
            totalOrders: c.totalOrders + 1,
            loyaltyPoints: newPoints,
          };
        })
      );
    }

    setProducts(updatedProducts);
    setStockMovements((prev) => [...newMovements, ...prev]);
    setSales((prev) => [newSale, ...prev]);

    logAudit(
      'BILL_CHECKOUT',
      'Sale',
      invoiceNumber,
      `Generated Invoice #${invoiceNumber} for ${customerName} - Total: ₹${finalGrandTotal} via ${paymentMethod}`
    );

    clearCart();
    return { success: true, sale: newSale };
  };

  // Bill hold and recall
  const holdCurrentCart = (notes?: string): boolean => {
    if (cart.length === 0) return false;
    const held: HeldBill = {
      id: `hb_${Date.now()}`,
      heldAt: new Date().toISOString(),
      customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone,
      items: [...cart],
      billDiscountPercent,
      notes,
    };
    setHeldBills((prev) => [held, ...prev]);
    clearCart();
    return true;
  };

  const recallHeldBill = (id: string) => {
    const bill = heldBills.find((b) => b.id === id);
    if (!bill) return;
    setCart(bill.items);
    setBillDiscountPercent(bill.billDiscountPercent);
    if (bill.customerPhone) {
      const cust = customers.find((c) => c.phone === bill.customerPhone);
      if (cust) setSelectedCustomer(cust);
    }
    setHeldBills((prev) => prev.filter((b) => b.id !== id));
  };

  const deleteHeldBill = (id: string) => {
    setHeldBills((prev) => prev.filter((b) => b.id !== id));
  };

  // Bill Cancel / Refund with authorization PIN
  const cancelOrRefundBill = (
    saleId: string,
    reason: string,
    pin: string,
    type: 'CANCELLED' | 'REFUNDED'
  ): { success: boolean; message: string } => {
    if (!verifyAdminOrManagerPin(pin)) {
      return { success: false, message: 'Invalid Admin/Manager authorization PIN.' };
    }

    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, message: 'Sale not found.' };

    if (sale.status !== 'COMPLETED') {
      return { success: false, message: `Sale is already ${sale.status.toLowerCase()}.` };
    }

    // Restore inventory
    const updatedProducts = products.map((prod) => {
      const itemsForProd = sale.items.filter((i) => i.productId === prod.id);
      if (itemsForProd.length === 0) return prod;

      const updatedVariants = prod.variants.map((v) => {
        const item = itemsForProd.find((i) => i.variantId === v.id);
        if (!item) return v;
        return {
          ...v,
          stock: v.stock + item.quantity,
        };
      });

      return {
        ...prod,
        variants: updatedVariants,
        totalStock: updatedVariants.reduce((s, v) => s + v.stock, 0),
        updatedAt: new Date().toISOString().split('T')[0],
      };
    });

    // Create stock return movements
    const movements: StockMovement[] = sale.items.map((item) => {
      const prod = updatedProducts.find((p) => p.id === item.productId);
      const variant = prod?.variants.find((v) => v.id === item.variantId);
      return {
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        type: 'RETURN',
        quantityChange: item.quantity,
        newStockLevel: variant?.stock ?? 0,
        referenceId: sale.invoiceNumber,
        reason: `${type}: ${reason}`,
        performedBy: currentUser.name,
        timestamp: new Date().toISOString(),
      };
    });

    // Update sale status
    const updatedSale: Sale = {
      ...sale,
      status: type,
      cancellationReason: reason,
      cancelledBy: currentUser.name,
      cancelledAt: new Date().toISOString(),
    };

    setProducts(updatedProducts);
    setStockMovements((prev) => [...movements, ...prev]);
    setSales((prev) => prev.map((s) => (s.id === saleId ? updatedSale : s)));

    // Revert customer loyalty points & totals if applicable
    if (sale.customerId) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.id !== sale.customerId) return c;
          return {
            ...c,
            totalPurchases: Math.max(0, c.totalPurchases - sale.grandTotal),
            totalOrders: Math.max(0, c.totalOrders - 1),
            loyaltyPoints: Math.max(0, c.loyaltyPoints - sale.loyaltyPointsEarned + sale.loyaltyPointsRedeemed),
          };
        })
      );
    }

    logAudit(
      `BILL_${type}`,
      'Sale',
      sale.invoiceNumber,
      `${type} Invoice #${sale.invoiceNumber}. Reason: ${reason}. Authorized by Manager/Admin.`
    );

    return { success: true, message: `Invoice #${sale.invoiceNumber} has been ${type.toLowerCase()} and stock restored.` };
  };

  // Customers
  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalPurchases' | 'totalOrders' | 'loyaltyPoints' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...customerData,
      id: `cust_${Date.now()}`,
      totalPurchases: 0,
      totalOrders: 0,
      loyaltyPoints: 0,
      dueBalance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers((prev) => [newCust, ...prev]);
    logAudit('CREATE_CUSTOMER', 'Customer', newCust.id, `Created customer ${newCust.name} (${newCust.phone})`);
    return newCust;
  };

  const updateCustomer = (updated: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    logAudit('UPDATE_CUSTOMER', 'Customer', updated.id, `Updated details for customer ${updated.name}`);
  };

  // Suppliers & Purchases
  const addSupplier = (supData: Omit<Supplier, 'id' | 'totalPurchases' | 'outstandingBalance'>) => {
    const newSup: Supplier = {
      ...supData,
      id: `sup_${Date.now()}`,
      totalPurchases: 0,
      outstandingBalance: 0,
    };
    setSuppliers((prev) => [...prev, newSup]);
    logAudit('CREATE_SUPPLIER', 'Supplier', newSup.id, `Added supplier ${newSup.name}`);
  };

  const updateSupplier = (updated: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    logAudit('UPDATE_SUPPLIER', 'Supplier', updated.id, `Updated supplier ${updated.name}`);
  };

  const addPurchase = (purchaseData: Omit<Purchase, 'id' | 'invoiceNumber'>) => {
    const invNumber = `PO-${Date.now().toString().slice(-6)}`;
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `po_${Date.now()}`,
      invoiceNumber: invNumber,
    };

    // Update product variant stocks
    const updatedProducts = products.map((prod) => {
      const itemsForProd = purchaseData.items.filter((i) => i.productId === prod.id);
      if (itemsForProd.length === 0) return prod;

      const updatedVariants = prod.variants.map((v) => {
        const item = itemsForProd.find((i) => i.variantId === v.id);
        if (!item) return v;
        return {
          ...v,
          stock: v.stock + item.quantity,
          purchasePrice: item.costPrice || v.purchasePrice,
        };
      });

      return {
        ...prod,
        variants: updatedVariants,
        totalStock: updatedVariants.reduce((s, v) => s + v.stock, 0),
        updatedAt: new Date().toISOString().split('T')[0],
      };
    });

    // Create stock movements for purchase
    const movements: StockMovement[] = purchaseData.items.map((item) => {
      const prod = updatedProducts.find((p) => p.id === item.productId);
      const variant = prod?.variants.find((v) => v.id === item.variantId);
      return {
        id: `sm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        productId: item.productId,
        productName: item.productName,
        variantId: item.variantId,
        size: item.size,
        color: item.color,
        type: 'PURCHASE',
        quantityChange: item.quantity,
        newStockLevel: variant?.stock ?? 0,
        referenceId: invNumber,
        performedBy: currentUser.name,
        timestamp: new Date().toISOString(),
      };
    });

    // Update supplier outstanding balance
    const unpaid = newPurchase.totalAmount - newPurchase.paidAmount;
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id !== newPurchase.supplierId) return s;
        return {
          ...s,
          totalPurchases: s.totalPurchases + newPurchase.totalAmount,
          outstandingBalance: s.outstandingBalance + unpaid,
        };
      })
    );

    setProducts(updatedProducts);
    setStockMovements((prev) => [...movements, ...prev]);
    setPurchases((prev) => [newPurchase, ...prev]);

    logAudit(
      'PURCHASE_ENTRY',
      'Purchase',
      invNumber,
      `Entered PO #${invNumber} from ${purchaseData.supplierName} - Total: ₹${purchaseData.totalAmount}`
    );
  };

  // Expenses
  const addExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExp: Expense = {
      ...expenseData,
      id: `exp_${Date.now()}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    logAudit('CREATE_EXPENSE', 'Expense', newExp.id, `Logged expense ₹${newExp.amount} for ${newExp.category} - ${newExp.description}`);
  };

  const deleteExpense = (id: string) => {
    const exp = expenses.find((e) => e.id === id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    logAudit('DELETE_EXPENSE', 'Expense', id, `Deleted expense: ${exp?.description || id}`);
  };

  // Settings & DB Management
  const updateSettings = (newSettings: Partial<ShopSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      logAudit('UPDATE_SETTINGS', 'Settings', 'shop_settings', 'Updated shop configurations');
      return updated;
    });
  };

  const resetAllData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setCustomers(INITIAL_CUSTOMERS);
    setSuppliers(INITIAL_SUPPLIERS);
    setPurchases([]);
    setExpenses(INITIAL_EXPENSES);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setSettings(INITIAL_SETTINGS);
    setCart([]);
    setHeldBills([]);
    logAudit('RESET_DATABASE', 'System', 'ALL', 'Restored system to factory initial menswear demo data.');
  };

  const exportDatabaseJSON = (): string => {
    const dump = {
      exportedAt: new Date().toISOString(),
      shop: settings.shopName,
      products,
      sales,
      customers,
      suppliers,
      purchases,
      expenses,
      stockMovements,
      auditLogs,
      users,
      settings,
    };
    return JSON.stringify(dump, null, 2);
  };

  const importDatabaseJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products) setProducts(parsed.products);
      if (parsed.sales) setSales(parsed.sales);
      if (parsed.customers) setCustomers(parsed.customers);
      if (parsed.suppliers) setSuppliers(parsed.suppliers);
      if (parsed.purchases) setPurchases(parsed.purchases);
      if (parsed.expenses) setExpenses(parsed.expenses);
      if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
      if (parsed.users) setUsers(parsed.users);
      if (parsed.settings) setSettings(parsed.settings);
      logAudit('IMPORT_DATABASE', 'System', 'JSON_BACKUP', 'Successfully imported database from backup file.');
      return true;
    } catch (e) {
      console.error('Failed to parse backup JSON:', e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        switchUser,
        addUser,
        updateUser,
        verifyAdminOrManagerPin,

        products,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustStock,

        cart,
        addToCart,
        updateCartItemQty,
        updateCartItemDiscount,
        removeFromCart,
        clearCart,
        selectedCustomer,
        setSelectedCustomer,
        billDiscountPercent,
        setBillDiscountPercent,
        cartTotals,
        completeCheckout,

        heldBills,
        holdCurrentCart,
        recallHeldBill,
        deleteHeldBill,

        sales,
        cancelOrRefundBill,

        customers,
        addCustomer,
        updateCustomer,

        suppliers,
        addSupplier,
        updateSupplier,
        purchases,
        addPurchase,

        expenses,
        addExpense,
        deleteExpense,

        stockMovements,
        auditLogs,

        settings,
        updateSettings,
        resetAllData,
        exportDatabaseJSON,
        importDatabaseJSON,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
