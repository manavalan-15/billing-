import React, { useState } from 'react';
import { CreditCard, QrCode, Banknote, GitMerge, Check, AlertCircle, X, Sparkles } from 'lucide-react';
import { Customer, PaymentMethod, ShopSettings, SplitPaymentDetail } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PaymentModalProps {
  grandTotal: number;
  customer: Customer | null;
  settings: ShopSettings;
  onClose: () => void;
  onConfirm: (
    paymentMethod: PaymentMethod,
    splitDetails?: SplitPaymentDetail,
    amountReceived?: number,
    notes?: string,
    redeemLoyaltyPoints?: number
  ) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  grandTotal,
  customer,
  settings,
  onClose,
  onConfirm,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [cashTendered, setCashTendered] = useState<string>(grandTotal.toString());
  const [notes, setNotes] = useState<string>('');
  
  // Split payment state
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitUpi, setSplitUpi] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');

  // Loyalty redemption state
  const [redeemPoints, setRedeemPoints] = useState<boolean>(false);
  const maxAvailablePoints = customer?.loyaltyPoints || 0;
  const maxRedeemablePoints = Math.min(maxAvailablePoints, Math.floor(grandTotal / settings.loyaltyRedeemValue));
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(maxRedeemablePoints);

  const loyaltyDiscount = redeemPoints ? pointsToRedeem * settings.loyaltyRedeemValue : 0;
  const netPayable = Math.max(0, grandTotal - loyaltyDiscount);

  // Cash change
  const cashNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, cashNum - netPayable);

  // Split calculation
  const sCash = parseFloat(splitCash) || 0;
  const sUpi = parseFloat(splitUpi) || 0;
  const sCard = parseFloat(splitCard) || 0;
  const splitTotal = sCash + sUpi + sCard;
  const splitRemaining = netPayable - splitTotal;

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleConfirm = () => {
    if (method === 'Cash') {
      if (cashNum < netPayable) {
        alert('Tendered cash is less than the net payable amount.');
        return;
      }
      onConfirm('Cash', undefined, cashNum, notes, redeemPoints ? pointsToRedeem : 0);
    } else if (method === 'UPI') {
      onConfirm('UPI', undefined, netPayable, notes, redeemPoints ? pointsToRedeem : 0);
    } else if (method === 'Card') {
      onConfirm('Card', undefined, netPayable, notes, redeemPoints ? pointsToRedeem : 0);
    } else if (method === 'Split') {
      if (Math.abs(splitRemaining) > 0.5) {
        alert(`Split amounts must equal the net payable of ${formatCurrency(netPayable)}. Current difference: ${formatCurrency(splitRemaining)}`);
        return;
      }
      onConfirm(
        'Split',
        { cash: sCash, upi: sUpi, card: sCard },
        netPayable,
        notes,
        redeemPoints ? pointsToRedeem : 0
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-zinc-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div>
            <h3 className="text-base font-bold text-white">Payment & Checkout</h3>
            <p className="text-xs text-zinc-400">
              {customer ? `Billed to ${customer.name}` : 'Walk-in Customer'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Amount Due Banner */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">Grand Total Due</span>
              <div className="text-2xl font-black text-amber-400 mt-0.5">
                {formatCurrency(netPayable)}
              </div>
              {loyaltyDiscount > 0 && (
                <div className="text-[11px] text-emerald-400 mt-0.5">
                  Saved {formatCurrency(loyaltyDiscount)} with loyalty points
                </div>
              )}
            </div>
            {customer && customer.loyaltyPoints > 0 && (
              <div className="text-right">
                <span className="text-xs text-zinc-400">Available Points</span>
                <div className="text-sm font-bold text-zinc-200">{customer.loyaltyPoints} pts</div>
              </div>
            )}
          </div>

          {/* Loyalty Redemption Section */}
          {customer && maxRedeemablePoints > 0 && (
            <div className="bg-zinc-800/60 border border-zinc-700/60 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="text-xs font-semibold text-zinc-200">Redeem Loyalty Points</span>
                    <p className="text-[11px] text-zinc-400">
                      1 pt = ₹{settings.loyaltyRedeemValue} discount
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {redeemPoints && (
                <div className="mt-3 pt-2.5 border-t border-zinc-700 flex items-center justify-between text-xs">
                  <span className="text-zinc-300">Points to Redeem:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={maxRedeemablePoints}
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(Math.min(maxRedeemablePoints, Math.max(1, parseInt(e.target.value) || 0)))}
                      className="w-20 px-2 py-1 bg-zinc-900 border border-zinc-700 rounded text-center text-xs text-white"
                    />
                    <span className="text-emerald-400 font-semibold">
                      (-{formatCurrency(pointsToRedeem * settings.loyaltyRedeemValue)})
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Method Tabs */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Select Payment Mode
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'Cash', label: 'Cash', icon: Banknote },
                { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                { id: 'Card', label: 'Card', icon: CreditCard },
                { id: 'Split', label: 'Split Pay', icon: GitMerge },
              ].map((item) => {
                const Icon = item.icon;
                const active = method === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id as PaymentMethod)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-lg border text-xs font-medium transition-all ${
                      active
                        ? 'bg-zinc-100 text-zinc-900 border-white shadow-sm'
                        : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Method Details */}
          {method === 'Cash' && (
            <div className="space-y-3 bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-xl">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Cash Received (₹)</label>
                <input
                  type="number"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-lg font-bold text-white focus:outline-hidden focus:border-amber-400"
                  placeholder="0.00"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleQuickCash(netPayable)}
                  className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700"
                >
                  Exact ({netPayable.toFixed(0)})
                </button>
                {[500, 1000, 2000, 5000].map((amt) => {
                  if (amt >= netPayable) {
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickCash(amt)}
                        className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700"
                      >
                        ₹{amt}
                      </button>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Change Returned */}
              <div className="flex justify-between items-center pt-2 border-t border-zinc-800 text-xs">
                <span className="text-zinc-400 font-medium">Change to Return:</span>
                <span className={`text-base font-bold ${changeDue > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                  {formatCurrency(changeDue)}
                </span>
              </div>
            </div>
          )}

          {method === 'UPI' && (
            <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl flex flex-col items-center text-center space-y-3">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                {/* Simulated crisp QR pattern */}
                <div className="w-36 h-36 border-4 border-black p-1 bg-white flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-black"></div>
                    <div className="w-8 h-8 bg-black"></div>
                  </div>
                  <div className="text-[10px] font-mono font-bold text-black tracking-tight">
                    AURA·POS·{netPayable.toFixed(0)}
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 bg-black"></div>
                    <div className="w-8 h-8 border-4 border-black"></div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-200">Scan via Google Pay, PhonePe, or Paytm</p>
                <p className="text-[11px] text-zinc-500 font-mono mt-0.5">UPI ID: aura.menswear@icici</p>
                <p className="text-xs text-amber-400 font-bold mt-1">Amount: {formatCurrency(netPayable)}</p>
              </div>
            </div>
          )}

          {method === 'Card' && (
            <div className="bg-zinc-950/60 border border-zinc-800/80 p-4 rounded-xl space-y-3 text-xs">
              <div className="flex items-center gap-3 text-zinc-400 pb-2 border-b border-zinc-800">
                <CreditCard className="w-8 h-8 text-amber-400" />
                <div>
                  <div className="font-semibold text-zinc-200">Swipe or Tap Card on POS EDC Terminal</div>
                  <div className="text-[11px] text-zinc-500">Supports Visa, Mastercard, RuPay & Amex</div>
                </div>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span>Charge Amount:</span>
                <span className="font-bold text-sm text-white">{formatCurrency(netPayable)}</span>
              </div>
            </div>
          )}

          {method === 'Split' && (
            <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between text-zinc-400 font-medium">
                <span>Split Breakdown</span>
                <span>Remaining: <span className={splitRemaining === 0 ? 'text-emerald-400' : 'text-amber-400'}>{formatCurrency(splitRemaining)}</span></span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Cash (₹)</label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">UPI (₹)</label>
                  <input
                    type="number"
                    value={splitUpi}
                    onChange={(e) => setSplitUpi(e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Card (₹)</label>
                  <input
                    type="number"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    placeholder="0"
                    className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes / Tailor Alterations */}
          <div>
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Order Notes / Tailoring Alteration Remarks (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Trouser hem shorten 1 inch, gift packaging requested"
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder-zinc-600 focus:outline-hidden focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Check className="w-4 h-4" />
            Complete Checkout & Print (Enter)
          </button>
        </div>
      </div>
    </div>
  );
};
