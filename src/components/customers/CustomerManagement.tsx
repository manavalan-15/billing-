import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShoppingBag,
  DollarSign,
  Download,
  Receipt,
  X,
  Edit,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, Sale } from '../../types';
import { formatCurrency, formatDateTime, downloadCSV } from '../../utils/formatters';

export const CustomerManagement: React.FC = () => {
  const { customers, addCustomer, updateCustomer, sales } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dueBalance, setDueBalance] = useState('0');

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setDueBalance('0');
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setPhone(cust.phone);
    setEmail(cust.email || '');
    setAddress(cust.address || '');
    setDueBalance(cust.dueBalance?.toString() || '0');
    setIsModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Name and Phone number are required.');
      return;
    }

    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        dueBalance: parseFloat(dueBalance) || 0,
      });
    } else {
      addCustomer({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        dueBalance: parseFloat(dueBalance) || 0,
      });
    }

    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const rows = [
      ['Customer Name', 'Phone', 'Email', 'Address', 'Total Purchases', 'Total Orders', 'Loyalty Points', 'Due Balance', 'Created Date'],
      ...customers.map((c) => [
        c.name,
        c.phone,
        c.email || '',
        c.address || '',
        c.totalPurchases,
        c.totalOrders,
        c.loyaltyPoints,
        c.dueBalance,
        c.createdAt,
      ]),
    ];
    downloadCSV('Aura_Customer_Ledger', rows);
  };

  // Customer purchase invoices
  const customerInvoices = selectedCustomer
    ? sales.filter((s) => s.customerId === selectedCustomer.id || s.customerPhone === selectedCustomer.phone)
    : [];

  return (
    <div className="space-y-4 pb-6">
      {/* Top Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Customer Relationship & Loyalty Ledger</h2>
          <p className="text-xs text-zinc-400">
            {customers.length} registered gentlemen · Track purchase history, loyalty rewards & store credits
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
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer List Column (2 cols on large screen) */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-3 border-b border-zinc-800 bg-zinc-950/60">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers by name, phone or email..."
                className="w-full px-3 py-2 pl-9 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Phone & Email</th>
                  <th className="py-2.5 px-3 text-right">Total Purchases</th>
                  <th className="py-2.5 px-3 text-center">Orders</th>
                  <th className="py-2.5 px-3 text-center">Loyalty Pts</th>
                  <th className="py-2.5 px-3 text-right">Due Balance</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 text-xs">
                      No customer profiles found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    return (
                      <tr
                        key={cust.id}
                        onClick={() => setSelectedCustomer(cust)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-zinc-800/80 border-l-2 border-l-amber-400'
                            : 'hover:bg-zinc-800/30'
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-xs">{cust.name}</div>
                          {cust.address && (
                            <div className="text-[11px] text-zinc-500 truncate max-w-[150px]">
                              {cust.address}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-mono text-zinc-300">{cust.phone}</div>
                          {cust.email && (
                            <div className="text-[10px] text-zinc-500 truncate max-w-[140px]">
                              {cust.email}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                          {formatCurrency(cust.totalPurchases)}
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-zinc-300">
                          {cust.totalOrders}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold font-mono text-[11px] border border-amber-500/30">
                            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                            {cust.loyaltyPoints}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          <span className={cust.dueBalance > 0 ? 'text-red-400 font-bold' : 'text-zinc-500'}>
                            {formatCurrency(cust.dueBalance)}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openEditModal(cust)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                            title="Edit Customer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Detail & Purchase History Column */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          {selectedCustomer ? (
            <div className="space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white">{selectedCustomer.name}</h3>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Since {selectedCustomer.createdAt}
                  </span>
                </div>
                <div className="text-xs text-zinc-400 mt-1 flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                  )}
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{selectedCustomer.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stat Tiles */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase block">Total Spent</span>
                  <span className="text-xs font-bold text-amber-400 font-mono">
                    {formatCurrency(selectedCustomer.totalPurchases)}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase block">Orders</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {selectedCustomer.totalOrders}
                  </span>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase block">Loyalty Balance</span>
                  <span className="text-xs font-bold text-amber-300 font-mono">
                    {selectedCustomer.loyaltyPoints} pts
                  </span>
                </div>
              </div>

              {/* Purchase History Invoices */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center justify-between">
                  <span>Purchase Invoices</span>
                  <span className="text-zinc-500 font-normal">({customerInvoices.length})</span>
                </h4>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {customerInvoices.length === 0 ? (
                    <div className="p-4 bg-zinc-950 rounded-lg text-center text-zinc-600 text-xs">
                      No recorded invoices for this customer yet.
                    </div>
                  ) : (
                    customerInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-1 hover:border-zinc-700"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-mono font-bold text-zinc-200">
                            {inv.invoiceNumber}
                          </span>
                          <span className="font-mono font-bold text-amber-400">
                            {formatCurrency(inv.grandTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-zinc-500">
                          <span>{formatDateTime(inv.date)}</span>
                          <span>{inv.paymentMethod}</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 pt-1">
                          {inv.items.map((i) => `${i.productName} (${i.size}) x${i.quantity}`).join(', ')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-16">
              <Users className="w-10 h-10 text-zinc-700 mb-2 stroke-1" />
              <p className="text-xs font-medium text-zinc-400">No Customer Selected</p>
              <p className="text-[11px] text-zinc-600 max-w-[200px] mt-0.5">
                Click on any customer in the list to view their purchase history and loyalty summary.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-zinc-100">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                {editingCustomer ? 'Edit Customer Profile' : 'New Customer Registration'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vikramaditya Singhania"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="98400 12345"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Delivery / Residential Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, apartment, city"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Current Due / Credit Balance (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={dueBalance}
                  onChange={(e) => setDueBalance(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
                />
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
                  Save Customer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
