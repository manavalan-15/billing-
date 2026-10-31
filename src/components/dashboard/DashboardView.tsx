import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Receipt,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Sale } from '../../types';
import { ThermalReceiptModal } from '../pos/ThermalReceiptModal';

export const DashboardView: React.FC = () => {
  const { sales, products, customers, settings } = useApp();
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  // Today calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(
    (s) => s.status === 'COMPLETED' && s.date.startsWith(todayStr)
  );

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
  
  // Calculate today's profit = revenue - cost of items
  const todayCost = todaySales.reduce((acc, s) => {
    const saleCost = s.items.reduce((cost, item) => cost + item.purchasePrice * item.quantity, 0);
    return acc + saleCost;
  }, 0);
  const todayProfit = todayRevenue - todayCost;

  // Total active counts
  const totalOrdersCount = sales.filter((s) => s.status === 'COMPLETED').length;
  const totalProductsCount = products.length;
  const totalCustomersCount = customers.length;

  // Low stock products count
  const lowStockVariants: { product: any; variant: any }[] = [];
  products.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.stock <= v.lowStockThreshold) {
        lowStockVariants.push({ product: p, variant: v });
      }
    });
  });

  // Monthly Sales Graph Data (Last 6 Months)
  const monthlyData = [
    { month: 'Nov', sales: 142000, profit: 54000 },
    { month: 'Dec', sales: 218000, profit: 89000 },
    { month: 'Jan', sales: 185000, profit: 72000 },
    { month: 'Feb', sales: 196000, profit: 79000 },
    { month: 'Mar', sales: 245000, profit: 98000 },
    {
      month: 'Apr',
      sales: Math.max(160000, sales.reduce((sum, s) => sum + s.grandTotal, 0)),
      profit: Math.max(68000, todayProfit + 45000),
    },
  ];

  // Weekly Sales Graph Data
  const weeklyData = [
    { day: 'Mon', revenue: 24500, orders: 8 },
    { day: 'Tue', revenue: 31200, orders: 11 },
    { day: 'Wed', revenue: 28900, orders: 9 },
    { day: 'Thu', revenue: 38400, orders: 14 },
    { day: 'Fri', revenue: 54200, orders: 19 },
    { day: 'Sat', revenue: 78500, orders: 26 },
    { day: 'Sun', revenue: 69200, orders: 22 },
  ];

  // Calculate Top Selling Products from completed sales
  const productSalesMap = new Map<string, { product: any; unitsSold: number; totalRev: number }>();
  sales
    .filter((s) => s.status === 'COMPLETED')
    .forEach((s) => {
      s.items.forEach((item) => {
        const existing = productSalesMap.get(item.productId) || {
          product: item,
          unitsSold: 0,
          totalRev: 0,
        };
        existing.unitsSold += item.quantity;
        existing.totalRev += item.totalAmount;
        productSalesMap.set(item.productId, existing);
      });
    });

  const topSelling = Array.from(productSalesMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  // If few sales in demo, fallback to top products by catalog
  const topDisplayList = topSelling.length > 0 ? topSelling : products.slice(0, 5).map((p) => ({
    product: p,
    unitsSold: Math.floor(p.totalStock / 2) + 6,
    totalRev: p.sellingPrice * 12,
  }));

  // Recent 6 transactions
  const recentSales = sales.slice(0, 6);

  return (
    <div className="space-y-4 pb-6">
      {/* Top Welcome & Quick Overview Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Executive Fashion Dashboard</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Store Performance · Daily Overview for {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">Store Status:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Showroom Open & POS Active
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Today's Total Sales */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Today's Sales</span>
            <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-white font-mono">
              {formatCurrency(todayRevenue)}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5">
              <ArrowUpRight className="w-3 h-3" />
              <span>{todaySales.length} orders billed today</span>
            </div>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Today's Profit</span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-emerald-400 font-mono">
              {formatCurrency(todayProfit)}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Gross profit margin ~{todayRevenue > 0 ? Math.round((todayProfit / todayRevenue) * 100) : 48}%
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Orders</span>
            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-white font-mono">
              {totalOrdersCount}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Completed transactions
            </div>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Products</span>
            <div className="p-1.5 bg-purple-500/10 rounded-lg text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-white font-mono">
              {totalProductsCount}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              {products.reduce((s, p) => s + p.variants.length, 0)} size/color SKUs
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Customers</span>
            <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-black text-white font-mono">
              {totalCustomersCount}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Registered with loyalty profiles
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className={`border rounded-xl p-3.5 flex flex-col justify-between transition-colors ${
          lowStockVariants.length > 0
            ? 'bg-red-950/20 border-red-900/60'
            : 'bg-zinc-900 border-zinc-800'
        }`}>
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider">Low Stock SKUs</span>
            <div className={`p-1.5 rounded-lg ${lowStockVariants.length > 0 ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl font-black font-mono ${lowStockVariants.length > 0 ? 'text-red-400' : 'text-white'}`}>
              {lowStockVariants.length}
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              Items at reorder threshold
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW: Monthly Sales Trend & Weekly Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Trend Area Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-white">Monthly Sales & Profit Growth</h3>
              <p className="text-xs text-zinc-400">6-Month historical performance (₹)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-amber-400"></span>
                <span className="text-zinc-400">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-400"></span>
                <span className="text-zinc-400">Gross Profit</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [`₹ ${Number(value).toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#profitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Day-wise Sales Bar Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-white">Weekly Store Footfall & Sales</h3>
              <p className="text-xs text-zinc-400">Daily revenue breakdown throughout the week</p>
            </div>
            <span className="text-xs font-mono text-amber-400 font-semibold">
              Peak: Saturday & Sunday
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  formatter={(value: any) => [`₹ ${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index >= 5 ? '#f59e0b' : '#3f3f46'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* LOWER SECTION: Recent Transactions & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions (2 cols on large) */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-white">Recent Store Transactions</h3>
              <p className="text-xs text-zinc-400">Live invoices generated across cashier counters</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-zinc-200">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400">
                      {formatDateTime(sale.date)}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-white truncate max-w-[130px]">
                      {sale.customerName}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-amber-400 font-mono">
                      {formatCurrency(sale.grandTotal)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          sale.status === 'COMPLETED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : 'bg-red-950 text-red-400 border border-red-800/50'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedReceiptSale(sale)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                        title="View & Print Thermal Receipt"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
          <div className="mb-3">
            <h3 className="font-bold text-sm text-white">Top Moving Menswear</h3>
            <p className="text-xs text-zinc-400">High-demand apparel and accessories</p>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {topDisplayList.map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-zinc-950/60 border border-zinc-800/70 rounded-lg flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="font-semibold text-xs text-white truncate">
                    {item.product.name || item.product.productName}
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                    <span className="text-amber-400 font-medium">
                      {item.unitsSold} units sold
                    </span>
                    <span>·</span>
                    <span className="font-mono text-zinc-500">
                      {formatCurrency(item.totalRev)}
                    </span>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-zinc-500">
                  #{idx + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thermal Receipt Preview Modal */}
      {selectedReceiptSale && (
        <ThermalReceiptModal
          sale={selectedReceiptSale}
          settings={settings}
          onClose={() => setSelectedReceiptSale(null)}
          onNewBill={() => setSelectedReceiptSale(null)}
        />
      )}
    </div>
  );
};
