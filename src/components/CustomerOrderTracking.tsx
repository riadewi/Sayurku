import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, OrderStatusHistory } from '../types';
import { 
  formatRupiah, 
  formatNumber,
  formatDateTimeIndo, 
  getOrderStatusLabel, 
  getPaymentStatusLabel, 
  getPaymentMethodLabel 
} from '../lib/utils';
import { orderService } from '../services/orderService';
import { useToast } from '../contexts/ToastContext';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  CreditCard, 
  AlertCircle, 
  ChevronRight, 
  RotateCcw,
  Upload,
  User,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';

interface CustomerOrderTrackingProps {
  orders: Order[];
  activeOrderId?: string | null;
  onSelectOrder: (orderId: string) => void;
  onBackToShopping: () => void;
}

const timelineSteps: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'ORDER_RECEIVED', label: 'Pesanan Diterima', desc: 'Pesanan Anda telah masuk ke sistem kios sayur.' },
  { status: 'CONFIRMED', label: 'Pesanan Dikonfirmasi', desc: 'Penjual telah memvalidasi pesanan dan pembayaran Anda.' },
  { status: 'PREPARING', label: 'Sedang Disiapkan', desc: 'Sayuran segar sedang ditimbang dan dikemas rapi.' },
  { status: 'READY_FOR_PICKUP', label: 'Siap Dikirim', desc: 'Paket sayur telah siap dijemput oleh kurir pengantar.' },
  { status: 'ON_DELIVERY', label: 'Sedang Diantar', desc: 'Kurir sedang dalam perjalanan menuju lokasi Anda.' },
  { status: 'DELIVERED', label: 'Pesanan Sudah Sampai', desc: 'Pesanan sayur telah berhasil diterima dengan baik.' }
];

