import React, { useState, useMemo } from 'react';
import { Order, OrderStatus, OrderPaymentStatus } from '../types';
import { 
  formatRupiah, 
  formatNumber, 
  formatDateIndo, 
  formatDateTimeIndo, 
  getOrderStatusLabel, 
  getPaymentStatusLabel, 
  getPaymentMethodLabel 
} from '../lib/utils';
import { orderService } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Package, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  Truck, 
  XCircle, 
  Eye, 
  UserCheck, 
  Phone, 
  MapPin, 
  AlertCircle, 
  CreditCard, 
  ShieldCheck, 
  X,
  ChevronDown,
  RotateCcw
} from 'lucide-react';

interface SellerOrdersViewProps {
  orders: Order[];
  onRefresh: () => void;
}

export const SellerOrdersView: React.FC<SellerOrdersViewProps> = ({
  orders,
  onRefresh
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Courier Assignment Modal
  const [isAssignCourierOpen, setIsAssignCourierOpen] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [courierPhone, setCourierPhone] = useState('');
  const [courierVehicle, setCourierVehicle] = useState('Motor Honda Beat - Hitam');

  // Cancel Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);

  // Statistics
  const stats = useMemo(() => {
    return {
      newOrders: orders.filter(o => o.orderStatus === 'ORDER_RECEIVED').length,
      unpaid: orders.filter(o => o.paymentStatus === 'UNPAID').length,
      pendingPayment: orders.filter(o => o.paymentStatus === 'PENDING').length,
      paid: orders.filter(o => o.paymentStatus === 'PAID').length,
      preparing: orders.filter(o => o.orderStatus === 'PREPARING').length,
      readyPickup: orders.filter(o => o.orderStatus === 'READY_FOR_PICKUP').length,
      onDelivery: orders.filter(o => o.orderStatus === 'ON_DELIVERY').length,
      delivered: orders.filter(o => o.orderStatus === 'DELIVERED').length,
    };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = statusFilter === 'ALL' || o.orderStatus === statusFilter;
      const matchPayment = paymentFilter === 'ALL' || o.paymentStatus === paymentFilter;
      const matchSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerPhone.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchPayment && matchSearch;
    });
  }, [orders, statusFilter, paymentFilter, searchTerm]);

  // Status Update Handler
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, desc: string) => {
    setIsUpdating(true);
    try {
      await orderService.updateOrderStatus({
        orderId,
        newStatus,
        updatedBy: user?.displayName || 'Penjual',
        description: desc
      });
      onRefresh();
      toast('Status pesanan berhasil diperbarui.', 'success');
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, orderStatus: newStatus } : null);
      }
    } catch (err: any) {
      toast('Gagal memperbarui status pesanan: ' + err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Assign Courier Handler
  const handleAssignCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !courierName.trim()) return;

    setIsUpdating(true);
    try {
      await orderService.assignCourier({
        orderId: selectedOrder.id,
        courierName: courierName.trim(),
        courierPhone: courierPhone.trim(),
        vehicle: courierVehicle.trim(),
        updatedBy: user?.displayName || 'Penjual'
      });
      setIsAssignCourierOpen(false);
      toast(`Kurir ${courierName.trim()} berhasil ditugaskan.`, 'success');
      onRefresh();
    } catch (err: any) {
      toast('Gagal menugaskan kurir: ' + err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Cancel Order Handler
  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !cancelReason.trim()) return;

    setIsUpdating(true);
    try {
      await orderService.updateOrderStatus({
        orderId: selectedOrder.id,
        newStatus: 'CANCELLED',
        updatedBy: user?.displayName || 'Penjual',
        description: `Dibatalkan oleh penjual: ${cancelReason}`,
        cancelReason: cancelReason.trim()
      });
      setIsCancelModalOpen(false);
      setSelectedOrder(null);
      toast('Pesanan berhasil dibatalkan.', 'info');
      onRefresh();
    } catch (err: any) {
      toast('Gagal membatalkan pesanan: ' + err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Pesanan Baru</p>
          <p className="text-xl font-extrabold text-emerald-800 mt-1">{stats.newOrders}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Belum Bayar</p>
          <p className="text-xl font-extrabold text-amber-600 mt-1">{stats.unpaid}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Verifikasi</p>
          <p className="text-xl font-extrabold text-blue-600 mt-1">{stats.pendingPayment}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Sudah Bayar</p>
          <p className="text-xl font-extrabold text-teal-700 mt-1">{stats.paid}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Disiapkan</p>
          <p className="text-xl font-extrabold text-indigo-600 mt-1">{stats.preparing}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Siap Kirim</p>
          <p className="text-xl font-extrabold text-purple-600 mt-1">{stats.readyPickup}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Diantar</p>
          <p className="text-xl font-extrabold text-amber-700 mt-1">{stats.onDelivery}</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase">Sampai</p>
          <p className="text-xl font-extrabold text-emerald-600 mt-1">{stats.delivered}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. pesanan, nama pelanggan, no. WA..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 focus:outline-none"
          >
            <option value="ALL">Semua Status Pengiriman</option>
            <option value="ORDER_RECEIVED">Pesanan Diterima</option>
            <option value="CONFIRMED">Dikonfirmasi</option>
            <option value="PREPARING">Sedang Disiapkan</option>
            <option value="READY_FOR_PICKUP">Siap Dikirim</option>
            <option value="ON_DELIVERY">Sedang Diantar</option>
            <option value="DELIVERED">Sudah Sampai</option>
            <option value="CANCELLED">Dibatalkan</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white font-semibold text-gray-700 focus:outline-none"
          >
            <option value="ALL">Semua Status Pembayaran</option>
            <option value="UNPAID">Belum Bayar</option>
            <option value="PENDING">Menunggu Verifikasi</option>
            <option value="PAID">Lunas</option>
            <option value="REFUNDED">Dikembalikan</option>
            <option value="CANCELLED">Batal</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-5 py-3.5">No. Pesanan</th>
                <th className="px-4 py-3.5">Pelanggan</th>
                <th className="px-4 py-3.5">Waktu</th>
                <th className="px-4 py-3.5 text-right">Total Tagihan</th>
                <th className="px-4 py-3.5">Metode Bayar</th>
                <th className="px-4 py-3.5 text-center">Status Bayar</th>
                <th className="px-4 py-3.5 text-center">Status Pesanan</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    Belum ada pesanan online masuk
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-emerald-50/20 transition">
                    <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-gray-900">{order.customerName}</p>
                      <p className="text-[11px] text-gray-500">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                      {formatDateTimeIndo(order.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-emerald-800 whitespace-nowrap">
                      {formatRupiah(order.totalPayment)}
                    </td>
                    <td className="px-4 py-3.5 font-medium text-gray-700 whitespace-nowrap">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.paymentStatus === 'PENDING'
                          ? 'bg-blue-100 text-blue-800'
                          : order.paymentStatus === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {getPaymentStatusLabel(order.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold ${
                        order.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.orderStatus === 'ON_DELIVERY'
                          ? 'bg-purple-100 text-purple-800'
                          : order.orderStatus === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {getOrderStatusLabel(order.orderStatus)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs flex items-center space-x-1 mx-auto transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Kelola</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Details & Action Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col">
            <div className="px-6 py-4 bg-emerald-700 text-white flex items-center justify-between sticky top-0 z-10">
              <div>
                <h3 className="font-bold text-sm sm:text-base">
                  Kelola Pesanan #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-emerald-200">
                  Pelanggan: {selectedOrder.customerName} ({selectedOrder.customerPhone})
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Status Controller Actions Bar */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">Ubah Tahapan Pesanan:</span>
                  <span className="font-extrabold text-emerald-800 text-sm">
                    {getOrderStatusLabel(selectedOrder.orderStatus)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedOrder.orderStatus === 'ORDER_RECEIVED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CONFIRMED', 'Pesanan dikonfirmasi oleh penjual.')}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition"
                    >
                      ✓ Konfirmasi Pesanan
                    </button>
                  )}

                  {(selectedOrder.orderStatus === 'ORDER_RECEIVED' || selectedOrder.orderStatus === 'CONFIRMED') && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING', 'Sayuran sedang disiapkan dan dikemas.')}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition"
                    >
                      📦 Sedang Disiapkan
                    </button>
                  )}

                  {(selectedOrder.orderStatus === 'PREPARING' || selectedOrder.orderStatus === 'CONFIRMED') && (
                    <button
                      disabled={isUpdating}
                      onClick={() => {
                        setCourierName(selectedOrder.courier?.name || 'Budi Santoso');
                        setCourierPhone(selectedOrder.courier?.phone || '0813-8899-7711');
                        setIsAssignCourierOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center space-x-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{selectedOrder.courier ? 'Ganti Kurir' : 'Tugaskan Kurir & Siap Kirim'}</span>
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'READY_FOR_PICKUP' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'ON_DELIVERY', 'Kurir sedang membawa sayuran menuju lokasi pelanggan.')}
                      className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center space-x-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Mulai Antar (On Delivery)</span>
                    </button>
                  )}

                  {selectedOrder.orderStatus === 'ON_DELIVERY' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED', 'Pesanan telah berhasil diserahkan ke pelanggan.')}
                      className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition"
                    >
                      ✓ Selesai & Sampai
                    </button>
                  )}

                  {selectedOrder.orderStatus !== 'DELIVERED' && selectedOrder.orderStatus !== 'CANCELLED' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => {
                        setCancelReason('');
                        setIsCancelModalOpen(true);
                      }}
                      className="px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold transition"
                    >
                      Batalkan Pesanan (Kembalikan Stok)
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery Address & Coordinates */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-2">
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span className="flex items-center space-x-1.5 text-emerald-800">
                    <MapPin className="w-4 h-4" />
                    <span>Alamat Pengiriman ({selectedOrder.deliveryAddress?.label}):</span>
                  </span>
                  <span className="text-gray-500 font-normal">
                    Jarak: ~{selectedOrder.distanceKm} km
                  </span>
                </div>
                <p className="text-gray-800">{selectedOrder.deliveryAddress?.addressDetails}</p>
                {selectedOrder.deliveryAddress?.notes && (
                  <p className="text-gray-500 italic">Catatan: {selectedOrder.deliveryAddress.notes}</p>
                )}
                <div className="pt-1 flex items-center space-x-4 text-[11px] text-gray-500">
                  <span>Koordinat: {selectedOrder.deliveryAddress?.latitude}, {selectedOrder.deliveryAddress?.longitude}</span>
                  <a
                    href={`https://www.google.com/maps?q=${selectedOrder.deliveryAddress?.latitude},${selectedOrder.deliveryAddress?.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Buka Rute di Google Maps
                  </a>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-800">Sayuran yang Dipesan:</h4>
                <div className="divide-y divide-gray-100 border rounded-2xl p-3 bg-white">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-900">{it.productName}</p>
                        <p className="text-gray-500 text-[11px]">
                          {formatNumber(it.quantity)} {it.unit} x {formatRupiah(it.sellingPrice)}
                        </p>
                      </div>
                      <span className="font-extrabold text-emerald-800">
                        {formatRupiah(it.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Sayur:</span>
                  <span>{formatRupiah(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Ongkos Kirim:</span>
                  <span>{selectedOrder.shippingFee === 0 ? 'Gratis' : formatRupiah(selectedOrder.shippingFee)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-1 border-t border-gray-200">
                  <span>Total Tagihan:</span>
                  <span className="text-emerald-800">{formatRupiah(selectedOrder.totalPayment)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Courier Sub-Modal */}
      {isAssignCourierOpen && selectedOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 text-xs">
            <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
              <Truck className="w-4 h-4 text-emerald-700" />
              <span>Tugaskan Kurir Pengantar Sayur</span>
            </h3>

            <form onSubmit={handleAssignCourier} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nama Kurir *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nomor WhatsApp Kurir *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 0812-3456-7890"
                  value={courierPhone}
                  onChange={(e) => setCourierPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Kendaraan Kurir</label>
                <input
                  type="text"
                  placeholder="Contoh: Motor Honda Beat (B 1234 XYZ)"
                  value={courierVehicle}
                  onChange={(e) => setCourierVehicle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAssignCourierOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition"
                >
                  Tugaskan & Siap Kirim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Sub-Modal */}
      {isCancelModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 text-xs">
            <h3 className="font-bold text-red-700 text-sm flex items-center space-x-1.5">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Batalkan Pesanan #{selectedOrder.orderNumber}</span>
            </h3>

            <p className="text-gray-600 leading-relaxed">
              Pembatalan ini akan secara otomatis <strong>mengembalikan seluruh stok sayuran</strong> ke inventaris dan mencatat mutasi audit <span className="font-bold text-teal-800">SALE_REVERSAL</span>.
            </p>

            <form onSubmit={handleCancelOrder} className="space-y-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Alasan Pembatalan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pelanggan membatalkan, alamat terlalu jauh, dll"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition"
                >
                  Konfirmasi Pembatalan & Pulihkan Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
