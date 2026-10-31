import React, { useState } from 'react';
import { X, Check, ArrowDownRight, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { Product } from '../../types';

interface StockAdjustmentModalProps {
  products: Product[];
  onAdjust: (
    productId: string,
    variantId: string,
    quantityChange: number,
    type: 'PURCHASE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE',
    reason: string
  ) => boolean;
  onClose: () => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  products,
  onAdjust,
  onClose,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    selectedProduct?.variants[0]?.id || ''
  );
  const selectedVariant =
    selectedProduct?.variants.find((v) => v.id === selectedVariantId) ||
    selectedProduct?.variants[0];

  const [type, setType] = useState<'ADJUSTMENT' | 'DAMAGE' | 'RETURN'>('ADJUSTMENT');
  const [quantity, setQuantity] = useState<string>('1');
  const [direction, setDirection] = useState<'ADD' | 'REMOVE'>('ADD');
  const [reason, setReason] = useState<string>('Physical store audit recount');

  const currentStock = selectedVariant ? selectedVariant.stock : 0;
  const qtyNumber = parseInt(quantity) || 0;
  const calculatedChange = direction === 'ADD' ? qtyNumber : -qtyNumber;
  const resultingStock = Math.max(0, currentStock + calculatedChange);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedVariant) return;
    if (qtyNumber <= 0) {
      alert('Quantity must be greater than 0.');
      return;
    }

    const success = onAdjust(
      selectedProduct.id,
      selectedVariant.id,
      calculatedChange,
      type === 'DAMAGE' ? 'DAMAGE' : type === 'RETURN' ? 'RETURN' : 'ADJUSTMENT',
      reason
    );

    if (success) {
      onClose();
    } else {
      alert('Failed to apply stock adjustment.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-zinc-100">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Manual Stock Adjustment</h3>
            <p className="text-xs text-zinc-400">Stock In, Stock Out, or Damage Write-Off</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Product Select */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1">Select Product *</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find((prod) => prod.id === e.target.value);
                if (p && p.variants[0]) {
                  setSelectedVariantId(p.variants[0].id);
                }
              }}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Variant Select */}
          {selectedProduct && (
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Size & Color Variant *</label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
              >
                {selectedProduct.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    Size {v.size} / {v.color} (Current: {v.stock} units)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Direction */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1">Operation Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDirection('ADD');
                  setType('ADJUSTMENT');
                }}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  direction === 'ADD'
                    ? 'bg-emerald-950 border-emerald-600 text-emerald-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Stock In (+)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDirection('REMOVE');
                  setType('ADJUSTMENT');
                }}
                className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  direction === 'REMOVE'
                    ? 'bg-red-950 border-red-600 text-red-400'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Stock Out (-)</span>
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1">Quantity of Units</label>
            <input
              type="number"
              min={1}
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white text-sm font-bold font-mono"
            />
          </div>

          {/* Stock Preview */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center justify-between font-mono">
            <div>
              <span className="text-zinc-500 text-[11px] block">Current Stock</span>
              <span className="text-white font-bold">{currentStock}</span>
            </div>
            <div className="text-zinc-500 font-bold">→</div>
            <div>
              <span className="text-zinc-500 text-[11px] block">Resulting Stock</span>
              <span className="text-amber-400 font-bold text-sm">{resultingStock}</span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-zinc-400 font-semibold mb-1">Reason / Remarks *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Found extra box during stock audit, display sample write-off"
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              Apply Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
