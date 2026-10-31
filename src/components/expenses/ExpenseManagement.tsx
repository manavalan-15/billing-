import React, { useState } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Download,
  X,
  Check,
  TrendingDown,
  PieChart as PieIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Expense, ExpenseCategory } from '../../types';
import { formatCurrency, formatDate, downloadCSV } from '../../utils/formatters';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Shop Rent',
  'Electricity Bill',
  'Employee Salary',
  'Transport',
  'Maintenance',
  'Packaging & Bags',
  'Marketing',
  'Other Expenses',
];

export const ExpenseManagement: React.FC = () => {
  const { expenses, addExpense, deleteExpense, currentUser } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('Shop Rent');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Bank Transfer' | 'UPI'>('Bank Transfer');
  const [paidTo, setPaidTo] = useState('');

  // Calculations: Total expenses, this month expenses, category breakdown
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const currentMonth = new Date().toISOString().slice(0, 7); // '2026-03'
  const thisMonthExpenses = expenses
    .filter((e) => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = EXPENSE_CATEGORIES.map((cat) => {
    const total = expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0);
    return { category: cat, total };
  }).filter((c) => c.total > 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount) || 0;
    if (parsedAmount <= 0 || !description.trim()) {
      alert('Please enter a valid expense description and amount.');
      return;
    }

    addExpense({
      category,
      description: description.trim(),
      amount: parsedAmount,
      date,
      paymentMode,
      paidTo: paidTo.trim() || 'Vendor',
      approvedBy: currentUser.name,
    });

    setIsModalOpen(false);
    setDescription('');
    setAmount('');
    setPaidTo('');
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Category', 'Description', 'Amount', 'Payment Mode', 'Paid To', 'Approved By'],
      ...expenses.map((e) => [
        e.date,
        e.category,
        e.description,
        e.amount,
        e.paymentMode,
        e.paidTo,
        e.approvedBy,
      ]),
    ];
    downloadCSV('Aura_Store_Expenses_Ledger', rows);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Store Operating Expense Ledger</h2>
          <p className="text-xs text-zinc-400">
            Track rent, utilities, packaging, transport and showroom overheads
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Total Overheads Logged
          </span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {formatCurrency(totalExpenses)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Cumulative store operational spend
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Current Month Expense
          </span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(thisMonthExpenses)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Billing cycle for {new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Major Cost Center
          </span>
          <div className="text-base font-bold text-zinc-200 mt-1 truncate">
            {categoryTotals[0] ? categoryTotals.sort((a, b) => b.total - a.total)[0].category : 'Shop Rent'}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Highest expenditure category
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Expense Category</th>
                <th className="py-2.5 px-3">Description / Remarks</th>
                <th className="py-2.5 px-3">Paid To</th>
                <th className="py-2.5 px-3">Payment Mode</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Approved By</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 text-xs">
                    No operating expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-zinc-300">
                      {formatDate(exp.date)}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-medium text-white max-w-[220px] truncate">
                      {exp.description}
                    </td>
                    <td className="py-3 px-3 text-zinc-400">
                      {exp.paidTo}
                    </td>
                    <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                      {exp.paymentMode}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                      {formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3 px-3 text-zinc-400 text-[11px]">
                      {exp.approvedBy}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-zinc-100">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Record Operating Expense</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Description / Purpose *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. March store lease rent"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Expense Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Payment Method</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                  >
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Cash">Cash Voucher</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Paid To / Payee</label>
                  <input
                    type="text"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    placeholder="Vendor / Landlord name"
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  Save Expense Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
