import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { CustomerAddress } from '../types';

export const addressService = {
  async getCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
    try {
      const q = query(
        collection(db, 'customer_addresses'),
        where('customerId', '==', customerId)
      );
      const snapshot = await getDocs(q);
      const list: CustomerAddress[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CustomerAddress);
      });
      return list.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
    } catch (error) {
      console.warn('Error fetching customer addresses:', error);
      return [];
    }
  },

  async saveAddress(address: Omit<CustomerAddress, 'id' | 'createdAt'>, customId?: string): Promise<CustomerAddress> {
    const id = customId || doc(collection(db, 'customer_addresses')).id;
    const now = new Date().toISOString();
    const newAddress: CustomerAddress = {
      ...address,
      id,
      createdAt: now
    };

    try {
      await setDoc(doc(db, 'customer_addresses', id), newAddress);
      return newAddress;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `customer_addresses/${id}`);
    }
  },

  async deleteAddress(addressId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'customer_addresses', addressId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `customer_addresses/${addressId}`);
    }
  }
};
