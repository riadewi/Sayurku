import React from 'react';
import { Sale, StoreProfile } from '../types';
import { formatRupiah, formatDateTimeIndo } from '../lib/utils';
import { Printer, X, CheckCircle, Package } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  storeProfile: StoreProfile;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, storeProfile, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-100 flex flex-col">
        {/* Header Modal Bar */}
        <div className="bg-emerald-600 px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-200" />
            <span className="font-semibold text-sm">Nota Transaksi Penjualan</span>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-emerald-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-6 bg-white text-gray-800 text-sm font-mono space-y-4">
          <div className="text-center pb-3 border-b border-dashed border-gray-300">
            <h2 className="text-lg font-bold text-gray-900 font-sans tracking-wide uppercase">
              {storeProfile.storeName || 'SAYURKU'}
            </h2>
            <p className="text-xs text-gray-600 font-sans mt-0.5">{storeProfile.address}</p>
            <p className="text-xs text-gray-600 font-sans">Telp: {storeProfile.phone}</p>
          </div>

          <div className="flex justify-between text-xs text-gray-600 border-b border-dashed border-gray-200 pb-2">
            <div>
              <p>No: <span className="font-semibold text-gray-800">{sale.receiptNumber}</span></p>
              <p>Kasir: {sale.cashierName || 'Kasir'}</p>
            </div>
            <div className="text-right">
              <p>{formatDateTimeIndo(sale.createdAt)}</p>
              <p className="capitalize">Bayar: {sale.paymentMethod === 'CASH' ? 'Tunai' : 'Transfer'}</p>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2 border-b border-dashed border-gray-300 pb-3">
            {sale.items.map((item, idx) => (
              <div key={idx} className="text-xs">
                <div className="flex justify-between font-medium text-gray-900">
                  <span className="truncate pr-2">
                    {item.productName}
                    {item.type === 'BUNDLE' && (
                      <span className="ml-1 inline-flex items-center text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded font-sans">
                        Paket
                      </span>
                    )}
                  </span>
                  <span>{formatRupiah(item.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 text-[11px]">
                  <span>{item.quantity} {item.unit} x {formatRupiah(item.sellingPrice)}</span>
                  {item.discount > 0 && <span className="text-red-600 font-sans">Disc: -{formatRupiah(item.discount)}</span>}
                </div>
                {item.type === 'BUNDLE' && item.bundleComponents && item.bundleComponents.length > 0 && (
                  <div className="pl-2 mt-0.5 text-[10px] text-gray-500 font-sans italic">
                    Komposisi: {item.bundleComponents.map(c => `${c.productName} (${c.quantity} ${c.unit})`).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Calculation */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>{formatRupiah(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Diskon Transaksi:</span>
                <span>-{formatRupiah(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-gray-900 pt-1 border-t border-gray-200">
              <span>TOTAL:</span>
              <span>{formatRupiah(sale.finalTotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 pt-1">
              <span>Bayar:</span>
              <span>{formatRupiah(sale.paymentAmount)}</span>
            </div>
            <div className="flex justify-between font-medium text-gray-800">
              <span>Kembalian:</span>
              <span>{formatRupiah(sale.change)}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-3 border-t border-dashed border-gray-300 text-xs text-gray-600 font-sans">
            <p className="font-medium text-emerald-800">{storeProfile.footerNote || 'Terima kasih atas kunjungan Anda!'}</p>
            <p className="text-[10px] text-gray-400 mt-1">Sayur segar setiap hari untuk keluarga sehat</p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium flex items-center space-x-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk</span>
          </button>
        </div>
      </div>
    </div>
  );
};
