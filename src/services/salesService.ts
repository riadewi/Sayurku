import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  runTransaction 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Sale, CartItem, Product, InventoryMovement, SaleItemSnapshot } from '../types';
import { generateReceiptNumber } from '../lib/utils';

export const salesService = {
  async getSales(businessId: string, maxItems: number = 300): Promise<Sale[]> {
    try {
      const q = query(
        collection(db, 'sales'),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );
      const snapshot = await getDocs(q);
      const sales: Sale[] = [];
      snapshot.forEach(docSnap => {
        sales.push({ id: docSnap.id, ...docSnap.data() } as Sale);
      });
      return sales;
    } catch (error) {
      console.warn('Error fetching sales, falling back to simple query:', error);
      try {
        const simpleQ = query(collection(db, 'sales'), where('businessId', '==', businessId));
        const snap = await getDocs(simpleQ);
        const sales: Sale[] = [];
        snap.forEach(d => sales.push({ id: d.id, ...d.data() } as Sale));
        return sales.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      } catch (e) {
        console.warn('Fallback error fetching sales:', e);
        return [];
      }
    }
  },

  /**
   * ATOMIC POS TRANSACTION:
   * Validates stock, deducts single items and bundle component items,
   * creates inventory movements for each deducted item, and saves the sale snapshot.
   */
  async processSale(params: {
    businessId: string;
    items: CartItem[];
    discount: number;
    paymentMethod: 'CASH' | 'TRANSFER';
    paymentAmount: number;
    cashierUid: string;
    cashierName?: string;
    customerName?: string;
    notes?: string;
  }): Promise<Sale> {
    const {
      businessId,
      items,
      discount,
      paymentMethod,
      paymentAmount,
      cashierUid,
      cashierName,
      customerName,
      notes
    } = params;

    if (!items || items.length === 0) {
      throw new Error('Keranjang belanja masih kosong');
    }

    const saleRef = doc(collection(db, 'sales'));
    const receiptNumber = generateReceiptNumber();
    const now = new Date();
    const nowIso = now.toISOString();
    const dateStr = nowIso.split('T')[0];

    try {
      return await runTransaction(db, async (transaction) => {
        // Step 1: Collect all distinct product IDs needed (both direct products and bundle components)
        const requiredDeductions: Map<string, {
          productId: string;
          deductQty: number;
          reason: string;
          movementType: 'STOCK_OUT' | 'BUNDLE_OUT';
          bundleName?: string;
        }> = new Map();

        // Also we will prepare the sale items snapshot with locked historical cost prices
        const saleItemSnapshots: SaleItemSnapshot[] = [];
        let calculatedTotalCost = 0;
        let calculatedSubtotal = 0;

        for (const cartItem of items) {
          const p = cartItem.product;
          calculatedSubtotal += cartItem.subtotal;

          if (p.type === 'SINGLE') {
            calculatedTotalCost += (p.purchaseCost || 0) * cartItem.quantity;
            
            // Add to deductions
            const existing = requiredDeductions.get(p.id);
            if (existing) {
              existing.deductQty += cartItem.quantity;
            } else {
              requiredDeductions.set(p.id, {
                productId: p.id,
                deductQty: cartItem.quantity,
                reason: `Penjualan kasir #${receiptNumber}`,
                movementType: 'STOCK_OUT'
              });
            }

            saleItemSnapshots.push({
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
            // Bundle product: deduct each component
            const components = p.bundleItems || [];
            if (components.length === 0) {
              throw new Error(`Paket bundling "${p.name}" belum memiliki komposisi bahan sayuran.`);
            }

            let bundleTotalHpp = 0;

            for (const comp of components) {
              const compDeductQty = comp.quantity * cartItem.quantity;
              
              const existing = requiredDeductions.get(comp.productId);
              if (existing) {
                existing.deductQty += compDeductQty;
              } else {
                requiredDeductions.set(comp.productId, {
                  productId: comp.productId,
                  deductQty: compDeductQty,
                  reason: `Komponen ${p.name} (x${cartItem.quantity}) #${receiptNumber}`,
                  movementType: 'BUNDLE_OUT',
                  bundleName: p.name
                });
              }
            }

            saleItemSnapshots.push({
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

        // Step 2: Fetch and validate all required product documents in the transaction
        const productSnaps: Map<string, Product> = new Map();

        for (const [prodId] of requiredDeductions) {
          const prodRef = doc(db, 'products', prodId);
          const pSnap = await transaction.get(prodRef);
          if (!pSnap.exists()) {
            throw new Error(`Produk dengan ID ${prodId} tidak ditemukan di database.`);
          }
          const pData = pSnap.data() as Product;
          productSnaps.set(prodId, pData);
        }

        // Recalculate bundle HPP using actual database cost of components if needed
        for (const itemSnap of saleItemSnapshots) {
          if (itemSnap.type === 'BUNDLE' && itemSnap.bundleComponents) {
            let bundleCost = 0;
            for (const comp of itemSnap.bundleComponents) {
              const compProd = productSnaps.get(comp.productId);
              if (compProd) {
                bundleCost += (compProd.purchaseCost || 0) * comp.quantity;
              }
            }
            itemSnap.costPrice = bundleCost / itemSnap.quantity;
            calculatedTotalCost += bundleCost;
          }
        }

        // Step 3: Validate inventory levels to prevent negative stock
        for (const [prodId, req] of requiredDeductions) {
          const product = productSnaps.get(prodId)!;
          const currentStock = Number(product.currentStock || 0);

          if (currentStock < req.deductQty) {
            const context = req.bundleName 
              ? ` (dibutuhkan untuk "${req.bundleName}")`
              : '';
            throw new Error(
              `Stok "${product.name}"${context} tidak mencukupi! Tersedia: ${currentStock} ${product.baseUnit}, dibutuhkan: ${req.deductQty} ${product.baseUnit}.`
            );
          }
        }

        // Step 4: Perform stock deductions and write inventory movement audit records
        for (const [prodId, req] of requiredDeductions) {
          const product = productSnaps.get(prodId)!;
          const prevStock = Number(product.currentStock || 0);
          const newStock = Number((prevStock - req.deductQty).toFixed(2));

          const prodRef = doc(db, 'products', prodId);
          transaction.update(prodRef, {
            currentStock: newStock,
            updatedAt: nowIso
          });

          // Create audit movement
          const movementRef = doc(collection(db, 'inventory_movements'));
          const movement: InventoryMovement = {
            id: movementRef.id,
            businessId,
            productId: prodId,
            productName: product.name,
            type: req.movementType,
            quantity: -req.deductQty,
            unit: product.baseUnit,
            previousStock: prevStock,
            newStock,
            referenceId: saleRef.id,
            reason: req.reason,
            userId: cashierUid,
            createdAt: nowIso,
            date: dateStr
          };
          transaction.set(movementRef, movement);
        }

        // Step 5: Calculate final totals
        const finalTotal = Math.max(0, calculatedSubtotal - discount);
        const change = paymentMethod === 'CASH' 
          ? Math.max(0, paymentAmount - finalTotal) 
          : 0;

        if (paymentMethod === 'CASH' && paymentAmount < finalTotal) {
          throw new Error(`Uang pembayaran kurang! Total belanja: ${finalTotal}, dibayar: ${paymentAmount}`);
        }

        const grossProfit = finalTotal - calculatedTotalCost;

        // Step 6: Create Sale record
        const saleRecord: Sale = {
          id: saleRef.id,
          businessId,
          receiptNumber,
          items: saleItemSnapshots,
          subtotal: calculatedSubtotal,
          discount: discount || 0,
          finalTotal,
          totalCost: calculatedTotalCost,
          grossProfit,
          paymentMethod,
          paymentAmount: paymentMethod === 'CASH' ? paymentAmount : finalTotal,
          change,
          status: 'COMPLETED',
          cashierUid,
          cashierName,
          customerName: customerName || 'Pelanggan Umum',
          notes: notes || '',
          createdAt: nowIso,
          date: dateStr
        };

        transaction.set(saleRef, saleRecord);

        return saleRecord;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales');
    }
  },

  /**
   * CANCEL / REVERSE SALE:
   * Restores all single and bundle component stock in an atomic transaction,
   * creating SALE_REVERSAL inventory movements.
   */
  async cancelSale(params: {
    saleId: string;
    userId: string;
    reason: string;
  }): Promise<void> {
    const { saleId, userId, reason } = params;

    try {
      await runTransaction(db, async (transaction) => {
        const saleRef = doc(db, 'sales', saleId);
        const saleSnap = await transaction.get(saleRef);

        if (!saleSnap.exists()) {
          throw new Error('Transaksi penjualan tidak ditemukan.');
        }

        const sale = saleSnap.data() as Sale;
        if (sale.status === 'CANCELLED') {
          throw new Error('Transaksi ini sudah dibatalkan sebelumnya.');
        }

        const now = new Date();
        const nowIso = now.toISOString();
        const dateStr = nowIso.split('T')[0];

        // Gather all products to restore
        const restorations: {
          productId: string;
          productName: string;
          restoreQty: number;
          unit: string;
          reason: string;
        }[] = [];

        for (const item of sale.items) {
          if (item.type === 'SINGLE') {
            restorations.push({
              productId: item.productId,
              productName: item.productName,
              restoreQty: item.quantity,
              unit: item.unit,
              reason: `Pembatalan Penjualan #${sale.receiptNumber}: ${reason}`
            });
          } else if (item.type === 'BUNDLE' && item.bundleComponents) {
            for (const comp of item.bundleComponents) {
              restorations.push({
                productId: comp.productId,
                productName: comp.productName,
                restoreQty: comp.quantity,
                unit: comp.unit,
                reason: `Pembatalan Komponen Paket ${item.productName} #${sale.receiptNumber}: ${reason}`
              });
            }
          }
        }

        // Fetch each product to read its current stock
        for (const rest of restorations) {
          const prodRef = doc(db, 'products', rest.productId);
          const prodSnap = await transaction.get(prodRef);
          if (prodSnap.exists()) {
            const p = prodSnap.data() as Product;
            const prevStock = Number(p.currentStock || 0);
            const newStock = Number((prevStock + rest.restoreQty).toFixed(2));

            // Restore product stock
            transaction.update(prodRef, {
              currentStock: newStock,
              updatedAt: nowIso
            });

            // Write SALE_REVERSAL movement
            const movRef = doc(collection(db, 'inventory_movements'));
            const movement: InventoryMovement = {
              id: movRef.id,
              businessId: sale.businessId,
              productId: rest.productId,
              productName: rest.productName,
              type: 'SALE_REVERSAL',
              quantity: rest.restoreQty,
              unit: rest.unit,
              previousStock: prevStock,
              newStock,
              referenceId: sale.id,
              reason: rest.reason,
              userId,
              createdAt: nowIso,
              date: dateStr
            };
            transaction.set(movRef, movement);
          }
        }

        // Update sale status to CANCELLED
        transaction.update(saleRef, {
          status: 'CANCELLED',
          cancelledAt: nowIso,
          cancelReason: reason
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `sales/${saleId}`);
    }
  }
};
