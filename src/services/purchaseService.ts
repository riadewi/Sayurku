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
import { Purchase, PurchaseItem, Product, InventoryMovement } from '../types';
import { generatePurchaseNumber } from '../lib/utils';

export const purchaseService = {
  async getPurchases(businessId: string, maxItems: number = 200): Promise<Purchase[]> {
    try {
      const q = query(
        collection(db, 'purchases'),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );
      const snapshot = await getDocs(q);
      const purchases: Purchase[] = [];
      snapshot.forEach(docSnap => {
        purchases.push({ id: docSnap.id, ...docSnap.data() } as Purchase);
      });
      return purchases;
    } catch (error) {
      console.warn('Error fetching purchases, falling back to simple query:', error);
      try {
        const simpleQ = query(collection(db, 'purchases'), where('businessId', '==', businessId));
        const snap = await getDocs(simpleQ);
        const purchases: Purchase[] = [];
        snap.forEach(d => purchases.push({ id: d.id, ...d.data() } as Purchase));
        return purchases.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      } catch (e) {
        console.warn('Fallback error fetching purchases:', e);
        return [];
      }
    }
  },

  /**
   * ATOMIC PURCHASE CONFIRMATION:
   * Adds stock for each purchased item, records STOCK_IN movements, updates purchase cost (HPP), and creates purchase record.
   */
  async createPurchase(params: {
    businessId: string;
    supplierId?: string;
    supplierName: string;
    items: PurchaseItem[];
    date: string;
    notes?: string;
    userId: string;
  }): Promise<Purchase> {
    const { businessId, supplierId, supplierName, items, date, notes, userId } = params;

    if (!items || items.length === 0) {
      throw new Error('Daftar barang kulakan/pembelian tidak boleh kosong.');
    }

    const purchaseRef = doc(collection(db, 'purchases'));
    const purchaseNumber = generatePurchaseNumber();
    const nowIso = new Date().toISOString();

    const totalAmount = items.reduce((sum, it) => sum + it.subtotal, 0);

    try {
      return await runTransaction(db, async (transaction) => {
        // Fetch each product and prepare updates
        for (const item of items) {
          const prodRef = doc(db, 'products', item.productId);
          const pSnap = await transaction.get(prodRef);

          if (!pSnap.exists()) {
            throw new Error(`Produk "${item.productName}" tidak ditemukan di database.`);
          }

          const product = pSnap.data() as Product;
          const prevStock = Number(product.currentStock || 0);
          const newStock = Number((prevStock + item.quantity).toFixed(2));

          // Update product stock and optionally update purchase cost (HPP)
          transaction.update(prodRef, {
            currentStock: newStock,
            purchaseCost: item.costPrice > 0 ? item.costPrice : product.purchaseCost,
            updatedAt: nowIso
          });

          // Create STOCK_IN movement
          const movRef = doc(collection(db, 'inventory_movements'));
          const movement: InventoryMovement = {
            id: movRef.id,
            businessId,
            productId: item.productId,
            productName: item.productName,
            type: 'STOCK_IN',
            quantity: item.quantity,
            unit: item.unit || product.baseUnit,
            previousStock: prevStock,
            newStock,
            referenceId: purchaseRef.id,
            reason: `Kulakan dari ${supplierName || 'Pemasok'} #${purchaseNumber}`,
            userId,
            createdAt: nowIso,
            date: date || nowIso.split('T')[0]
          };
          transaction.set(movRef, movement);
        }

        const newPurchase: Purchase = {
          id: purchaseRef.id,
          businessId,
          purchaseNumber,
          supplierId: supplierId || '',
          supplierName: supplierName || 'Pemasok Umum',
          date: date || nowIso.split('T')[0],
          items,
          totalAmount,
          notes: notes || '',
          status: 'RECEIVED',
          createdAt: nowIso
        };

        transaction.set(purchaseRef, newPurchase);
        return newPurchase;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'purchases');
    }
  }
};
