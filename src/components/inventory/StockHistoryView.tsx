import React, { useState } from 'react';
import { History, X, Search, Filter, Download } from 'lucide-react';
import { MovementType, StockMovement } from '../../types';
import { formatDateTime, downloadCSV } from '../../utils/formatters';

interface StockHistoryViewProps {
  stockMovements: StockMovement[];
  onClose: () => void;
}

export const StockHistoryView: React.FC<StockHistoryViewProps> = ({
  stockMovements,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<MovementType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = stockMovements.filter((m) => {
    const matchesType = filterType === 'ALL' || m.type === filterType;
    const query = search.toLowerCase();
    const matchesQuery =
      !query ||
      m.productName.toLowerCase().includes(query) ||
      m.referenceId.toLowerCase().includes(query) ||
      m.performedBy.toLowerCase().includes(query);
    return matchesType && matchesQuery;
  });

  const handleExportCSV = () => {
    const rows = [
      ['Timestamp', 'Movement Type', 'Product Name', 'Size', 'Color', 'Quantity Change', 'New Stock Level', 'Reference ID', 'Performed By', 'Reason'],
      ...filtered.map((m) => [
        m.timestamp,
        m.type,
        m.productName,
        m.size,
        m.color,
        m.quantityChange,
        m.newStockLevel,
        m.referenceId,
        m.performedBy,
        m.reason || '',
      ]),
    ];
    downloadCSV('Aura_Stock_Movement_History', rows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Stock Movement & Audit History</h3>
              <p className="text-xs text-zinc-400">Complete ledger of sales deductions, purchase restocks, and adjustments</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="p-3 border-b border-zinc-800 bg-zinc-950/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, invoice #, PO #, staff..."
              className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-white"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {(['ALL', 'SALE', 'PURCHASE', 'ADJUSTMENT', 'RETURN', 'DAMAGE'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  filterType === t
                    ? 'bg-amber-400 text-black font-bold'
                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md text-xs font-semibold ml-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-950 text-zinc-400 sticky top-0 border-b border-zinc-800 text-[10px] uppercase">
              <tr>
                <th className="py-2.5 px-3">Date & Time</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Product Description</th>
                <th className="py-2.5 px-3">Size/Color</th>
                <th className="py-2.5 px-3 text-right">Change</th>
                <th className="py-2.5 px-3 text-right">New Stock</th>
                <th className="py-2.5 px-3">Ref ID</th>
                <th className="py-2.5 px-3">Staff</th>
                <th className="py-2.5 px-3">Reason / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-800/40">
                  <td className="py-2.5 px-3 text-zinc-400 font-mono text-[11px]">
                    {formatDateTime(item.timestamp)}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.type === 'SALE'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800/50'
                          : item.type === 'PURCHASE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                          : item.type === 'RETURN'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800/50'
                          : item.type === 'DAMAGE'
                          ? 'bg-red-950 text-red-400 border border-red-800/50'
                          : 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      {item.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-white truncate max-w-[180px]">
                    {item.productName}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-300">
                    {item.size} / {item.color}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right font-mono font-bold ${
                      item.quantityChange > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {item.quantityChange > 0 ? `+${item.quantityChange}` : item.quantityChange}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-zinc-300">
                    {item.newStockLevel}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-zinc-400 text-[11px]">
                    {item.referenceId}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400">
                    {item.performedBy}
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 truncate max-w-[150px]">
                    {item.reason || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
