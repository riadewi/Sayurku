import React, { useState } from 'react';
import { Supplier, StoreProfile } from '../types';
import { supplierService, categoryService } from '../services/supplierService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  Settings, 
  Store, 
  Truck, 
  Tag, 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  Check, 
  Phone, 
  MapPin, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface SettingsViewProps {
  suppliers: Supplier[];
  categories: string[];
  onRefresh: () => void;
  onSeedData: () => Promise<void>;
  isSeeding: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  suppliers,
  categories,
  onRefresh,
  onSeedData,
  isSeeding
}) => {
  const { businessId, storeProfile, updateStoreProfile } = useAuth();
  const { toast, confirmAction } = useToast();
  
  // Store Profile Form State
  const [storeName, setStoreName] = useState(storeProfile.storeName || '');
  const [ownerName, setOwnerName] = useState(storeProfile.ownerName || '');
  const [phone, setPhone] = useState(storeProfile.phone || '');
  const [address, setAddress] = useState(storeProfile.address || '');
  const [footerNote, setFooterNote] = useState(storeProfile.footerNote || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState<string | null>(null);

  // Supplier Form State
  const [newSupName, setNewSupName] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupAddress, setNewSupAddress] = useState('');
  const [isAddingSup, setIsAddingSup] = useState(false);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  // Handle Save Store Profile
  const handleSaveStoreProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMessage(null);
    try {
      await updateStoreProfile({
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        footerNote: footerNote.trim()
      });
      setProfileSuccessMessage('Informasi profil toko berhasil disimpan!');
      setTimeout(() => setProfileSuccessMessage(null), 3000);
      toast('Informasi profil toko berhasil disimpan!', 'success');
    } catch (err: any) {
      toast('Gagal menyimpan profil: ' + err.message, 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Add Supplier
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    setIsAddingSup(true);
    try {
      await supplierService.addSupplier({
        businessId,
        name: newSupName.trim(),
        phone: newSupPhone.trim(),
        address: newSupAddress.trim()
      });
      setNewSupName('');
      setNewSupPhone('');
      setNewSupAddress('');
      toast(`Supplier "${newSupName.trim()}" berhasil ditambahkan.`, 'success');
      onRefresh();
    } catch (err: any) {
      toast('Gagal menambah supplier: ' + err.message, 'error');
    } finally {
      setIsAddingSup(false);
    }
  };

  const handleDeleteSupplier = async (s: Supplier) => {
    const ok = await confirmAction(`Hapus data supplier "${s.name}"?`, 'Hapus Supplier');
    if (!ok) return;
    try {
      await supplierService.deleteSupplier(s.id);
      toast(`Supplier "${s.name}" berhasil dihapus.`, 'success');
      onRefresh();
    } catch (err: any) {
      toast('Gagal menghapus supplier: ' + err.message, 'error');
    }
  };

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsAddingCat(true);
    try {
      await categoryService.addCategory(businessId, newCatName.trim());
      setNewCatName('');
      toast(`Kategori "${newCatName.trim()}" berhasil ditambahkan.`, 'success');
      onRefresh();
    } catch (err: any) {
      toast('Gagal menambah kategori: ' + err.message, 'error');
    } finally {
      setIsAddingCat(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* SECTION 1: PROFIL KIOS SAYUR */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Profil Kios / Usaha Sayur</h3>
            <p className="text-xs text-gray-500">Informasi ini dicetak pada nota kasir dan kepala struk belanja</p>
          </div>
        </div>

        {profileSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center space-x-2">
            <Check className="w-4 h-4" />
            <span>{profileSuccessMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveStoreProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nama Kios / Usaha Sayur *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Contoh: Kios Sayur Segar Berkah"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nama Pemilik / Pengelola
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Contoh: Ibu Siti Aminah"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 0812-3456-7890"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Alamat / Lokasi Lapak Pasar
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Contoh: Pasar Baru Blok B-05, Los Sayur"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Pesan Kaki Struk (Footer Struk)
            </label>
            <input
              type="text"
              value={footerNote}
              onChange={(e) => setFooterNote(e.target.value)}
              placeholder="Contoh: Terima kasih telah berbelanja sayur segar!"
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center space-x-1.5 shadow-xs transition"
            >
              <Save className="w-4 h-4" />
              <span>{isSavingProfile ? 'Menyimpan...' : 'Simpan Profil Toko'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: PEMASOK / SUPPLIER */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Data Pemasok (Supplier Sayur)</h3>
            <p className="text-xs text-gray-500">Kelola kontak petani atau juragan grosir tempat Anda kulakan sayur</p>
          </div>
        </div>

        {/* Add Supplier Form */}
        <form onSubmit={handleAddSupplier} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Nama Supplier *</label>
            <input
              type="text"
              required
              placeholder="Contoh: Kelompok Tani Lembang"
              value={newSupName}
              onChange={(e) => setNewSupName(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">No. Telp / WA</label>
            <input
              type="text"
              placeholder="0812-xxxx-xxxx"
              value={newSupPhone}
              onChange={(e) => setNewSupPhone(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Alamat Asal</label>
            <input
              type="text"
              placeholder="Contoh: Ciwidey, Bandung"
              value={newSupAddress}
              onChange={(e) => setNewSupAddress(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none"
            />
          </div>
          <div>
            <button
              type="submit"
              disabled={isAddingSup || !newSupName.trim()}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition disabled:opacity-50"
            >
              {isAddingSup ? 'Menambah...' : '+ Tambah Supplier'}
            </button>
          </div>
        </form>

        {/* Suppliers List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {suppliers.length === 0 ? (
            <p className="col-span-full py-4 text-center text-xs text-gray-400">
              Belum ada data supplier tersimpan
            </p>
          ) : (
            suppliers.map((sup) => (
              <div key={sup.id} className="p-3 rounded-xl border border-gray-200 bg-white text-xs flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{sup.name}</h4>
                  {sup.phone && <p className="text-gray-500 mt-0.5">📞 {sup.phone}</p>}
                  {sup.address && <p className="text-gray-500 text-[11px]">📍 {sup.address}</p>}
                </div>
                <button
                  onClick={() => handleDeleteSupplier(sup)}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Hapus Supplier"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 3: KATEGORI PRODUK */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <Tag className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-base">Kategori Sayuran</h3>
            <p className="text-xs text-gray-500">Kelompokkan sayuran untuk memudahkan kasir saat transaksi</p>
          </div>
        </div>

        <form onSubmit={handleAddCategory} className="flex gap-2 max-w-md">
          <input
            type="text"
            required
            placeholder="Tambah kategori baru (contoh: Jamur & Tauge)..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={isAddingCat || !newCatName.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
          >
            {isAddingCat ? 'Menambah...' : 'Tambah'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((c) => (
            <span key={c} className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* SECTION 4: DATA DEMO SEEDER */}
      <div className="space-y-4">
        {/* Full 78-item Catalog Seeder */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-emerald-950 text-white rounded-2xl p-6 border border-teal-800 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 text-[11px] font-bold">
              <span>Modul Katalog Lengkap SAYURKU</span>
            </div>
            <h4 className="font-extrabold text-base flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Muat 78 Katalog Sayuran & Racikan Bundling Lengkap</span>
            </h4>
            <p className="text-xs text-teal-200/90 max-w-xl">
              Memasukkan otomatis seluruh 78 komoditas sayur ke database: 18 Sayuran Daun, 25 Sayuran Umbi & Buah, 20 Bumbu & Rempah, serta 15 Paket Bundling Siap Masak lengkap dengan resep racikan, foto 1:1, dan takaran unit.
            </p>
          </div>
          <button
            onClick={async () => {
              if (!businessId) return;
              try {
                const { seedFullVegetableCatalog } = await import('../services/seedData');
                await seedFullVegetableCatalog(businessId);
                onRefresh();
                toast('Berhasil memuat 78 katalog sayuran lengkap beserta resep bundling!', 'success');
              } catch (e: any) {
                toast('Gagal memuat katalog: ' + e.message, 'error');
              }
            }}
            className="whitespace-nowrap px-5 py-2.5 bg-teal-400 hover:bg-teal-300 text-teal-950 font-bold text-xs sm:text-sm rounded-xl transition shadow-sm cursor-pointer"
          >
            🌱 Muat 78 Katalog Sayur
          </button>
        </div>

        {/* Initial Basic Seed */}
        <div className="bg-emerald-950/80 text-white rounded-2xl p-6 border border-emerald-800/80 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-sm flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Muat Data Contoh Dasar (13 Sayur + 3 Paket)</span>
            </h4>
            <p className="text-xs text-emerald-300/80 max-w-xl">
              Menambahkan data dasar sayuran umum (Bayam, Kangkung, Wortel, Kentang, Kol, Cabai, Tomat) dan racikan 3 paket bundling untuk demonstrasi cepat.
            </p>
          </div>
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="whitespace-nowrap px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow-sm disabled:opacity-50"
          >
            {isSeeding ? 'Memuat Data...' : 'Muat Data Dasar'}
          </button>
        </div>
      </div>
    </div>
  );
};
