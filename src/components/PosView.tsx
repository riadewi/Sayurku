import React, { useState, useMemo } from 'react';
import { Product, CartItem, Sale, PaymentMethod } from '../types';
import { formatRupiah, formatNumber } from '../lib/utils';
import { salesService } from '../services/salesService';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { ProductImage } from './ProductImage';
import confetti from 'canvas-confetti';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  DollarSign, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Package, 
  Layers, 
  Receipt,
  User,
  Sparkles
} from 'lucide-react';

interface PosViewProps {
  products: Product[];
  categories: string[];
  onSaleCompleted: (newSale: Sale) => void;
  onOpenReceipt: (sale: Sale) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  categories,
  onSaleCompleted,
  onOpenReceipt
}) => {
  const { user, businessId, storeProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute available stock for each product (especially bundles)
  const productStocks = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (p.type === 'BUNDLE') {
        map.set(p.id, productService.calculateAvailableBundleStock(p, products));
      } else {
        map.set(p.id, p.currentStock || 0);
      }
    }
    return map;
  }, [products]);

  // Filter products by search and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discount);
  }, [subtotal, discount]);

  const numCashGiven = parseFloat(cashGiven) || 0;
  const change = paymentMethod === 'CASH' ? Math.max(0, numCashGiven - finalTotal) : 0;
  const isCashInsufficient = paymentMethod === 'CASH' && numCashGiven < finalTotal;

  // Add product to cart
  const addToCart = (product: Product) => {
    setErrorMessage(null);
    const available = productStocks.get(product.id) || 0;

    const existingIndex = cart.findIndex((it) => it.product.id === product.id);

    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      const newQty = currentQty + 1;

      if (newQty > available) {
        setErrorMessage(`Stok "${product.name}" tidak mencukupi (tersedia: ${available} ${product.baseUnit}).`);
        return;
      }

      const updated = [...cart];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: newQty,
        subtotal: newQty * product.sellingPrice
      };
      setCart(updated);
    } else {
      if (available <= 0) {
        setErrorMessage(`Stok "${product.name}" habis.`);
        return;
      }

      setCart([
        ...cart,
        {
          product,
          quantity: 1,
          unit: product.baseUnit,
          sellingPrice: product.sellingPrice,
          costPrice: product.purchaseCost,
          subtotal: product.sellingPrice,
          discount: 0
        }
      ]);
    }
  };

  // Update quantity in cart
  const updateQuantity = (index: number, newQty: number) => {
    setErrorMessage(null);
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    const item = cart[index];
    const available = productStocks.get(item.product.id) || 0;

    if (newQty > available) {
      setErrorMessage(`Stok "${item.product.name}" tidak mencukupi (tersedia: ${available} ${item.product.baseUnit}).`);
      return;
    }

    const updated = [...cart];
    updated[index] = {
      ...item,
      quantity: Number(newQty.toFixed(2)),
      subtotal: Number((newQty * item.sellingPrice).toFixed(0))
    };
    setCart(updated);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, idx) => idx !== index));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCashGiven('');
    setErrorMessage(null);
  };

  // Quick cash shortcut
  const handleQuickCash = (amount: number) => {
    setCashGiven(String(amount));
  };

  // Process and save sale
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setErrorMessage('Pilih minimal satu produk sayur ke dalam keranjang.');
      return;
    }

    if (paymentMethod === 'CASH' && numCashGiven < finalTotal) {
      setErrorMessage(`Uang pembayaran tunai kurang sebesar ${formatRupiah(finalTotal - numCashGiven)}.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const sale = await salesService.processSale({
        businessId,
        items: cart,
        discount,
        paymentMethod,
        paymentAmount: paymentMethod === 'CASH' ? numCashGiven : finalTotal,
        cashierUid: user?.uid || 'cashier',
        cashierName: user?.displayName || storeProfile.ownerName || 'Kasir',
        customerName: customerName.trim() || 'Pelanggan Umum',
        notes: notes.trim()
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {
        // ignore
      }

      // Reset cart
      setCart([]);
      setDiscount(0);
      setCashGiven('');
      setCustomerName('');
      setNotes('');

      // Notify parent & open receipt
      onSaleCompleted(sale);
      onOpenReceipt(sale);
    } catch (err: any) {
      console.warn('Checkout notice:', err?.message || err);
      setErrorMessage(err.message || 'Gagal memproses transaksi kasir.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Product Catalog & Touch Buttons */}
      <div className="lg:col-span-7 xl:col-span-8 space-y-4">
        {/* Search & Category Header */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari sayur (contoh: Bayam, Wortel, Paket Sop)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                Hapus
              </button>
            )}
          </div>

          {/* Category Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategory('Semua')}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl font-medium transition ${
                selectedCategory === 'Semua'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua Sayuran
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-700">Tidak ada produk ditemukan</p>
              <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau tambahkan produk baru di menu Produk.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const stock = productStocks.get(p.id) || 0;
              const isOutOfStock = stock <= 0;
              const isBundle = p.type === 'BUNDLE';

              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={isOutOfStock}
                  className={`
                    relative text-left p-3 rounded-2xl border transition-all flex flex-col justify-between h-44 active:scale-95 group
                    ${isOutOfStock 
                      ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' 
                      : 'bg-white border-gray-100 hover:border-emerald-500 hover:shadow-md cursor-pointer'
                    }
                  `}
                >
                  <div className="flex items-start gap-2.5 w-full">
                    <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden border border-gray-100 bg-emerald-50/40">
                      <ProductImage
                        src={p.imageUrl}
                        alt={p.name}
                        isBundle={isBundle}
                        category={p.category}
                        productName={p.name}
                        objectFit={isBundle ? 'cover' : 'contain'}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          isBundle ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isBundle ? 'PAKET' : p.baseUnit}
                        </span>
                        <span className={`text-[10px] font-bold ${
                          stock <= p.minStock ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {formatNumber(stock)}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs line-clamp-2 leading-snug mt-1 group-hover:text-emerald-700">
                        {p.name}
                      </h4>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between w-full pt-1.5 border-t border-gray-100 mt-auto">
                    <span className="font-extrabold text-xs sm:text-sm text-emerald-700">
                      {formatRupiah(p.sellingPrice)}
                    </span>
                    <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Active Cart & Checkout Panel */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-gray-100 shadow-md p-5 flex flex-col space-y-4">
        {/* Cart Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Keranjang Kasir</h3>
              <p className="text-[11px] text-gray-500">{cart.length} jenis item sayur</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-600 hover:text-red-700 font-semibold"
            >
              Kosongkan
            </button>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <ShoppingCart className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-xs font-medium text-gray-500">Keranjang masih kosong</p>
              <p className="text-[11px] text-gray-400">Pilih sayuran di samping untuk menambahkan ke pesanan.</p>
            </div>
          ) : (
            cart.map((item, index) => (
              <div key={item.product.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-xs text-gray-900">{item.product.name}</h5>
                    <p className="text-[11px] text-gray-500">
                      {formatRupiah(item.sellingPrice)} / {item.unit}
                    </p>
                  </div>
                  <span className="font-extrabold text-xs text-emerald-800">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {/* Quantity Controller with Decimal Support */}
                  <div className="flex items-center space-x-1.5 bg-white border border-gray-200 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQuantity(index, item.quantity - (item.product.baseUnit === 'Gram' ? 50 : 1))}
                      className="p-1 rounded text-gray-600 hover:bg-gray-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      step={item.product.baseUnit === 'Gram' ? '50' : '0.5'}
                      min="0.1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, parseFloat(e.target.value) || 0)}
                      className="w-14 text-center font-bold text-xs text-gray-800 focus:outline-none"
                    />
                    <span className="text-[10px] text-gray-500 pr-1">{item.unit}</span>
                    <button
                      onClick={() => updateQuantity(index, item.quantity + (item.product.baseUnit === 'Gram' ? 50 : 1))}
                      className="p-1 rounded text-gray-600 hover:bg-gray-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeFromCart(index)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Optional Customer & Notes */}
        <div className="pt-2 border-t border-gray-100 space-y-2 text-xs">
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="Nama Pelanggan (opsional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
            <input
              type="number"
              placeholder="Diskon (Rp)"
              value={discount || ''}
              onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-28 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
            />
          </div>
        </div>

        {/* Totals Summary */}
        <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal Sayur:</span>
            <span>{formatRupiah(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-red-600 font-medium">
              <span>Potongan Diskon:</span>
              <span>-{formatRupiah(discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-extrabold text-gray-900 pt-1 border-t border-emerald-200/60">
            <span>TOTAL TAGIHAN:</span>
            <span className="text-base text-emerald-800">{formatRupiah(finalTotal)}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="space-y-2 text-xs">
          <label className="font-semibold text-gray-700">Metode Pembayaran:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setPaymentMethod('CASH'); setCashGiven(String(finalTotal)); }}
              className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 font-bold transition ${
                paymentMethod === 'CASH'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Tunai (Cash)</span>
            </button>
            <button
              onClick={() => { setPaymentMethod('TRANSFER'); setCashGiven(String(finalTotal)); }}
              className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 font-bold transition ${
                paymentMethod === 'TRANSFER'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Transfer / QRIS</span>
            </button>
          </div>
        </div>

        {/* Cash Input & Quick Shortcuts */}
        {paymentMethod === 'CASH' && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-gray-700">Uang Diterima:</label>
              <span className={`font-bold ${isCashInsufficient ? 'text-red-600' : 'text-emerald-700'}`}>
                Kembalian: {formatRupiah(change)}
              </span>
            </div>
            <input
              type="number"
              placeholder="0"
              value={cashGiven}
              onChange={(e) => setCashGiven(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 font-extrabold text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {/* Quick cash pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 no-scrollbar">
              <button
                type="button"
                onClick={() => handleQuickCash(finalTotal)}
                className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[11px]"
              >
                Uang Pas
              </button>
              {[10000, 20000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickCash(amt)}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-[11px] whitespace-nowrap"
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={handleCheckout}
          disabled={cart.length === 0 || isProcessing || (paymentMethod === 'CASH' && isCashInsufficient)}
          className={`
            w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center space-x-2 transition-all transform active:scale-98
            ${cart.length === 0 || isProcessing || (paymentMethod === 'CASH' && isCashInsufficient)
              ? 'bg-gray-300 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
            }
          `}
        >
          <Receipt className="w-4 h-4" />
          <span>
            {isProcessing ? 'Memproses Transaksi...' : `Bayar & Simpan (${formatRupiah(finalTotal)})`}
          </span>
        </button>
      </div>
    </div>
  );
};
