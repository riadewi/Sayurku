import React, { useState, useMemo } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '../lib/utils';
import { expenseService } from '../services/expenseService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Wallet, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  Calendar, 
  Tag, 
  DollarSign, 
  AlertCircle,
  Truck,
  Package,
  Store,
  Zap,
  HelpCircle
} from 'lucide-react';

interface ExpensesViewProps {
  expenses: Expense[];
  onRefresh: () => void;
}

const expenseCategories: ExpenseCategory[] = [
  'Transportasi',
  'Kemasan / Plastik',
  'Retribusi Pasar',
  'Listrik & Air',
  'Gaji / Upah',
  'Lain-lain'
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onRefresh
}) => {
  const { user, businessId } = useAuth();
  const { toast, confirmAction } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('Transportasi');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchCat = selectedCategory === 'Semua' || e.category === selectedCategory;
      const matchSearch = e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.expenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchDate = true;
      if (startDate && e.date < startDate) matchDate = false;
      if (endDate && e.date > endDate) matchDate = false;

      return matchCat && matchSearch && matchDate;
    });
  }, [expenses, selectedCategory, searchTerm, startDate, endDate]);

  const totalExpenseFiltered = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const handleOpenAdd = () => {
    setCategory('Transportasi');
    setAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Nominal biaya pengeluaran harus lebih dari Rp 0.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Keterangan pengeluaran wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await expenseService.addExpense({
        businessId,
        category,
        amount: numAmount,
        date: expenseDate,
        description: description.trim(),
        userId: user?.uid || 'user'
      });

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.warn('Error saving expense:', err?.message || err);
      setErrorMessage(err.message || 'Gagal menyimpan pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (exp: Expense) => {
    const ok = await confirmAction(`Yakin ingin menghapus catatan pengeluaran "${exp.description}" (${formatRupiah(exp.amount)})?`, 'Hapus Pengeluaran');
    if (!ok) return;
    try {
      await expenseService.deleteExpense(exp.id);
      toast('Catatan pengeluaran berhasil dihapus.', 'success');
      onRefresh();
    } catch (err: any) {
      toast('Gagal menghapus: ' + err.message, 'error');
    }
  };

  const getCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'Transportasi': return <Truck className="w-3.5 h-3.5 text-blue-600" />;
      case 'Kemasan / Plastik': return <Package className="w-3.5 h-3.5 text-amber-600" />;
      case 'Retribusi Pasar': return <Store className="w-3.5 h-3.5 text-emerald-600" />;
      case 'Listrik & Air': return <Zap className="w-3.5 h-3.5 text-yellow-600" />;
      default: return <Wallet className="w-3.5 h-3.5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Filter & Action Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search, Category, Date Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari keterangan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-gray-700"
          >
            <option value="Semua">Semua Kategori Biaya</option>
            {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex items-center space-x-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none"
              title="Tanggal Awal"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none"
              title="Tanggal Akhir"
            />
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm transition whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Biaya Operasional</span>
        </button>
      </div>

      {/* Summary Total Card */}
      <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Total Biaya Operasional (Tersaring):</p>
            <h3 className="text-xl font-extrabold text-emerald-950">
              {formatRupiah(totalExpenseFiltered)}
            </h3>
          </div>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          {filteredExpenses.length} catatan biaya
        </span>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-5 py-3.5">No. Biaya</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Keterangan</th>
                <th className="px-4 py-3.5 text-right">Nominal Biaya</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Wallet className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    Belum ada catatan biaya operasional
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3.5 font-bold text-gray-900 text-xs">
                      {exp.expenseNumber}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                      {formatDateIndo(exp.date)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800">
                        {getCategoryIcon(exp.category)}
                        <span>{exp.category}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-800 text-xs">
                      {exp.description}
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-sm text-red-600">
                      -{formatRupiah(exp.amount)}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp)}
                        title="Hapus Biaya"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Catat Pengeluaran Operasional</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Kategori Pengeluaran *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nominal Pengeluaran (Rp) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Contoh: 25000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-extrabold text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tanggal Pengeluaran *
                </label>
                <input
                  type="date"
                  required
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Keterangan / Rincian Biaya *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beli kantong kresek sayur 3 pak, bensin angkut pikap"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Biaya'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
