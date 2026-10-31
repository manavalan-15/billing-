import React, { useState } from 'react';
import { X, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { Product, ProductVariant } from '../../types';

interface VariantStockMatrixModalProps {
  product: Product;
  onSave: (updatedProduct: Product) => void;
  onClose: () => void;
}

export const VariantStockMatrixModal: React.FC<VariantStockMatrixModalProps> = ({
  product,
  onSave,
  onClose,
}) => {
  const [variants, setVariants] = useState<ProductVariant[]>([...product.variants]);

  // Extract unique sizes and colors
  const sizes = Array.from(new Set(variants.map((v) => v.size)));
  const colors = Array.from(new Set(variants.map((v) => v.color)));

  const handleStockChange = (size: string, color: string, newStock: number) => {
    const safeStock = Math.max(0, isNaN(newStock) ? 0 : newStock);
    setVariants((prev) =>
      prev.map((v) => {
        if (v.size === size && v.color === color) {
          return { ...v, stock: safeStock };
        }
        return v;
      })
    );
  };

  const handleSave = () => {
    const totalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    const updated: Product = {
      ...product,
      variants,
      totalStock,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    onSave(updated);
    onClose();
  };

  const currentTotalStock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div>
            <h3 className="text-sm font-bold text-white">
              Size & Color Stock Matrix · {product.name}
            </h3>
            <p className="text-xs text-zinc-400">
              SKU: <span className="font-mono text-amber-400">{product.sku}</span> · Total Units: <span className="font-bold text-white">{currentTotalStock}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="p-5 overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="py-2.5 px-3 text-left font-bold uppercase tracking-wider text-[11px]">
                  Color \ Size
                </th>
                {sizes.map((size) => (
                  <th key={size} className="py-2.5 px-3 font-bold uppercase tracking-wider text-[11px] text-amber-400">
                    Size {size}
                  </th>
                ))}
                <th className="py-2.5 px-3 font-bold uppercase tracking-wider text-[11px] text-right">
                  Color Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {colors.map((color) => {
                let colorRowTotal = 0;
                return (
                  <tr key={color} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-3 text-left font-semibold text-white flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full border border-black/40 inline-block bg-zinc-600"></span>
                      <span>{color}</span>
                    </td>
                    {sizes.map((size) => {
                      const variant = variants.find((v) => v.size === size && v.color === color);
                      if (!variant) {
                        return (
                          <td key={size} className="py-2 px-2 text-zinc-600 font-mono">
                            -
                          </td>
                        );
                      }
                      colorRowTotal += variant.stock;
                      return (
                        <td key={size} className="py-2 px-2">
                          <input
                            type="number"
                            min={0}
                            value={variant.stock}
                            onChange={(e) => handleStockChange(size, color, parseInt(e.target.value) || 0)}
                            className={`w-16 py-1 px-2 text-center rounded border font-mono font-bold text-xs focus:outline-hidden ${
                              variant.stock <= variant.lowStockThreshold
                                ? 'bg-red-950/40 border-red-700/60 text-red-300 focus:border-red-500'
                                : 'bg-zinc-950 border-zinc-700 text-white focus:border-amber-400'
                            }`}
                          />
                          <div className="text-[9px] text-zinc-500 font-mono mt-0.5" title="Variant Barcode">
                            {variant.barcode}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-right font-mono font-bold text-zinc-300">
                      {colorRowTotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-700 text-xs font-bold text-zinc-200">
                <td className="py-2.5 px-3 text-left uppercase text-amber-400">
                  Size Total:
                </td>
                {sizes.map((size) => {
                  const sizeTotal = variants
                    .filter((v) => v.size === size)
                    .reduce((sum, v) => sum + v.stock, 0);
                  return (
                    <td key={size} className="py-2.5 px-3 font-mono text-zinc-200">
                      {sizeTotal}
                    </td>
                  );
                })}
                <td className="py-2.5 px-3 text-right font-mono text-amber-400 text-sm">
                  {currentTotalStock}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Updates are recorded in the central inventory log immediately</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              Save Stock Matrix
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
