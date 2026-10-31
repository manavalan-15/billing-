export type Role = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  username: string;
  role: Role;
  pin: string; // 4-digit PIN for quick cashier/manager authorization
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

export type Category = 
  | 'Shirts'
  | 'T-Shirts'
  | 'Jeans'
  | 'Formal Pants'
  | 'Casual Pants'
  | 'Trousers'
  | 'Shorts'
  | 'Innerwear'
  | 'Jackets'
  | 'Blazers'
  | 'Accessories';

export const CATEGORIES: Category[] = [
  'Shirts',
  'T-Shirts',
  'Jeans',
  'Formal Pants',
  'Casual Pants',
  'Trousers',
  'Shorts',
  'Innerwear',
  'Jackets',
  'Blazers',
  'Accessories'
];

export const STANDARD_SIZES = [
  'S', 'M', 'L', 'XL', 'XXL', '3XL',
  '28', '30', '32', '34', '36', '38', '40', '42'
] as const;

export type StandardSize = typeof STANDARD_SIZES[number] | string;

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex?: string;
  stock: number;
  lowStockThreshold: number;
  barcode: string;
  sku: string;
  purchasePrice?: number;
  sellingPrice?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: Category;
  brand: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  gstRate: number; // e.g. 5, 12, 18 %
  supplierId: string;
  supplierName: string;
  description?: string;
  imageUrl?: string;
  variants: ProductVariant[];
  totalStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  cartItemId: string; // unique item id in cart
  productId: string;
  productName: string;
  category: Category;
  brand: string;
  variantId: string;
  size: string;
  color: string;
  barcode: string;
  sku: string;
  purchasePrice: number;
  unitPrice: number; // selling price
  mrp: number;
  quantity: number;
  maxStock: number;
  itemDiscountPercent: number;
  gstRate: number;
  taxableAmount: number;
  gstAmount: number;
  totalAmount: number;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Split';

export interface SplitPaymentDetail {
  cash: number;
  upi: number;
  card: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string; // ISO
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  subtotal: number;
  itemDiscountTotal: number;
  billDiscountPercent: number;
  billDiscountAmount: number;
  totalGst: number;
  taxableTotal: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  splitDetails?: SplitPaymentDetail;
  amountReceived: number;
  changeReturned: number;
  status: 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  loyaltyDiscountAmount: number;
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  totalOrders: number;
  dueBalance: number;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin?: string;
  totalPurchases: number;
  outstandingBalance: number;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  color: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING';
  notes?: string;
}

export type ExpenseCategory = 
  | 'Shop Rent'
  | 'Electricity Bill'
  | 'Employee Salary'
  | 'Transport'
  | 'Maintenance'
  | 'Packaging & Bags'
  | 'Marketing'
  | 'Other Expenses';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  paymentMode: 'Cash' | 'Bank Transfer' | 'UPI';
  paidTo: string;
  approvedBy: string;
}

export type MovementType = 'SALE' | 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  color: string;
  type: MovementType;
  quantityChange: number; // negative for sale/damage, positive for purchase/return
  newStockLevel: number;
  referenceId: string; // invoice or PO number
  reason?: string;
  performedBy: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  userId: string;
  userName: string;
  timestamp: string;
}

export interface ShopSettings {
  shopName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  phone: string;
  email: string;
  invoicePrefix: string;
  thermalWidth: '58mm' | '80mm';
  taxInclusive: boolean;
  defaultGstRate: number;
  receiptFooter: string;
  loyaltyEarnRate: number; // e.g. 1 point per 100 spent
  loyaltyRedeemValue: number; // e.g. 1 point = 1 rupee
  enableBarcodeScanner: boolean;
  currencySymbol: string;
}

export interface HeldBill {
  id: string;
  heldAt: string;
  customerName: string;
  customerPhone?: string;
  items: CartItem[];
  billDiscountPercent: number;
  notes?: string;
}
