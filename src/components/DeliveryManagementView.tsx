import React, { useState } from 'react';
import { DeliveryRateConfig, Order, DistanceTier } from '../types';
import { formatRupiah, formatNumber } from '../lib/utils';
import { deliveryService } from '../services/deliveryService';
import { MapLocationPicker } from './MapLocationPicker';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  Save, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Sliders, 
  Navigation,
  Compass
} from 'lucide-react';

interface DeliveryManagementViewProps {
  deliveryConfig: DeliveryRateConfig;
  orders: Order[];
  onRefreshConfig: () => void;
}

export const DeliveryManagementView: React.FC<DeliveryManagementViewProps> = ({
  deliveryConfig,
  orders,
  onRefreshConfig
}) => {
  const { businessId } = useAuth();
  const { toast } = useToast();
  
  // Config form state
  const [storeLat, setStoreLat] = useState(deliveryConfig.storeLatitude || -6.2625);
  const [storeLng, setStoreLng] = useState(deliveryConfig.storeLongitude || 106.8712);
  const [storeAddress, setStoreAddress] = useState(deliveryConfig.storeAddress || 'Kios Sayur Segar Pasar Induk');
  const [maxRadius, setMaxRadius] = useState<number>(deliveryConfig.maxRadiusKm || 15);
  const [freeMinAmount, setFreeMinAmount] = useState<number>(deliveryConfig.freeShippingMinAmount || 75000);
  const [rates, setRates] = useState<DistanceTier[]>(deliveryConfig.rates || [
    { minKm: 0, maxKm: 2, fee: 3000 },
    { minKm: 2, maxKm: 5, fee: 5000 },
    { minKm: 5, maxKm: 10, fee: 10000 },
    { minKm: 10, maxKm: 15, fee: 15000, requiresManualConfirmation: true }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active deliveries
  const activeDeliveries = orders.filter(o => o.orderStatus === 'ON_DELIVERY' || o.orderStatus === 'READY_FOR_PICKUP');
  const completedDeliveries = orders.filter(o => o.orderStatus === 'DELIVERED');

  // Handle Rate Change
  const handleRateFeeChange = (idx: number, fee: number) => {
    const updated = [...rates];
    updated[idx].fee = fee;
    setRates(updated);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await deliveryService.saveDeliveryConfig({
        id: businessId || 'default_config',
        businessId,
        storeLatitude: storeLat,
        storeLongitude: storeLng,
        storeAddress: storeAddress.trim(),
        maxRadiusKm: maxRadius,
        freeShippingMinAmount: freeMinAmount,
        rates
      });
      setSaveSuccess(true);
      toast('Pengaturan tarif & radius pengiriman berhasil disimpan!', 'success');
      onRefreshConfig();
    } catch (err: any) {
      toast('Gagal menyimpan konfigurasi pengiriman: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* SECTION 1: STORE COORDINATES & DISTANCE RATES CONFIG */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-5">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Konfigurasi Pengantaran & Titik Kios Sayur</h3>
            <p className="text-xs text-gray-500">
              Titik koordinat ini digunakan sebagai titik awal kalkulasi jarak otomatis ke alamat pelanggan
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 font-semibold text-xs flex items-center space-x-1.5">
            <CheckCircle className="w-4 h-4" />
            <span>Pengaturan pengiriman berhasil disimpan!</span>
          </div>
        )}

        <form onSubmit={handleSaveConfig} className="space-y-5 text-xs">
          {/* Store Address & Coordinate Picker */}
          <div className="space-y-2">
            <label className="block font-bold text-gray-800">
              Lokasi Kios Sayur Anda di Peta:
            </label>
            <MapLocationPicker
              latitude={storeLat}
              longitude={storeLng}
              onChangeLocation={(lat, lng) => {
                setStoreLat(lat);
                setStoreLng(lng);
              }}
              heightClass="h-56"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">Alamat Asal Kios Sayur</label>
              <input
                type="text"
                required
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Contoh: Kios Sayur Segar Blok B-12 Pasar Induk"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Maksimal Radius Kirim (km)</label>
              <input
                type="number"
                min="1"
                value={maxRadius}
                onChange={(e) => setMaxRadius(parseFloat(e.target.value) || 15)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Batas Belanja Gratis Ongkir (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="5000"
              value={freeMinAmount}
              onChange={(e) => setFreeMinAmount(parseFloat(e.target.value) || 0)}
              className="w-full max-w-sm px-3.5 py-2 rounded-xl border border-gray-200 font-extrabold text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-gray-400 mt-0.5">
              Jika pembeli berbelanja di atas nominal ini, ongkos kirim otomatis menjadi Rp 0 (Gratis)
            </p>
          </div>

          {/* Distance Tiers Table */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <h4 className="font-bold text-gray-800 flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>Tarif Ongkos Kirim Berdasarkan Rentang Jarak:</span>
            </h4>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs text-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 font-bold uppercase text-[10px] text-gray-500">
                  <tr>
                    <th className="px-4 py-2.5">Rentang Jarak (km)</th>
                    <th className="px-4 py-2.5">Tarif Ongkos Kirim (Rp)</th>
                    <th className="px-4 py-2.5">Catatan Pengantaran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rates.map((tier, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5 font-bold text-gray-900">
                        {tier.minKm} – {tier.maxKm} km
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-500">Rp</span>
                          <input
                            type="number"
                            step="500"
                            min="0"
                            value={tier.fee}
                            onChange={(e) => handleRateFeeChange(idx, parseFloat(e.target.value) || 0)}
                            className="w-28 px-2 py-1 rounded-lg border border-gray-300 font-bold text-gray-900"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">
                        {tier.requiresManualConfirmation ? 'Konfirmasi manual jika melewati radius utama' : 'Tarif pengiriman reguler'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Pengantaran'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: ACTIVE DELIVERIES & COURIER MONITOR */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base">Pengantaran Sayur Aktif Saat Ini</h3>
              <p className="text-gray-500">Pesanan yang sedang disiapkan atau sedang dalam perjalanan kurir</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-bold">
            {activeDeliveries.length} Pengantaran
          </span>
        </div>

        {activeDeliveries.length === 0 ? (
          <p className="text-gray-400 py-6 text-center">
            Tidak ada pengantaran aktif saat ini.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeDeliveries.map((order) => (
              <div key={order.id} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-2">
                <div className="flex justify-between items-start font-bold">
                  <span className="text-gray-900">{order.orderNumber}</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
                    {order.orderStatus === 'ON_DELIVERY' ? 'Sedang Diantar' : 'Siap Dijemput'}
                  </span>
                </div>
                <div>
                  <p className="text-gray-800 font-semibold">{order.customerName}</p>
                  <p className="text-gray-500 text-[11px] truncate">{order.deliveryAddress?.addressDetails}</p>
                </div>
                {order.courier && (
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-[11px]">
                    <span className="text-gray-700">Kurir: <strong>{order.courier.name}</strong></span>
                    <span className="text-gray-500">{order.courier.phone}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
