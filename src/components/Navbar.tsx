import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatDateIndo } from '../lib/utils';
import { 
  Menu, 
  Store, 
  LogIn, 
  LogOut, 
  UserCircle, 
  ShoppingBag, 
  SlidersHorizontal,
  LayoutDashboard
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface NavbarProps {
  currentTab: NavTab;
  onOpenMobileMenu: () => void;
  onNavigateTab: (tab: NavTab) => void;
  appMode: 'CUSTOMER' | 'SELLER';
  onToggleAppMode: (mode: 'CUSTOMER' | 'SELLER') => void;
  cartCount: number;
  onOpenCart?: () => void;
}

const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard Bisnis', subtitle: 'Ringkasan performa penjualan dan inventaris hari ini' },
  online_orders: { title: 'Pesanan Online Pelanggan', subtitle: 'Kelola pesanan masuk, siapkan sayuran, dan tugaskan kurir' },
  pos: { title: 'Kasir Penjualan (POS)', subtitle: 'Pencatatan transaksi sayuran segar dan paket bundling langsung' },
  products: { title: 'Katalog Produk Sayur', subtitle: 'Kelola sayuran satuan dan racikan paket bundling' },
  inventory: { title: 'Inventaris & Mutasi Stok', subtitle: 'Pantau sisa stok, sayur busuk (waste), dan riwayat mutasi' },
  purchases: { title: 'Pembelian & Kulakan', subtitle: 'Pencatatan pasokan dari supplier dan penambahan stok otomatis' },
  purchase_reports: { title: 'Laporan Pembelian Sayur', subtitle: 'Analisis tren kulakan, riwayat pasokan supplier, dan grafik belanja bulanan' },
  expenses: { title: 'Biaya Operasional', subtitle: 'Pencatatan pengeluaran transportasi, kresek, retribusi & listrik' },
  payments: { title: 'Verifikasi Pembayaran', subtitle: 'Pemeriksaan bukti transfer bank, QRIS, dan penerimaan COD' },
  delivery: { title: 'Pengantaran & Tarif Jarak', subtitle: 'Atur koordinat kios sayur, batas gratis ongkir, dan kurir' },
  reports: { title: 'Laporan Laba Rugi', subtitle: 'Analisis omzet, HPP, laba kotor, dan laba bersih usaha sayur' },
  settings: { title: 'Pengaturan & Toko', subtitle: 'Profil kios sayur, data supplier, kategori, dan master data' },
};

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  onOpenMobileMenu, 
  onNavigateTab,
  appMode,
  onToggleAppMode,
  cartCount,
  onOpenCart
}) => {
  const { user, storeProfile, signInWithGoogle, signInAsDemo, signOut } = useAuth();
  const info = tabTitles[currentTab] || { title: 'SAYURKU', subtitle: '' };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-3">
        {/* Mobile Hamburger (Only in Seller Mode) */}
        {appMode === 'SELLER' && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
            aria-label="Buka Menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* Page Title */}
        {appMode === 'SELLER' ? (
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-tight">
              {info.title}
            </h2>
            <p className="hidden sm:block text-[11px] text-gray-500 font-medium">
              {info.subtitle}
            </p>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-emerald-800 text-lg tracking-tight font-sans">
              SAYURKU
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Toko Sayur Online
            </span>
          </div>
        )}
      </div>

      {/* Right Actions: Mode Switcher & User Profile */}
      <div className="flex items-center space-x-2.5">
        {/* Dual Mode Switcher Pill */}
        <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 text-xs font-bold">
          <button
            type="button"
            onClick={() => onToggleAppMode('CUSTOMER')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              appMode === 'CUSTOMER'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Belanja Online</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleAppMode('SELLER')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center space-x-1.5 ${
              appMode === 'SELLER'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kelola Kios</span>
          </button>
        </div>

        {/* Cart Button in Customer Mode */}
        {appMode === 'CUSTOMER' && onOpenCart && (
          <button
            onClick={onOpenCart}
            className="relative p-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
            title="Buka Keranjang"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white shadow-xs">
                {cartCount}
              </span>
            )}
          </button>
        )}

        {/* Auth / Account Profile */}
        {user ? (
          <div className="flex items-center space-x-1.5">
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100 text-xs text-gray-700">
              <UserCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-medium truncate max-w-[110px]">
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={() => signOut()}
              title="Keluar"
              className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
        )}
      </div>
    </header>
  );
};
