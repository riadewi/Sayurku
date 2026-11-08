import React, { useState, useMemo } from 'react';
import { Product, InventoryMovement, MovementType } from '../types';
import { formatNumber, formatDateTimeIndo } from '../lib/utils';
import { inventoryService } from '../services/inventoryService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Boxes, 
  Search, 
  Plus, 
  Minus, 
  AlertTriangle, 
  History, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  X,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  movements: InventoryMovement[];
  onRefresh: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  movements,
  onRefresh
}) => {
  const { user, businessId } = useAuth();
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LOG'>('STOCK');
  const [searchTerm, setSearchTerm] = useState('');
  const [movementFilter, setMovementFilter] = useState<string>('ALL');

  // Adjustment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<MovementType>('ADJUSTMENT');
  const [qtyChange, setQtyChange] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter single products
  const singleProducts = useMemo(() => {
    return products.filter(p => p.type === 'SINGLE');
  }, [products]);

  const filteredProducts = useMemo(() => {
    return singleProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [singleProducts, searchTerm]);

  // Filter movements
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const matchType = movementFilter === 'ALL' || m.type === movementFilter;
      const matchSearch = m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [movements, movementFilter, searchTerm]);

  const handleOpenAdjustment = (p: Product, type: MovementType = 'ADJUSTMENT') => {
    setSelectedProduct(p);
    setAdjustType(type);
    setQtyChange('');
    setReason(
      type === 'WASTE' 
        ? 'Sayur layu / busuk / rusak' 
        : type === 'STOCK_IN' 
        ? 'Penambahan stok manual' 
        : 'Penyesuaian stok opname fisik'
    );
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const qty = parseFloat(qtyChange);
    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Jumlah harus berupa angka lebih dari 0.');
      return;
    }

    // Determine signed quantityChange
    let signedChange = qty;
    if (adjustType === 'WASTE' || adjustType === 'STOCK_OUT') {
      signedChange = -qty;
    } else if (adjustType === 'ADJUSTMENT') {
      // For general adjustment, user inputs the target actual physical stock,
      // so diff = target - current
      const current = selectedProduct.currentStock || 0;
      signedChange = qty - current;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await inventoryService.recordStockAdjustment({
        businessId,
        productId: selectedProduct.id,
        type: adjustType,
        quantityChange: signedChange,
        reason: reason.trim() || 'Penyesuaian stok manual',
        userId: user?.uid || 'user'
      });

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.warn('Error saving stock adjustment:', err?.message || err);
      setErrorMessage(err.message || 'Gagal mengubah stok.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMovementBadge = (type: MovementType) => {
    switch (type) {
      case 'STOCK_IN':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800"><ArrowDownLeft className="w-3 h-3 mr-1" /> Masuk</span>;
      case 'STOCK_OUT':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800"><ArrowUpRight className="w-3 h-3 mr-1" /> Jual Satuan</span>;
      case 'BUNDLE_OUT':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800"><ArrowUpRight className="w-3 h-3 mr-1" /> Jual Paket</span>;
      case 'WASTE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800"><Trash2 className="w-3 h-3 mr-1" /> Rusak / Busuk</span>;
      case 'ADJUSTMENT':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800"><RefreshCw className="w-3 h-3 mr-1" /> Opname</span>;
      case 'SALE_REVERSAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-teal-100 text-teal-800"><RotateCcw className="w-3 h-3 mr-1" /> Batal Jual</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-800">{type}</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Switcher & Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Sub Tabs */}
        <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-xl text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'STOCK' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Inventaris Sayuran</span>
          </button>
          <button
            onClick={() => setActiveTab('LOG')}
            className={`px-4 py-2 rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'LOG' ? 'bg-white text-emerald-800 shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Riwayat Mutasi Stok ({movements.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari sayuran atau mutasi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* TAB 1: CURRENT INVENTORY */}
      {activeTab === 'STOCK' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="px-5 py-3.5">Nama Sayuran</th>
                  <th className="px-4 py-3.5">Kategori</th>
                  <th className="px-4 py-3.5 text-right">Stok Fisik Saat Ini</th>
                  <th className="px-4 py-3.5 text-right">Batas Min. Stok</th>
                  <th className="px-4 py-3.5 text-center">Status Stok</th>
                  <th className="px-5 py-3.5 text-center">Kelola Stok Manual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      Tidak ada sayuran satuan ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isLow = p.currentStock <= p.minStock;
                    return (
                      <tr key={p.id} className="hover:bg-emerald-50/20 transition">
                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          {p.name}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-500">
                          {p.category}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold text-base">
                          <span className={isLow ? 'text-red-600' : 'text-gray-900'}>
                            {formatNumber(p.currentStock)}
                          </span>
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            {p.baseUnit}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-xs text-gray-500 font-medium">
                          {formatNumber(p.minStock)} {p.baseUnit}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aman
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Stock In */}
                            <button
                              onClick={() => handleOpenAdjustment(p, 'STOCK_IN')}
                              title="Tambah Stok Manual"
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center space-x-1 transition"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Tambah</span>
                            </button>

                            {/* Waste / Rusak */}
                            <button
                              onClick={() => handleOpenAdjustment(p, 'WASTE')}
                              title="Catat Sayur Busuk / Rusak"
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 flex items-center space-x-1 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Busuk/Waste</span>
                            </button>

                            {/* Opname adjustment */}
                            <button
                              onClick={() => handleOpenAdjustment(p, 'ADJUSTMENT')}
                              title="Penyesuaian Opname Fisik"
                              className="px-2 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center space-x-1 transition"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Opname</span>
                            </button>
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
      )}

      {/* TAB 2: AUDIT LOG OF MOVEMENTS */}
      {activeTab === 'LOG' && (
        <div className="space-y-4">
          {/* Movement Type Filter Chips & Export Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {[
                { id: 'ALL', label: 'Semua Mutasi' },
                { id: 'STOCK_IN', label: 'Kulakan Masuk' },
                { id: 'STOCK_OUT', label: 'Jual Satuan' },
                { id: 'BUNDLE_OUT', label: 'Jual Paket' },
                { id: 'WASTE', label: 'Rusak / Busuk' },
                { id: 'ADJUSTMENT', label: 'Opname Stok' },
                { id: 'SALE_REVERSAL', label: 'Batal Jual' }
              ].map((mType) => (
                <button
                  key={mType.id}
                  onClick={() => setMovementFilter(mType.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                    movementFilter === mType.id
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {mType.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                let csv = '\uFEFF';
                csv += 'LOG MUTASI STOK SAYURAN SAYURKU\n';
                csv += `Waktu Unduh;"${new Date().toLocaleString('id-ID')}"\n\n`;
                csv += 'Waktu;Produk Sayuran;Jenis Mutasi;Jumlah;Satuan;Stok Sebelum;Stok Akhir;Alasan / Keterangan\n';
                filteredMovements.forEach(m => {
                  csv += `"${m.createdAt}";"${m.productName}";"${m.type}";${m.quantity};"${m.unit}";${m.previousStock};${m.newStock};"${m.reason || ''}"\n`;
                });
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Log_Mutasi_Stok_${new Date().toISOString().split('T')[0]}.csv`;
                link.click();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:text-emerald-800 hover:border-emerald-300 font-bold text-xs flex items-center space-x-1.5 shadow-xs transition shrink-0"
              title="Unduh log mutasi dalam format CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Ekspor Log Mutasi (CSV)</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
                  <tr>
                    <th className="px-5 py-3.5">Waktu</th>
                    <th className="px-4 py-3.5">Produk Sayuran</th>
                    <th className="px-4 py-3.5">Jenis Mutasi</th>
                    <th className="px-4 py-3.5 text-right">Perubahan Qty</th>
                    <th className="px-4 py-3.5 text-right">Stok Sebelum</th>
                    <th className="px-4 py-3.5 text-right">Stok Akhir</th>
                    <th className="px-5 py-3.5">Keterangan / Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-sans">
                  {filteredMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-400">
                        Belum ada riwayat mutasi stok
                      </td>
                    </tr>
                  ) : (
                    filteredMovements.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition text-xs">
                        <td className="px-5 py-3.5 text-gray-500 whitespace-nowrap">
                          {formatDateTimeIndo(m.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-gray-900">
                          {m.productName}
                        </td>
                        <td className="px-4 py-3.5">
                          {getMovementBadge(m.type)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-extrabold">
                          <span className={m.quantity >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                            {m.quantity > 0 ? `+${formatNumber(m.quantity)}` : formatNumber(m.quantity)} {m.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-gray-500">
                          {formatNumber(m.previousStock)} {m.unit}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                          {formatNumber(m.newStock)} {m.unit}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 max-w-xs truncate">
                          {m.reason}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment / Waste Modal */}
      {isModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-2">
                {adjustType === 'WASTE' ? (
                  <>
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>Catat Sayur Busuk / Rusak (Waste)</span>
                  </>
                ) : adjustType === 'STOCK_IN' ? (
                  <>
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Tambah Stok Sayur</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 text-purple-600" />
                    <span>Penyesuaian Stok Opname</span>
                  </>
                )}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMessage}
                </div>
              )}

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                <p className="font-bold text-gray-900 text-sm">{selectedProduct.name}</p>
                <p className="text-gray-500">
                  Stok saat ini di sistem: <strong className="text-gray-800">{formatNumber(selectedProduct.currentStock)} {selectedProduct.baseUnit}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {adjustType === 'WASTE' 
                    ? `Jumlah Sayur Rusak/Busuk (${selectedProduct.baseUnit}) *` 
                    : adjustType === 'STOCK_IN'
                    ? `Jumlah Tambahan Masuk (${selectedProduct.baseUnit}) *`
                    : `Jumlah Stok Fisik Sebenarnya (${selectedProduct.baseUnit}) *`}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  placeholder="0"
                  value={qtyChange}
                  onChange={(e) => setQtyChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-extrabold text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alasan / Keterangan *
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Daun menguning terkena hujan, rusak packing, dll"
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
                  className={`px-5 py-2 rounded-xl text-sm font-bold text-white shadow-xs transition ${
                    adjustType === 'WASTE' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Mutasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
