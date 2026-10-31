import React, { useState } from 'react';
import { X, Plus, Trash2, Wand2, Check, AlertCircle } from 'lucide-react';
import { Category, CATEGORIES, Product, ProductVariant, STANDARD_SIZES, Supplier } from '../../types';

interface ProductFormModalProps {
  initialProduct?: Product;
  suppliers: Supplier[];
  onSave: (product: any) => void;
  onClose: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  initialProduct,
  suppliers,
  onSave,
  onClose,
}) => {
  const isEditing = !!initialProduct;

  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [barcode, setBarcode] = useState(initialProduct?.barcode || '');
  const [category, setCategory] = useState<Category>(initialProduct?.category || 'Shirts');
  const [brand, setBrand] = useState(initialProduct?.brand || 'Aura Sartorial');
  const [purchasePrice, setPurchasePrice] = useState(initialProduct?.purchasePrice?.toString() || '900');
  const [sellingPrice, setSellingPrice] = useState(initialProduct?.sellingPrice?.toString() || '1999');
  const [mrp, setMrp] = useState(initialProduct?.mrp?.toString() || '2499');
  const [gstRate, setGstRate] = useState<number>(initialProduct?.gstRate || 12);
  const [supplierId, setSupplierId] = useState(initialProduct?.supplierId || (suppliers[0]?.id || ''));
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [imageUrl, setImageUrl] = useState(initialProduct?.imageUrl || '');

  // Size and Color Builder state
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialProduct
      ? Array.from(new Set(initialProduct.variants.map((v) => v.size)))
      : ['M', 'L', 'XL']
  );
  const [colorsInput, setColorsInput] = useState<string>(
    initialProduct
      ? Array.from(new Set(initialProduct.variants.map((v) => v.color))).join(', ')
      : 'Black, White, Navy'
  );

  // Variant list
  const [variants, setVariants] = useState<ProductVariant[]>(
    initialProduct?.variants || [
      { id: 'var_1', size: 'M', color: 'Black', stock: 10, lowStockThreshold: 3, barcode: '890123990001', sku: 'PRD-M-BLK' },
      { id: 'var_2', size: 'L', color: 'Black', stock: 15, lowStockThreshold: 3, barcode: '890123990002', sku: 'PRD-L-BLK' },
      { id: 'var_3', size: 'XL', color: 'Black', stock: 8, lowStockThreshold: 2, barcode: '890123990003', sku: 'PRD-XL-BLK' },
      { id: 'var_4', size: 'M', color: 'White', stock: 12, lowStockThreshold: 3, barcode: '890123990004', sku: 'PRD-M-WHT' },
      { id: 'var_5', size: 'L', color: 'White', stock: 18, lowStockThreshold: 4, barcode: '890123990005', sku: 'PRD-L-WHT' },
    ]
  );

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const generateVariantMatrix = () => {
    const colorList = colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    if (selectedSizes.length === 0 || colorList.length === 0) {
      alert('Please select at least one size and type at least one color name.');
      return;
    }

    const newVariants: ProductVariant[] = [];
    selectedSizes.forEach((s) => {
      colorList.forEach((c) => {
        // preserve existing stock if already existed
        const existing = variants.find((v) => v.size === s && v.color.toLowerCase() === c.toLowerCase());
        const variantSku = `${sku || 'SKU'}-${s}-${c.substring(0, 3).toUpperCase()}`;
        const variantBarcode = `890${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;

        newVariants.push({
          id: existing?.id || `var_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          size: s,
          color: c,
          stock: existing ? existing.stock : 10,
          lowStockThreshold: existing ? existing.lowStockThreshold : 3,
          sku: existing ? existing.sku : variantSku,
          barcode: existing ? existing.barcode : variantBarcode,
        });
      });
    });

    setVariants(newVariants);
  };

  const handleAutoGenerateSkuAndBarcode = () => {
    const prefix = category.substring(0, 3).toUpperCase();
    const randomSeq = Math.floor(1000 + Math.random() * 9000);
    const newSku = `${prefix}-${randomSeq}`;
    const newBarcode = `890${Date.now().toString().slice(-9)}`;
    setSku(newSku);
    setBarcode(newBarcode);
  };

  const handleVariantStockChange = (index: number, newStock: number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], stock: Math.max(0, isNaN(newStock) ? 0 : newStock) };
    setVariants(updated);
  };

  const handleVariantLowStockChange = (index: number, newThreshold: number) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], lowStockThreshold: Math.max(1, isNaN(newThreshold) ? 1 : newThreshold) };
    setVariants(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Please enter product name.');
      return;
    }
    if (!sku.trim()) {
      alert('Please enter SKU or click Auto-Generate.');
      return;
    }
    if (variants.length === 0) {
      alert('Product must have at least one size/color variant with stock.');
      return;
    }

    const pPrice = parseFloat(purchasePrice) || 0;
    const sPrice = parseFloat(sellingPrice) || 0;
    const mPrice = parseFloat(mrp) || sPrice;

    if (sPrice <= 0) {
      alert('Selling price must be greater than zero.');
      return;
    }

    const matchedSupplier = suppliers.find((s) => s.id === supplierId);

    const productPayload = {
      ...(initialProduct ? { id: initialProduct.id } : {}),
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      barcode: barcode.trim() || `890${Date.now().toString().slice(-9)}`,
      category,
      brand: brand.trim(),
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      mrp: mPrice,
      gstRate,
      supplierId,
      supplierName: matchedSupplier ? matchedSupplier.name : 'Direct Mills',
      description: description.trim(),
      imageUrl: imageUrl.trim() || undefined,
      variants,
    };

    onSave(productPayload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <div>
            <h3 className="text-base font-bold text-white">
              {isEditing ? `Edit Product · ${initialProduct.name}` : 'Add New Men\'s Wear Product'}
            </h3>
            <p className="text-xs text-zinc-400">Configure catalog information and size/color stock matrix</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* SECTION 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-zinc-800 pb-1.5">
              1. General Details
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Supima Oxford Slim Fit Shirt"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Brand Name *</label>
                <input
                  type="text"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Raymond Bespoke"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-zinc-300">Product SKU *</label>
                  <button
                    type="button"
                    onClick={handleAutoGenerateSkuAndBarcode}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-0.5"
                  >
                    <Wand2 className="w-2.5 h-2.5" /> Auto
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SHIRT-OX-01"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white font-mono uppercase focus:outline-hidden focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Barcode (EAN/UPC)</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="890123400101"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white font-mono focus:outline-hidden focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Pricing & Taxation */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-zinc-800 pb-1.5">
              2. Pricing, Margin & GST
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Purchase Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-amber-400 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">MRP (₹) *</label>
                <input
                  type="number"
                  required
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">GST Tax Rate *</label>
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                >
                  <option value={5}>5% (Apparel &lt; ₹1000)</option>
                  <option value={12}>12% (Standard Menswear &gt; ₹1000)</option>
                  <option value={18}>18% (Leather Goods & Accessories)</option>
                  <option value={0}>0% (Tax Exempt)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                >
                  {suppliers.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name} ({sup.contactPerson})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Size & Color Inventory Matrix Generator */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                3. Size & Color Stock Matrix
              </h4>
              <button
                type="button"
                onClick={generateVariantMatrix}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700 rounded text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Wand2 className="w-3 h-3" />
                Generate Matrix Combinations
              </button>
            </div>

            {/* Sizes Buttons */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Target Sizes (Click to toggle)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {STANDARD_SIZES.map((size) => {
                  const active = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1 rounded text-xs font-medium border transition-colors ${
                        active
                          ? 'bg-amber-500 text-black border-amber-500 font-bold'
                          : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Colors (Comma-separated)
              </label>
              <input
                type="text"
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                placeholder="e.g. Jet Black, Crisp White, Navy Blue, Olive Green"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white"
              />
            </div>

            {/* Generated Variants Table */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden">
              <div className="bg-zinc-950 px-3 py-2 border-b border-zinc-800 flex justify-between items-center text-xs">
                <span className="font-semibold text-zinc-300">
                  Configured Stock Matrix ({variants.length} combinations)
                </span>
                <span className="text-zinc-500 font-mono">
                  Total Units: {variants.reduce((s, v) => s + (Number(v.stock) || 0), 0)}
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/80 text-zinc-400 sticky top-0">
                    <tr className="border-b border-zinc-800 text-[11px]">
                      <th className="py-2 px-3">Size</th>
                      <th className="py-2 px-3">Color</th>
                      <th className="py-2 px-3">SKU</th>
                      <th className="py-2 px-3">Barcode</th>
                      <th className="py-2 px-3 w-24">Initial Stock</th>
                      <th className="py-2 px-3 w-24">Low Alert</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {variants.map((v, idx) => (
                      <tr key={v.id} className="hover:bg-zinc-800/30">
                        <td className="py-2 px-3 font-bold text-amber-400">{v.size}</td>
                        <td className="py-2 px-3 text-white font-medium">{v.color}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-400">{v.sku}</td>
                        <td className="py-2 px-3 font-mono text-[11px] text-zinc-400">{v.barcode}</td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min={0}
                            value={v.stock}
                            onChange={(e) => handleVariantStockChange(idx, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-center text-xs text-white font-bold"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min={1}
                            value={v.lowStockThreshold}
                            onChange={(e) => handleVariantLowStockChange(idx, parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded text-center text-xs text-zinc-400"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end gap-2 sticky bottom-0 bg-zinc-900 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              {isEditing ? 'Save Product Changes' : 'Create Product & Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
