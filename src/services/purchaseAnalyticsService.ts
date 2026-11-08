import { 
  collection, 
  doc, 
  getDocs, 
  writeBatch, 
  query, 
  where,
  deleteDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Purchase, PurchaseItem, Supplier } from '../types';
import { formatRupiah, formatDateIndo } from '../lib/utils';

export interface PurchaseAnalyticsSummary {
  totalPurchaseAmount: number;
  totalTransactionsCount: number;
  totalSuppliersCount: number;
  averageTransactionAmount: number;
  monthlyTrend: {
    monthKey: string; // YYYY-MM
    monthLabel: string; // e.g. "Juli 2026"
    totalAmount: number;
    transactionsCount: number;
  }[];
  categoryBreakdown: {
    categoryName: string;
    totalAmount: number;
    percentage: number;
  }[];
  supplierBreakdown: {
    supplierName: string;
    totalAmount: number;
    transactionsCount: number;
  }[];
  topPurchasedProducts: {
    productName: string;
    categoryName: string;
    quantity: number;
    unit: string;
    totalAmount: number;
  }[];
}

export const purchaseAnalyticsService = {
  /**
   * Computes comprehensive analytics from a list of purchase records
   */
  computeAnalytics(purchases: Purchase[]): PurchaseAnalyticsSummary {
    const totalPurchaseAmount = purchases.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const totalTransactionsCount = purchases.length;
    const averageTransactionAmount = totalTransactionsCount > 0 ? Math.round(totalPurchaseAmount / totalTransactionsCount) : 0;

    // Unique suppliers
    const supplierSet = new Set<string>();
    purchases.forEach(p => {
      if (p.supplierName) supplierSet.add(p.supplierName);
    });
    const totalSuppliersCount = supplierSet.size;

    // Monthly Trend Map
    const monthMap = new Map<string, { totalAmount: number; count: number }>();
    purchases.forEach(p => {
      if (!p.date) return;
      const monthKey = p.date.substring(0, 7); // YYYY-MM
      const cur = monthMap.get(monthKey) || { totalAmount: 0, count: 0 };
      cur.totalAmount += p.totalAmount || 0;
      cur.count += 1;
      monthMap.set(monthKey, cur);
    });

    const monthKeysSorted = Array.from(monthMap.keys()).sort();
    const monthlyTrend = monthKeysSorted.map(mKey => {
      const parts = mKey.split('-');
      const year = parts[0];
      const monthNum = parseInt(parts[1], 10);
      const dateObj = new Date(parseInt(year, 10), monthNum - 1, 1);
      const monthLabel = dateObj.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      const data = monthMap.get(mKey)!;
      return {
        monthKey: mKey,
        monthLabel,
        totalAmount: data.totalAmount,
        transactionsCount: data.count
      };
    });

    // Category Breakdown Map
    const catMap = new Map<string, number>();
    purchases.forEach(p => {
      if (p.items && p.items.length > 0) {
        p.items.forEach(it => {
          const cat = it.categoryName || p.purchaseCategory || 'Sayuran Segar';
          catMap.set(cat, (catMap.get(cat) || 0) + it.subtotal);
        });
      } else {
        const cat = p.purchaseCategory || 'Sayuran Segar';
        catMap.set(cat, (catMap.get(cat) || 0) + (p.totalAmount || 0));
      }
    });

    const categoryBreakdown = Array.from(catMap.entries()).map(([cat, amount]) => ({
      categoryName: cat,
      totalAmount: amount,
      percentage: totalPurchaseAmount > 0 ? Number(((amount / totalPurchaseAmount) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    // Supplier Breakdown Map
    const supMap = new Map<string, { totalAmount: number; count: number }>();
    purchases.forEach(p => {
      const sName = p.supplierName || 'Pemasok Umum';
      const cur = supMap.get(sName) || { totalAmount: 0, count: 0 };
      cur.totalAmount += p.totalAmount || 0;
      cur.count += 1;
      supMap.set(sName, cur);
    });

    const supplierBreakdown = Array.from(supMap.entries()).map(([sName, data]) => ({
      supplierName: sName,
      totalAmount: data.totalAmount,
      transactionsCount: data.count
    })).sort((a, b) => b.totalAmount - a.totalAmount);

    // Top Purchased Products Map
    const prodMap = new Map<string, { productName: string; categoryName: string; quantity: number; unit: string; totalAmount: number }>();
    purchases.forEach(p => {
      if (p.items) {
        p.items.forEach(it => {
          const cur = prodMap.get(it.productId) || {
            productName: it.productName,
            categoryName: it.categoryName || 'Sayuran',
            quantity: 0,
            unit: it.unit,
            totalAmount: 0
          };
          cur.quantity += it.quantity;
          cur.totalAmount += it.subtotal;
          prodMap.set(it.productId, cur);
        });
      }
    });

    const topPurchasedProducts = Array.from(prodMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    return {
      totalPurchaseAmount,
      totalTransactionsCount,
      totalSuppliersCount,
      averageTransactionAmount,
      monthlyTrend,
      categoryBreakdown,
      supplierBreakdown,
      topPurchasedProducts
    };
  },

  /**
   * SEED DEMO PURCHASE DATA
   * Reconciles exactly to the required 5 reporting periods:
   * - July 2026: Rp 4.250.000
   * - August 2026: Rp 4.780.000
   * - September 2026: Rp 5.125.000
   * - October 2026: Rp 5.640.000
   * - November 2026 through Nov 8: Rp 1.850.000
   */
  async seedDemoPurchaseData(businessId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Period 1: July 2026 (Exact total = Rp 4.250.000)
      // Transaction 1: 05 July 2026 - Rp 2.250.000
      // Transaction 2: 20 July 2026 - Rp 2.000.000
      const refJul1 = doc(collection(db, 'purchases'));
      batch.set(refJul1, {
        id: refJul1.id,
        businessId,
        purchaseNumber: 'PB-260705-0101',
        invoiceNumber: 'INV/LEM/2026/07/044',
        supplierId: 'sup_lembang',
        supplierName: 'Kelompok Tani Sayur Lembang',
        date: '2026-07-05',
        purchaseCategory: 'Sayuran Daun',
        subtotal: 2250000,
        discount: 0,
        shippingCost: 0,
        totalAmount: 2250000,
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        status: 'RECEIVED',
        isDemo: true,
        notes: 'Kulakan sayuran daun segar awal bulan Juli',
        createdAt: '2026-07-05T06:30:00.000Z',
        items: [
          { productId: 'bay_01', productName: 'Bayam', categoryName: 'Sayuran Daun', quantity: 250, unit: 'Ikat', costPrice: 2000, subtotal: 500000 },
          { productId: 'kan_01', productName: 'Kangkung', categoryName: 'Sayuran Daun', quantity: 300, unit: 'Ikat', costPrice: 1800, subtotal: 540000 },
          { productId: 'pak_01', productName: 'Pakcoy', categoryName: 'Sayuran Daun', quantity: 70, unit: 'Kilogram', costPrice: 8000, subtotal: 560000 },
          { productId: 'saw_01', productName: 'Sawi Putih', categoryName: 'Sayuran Daun', quantity: 93, unit: 'Kilogram', costPrice: 7000, subtotal: 650000 }
        ]
      });

      const refJul2 = doc(collection(db, 'purchases'));
      batch.set(refJul2, {
        id: refJul2.id,
        businessId,
        purchaseNumber: 'PB-260720-0102',
        invoiceNumber: 'INV/KJ/2026/07/119',
        supplierId: 'sup_kramatjati',
        supplierName: 'Grosir Sayur Induk Kramat Jati',
        date: '2026-07-20',
        purchaseCategory: 'Sayuran Umbi dan Buah',
        subtotal: 2000000,
        discount: 0,
        shippingCost: 0,
        totalAmount: 2000000,
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        status: 'RECEIVED',
        isDemo: true,
        notes: 'Pasokan umbi dan buah pertengahan Juli',
        createdAt: '2026-07-20T07:15:00.000Z',
        items: [
          { productId: 'wor_01', productName: 'Wortel', categoryName: 'Sayuran Umbi dan Buah', quantity: 100, unit: 'Kilogram', costPrice: 9000, subtotal: 900000 },
          { productId: 'ken_01', productName: 'Kentang', categoryName: 'Sayuran Umbi dan Buah', quantity: 50, unit: 'Kilogram', costPrice: 14000, subtotal: 700000 },
          { productId: 'tom_01', productName: 'Tomat', categoryName: 'Sayuran Umbi dan Buah', quantity: 44.44, unit: 'Kilogram', costPrice: 9000, subtotal: 400000 }
        ]
      });

      // Period 2: August 2026 (Exact total = Rp 4.780.000)
      // Transaction 1: 08 Aug 2026 - Rp 2.580.000
      // Transaction 2: 24 Aug 2026 - Rp 2.200.000
      const refAug1 = doc(collection(db, 'purchases'));
      batch.set(refAug1, {
        id: refAug1.id,
        businessId,
        purchaseNumber: 'PB-260808-0201',
        invoiceNumber: 'INV/LEM/2026/08/078',
        supplierId: 'sup_lembang',
        supplierName: 'Kelompok Tani Sayur Lembang',
        date: '2026-08-08',
        purchaseCategory: 'Sayuran Daun',
        subtotal: 2580000,
        discount: 0,
        shippingCost: 0,
        totalAmount: 2580000,
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        status: 'RECEIVED',
        isDemo: true,
        notes: 'Kulakan sayur daun segar awal Agustus',
        createdAt: '2026-08-08T06:00:00.000Z',
        items: [
          { productId: 'bay_01', productName: 'Bayam', categoryName: 'Sayuran Daun', quantity: 300, unit: 'Ikat', costPrice: 2000, subtotal: 600000 },
          { productId: 'kan_01', productName: 'Kangkung', categoryName: 'Sayuran Daun', quantity: 350, unit: 'Ikat', costPrice: 1800, subtotal: 630000 },
          { productId: 'bro_01', productName: 'Brokoli', categoryName: 'Sayuran Umbi dan Buah', quantity: 40, unit: 'Kilogram', costPrice: 18000, subtotal: 720000 },
          { productId: 'kol_01', productName: 'Kol', categoryName: 'Sayuran Daun', quantity: 105, unit: 'Kilogram', costPrice: 6000, subtotal: 630000 }
        ]
      });

      const refAug2 = doc(collection(db, 'purchases'));
      batch.set(refAug2, {
        id: refAug2.id,
        businessId,
        purchaseNumber: 'PB-260824-0202',
        invoiceNumber: 'INV/BREB/2026/08/012',
        supplierId: 'sup_brebes',
        supplierName: 'Pemasok Bumbu Berkah Brebes',
        date: '2026-08-24',
        purchaseCategory: 'Bumbu dan Rempah',
        subtotal: 2200000,
        discount: 0,
        shippingCost: 0,
        totalAmount: 2200000,
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        status: 'RECEIVED',
        isDemo: true,
        notes: 'Pasokan bumbu dan cabai segar akhir Agustus',
        createdAt: '2026-08-24T08:30:00.000Z',
        items: [
          { productId: 'baw_01', productName: 'Bawang Merah', categoryName: 'Bumbu dan Rempah', quantity: 40, unit: 'Kilogram', costPrice: 28000, subtotal: 1120000 },
          { productId: 'baw_02', productName: 'Bawang Putih', categoryName: 'Bumbu dan Rempah', quantity: 30, unit: 'Kilogram', costPrice: 26000, subtotal: 780000 },
          { productId: 'jah_01', productName: 'Jahe', categoryName: 'Bumbu dan Rempah', quantity: 13.63, unit: 'Kilogram', costPrice: 22000, subtotal: 300000 }
        ]
      });

      // Period 3: September 2026 (Exact total = Rp 5.125.000)
      // Transaction 1: 04 Sep 2026 - Rp 2.625.000
      // Transaction 2: 21 Sep 2026 - Rp 2.500.000
      const refSep1 = doc(collection(db, 'purchases'));
      batch.set(refSep1, {
        id: refSep1.id,
        businessId,
        purchaseNumber: 'PB-260904-0301',
        invoiceNumber: 'INV/KJ/2026/09/205',
        supplierId: 'sup_kramatjati',
        supplierName: 'Grosir Sayur Induk Kramat Jati',
        date: '2026-09-04',
        purchaseCategory: 'Sayuran Umbi dan Buah',
        subtotal: 2625000,
        discount: 0,
        shippingCost: 0,
        totalAmount: 2625000,
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        status: 'RECEIVED',
        isDemo: true,
        notes: 'Kulakan aneka cabai dan umbi awal September',
        createdAt: '2026-09-04T07:00:00.000Z',
        items: [
          { productId: 'cab_01', productName: 'Cabai Rawit', categoryName: 'Sayuran Umbi dan Buah', quantity: 25, unit: 'Kilogram', costPrice: 45000, subtotal: 1125000 },
          { productId: 'cab_02', productName: 'Cabai Merah', categoryName: 'Sayuran Umbi dan Buah', quantity: 25, unit: 'Kilogram', costPrice: 35000, subtotal: 875000 },
          { productId: 'tom_01', productName: 'Tomat', categoryName: 'Sayuran Umbi dan Buah', quantity: 70, unit: 'Kilogram', costPrice: 9000, subtotal: 625000 }
        ]
      });

      const refSep2 = doc(collection(db, 'purchases'));
      batch.set(refSep2, {
        id: refSep2.id,
        businessId,
        purchaseNumber: 'PB-260921-0302',
        invoiceNumber: 'INV/LEM/2026/09/140',
        supplierId: 'sup_lembang',
        supplierName: 'Kelompok Tani Sayur Lembang',
        date: '2026-09-21',
        purchaseCategory: 'Sayuran Daun',
        subtotal: 2500000,
        discount: 0,
        shippingCost: 0,
        totalAmount: 2500000,
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        status: 'RECEIVED',
        isDemo: true,
        notes: 'Pasokan sayur daun hijau pertengahan September',
        createdAt: '2026-09-21T06:30:00.000Z',
        items: [
          { productId: 'bay_01', productName: 'Bayam', categoryName: 'Sayuran Daun', quantity: 350, unit: 'Ikat', costPrice: 2000, subtotal: 700000 },
          { productId: 'kan_01', productName: 'Kangkung', categoryName: 'Sayuran Daun', quantity: 350, unit: 'Ikat', costPrice: 1800, subtotal: 630000 },
          { productId: 'saw_02', productName: 'Sawi Hijau', categoryName: 'Sayuran Daun', quantity: 150, unit: 'Ikat', costPrice: 2500, subtotal: 375000 },
          { productId: 'pak_01', productName: 'Pakcoy', categoryName: 'Sayuran Daun', quantity: 99.375, unit: 'Kilogram', costPrice: 8000, subtotal: 795000 }
        ]
      });

      // Period 4: October 2026 (Exact total = Rp 5.640.000)
      // Transaction 1: 06 Oct 2026 - Rp 2.840.000
      // Transaction 2: 23 Oct 2026 - Rp 2.800.000
      const refOct1 = doc(collection(db, 'purchases'));
      batch.set(refOct1, {
        id: refOct1.id,
        businessId,
        purchaseNumber: 'PB-261006-0401',
        invoiceNumber: 'INV/BREB/2026/10/067',
        supplierId: 'sup_brebes',
        supplierName: 'Pemasok Bumbu Berkah Brebes',
        date: '2026-10-06',
        purchaseCategory: 'Bumbu dan Rempah',
        subtotal: 2840000,
        discount: 0,
        shippingCost: 0,
        totalAmount: 2840000,
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        status: 'RECEIVED',
        isDemo: true,
        notes: 'Stok rempah dan bawang awal Oktober',
        createdAt: '2026-10-06T08:00:00.000Z',
        items: [
          { productId: 'baw_01', productName: 'Bawang Merah', categoryName: 'Bumbu dan Rempah', quantity: 50, unit: 'Kilogram', costPrice: 28000, subtotal: 1400000 },
          { productId: 'baw_02', productName: 'Bawang Putih', categoryName: 'Bumbu dan Rempah', quantity: 40, unit: 'Kilogram', costPrice: 26000, subtotal: 1040000 },
          { productId: 'kun_01', productName: 'Kunyit', categoryName: 'Bumbu dan Rempah', quantity: 26.66, unit: 'Kilogram', costPrice: 15000, subtotal: 400000 }
        ]
      });

      const refOct2 = doc(collection(db, 'purchases'));
      batch.set(refOct2, {
        id: refOct2.id,
        businessId,
        purchaseNumber: 'PB-261023-0402',
        invoiceNumber: 'INV/KJ/2026/10/312',
        supplierId: 'sup_kramatjati',
        supplierName: 'Grosir Sayur Induk Kramat Jati',
        date: '2026-10-23',
        purchaseCategory: 'Sayuran Umbi dan Buah',
        subtotal: 2800000,
        discount: 0,
        shippingCost: 0,
        totalAmount: 2800000,
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        status: 'RECEIVED',
        isDemo: true,
        notes: 'Pasokan kentang, jagung, dan wortel akhir Oktober',
        createdAt: '2026-10-23T07:30:00.000Z',
        items: [
          { productId: 'ken_01', productName: 'Kentang', categoryName: 'Sayuran Umbi dan Buah', quantity: 80, unit: 'Kilogram', costPrice: 14000, subtotal: 1120000 },
          { productId: 'wor_01', productName: 'Wortel', categoryName: 'Sayuran Umbi dan Buah', quantity: 100, unit: 'Kilogram', costPrice: 9000, subtotal: 900000 },
          { productId: 'jag_01', productName: 'Jagung Manis', categoryName: 'Sayuran Umbi dan Buah', quantity: 278.57, unit: 'Buah', costPrice: 2800, subtotal: 780000 }
        ]
      });

      // Period 5: November 2026 (Nov 1 to Nov 8, 2026) (Exact total = Rp 1.850.000)
      // Transaction 1: 03 Nov 2026 - Rp 1.050.000
      // Transaction 2: 07 Nov 2026 - Rp 800.000
      const refNov1 = doc(collection(db, 'purchases'));
      batch.set(refNov1, {
        id: refNov1.id,
        businessId,
        purchaseNumber: 'PB-261103-0501',
        invoiceNumber: 'INV/LEM/2026/11/014',
        supplierId: 'sup_lembang',
        supplierName: 'Kelompok Tani Sayur Lembang',
        date: '2026-11-03',
        purchaseCategory: 'Sayuran Daun',
        subtotal: 1050000,
        discount: 0,
        shippingCost: 0,
        totalAmount: 1050000,
        paymentStatus: 'PAID',
        paymentMethod: 'TRANSFER',
        status: 'RECEIVED',
        isDemo: true,
        notes: 'Kulakan awal November sayur daun',
        createdAt: '2026-11-03T06:00:00.000Z',
        items: [
          { productId: 'bay_01', productName: 'Bayam', categoryName: 'Sayuran Daun', quantity: 200, unit: 'Ikat', costPrice: 2000, subtotal: 400000 },
          { productId: 'kan_01', productName: 'Kangkung', categoryName: 'Sayuran Daun', quantity: 200, unit: 'Ikat', costPrice: 1800, subtotal: 360000 },
          { productId: 'pak_01', productName: 'Pakcoy', categoryName: 'Sayuran Daun', quantity: 36.25, unit: 'Kilogram', costPrice: 8000, subtotal: 290000 }
        ]
      });

      const refNov2 = doc(collection(db, 'purchases'));
      batch.set(refNov2, {
        id: refNov2.id,
        businessId,
        purchaseNumber: 'PB-261107-0502',
        invoiceNumber: 'INV/KJ/2026/11/089',
        supplierId: 'sup_kramatjati',
        supplierName: 'Grosir Sayur Induk Kramat Jati',
        date: '2026-11-07',
        purchaseCategory: 'Sayuran Umbi dan Buah',
        subtotal: 800000,
        discount: 0,
        shippingCost: 0,
        totalAmount: 800000,
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        status: 'RECEIVED',
        isDemo: true,
        notes: 'Kulakan segar tomat dan cabai 7 November 2026',
        createdAt: '2026-11-07T07:00:00.000Z',
        items: [
          { productId: 'tom_01', productName: 'Tomat', categoryName: 'Sayuran Umbi dan Buah', quantity: 40, unit: 'Kilogram', costPrice: 9000, subtotal: 360000 },
          { productId: 'cab_01', productName: 'Cabai Rawit', categoryName: 'Sayuran Umbi dan Buah', quantity: 9.77, unit: 'Kilogram', costPrice: 45000, subtotal: 440000 }
        ]
      });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'purchases');
    }
  },

  /**
   * REMOVE ALL DEMO PURCHASES INDEPENDENTLY
   */
  async deleteDemoPurchases(businessId: string): Promise<void> {
    try {
      let snapshot;
      try {
        const q = query(
          collection(db, 'purchases'),
          where('businessId', '==', businessId),
          where('isDemo', '==', true)
        );
        snapshot = await getDocs(q);
      } catch (err) {
        const fallbackQ = query(collection(db, 'purchases'), where('isDemo', '==', true));
        snapshot = await getDocs(fallbackQ);
      }
      const batch = writeBatch(db);
      snapshot.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    } catch (error) {
      console.warn('Error deleting demo purchases:', error);
    }
  },

  /**
   * EXPORT PURCHASE REPORT TO CSV / EXCEL FORMAT
   */
  exportToCsv(params: {
    storeName: string;
    periodLabel: string;
    purchases: Purchase[];
    summary: PurchaseAnalyticsSummary;
  }): void {
    const { storeName, periodLabel, purchases, summary } = params;
    const nowStr = new Date().toLocaleString('id-ID');

    let csvContent = `\uFEFF`; // UTF-8 BOM
    csvContent += `LAPORAN PEMBELIAN & KULAKAN SAYURKU\n`;
    csvContent += `Nama Usaha: "${storeName}"\n`;
    csvContent += `Periode Laporan: "${periodLabel}"\n`;
    csvContent += `Waktu Dicetak: "${nowStr}"\n\n`;

    // Ringkasan
    csvContent += `RINGKASAN PEMBELIAN\n`;
    csvContent += `Total Belanja Kulakan;${summary.totalPurchaseAmount}\n`;
    csvContent += `Jumlah Transaksi;${summary.totalTransactionsCount}\n`;
    csvContent += `Rata-rata per Transaksi;${summary.averageTransactionAmount}\n`;
    csvContent += `Jumlah Pemasok;${summary.totalSuppliersCount}\n\n`;

    // Rincian Transaksi
    csvContent += `RINCIAN TRANSAKSI PEMBELIAN\n`;
    csvContent += `Tanggal;No. Pembelian;No. Faktur;Pemasok;Kategori;Status Bayar;Metode;Jumlah Item;Total Pembelian (Rp);Catatan\n`;

    purchases.forEach(p => {
      const itemCount = p.items ? p.items.length : 0;
      csvContent += `"${p.date}";"${p.purchaseNumber}";"${p.invoiceNumber || '-'}";"${p.supplierName}";"${p.purchaseCategory || '-'};"${p.paymentStatus || 'PAID'}";"${p.paymentMethod || 'TRANSFER'}";${itemCount};${p.totalAmount};"${p.notes || ''}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Pembelian_SAYURKU_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
