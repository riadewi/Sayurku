import React, { useState, useMemo } from 'react';
import { Product, ProductType, BundleComponent } from '../types';
import { formatRupiah, formatNumber } from '../lib/utils';
import { productService } from '../services/productService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Package, 
  Layers, 
  X, 
  Check, 
  AlertCircle,
  HelpCircle,
  Carrot,
  Leaf,
  Upload,
  Image as ImageIcon,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { seedFullVegetableCatalog } from '../services/seedData';

interface ProductsViewProps {
  products: Product[];
  categories: string[];
  onRefresh: () => void;
}

const standardUnits = ['Ikat', 'Buah', 'Kilogram', 'Gram', 'Ons', 'Pack', 'Paket', 'Bungkus', 'Batang', 'Pcs'];

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  onRefresh
}) => {
  const { businessId } = useAuth();
  const { toast, confirmAction } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [activeTabType, setActiveTabType] = useState<'ALL' | 'SINGLE' | 'BUNDLE'>('ALL');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formType, setFormType] = useState<ProductType>('SINGLE');
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Sayuran Daun');
  const [baseUnit, setBaseUnit] = useState('Ikat');
  const [sellingUnit, setSellingUnit] = useState('Ikat');
  const [unitConversion, setUnitConversion] = useState('1');
  const [purchaseCost, setPurchaseCost] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [currentStock, setCurrentStock] = useState<string>('0');
  const [minStock, setMinStock] = useState<string>('5');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // Bundle Recipe state
  const [bundleItems, setBundleItems] = useState<BundleComponent[]>([]);
  const [selectedCompId, setSelectedCompId] = useState<string>('');
  const [compQty, setCompQty] = useState<string>('1');

  const [isSaving, setIsSaving] = useState(false);
  const [isSeedingFull, setIsSeedingFull] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Available single products for bundle recipe components
  const singleProducts = useMemo(() => {
    return products.filter(p => p.type === 'SINGLE' && p.isActive);
  }, [products]);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchType = activeTabType === 'ALL' || p.type === activeTabType;
      const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchType && matchCat && matchSearch;
    });
  }, [products, activeTabType, selectedCategory, searchTerm]);

  // Open modal for Create
  const handleOpenAdd = (type: ProductType = 'SINGLE') => {
    setEditingProduct(null);
    setFormType(type);
    setName('');
    setCategory(type === 'BUNDLE' ? 'Paket Bundling Sayur' : (categories[0] || 'Sayuran Daun'));
    setBaseUnit(type === 'BUNDLE' ? 'Paket' : 'Ikat');
    setSellingUnit(type === 'BUNDLE' ? 'Paket' : 'Ikat');
    setUnitConversion('1');
    setPurchaseCost('');
    setSellingPrice('');
    setCurrentStock('0');
    setMinStock('5');
    setDescription('');
    setImageUrl('');
    setImageAlt('');
    setIsActive(true);
    setBundleItems([]);
    setSelectedCompId(singleProducts[0]?.id || '');
    setCompQty('1');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormType(p.type);
    setName(p.name);
    setCategory(p.category);
    setBaseUnit(p.baseUnit);
    setSellingUnit(p.sellingUnit || p.baseUnit);
    setUnitConversion(String(p.unitConversion || 1));
    setPurchaseCost(String(p.purchaseCost));
    setSellingPrice(String(p.sellingPrice));
    setCurrentStock(String(p.currentStock || 0));
    setMinStock(String(p.minStock || 0));
    setDescription(p.description || '');
    setImageUrl(p.imageUrl || '');
    setImageAlt(p.imageAlt || p.name);
    setIsActive(p.isActive);
    setBundleItems(p.bundleItems ? [...p.bundleItems] : []);
    setSelectedCompId(singleProducts[0]?.id || '');
    setCompQty('1');
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  // Handle Image File Upload (converts to base64 data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast('Ukuran file foto maksimal 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImageUrl(result);
        if (!imageAlt) {
          setImageAlt(name || 'Foto Sayuran Segar');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Seed Full 78-item Vegetable Catalog
  const handleSeedFullCatalog = async () => {
    if (!businessId) return;
    setIsSeedingFull(true);
    setSuccessBanner(null);
    try {
      const res = await seedFullVegetableCatalog(businessId);
      onRefresh();
      setSuccessBanner(`Katalog 78 sayuran segar (18 Sayuran Daun, 25 Sayuran Umbi & Buah, 20 Bumbu Rempah, 15 Paket Bundling) berhasil ditambahkan!`);
      setTimeout(() => setSuccessBanner(null), 8000);
      toast('Berhasil memuat 78 katalog sayuran segar!', 'success');
    } catch (err: any) {
      toast('Gagal memuat katalog lengkap: ' + (err.message || 'Error'), 'error');
    } finally {
      setIsSeedingFull(false);
    }
  };

  // Add component to bundle recipe
  const handleAddComponent = () => {
    if (!selectedCompId) return;
    const prod = singleProducts.find(p => p.id === selectedCompId);
    if (!prod) return;

    const qty = parseFloat(compQty) || 1;
    if (qty <= 0) return;

    // Check if component already in recipe
    const existingIndex = bundleItems.findIndex(it => it.productId === selectedCompId);
    let updated: BundleComponent[];
    if (existingIndex > -1) {
      updated = [...bundleItems];
      updated[existingIndex].quantity += qty;
    } else {
      updated = [
        ...bundleItems,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unit: prod.baseUnit
        }
      ];
    }
    setBundleItems(updated);

    // Auto-calculate suggested bundle purchase cost (HPP)
    const totalHpp = productService.calculateBundleHpp(updated, products);
    setPurchaseCost(String(Math.round(totalHpp)));
  };

  const handleRemoveComponent = (productId: string) => {
    const updated = bundleItems.filter(it => it.productId !== productId);
    setBundleItems(updated);
    const totalHpp = productService.calculateBundleHpp(updated, products);
    setPurchaseCost(String(Math.round(totalHpp)));
  };

  // Save product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama sayuran wajib diisi.');
      return;
    }

    const price = parseFloat(sellingPrice);
    if (isNaN(price) || price < 0) {
      setErrorMessage('Harga jual harus berupa angka yang valid.');
      return;
    }

    const cost = parseFloat(purchaseCost) || 0;
    const stock = parseFloat(currentStock) || 0;
    const min = parseFloat(minStock) || 0;
    const conversion = parseFloat(unitConversion) || 1;

    if (formType === 'BUNDLE' && bundleItems.length === 0) {
      setErrorMessage('Paket bundling wajib memiliki minimal 1 bahan racikan sayuran.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const nowIso = new Date().toISOString();

    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, {
          name: name.trim(),
          category,
          baseUnit,
          sellingUnit: sellingUnit.trim() || baseUnit,
          unitConversion: conversion,
          purchaseCost: cost,
          sellingPrice: price,
          currentStock: formType === 'BUNDLE' ? 0 : stock,
          minStock: min,
          description: description.trim(),
          imageUrl: imageUrl.trim() || undefined,
          imageAlt: imageAlt.trim() || name.trim(),
          imageUpdatedAt: imageUrl ? nowIso : undefined,
          isActive,
          bundleItems: formType === 'BUNDLE' ? bundleItems : undefined
        });
      } else {
        await productService.createProduct({
          businessId,
          name: name.trim(),
          category,
          type: formType,
          baseUnit,
          sellingUnit: sellingUnit.trim() || baseUnit,
          unitConversion: conversion,
          purchaseCost: cost,
          sellingPrice: price,
          currentStock: formType === 'BUNDLE' ? 0 : stock,
          minStock: min,
          description: description.trim(),
          imageUrl: imageUrl.trim() || undefined,
          imageAlt: imageAlt.trim() || name.trim(),
          imageUpdatedAt: imageUrl ? nowIso : undefined,
          isActive,
          bundleItems: formType === 'BUNDLE' ? bundleItems : undefined
        });
      }

      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      console.warn('Error saving product:', err?.message || err);
      setErrorMessage(err.message || 'Gagal menyimpan produk.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    const ok = await confirmAction(`Yakin ingin menghapus produk "${p.name}"?`, 'Hapus Produk');
    if (!ok) return;
    try {
      await productService.deleteProduct(p.id);
      toast(`Produk "${p.name}" berhasil dihapus.`, 'success');
      onRefresh();
    } catch (err: any) {
      toast('Gagal menghapus produk: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-5">
      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button onClick={() => setSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-950 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama sayuran atau paket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            <option value="Semua">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSeedFullCatalog}
            disabled={isSeedingFull}
            className="px-3.5 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition disabled:opacity-50"
            title="Muat otomatis 78 produk sayuran lengkap beserta foto, takaran, dan resep bundling"
          >
            <Sparkles className={`w-3.5 h-3.5 text-teal-300 ${isSeedingFull ? 'animate-spin' : ''}`} />
            <span>{isSeedingFull ? 'Memuat 78 Sayur...' : '🌱 Muat 78 Katalog Lengkap'}</span>
          </button>
          <button
            onClick={() => handleOpenAdd('SINGLE')}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Sayur</span>
          </button>
          <button
            onClick={() => handleOpenAdd('BUNDLE')}
            className="px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-sm transition"
          >
            <Layers className="w-4 h-4" />
            <span>Buat Paket Bundling</span>
          </button>
        </div>
      </div>

      {/* Tabs Type Filter */}
      <div className="flex items-center space-x-2 border-b border-gray-200 pb-2 text-sm">
        <button
          onClick={() => setActiveTabType('ALL')}
          className={`px-4 py-2 rounded-xl font-bold transition ${
            activeTabType === 'ALL'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Semua ({products.length})
        </button>
        <button
          onClick={() => setActiveTabType('SINGLE')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
            activeTabType === 'SINGLE'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Leaf className="w-4 h-4" />
          <span>Sayur Satuan ({products.filter(p => p.type === 'SINGLE').length})</span>
        </button>
        <button
          onClick={() => setActiveTabType('BUNDLE')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center space-x-1.5 ${
            activeTabType === 'BUNDLE'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Paket Bundling ({products.filter(p => p.type === 'BUNDLE').length})</span>
        </button>
      </div>

      {/* Products Table / Cards */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase font-bold text-gray-500">
              <tr>
                <th className="px-5 py-3.5">Nama Sayur / Paket</th>
                <th className="px-4 py-3.5">Tipe</th>
                <th className="px-4 py-3.5">Kategori</th>
                <th className="px-4 py-3.5 text-right">Harga Modal (HPP)</th>
                <th className="px-4 py-3.5 text-right">Harga Jual</th>
                <th className="px-4 py-3.5 text-right">Margin / Unit</th>
                <th className="px-4 py-3.5 text-center">Stok</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                    Belum ada produk sesuai filter
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isBundle = p.type === 'BUNDLE';
                  const availableStock = isBundle
                    ? productService.calculateAvailableBundleStock(p, products)
                    : p.currentStock || 0;
                  const margin = p.sellingPrice - p.purchaseCost;

                  return (
                    <tr key={p.id} className="hover:bg-emerald-50/30 transition">
                      {/* Photo Thumbnail & Name & Recipe preview */}
                      <td className="px-5 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                            {p.imageUrl ? (
                              <img 
                                src={p.imageUrl} 
                                alt={p.imageAlt || p.name} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <Leaf className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 leading-tight">{p.name}</div>
                            {p.description && (
                              <p className="text-[11px] text-gray-400 line-clamp-1 max-w-xs mt-0.5">{p.description}</p>
                            )}
                            {isBundle && p.bundleItems && (
                              <div className="text-[11px] text-gray-500 mt-1 max-w-xs">
                                <span className="font-medium text-emerald-800">Komposisi: </span>
                                {p.bundleItems.map(c => `${c.productName} (${c.quantity} ${c.unit})`).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${
                          isBundle ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isBundle ? 'BUNDLING' : 'SATUAN'}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4 text-xs font-medium text-gray-600">
                        {p.category}
                      </td>

                      {/* Purchase Cost */}
                      <td className="px-4 py-4 text-right font-medium text-gray-600">
                        {formatRupiah(p.purchaseCost)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-4 text-right font-bold text-emerald-700">
                        {formatRupiah(p.sellingPrice)}
                        <span className="text-[11px] font-normal text-gray-500 block">
                          / {p.baseUnit}
                        </span>
                      </td>

                      {/* Margin */}
                      <td className="px-4 py-4 text-right">
                        <span className={`font-semibold text-xs ${margin >= 0 ? 'text-teal-700' : 'text-red-600'}`}>
                          +{formatRupiah(margin)}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                          availableStock <= p.minStock 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {formatNumber(availableStock)} {p.baseUnit}
                        </span>
                        {isBundle && (
                          <span className="block text-[10px] text-gray-400 mt-0.5">
                            (dinamis dari bahan)
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {p.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit Produk"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            title="Hapus Produk"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Product Form Modal (Add / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="font-bold text-gray-900 text-base flex items-center space-x-2">
                {formType === 'BUNDLE' ? <Layers className="w-5 h-5 text-amber-600" /> : <Package className="w-5 h-5 text-emerald-600" />}
                <span>
                  {editingProduct ? 'Edit Produk Sayur' : (formType === 'BUNDLE' ? 'Buat Paket Bundling Baru' : 'Tambah Sayuran Baru')}
                </span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Type Switcher if creating new */}
              {!editingProduct && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => { setFormType('SINGLE'); setBaseUnit('Ikat'); }}
                    className={`py-2 rounded-lg transition ${
                      formType === 'SINGLE' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Sayuran Satuan (Single)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFormType('BUNDLE'); setBaseUnit('Paket'); setCategory('Paket Bundling Sayur'); }}
                    className={`py-2 rounded-lg transition ${
                      formType === 'BUNDLE' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Paket Bundling (Resep Racikan)
                  </button>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama Sayur / Nama Paket *
                </label>
                <input
                  type="text"
                  required
                  placeholder={formType === 'BUNDLE' ? 'Contoh: Paket Sayur Sop Gurih' : 'Contoh: Bayam Cabut Segar'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Product Photo Upload Section (1:1 Square) */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3">
                <label className="block text-xs font-bold text-gray-800">
                  Foto Produk Sayuran (Rasio 1:1 Persegi)
                </label>
                <div className="flex items-start space-x-4">
                  {/* Preview Box */}
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 bg-white overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                    {imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={imageAlt || 'Pratinjau'} 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                        <ImageIcon className="w-7 h-7 mb-1" />
                        <span className="text-[9px]">Belum Ada</span>
                      </div>
                    )}
                  </div>

                  {/* Upload & URL Controls */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-xs transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{imageUrl ? 'Ganti Foto' : 'Unggah Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => { setImageUrl(''); setImageAlt(''); }}
                          className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs transition"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="Atau tempel URL gambar (https://...)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Teks keterangan foto (alt)"
                      value={imageAlt}
                      onChange={(e) => setImageAlt(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deskripsi Sayuran (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan kesegaran sayur, tips memasak, atau manfaat gizi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kategori *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Sayuran Daun">Sayuran Daun</option>
                    <option value="Sayuran Umbi dan Buah">Sayuran Umbi dan Buah</option>
                    <option value="Bumbu dan Rempah">Bumbu dan Rempah</option>
                    <option value="Paket Bundling Sayur">Paket Bundling Sayur</option>
                    {categories.filter(c => !['Sayuran Daun', 'Sayuran Umbi dan Buah', 'Bumbu dan Rempah', 'Paket Bundling Sayur'].includes(c)).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Satuan Ukuran Dasar *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ikat, Buah, Kg, Gram, dll"
                    value={baseUnit}
                    onChange={(e) => {
                      setBaseUnit(e.target.value);
                      if (!sellingUnit) setSellingUnit(e.target.value);
                    }}
                    list="units-list"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="units-list">
                    {standardUnits.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
              </div>

              {/* Unit Conversion (Satuan Jual) */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Satuan Jual ke Pelanggan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pack, Ikat, Kg"
                    value={sellingUnit}
                    onChange={(e) => setSellingUnit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                    Konversi (1 Satuan Jual = x Satuan Dasar)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    placeholder="1"
                    value={unitConversion}
                    onChange={(e) => setUnitConversion(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* BUNDLE RECIPE BUILDER SECTION */}
              {formType === 'BUNDLE' && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-amber-900 flex items-center space-x-1.5">
                        <Layers className="w-4 h-4 text-amber-700" />
                        <span>Komposisi Resep Sayuran Bundling</span>
                      </h4>
                      <p className="text-[11px] text-amber-800/80">
                        Pilih bahan sayur satuan dan takaran per 1 paket
                      </p>
                    </div>
                  </div>

                  {/* Add component controls */}
                  <div className="flex space-x-2">
                    <select
                      value={selectedCompId}
                      onChange={(e) => setSelectedCompId(e.target.value)}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 text-xs bg-white focus:outline-none"
                    >
                      {singleProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatRupiah(p.purchaseCost)} / {p.baseUnit})
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="Jumlah"
                      value={compQty}
                      onChange={(e) => setCompQty(e.target.value)}
                      className="w-20 px-2 py-1.5 rounded-lg border border-amber-300 text-xs text-center font-bold bg-white focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={handleAddComponent}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
                    >
                      + Tambah
                    </button>
                  </div>

                  {/* Configured Components list */}
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {bundleItems.length === 0 ? (
                      <p className="text-xs text-amber-700/70 italic text-center py-2">
                        Belum ada komposisi sayur. Tambahkan di atas.
                      </p>
                    ) : (
                      bundleItems.map((comp) => (
                        <div key={comp.productId} className="flex items-center justify-between p-2 rounded-lg bg-white border border-amber-200 text-xs">
                          <span className="font-medium text-gray-800">
                            {comp.productName}: <strong className="text-amber-900">{comp.quantity} {comp.unit}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(comp.productId)}
                            className="text-red-500 hover:text-red-700 p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Prices: Purchase Cost (HPP) & Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Harga Beli / HPP Modal (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                  {formType === 'BUNDLE' && (
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Dihitung otomatis dari total harga bahan
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Harga Jual ke Pelanggan (Rp) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Contoh: 15000"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-800"
                  />
                </div>
              </div>

              {/* Stock Inputs (For Single products only) */}
              {formType === 'SINGLE' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Stok Awal Saat Ini
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={currentStock}
                      onChange={(e) => setCurrentStock(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Batas Minimum Stok (Alert)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={minStock}
                      onChange={(e) => setMinStock(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-gray-700 cursor-pointer">
                  Produk Aktif (Tampil di Kasir Penjualan)
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50"
                >
                  {isSaving ? 'Menyimpan...' : (editingProduct ? 'Perbarui Produk' : 'Simpan Produk')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
