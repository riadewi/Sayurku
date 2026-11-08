import React, { useState, useMemo, useEffect } from 'react';
import { 
  Product, 
  CartItem, 
  CustomerAddress, 
  Order, 
  OrderPaymentMethod, 
  DeliveryRateConfig, 
  StoreProfile 
} from '../types';
import { 
  formatRupiah, 
  formatNumber, 
  calculateHaversineDistance, 
  calculateShippingFee 
} from '../lib/utils';
import { MapLocationPicker } from './MapLocationPicker';
import { orderService } from '../services/orderService';
import { addressService } from '../services/addressService';
import { useAuth } from '../contexts/AuthContext';
import { ProductImage } from './ProductImage';
import confetti from 'canvas-confetti';
import { 
  ShoppingCart, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  MapPin, 
  Truck, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  QrCode, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Info,
  ShieldCheck
} from 'lucide-react';

interface CustomerCartAndCheckoutModalProps {
  cart: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onClose: () => void;
  deliveryConfig: DeliveryRateConfig;
  storeProfile: StoreProfile;
  onOrderSuccess: (order: Order) => void;
}

export const CustomerCartAndCheckoutModal: React.FC<CustomerCartAndCheckoutModalProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onClose,
  deliveryConfig,
  storeProfile,
  onOrderSuccess
}) => {
  const { user, businessId } = useAuth();
  const customerId = user ? user.uid : 'cust_' + Math.random().toString(36).substring(2, 9);

  // Steps: 1: 'CART', 2: 'ADDRESS', 3: 'PAYMENT'
  const [step, setStep] = useState<'CART' | 'ADDRESS' | 'PAYMENT'>('CART');

  // Address State
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState<boolean>(false);
  
  // New Address Form
  const [addressLabel, setAddressLabel] = useState('Rumah');
  const [recipientName, setRecipientName] = useState(user?.displayName || '');
  const [recipientPhone, setRecipientPhone] = useState('0812-');
  const [addressDetails, setAddressDetails] = useState('');
  const [addressNotes, setAddressNotes] = useState('');
  const [latitude, setLatitude] = useState(deliveryConfig.storeLatitude + 0.015);
  const [longitude, setLongitude] = useState(deliveryConfig.storeLongitude + 0.015);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<OrderPaymentMethod>('TRANSFER');
  const [paymentProofData, setPaymentProofData] = useState<string>('');
  const [customerOrderNotes, setCustomerOrderNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved addresses
  useEffect(() => {
    async function loadAddresses() {
      try {
        const list = await addressService.getCustomerAddresses(customerId);
        if (list && list.length > 0) {
          setSavedAddresses(list);
          setSelectedAddressId(list[0].id);
        } else {
          setIsAddingNewAddress(true);
        }
      } catch (err) {
        console.warn('Could not load saved addresses:', err);
        setIsAddingNewAddress(true);
      }
    }
    loadAddresses();
  }, [customerId]);

  // Active address
  const activeAddress: CustomerAddress | null = useMemo(() => {
    if (!isAddingNewAddress && selectedAddressId) {
      const found = savedAddresses.find(a => a.id === selectedAddressId);
      if (found) return found;
    }
    return {
      id: 'draft',
      customerId,
      label: addressLabel,
      recipientName,
      phone: recipientPhone,
      addressDetails,
      latitude,
      longitude,
      notes: addressNotes,
      createdAt: new Date().toISOString()
    };
  }, [isAddingNewAddress, selectedAddressId, savedAddresses, customerId, addressLabel, recipientName, recipientPhone, addressDetails, latitude, longitude, addressNotes]);

  // Subtotal
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  // Distance calculation (Haversine formula between store coordinates and delivery address)
  const distanceKm = useMemo(() => {
    if (!activeAddress) return 0;
    return calculateHaversineDistance(
      deliveryConfig.storeLatitude,
      deliveryConfig.storeLongitude,
      activeAddress.latitude,
      activeAddress.longitude
    );
  }, [deliveryConfig, activeAddress]);

  // Shipping fee
  const shippingInfo = useMemo(() => {
    return calculateShippingFee(distanceKm, subtotal, deliveryConfig);
  }, [distanceKm, subtotal, deliveryConfig]);

  const finalTotal = subtotal + shippingInfo.fee;

  // Handle Save New Address
  const handleSaveDraftAddress = async () => {
    if (!recipientName.trim() || !recipientPhone.trim() || !addressDetails.trim()) {
      setErrorMessage('Lengkapi nama penerima, nomor WhatsApp, dan rincian alamat rumah/tujuan.');
      return false;
    }
    try {
      const saved = await addressService.saveAddress({
        customerId,
        label: addressLabel,
        recipientName: recipientName.trim(),
        phone: recipientPhone.trim(),
        addressDetails: addressDetails.trim(),
        latitude,
        longitude,
        notes: addressNotes.trim(),
        isDefault: savedAddresses.length === 0
      });
      setSavedAddresses(prev => [saved, ...prev]);
      setSelectedAddressId(saved.id);
      setIsAddingNewAddress(false);
      return true;
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan alamat.');
      return false;
    }
  };

  // Submit Order
  const handlePlaceOrder = async () => {
    setErrorMessage(null);
    if (!activeAddress || !activeAddress.recipientName || !activeAddress.addressDetails) {
      setErrorMessage('Pilih atau lengkapi alamat pengiriman terlebih dahulu.');
      setStep('ADDRESS');
      return;
    }

    if (shippingInfo.requiresManual) {
      setErrorMessage(`Jarak pengiriman Anda (${distanceKm} km) melebihi radius pengantaran maksimal (${deliveryConfig.maxRadiusKm} km). Silakan hubungi penjual untuk konfirmasi manual.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const order = await orderService.placeOrder({
        businessId,
        customerId,
        customerName: activeAddress.recipientName,
        customerPhone: activeAddress.phone,
        items: cart,
        subtotal,
        discount: 0,
        shippingFee: shippingInfo.fee,
        totalPayment: finalTotal,
        deliveryAddress: activeAddress,
        distanceKm,
        paymentMethod,
        paymentProofUrl: paymentProofData,
        notes: customerOrderNotes.trim()
      });

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      onClearCart();
      onOrderSuccess(order);
    } catch (err: any) {
      console.warn('Checkout warning:', err?.message || err);
      setErrorMessage(err.message || 'Gagal membuat pesanan. Mohon periksa sisa stok sayuran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col border border-emerald-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-emerald-200" />
            <h3 className="font-bold text-sm sm:text-base">
              {step === 'CART' && 'Keranjang Belanja Sayuran'}
              {step === 'ADDRESS' && 'Alamat & Titik Pengantaran Peta'}
              {step === 'PAYMENT' && 'Metode Pembayaran & Konfirmasi'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Wizard Bar */}
        <div className="flex border-b border-gray-100 bg-emerald-50/50 text-xs font-bold text-center">
          <div className={`flex-1 py-2.5 border-b-2 transition ${step === 'CART' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-400'}`}>
            1. Keranjang
          </div>
          <div className={`flex-1 py-2.5 border-b-2 transition ${step === 'ADDRESS' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-400'}`}>
            2. Alamat & Peta
          </div>
          <div className={`flex-1 py-2.5 border-b-2 transition ${step === 'PAYMENT' ? 'border-emerald-600 text-emerald-800' : 'border-transparent text-gray-400'}`}>
            3. Pembayaran
          </div>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="m-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* STEP 1: CART REVIEW */}
          {step === 'CART' && (
            <div className="space-y-3">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-gray-400 space-y-2">
                  <ShoppingCart className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">Keranjang belanja Anda kosong</p>
                  <p className="text-xs text-gray-400">Pilih sayuran segar di katalog untuk melanjutkan.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {cart.map((item, idx) => (
                    <div key={item.product.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="w-12 h-12 shrink-0">
                        <ProductImage
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          isBundle={item.product.type === 'BUNDLE'}
                          category={item.product.category}
                          productName={item.product.name}
                          objectFit={item.product.type === 'BUNDLE' ? 'cover' : 'contain'}
                          containerClassName="rounded-xl border border-gray-100 shadow-2xs"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 truncate">{item.product.name}</h4>
                        <p className="text-xs text-gray-500">
                          {formatRupiah(item.sellingPrice)} / {item.unit}
                        </p>
                        {item.product.type === 'BUNDLE' && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Paket Bundling
                          </span>
                        )}
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center space-x-1.5 bg-gray-50 border border-gray-200 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, item.quantity - (item.product.baseUnit === 'Gram' ? 50 : 1))}
                          className="p-1 rounded text-gray-600 hover:bg-gray-200"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-12 text-center font-bold text-xs text-gray-900">
                          {formatNumber(item.quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(idx, item.quantity + (item.product.baseUnit === 'Gram' ? 50 : 1))}
                          className="p-1 rounded text-gray-600 hover:bg-gray-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="font-extrabold text-sm text-emerald-800">
                          {formatRupiah(item.subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => onRemoveItem(idx)}
                          className="block ml-auto text-xs text-gray-400 hover:text-red-600 mt-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Order summary box */}
              {cart.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({cart.length} item sayur):</span>
                    <span className="font-bold text-gray-900">{formatRupiah(subtotal)}</span>
                  </div>
                  {subtotal >= deliveryConfig.freeShippingMinAmount && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Promo Spesial:</span>
                      <span>🎉 Gratis Ongkir!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ADDRESS & MAP SELECTION */}
          {step === 'ADDRESS' && (
            <div className="space-y-4">
              {/* Saved Address Selector */}
              {savedAddresses.length > 0 && !isAddingNewAddress && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700">Pilih Alamat Tersimpan:</label>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddress(true)}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      + Buat Alamat Baru
                    </button>
                  </div>
                  <div className="space-y-2">
                    {savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer transition ${
                          selectedAddressId === addr.id
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold text-gray-900">
                          <span className="flex items-center space-x-1.5">
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                              {addr.label}
                            </span>
                            <span>{addr.recipientName}</span>
                          </span>
                          <span className="text-gray-500 font-normal">{addr.phone}</span>
                        </div>
                        <p className="text-gray-600 mt-1">{addr.addressDetails}</p>
                        {addr.notes && <p className="text-gray-400 text-[11px] italic mt-0.5">Catatan: {addr.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Address Form with Interactive Map */}
              {isAddingNewAddress && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-gray-200">
                    <span className="font-bold text-gray-800">Form Alamat & Titik Pengantaran Baru</span>
                    {savedAddresses.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewAddress(false)}
                        className="text-gray-500 hover:text-gray-800 text-[11px] underline"
                      >
                        Batal, pilih yang tersimpan
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-0.5">Label Alamat</label>
                      <input
                        type="text"
                        placeholder="Contoh: Rumah, Kantor"
                        value={addressLabel}
                        onChange={(e) => setAddressLabel(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-0.5">Nama Penerima *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nama Anda"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-0.5">Nomor WhatsApp / Telp *</label>
                    <input
                      type="text"
                      required
                      placeholder="0812-xxxx-xxxx"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-0.5">Rincian Alamat Lengkap *</label>
                    <textarea
                      rows={2}
                      required
                      placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
                      value={addressDetails}
                      onChange={(e) => setAddressDetails(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none"
                    />
                  </div>

                  {/* Interactive Leaflet Map Picker */}
                  <div className="space-y-1">
                    <label className="block font-bold text-gray-800">
                      Pilih Titik Antar di Peta & Hitung Jarak:
                    </label>
                    <MapLocationPicker
                      latitude={latitude}
                      longitude={longitude}
                      onChangeLocation={(lat, lng) => {
                        setLatitude(lat);
                        setLongitude(lng);
                      }}
                      storeLat={deliveryConfig.storeLatitude}
                      storeLng={deliveryConfig.storeLongitude}
                      heightClass="h-48"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-0.5">Catatan Khusus Pengantaran (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pagar abu-abu, titip di sekuriti"
                      value={addressNotes}
                      onChange={(e) => setAddressNotes(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Distance & Shipping Fee Calculation Display */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700 flex items-center space-x-1">
                    <Truck className="w-4 h-4 text-emerald-700" />
                    <span>Jarak dari Kios Sayur:</span>
                  </span>
                  <span className="font-bold text-gray-900">
                    ~{distanceKm} km <span className="font-normal text-gray-500">(Estimasi Haversine)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60">
                  <span className="font-semibold text-gray-700">Ongkos Kirim:</span>
                  <span className={`font-extrabold ${shippingInfo.isFreeShipping ? 'text-emerald-700' : 'text-gray-900'}`}>
                    {shippingInfo.isFreeShipping ? 'GRATIS (Promo Belanja)' : formatRupiah(shippingInfo.fee)}
                  </span>
                </div>

                {shippingInfo.requiresManual && (
                  <p className="text-[11px] text-red-600 font-semibold pt-1">
                    ⚠️ Alamat berada di luar batas pengiriman ({distanceKm} km &gt; {deliveryConfig.maxRadiusKm} km). Perlu konfirmasi kurir khusus.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === 'PAYMENT' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-800 mb-2">Pilih Metode Pembayaran:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'TRANSFER'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold">
                      <CreditCard className="w-4 h-4 text-emerald-700" />
                      <span>Transfer Bank</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">BCA, Mandiri, BRI, BSI</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'QRIS'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold">
                      <QrCode className="w-4 h-4 text-emerald-700" />
                      <span>QRIS / E-Wallet</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">GoPay, OVO, Dana, Shopee</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'COD'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-1.5 font-bold">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                      <span>Bayar di Tempat</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Bayar Tunai ke Kurir (COD)</p>
                  </button>
                </div>
              </div>

              {/* PAYMENT DETAILS ACCORDION */}
              {paymentMethod === 'TRANSFER' && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                  <div className="space-y-1">
                    <p className="font-bold text-gray-800">Rekening Tujuan Pembayaran SAYURKU:</p>
                    <div className="p-2.5 rounded-xl bg-white border border-gray-200 font-mono text-xs">
                      <p className="text-gray-500">Bank: <strong className="text-gray-900 font-sans">{storeProfile.bankName || 'BCA (Bank Central Asia)'}</strong></p>
                      <p className="text-gray-500">No. Rekening: <strong className="text-emerald-800 text-sm">{storeProfile.bankAccountNumber || '8820-1928-3341'}</strong></p>
                      <p className="text-gray-500">Atas Nama: <strong className="text-gray-900 font-sans">{storeProfile.bankAccountHolder || storeProfile.ownerName || 'SAYURKU SEGAR'}</strong></p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Unggah Bukti Transfer / Nomor Referensi (Opsional saat ini, dapat diunggah nanti)
                    </label>
                    <input
                      type="text"
                      placeholder="Nomor referensi mutasi transfer / link foto struk"
                      value={paymentProofData}
                      onChange={(e) => setPaymentProofData(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'QRIS' && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center space-y-3">
                  <div className="inline-block p-3 rounded-2xl bg-white border border-gray-200 shadow-xs">
                    <div className="w-36 h-36 mx-auto bg-gray-100 rounded-xl flex flex-col items-center justify-center p-2 border border-dashed border-gray-300">
                      <QrCode className="w-20 h-20 text-emerald-800" />
                      <span className="text-[10px] font-mono text-gray-500 mt-1">QRIS SAYURKU</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <p className="font-bold text-gray-900">Scan QRIS menggunakan mobile banking atau e-wallet apa saja</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Total Tagihan: <strong className="text-emerald-800 font-extrabold">{formatRupiah(finalTotal)}</strong></p>
                  </div>
                </div>
              )}

              {paymentMethod === 'COD' && (
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <Info className="w-4 h-4 text-blue-700" />
                    <span>Ketentuan Bayar di Tempat (COD):</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    Siapkan uang pas sejumlah <strong>{formatRupiah(finalTotal)}</strong> saat kurir sayur kami tiba di lokasi Anda. Status pembayaran akan otomatis lunas saat kurir menyerahkan pesanan.
                  </p>
                </div>
              )}

              {/* Final Note Input */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Pesan Khusus untuk Penjual (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tolong pilih bayam yang muda, cabai dipisah"
                  value={customerOrderNotes}
                  onChange={(e) => setCustomerOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none"
                />
              </div>

              {/* Total Calculation */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal Sayuran:</span>
                  <span>{formatRupiah(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Ongkos Kirim ({distanceKm} km):</span>
                  <span>{shippingInfo.isFreeShipping ? 'Rp 0' : formatRupiah(shippingInfo.fee)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-emerald-950 pt-1 border-t border-emerald-200">
                  <span>TOTAL PEMBAYARAN:</span>
                  <span className="text-base text-emerald-800">{formatRupiah(finalTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          {step === 'CART' ? (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-lg"
            >
              Lanjut Belanja
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep(step === 'PAYMENT' ? 'ADDRESS' : 'CART')}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
          )}

          {step === 'CART' && (
            <button
              type="button"
              disabled={cart.length === 0}
              onClick={() => setStep('ADDRESS')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
            >
              <span>Pilih Alamat Antar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 'ADDRESS' && (
            <button
              type="button"
              onClick={async () => {
                if (isAddingNewAddress) {
                  const ok = await handleSaveDraftAddress();
                  if (!ok) return;
                }
                setStep('PAYMENT');
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <span>Lanjut ke Pembayaran</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 'PAYMENT' && (
            <button
              type="button"
              disabled={isSubmitting || cart.length === 0}
              onClick={handlePlaceOrder}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isSubmitting ? 'Memproses Pesanan...' : `Konfirmasi Pesanan (${formatRupiah(finalTotal)})`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
