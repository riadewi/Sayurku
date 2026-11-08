import React, { useState, useMemo } from 'react';
import { Sale, Expense, Product } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, formatDateTimeIndo } from '../lib/utils';
import { salesService } from '../services/salesService';
import { useAuth } from '../contexts/AuthContext';
import { 
  BarChart3, 
  Search, 
  Calendar, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Receipt, 
  RotateCcw,
  ShoppingBag,
  Download,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

interface ReportsViewProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  onOpenReceipt: (sale: Sale) => void;
  onRefresh: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  sales,
  expenses,
  products,
  onOpenReceipt,
  onRefresh
}) => {
  const { user } = useAuth();
  // Filter period presets: 'TODAY' | 'WEEK' | 'MONTH' | 'ALL' | 'CUSTOM'
  const [periodPreset, setPeriodPreset] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'ALL' | 'CUSTOM'>('MONTH');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'CANCELLED'>('ALL');

  // Cancel Sale Modal
  const [cancelModalSale, setCancelModalSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Set date ranges when preset changes
  const activeRange = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (periodPreset === 'TODAY') {
      return { start: todayStr, end: todayStr };
    }
    if (periodPreset === 'WEEK') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return { start: d.toISOString().split('T')[0], end: todayStr };
    }
    if (periodPreset === 'MONTH') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return { start: d.toISOString().split('T')[0], end: todayStr };
    }
    if (periodPreset === 'CUSTOM') {
      return { start: startDate, end: endDate };
    }
    return { start: '', end: '' }; // ALL
  }, [periodPreset, startDate, endDate]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      // Date filter
      if (activeRange.start && s.date < activeRange.start) return false;
      if (activeRange.end && s.date > activeRange.end) return false;

      // Status filter
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false;

      // Search term
      if (searchTerm) {
        const matchNo = s.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());
        const matchCust = s.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchProd = s.items.some(it => it.productName.toLowerCase().includes(searchTerm.toLowerCase()));
        if (!matchNo && !matchCust && !matchProd) return false;
      }

      return true;
    });
  }, [sales, activeRange, statusFilter, searchTerm]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (activeRange.start && e.date < activeRange.start) return false;
      if (activeRange.end && e.date > activeRange.end) return false;
      return true;
    });
  }, [expenses, activeRange]);

  // Financial calculations for completed sales
  const completedSales = useMemo(() => {
    return filteredSales.filter(s => s.status === 'COMPLETED');
  }, [filteredSales]);

  const totalRevenue = useMemo(() => {
    return completedSales.reduce((sum, s) => sum + s.finalTotal, 0);
  }, [completedSales]);

  const totalCost = useMemo(() => {
    return completedSales.reduce((sum, s) => sum + s.totalCost, 0);
  }, [completedSales]);

  const grossProfit = totalRevenue - totalCost;

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const netProfit = grossProfit - totalExpenseAmount;

  // Best sellers in selected period
  const bestSellers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; quantity: number; unit: string; totalOmzet: number }>();

    completedSales.forEach(s => {
      s.items.forEach(it => {
        const existing = map.get(it.productId);
        if (existing) {
          existing.quantity += it.quantity;
          existing.totalOmzet += it.subtotal;
        } else {
          map.set(it.productId, {
            id: it.productId,
            name: it.productName,
            quantity: it.quantity,
            unit: it.unit,
            totalOmzet: it.subtotal
          });
        }
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [completedSales]);

  // Aggregate daily bar chart data (last 7 or 14 points)
  const chartData = useMemo(() => {
    // Group completed sales and expenses by date
    const dateMap = new Map<string, { date: string; omzet: number; hpp: number; biaya: number; labaBersih: number }>();

    completedSales.forEach(s => {
      const cur = dateMap.get(s.date) || { date: s.date, omzet: 0, hpp: 0, biaya: 0, labaBersih: 0 };
      cur.omzet += s.finalTotal;
      cur.hpp += s.totalCost;
      dateMap.set(s.date, cur);
    });

    filteredExpenses.forEach(e => {
      const cur = dateMap.get(e.date) || { date: e.date, omzet: 0, hpp: 0, biaya: 0, labaBersih: 0 };
      cur.biaya += e.amount;
      dateMap.set(e.date, cur);
    });

    // Compute net profit for each date
    const arr = Array.from(dateMap.values()).map(d => ({
      ...d,
      displayDate: formatDateIndo(d.date),
      labaBersih: (d.omzet - d.hpp) - d.biaya
    }));

    return arr.sort((a, b) => a.date.localeCompare(b.date)).slice(-10);
  }, [completedSales, filteredExpenses]);

  // Handle cancel sale confirmation
  const handleConfirmCancel = async () => {
    if (!cancelModalSale) return;
    if (!cancelReason.trim()) {
      setCancelError('Alasan pembatalan wajib diisi.');
      return;
    }

    setIsCancelling(true);
    setCancelError(null);

    try {
      await salesService.cancelSale({
        saleId: cancelModalSale.id,
        userId: user?.uid || 'user',
        reason: cancelReason.trim()
      });

      setCancelModalSale(null);
      setCancelReason('');
      onRefresh();
    } catch (err: any) {
      console.warn('Notice cancelling sale:', err?.message || err);
      setCancelError(err.message || 'Gagal membatalkan transaksi.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Presets Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center space-x-1.5 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriodPreset('TODAY')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodPreset === 'TODAY' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setPeriodPreset('WEEK')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodPreset === 'WEEK' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              onClick={() => setPeriodPreset('MONTH')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodPreset === 'MONTH' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              30 Hari Terakhir
            </button>
            <button
              onClick={() => setPeriodPreset('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodPreset === 'ALL' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua Waktu
            </button>
            <button
              onClick={() => setPeriodPreset('CUSTOM')}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodPreset === 'CUSTOM' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kustom Tanggal
            </button>
          </div>

          {/* Status selector */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white text-gray-700 focus:outline-none"
          >
            <option value="ALL">Semua Status Transaksi</option>
            <option value="COMPLETED">Hanya Berhasil (Completed)</option>
            <option value="CANCELLED">Hanya Dibatalkan (Cancelled)</option>
          </select>
        </div>

        {/* Custom date range picker if active */}
        {periodPreset === 'CUSTOM' && (
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100 text-xs">
            <span className="font-semibold text-gray-600">Dari:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs"
            />
            <span className="font-semibold text-gray-600">Sampai:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs"
            />
          </div>
        )}
      </div>

      {/* Financial Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Penjualan */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Total Omzet
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-gray-900 tracking-tight">
            {formatRupiah(totalRevenue)}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{completedSales.length} transaksi sukses</p>
        </div>

        {/* Total HPP */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              HPP (Modal Sayur)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-gray-900 tracking-tight">
            {formatRupiah(totalCost)}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Berdasarkan HPP historis</p>
        </div>

        {/* Laba Kotor */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Laba Kotor
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-blue-600 tracking-tight">
            {formatRupiah(grossProfit)}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Omzet - HPP Modal</p>
        </div>

        {/* Biaya Operasional */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Biaya Operasional
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="mt-2 text-xl font-extrabold text-red-600 tracking-tight">
            {formatRupiah(totalExpenseAmount)}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">{filteredExpenses.length} pos pengeluaran</p>
        </div>

        {/* Laba Bersih */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Laba Bersih
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className={`mt-2 text-xl font-extrabold tracking-tight ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {formatRupiah(netProfit)}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">Laba Kotor - Biaya Ops</p>
        </div>
      </div>

      {/* Chart & Top Products Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-gray-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Perbandingan Omzet & Laba Bersih Harian
              </h3>
              <p className="text-xs text-gray-500">Grafik ringkasan laporan keuangan</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-xs">
                Belum ada data untuk periode ini
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayDate" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `Rp ${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                  />
                  <Tooltip 
                    formatter={(val: any) => [formatRupiah(Number(val)), '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="omzet" fill="#10b981" name="Omzet Penjualan" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="labaBersih" fill="#0d9488" name="Laba Bersih" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Best Sellers in Period */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex flex-col">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Sayuran Terlaris</h3>
              <p className="text-xs text-gray-500">Pada periode yang dipilih</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {bestSellers.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                Tidak ada data penjualan pada periode ini
              </div>
            ) : (
              bestSellers.map((item, idx) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <p className="text-gray-400 text-[10px]">{formatRupiah(item.totalOmzet)}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-800">
                    {formatNumber(item.quantity)} {item.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden space-y-3">
        <div className="p-4 sm:p-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Riwayat Transaksi Penjualan</h3>
            <p className="text-xs text-gray-500">
              Daftar seluruh nota penjualan dengan rincian laba dan fitur pembatalan (reversal stok)
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor nota atau pelanggan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-5 py-3">No. Nota</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Pelanggan</th>
                <th className="px-4 py-3">Sayuran Terjual</th>
                <th className="px-4 py-3 text-right">Total Belanja</th>
                <th className="px-4 py-3 text-right">Estimasi Laba</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans text-xs">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Receipt className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    Belum ada riwayat transaksi penjualan
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const isCompleted = s.status === 'COMPLETED';
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                        {s.receiptNumber}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                        {formatDateTimeIndo(s.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-gray-800">
                        {s.customerName || 'Pelanggan Umum'}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs">
                        <div className="truncate text-gray-700 font-medium">
                          {s.items.map(it => `${it.productName} (x${it.quantity})`).join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-extrabold text-gray-900 whitespace-nowrap">
                        {formatRupiah(s.finalTotal)}
                        <span className="text-[10px] text-gray-400 block font-normal capitalize">
                          {s.paymentMethod === 'CASH' ? 'Tunai' : 'Transfer'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold whitespace-nowrap">
                        {isCompleted ? (
                          <span className={s.grossProfit >= 0 ? 'text-teal-700' : 'text-red-600'}>
                            +{formatRupiah(s.grossProfit)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {isCompleted ? 'Berhasil' : 'Dibatalkan'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenReceipt(s)}
                            title="Lihat / Cetak Struk"
                            className="p-1 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          {isCompleted && (
                            <button
                              onClick={() => { setCancelModalSale(s); setCancelReason(''); setCancelError(null); }}
                              title="Batalkan Transaksi & Kembalikan Stok"
                              className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Sale Confirmation Modal */}
      {cancelModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-200" />
                <span>Batalkan Penjualan #{cancelModalSale.receiptNumber}</span>
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {cancelError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {cancelError}
                </div>
              )}

              <p className="text-xs text-gray-600 leading-relaxed">
                Pembatalan ini akan secara otomatis <strong>mengembalikan seluruh stok sayuran</strong> (termasuk komponen paket bundling) ke inventaris dan mencatat mutasi audit <span className="font-bold text-teal-800">SALE_REVERSAL</span>.
              </p>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total Transaksi:</span>
                  <span>{formatRupiah(cancelModalSale.finalTotal)}</span>
                </div>
                <div className="text-gray-500 text-[11px]">
                  Barang: {cancelModalSale.items.map(it => `${it.productName} (${it.quantity} ${it.unit})`).join(', ')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alasan Pembatalan Transaksi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pelanggan salah beli sayur, uang kurang, dll"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCancelModalSale(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 rounded-lg"
                >
                  Batal Kembali
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={isCancelling}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  {isCancelling ? 'Membatalkan...' : 'Konfirmasi Batal & Kembalikan Stok'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
