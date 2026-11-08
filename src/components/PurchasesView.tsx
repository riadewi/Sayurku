import React, { useState, useMemo } from 'react';
import { Purchase, PurchaseItem, Product, Supplier } from '../types';
import { formatRupiah, formatNumber, formatDateIndo, formatDateTimeIndo } from '../lib/utils';
import { purchaseService } from '../services/purchaseService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Truck, 
  Plus, 
  Search, 
  Trash2, 
  CheckCircle2, 
  X, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  PackagePlus,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface PurchasesViewProps {
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  onRefresh: () => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases,
  products,
  suppliers,
  onRefresh
}) => {
  const { user, businessId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);

  // Form State
  const [supplierId, setSupplierId] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<PurchaseItem[]>([]);

  // Item row input in form
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemQty, setItemQty] = useState<string>('1');
  const [itemCost, setItemCost] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available single products for purchase
  const singleProducts = useMemo(() => {
    return products.filter(p => p.type === 'SINGLE' && p.isActive);
  }, [products]);

  // Open modal
  const handleOpenAdd = () => {
    setSupplierId(suppliers[0]?.id || '');
    setSupplierName(suppliers[0]?.name || 'Pemasok Umum');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setItems([]);
    if (singleProducts.length > 0) {
      setSelectedProductId(singleProducts[0].id);
      setItemQty('10');
      setItemCost(String(singleProducts[0].purchaseCost || 0));
    }
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Change supplier dropdown
  const handleSupplierChange = (sId: string) => {
    setSupplierId(sId);
    const found = suppliers.find(s => s.id === sId);
    if (found) {
      setSupplierName(found.name);
    }
  };

  // When changing product in purchase row, auto-fill unit cost
  const handleProductSelectChange = (pId: string) => {
    setSelectedProductId(pId);
    const found = singleProducts.find(p => p.id === pId);
    if (found) {
      setItemCost(String(found.purchaseCost || 0));
    }
  };

  // Add item row to purchase draft
  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = singleProducts.find(p => p.id === selectedProductId);
    if (!prod) return;

    const qty = parseFloat(itemQty);
    const cost = parseFloat(itemCost);

    if (isNaN(qty) || qty <= 0) {
      setErrorMessage('Jumlah sayur harus lebih dari 0.');
      return;
    }

    if (isNaN(cost) || cost < 0) {
      setErrorMessage('Harga beli modal per unit harus valid.');
      return;
    }

    const subtotal = Math.round(qty * cost);

    // If product already in list, update quantity
    const existingIndex = items.findIndex(it => it.productId === selectedProductId);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].costPrice = cost;
      updated[existingIndex].subtotal = Math.round(updated[existingIndex].quantity * cost);
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unit: prod.baseUnit,
          costPrice: cost,
          subtotal
        }
      ]);
    }

    setErrorMessage(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalPurchaseAmount = useMemo(() => {
    return items.reduce((sum, it) => sum + it.subtotal, 0);
  }, [items]);

  // Submit purchase
  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      setErrorMessage('Daftar barang kulakan tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await purchaseService.createPurchase({
        businessId,
        supplierId,
        supplierName: supplierName.trim() || 'Pemasok Umum',
        items,
        date: purchaseDate,
        notes: notes.trim(),
        userId: user?.uid || 'user'
      });

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.warn('Error saving purchase:', err?.message || err);
      setErrorMessage(err.message || 'Gagal menyimpan transaksi pembelian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => 
      p.purchaseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.items.some(it => it.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [purchases, searchTerm]);

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor kulakan, nama pemasok, atau sayur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Kulakan Baru (Tambah Stok)</span>
        </button>
      </div>

      {/* Purchases List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-5 py-3.5">No. Pembelian</th>
                <th className="px-4 py-3.5">Tanggal</th>
                <th className="px-4 py-3.5">Pemasok / Supplier</th>
                <th className="px-4 py-3.5 text-center">Jumlah Item</th>
                <th className="px-4 py-3.5 text-right">Total Tagihan</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <Truck className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    Belum ada riwayat kulakan pembelian
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase) => {
                  const isExpanded = expandedPurchaseId === purchase.id;
                  return (
                    <React.Fragment key={purchase.id}>
                      <tr className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-4 font-bold text-gray-900">
                          {purchase.purchaseNumber}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-600">
                          {formatDateIndo(purchase.date)}
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-800">
                          {purchase.supplierName}
                        </td>
                        <td className="px-4 py-4 text-center text-xs font-semibold text-gray-600">
                          {purchase.items.length} macam
                        </td>
                        <td className="px-4 py-4 text-right font-extrabold text-emerald-800">
                          {formatRupiah(purchase.totalAmount)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Diterima
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => setExpandedPurchaseId(isExpanded ? null : purchase.id)}
                            className="p-1 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Item Rows */}
                      {isExpanded && (
                        <tr className="bg-emerald-50/20">
                          <td colSpan={7} className="px-6 py-3 border-y border-emerald-100">
                            <div className="space-y-2">
                              <p className="text-xs font-bold text-gray-800">
                                Daftar Sayuran yang Diterima & Masuk Stok:
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {purchase.items.map((it, idx) => (
                                  <div key={idx} className="p-2.5 rounded-xl bg-white border border-gray-200 text-xs flex justify-between">
                                    <div>
                                      <p className="font-bold text-gray-900">{it.productName}</p>
                                      <p className="text-gray-500 text-[11px]">
                                        {formatNumber(it.quantity)} {it.unit} @ {formatRupiah(it.costPrice)}
                                      </p>
                                    </div>
                                    <span className="font-extrabold text-gray-800">
                                      {formatRupiah(it.subtotal)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {purchase.notes && (
                                <p className="text-xs text-gray-500 italic mt-1">
                                  Catatan: {purchase.notes}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span>Pencatatan Kulakan Sayuran (Tambah Stok Otomatis)</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Supplier & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Pemasok / Supplier *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => handleSupplierChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    <option value="">Lainnya / Pemasok Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tanggal Pembelian *
                  </label>
                  <input
                    type="date"
                    required
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Item Adder Row */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <h4 className="font-bold text-xs text-gray-900 flex items-center space-x-1.5">
                  <PackagePlus className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Sayuran yang Dikulak</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Produk</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                    >
                      {singleProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.baseUnit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Jumlah Qty</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="Qty"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-bold text-center bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Harga Beli / Unit</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Harga beli"
                      value={itemCost}
                      onChange={(e) => setItemCost(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-bold bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items preview list */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-3">
                      Belum ada sayur yang ditambahkan ke daftar kulakan.
                    </p>
                  ) : (
                    items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-200 text-xs">
                        <div>
                          <span className="font-bold text-gray-900">{it.productName}</span>
                          <span className="text-gray-500 ml-2">
                            {formatNumber(it.quantity)} {it.unit} x {formatRupiah(it.costPrice)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-extrabold text-emerald-800">
                            {formatRupiah(it.subtotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-sm font-bold text-gray-900">
                <span>TOTAL KULAKAN:</span>
                <span className="text-lg text-emerald-800">{formatRupiah(totalPurchaseAmount)}</span>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Nota faktur no. 8812, barang kualitas super"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Footer */}
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
                  disabled={isSubmitting || items.length === 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan & Menambah Stok...' : 'Konfirmasi & Tambah Stok'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
