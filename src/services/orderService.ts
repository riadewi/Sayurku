import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  runTransaction,
  onSnapshot,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Order, 
  OrderStatus, 
  OrderPaymentStatus, 
  OrderPaymentMethod, 
  CartItem, 
  CustomerAddress, 
  OrderStatusHistory, 
  Product, 
  InventoryMovement,
  CourierInfo,
  OrderItemSnapshot
} from '../types';
import { generateOrderNumber } from '../lib/utils';

export const orderService = {
  /**
   * Real-time subscription to orders for a business/seller
   */
  subscribeStoreOrders(businessId: string, onUpdate: (orders: Order[]) => void) {
    const q = query(
      collection(db, 'orders'),
      where('businessId', '==', businessId),
      orderBy('createdAt', 'desc'),
      limit(200)
    );

    return onSnapshot(q, (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach(docSnap => {
        orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      onUpdate(orders);
    }, (error) => {
      console.warn('Error subscribing to store orders:', error);
    });
  },

  /**
   * Real-time subscription to orders for a specific customer
   */
  subscribeCustomerOrders(customerId: string, onUpdate: (orders: Order[]) => void) {
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach(docSnap => {
        orders.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      onUpdate(orders);
    }, (error) => {
      console.warn('Error subscribing to customer orders:', error);
    });
  },

  /**
   * Real-time subscription to a single order by ID
   */
  subscribeOrderById(orderId: string, onUpdate: (order: Order | null) => void) {
    const orderRef = doc(db, 'orders', orderId);
    return onSnapshot(orderRef, (docSnap) => {
      if (docSnap.exists()) {
        onUpdate({ id: docSnap.id, ...docSnap.data() } as Order);
      } else {
        onUpdate(null);
      }
    }, (error) => {
      console.warn(`Error subscribing to order ${orderId}:`, error);
    });
  },

  /**
   * Fetch order status transition history
   */
  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    try {
      const q = query(
        collection(db, 'order_status_history'),
        where('orderId', '==', orderId)
      );
      const snapshot = await getDocs(q);
      const history: OrderStatusHistory[] = [];
      snapshot.forEach(docSnap => {
        history.push({ id: docSnap.id, ...docSnap.data() } as OrderStatusHistory);
      });
      return history.sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));
    } catch (error) {
      console.warn('Error fetching order status history:', error);
      return [];
    }
  },

  /**
   * ATOMIC ORDER SUBMISSION:
   * 1. Validates stock for all single and bundle products.
   * 2. Reserves / deducts stock atomically to prevent race conditions.
   * 3. Records inventory movements with reference to the new order.
   * 4. Creates order record and initial status history.
   */
  async placeOrder(params: {
    businessId: string;
    customerId: string;
    customerName: string;
    customerPhone: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    totalPayment: number;
    deliveryAddress: CustomerAddress;
    distanceKm: number;
    paymentMethod: OrderPaymentMethod;
    paymentProofUrl?: string;
    notes?: string;
  }): Promise<Order> {
    const {
      businessId,
      customerId,
      customerName,
      customerPhone,
      items,
      subtotal,
      discount,
      shippingFee,
      totalPayment,
      deliveryAddress,
      distanceKm,
      paymentMethod,
      paymentProofUrl,
      notes
    } = params;

    if (!items || items.length === 0) {
      throw new Error('Keranjang pesanan masih kosong.');
    }

    const orderRef = doc(collection(db, 'orders'));
    const orderNumber = generateOrderNumber();
    const nowIso = new Date().toISOString();
    const dateStr = nowIso.split('T')[0];

    try {
      return await runTransaction(db, async (transaction) => {
        // Collect product deductions
        const requiredDeductions: Map<string, {
          productId: string;
          deductQty: number;
          reason: string;
          movementType: 'STOCK_OUT' | 'BUNDLE_OUT';
          bundleName?: string;
        }> = new Map();

        const orderItemSnapshots: OrderItemSnapshot[] = [];
        let calculatedTotalCost = 0;

        for (const cartItem of items) {
          const p = cartItem.product;

          if (p.type === 'SINGLE') {
            calculatedTotalCost += (p.purchaseCost || 0) * cartItem.quantity;

            const existing = requiredDeductions.get(p.id);
            if (existing) {
              existing.deductQty += cartItem.quantity;
            } else {
              requiredDeductions.set(p.id, {
                productId: p.id,
                deductQty: cartItem.quantity,
                reason: `Pesanan Online #${orderNumber}`,
                movementType: 'STOCK_OUT'
              });
            }

            orderItemSnapshots.push({
              productId: p.id,
              productName: p.name,
              type: 'SINGLE',
              quantity: cartItem.quantity,
              unit: cartItem.unit || p.baseUnit,
              sellingPrice: cartItem.sellingPrice,
              costPrice: p.purchaseCost || 0,
              subtotal: cartItem.subtotal,
              discount: cartItem.discount || 0
            });
          } else if (p.type === 'BUNDLE') {
            const components = p.bundleItems || [];
            if (components.length === 0) {
              throw new Error(`Paket bundling "${p.name}" belum memiliki komposisi bahan.`);
            }

            for (const comp of components) {
              const compDeductQty = comp.quantity * cartItem.quantity;
              const existing = requiredDeductions.get(comp.productId);
              if (existing) {
                existing.deductQty += compDeductQty;
              } else {
                requiredDeductions.set(comp.productId, {
                  productId: comp.productId,
                  deductQty: compDeductQty,
                  reason: `Komponen Paket ${p.name} (x${cartItem.quantity}) #${orderNumber}`,
                  movementType: 'BUNDLE_OUT',
                  bundleName: p.name
                });
              }
            }

            orderItemSnapshots.push({
              productId: p.id,
              productName: p.name,
              type: 'BUNDLE',
              quantity: cartItem.quantity,
              unit: cartItem.unit || p.baseUnit || 'Paket',
              sellingPrice: cartItem.sellingPrice,
              costPrice: p.purchaseCost || 0,
              subtotal: cartItem.subtotal,
              discount: cartItem.discount || 0,
              bundleComponents: components.map(c => ({
                productId: c.productId,
                productName: c.productName,
                quantity: c.quantity * cartItem.quantity,
                unit: c.unit
              }))
            });
          }
        }

        // Fetch products in transaction to validate stock
        const productSnaps: Map<string, Product> = new Map();
        for (const [prodId] of requiredDeductions) {
          const prodRef = doc(db, 'products', prodId);
          const pSnap = await transaction.get(prodRef);
          if (!pSnap.exists()) {
            throw new Error(`Sayuran tidak ditemukan di database (ID: ${prodId}).`);
          }
          productSnaps.set(prodId, pSnap.data() as Product);
        }

        // Validate stock levels
        for (const [prodId, req] of requiredDeductions) {
          const product = productSnaps.get(prodId)!;
          const currentStock = Number(product.currentStock || 0);

          if (currentStock < req.deductQty) {
            const context = req.bundleName ? ` (untuk ${req.bundleName})` : '';
            throw new Error(
              `Stok "${product.name}"${context} tidak mencukupi! Tersedia: ${currentStock} ${product.baseUnit}, dipesan: ${req.deductQty} ${product.baseUnit}.`
            );
          }
        }

        // Deduct inventory and write audit movements
        for (const [prodId, req] of requiredDeductions) {
          const product = productSnaps.get(prodId)!;
          const prevStock = Number(product.currentStock || 0);
          const newStock = Number((prevStock - req.deductQty).toFixed(2));

          const prodRef = doc(db, 'products', prodId);
          transaction.update(prodRef, {
            currentStock: newStock,
            updatedAt: nowIso
          });

          const movRef = doc(collection(db, 'inventory_movements'));
          const movement: InventoryMovement = {
            id: movRef.id,
            businessId,
            productId: prodId,
            productName: product.name,
            type: req.movementType,
            quantity: -req.deductQty,
            unit: product.baseUnit,
            previousStock: prevStock,
            newStock,
            referenceId: orderRef.id,
            reason: req.reason,
            userId: customerId,
            createdAt: nowIso,
            date: dateStr
          };
          transaction.set(movRef, movement);
        }

        // Initial payment status
        let initialPaymentStatus: OrderPaymentStatus = 'UNPAID';
        if (paymentMethod === 'TRANSFER') {
          initialPaymentStatus = paymentProofUrl ? 'PENDING' : 'UNPAID';
        } else if (paymentMethod === 'QRIS') {
          initialPaymentStatus = 'PENDING';
        } else if (paymentMethod === 'COD') {
          initialPaymentStatus = 'UNPAID';
        }

        const newOrder: Order = {
          id: orderRef.id,
          businessId,
          orderNumber,
          customerId,
          customerName,
          customerPhone,
          items: orderItemSnapshots,
          subtotal,
          discount: discount || 0,
          shippingFee,
          totalPayment,
          totalCost: calculatedTotalCost,
          deliveryAddress,
          distanceKm,
          distanceMethod: 'HAVERSINE',
          paymentMethod,
          paymentStatus: initialPaymentStatus,
          orderStatus: 'ORDER_RECEIVED',
          paymentProofUrl: paymentProofUrl || '',
          notes: notes || '',
          createdAt: nowIso,
          updatedAt: nowIso,
          date: dateStr
        };

        transaction.set(orderRef, newOrder);

        // Record initial status history
        const historyRef = doc(collection(db, 'order_status_history'));
        const historyEntry: OrderStatusHistory = {
          id: historyRef.id,
          orderId: orderRef.id,
          newStatus: 'ORDER_RECEIVED',
          description: 'Pesanan baru berhasil dibuat oleh pelanggan.',
          updatedBy: customerName || 'Pelanggan',
          timestamp: nowIso
        };
        transaction.set(historyRef, historyEntry);

        return newOrder;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'orders');
    }
  },

  /**
   * UPDATE ORDER STATUS with status transition validation,
   * audit history recording, and automatic inventory restoration if cancelled.
   */
  async updateOrderStatus(params: {
    orderId: string;
    newStatus: OrderStatus;
    updatedBy: string;
    description: string;
    cancelReason?: string;
  }): Promise<void> {
    const { orderId, newStatus, updatedBy, description, cancelReason } = params;

    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await transaction.get(orderRef);

        if (!orderSnap.exists()) {
          throw new Error('Pesanan tidak ditemukan.');
        }

        const order = orderSnap.data() as Order;
        const previousStatus = order.orderStatus;

        if (previousStatus === 'CANCELLED' && newStatus !== 'CANCELLED') {
          throw new Error('Pesanan yang sudah dibatalkan tidak dapat diaktifkan kembali.');
        }

        if (previousStatus === 'DELIVERED' && newStatus !== 'DELIVERED' && newStatus !== 'RETURNED') {
          throw new Error('Pesanan yang sudah sampai / selesai tidak dapat diubah statusnya.');
        }

        const nowIso = new Date().toISOString();
        const dateStr = nowIso.split('T')[0];

        // If cancelling, restore previously deducted inventory!
        if (newStatus === 'CANCELLED' && previousStatus !== 'CANCELLED') {
          for (const item of order.items) {
            if (item.type === 'SINGLE') {
              const prodRef = doc(db, 'products', item.productId);
              const pSnap = await transaction.get(prodRef);
              if (pSnap.exists()) {
                const p = pSnap.data() as Product;
                const prevStock = Number(p.currentStock || 0);
                const newStock = Number((prevStock + item.quantity).toFixed(2));

                transaction.update(prodRef, {
                  currentStock: newStock,
                  updatedAt: nowIso
                });

                const movRef = doc(collection(db, 'inventory_movements'));
                const movement: InventoryMovement = {
                  id: movRef.id,
                  businessId: order.businessId,
                  productId: item.productId,
                  productName: item.productName,
                  type: 'SALE_REVERSAL',
                  quantity: item.quantity,
                  unit: item.unit,
                  previousStock: prevStock,
                  newStock,
                  referenceId: order.id,
                  reason: `Pengembalian stok pembatalan pesanan online #${order.orderNumber}: ${cancelReason || description}`,
                  userId: updatedBy,
                  createdAt: nowIso,
                  date: dateStr
                };
                transaction.set(movRef, movement);
              }
            } else if (item.type === 'BUNDLE' && item.bundleComponents) {
              for (const comp of item.bundleComponents) {
                const prodRef = doc(db, 'products', comp.productId);
                const pSnap = await transaction.get(prodRef);
                if (pSnap.exists()) {
                  const p = pSnap.data() as Product;
                  const prevStock = Number(p.currentStock || 0);
                  const newStock = Number((prevStock + comp.quantity).toFixed(2));

                  transaction.update(prodRef, {
                    currentStock: newStock,
                    updatedAt: nowIso
                  });

                  const movRef = doc(collection(db, 'inventory_movements'));
                  const movement: InventoryMovement = {
                    id: movRef.id,
                    businessId: order.businessId,
                    productId: comp.productId,
                    productName: comp.productName,
                    type: 'SALE_REVERSAL',
                    quantity: comp.quantity,
                    unit: comp.unit,
                    previousStock: prevStock,
                    newStock,
                    referenceId: order.id,
                    reason: `Pengembalian bahan paket ${item.productName} pesanan #${order.orderNumber}`,
                    userId: updatedBy,
                    createdAt: nowIso,
                    date: dateStr
                  };
                  transaction.set(movRef, movement);
                }
              }
            }
          }
        }

        // Update order
        const updates: Partial<Order> = {
          orderStatus: newStatus,
          updatedAt: nowIso
        };

        if (newStatus === 'CANCELLED') {
          updates.cancelReason = cancelReason || description;
          if (order.paymentStatus === 'PAID') {
            updates.paymentStatus = 'REFUNDED';
          } else {
            updates.paymentStatus = 'CANCELLED';
          }
        }

        // If delivered and COD, automatically mark paid if seller confirms
        if (newStatus === 'DELIVERED' && order.paymentMethod === 'COD' && order.paymentStatus === 'UNPAID') {
          updates.paymentStatus = 'PAID';
          updates.paymentVerifiedAt = nowIso;
          updates.paymentVerifiedBy = updatedBy;
        }

        transaction.update(orderRef, updates);

        // Record status history audit
        const historyRef = doc(collection(db, 'order_status_history'));
        const historyEntry: OrderStatusHistory = {
          id: historyRef.id,
          orderId,
          previousStatus,
          newStatus,
          description: description || `Status pesanan diubah menjadi ${newStatus}`,
          updatedBy,
          timestamp: nowIso
        };
        transaction.set(historyRef, historyEntry);
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
    }
  },

  /**
   * VERIFY / UPDATE PAYMENT STATUS
   */
  async updatePaymentStatus(params: {
    orderId: string;
    newPaymentStatus: OrderPaymentStatus;
    verifiedBy: string;
    notes?: string;
  }): Promise<void> {
    const { orderId, newPaymentStatus, verifiedBy, notes } = params;

    try {
      const orderRef = doc(db, 'orders', orderId);
      const nowIso = new Date().toISOString();

      await updateDoc(orderRef, {
        paymentStatus: newPaymentStatus,
        paymentVerifiedAt: nowIso,
        paymentVerifiedBy: verifiedBy,
        updatedAt: nowIso
      });

      // Record in history
      const historyRef = doc(collection(db, 'order_status_history'));
      await setDoc(historyRef, {
        id: historyRef.id,
        orderId,
        newStatus: 'CONFIRMED',
        description: `Status pembayaran diperbarui menjadi ${newPaymentStatus} oleh ${verifiedBy}. ${notes || ''}`,
        updatedBy: verifiedBy,
        timestamp: nowIso
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  },

  /**
   * UPLOAD / ATTACH PAYMENT PROOF
   */
  async uploadPaymentProof(orderId: string, proofUrl: string): Promise<void> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const nowIso = new Date().toISOString();
      await updateDoc(orderRef, {
        paymentProofUrl: proofUrl,
        paymentStatus: 'PENDING',
        updatedAt: nowIso
      });

      const historyRef = doc(collection(db, 'order_status_history'));
      await setDoc(historyRef, {
        id: historyRef.id,
        orderId,
        newStatus: 'ORDER_RECEIVED',
        description: 'Bukti pembayaran transfer telah diunggah oleh pelanggan, menunggu verifikasi penjual.',
        updatedBy: 'Pelanggan',
        timestamp: nowIso
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  },

  /**
   * ASSIGN COURIER TO ORDER
   */
  async assignCourier(params: {
    orderId: string;
    courierName: string;
    courierPhone: string;
    vehicle?: string;
    updatedBy: string;
  }): Promise<void> {
    const { orderId, courierName, courierPhone, vehicle, updatedBy } = params;

    try {
      const orderRef = doc(db, 'orders', orderId);
      const nowIso = new Date().toISOString();

      const courierInfo: CourierInfo = {
        name: courierName,
        phone: courierPhone,
        vehicle: vehicle || 'Motor Kurir Sayur',
        assignedAt: nowIso,
        pickupTime: nowIso
      };

      await updateDoc(orderRef, {
        courier: courierInfo,
        orderStatus: 'READY_FOR_PICKUP',
        updatedAt: nowIso
      });

      const historyRef = doc(collection(db, 'order_status_history'));
      await setDoc(historyRef, {
        id: historyRef.id,
        orderId,
        previousStatus: 'PREPARING',
        newStatus: 'READY_FOR_PICKUP',
        description: `Kurir ${courierName} (${courierPhone}) ditugaskan mengantar pesanan.`,
        updatedBy,
        timestamp: nowIso
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  }
};
