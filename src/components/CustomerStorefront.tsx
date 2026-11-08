import React, { useState, useMemo } from 'react';
import { Product, CartItem, Order, DeliveryRateConfig, StoreProfile } from '../types';
import { formatRupiah, formatNumber } from '../lib/utils';
import { productService } from '../services/productService';
import { ProductImage } from './ProductImage';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Package, 
  Layers, 
  Leaf, 
  Sparkles, 
  Clock, 
  MapPin, 
  Phone, 
  ArrowRight,
  Store,
  CheckCircle,
  Truck,
  X,
  Eye
} from 'lucide-react';

interface CustomerStorefrontProps {
  products: Product[];
  categories: string[];
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (index: number, newQty: number) => void;
  onOpenCheckout: () => void;
  onOpenTracking: () => void;
  ordersCount: number;
  activeOrdersCount: number;
  storeProfile: StoreProfile;
  deliveryConfig: DeliveryRateConfig;
}

export const CustomerStorefront: React.FC<CustomerStorefrontProps> = ({
  products,
  categories,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onOpenCheckout,
  onOpenTracking,
  ordersCount,
  activeOrdersCount,
  storeProfile,
  deliveryConfig
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  // Compute available stock for all products
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

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // Total items in cart
  const cartTotalItems = useMemo(() => {
    return cart.reduce((sum, it) => sum + it.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, it) => sum + it.subtotal, 0);
  }, [cart]);

  return (
    <div className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Sayuran Segar Dipetik Langsung dari Kebun</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans">
            {storeProfile.storeName || 'SAYURKU – Belanja Sayur Segar'}
          </h1>

          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed max-w-xl">
            Pesan sayuran segar harian, bumbu dapur, dan paket bundling siap masak (Sayur Sop, Sayur Asem, Tumis) diantar langsung ke rumah Anda dengan cepat dan higienis.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-emerald-200 font-medium">
            <span className="flex items-center space-x-1 bg-emerald-900/40 px-2.5 py-1 rounded-lg">
              <Truck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Gratis Ongkir Min. {formatRupiah(deliveryConfig.freeShippingMinAmount)}</span>
            </span>
            <span className="flex items-center space-x-1 bg-emerald-900/40 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-emerald-300" />
              <span>Pengantaran Hari Ini</span>
            </span>
          </div>
        </div>

        {/* Decorative Leaf shape */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <Leaf className="w-72 h-72 text-white" />
        </div>
      </div>

      {/* Search & Category Filter Navigation */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs space-y-3 sticky top-16 z-20 backdrop-blur-md bg-white/95">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari sayuran (contoh: Kangkung, Bayam, Wortel, Paket Sayur Sop)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Quick Orders Button */}
          {ordersCount > 0 && (
            <button
              onClick={onOpenTracking}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center space-x-2 transition whitespace-nowrap"
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Pesanan Saya</span>
              {activeOrdersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-500 text-amber-950 font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {activeOrdersCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            onClick={() => setSelectedCategory('Semua')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition ${
              selectedCategory === 'Semua'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Semua Sayuran ({products.filter(p => p.isActive).length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition ${
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

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200">
            <Package className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <h4 className="font-bold text-gray-700 text-sm">Tidak ada sayuran ditemukan</h4>
            <p className="text-xs text-gray-400 mt-1">Coba kata kunci lain atau pilih kategori Semua.</p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const stock = productStocks.get(p.id) || 0;
            const isOutOfStock = stock <= 0;
            const isBundle = p.type === 'BUNDLE';

            // Check if already in cart
            const cartItemIndex = cart.findIndex(c => c.product.id === p.id);
            const inCartItem = cartItemIndex > -1 ? cart[cartItemIndex] : null;

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-gray-100 p-4 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-emerald-200 transition-all group"
              >
                <div>
                  {/* Product Image 1:1 Aspect Ratio with fallback & click to view detail */}
                  <div className="relative mb-3 group/img">
                    <ProductImage
                      src={p.imageUrl}
                      alt={p.imageAlt || p.name}
                      isBundle={isBundle}
                      category={p.category}
                      productName={p.name}
                      objectFit={isBundle ? 'cover' : 'contain'}
                      onClick={() => setDetailProduct(p)}
                      containerClassName="hover:shadow-sm transition-shadow cursor-pointer"
                    />

                    {/* Stock Alert Pill */}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs rounded-2xl flex items-center justify-center pointer-events-none">
                        <span className="px-3 py-1 rounded-full bg-red-600 text-white font-extrabold text-xs shadow-md">
                          Habis
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badge & Stock */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      isBundle ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isBundle ? 'PAKET SIAP MASAK' : p.baseUnit}
                    </span>
                    <span className={`text-[11px] font-bold ${
                      stock <= p.minStock ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {isOutOfStock ? 'Habis' : `Tersedia: ${formatNumber(stock)}`}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-emerald-700 leading-snug">
                    {p.name}
                  </h3>

                  {/* Description preview */}
                  {p.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                      {p.description}
                    </p>
                  )}

                  {/* Bundle Components Preview */}
                  {isBundle && p.bundleItems && (
                    <p className="text-[10px] text-amber-800/80 bg-amber-50/60 p-1.5 rounded-lg line-clamp-2 mt-1.5">
                      <strong>Isi:</strong> {p.bundleItems.map(c => `${c.productName} (${c.quantity} ${c.unit})`).join(', ')}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="font-extrabold text-base text-emerald-800">
                      {formatRupiah(p.sellingPrice)}
                    </span>
                    <span className="text-[11px] text-gray-400 font-normal">
                      / {p.baseUnit}
                    </span>
                  </div>

                  {/* Add to Cart or Quantity Controller */}
                  {inCartItem ? (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(cartItemIndex, inCartItem.quantity - (p.baseUnit === 'Gram' ? 50 : 1))}
                        className="w-7 h-7 rounded-lg bg-white text-emerald-800 shadow-xs flex items-center justify-center hover:bg-emerald-100"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs text-emerald-950">
                        {formatNumber(inCartItem.quantity)} {p.baseUnit}
                      </span>
                      <button
                        type="button"
                        disabled={inCartItem.quantity >= stock}
                        onClick={() => onUpdateQuantity(cartItemIndex, inCartItem.quantity + (p.baseUnit === 'Gram' ? 50 : 1))}
                        className="w-7 h-7 rounded-lg bg-emerald-600 text-white shadow-xs flex items-center justify-center hover:bg-emerald-700 disabled:opacity-40"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => onAddToCart(p)}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition ${
                        isOutOfStock
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 active:scale-95'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isOutOfStock ? 'Stok Habis' : 'Tambah'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar (Sticky when cart has items) */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40">
          <div className="bg-emerald-900 text-white p-4 rounded-3xl shadow-2xl border border-emerald-700 flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-emerald-950 flex items-center justify-center font-extrabold text-sm shadow-md">
                {cart.length}
              </div>
              <div>
                <p className="text-[11px] text-emerald-300 font-medium">Total Pesanan Sayur:</p>
                <p className="text-base font-extrabold text-white leading-tight">
                  {formatRupiah(cartSubtotal)}
                </p>
              </div>
            </div>

            <button
              onClick={onOpenCheckout}
              className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-bold text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition transform active:scale-95"
            >
              <span>Lihat Keranjang & Bayar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Detail Product Modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {detailProduct.category}
                </span>
                <h3 className="font-extrabold text-lg text-gray-900 mt-1">{detailProduct.name}</h3>
              </div>
              <button
                onClick={() => setDetailProduct(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Product Image 1:1 */}
              <div className="w-full max-w-[280px] mx-auto">
                <ProductImage
                  src={detailProduct.imageUrl}
                  alt={detailProduct.imageAlt || detailProduct.name}
                  isBundle={detailProduct.type === 'BUNDLE'}
                  category={detailProduct.category}
                  productName={detailProduct.name}
                  objectFit={detailProduct.type === 'BUNDLE' ? 'cover' : 'contain'}
                  containerClassName="shadow-md"
                />
              </div>

              {/* Price & Stock */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div>
                  <p className="text-xs text-gray-500 font-medium">Harga per {detailProduct.baseUnit}:</p>
                  <p className="text-xl font-extrabold text-emerald-800">
                    {formatRupiah(detailProduct.sellingPrice)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">Ketersediaan Stok:</p>
                  <p className="text-sm font-extrabold text-gray-800">
                    {(productStocks.get(detailProduct.id) || 0) > 0
                      ? `${formatNumber(productStocks.get(detailProduct.id) || 0)} ${detailProduct.baseUnit}`
                      : 'Habis'}
                  </p>
                </div>
              </div>

              {/* Description */}
              {detailProduct.description && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Deskripsi Sayuran</h4>
                  <p className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {detailProduct.description}
                  </p>
                </div>
              )}

              {/* Bundle Ingredients */}
              {detailProduct.type === 'BUNDLE' && detailProduct.bundleItems && detailProduct.bundleItems.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    <span>Komposisi Paket Sayur</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {detailProduct.bundleItems.map((comp, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs flex items-center justify-between"
                      >
                        <span className="font-semibold text-gray-800 truncate">{comp.productName}</span>
                        <span className="font-extrabold text-amber-800 shrink-0 ml-2">
                          {comp.quantity} {comp.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                disabled={(productStocks.get(detailProduct.id) || 0) <= 0}
                onClick={() => {
                  onAddToCart(detailProduct);
                  setDetailProduct(null);
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center space-x-2 transition ${
                  (productStocks.get(detailProduct.id) || 0) <= 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>
                  {(productStocks.get(detailProduct.id) || 0) <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
