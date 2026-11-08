import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DeliveryRateConfig } from '../types';

export const defaultDeliveryConfig: DeliveryRateConfig = {
  id: 'default_config',
  businessId: '',
  storeLatitude: -6.2625, // Pasar Induk Sayur
  storeLongitude: 106.8712,
  storeAddress: 'Kios Sayur Segar Blok B-12, Pasar Induk',
  maxRadiusKm: 15,
  freeShippingMinAmount: 75000,
  rates: [
    { minKm: 0, maxKm: 2, fee: 3000 },
    { minKm: 2, maxKm: 5, fee: 5000 },
    { minKm: 5, maxKm: 10, fee: 10000 },
    { minKm: 10, maxKm: 15, fee: 15000, requiresManualConfirmation: true }
  ]
};

export const deliveryService = {
  async getDeliveryConfig(businessId: string): Promise<DeliveryRateConfig> {
    try {
      const docRef = doc(db, 'delivery_rates', businessId || 'default_config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as DeliveryRateConfig;
      }
      return { ...defaultDeliveryConfig, businessId };
    } catch (error) {
      console.warn('Error fetching delivery config, using default:', error);
      return { ...defaultDeliveryConfig, businessId };
    }
  },

  async saveDeliveryConfig(config: DeliveryRateConfig): Promise<void> {
    try {
      const id = config.businessId || 'default_config';
      await setDoc(doc(db, 'delivery_rates', id), config, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `delivery_rates/${config.businessId}`);
    }
  }
};
