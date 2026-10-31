import React from 'react';
import { Clock, Trash2, ArrowRight, X, AlertCircle } from 'lucide-react';
import { HeldBill } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface HeldBillsModalProps {
  heldBills: HeldBill[];
  onRecall: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const HeldBillsModal: React.FC<HeldBillsModalProps> = ({
  heldBills,
  onRecall,
  onDelete,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-zinc-100">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Held / Parked Bills</h3>
              <p className="text-xs text-zinc-400">{heldBills.length} bills currently on hold</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto space-y-3">
          {heldBills.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs">
              No bills currently parked on hold. Use "Hold Bill (F6)" in POS billing to park an active cart.
            </div>
          ) : (
            heldBills.map((bill) => {
              const totalAmount = bill.items.reduce((s, i) => s + i.totalAmount, 0);
              return (
                <div
                  key={bill.id}
                  className="bg-zinc-950 border border-zinc-800 p-3.5 rounded-lg flex items-center justify-between hover:border-zinc-700 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-white">{bill.customerName}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {formatDateTime(bill.heldAt)}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      {bill.items.length} item{bill.items.length > 1 ? 's' : ''} ({bill.items.map((i) => `${i.productName} [${i.size}]`).join(', ')})
                    </div>
                    <div className="text-xs font-bold text-amber-400">
                      {formatCurrency(totalAmount)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDelete(bill.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded-lg transition-colors"
                      title="Discard Held Bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        onRecall(bill.id);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs transition-colors shadow-xs"
                    >
                      <span>Recall</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
