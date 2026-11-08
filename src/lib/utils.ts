import { OrderStatus, OrderPaymentStatus, OrderPaymentMethod, DistanceTier, DeliveryRateConfig } from '../types';

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateIndo(dateStrOrTimestamp: string | number | Date): string {
  if (!dateStrOrTimestamp) return '-';
  const d = new Date(dateStrOrTimestamp);
  if (isNaN(d.getTime())) return String(dateStrOrTimestamp);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeIndo(dateStrOrTimestamp: string | number | Date): string {
  if (!dateStrOrTimestamp) return '-';
  const d = new Date(dateStrOrTimestamp);
  if (isNaN(d.getTime())) return String(dateStrOrTimestamp);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PJ-${yy}${mm}${dd}-${random}`;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${yy}${mm}${dd}-${random}`;
}

export function generatePurchaseNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `PB-${yy}${mm}${dd}-${random}`;
}

export function generateExpenseNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BY-${yy}${mm}${dd}-${random}`;
}

/**
 * Calculates Haversine distance between two coordinates in Kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Number(d.toFixed(1));
}

/**
 * Calculates shipping fee based on distance and store configuration
 */
export function calculateShippingFee(
  distanceKm: number,
  subtotal: number,
  config?: DeliveryRateConfig
): { fee: number; isFreeShipping: boolean; requiresManual: boolean } {
  // Default fallback rate tiers if config not yet initialized
  const freeThreshold = config?.freeShippingMinAmount ?? 75000;
  const maxRadius = config?.maxRadiusKm ?? 15;

  if (distanceKm > maxRadius) {
    return { fee: 0, isFreeShipping: false, requiresManual: true };
  }

  // Free shipping check
  if (freeThreshold > 0 && subtotal >= freeThreshold) {
    return { fee: 0, isFreeShipping: true, requiresManual: false };
  }

  const rates = config?.rates || [
    { minKm: 0, maxKm: 2, fee: 3000 },
    { minKm: 2, maxKm: 5, fee: 5000 },
    { minKm: 5, maxKm: 10, fee: 10000 },
  ];

  for (const tier of rates) {
    if (distanceKm > tier.minKm && distanceKm <= tier.maxKm) {
      if (tier.requiresManualConfirmation) {
        return { fee: 0, isFreeShipping: false, requiresManual: true };
      }
      return { fee: tier.fee, isFreeShipping: false, requiresManual: false };
    }
  }

  if (distanceKm <= 2) return { fee: 3000, isFreeShipping: false, requiresManual: false };
  if (distanceKm <= 5) return { fee: 5000, isFreeShipping: false, requiresManual: false };
  if (distanceKm <= 10) return { fee: 10000, isFreeShipping: false, requiresManual: false };

  return { fee: 15000, isFreeShipping: false, requiresManual: true };
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case 'ORDER_RECEIVED': return 'Pesanan Diterima';
    case 'CONFIRMED': return 'Pesanan Dikonfirmasi';
    case 'PREPARING': return 'Sedang Disiapkan';
    case 'READY_FOR_PICKUP': return 'Siap Dikirim';
    case 'ON_DELIVERY': return 'Sedang Diantar';
    case 'DELIVERED': return 'Sudah Sampai';
    case 'CANCELLED': return 'Dibatalkan';
    case 'DELIVERY_FAILED': return 'Pengiriman Gagal';
    case 'RETURNED': return 'Dikembalikan';
    default: return status;
  }
}

export function getPaymentStatusLabel(status: OrderPaymentStatus): string {
  switch (status) {
    case 'UNPAID': return 'Belum Dibayar';
    case 'PENDING': return 'Menunggu Verifikasi';
    case 'PAID': return 'Lunas';
    case 'FAILED': return 'Pembayaran Gagal';
    case 'REFUNDED': return 'Dana Dikembalikan';
    case 'CANCELLED': return 'Dibatalkan';
    default: return status;
  }
}

export function getPaymentMethodLabel(method: OrderPaymentMethod): string {
  switch (method) {
    case 'TRANSFER': return 'Transfer Bank';
    case 'QRIS': return 'QRIS / E-Wallet';
    case 'COD': return 'Bayar di Tempat (COD)';
    default: return method;
  }
}
