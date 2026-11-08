import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Supplier, Category } from '../types';

export const supplierService = {
  async getSuppliers(businessId: string): Promise<Supplier[]> {
    try {
      const q = query(
        collection(db, 'suppliers'),
        where('businessId', '==', businessId)
      );
      const snapshot = await getDocs(q);
      const suppliers: Supplier[] = [];
      snapshot.forEach(docSnap => {
        suppliers.push({ id: docSnap.id, ...docSnap.data() } as Supplier);
      });

      if (suppliers.length === 0) {
        const allSnap = await getDocs(collection(db, 'suppliers'));
        allSnap.forEach(docSnap => {
          suppliers.push({ id: docSnap.id, ...docSnap.data() } as Supplier);
        });
      }
      return suppliers;
    } catch (error) {
      console.warn('Error fetching suppliers:', error);
      return [];
    }
  },

  async addSupplier(params: {
    businessId: string;
    name: string;
    phone: string;
    address?: string;
    notes?: string;
  }): Promise<Supplier> {
    const { businessId, name, phone, address, notes } = params;
    const supRef = doc(collection(db, 'suppliers'));
    const now = new Date().toISOString();

    const newSupplier: Supplier = {
      id: supRef.id,
      businessId,
      name,
      phone,
      address: address || '',
      notes: notes || '',
      isActive: true,
      createdAt: now
    };

    try {
      await setDoc(supRef, newSupplier);
      return newSupplier;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `suppliers/${supRef.id}`);
    }
  },

  async updateSupplier(supplierId: string, updates: Partial<Supplier>): Promise<void> {
    try {
      await updateDoc(doc(db, 'suppliers', supplierId), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `suppliers/${supplierId}`);
    }
  },

  async deleteSupplier(supplierId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'suppliers', supplierId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `suppliers/${supplierId}`);
    }
  }
};

export const categoryService = {
  async getCategories(businessId: string): Promise<Category[]> {
    try {
      const q = query(
        collection(db, 'categories'),
        where('businessId', '==', businessId)
      );
      const snapshot = await getDocs(q);
      const categories: Category[] = [];
      snapshot.forEach(docSnap => {
        categories.push({ id: docSnap.id, ...docSnap.data() } as Category);
      });

      if (categories.length === 0) {
        const allSnap = await getDocs(collection(db, 'categories'));
        allSnap.forEach(docSnap => {
          categories.push({ id: docSnap.id, ...docSnap.data() } as Category);
        });
      }
      return categories;
    } catch (error) {
      console.warn('Error fetching categories:', error);
      return [];
    }
  },

  async addCategory(businessId: string, name: string): Promise<Category> {
    const catRef = doc(collection(db, 'categories'));
    const newCat: Category = {
      id: catRef.id,
      businessId,
      name,
      createdAt: new Date().toISOString()
    };
    try {
      await setDoc(catRef, newCat);
      return newCat;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `categories/${catRef.id}`);
    }
  }
};
