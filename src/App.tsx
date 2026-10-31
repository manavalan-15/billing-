import React, { useState } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Users,
  Truck,
  Wallet,
  BarChart3,
  ShieldCheck,
  Settings,
  Server,
  Sparkles,
  Menu,
  X,
  CreditCard,
  ScanBarcode,
  Clock,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { DashboardView } from './components/dashboard/DashboardView';
import { BillingScreen } from './components/pos/BillingScreen';
import { ProductManagement } from './components/inventory/ProductManagement';
import { PastBillsView } from './components/pos/PastBillsView';
import { CustomerManagement } from './components/customers/CustomerManagement';
import { SupplierManagement } from './components/suppliers/SupplierManagement';
import { ExpenseManagement } from './components/expenses/ExpenseManagement';
import { ReportsView } from './components/reports/ReportsView';
import { UserManagement } from './components/users/UserManagement';
import { SettingsView } from './components/settings/SettingsView';
import { DjangoMySQLView } from './components/backend-docs/DjangoMySQLView';
import { BarcodeGeneratorView } from './components/barcode/BarcodeGeneratorView';

type NavTab =
  | 'DASHBOARD'
  | 'BILLING'
  | 'PRODUCTS'
  | 'BARCODE'
  | 'PAST_BILLS'
  | 'CUSTOMERS'
  | 'SUPPLIERS'
  | 'EXPENSES'
  | 'REPORTS'
  | 'USERS'
  | 'SETTINGS'
  | 'BACKEND_CODE';

const MainLayout: React.FC = () => {
  const { currentUser, settings, cart, heldBills, products } = useApp();
  const [currentTab, setCurrentTab] = useState<NavTab>('BILLING');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Low stock count
  const lowStockCount = products.filter((p) =>
    p.variants.some((v) => v.stock <= v.lowStockThreshold)
  ).length;

  const navItems = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'BILLING',
      label: 'Billing / POS',
      icon: ShoppingCart,
      badge: cart.length > 0 ? `${cart.length}` : undefined,
      badgeColor: 'bg-amber-500 text-black',
    },
    {
      id: 'PRODUCTS',
      label: 'Products & Inventory',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} alert` : undefined,
      badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'BARCODE',
      label: 'Barcode & Tag Labels',
      icon: ScanBarcode,
      badge: 'Print',
      badgeColor: 'bg-amber-400/20 text-amber-300 border border-amber-400/30',
    },
    { id: 'PAST_BILLS', label: 'Past Invoices', icon: Receipt },
    { id: 'CUSTOMERS', label: 'Customers & Loyalty', icon: Users },
    { id: 'SUPPLIERS', label: 'Suppliers & PO', icon: Truck },
    { id: 'EXPENSES', label: 'Expenses', icon: Wallet },
    { id: 'REPORTS', label: 'Reports & GST', icon: BarChart3 },
    { id: 'USERS', label: 'Staff & Audit Logs', icon: ShieldCheck },
    { id: 'SETTINGS', label: 'Store Settings', icon: Settings },
    {
      id: 'BACKEND_CODE',
      label: 'Django + MySQL Code',
      icon: Server,
      badge: 'API',
      badgeColor: 'bg-emerald-950 text-emerald-400 border border-emerald-800',
    },
  ];

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800/80 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo / Brand Header */}
          <div className="p-4 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-black text-black text-sm shadow-md shadow-amber-500/20">
                A
              </div>
              <div className="leading-tight">
                <h1 className="font-extrabold text-sm text-white tracking-wide uppercase">
                  {settings.shopName.split(' ')[0]} <span className="text-amber-400">{settings.shopName.split(' ')[1] || 'POS'}</span>
                </h1>
                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                  Men's Wear Software
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)] no-scrollbar text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id as NavTab);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all text-left ${
                    active
                      ? 'bg-zinc-100 text-zinc-950 font-bold shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-zinc-950' : 'text-zinc-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        active ? 'bg-zinc-950 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom of sidebar */}
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40">
          <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <div className="font-semibold text-xs text-white truncate leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                <span className="uppercase">{currentUser.role}</span>
              </div>
            </div>
            <button
              onClick={() => setCurrentTab('USERS')}
              className="text-[10px] px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-medium transition-colors shrink-0"
              title="Switch Cashier"
            >
              Switch
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-zinc-950">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-900"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-zinc-500 font-mono">Store:</span>
              <span className="font-semibold text-zinc-200">{settings.shopName}</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500 font-mono">GSTIN: {settings.gstin}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Billing Button shortcut */}
            {currentTab !== 'BILLING' && (
              <button
                onClick={() => setCurrentTab('BILLING')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shadow-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Go to Billing (F2)</span>
              </button>
            )}

            {/* Quick Status Pill */}
            <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono">
                {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        {/* View Container */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 bg-zinc-950">
          {currentTab === 'DASHBOARD' && <DashboardView />}
          {currentTab === 'BILLING' && <BillingScreen />}
          {currentTab === 'PRODUCTS' && <ProductManagement onOpenBarcode={() => setCurrentTab('BARCODE')} />}
          {currentTab === 'BARCODE' && <BarcodeGeneratorView />}
          {currentTab === 'PAST_BILLS' && <PastBillsView />}
          {currentTab === 'CUSTOMERS' && <CustomerManagement />}
          {currentTab === 'SUPPLIERS' && <SupplierManagement />}
          {currentTab === 'EXPENSES' && <ExpenseManagement />}
          {currentTab === 'REPORTS' && <ReportsView />}
          {currentTab === 'USERS' && <UserManagement />}
          {currentTab === 'SETTINGS' && <SettingsView />}
          {currentTab === 'BACKEND_CODE' && <DjangoMySQLView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
