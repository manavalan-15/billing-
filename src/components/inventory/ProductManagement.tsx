import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  History,
  Grid3X3,
  Edit,
  Trash2,
  AlertTriangle,
  Download,
  DollarSign,
  TrendingUp,
  Tag,
  ScanBarcode
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Category, CATEGORIES, Product } from '../../types';
import { formatCurrency, downloadCSV } from '../../utils/formatters';
import { ProductFormModal } from './ProductFormModal';
import { VariantStockMatrixModal } from './VariantStockMatrixModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { StockHistoryView } from './StockHistoryView';

interface ProductManagementProps {
  onOpenBarcode?: () => void;
}

export const ProductManagement: React.FC<ProductManagementProps> = ({ onOpenBarcode }) => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock, suppliers, stockMovements } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [matrixProduct, setMatrixProduct] = useState<Product | null>(null);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Calculations: Inventory Valuation
  const totalUnits = products.reduce((sum, p) => sum + p.totalStock, 0);
  const totalCostValuation = products.reduce(
    (sum, p) => sum + p.purchasePrice * p.totalStock,
    0
  );
  const totalRetailValuation = products.reduce(
    (sum, p) => sum + p.sellingPrice * p.totalStock,
    0
  );
  const potentialProfit = totalRetailValuation - totalCostValuation;

  // Filtered Products
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'All' || prod.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      prod.name.toLowerCase().includes(q) ||
      prod.sku.toLowerCase().includes(q) ||
      prod.barcode.toLowerCase().includes(q) ||
      prod.brand.toLowerCase().includes(q);

    const hasLowStockVariant = prod.variants.some((v) => v.stock <= v.lowStockThreshold);
    const matchesLowStock = !onlyLowStock || hasLowStockVariant;

    return matchesCategory && matchesSearch && matchesLowStock;
  });

  const handleExportCSV = () => {
    const rows = [
      ['Product Name', 'SKU', 'Barcode', 'Category', 'Brand', 'Purchase Price', 'Selling Price', 'MRP', 'GST %', 'Total Stock', 'Supplier'],
      ...products.map((p) => [
        p.name,
        p.sku,
        p.barcode,
        p.category,
        p.brand,
        p.purchasePrice,
        p.sellingPrice,
        p.mrp,
        p.gstRate,
        p.totalStock,
        p.supplierName,
      ]),
    ];
    downloadCSV('Aura_Menswear_Inventory_Catalogue', rows);
  };

  const handleDelete = (prod: Product) => {
    if (confirm(`Are you sure you want to delete "${prod.name}" and all its size/color stock?`)) {
      deleteProduct(prod.id);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Top Valuation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Total Inventory Units
          </span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            {totalUnits.toLocaleString()} Pcs
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Across {products.length} menswear styles
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Cost Valuation (Asset)
          </span>
          <div className="text-xl font-bold font-mono text-zinc-200 mt-1">
            {formatCurrency(totalCostValuation)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Total capital invested in stock
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Retail Valuation (MRP)
          </span>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(totalRetailValuation)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            Gross potential showroom revenue
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5">
          <span className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Projected Gross Margin
          </span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(potentialProfit)}
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            ~{totalRetailValuation > 0 ? Math.round((potentialProfit / totalRetailValuation) * 100) : 0}% potential margin
          </div>
        </div>
      </div>

      {/* Control Header & Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name, SKU, barcode, brand..."
                className="w-full px-3 py-2 pl-9 bg-zinc-950 border border-zinc-700/80 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400"
              />
            </div>

            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                onlyLowStock
                  ? 'bg-red-950/80 border-red-700 text-red-300'
                  : 'bg-zinc-950 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Low Stock Alerts</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdjustmentOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Stock Adjust</span>
            </button>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span>Movement Log</span>
            </button>

            {onOpenBarcode && (
              <button
                onClick={onOpenBarcode}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors shadow-xs"
                title="Open Barcode & Price Tag Generator"
              >
                <ScanBarcode className="w-3.5 h-3.5 text-amber-400" />
                <span>Barcode Labels</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold transition-colors"
              title="Download full catalogue as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                setEditingProduct(undefined);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-amber-400 text-black font-bold shadow-xs'
                : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
            }`}
          >
            All Categories
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-amber-400 text-black font-bold shadow-xs'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-zinc-950 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Product & Style</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">SKU / Barcode</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">MRP</th>
                <th className="py-3 px-3 text-center">GST %</th>
                <th className="py-3 px-3 text-center">Total Stock</th>
                <th className="py-3 px-3 text-center">Size & Color Matrix</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-zinc-500 text-xs">
                    No products found matching your search and filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const hasLowStock = prod.variants.some((v) => v.stock <= v.lowStockThreshold);
                  const marginPct = prod.sellingPrice > 0
                    ? Math.round(((prod.sellingPrice - prod.purchasePrice) / prod.sellingPrice) * 100)
                    : 0;

                  return (
                    <tr key={prod.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {prod.imageUrl ? (
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-10 h-10 rounded-md object-cover border border-zinc-800 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-md bg-zinc-800 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-zinc-500" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-white text-xs truncate max-w-[200px]">
                              {prod.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Supplier: {prod.supplierName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-zinc-300 font-medium">
                        {prod.category}
                      </td>

                      <td className="py-3 px-3 text-zinc-300">
                        {prod.brand}
                      </td>

                      <td className="py-3 px-3 font-mono text-zinc-400 text-[11px]">
                        <div className="font-semibold text-zinc-200">{prod.sku}</div>
                        <div className="text-zinc-500 text-[10px]">{prod.barcode}</div>
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-zinc-400">
                        {formatCurrency(prod.purchasePrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400">
                        {formatCurrency(prod.sellingPrice)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-zinc-400">
                        {formatCurrency(prod.mrp)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-300">
                          {prod.gstRate}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            prod.totalStock <= 0
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : hasLowStock
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}
                        >
                          {prod.totalStock}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setMatrixProduct(prod)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1 mx-auto"
                          title="View / Edit stock per size and color"
                        >
                          <Grid3X3 className="w-3 h-3 text-amber-400" />
                          <span>{prod.variants.length} Variants</span>
                        </button>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {onOpenBarcode && (
                            <button
                              onClick={onOpenBarcode}
                              className="p-1.5 text-amber-400/80 hover:text-amber-300 hover:bg-zinc-800 rounded transition-colors"
                              title="Print Barcode Labels for this Style"
                            >
                              <ScanBarcode className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsFormOpen(true);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isFormOpen && (
        <ProductFormModal
          initialProduct={editingProduct}
          suppliers={suppliers}
          onSave={(prodPayload) => {
            if (editingProduct) {
              updateProduct(prodPayload);
            } else {
              addProduct(prodPayload);
            }
            setIsFormOpen(false);
          }}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {matrixProduct && (
        <VariantStockMatrixModal
          product={matrixProduct}
          onSave={(updated) => updateProduct(updated)}
          onClose={() => setMatrixProduct(null)}
        />
      )}

      {isAdjustmentOpen && (
        <StockAdjustmentModal
          products={products}
          onAdjust={adjustStock}
          onClose={() => setIsAdjustmentOpen(false)}
        />
      )}

      {isHistoryOpen && (
        <StockHistoryView
          stockMovements={stockMovements}
          onClose={() => setIsHistoryOpen(false)}
        />
      )}
    </div>
  );
};
