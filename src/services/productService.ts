import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, BundleComponent } from '../types';

export const productService = {
  async getProducts(businessId: string): Promise<Product[]> {
    try {
      const q = query(
        collection(db, 'products'),
        where('businessId', '==', businessId)
      );
      const snapshot = await getDocs(q);
      const products: Product[] = [];
      snapshot.forEach(docSnap => {
        products.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });

      if (products.length === 0) {
        const allSnap = await getDocs(collection(db, 'products'));
        allSnap.forEach(docSnap => {
          products.push({ id: docSnap.id, ...docSnap.data() } as Product);
        });
      }
      return products;
    } catch (error) {
      console.warn('Error fetching products:', error);
      return [];
    }
  },

  async getProduct(productId: string): Promise<Product | null> {
    try {
      const snap = await getDoc(doc(db, 'products', productId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() } as Product;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `products/${productId}`);
    }
  },

  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, customId?: string): Promise<Product> {
    const id = customId || doc(collection(db, 'products')).id;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await setDoc(doc(db, 'products', id), newProduct);
      return newProduct;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${id}`);
    }
  },

  async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    try {
      await updateDoc(doc(db, 'products', productId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${productId}`);
    }
  },

  async deleteProduct(productId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  },

  /**
   * Calculates the maximum bundle units that can be sold based on currently available components
   */
  calculateAvailableBundleStock(bundle: Product, allProducts: Product[]): number {
    if (bundle.type !== 'BUNDLE' || !bundle.bundleItems || bundle.bundleItems.length === 0) {
      return bundle.currentStock || 0;
    }

    let minAvailable = Infinity;
    for (const comp of bundle.bundleItems) {
      const componentProduct = allProducts.find(p => p.id === comp.productId);
      if (!componentProduct || componentProduct.currentStock <= 0) {
        return 0;
      }
      const canMake = Math.floor(componentProduct.currentStock / comp.quantity);
      if (canMake < minAvailable) {
        minAvailable = canMake;
      }
    }

    return minAvailable === Infinity ? 0 : Math.max(0, minAvailable);
  },

  /**
   * Calculates the estimated component cost for a bundle
   */
  calculateBundleHpp(bundleItems: BundleComponent[], allProducts: Product[]): number {
    return bundleItems.reduce((total, comp) => {
      const found = allProducts.find(p => p.id === comp.productId);
      const unitCost = found ? found.purchaseCost : 0;
      return total + (unitCost * comp.quantity);
    }, 0);
  }
};
