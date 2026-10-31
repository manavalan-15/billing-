import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  CreditCard,
  DollarSign,
  PieChart as PieIcon,
  ShoppingBag,
  Percent,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatDate, downloadCSV } from '../../utils/formatters';
import { CATEGORIES } from '../../types';

type ReportTab =
  | 'SALES_PERIOD'
  | 'PROFIT_LOSS'
  | 'GST_REPORT'
  | 'CATEGORY_SALES'
  | 'PAYMENT_METHODS'
  | 'STOCK_VALUATION';

export const ReportsView: React.FC = () => {
  const { sales, expenses, products, purchases, settings } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>('SALES_PERIOD');
  const [periodFilter, setPeriodFilter] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('DAILY');

  const completedSales = sales.filter((s) => s.status === 'COMPLETED');

  // Total metrics
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalCOGS = completedSales.reduce((acc, s) => {
    return acc + s.items.reduce((c, item) => c + item.purchasePrice * item.quantity, 0);
  }, 0);
  const totalGrossProfit = totalRevenue - totalCOGS;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalGrossProfit - totalExpenses;

  // Total GST Collected
  const totalTaxable = completedSales.reduce((sum, s) => sum + s.taxableTotal, 0);
  const totalGst = completedSales.reduce((sum, s) => sum + s.totalGst, 0);
  const totalCGST = totalGst / 2;
  const totalSGST = totalGst / 2;

  // Category wise breakdown
  const categorySalesMap = new Map<string, { count: number; revenue: number }>();
  CATEGORIES.forEach((cat) => categorySalesMap.set(cat, { count: 0, revenue: 0 }));
  completedSales.forEach((s) => {
    s.items.forEach((item) => {
      const existing = categorySalesMap.get(item.category) || { count: 0, revenue: 0 };
      existing.count += item.quantity;
      existing.revenue += item.totalAmount;
      categorySalesMap.set(item.category, existing);
    });
  });

  // Payment method breakdown
  const paymentStats = {
    Cash: completedSales.filter((s) => s.paymentMethod === 'Cash').reduce((s, i) => s + i.grandTotal, 0),
    UPI: completedSales.filter((s) => s.paymentMethod === 'UPI').reduce((s, i) => s + i.grandTotal, 0),
    Card: completedSales.filter((s) => s.paymentMethod === 'Card').reduce((s, i) => s + i.grandTotal, 0),
    Split: completedSales.filter((s) => s.paymentMethod === 'Split').reduce((s, i) => s + i.grandTotal, 0),
  };

  // Export handler based on active tab
  const handleExport = () => {
    if (activeTab === 'SALES_PERIOD') {
      const rows = [
        ['Invoice #', 'Date', 'Customer', 'Items Count', 'Payment Mode', 'Subtotal', 'Discount', 'GST Total', 'Grand Total'],
        ...completedSales.map((s) => [
          s.invoiceNumber,
          s.date,
          s.customerName,
          s.items.length,
          s.paymentMethod,
          s.subtotal,
          s.itemDiscountTotal + s.billDiscountAmount,
          s.totalGst,
          s.grandTotal,
        ]),
      ];
      downloadCSV(`Aura_${periodFilter}_Sales_Report`, rows);
    } else if (activeTab === 'PROFIT_LOSS') {
      const rows = [
        ['Financial Metric', 'Amount (INR)'],
        ['Gross Sales Turnover', totalRevenue],
        ['Cost of Goods Sold (COGS)', -totalCOGS],
        ['Gross Store Margin', totalGrossProfit],
        ['Store Operating Expenses', -totalExpenses],
        ['Net Operating Profit', netProfit],
      ];
      downloadCSV('Aura_Profit_and_Loss_Report', rows);
    } else if (activeTab === 'GST_REPORT') {
      const rows = [
        ['Invoice #', 'Date', 'Customer', 'Taxable Turnover', 'CGST (50%)', 'SGST (50%)', 'Total GST Collected', 'Invoice Total'],
        ...completedSales.map((s) => [
          s.invoiceNumber,
          s.date,
          s.customerName,
          s.taxableTotal,
          (s.totalGst / 2).toFixed(2),
          (s.totalGst / 2).toFixed(2),
          s.totalGst.toFixed(2),
          s.grandTotal,
        ]),
      ];
      downloadCSV('Aura_GST_Filing_Report', rows);
    } else if (activeTab === 'CATEGORY_SALES') {
      const rows = [
        ['Category', 'Units Sold', 'Total Revenue (INR)'],
        ...Array.from(categorySalesMap.entries()).map(([cat, data]) => [cat, data.count, data.revenue]),
      ];
      downloadCSV('Aura_Category_Sales_Report', rows);
    } else if (activeTab === 'STOCK_VALUATION') {
      const rows = [
        ['Product Name', 'SKU', 'Total Units', 'Purchase Cost Rate', 'Selling Price', 'Total Cost Valuation', 'Total Retail Valuation', 'Projected Profit'],
        ...products.map((p) => [
          p.name,
          p.sku,
          p.totalStock,
          p.purchasePrice,
          p.sellingPrice,
          p.purchasePrice * p.totalStock,
          p.sellingPrice * p.totalStock,
          (p.sellingPrice - p.purchasePrice) * p.totalStock,
        ]),
      ];
      downloadCSV('Aura_Stock_Valuation_Report', rows);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Financial Audits & Sales Analytics</h2>
          <p className="text-xs text-zinc-400">
            Generate GST audit sheets, daily/monthly turnover, P&L reports and inventory valuations
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shadow-md"
        >
          <Download className="w-4 h-4" />
          <span>Export Current Report (CSV)</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-zinc-800 pb-2">
        {[
          { id: 'SALES_PERIOD', label: 'Sales Report', icon: BarChart3 },
          { id: 'PROFIT_LOSS', label: 'Profit & Loss Statement', icon: TrendingUp },
          { id: 'GST_REPORT', label: 'GST Tax Compliance', icon: FileText },
          { id: 'CATEGORY_SALES', label: 'Category & Style Sales', icon: Layers },
          { id: 'PAYMENT_METHODS', label: 'Payment Distribution', icon: CreditCard },
          { id: 'STOCK_VALUATION', label: 'Stock Valuation Audit', icon: ShoppingBag },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ReportTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                active
                  ? 'bg-zinc-100 text-zinc-900 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PERIOD SALES REPORT */}
      {activeTab === 'SALES_PERIOD' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-3">
            <span className="text-xs font-semibold text-zinc-300">Reporting Frequency:</span>
            <div className="flex gap-1 bg-zinc-950 p-1 rounded-lg">
              {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodFilter(p)}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    periodFilter === p
                      ? 'bg-amber-400 text-black shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Items</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-3 text-right">Discount</th>
                    <th className="py-2.5 px-3 text-right">GST</th>
                    <th className="py-2.5 px-4 text-right">Grand Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {completedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-zinc-200">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {formatDate(sale.date)}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-white">
                        {sale.customerName}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {sale.items.length} styles
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                        {sale.paymentMethod}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                        {formatCurrency(sale.subtotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        {formatCurrency(sale.itemDiscountTotal + sale.billDiscountAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-400">
                        {formatCurrency(sale.totalGst)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-amber-400">
                        {formatCurrency(sale.grandTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-zinc-950 font-bold border-t-2 border-zinc-700 text-xs">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 uppercase text-zinc-300">
                      Total Sales Revenue ({completedSales.length} Invoices):
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-300">
                      {formatCurrency(completedSales.reduce((s, i) => s + i.subtotal, 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400">
                      {formatCurrency(completedSales.reduce((s, i) => s + (i.itemDiscountTotal + i.billDiscountAmount), 0))}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-300">
                      {formatCurrency(totalGst)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400 text-sm font-black">
                      {formatCurrency(totalRevenue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIT & LOSS STATEMENT */}
      {activeTab === 'PROFIT_LOSS' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-2xl mx-auto shadow-sm space-y-4">
          <div className="border-b border-zinc-800 pb-3 text-center">
            <h3 className="font-bold text-base text-white">{settings.shopName}</h3>
            <p className="text-xs text-zinc-400">Trading, Profit & Loss Account Statement</p>
          </div>

          <div className="space-y-3 text-xs">
            {/* Revenue */}
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-white text-sm">A. Gross Sales Revenue</span>
                <p className="text-zinc-500 text-[11px]">Billed showroom sales turnover</p>
              </div>
              <span className="font-mono text-base font-bold text-white">
                {formatCurrency(totalRevenue)}
              </span>
            </div>

            {/* COGS */}
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-red-400 text-sm">B. Cost of Goods Sold (COGS)</span>
                <p className="text-zinc-500 text-[11px]">Procurement purchase cost of sold inventory</p>
              </div>
              <span className="font-mono text-base font-bold text-red-400">
                -{formatCurrency(totalCOGS)}
              </span>
            </div>

            {/* Gross Profit */}
            <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 flex justify-between items-center">
              <div>
                <span className="font-bold text-emerald-400 text-sm">C. Gross Operating Margin (A - B)</span>
                <p className="text-zinc-400 text-[11px]">Margin ~{totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 100) : 0}%</p>
              </div>
              <span className="font-mono text-base font-black text-emerald-400">
                {formatCurrency(totalGrossProfit)}
              </span>
            </div>

            {/* Expenses */}
            <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex justify-between items-center">
              <div>
                <span className="font-bold text-red-400 text-sm">D. Showroom Operational Overheads</span>
                <p className="text-zinc-500 text-[11px]">Rent, power electricity, salaries & packaging</p>
              </div>
              <span className="font-mono text-base font-bold text-red-400">
                -{formatCurrency(totalExpenses)}
              </span>
            </div>

            {/* Net Operating Profit */}
            <div className="p-4 bg-zinc-950 border-2 border-amber-400/80 rounded-xl flex justify-between items-center">
              <div>
                <span className="font-black text-amber-400 text-base uppercase tracking-wider">
                  Net Operating Profit (C - D)
                </span>
                <p className="text-zinc-400 text-xs">Final bottom line earnings</p>
              </div>
              <span className={`font-mono text-xl font-black ${netProfit >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GST REPORT */}
      {activeTab === 'GST_REPORT' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-xs text-zinc-400 uppercase font-semibold">Taxable Turnover</span>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {formatCurrency(totalTaxable)}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-xs text-zinc-400 uppercase font-semibold">Central Tax (CGST)</span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                {formatCurrency(totalCGST)}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-xs text-zinc-400 uppercase font-semibold">State Tax (SGST)</span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                {formatCurrency(totalSGST)}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
              <span className="text-xs text-zinc-400 uppercase font-semibold">Total GST Payable</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {formatCurrency(totalGst)}
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="py-2.5 px-4">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">CGST</th>
                    <th className="py-2.5 px-3 text-right">SGST</th>
                    <th className="py-2.5 px-3 text-right">Total GST</th>
                    <th className="py-2.5 px-4 text-right">Invoice Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {completedSales.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-zinc-200">{s.invoiceNumber}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{formatDate(s.date)}</td>
                      <td className="py-2.5 px-3 text-white">{s.customerName}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-300">{formatCurrency(s.taxableTotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-400">{formatCurrency(s.totalGst / 2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-zinc-400">{formatCurrency(s.totalGst / 2)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-400">{formatCurrency(s.totalGst)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-white">{formatCurrency(s.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORY SALES */}
      {activeTab === 'CATEGORY_SALES' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Menswear Category</th>
                  <th className="py-3 px-3 text-center">Units Sold</th>
                  <th className="py-3 px-3 text-right">Total Revenue Generated</th>
                  <th className="py-3 px-4 text-right">Share of Revenue (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {Array.from(categorySalesMap.entries()).map(([cat, data]) => {
                  const share = totalRevenue > 0 ? ((data.revenue / totalRevenue) * 100).toFixed(1) : '0';
                  return (
                    <tr key={cat} className="hover:bg-zinc-800/30">
                      <td className="py-3 px-4 font-bold text-white">{cat}</td>
                      <td className="py-3 px-3 text-center font-mono text-zinc-300">{data.count} Pcs</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">{formatCurrency(data.revenue)}</td>
                      <td className="py-3 px-4 text-right font-mono text-zinc-400">{share}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PAYMENT METHODS */}
      {activeTab === 'PAYMENT_METHODS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { mode: 'Cash', amount: paymentStats.Cash, desc: 'Paper currency transactions' },
            { mode: 'UPI', amount: paymentStats.UPI, desc: 'GPay, PhonePe, Paytm QR' },
            { mode: 'Card', amount: paymentStats.Card, desc: 'Visa, Mastercard & RuPay POS' },
            { mode: 'Split', amount: paymentStats.Split, desc: 'Multi-tender split receipts' },
          ].map((item) => (
            <div key={item.mode} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-zinc-400">{item.mode} Tender</span>
                <div className="text-xl font-black font-mono text-amber-400 mt-1">
                  {formatCurrency(item.amount)}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</div>
              </div>
              <div className="mt-4 pt-2 border-t border-zinc-800 text-[11px] text-zinc-400 font-mono">
                Share: {totalRevenue > 0 ? Math.round((item.amount / totalRevenue) * 100) : 0}% of turnover
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 6: STOCK VALUATION */}
      {activeTab === 'STOCK_VALUATION' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3 text-center">Available Stock</th>
                  <th className="py-3 px-3 text-right">Cost Rate</th>
                  <th className="py-3 px-3 text-right">Retail Rate</th>
                  <th className="py-3 px-3 text-right">Total Cost Asset</th>
                  <th className="py-3 px-4 text-right">Total Retail Potential</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-sans">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-4 font-bold text-white">{p.name}</td>
                    <td className="py-3 px-3 font-mono text-zinc-400">{p.sku}</td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-zinc-200">{p.totalStock}</td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-400">{formatCurrency(p.purchasePrice)}</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-400">{formatCurrency(p.sellingPrice)}</td>
                    <td className="py-3 px-3 text-right font-mono text-zinc-300">{formatCurrency(p.purchasePrice * p.totalStock)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">{formatCurrency(p.sellingPrice * p.totalStock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
