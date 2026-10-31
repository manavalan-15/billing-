import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  FileText,
  X,
  Check,
  Building,
  CreditCard
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, PurchaseItem, Supplier } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export const SupplierManagement: React.FC = () => {
  const { suppliers, addSupplier, updateSupplier, purchases, addPurchase, products } = useApp();

  const [search, setSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Supplier Form
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');

  // Purchase Entry State
  const [purchaseSupplierId, setPurchaseSupplierId] = useState(suppliers[0]?.id || '');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.name || '',
      variantId: products[0]?.variants[0]?.id || '',
      size: products[0]?.variants[0]?.size || '38',
      color: products[0]?.variants[0]?.color || 'White',
      quantity: 10,
      costPrice: products[0]?.purchasePrice || 900,
      total: (products[0]?.purchasePrice || 900) * 10,
    },
  ]);
  const [paidAmount, setPaidAmount] = useState('0');

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search)
  );

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    addSupplier({
      name: name.trim(),
      contactPerson: contactPerson.trim() || 'Procurement Rep',
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      gstin: gstin.trim() || undefined,
    });

    setIsSupplierModalOpen(false);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setGstin('');
  };

  const handleAddPurchaseRow = () => {
    const defaultProd = products[0];
    const defaultVariant = defaultProd?.variants[0];
    if (!defaultProd || !defaultVariant) return;

    setPurchaseItems([
      ...purchaseItems,
      {
        productId: defaultProd.id,
        productName: defaultProd.name,
        variantId: defaultVariant.id,
        size: defaultVariant.size,
        color: defaultVariant.color,
        quantity: 10,
        costPrice: defaultProd.purchasePrice,
        total: defaultProd.purchasePrice * 10,
      },
    ]);
  };

  const handleRemovePurchaseRow = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handlePurchaseRowChange = (index: number, field: string, value: any) => {
    const updated = [...purchaseItems];
    const item = { ...updated[index] };

    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod && prod.variants[0]) {
        item.productId = prod.id;
        item.productName = prod.name;
        item.variantId = prod.variants[0].id;
        item.size = prod.variants[0].size;
        item.color = prod.variants[0].color;
        item.costPrice = prod.purchasePrice;
        item.total = item.quantity * prod.purchasePrice;
      }
    } else if (field === 'variantId') {
      const prod = products.find((p) => p.id === item.productId);
      const variant = prod?.variants.find((v) => v.id === value);
      if (variant) {
        item.variantId = variant.id;
        item.size = variant.size;
        item.color = variant.color;
      }
    } else if (field === 'quantity') {
      const q = Math.max(1, parseInt(value) || 1);
      item.quantity = q;
      item.total = q * item.costPrice;
    } else if (field === 'costPrice') {
      const c = Math.max(0, parseFloat(value) || 0);
      item.costPrice = c;
      item.total = item.quantity * c;
    }

    updated[index] = item;
    setPurchaseItems(updated);
  };

  const purchaseTotalAmount = purchaseItems.reduce((sum, item) => sum + item.total, 0);

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      alert('Add at least one item to the purchase entry.');
      return;
    }

    const sup = suppliers.find((s) => s.id === purchaseSupplierId);
    if (!sup) {
      alert('Please select a supplier.');
      return;
    }

    const paid = parseFloat(paidAmount) || 0;
    const status = paid >= purchaseTotalAmount ? 'PAID' : paid > 0 ? 'PARTIAL' : 'PENDING';

    addPurchase({
      supplierId: sup.id,
      supplierName: sup.name,
      date: new Date().toISOString(),
      items: purchaseItems,
      totalAmount: purchaseTotalAmount,
      paidAmount: paid,
      status,
    });

    setIsPurchaseModalOpen(false);
  };

  const handlePaySupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;
    const amount = parseFloat(paymentAmount) || 0;
    if (amount <= 0) return;

    updateSupplier({
      ...selectedSupplier,
      outstandingBalance: Math.max(0, selectedSupplier.outstandingBalance - amount),
    });

    setIsPaymentModalOpen(false);
    setPaymentAmount('');
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Fabric Mills & Apparel Supplier Ledger</h2>
          <p className="text-xs text-zinc-400">
            Manage vendor purchase orders, inventory restocking & outstanding dues
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>New Purchase Entry</span>
          </button>
          <button
            onClick={() => setIsSupplierModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shadow-md"
          >
            <Building className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Suppliers List */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="p-3 border-b border-zinc-800 bg-zinc-950/60">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mills and suppliers by name, representative or phone..."
                className="w-full px-3 py-2 pl-9 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Supplier / Mill</th>
                  <th className="py-2.5 px-3">Contact Person</th>
                  <th className="py-2.5 px-3">Phone & GSTIN</th>
                  <th className="py-2.5 px-3 text-right">Total Purchases</th>
                  <th className="py-2.5 px-3 text-right">Outstanding Due</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredSuppliers.map((sup) => {
                  const isSelected = selectedSupplier?.id === sup.id;
                  return (
                    <tr
                      key={sup.id}
                      onClick={() => setSelectedSupplier(sup)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-zinc-800/80 border-l-2 border-l-amber-400'
                          : 'hover:bg-zinc-800/30'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-white text-xs">{sup.name}</div>
                        <div className="text-[11px] text-zinc-400 truncate max-w-[170px]">
                          {sup.address}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-zinc-300">
                        {sup.contactPerson}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <div className="text-zinc-200">{sup.phone}</div>
                        <div className="text-[10px] text-zinc-500">{sup.gstin || 'Unregistered'}</div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-zinc-200">
                        {formatCurrency(sup.totalPurchases)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold">
                        <span className={sup.outstandingBalance > 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {formatCurrency(sup.outstandingBalance)}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedSupplier(sup);
                            setPaymentAmount(sup.outstandingBalance.toString());
                            setIsPaymentModalOpen(true);
                          }}
                          disabled={sup.outstandingBalance <= 0}
                          className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                            sup.outstandingBalance <= 0
                              ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900/50'
                          }`}
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Supplier PO History */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          {selectedSupplier ? (
            <div className="space-y-4">
              <div className="border-b border-zinc-800 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-white">{selectedSupplier.name}</h3>
                </div>
                <div className="text-xs text-zinc-400 mt-1 space-y-1">
                  <div>Rep: <span className="text-zinc-200 font-semibold">{selectedSupplier.contactPerson}</span></div>
                  <div>Ph: <span className="text-zinc-300 font-mono">{selectedSupplier.phone}</span></div>
                  <div>GSTIN: <span className="text-zinc-300 font-mono">{selectedSupplier.gstin || '-'}</span></div>
                </div>
              </div>

              {/* Dues banner */}
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-zinc-400 block uppercase">Outstanding Dues</span>
                  <span className={`text-lg font-black font-mono ${selectedSupplier.outstandingBalance > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatCurrency(selectedSupplier.outstandingBalance)}
                  </span>
                </div>
                {selectedSupplier.outstandingBalance > 0 && (
                  <button
                    onClick={() => {
                      setPaymentAmount(selectedSupplier.outstandingBalance.toString());
                      setIsPaymentModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs"
                  >
                    Pay Vendor
                  </button>
                )}
              </div>

              {/* PO Invoices List */}
              <div>
                <h4 className="text-xs font-semibold text-zinc-300 mb-2">
                  Recent Purchase Invoices (PO)
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {purchases.filter((p) => p.supplierId === selectedSupplier.id).length === 0 ? (
                    <div className="text-zinc-500 text-xs text-center py-6">
                      No purchase entries recorded for this supplier.
                    </div>
                  ) : (
                    purchases
                      .filter((p) => p.supplierId === selectedSupplier.id)
                      .map((po) => (
                        <div key={po.id} className="p-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="font-mono text-zinc-200">{po.invoiceNumber}</span>
                            <span className="font-mono text-amber-400">{formatCurrency(po.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-zinc-500">
                            <span>{formatDateTime(po.date)}</span>
                            <span className="text-emerald-400 font-medium">Paid: {formatCurrency(po.paidAmount)}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 py-16">
              <Truck className="w-10 h-10 text-zinc-700 mb-2 stroke-1" />
              <p className="text-xs font-medium text-zinc-400">Select a Supplier</p>
              <p className="text-[11px] text-zinc-600 max-w-[200px] mt-0.5">
                Click a supplier on the left to review procurement history and settle dues.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* NEW SUPPLIER MODAL */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-zinc-100">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Add Apparel Supplier / Mill</h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Company / Mill Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vardhman Textiles"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Rajesh Khurana"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Mobile / Telephone *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98140 12345"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="27AAABC1234F1Z5"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Address / Mill Location</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Mill address or warehouse hub"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW PURCHASE ENTRY (PO) MODAL */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden text-zinc-100 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">New Purchase Entry (Stock Inflow)</h3>
                <p className="text-xs text-zinc-400">Restock inventory directly into size & color matrix</p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Select Supplier *</label>
                  <select
                    value={purchaseSupplierId}
                    onChange={(e) => setPurchaseSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.contactPerson})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Advance / Paid Amount (₹)</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-zinc-300">Restock Items</span>
                  <button
                    type="button"
                    onClick={handleAddPurchaseRow}
                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 rounded text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase border-b border-zinc-800">
                      <tr>
                        <th className="py-2 px-3">Product</th>
                        <th className="py-2 px-3">Variant (Size/Color)</th>
                        <th className="py-2 px-3 w-20">Quantity</th>
                        <th className="py-2 px-3 w-24">Cost Rate (₹)</th>
                        <th className="py-2 px-3 text-right">Total (₹)</th>
                        <th className="py-2 px-2 text-center w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {purchaseItems.map((item, idx) => {
                        const prod = products.find((p) => p.id === item.productId);
                        return (
                          <tr key={idx} className="hover:bg-zinc-800/30">
                            <td className="py-2 px-3">
                              <select
                                value={item.productId}
                                onChange={(e) => handlePurchaseRowChange(idx, 'productId', e.target.value)}
                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white"
                              >
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2 px-3">
                              <select
                                value={item.variantId}
                                onChange={(e) => handlePurchaseRowChange(idx, 'variantId', e.target.value)}
                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-xs text-white font-mono"
                              >
                                {prod?.variants.map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.size} / {v.color} (Curr: {v.stock})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => handlePurchaseRowChange(idx, 'quantity', e.target.value)}
                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-center text-xs text-white font-mono"
                              />
                            </td>

                            <td className="py-2 px-3">
                              <input
                                type="number"
                                min={0}
                                value={item.costPrice}
                                onChange={(e) => handlePurchaseRowChange(idx, 'costPrice', e.target.value)}
                                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-right text-xs text-white font-mono"
                              />
                            </td>

                            <td className="py-2 px-3 text-right font-mono font-bold text-amber-400">
                              {formatCurrency(item.total)}
                            </td>

                            <td className="py-2 px-2 text-center">
                              {purchaseItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePurchaseRow(idx)}
                                  className="text-zinc-500 hover:text-red-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center p-3 bg-zinc-950 border border-zinc-800 rounded-lg font-mono">
                  <span className="text-zinc-400 uppercase font-sans text-xs font-semibold">
                    Total Purchase Order Value:
                  </span>
                  <span className="text-base font-bold text-amber-400">
                    {formatCurrency(purchaseTotalAmount)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Save PO & Restock Variants
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Due Payment Modal */}
      {isPaymentModalOpen && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden text-zinc-100">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Pay Supplier Due</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySupplierSubmit} className="p-5 space-y-3.5 text-xs">
              <p className="text-zinc-400">
                Settling outstanding balance for <strong className="text-white">{selectedSupplier.name}</strong>.
              </p>
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Amount to Pay (₹)</label>
                <input
                  type="number"
                  min={1}
                  max={selectedSupplier.outstandingBalance}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Confirm Settle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
