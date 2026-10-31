import React, { useState } from 'react';
import { X, Check, ShoppingBag, AlertTriangle } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface VariantPickerModalProps {
  product: Product;
  onAddToCart: (variant: ProductVariant, quantity: number) => void;
  onClose: () => void;
}

export const VariantPickerModal: React.FC<VariantPickerModalProps> = ({
  product,
  onAddToCart,
  onClose,
}) => {
  // Extract unique sizes and colors available for this product
  const availableSizes = Array.from(new Set(product.variants.map((v) => v.size)));
  const availableColors = Array.from(new Set(product.variants.map((v) => v.color)));

  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0] || '');
  const [selectedColor, setSelectedColor] = useState<string>(availableColors[0] || '');
  const [quantity, setQuantity] = useState<number>(1);

  // Find exact matching variant
  const selectedVariant = product.variants.find(
    (v) => v.size === selectedSize && v.color === selectedColor
  );

  const currentStock = selectedVariant ? selectedVariant.stock : 0;
  const isOutOfStock = currentStock <= 0;

  const handleAdd = () => {
    if (!selectedVariant || isOutOfStock) return;
    onAddToCart(selectedVariant, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-start justify-between bg-zinc-900/90">
          <div className="flex gap-3">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover border border-zinc-700 shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-6 h-6 text-zinc-400" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-white line-clamp-1">{product.name}</h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                <span>{product.brand}</span>
                <span>·</span>
                <span className="font-mono text-zinc-400">{product.sku}</span>
              </div>
              <div className="text-sm font-bold text-amber-400 mt-1">
                {formatCurrency(product.sellingPrice)}
                {product.mrp > product.sellingPrice && (
                  <span className="text-xs text-zinc-500 line-through ml-2 font-normal">
                    {formatCurrency(product.mrp)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Size Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Select Size
            </label>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map((size) => {
                const isSelected = selectedSize === size;
                // calculate if this size has any stock across colors
                const sizeStock = product.variants
                  .filter((v) => v.size === size)
                  .reduce((sum, v) => sum + v.stock, 0);

                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-10 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-white text-zinc-900 border-white font-bold'
                        : sizeStock > 0
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-600 line-through'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
              Select Color
            </label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map((color) => {
                const isSelected = selectedColor === color;
                const variantForCombo = product.variants.find(
                  (v) => v.size === selectedSize && v.color === color
                );
                const comboStock = variantForCombo ? variantForCombo.stock : 0;

                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-amber-400 text-black border-amber-400 font-bold'
                        : comboStock > 0
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                    }`}
                  >
                    {variantForCombo?.colorHex && (
                      <span
                        className="w-3 h-3 rounded-full border border-black/40 inline-block"
                        style={{ backgroundColor: variantForCombo.colorHex }}
                      />
                    )}
                    <span>{color}</span>
                    <span className="text-[10px] text-zinc-400">({comboStock})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Availability Indicator */}
          <div className="p-3 bg-zinc-950 rounded-lg border border-zinc-800 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-zinc-400">Stock for {selectedSize} / {selectedColor}: </span>
              <span className={`font-bold ml-1 ${currentStock > 3 ? 'text-emerald-400' : currentStock > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                {currentStock > 0 ? `${currentStock} units available` : 'Out of Stock'}
              </span>
            </div>
            {selectedVariant && (
              <span className="font-mono text-[11px] text-zinc-500">
                {selectedVariant.sku}
              </span>
            )}
          </div>

          {/* Quantity Controls */}
          {currentStock > 0 && (
            <div className="flex items-center justify-between pt-1">
              <label className="text-xs font-semibold text-zinc-300">Quantity</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm flex items-center justify-center"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={currentStock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.min(currentStock, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-14 h-8 bg-zinc-950 border border-zinc-700 rounded-lg text-center text-xs text-white font-bold"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isOutOfStock || !selectedVariant}
            onClick={handleAdd}
            className={`px-5 py-2 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors ${
              isOutOfStock || !selectedVariant
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-black shadow-md'
            }`}
          >
            <Check className="w-4 h-4" />
            Add to Bill (₹{((selectedVariant?.sellingPrice ?? product.sellingPrice) * quantity).toFixed(0)})
          </button>
        </div>
      </div>
    </div>
  );
};
