import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Printer,
  RotateCcw,
  AlertTriangle,
  X,
  Check,
  Eye,
  Lock,
  Download,
  Share2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ThermalReceiptModal } from './ThermalReceiptModal';

export const PastBillsView: React.FC = () => {
  const { sales, cancelOrRefundBill, settings } = useApp();

  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [cancelModalSale, setCancelModalSale] = useState<Sale | null>(null);
  const [actionType, setActionType] = useState<'CANCELLED' | 'REFUNDED'>('CANCELLED');
  const [reason, setReason] = useState('Customer returned sizing mismatch');
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const filteredSales = sales.filter(
    (s) =>
      s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (s.customerPhone && s.customerPhone.includes(search))
  );

  const handleOpenCancel = (sale: Sale, type: 'CANCELLED' | 'REFUNDED') => {
    setCancelModalSale(sale);
    setActionType(type);
    setReason(type === 'REFUNDED' ? 'Customer garment return & refund' : 'Billed in error / cancelled before dispatch');
    setPin('');
    setErrorMsg('');
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalSale) return;

    const res = cancelOrRefundBill(cancelModalSale.id, reason, pin, actionType);
    if (res.success) {
      alert(res.message);
      setCancelModalSale(null);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Invoice Archive & Bill Authorizations</h2>
          <p className="text-xs text-zinc-400">
            Reprint receipts, share digital invoices, or authorize cancellations & refunds
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, customer name or phone..."
            className="w-full px-3 py-2 pl-9 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400"
          />
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-2.5 px-4">Invoice #</th>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Garments</th>
                <th className="py-2.5 px-3">Cashier</th>
                <th className="py-2.5 px-3">Payment</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-zinc-800/30">
                  <td className="py-3 px-4 font-mono font-bold text-zinc-200">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">
                    {formatDateTime(sale.date)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-white">{sale.customerName}</div>
                    {sale.customerPhone && (
                      <div className="text-[11px] text-zinc-500 font-mono">{sale.customerPhone}</div>
                    )}
                  </td>
                  <td className="py-3 px-3 text-zinc-400 max-w-[200px] truncate">
                    {sale.items.map((i) => `${i.productName} (${i.size})`).join(', ')}
                  </td>
                  <td className="py-3 px-3 text-zinc-400">
                    {sale.cashierName}
                  </td>
                  <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                    {sale.paymentMethod}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                    {formatCurrency(sale.grandTotal)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sale.status === 'COMPLETED'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : sale.status === 'REFUNDED'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800/50'
                          : 'bg-red-950 text-red-400 border border-red-800/50'
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] font-semibold flex items-center gap-1 border border-zinc-700"
                        title="View Thermal Receipt / PDF / WhatsApp"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Receipt</span>
                      </button>

                      {sale.status === 'COMPLETED' && (
                        <>
                          <button
                            onClick={() => handleOpenCancel(sale, 'REFUNDED')}
                            className="px-2 py-1 bg-purple-950/60 hover:bg-purple-900 text-purple-300 rounded text-[11px] font-semibold border border-purple-800/60"
                            title="Refund Bill"
                          >
                            Refund
                          </button>
                          <button
                            onClick={() => handleOpenCancel(sale, 'CANCELLED')}
                            className="px-2 py-1 bg-red-950/60 hover:bg-red-900 text-red-400 rounded text-[11px] font-semibold border border-red-800/60"
                            title="Cancel Bill"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thermal Receipt Preview Modal */}
      {selectedSale && (
        <ThermalReceiptModal
          sale={selectedSale}
          settings={settings}
          onClose={() => setSelectedSale(null)}
          onNewBill={() => setSelectedSale(null)}
        />
      )}

      {/* CANCEL / REFUND AUTHORIZATION MODAL */}
      {cancelModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden text-zinc-100 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  Authorize {actionType}
                </h3>
              </div>
              <button
                onClick={() => setCancelModalSale(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Authorizing will restore stock for all {cancelModalSale.items.length} garments back into active inventory and update the audit log.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Reason for {actionType} *</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Admin / Manager 4-Digit PIN *</label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  autoFocus
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="••••"
                  className="w-full py-2 px-3 text-center text-lg font-mono tracking-widest bg-zinc-950 border border-zinc-700 rounded-lg text-white font-bold"
                />
                {errorMsg && <p className="text-red-400 text-[11px] mt-1">{errorMsg}</p>}
                <p className="text-[10px] text-zinc-500 mt-1">
                  Manager PIN: <span className="font-mono text-zinc-400">2222</span> · Admin PIN: <span className="font-mono text-zinc-400">1234</span>
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCancelModalSale(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium"
                >
                  Dismiss
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-4 h-4" />
                  Confirm & Reverse Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
