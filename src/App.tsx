/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Sidebar, NavTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { ProductsView } from './components/ProductsView';
import { InventoryView } from './components/InventoryView';
import { PurchasesView } from './components/PurchasesView';
import { ExpensesView } from './components/ExpensesView';
import { ReportsView } from './components/ReportsView';
import { PurchaseReportsView } from './components/PurchaseReportsView';
import { SettingsView } from './components/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { useToast } from './contexts/ToastContext';

// SAYURKU v2.0 Components
import { CustomerStorefront } from './components/CustomerStorefront';
import { CustomerCartAndCheckoutModal } from './components/CustomerCartAndCheckoutModal';
import { CustomerOrderTracking } from './components/CustomerOrderTracking';
import { SellerOrdersView } from './components/SellerOrdersView';
import { SellerPaymentsView } from './components/SellerPaymentsView';
import { DeliveryManagementView } from './components/DeliveryManagementView';

import { 
  Product, 
  Sale, 
  InventoryMovement, 
  Purchase, 
  Expense, 
  Supplier, 
  Order, 
  CartItem, 
  DeliveryRateConfig 
} from './types';
import { productService } from './services/productService';
import { salesService } from './services/salesService';
import { inventoryService } from './services/inventoryService';
import { purchaseService } from './services/purchaseService';
import { expenseService } from './services/expenseService';
import { supplierService, categoryService } from './services/supplierService';
import { orderService } from './services/orderService';
import { deliveryService, defaultDeliveryConfig } from './services/deliveryService';
import { seedInitialVegetableData } from './services/seedData';
import { Loader2 } from 'lucide-react';

const defaultCategories = [
  'Sayuran Daun',
  'Sayuran Umbi & Buah',
  'Bumbu & Rempah',
  'Paket Bundling Sayur'
];

