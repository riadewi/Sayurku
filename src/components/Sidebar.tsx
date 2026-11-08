import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Boxes, 
  Truck, 
  Wallet, 
  BarChart3, 
  Settings,
  Sprout,
  X,
  ShoppingBag,
  CreditCard,
  Navigation,
  Compass,
  FileSpreadsheet
} from 'lucide-react';

export type NavTab = 
  | 'dashboard' 
  | 'online_orders'
  | 'pos' 
  | 'products' 
  | 'inventory' 
  | 'purchases' 
  | 'purchase_reports'
  | 'expenses' 
  | 'payments'
  | 'delivery'
  | 'reports' 
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  lowStockCount: number;
  newOrdersCount: number;
  onSwitchToCustomerView?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  lowStockCount,
  newOrdersCount,
  onSwitchToCustomerView
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.FC<{ className?: string }>; badge?: number; badgeColor?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { 
      id: 'online_orders', 
      label: 'Pesanan Online', 
      icon: ShoppingBag, 
      badge: newOrdersCount > 0 ? newOrdersCount : undefined,
      badgeColor: 'bg-emerald-500 text-emerald-950'
    },
    { id: 'pos', label: 'Kasir Penjualan (POS)', icon: ShoppingCart },
    { id: 'products', label: 'Katalog Produk Sayur', icon: Package },
    { 
      id: 'inventory', 
      label: 'Stok & Mutasi', 
      icon: Boxes, 
      badge: lowStockCount > 0 ? lowStockCount : undefined,
      badgeColor: 'bg-amber-500 text-amber-950'
    },
    { id: 'purchases', label: 'Pembelian Kulakan', icon: Truck },
    { id: 'purchase_reports', label: 'Laporan Pembelian', icon: FileSpreadsheet },
    { id: 'expenses', label: 'Biaya Operasional', icon: Wallet },
    { id: 'payments', label: 'Verifikasi Pembayaran', icon: CreditCard },
    { id: 'delivery', label: 'Pengantaran & Kurir', icon: Compass },
    { id: 'reports', label: 'Laporan Bisnis', icon: BarChart3 },
    { id: 'settings', label: 'Pengaturan & Toko', icon: Settings },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-emerald-950 text-emerald-100 flex flex-col border-r border-emerald-900 transition-transform duration-300 ease-in-out
        lg:translate-x-0 ${isOpenMobile ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-emerald-900 bg-emerald-900/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sprout className="w-5 h-5 text-emerald-950 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg tracking-tight font-sans leading-none">
                SAYURKU
              </h1>
              <p className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase mt-1">
                Panel Penjual & Manajemen
              </p>
            </div>
          </div>
          <button 
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Storefront Switcher Button in Sidebar */}
        {onSwitchToCustomerView && (
          <div className="p-3 border-b border-emerald-900/60">
            <button
              onClick={() => {
                onSwitchToCustomerView();
                onCloseMobile();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition group"
            >
              <ShoppingBag className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
              <span>Buka Toko Pelanggan (Online)</span>
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group
                  ${isActive 
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30' 
                    : 'text-emerald-200/80 hover:bg-emerald-900/60 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-emerald-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${item.badgeColor || 'bg-amber-500 text-amber-950'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Tagline Footer */}
        <div className="p-3.5 border-t border-emerald-900/80 bg-emerald-900/20 text-xs text-emerald-400/80 text-center">
          <p className="font-bold text-emerald-300">SAYURKU v2.0</p>
          <p className="text-[10px] text-emerald-400/60 mt-0.5">Online Ordering & POS Management</p>
        </div>
      </aside>
    </>
  );
};
