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
import { InventoryMovement, MovementType, Product } from '../types';

export const inventoryService = {
  async getMovements(businessId: string, maxItems: number = 200): Promise<InventoryMovement[]> {
    try {
      const q = query(
        collection(db, 'inventory_movements'),
        where('businessId', '==', businessId),
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );
      const snapshot = await getDocs(q);
      const movements: InventoryMovement[] = [];
      snapshot.forEach(docSnap => {
        movements.push({ id: docSnap.id, ...docSnap.data() } as InventoryMovement);
      });
      return movements;
    } catch (error) {
      console.warn('Error fetching inventory movements, falling back to simple query:', error);
      try {
        const simpleQ = query(collection(db, 'inventory_movements'), where('businessId', '==', businessId));
        const snap = await getDocs(simpleQ);
        const movements: InventoryMovement[] = [];
        snap.forEach(d => movements.push({ id: d.id, ...d.data() } as InventoryMovement));
        return movements.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      } catch (e) {
        console.warn('Fallback error fetching movements:', e);
        return [];
      }
    }
  },

  /**
   * Adjusts stock for a single product with an atomic transaction and audit movement
   */
  async recordStockAdjustment(params: {
    businessId: string;
    productId: string;
    type: MovementType;
    quantityChange: number; // positive for addition, negative for deduction
    reason: string;
    userId: string;
  }): Promise<{ previousStock: number; newStock: number }> {
    const { businessId, productId, type, quantityChange, reason, userId } = params;

    try {
      return await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists()) {
          throw new Error('Produk tidak ditemukan');
        }

        const product = productSnap.data() as Product;
        const previousStock = Number(product.currentStock || 0);
        const newStock = Number((previousStock + quantityChange).toFixed(2));

        if (newStock < 0) {
          throw new Error(`Stok tidak mencukupi. Stok saat ini: ${previousStock} ${product.baseUnit}, pengurangan: ${Math.abs(quantityChange)} ${product.baseUnit}`);
        }

        // Update product stock
        transaction.update(productRef, {
          currentStock: newStock,
          updatedAt: new Date().toISOString()
        });

        // Create immutable inventory movement
        const movementRef = doc(collection(db, 'inventory_movements'));
        const movement: InventoryMovement = {
          id: movementRef.id,
          businessId,
          productId,
          productName: product.name,
          type,
          quantity: quantityChange,
          unit: product.baseUnit,
          previousStock,
          newStock,
          reason: reason || 'Penyesuaian stok manual',
          userId,
          createdAt: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0]
        };

        transaction.set(movementRef, movement);

        return { previousStock, newStock };
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'inventory_movements');
    }
  }
};