function SayurkuApp() {
  const { user, loading: authLoading, businessId, storeProfile } = useAuth();
  const { toast } = useToast();
  
  // App Mode: 'CUSTOMER' (Online Storefront) or 'SELLER' (Management Dashboard)
  const [appMode, setAppMode] = useState<'CUSTOMER' | 'SELLER'>('CUSTOMER');
  
  // Customer View State: 'STORE' | 'TRACKING'
  const [customerView, setCustomerView] = useState<'STORE' | 'TRACKING'>('STORE');
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);

  // Seller Tab State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [deliveryConfig, setDeliveryConfig] = useState<DeliveryRateConfig>(defaultDeliveryConfig);
  
  // Orders State (Real-time synced)
  const [storeOrders, setStoreOrders] = useState<Order[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  // Customer Shopping Cart
  const [customerCart, setCustomerCart] = useState<CartItem[]>([]);
  const [isCustomerCheckoutOpen, setIsCustomerCheckoutOpen] = useState<boolean>(false);

  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);

  // Active receipt for modal
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // Customer unique identifier for addresses and order tracking
  const customerId = user ? user.uid : 'cust_guest';

  // Fetch business records
  const loadData = useCallback(async () => {
    if (!businessId) return;
    try {
      const [
        prods,
        sls,
        movs,
        prchs,
        exps,
        sups,
        cats,
        delivCfg
      ] = await Promise.all([
        productService.getProducts(businessId),
        salesService.getSales(businessId),
        inventoryService.getMovements(businessId),
        purchaseService.getPurchases(businessId),
        expenseService.getExpenses(businessId),
        supplierService.getSuppliers(businessId),
        categoryService.getCategories(businessId),
        deliveryService.getDeliveryConfig(businessId)
      ]);

      setProducts(prods || []);
      setSales(sls || []);
      setMovements(movs || []);
      setPurchases(prchs || []);
      setExpenses(exps || []);
      setSuppliers(sups || []);
      setDeliveryConfig(delivCfg || defaultDeliveryConfig);
      
      const catNames = cats && cats.length > 0 ? cats.map(c => c.name) : [];
      setCustomCategories(catNames);
    } catch (err) {
      console.warn('Gagal memuat catatan bisnis:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [businessId]);

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, loadData]);

  // Real-time listener for store orders (Seller view)
  useEffect(() => {
    if (!businessId) return;
    const unsubStore = orderService.subscribeStoreOrders(businessId, (orders) => {
      setStoreOrders(orders);
    });
    return () => unsubStore();
  }, [businessId]);

  // Real-time listener for customer orders (Customer tracking view)
  useEffect(() => {
    if (!customerId) return;
    const unsubCust = orderService.subscribeCustomerOrders(customerId, (orders) => {
      setCustomerOrders(orders);
    });
    return () => unsubCust();
  }, [customerId]);

  // Combined categories
  const allCategories = useMemo(() => {
    const set = new Set([...defaultCategories, ...customCategories]);
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [customCategories, products]);

  // Low stock counter for sidebar badge
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.isActive && p.type === 'SINGLE' && p.currentStock <= p.minStock).length;
  }, [products]);

  // New unhandled online orders counter for seller badge
  const newOrdersCount = useMemo(() => {
    return storeOrders.filter(o => o.orderStatus === 'ORDER_RECEIVED' || o.paymentStatus === 'PENDING').length;
  }, [storeOrders]);

  // Active customer orders count
  const activeCustomerOrdersCount = useMemo(() => {
    return customerOrders.filter(o => o.orderStatus !== 'DELIVERED' && o.orderStatus !== 'CANCELLED').length;
  }, [customerOrders]);

  // Seed demo data handler
  const handleSeedData = async () => {
    if (!businessId) return;
    setIsSeeding(true);
    try {
      await seedInitialVegetableData(businessId, user?.uid || 'user');
      await loadData();
    } catch (err: any) {
      toast('Gagal memuat data contoh: ' + err.message, 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Customer Cart Handlers
  const handleAddToCart = (product: Product) => {
    const existingIndex = customerCart.findIndex(it => it.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...customerCart];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        subtotal: newQty * product.sellingPrice
      };
      setCustomerCart(updated);
    } else {
      setCustomerCart([
        ...customerCart,
        {
          product,
          quantity: 1,
          unit: product.baseUnit,
          sellingPrice: product.sellingPrice,
          costPrice: product.purchaseCost,
          subtotal: product.sellingPrice,
          discount: 0
        }
      ]);
    }
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(index);
      return;
    }
    const updated = [...customerCart];
    const it = updated[index];
    updated[index] = {
      ...it,
      quantity: Number(newQty.toFixed(2)),
      subtotal: Math.round(newQty * it.sellingPrice)
    };
    setCustomerCart(updated);
  };

  const handleRemoveCartItem = (index: number) => {
    setCustomerCart(customerCart.filter((_, i) => i !== index));
  };

  // Handle POS Sale Completed
  const handleSaleCompleted = (newSale: Sale) => {
    setSales(prev => [newSale, ...prev]);
    loadData();
  };

  if (authLoading || (isLoadingData && products.length === 0 && sales.length === 0)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
        <h1 className="text-xl font-bold tracking-tight">SAYURKU v2.0</h1>
        <p className="text-xs text-emerald-300 mt-1">Memuat sistem belanja sayur online & manajemen kios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* SELLER MODE SIDEBAR (Rendered only when in Seller Mode) */}
      {appMode === 'SELLER' && (
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          lowStockCount={lowStockCount}
          newOrdersCount={newOrdersCount}
          onSwitchToCustomerView={() => setAppMode('CUSTOMER')}
        />
      )}

      {/* Main Container */}
      <div className={`flex-1 flex flex-col min-h-screen ${appMode === 'SELLER' ? 'lg:pl-64' : ''}`}>
        {/* Top Navbar */}
        <Navbar
          currentTab={currentTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigateTab={(tab) => setCurrentTab(tab)}
          appMode={appMode}
          onToggleAppMode={(mode) => setAppMode(mode)}
          cartCount={customerCart.length}
          onOpenCart={() => setIsCustomerCheckoutOpen(true)}
        />

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* ============================================================== */}
          {/* INTERFACE 1: CUSTOMER APPLICATION (Belanja Sayur Online)       */}
          {/* ============================================================== */}
          {appMode === 'CUSTOMER' && (
            <>
              {customerView === 'STORE' ? (
                <CustomerStorefront
                  products={products}
                  categories={allCategories}
                  cart={customerCart}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onOpenCheckout={() => setIsCustomerCheckoutOpen(true)}
                  onOpenTracking={() => setCustomerView('TRACKING')}
                  ordersCount={customerOrders.length}
                  activeOrdersCount={activeCustomerOrdersCount}
                  storeProfile={storeProfile}
                  deliveryConfig={deliveryConfig}
                />
              ) : (
                <CustomerOrderTracking
                  orders={customerOrders}
                  activeOrderId={trackingOrderId}
                  onSelectOrder={(id) => setTrackingOrderId(id)}
                  onBackToShopping={() => setCustomerView('STORE')}
                />
              )}

              {/* Customer Checkout Modal */}
              {isCustomerCheckoutOpen && (
                <CustomerCartAndCheckoutModal
                  cart={customerCart}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onRemoveItem={handleRemoveCartItem}
                  onClearCart={() => setCustomerCart([])}
                  onClose={() => setIsCustomerCheckoutOpen(false)}
                  deliveryConfig={deliveryConfig}
                  storeProfile={storeProfile}
                  onOrderSuccess={(order) => {
                    setIsCustomerCheckoutOpen(false);
                    setTrackingOrderId(order.id);
                    setCustomerView('TRACKING');
                  }}
                />
              )}
            </>
          )}

          {/* ============================================================== */}
          {/* INTERFACE 2: SELLER MANAGEMENT DASHBOARD                       */}
          {/* ============================================================== */}
          {appMode === 'SELLER' && (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  products={products}
                  sales={sales}
                  expenses={expenses}
                  onNavigate={(tab) => setCurrentTab(tab)}
                  onSeedData={handleSeedData}
                  isSeeding={isSeeding}
                />
              )}

              {/* NEW V2.0: Online Orders Management */}
              {currentTab === 'online_orders' && (
                <SellerOrdersView
                  orders={storeOrders}
                  onRefresh={loadData}
                />
              )}

              {currentTab === 'pos' && (
                <PosView
                  products={products}
                  categories={allCategories}
                  onSaleCompleted={handleSaleCompleted}
                  onOpenReceipt={(sale) => setActiveReceiptSale(sale)}
                />
              )}

              {currentTab === 'products' && (
                <ProductsView
                  products={products}
                  categories={allCategories}
                  onRefresh={loadData}
                />
              )}

              {currentTab === 'inventory' && (
                <InventoryView
                  products={products}
                  movements={movements}
                  onRefresh={loadData}
                />
              )}

              {currentTab === 'purchases' && (
                <PurchasesView
                  purchases={purchases}
                  products={products}
                  suppliers={suppliers}
                  onRefresh={loadData}
                />
              )}

              {currentTab === 'purchase_reports' && (
                <PurchaseReportsView
                  purchases={purchases}
                  suppliers={suppliers}
                  onRefresh={loadData}
                />
              )}

              {currentTab === 'expenses' && (
                <ExpensesView
                  expenses={expenses}
                  onRefresh={loadData}
                />
              )}

              {/* NEW V2.0: Payments Management */}
              {currentTab === 'payments' && (
                <SellerPaymentsView
                  orders={storeOrders}
                  onRefresh={loadData}
                />
              )}

              {/* NEW V2.0: Delivery & Courier Management */}
              {currentTab === 'delivery' && (
                <DeliveryManagementView
                  deliveryConfig={deliveryConfig}
                  orders={storeOrders}
                  onRefreshConfig={loadData}
                />
              )}

              {currentTab === 'reports' && (
                <ReportsView
                  sales={sales}
                  expenses={expenses}
                  products={products}
                  onOpenReceipt={(sale) => setActiveReceiptSale(sale)}
                  onRefresh={loadData}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsView
                  suppliers={suppliers}
                  categories={allCategories}
                  onRefresh={loadData}
                  onSeedData={handleSeedData}
                  isSeeding={isSeeding}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        sale={activeReceiptSale}
        storeProfile={storeProfile}
        onClose={() => setActiveReceiptSale(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SayurkuApp />
    </AuthProvider>
  );
}