export const CustomerOrderTracking: React.FC<CustomerOrderTrackingProps> = ({
  orders,
  activeOrderId,
  onSelectOrder,
  onBackToShopping
}) => {
  const { toast, confirmAction } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<OrderStatusHistory[]>([]);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [proofInput, setProofInput] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofSuccess, setProofSuccess] = useState(false);

  // Sync selected order or fallback to first order
  useEffect(() => {
    if (activeOrderId) {
      const found = orders.find(o => o.id === activeOrderId);
      if (found) {
        setSelectedOrder(found);
        return;
      }
    }
    if (orders.length > 0 && !selectedOrder) {
      setSelectedOrder(orders[0]);
    } else if (selectedOrder) {
      // Keep selected order updated with latest data
      const updated = orders.find(o => o.id === selectedOrder.id);
      if (updated) setSelectedOrder(updated);
    }
  }, [orders, activeOrderId]);

  // Load status transition history for the selected order
  useEffect(() => {
    if (selectedOrder) {
      orderService.getOrderStatusHistory(selectedOrder.id)
        .then(h => setHistory(h || []))
        .catch(err => console.warn('Could not load order history:', err));
    }
  }, [selectedOrder?.id, selectedOrder?.orderStatus]);

  // Handle Customer Receipt Confirmation
  const handleConfirmReceived = async () => {
    if (!selectedOrder) return;
    const ok = await confirmAction(
      'Pastikan Anda telah menerima sayuran dengan lengkap. Konfirmasi bahwa pesanan sudah sampai?',
      'Konfirmasi Penerimaan Sayur'
    );
    if (!ok) return;

    setIsConfirmingDelivery(true);
    try {
      await orderService.updateOrderStatus({
        orderId: selectedOrder.id,
        newStatus: 'DELIVERED',
        updatedBy: selectedOrder.customerName || 'Pelanggan',
        description: 'Pelanggan telah mengonfirmasi bahwa pesanan sayur sudah sampai dengan selamat.'
      });
      toast('Terima kasih! Pesanan telah berhasil Anda konfirmasi selesai.', 'success');
    } catch (err: any) {
      toast('Gagal mengonfirmasi: ' + err.message, 'error');
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  // Upload payment proof for transfer orders
  const handleUploadPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !proofInput.trim()) return;

    setIsUploadingProof(true);
    try {
      await orderService.uploadPaymentProof(selectedOrder.id, proofInput.trim());
      setProofInput('');
      setProofSuccess(true);
      setTimeout(() => setProofSuccess(false), 3000);
      toast('Bukti pembayaran berhasil dikirimkan ke penjual.', 'success');
    } catch (err: any) {
      toast('Gagal mengunggah bukti: ' + err.message, 'error');
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Determine current timeline active step index
  const getCurrentStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'ORDER_RECEIVED': return 0;
      case 'CONFIRMED': return 1;
      case 'PREPARING': return 2;
      case 'READY_FOR_PICKUP': return 3;
      case 'ON_DELIVERY': return 4;
      case 'DELIVERED': return 5;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const currentStepIdx = selectedOrder ? getCurrentStepIndex(selectedOrder.orderStatus) : 0;
  const isCancelled = selectedOrder?.orderStatus === 'CANCELLED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
            Lacak Pesanan Sayur Online
          </h2>
          <p className="text-xs text-gray-500">
            Status pengiriman diperbarui secara otomatis secara real-time
          </p>
        </div>
        <button
          onClick={onBackToShopping}
          className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-bold text-xs flex items-center space-x-1.5 transition self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Kembali Belanja Sayur</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-gray-200 space-y-3">
          <Package className="w-12 h-12 mx-auto text-gray-300" />
          <h3 className="font-bold text-gray-800 text-base">Belum Ada Riwayat Pesanan</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Anda belum pernah memesan sayuran secara online. Silakan telusuri katalog sayuran segar kami dan lakukan pemesanan!
          </p>
          <button
            onClick={onBackToShopping}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            Mulai Belanja Sekarang
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Order Selector List */}
          <div className="lg:col-span-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 px-1">
              Daftar Pesanan Anda ({orders.length})
            </h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {orders.map((o) => {
                const isSelected = selectedOrder?.id === o.id;
                return (
                  <div
                    key={o.id}
                    onClick={() => onSelectOrder(o.id)}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition flex flex-col space-y-1.5 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-gray-900">
                      <span>{o.orderNumber}</span>
                      <span className="text-[11px] font-extrabold text-emerald-800">
                        {formatRupiah(o.totalPayment)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{formatDateTimeIndo(o.createdAt)}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        o.orderStatus === 'DELIVERED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.orderStatus === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {getOrderStatusLabel(o.orderStatus)}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 truncate">
                      {o.items.map(it => `${it.productName} (x${it.quantity})`).join(', ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Order Live Tracking Details */}
          {selectedOrder && (
            <div className="lg:col-span-8 space-y-5">
              {/* Status Header Card */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                      Nomor Pesanan: {selectedOrder.orderNumber}
                    </span>
                    <h3 className="text-xl font-extrabold text-gray-900 mt-1">
                      {getOrderStatusLabel(selectedOrder.orderStatus)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Dipesan pada {formatDateTimeIndo(selectedOrder.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedOrder.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedOrder.paymentStatus === 'PENDING'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedOrder.paymentStatus === 'CANCELLED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      Pembayaran: {getPaymentStatusLabel(selectedOrder.paymentStatus)}
                    </span>
                  </div>
                </div>

                {/* Cancelled Alert if applicable */}
                {isCancelled && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1">
                    <div className="flex items-center space-x-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span>Pesanan Ini Telah Dibatalkan</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Alasan: {selectedOrder.cancelReason || 'Dibatalkan oleh penjual atau pembeli.'} Seluruh stok sayuran telah dikembalikan ke inventaris.
                    </p>
                  </div>
                )}

                {/* Visual Status Progress Timeline */}
                {!isCancelled && (
                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-gray-700 mb-4">Perjalanan Pengiriman Pesanan:</h4>
                    <div className="space-y-4">
                      {timelineSteps.map((step, idx) => {
                        const isDone = idx <= currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div key={step.status} className="flex items-start space-x-3 text-xs">
                            <div className="flex flex-col items-center">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                isDone 
                                  ? 'bg-emerald-600 text-white shadow-xs' 
                                  : 'bg-gray-100 text-gray-400 border border-gray-200'
                              }`}>
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                              </div>
                              {idx < timelineSteps.length - 1 && (
                                <div className={`w-0.5 h-7 transition-colors ${
                                  idx < currentStepIdx ? 'bg-emerald-600' : 'bg-gray-200'
                                }`} />
                              )}
                            </div>

                            <div className="pt-1 flex-1">
                              <div className="flex items-center justify-between">
                                <span className={`font-bold ${isCurrent ? 'text-emerald-800 text-sm' : isDone ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {step.label}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                                    Sedang Berlangsung
                                  </span>
                                )}
                              </div>
                              <p className={`text-[11px] mt-0.5 ${isDone ? 'text-gray-600' : 'text-gray-400'}`}>
                                {step.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Courier Info Card (if assigned) */}
                {selectedOrder.courier && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-800 font-bold uppercase">Kurir Pengantar:</p>
                        <h5 className="font-bold text-gray-900 text-sm">{selectedOrder.courier.name}</h5>
                        <p className="text-gray-500 text-[11px]">{selectedOrder.courier.vehicle || 'Motor Sayurku'}</p>
                      </div>
                    </div>
                    {selectedOrder.courier.phone && (
                      <a
                        href={`https://wa.me/${selectedOrder.courier.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-white text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center space-x-1.5 hover:bg-emerald-100 transition shadow-xs self-start sm:self-auto"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Hubungi Kurir ({selectedOrder.courier.phone})</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Confirm Receipt Button (Active when ON_DELIVERY or READY_FOR_PICKUP) */}
                {(selectedOrder.orderStatus === 'ON_DELIVERY' || selectedOrder.orderStatus === 'READY_FOR_PICKUP') && (
                  <div className="pt-2">
                    <button
                      onClick={handleConfirmReceived}
                      disabled={isConfirmingDelivery}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isConfirmingDelivery ? 'Memproses...' : 'Pesanan Sudah Diterima dengan Lengkap'}</span>
                    </button>
                    <p className="text-center text-[11px] text-gray-400 mt-1.5">
                      Klik tombol ini saat Anda telah menerima sayuran dari kurir
                    </p>
                  </div>
                )}
              </div>

              {/* Upload Proof if payment unpaid & transfer */}
              {selectedOrder.paymentMethod === 'TRANSFER' && selectedOrder.paymentStatus !== 'PAID' && (
                <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-3 text-xs">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <h4 className="font-bold text-gray-900 text-sm">Unggah / Konfirmasi Bukti Transfer</h4>
                  </div>
                  <p className="text-gray-500 text-[11px]">
                    Jika Anda telah mentransfer pembayaran, silakan masukkan nomor referensi transfer atau catatan agar penjual dapat memverifikasi.
                  </p>

                  {proofSuccess && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 font-semibold text-xs">
                      Bukti transfer berhasil dikirim ke penjual!
                    </div>
                  )}

                  <form onSubmit={handleUploadPaymentProof} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Nomor referensi / keterangan mutasi bank..."
                      value={proofInput}
                      onChange={(e) => setProofInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={isUploadingProof || !proofInput.trim()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50"
                    >
                      {isUploadingProof ? 'Mengirim...' : 'Kirim'}
                    </button>
                  </form>
                </div>
              )}

              {/* Order Details Breakdown & Address */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4 text-xs">
                <h4 className="font-bold text-gray-900 text-sm border-b border-gray-100 pb-2">
                  Rincian Barang & Pengiriman
                </h4>

                {/* Delivery Address */}
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                  <p className="font-bold text-gray-800 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Alamat Tujuan ({selectedOrder.deliveryAddress?.label || 'Tujuan'}):</span>
                  </p>
                  <p className="text-gray-900 font-semibold">{selectedOrder.customerName} ({selectedOrder.customerPhone})</p>
                  <p className="text-gray-600">{selectedOrder.deliveryAddress?.addressDetails}</p>
                  {selectedOrder.deliveryAddress?.notes && (
                    <p className="text-gray-400 text-[11px] italic">Patokan: {selectedOrder.deliveryAddress.notes}</p>
                  )}
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-100">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="py-2.5 flex justify-between items-start">
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

                {/* Financial Summary */}
                <div className="pt-2 border-t border-gray-100 space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal Sayur:</span>
                    <span>{formatRupiah(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Ongkos Kirim ({selectedOrder.distanceKm} km):</span>
                    <span>{selectedOrder.shippingFee === 0 ? 'Gratis' : formatRupiah(selectedOrder.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1 border-t border-gray-200">
                    <span>Total Pembayaran:</span>
                    <span className="text-base text-emerald-800">{formatRupiah(selectedOrder.totalPayment)}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 pt-0.5">
                    Metode: {getPaymentMethodLabel(selectedOrder.paymentMethod)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
