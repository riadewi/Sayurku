import React, { useMemo } from 'react';
import { Product, Sale, Expense } from '../types';
import { formatRupiah, formatNumber, formatDateIndo } from '../lib/utils';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  Package, 
  Layers, 
  ArrowUpRight, 
  CheckCircle2, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  onNavigate: (tab: NavTab) => void;
  onSeedData: () => Promise<void>;
  isSeeding: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  sales,
  expenses,
  onNavigate,
  onSeedData,
  isSeeding
}) => {
  // Today's date string YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's completed sales
  const todaySales = useMemo(() => {
    return sales.filter(s => s.status === 'COMPLETED' && s.date === todayStr);
  }, [sales, todayStr]);

  // Today's expenses
  const todayExpenses = useMemo(() => {
    return expenses.filter(e => e.date === todayStr);
  }, [expenses, todayStr]);

  // Today's metrics
  const todayRevenue = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + s.finalTotal, 0);
  }, [todaySales]);

  const todayTransactionsCount = todaySales.length;

  const todayHpp = useMemo(() => {
    return todaySales.reduce((sum, s) => sum + s.totalCost, 0);
  }, [todaySales]);

  const todayGrossProfit = todayRevenue - todayHpp;

  const todayExpenseAmount = useMemo(() => {
    return todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [todayExpenses]);

  const todayNetProfit = todayGrossProfit - todayExpenseAmount;

  // Low stock products (only SINGLE products or active products where stock <= minStock)
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.isActive && p.type === 'SINGLE' && p.currentStock <= p.minStock);
  }, [products]);

  // Best selling products (all completed sales)
  const bestSellers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; quantity: number; unit: string; totalRevenue: number }>();
    
    sales.filter(s => s.status === 'COMPLETED').forEach(s => {
      s.items.forEach(it => {
        const existing = map.get(it.productId);
        if (existing) {
          existing.quantity += it.quantity;
          existing.totalRevenue += it.subtotal;
        } else {
          map.set(it.productId, {
            id: it.productId,
            name: it.productName,
            quantity: it.quantity,
            unit: it.unit,
            totalRevenue: it.subtotal
          });
        }
      });
    });

    return Array.from(map.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [sales]);

  // Last 7 days sales chart data
  const chartData = useMemo(() => {
    const days: { date: string; displayDate: string; omzet: number; labaKotor: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const display = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'numeric' });
      
      const daySales = sales.filter(s => s.status === 'COMPLETED' && s.date === dStr);
      const omzet = daySales.reduce((sum, s) => sum + s.finalTotal, 0);
      const hpp = daySales.reduce((sum, s) => sum + s.totalCost, 0);
      const labaKotor = omzet - hpp;

      days.push({
        date: dStr,
        displayDate: display,
        omzet,
        labaKotor
      });
    }
    return days;
  }, [sales]);

  return (
    <div className="space-y-6">
      {/* Welcome / Empty Data Prompt */}
      {products.length === 0 && (
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Memulai Usaha Sayur Anda</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Selamat Datang di SAYURKU!</h2>
            <p className="text-emerald-100 text-sm max-w-xl">
              Basis data produk Anda masih kosong. Anda dapat langsung memasukkan data sayur sendiri atau memuat data contoh sayur Indonesia lengkap dengan racikan paket bundling (Sayur Sop, Sayur Asem, Tumis Kangkung) hanya dengan sekali klik.
            </p>
          </div>
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="whitespace-nowrap px-6 py-3.5 bg-white text-emerald-800 hover:bg-emerald-50 rounded-xl font-bold text-sm shadow-md transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isSeeding ? 'Memuat Data Contoh...' : '🌱 Muat Data Contoh Sayuran'}
          </button>
        </div>
      )}

      {/* Main KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penjualan Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Penjualan Hari Ini
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {formatRupiah(todayRevenue)}
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <span>{todayTransactionsCount} transaksi hari ini</span>
              <button 
                onClick={() => onNavigate('pos')}
                className="text-emerald-600 font-semibold hover:underline inline-flex items-center"
              >
                Buka Kasir <ArrowUpRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Total HPP Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total HPP (Modal)
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {formatRupiah(todayHpp)}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Biaya modal pokok sayur terjual
            </p>
          </div>
        </div>

        {/* Estimasi Laba Kotor */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Estimasi Laba Kotor
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-blue-600 tracking-tight">
              {formatRupiah(todayGrossProfit)}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Omzet dikurangi HPP sayur
            </p>
          </div>
        </div>

        {/* Estimasi Laba Bersih */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Estimasi Laba Bersih
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold tracking-tight ${todayNetProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
              {formatRupiah(todayNetProfit)}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Setelah biaya ops ({formatRupiah(todayExpenseAmount)})
            </p>
          </div>
        </div>
      </div>

      {/* Sales Chart Section */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Tren Penjualan 7 Hari Terakhir
            </h3>
            <p className="text-xs text-gray-500">
              Grafik perbandingan omzet penjualan dan estimasi laba kotor harian
            </p>
          </div>
          <div className="flex items-center space-x-4 text-xs font-medium">
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-gray-600">Omzet Penjualan</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-gray-600">Laba Kotor</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOmzet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorLaba" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => `Rp ${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
              />
              <Tooltip 
                formatter={(val: any) => [formatRupiah(Number(val)), '']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Area type="monotone" dataKey="omzet" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOmzet)" name="Omzet" />
              <Area type="monotone" dataKey="labaKotor" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLaba)" name="Laba Kotor" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Column Section: Low Stock & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stok Menipis */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Peringatan Stok Menipis</h3>
                <p className="text-xs text-gray-500">Sayur yang perlu segera dikulak / ditambah</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Lihat Semua
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-sm font-medium text-gray-600">Semua stok sayuran dalam kondisi aman!</p>
                <p className="text-xs text-gray-400">Tidak ada sayur yang berada di bawah batas minimum.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        Kategori: {p.category} | Min. Stok: {p.minStock} {p.baseUnit}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg bg-red-100 text-red-700">
                        Sisa: {formatNumber(p.currentStock)} {p.baseUnit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Produk Paling Laris */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Produk Paling Laris</h3>
                <p className="text-xs text-gray-500">Sayuran dengan volume penjualan tertinggi</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('reports')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
            >
              Lihat Laporan
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {bestSellers.length === 0 ? (
              <div className="py-8 text-center text-gray-400">
                <ShoppingCart className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-600">Belum ada data transaksi penjualan</p>
                <p className="text-xs text-gray-400">Catat transaksi pertama Anda di menu Kasir.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {bestSellers.map((item, idx) => (
                  <div key={item.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          Total omzet: {formatRupiah(item.totalRevenue)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">
                        {formatNumber(item.quantity)} {item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
