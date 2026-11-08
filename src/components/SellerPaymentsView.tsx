import React, { useState, useMemo } from 'react';
import { Order, OrderPaymentStatus } from '../types';
import { 
  formatRupiah, 
  formatDateTimeIndo, 
  getPaymentStatusLabel, 
  getPaymentMethodLabel 
} from '../lib/utils';
import { orderService } from '../services/orderService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  DollarSign, 
  QrCode, 
  ShieldCheck, 
  ExternalLink,
  FileCheck
} from 'lucide-react';

interface SellerPaymentsViewProps {
  orders: Order[];
  onRefresh: () => void;
}

export const SellerPaymentsView: React.FC<SellerPaymentsViewProps> = ({
  orders,
  onRefresh
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Verification Modal
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Tabs list
  const tabs = [
    { id: 'ALL', label: 'Semua Pembayaran' },
    { id: 'UNPAID', label: 'Belum Dibayar' },
    { id: 'PENDING', label: 'Menunggu Verifikasi' },
    { id: 'PAID', label: 'Sudah Dibayar (Lunas)' },
    { id: 'FAILED', label: 'Gagal' },
    { id: 'REFUNDED', label: 'Dikembalikan' },
  ];

  // Filtered orders with payment info
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchTab = activeTab === 'ALL' || o.paymentStatus === activeTab;
      const matchSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [orders, activeTab, searchTerm]);

  // Handle Verify Payment
  const handleConfirmPaid = async (orderId: string) => {
    setIsProcessing(true);
    try {
      await orderService.updatePaymentStatus({
        orderId,
        newPaymentStatus: 'PAID',
        verifiedBy: user?.displayName || 'Penjual',
        notes: 'Pembayaran telah dicek dan diverifikasi oleh penjual.'
      });
      setVerifyingOrder(null);
      toast('Pembayaran berhasil diverifikasi menjadi Lunas.', 'success');
      onRefresh();
    } catch (err: any) {
      toast('Gagal memverifikasi: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Tabs Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor pesanan atau nama pembeli..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          {tabs.map((tab) => {
            const count = tab.id === 'ALL' 
              ? orders.length 
              : orders.filter(o => o.paymentStatus === tab.id).length;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-800 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-5 py-3.5">No. Pesanan</th>
                <th className="px-4 py-3.5">Nama Pembeli</th>
                <th className="px-4 py-3.5">Metode</th>
                <th className="px-4 py-3.5 text-right">Nominal</th>
                <th className="px-4 py-3.5">Waktu Transaksi</th>
                <th className="px-4 py-3.5 text-center">Status Pembayaran</th>
                <th className="px-4 py-3.5 text-center">Bukti / Referensi</th>
                <th className="px-5 py-3.5 text-center">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <CreditCard className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    Belum ada catatan pembayaran pada kategori ini
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-5 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                      {o.orderNumber}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-gray-900">{o.customerName}</p>
                      <p className="text-[11px] text-gray-500">{o.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap font-medium text-gray-700">
                      {getPaymentMethodLabel(o.paymentMethod)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-extrabold text-emerald-800 whitespace-nowrap">
                      {formatRupiah(o.totalPayment)}
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                      {formatDateTimeIndo(o.createdAt)}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        o.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800'
                          : o.paymentStatus === 'PENDING'
                          ? 'bg-blue-100 text-blue-800'
                          : o.paymentStatus === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {getPaymentStatusLabel(o.paymentStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {o.paymentProofUrl ? (
                        <span className="font-mono text-gray-700 truncate max-w-[120px] inline-block bg-gray-100 px-2 py-0.5 rounded text-[11px]" title={o.paymentProofUrl}>
                          {o.paymentProofUrl}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                      {o.paymentStatus !== 'PAID' && o.paymentStatus !== 'CANCELLED' ? (
                        <button
                          onClick={() => setVerifyingOrder(o)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1 mx-auto transition"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verifikasi Lunas</span>
                        </button>
                      ) : o.paymentStatus === 'PAID' ? (
                        <span className="text-emerald-700 font-bold inline-flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Terverifikasi</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Confirmation Modal */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4 text-xs">
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>Verifikasi Pembayaran Pesanan</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
              <p>No. Pesanan: <strong className="text-gray-900">{verifyingOrder.orderNumber}</strong></p>
              <p>Pelanggan: <strong className="text-gray-900">{verifyingOrder.customerName}</strong></p>
              <p>Metode: <strong className="text-gray-900">{getPaymentMethodLabel(verifyingOrder.paymentMethod)}</strong></p>
              <p>Nominal Transfer: <strong className="text-emerald-800 text-sm font-extrabold">{formatRupiah(verifyingOrder.totalPayment)}</strong></p>
              {verifyingOrder.paymentProofUrl && (
                <p className="pt-1 text-gray-600">
                  Keterangan / Bukti: <strong className="text-gray-800">{verifyingOrder.paymentProofUrl}</strong>
                </p>
              )}
            </div>

            <p className="text-gray-600 leading-relaxed">
              Pastikan dana telah masuk ke mutasi rekening bank atau akun QRIS Anda sebelum menandai lunas.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setVerifyingOrder(null)}
                className="px-4 py-2 rounded-xl text-gray-600 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleConfirmPaid(verifyingOrder.id)}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs"
              >
                {isProcessing ? 'Menyimpan...' : 'Tandai Lunas (PAID)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
