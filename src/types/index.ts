export type ProductType = 'SINGLE' | 'BUNDLE';

export interface BundleComponent {
  productId: string;
  productName: string;
  quantity: number; // e.g. 2 pieces or 0.25 kg
  unit: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  category: string;
  type: ProductType;
  baseUnit: string; // Ikat, Buah, Kg, Gram, Ons, Pack, dll
  sellingUnit?: string;
  unitConversion?: number | {
    factor: number; // e.g. 1 Ikat = 250 Gram -> factor = 250
    description?: string;
  };
  purchaseCost: number; // HPP per unit
  sellingPrice: number; // Harga jual
  currentStock: number; // For SINGLE items. For BUNDLE, calculated dynamically based on components
  minStock: number; // Minimum stock alert threshold
  description?: string;
  imageUrl?: string;
  imagePath?: string;
  imageAlt?: string;
  imageUpdatedAt?: string;
  isActive: boolean;
  bundleItems?: BundleComponent[]; // recipe if type === 'BUNDLE'
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  subtotal: number;
  discount: number;
}

export type PaymentMethod = 'CASH' | 'TRANSFER';
export type SaleStatus = 'COMPLETED' | 'CANCELLED';

export interface SaleItemSnapshot {
  productId: string;
  productName: string;
  type: ProductType;
  quantity: number;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  subtotal: number;
  discount: number;
  bundleComponents?: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
  }[];
}

export interface Sale {
  id: string;
  businessId: string;
  receiptNumber: string; // e.g. PJ-261108-0001
  items: SaleItemSnapshot[];
  subtotal: number;
  discount: number;
  finalTotal: number;
  totalCost: number; // HPP
  grossProfit: number; // finalTotal - totalCost
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  change: number;
  status: SaleStatus;
  cashierUid: string;
  cashierName?: string;
  customerName?: string;
  notes?: string;
  createdAt: string;
  date: string; // YYYY-MM-DD
  cancelledAt?: string;
  cancelReason?: string;
}

export type MovementType = 
  | 'STOCK_IN' 
  | 'STOCK_OUT' 
  | 'BUNDLE_OUT' 
  | 'WASTE' 
  | 'ADJUSTMENT' 
  | 'SALE_REVERSAL';

export interface InventoryMovement {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  unit: string;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  reason: string;
  userId: string;
  createdAt: string;
  date: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  categoryName?: string;
  quantity: number;
  unit: string;
  costPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  purchaseNumber: string;
  invoiceNumber?: string;
  supplierId?: string;
  supplierName: string;
  date: string;
  items: PurchaseItem[];
  subtotal?: number;
  discount?: number;
  shippingCost?: number;
  totalAmount: number; // or totalPurchase
  purchaseCategory?: string; // e.g. 'Sayuran Daun', 'Sayuran Umbi dan Buah', 'Campuran'
  paymentStatus?: 'PAID' | 'UNPAID' | 'PENDING' | 'PARTIAL';
  paymentMethod?: 'TRANSFER' | 'CASH' | 'TEMPO';
  notes?: string;
  status: 'RECEIVED';
  isDemo?: boolean; // Marks clearly labeled DEMO DATA
  createdAt: string;
}

export type ExpenseCategory = 
  | 'Transportasi' 
  | 'Kemasan / Plastik' 
  | 'Retribusi Pasar' 
  | 'Listrik & Air' 
  | 'Gaji / Upah'
  | 'Lain-lain';

export interface Expense {
  id: string;
  businessId: string;
  expenseNumber: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  description: string;
  userId: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPerson?: string;
  phone: string;
  address?: string;
  supplierCategory?: string; // e.g. 'Petani Langsung', 'Grosir Pasar Induk', 'Distributor Bumbu'
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  icon?: string;
  createdAt: string;
}

export interface StoreProfile {
  storeName: string;
  ownerName: string;
  phone: string;
  address: string;
  footerNote: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  qrisPayload?: string;
}

// ==========================================
// SAYURKU VERSION 2.0 EXTENSIONS
// ONLINE ORDERING, PAYMENT & DELIVERY TYPES
// ==========================================

export type OrderStatus =
  | 'ORDER_RECEIVED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ON_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'DELIVERY_FAILED'
  | 'RETURNED';

export type OrderPaymentStatus =
  | 'UNPAID'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'CANCELLED';

export type OrderPaymentMethod = 'TRANSFER' | 'QRIS' | 'COD';

export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string; // 'Rumah', 'Kantor', 'Warung', dll
  recipientName: string;
  phone: string;
  addressDetails: string;
  latitude: number;
  longitude: number;
  notes?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface DistanceTier {
  minKm: number;
  maxKm: number;
  fee: number;
  requiresManualConfirmation?: boolean;
}

export interface DeliveryRateConfig {
  id: string;
  businessId: string;
  storeLatitude: number;
  storeLongitude: number;
  storeAddress: string;
  maxRadiusKm: number;
  freeShippingMinAmount: number;
  rates: DistanceTier[];
}

export interface CourierInfo {
  name: string;
  phone: string;
  vehicle?: string;
  assignedAt?: string;
  pickupTime?: string;
  deliveryStartTime?: string;
  deliveredTime?: string;
  notes?: string;
}

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  type: ProductType;
  quantity: number;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  subtotal: number;
  discount: number;
  bundleComponents?: {
    productId: string;
    productName: string;
    quantity: number;
    unit: string;
  }[];
}

export interface Order {
  id: string;
  businessId: string;
  orderNumber: string; // ORD-YYMMDD-XXXX
  customerId: string;
  customerName: string;
  customerPhone: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  totalPayment: number;
  totalCost: number; // For seller profit reporting
  deliveryAddress: CustomerAddress;
  distanceKm: number;
  distanceMethod: 'ROAD' | 'HAVERSINE';
  paymentMethod: OrderPaymentMethod;
  paymentStatus: OrderPaymentStatus;
  orderStatus: OrderStatus;
  paymentProofUrl?: string; // Uploaded payment receipt image/data
  paymentVerifiedAt?: string;
  paymentVerifiedBy?: string;
  qrisReferenceId?: string;
  courier?: CourierInfo;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
  date: string;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  previousStatus?: OrderStatus;
  newStatus: OrderStatus;
  description: string;
  updatedBy: string;
  timestamp: string;
}
