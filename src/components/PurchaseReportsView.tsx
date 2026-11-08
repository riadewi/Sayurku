import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Truck, 
  TrendingDown, 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  Search, 
  Database, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  Package, 
  DollarSign, 
  Store,
  Layers,
  ArrowUpDown,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { Purchase, PurchaseItem, Supplier } from '../types';
import { formatRupiah, formatNumber, formatDateIndo } from '../lib/utils';
import { purchaseAnalyticsService } from '../services/purchaseAnalyticsService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface PurchaseReportsViewProps {
  purchases: Purchase[];
  suppliers: Supplier[];
  onRefresh: () => void;
}

type PeriodType = 'HARIAN' | 'MINGGUAN' | 'BULANAN' | 'TAHUNAN' | 'SEMUA' | 'CUSTOM';

const COLORS = ['#059669', '#10b981', '#34d399', '#0d9488', '#0284c7', '#f59e0b', '#8b5cf6', '#ec4899'];

export const PurchaseReportsView: React.FC<PurchaseReportsViewProps> = ({
  purchases,
  suppliers,
  onRefresh
}) => {
  const { businessId, storeProfile } = useAuth();
  const { toast, confirmAction } = useToast();

  // Period Filter State
  const [periodType, setPeriodType] = useState<PeriodType>('SEMUA');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Table Search, Filter, Sort, Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('Semua');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('Semua');
  const [sortField, setSortField] = useState<'date' | 'totalAmount' | 'supplierName'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Selected purchase for details modal
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);

  // Demo data loading & deletion state
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [isDeletingDemo, setIsDeletingDemo] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Has demo data loaded?
  const hasDemoPurchases = useMemo(() => {
    return purchases.some(p => p.isDemo === true);
  }, [purchases]);

  // 1. Filter purchases based on Date Period
  const periodFilteredPurchases = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return purchases.filter(p => {
      const pDate = p.date;
      if (!pDate) return true;

      if (periodType === 'HARIAN') {
        return pDate === todayStr;
      }
      if (periodType === 'MINGGUAN') {
        const pDateTime = new Date(pDate).getTime();
        const sevenDaysAgo = now.getTime() - (7 * 24 * 60 * 60 * 1000);
        return pDateTime >= sevenDaysAgo;
      }
      if (periodType === 'BULANAN') {
        // Current month YYYY-MM
        const currentMonthPrefix = todayStr.substring(0, 7);
        return pDate.startsWith(currentMonthPrefix);
      }
      if (periodType === 'TAHUNAN') {
        const currentYearPrefix = todayStr.substring(0, 4);
        return pDate.startsWith(currentYearPrefix);
      }
      if (periodType === 'CUSTOM') {
        if (startDate && pDate < startDate) return false;
        if (endDate && pDate > endDate) return false;
        return true;
      }
      return true; // 'SEMUA'
    });
  }, [purchases, periodType, startDate, endDate]);

  // 2. Compute Analytics from Date-filtered Purchases
  const analytics = useMemo(() => {
    return purchaseAnalyticsService.computeAnalytics(periodFilteredPurchases);
  }, [periodFilteredPurchases]);

  // 3. Table Filtering (Search, Supplier, Category, Payment Status)
  const tableFilteredPurchases = useMemo(() => {
    return periodFilteredPurchases.filter(p => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        !searchTerm ||
        p.purchaseNumber.toLowerCase().includes(search) ||
        (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(search)) ||
        p.supplierName.toLowerCase().includes(search) ||
        (p.notes && p.notes.toLowerCase().includes(search));

      // Supplier
      const matchSupplier = selectedSupplier === 'Semua' || p.supplierName === selectedSupplier;

      // Category
      const matchCategory = selectedCategory === 'Semua' || p.purchaseCategory === selectedCategory;

      // Payment Status
      const matchStatus = selectedPaymentStatus === 'Semua' || p.paymentStatus === selectedPaymentStatus;

      return matchSearch && matchSupplier && matchCategory && matchStatus;
    });
  }, [periodFilteredPurchases, searchTerm, selectedSupplier, selectedCategory, selectedPaymentStatus]);

  // 4. Sort Table Purchases
  const sortedPurchases = useMemo(() => {
    return [...tableFilteredPurchases].sort((a, b) => {
      let valA: any = a[sortField] || '';
      let valB: any = b[sortField] || '';

      if (sortField === 'totalAmount') {
        valA = a.totalAmount;
        valB = b.totalAmount;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tableFilteredPurchases, sortField, sortDirection]);

  // 5. Pagination
  const totalPages = Math.ceil(sortedPurchases.length / itemsPerPage) || 1;
  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedPurchases.slice(start, start + itemsPerPage);
  }, [sortedPurchases, currentPage]);

  const handleSort = (field: 'date' | 'totalAmount' | 'supplierName') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Seed Demo Purchases Action
  const handleSeedDemoData = async () => {
    if (!businessId) return;
    setIsSeedingDemo(true);
    setActionSuccessMsg(null);
    try {
      await purchaseAnalyticsService.seedDemoPurchaseData(businessId);
      onRefresh();
      setActionSuccessMsg('Data demo pembelian (Juli - Nov 2026) berhasil dimuat! Total pasokan Rp 21.645.000.');
      setTimeout(() => setActionSuccessMsg(null), 6000);
      toast('Data demo pembelian 5 periode berhasil dimuat!', 'success');
    } catch (err: any) {
      toast('Gagal memuat data demo: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSeedingDemo(false);
    }
  };

  // Delete Demo Purchases Action
  const handleDeleteDemoData = async () => {
    if (!businessId) return;
    const ok = await confirmAction(
      'Yakin ingin menghapus semua data transaksi demo pembelian? Data pembelian riil Anda tidak akan terhapus.',
      'Hapus Data Demo Pembelian'
    );
    if (!ok) return;

    setIsDeletingDemo(true);
    setActionSuccessMsg(null);
    try {
      await purchaseAnalyticsService.deleteDemoPurchases(businessId);
      onRefresh();
      setActionSuccessMsg('Semua data demo pembelian berhasil dihapus secara bersih.');
      setTimeout(() => setActionSuccessMsg(null), 5000);
      toast('Semua data demo pembelian berhasil dihapus.', 'info');
    } catch (err: any) {
      toast('Gagal menghapus data demo: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsDeletingDemo(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const periodLabel = periodType === 'CUSTOM'
      ? `${startDate || 'Awal'} s/d ${endDate || 'Sekarang'}`
      : periodType;

    purchaseAnalyticsService.exportToCsv({
      storeName: storeProfile?.storeName || 'Kios Sayur Segar SAYURKU',
      periodLabel,
      purchases: sortedPurchases,
      summary: analytics
    });
  };

  // Print layout
  const handlePrint = () => {
    window.print();
  };

  // Unique categories in purchases for filter
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach(p => {
      if (p.purchaseCategory) set.add(p.purchaseCategory);
    });
    return Array.from(set);
  }, [purchases]);

  // Unique suppliers in purchases for filter
  const supplierOptions = useMemo(() => {
    const set = new Set<string>();
    purchases.forEach(p => {
      if (p.supplierName) set.add(p.supplierName);
    });
    return Array.from(set);
  }, [purchases]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/20 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold backdrop-blur-xs border border-emerald-400/30">
              <Truck className="w-3.5 h-3.5" />
              <span>Modul Analisis Pembelian & Kulakan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Laporan Pembelian Sayur
            </h1>
            <p className="text-emerald-100/90 text-sm max-w-xl">
              Pantau pengeluaran belanja pasokan sayuran, evaluasi tren harga kulakan dari supplier, serta analisis riwayat transaksi berkala.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 shadow-md transition flex items-center space-x-2"
              title="Unduh laporan dalam format CSV (Excel)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Ekspor Excel (CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm border border-emerald-500/40 shadow-sm transition flex items-center space-x-2"
            >
              <Printer className="w-4 h-4 text-emerald-200" />
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Demo Data Management Strip */}
        <div className="mt-6 pt-5 border-t border-emerald-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-emerald-200">
            <Database className="w-4 h-4 text-emerald-300" />
            <span>
              {hasDemoPurchases ? (
                <span className="font-medium text-emerald-200">
                  Data demo terpasang (Rekonsiliasi Juli - Nov 2026: <strong className="text-white">Rp 21.645.000</strong>)
                </span>
              ) : (
                <span>Data demo belum dimuat. Anda dapat memuat simulasi data pembelian 5 bulan.</span>
              )}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {!hasDemoPurchases ? (
              <button
                onClick={handleSeedDemoData}
                disabled={isSeedingDemo}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSeedingDemo ? 'animate-spin' : ''}`} />
                <span>{isSeedingDemo ? 'Memuat...' : 'Muat Data Demo (Juli-Nov 2026)'}</span>
              </button>
            ) : (
              <button
                onClick={handleDeleteDemoData}
                disabled={isDeletingDemo}
                className="px-3 py-1.5 rounded-lg bg-red-500/80 hover:bg-red-500 text-white font-bold transition flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
              >
                <Trash2 className={`w-3.5 h-3.5 ${isDeletingDemo ? 'animate-spin' : ''}`} />
                <span>{isDeletingDemo ? 'Menghapus...' : 'Hapus Data Demo'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Notification Alert */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar: Time Periods */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span className="text-xs sm:text-sm font-bold text-gray-800">Pilih Periode Waktu Laporan:</span>
          </div>

          {/* Period Selector Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(['SEMUA', 'HARIAN', 'MINGGUAN', 'BULANAN', 'TAHUNAN', 'CUSTOM'] as PeriodType[]).map((type) => (
              <button
                key={type}
                onClick={() => setPeriodType(type)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  periodType === type 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'SEMUA' && 'Semua Periode'}
                {type === 'HARIAN' && 'Hari Ini'}
                {type === 'MINGGUAN' && '7 Hari Terakhir'}
                {type === 'BULANAN' && 'Bulan Ini'}
                {type === 'TAHUNAN' && 'Tahun Ini'}
                {type === 'CUSTOM' && 'Rentang Khusus'}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Selector */}
        {periodType === 'CUSTOM' && (
          <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-gray-500 font-medium">Dari Tanggal:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-gray-500 font-medium">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* 4 Summary Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Purchase */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total Belanja Kulakan</p>
            <p className="text-lg sm:text-xl font-extrabold text-gray-900 mt-0.5">
              {formatRupiah(analytics.totalPurchaseAmount)}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              {periodFilteredPurchases.length} transaksi tercatat
            </p>
          </div>
        </div>

        {/* Metric 2: Transaction Count */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-700">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Jumlah Transaksi</p>
            <p className="text-lg sm:text-xl font-extrabold text-gray-900 mt-0.5">
              {formatNumber(analytics.totalTransactionsCount)} Faktur
            </p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Penerimaan kulakan toko
            </p>
          </div>
        </div>

        {/* Metric 3: Active Suppliers */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-700">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Jumlah Pemasok</p>
            <p className="text-lg sm:text-xl font-extrabold text-gray-900 mt-0.5">
              {analytics.totalSuppliersCount} Pemasok
            </p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Mitra petani & grosir aktif
            </p>
          </div>
        </div>

        {/* Metric 4: Average per Transaction */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Rata-rata per Transaksi</p>
            <p className="text-lg sm:text-xl font-extrabold text-gray-900 mt-0.5">
              {formatRupiah(analytics.averageTransactionAmount)}
            </p>
            <p className="text-[11px] text-purple-600 font-medium mt-0.5">
              Nilai per faktur kulakan
            </p>
          </div>
        </div>
      </div>

      {/* 5 Recharts Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Monthly Purchase Bar Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Grafik Batang Pembelian Bulanan
              </h3>
              <p className="text-xs text-gray-500">
                Total belanja kulakan per bulan (termasuk rekonsiliasi data demo)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold">
              Bar Chart
            </span>
          </div>
          <div className="h-72 w-full">
            {analytics.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                  <YAxis 
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`} 
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatRupiah(Number(value)), 'Total Pembelian']}
                    labelStyle={{ fontWeight: 'bold', color: '#064e3b' }}
                  />
                  <Bar dataKey="totalAmount" fill="#059669" radius={[6, 6, 0, 0]} name="Total Pembelian" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Tidak ada data pembelian pada periode ini
              </div>
            )}
          </div>
        </div>

        {/* CHART 2: Trend Line Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Grafik Garis Tren Pembelian
              </h3>
              <p className="text-xs text-gray-500">
                Dinamika pergerakan biaya pasokan dan volume transaksi
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold">
              Line Chart
            </span>
          </div>
          <div className="h-72 w-full">
            {analytics.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyTrend} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} />
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`}
                    tick={{ fontSize: 11 }} 
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tickFormatter={(val) => `${val} tx`} 
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      name === 'Total Pembelian' ? formatRupiah(Number(value)) : `${value} transaksi`,
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="totalAmount" 
                    stroke="#059669" 
                    strokeWidth={3} 
                    dot={{ r: 5, fill: '#059669' }} 
                    name="Total Pembelian" 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="transactionsCount" 
                    stroke="#0284c7" 
                    strokeWidth={2} 
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: '#0284c7' }} 
                    name="Jumlah Transaksi" 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Tidak ada data pembelian pada periode ini
              </div>
            )}
          </div>
        </div>

        {/* CHART 3: Category Breakdown Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Pembelian Berdasarkan Kategori
              </h3>
              <p className="text-xs text-gray-500">
                Distribusi biaya belanja kulakan per kategori produk sayur
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold">
              Kategori
            </span>
          </div>
          <div className="h-72 w-full">
            {analytics.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical"
                  data={analytics.categoryBreakdown} 
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis 
                    type="number"
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`} 
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis type="category" dataKey="categoryName" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: any) => [formatRupiah(Number(value)), 'Total Pembelian']}
                  />
                  <Bar dataKey="totalAmount" fill="#0d9488" radius={[0, 6, 6, 0]}>
                    {analytics.categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Tidak ada data kategori pada periode ini
              </div>
            )}
          </div>
        </div>

        {/* CHART 4: Supplier Breakdown Chart */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Pembelian Berdasarkan Pemasok
              </h3>
              <p className="text-xs text-gray-500">
                Alokasi belanja kulakan ke masing-masing supplier
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold">
              Pemasok
            </span>
          </div>
          <div className="h-72 w-full">
            {analytics.supplierBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.supplierBreakdown} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="supplierName" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis 
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`} 
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatRupiah(Number(value)), 'Total Belanja']}
                  />
                  <Bar dataKey="totalAmount" fill="#d97706" radius={[6, 6, 0, 0]} name="Total Belanja" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Tidak ada data pemasok pada periode ini
              </div>
            )}
          </div>
        </div>

        {/* CHART 5: Top 10 Purchased Products (Spans full width) */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">
                Top 10 Produk Paling Banyak Dibeli (Kulakan Terbesar)
              </h3>
              <p className="text-xs text-gray-500">
                Sayuran dengan nilai pengeluaran pembelian tertinggi
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold">
              10 Teratas
            </span>
          </div>
          <div className="h-72 w-full">
            {analytics.topPurchasedProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical"
                  data={analytics.topPurchasedProducts} 
                  margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(val) => `Rp ${(val / 1000000).toFixed(1)}jt`} 
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis type="category" dataKey="productName" width={130} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: any, name: any, props: any) => [
                      `${formatRupiah(Number(value))} (${props.payload.quantity} ${props.payload.unit})`,
                      'Nilai Pembelian'
                    ]}
                  />
                  <Bar dataKey="totalAmount" fill="#7c3aed" radius={[0, 6, 6, 0]} name="Nilai Pembelian" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Belum ada rincian item pembelian pada periode ini
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Purchase History Table & Search / Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">
              Riwayat Transaksi Pembelian Sayur
            </h3>
            <p className="text-xs text-gray-500">
              Menampilkan {tableFilteredPurchases.length} faktur pembelian
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari faktur, pemasok..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Supplier Filter */}
            <select
              value={selectedSupplier}
              onChange={(e) => {
                setSelectedSupplier(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Pemasok</option>
              {supplierOptions.map((sup) => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Kategori</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedPaymentStatus}
              onChange={(e) => {
                setSelectedPaymentStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Semua">Semua Status Bayar</option>
              <option value="PAID">Lunas (PAID)</option>
              <option value="PENDING">Belum Lunas (PENDING)</option>
              <option value="PARTIAL">Cicilan (PARTIAL)</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-600 font-semibold">
                <th className="py-3 px-4">
                  <button 
                    onClick={() => handleSort('date')}
                    className="flex items-center space-x-1 hover:text-emerald-700"
                  >
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">No. Transaksi / Faktur</th>
                <th className="py-3 px-4">
                  <button 
                    onClick={() => handleSort('supplierName')}
                    className="flex items-center space-x-1 hover:text-emerald-700"
                  >
                    <span>Pemasok</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Status & Metode</th>
                <th className="py-3 px-4 text-right">
                  <button 
                    onClick={() => handleSort('totalAmount')}
                    className="flex items-center space-x-1 justify-end hover:text-emerald-700 w-full"
                  >
                    <span>Total Belanja</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPurchases.length > 0 ? (
                paginatedPurchases.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-3 px-4 font-medium text-gray-900 whitespace-nowrap">
                        {p.date ? formatDateIndo(p.date) : '-'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-emerald-900">{p.purchaseNumber}</div>
                        {p.invoiceNumber && (
                          <div className="text-[10px] text-gray-500">Fak: {p.invoiceNumber}</div>
                        )}
                        {p.isDemo && (
                          <span className="inline-block px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-700 font-bold text-[9px] mt-0.5">
                            DEMO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800">{p.supplierName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-semibold">
                          {p.purchaseCategory || 'Sayuran'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.paymentStatus === 'PARTIAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {p.paymentStatus === 'PAID' ? 'Lunas' : p.paymentStatus === 'PARTIAL' ? 'Cicilan' : 'Belum Bayar'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-medium uppercase">
                            ({p.paymentMethod || 'TRANSFER'})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900 whitespace-nowrap">
                        {formatRupiah(p.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedPurchase(p)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 font-medium transition inline-flex items-center space-x-1"
                          title="Lihat rincian item pembelian"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Rincian</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    Tidak ada transaksi pembelian yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div>
            Halaman {currentPage} dari {totalPages} (Total {sortedPurchases.length} transaksi)
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detail Item Pembelian */}
      {selectedPurchase && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-base leading-tight">
                    Rincian Faktur Pembelian
                  </h3>
                  <p className="text-xs text-emerald-800 font-semibold">
                    {selectedPurchase.purchaseNumber} • {selectedPurchase.supplierName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPurchase(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <div>
                  <span className="text-gray-500">Tanggal Transaksi:</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedPurchase.date ? formatDateIndo(selectedPurchase.date) : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">No. Faktur Supplier:</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedPurchase.invoiceNumber || '-'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Kategori:</span>
                  <p className="font-bold text-gray-900 mt-0.5">
                    {selectedPurchase.purchaseCategory || 'Sayuran'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Status Pembayaran:</span>
                  <p className="font-bold text-emerald-800 mt-0.5">
                    {selectedPurchase.paymentStatus === 'PAID' ? 'LUNAS' : selectedPurchase.paymentStatus} ({selectedPurchase.paymentMethod || 'TRANSFER'})
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h4 className="font-bold text-gray-800 mb-2">Item Sayuran yang Dibeli:</h4>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-semibold">
                      <tr>
                        <th className="p-2.5">Sayuran</th>
                        <th className="p-2.5 text-right">Jumlah</th>
                        <th className="p-2.5 text-right">Harga Kulakan</th>
                        <th className="p-2.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedPurchase.items && selectedPurchase.items.length > 0 ? (
                        selectedPurchase.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-2.5 font-medium text-gray-900">
                              {it.productName}
                              {it.categoryName && (
                                <span className="block text-[10px] text-gray-400">
                                  {it.categoryName}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-medium text-gray-700">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="p-2.5 text-right text-gray-600">
                              {formatRupiah(it.costPrice)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-emerald-900">
                              {formatRupiah(it.subtotal)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-3 text-center text-gray-400">
                            Tidak ada rincian item.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-100">
                      <tr>
                        <td colSpan={3} className="p-2.5 text-right text-gray-700">
                          Total Pembelian:
                        </td>
                        <td className="p-2.5 text-right text-emerald-800 text-sm">
                          {formatRupiah(selectedPurchase.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Notes */}
              {selectedPurchase.notes && (
                <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-100 text-amber-900">
                  <span className="font-semibold block text-[11px] text-amber-800">Catatan Kulakan:</span>
                  <p className="mt-0.5">{selectedPurchase.notes}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedPurchase(null)}
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
