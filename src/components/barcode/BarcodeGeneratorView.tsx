import React, { useState } from 'react';
import {
  ScanBarcode,
  Printer,
  Download,
  Sliders,
  Check,
  Package,
  Layers,
  Sparkles,
  RefreshCw,
  Tag,
  Grid
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductVariant } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { BarcodeRenderer } from '../common/BarcodeRenderer';

type LabelTemplate = '50x25' | '38x25' | 'hangtag' | 'a4_24';

interface LabelItem {
  productName: string;
  brand: string;
  size: string;
  color: string;
  sku: string;
  barcode: string;
  sellingPrice: number;
  mrp: number;
  gstRate: number;
  copies: number;
}

export const BarcodeGeneratorView: React.FC = () => {
  const { products, settings } = useApp();

  const [activeTab, setActiveTab] = useState<'CATALOGUE' | 'CUSTOM'>('CATALOGUE');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Selected variants & copies
  const [variantCopies, setVariantCopies] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    if (selectedProduct) {
      selectedProduct.variants.forEach((v) => {
        initial[v.id] = 2; // default 2 stickers each
      });
    }
    return initial;
  });

  // Label Template & Customization
  const [template, setTemplate] = useState<LabelTemplate>('50x25');
  const [showShopName, setShowShopName] = useState(true);
  const [showPrice, setShowPrice] = useState(true);
  const [showMrp, setShowMrp] = useState(true);
  const [showSizeColor, setShowSizeColor] = useState(true);
  const [showSku, setShowSku] = useState(true);

  // Custom Barcode Generator State
  const [customText, setCustomText] = useState('AURA-CUSTOM-001');
  const [customTitle, setCustomTitle] = useState("Men's Formal Apparel");
  const [customSize, setCustomSize] = useState('40 / L');
  const [customColor, setCustomColor] = useState('Navy Blue');
  const [customPrice, setCustomPrice] = useState('2499');
  const [customMrp, setCustomMrp] = useState('2999');
  const [customCopies, setCustomCopies] = useState(4);

  // When switching products, reset copies
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      const nextCopies: Record<string, number> = {};
      prod.variants.forEach((v) => {
        nextCopies[v.id] = 2;
      });
      setVariantCopies(nextCopies);
    }
  };

  const handleCopyChange = (variantId: string, count: number) => {
    setVariantCopies((prev) => ({
      ...prev,
      [variantId]: Math.max(0, count),
    }));
  };

  const handleSelectAll = (count: number) => {
    if (!selectedProduct) return;
    const nextCopies: Record<string, number> = {};
    selectedProduct.variants.forEach((v) => {
      nextCopies[v.id] = count;
    });
    setVariantCopies(nextCopies);
  };

  // Compile flat printable labels list
  const printableLabels: LabelItem[] = [];

  if (activeTab === 'CATALOGUE' && selectedProduct) {
    selectedProduct.variants.forEach((v) => {
      const qty = variantCopies[v.id] || 0;
      if (qty > 0) {
        for (let i = 0; i < qty; i++) {
          printableLabels.push({
            productName: selectedProduct.name,
            brand: selectedProduct.brand,
            size: v.size,
            color: v.color,
            sku: v.sku || selectedProduct.sku,
            barcode: v.barcode || selectedProduct.barcode,
            sellingPrice: v.sellingPrice ?? selectedProduct.sellingPrice,
            mrp: selectedProduct.mrp,
            gstRate: selectedProduct.gstRate,
            copies: 1,
          });
        }
      }
    });
  } else if (activeTab === 'CUSTOM') {
    const p = parseFloat(customPrice) || 0;
    const m = parseFloat(customMrp) || p;
    for (let i = 0; i < customCopies; i++) {
      printableLabels.push({
        productName: customTitle,
        brand: settings.shopName.split(' ')[0] || 'Aura',
        size: customSize,
        color: customColor,
        sku: customText,
        barcode: customText,
        sellingPrice: p,
        mrp: m,
        gstRate: 12,
        copies: 1,
      });
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const totalStickerCount = printableLabels.length;

  return (
    <div className="space-y-4 pb-10">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-amber-400" />
            <span>Garment Barcode Generator & Price Tag Label Printer</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Generate Code128 / EAN13 barcode tags for thermal printers (TSC, Zebra, TVS, Xprinter) & A4 sticker sheets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveTab('CATALOGUE')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeTab === 'CATALOGUE' ? 'bg-amber-400 text-black shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Inventory Catalogue Tags
            </button>
            <button
              onClick={() => setActiveTab('CUSTOM')}
              className={`px-3 py-1 rounded font-semibold transition-colors ${
                activeTab === 'CUSTOM' ? 'bg-amber-400 text-black shadow-xs' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Custom Barcode Tool
            </button>
          </div>

          <button
            onClick={handlePrint}
            disabled={totalStickerCount === 0}
            className={`flex items-center gap-1.5 px-4 py-2 font-bold rounded-lg text-xs transition-colors shadow-md ${
              totalStickerCount === 0
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-amber-500 hover:bg-amber-400 text-black'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Print {totalStickerCount} Labels</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN: Controls, Product Selector, Template Selection */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-4 text-xs">
          {activeTab === 'CATALOGUE' ? (
            <>
              {/* Product Select */}
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Select Garment / Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) - {p.totalStock} in stock
                    </option>
                  ))}
                </select>
              </div>

              {/* Variant Selector Table */}
              {selectedProduct && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-300">
                      Print Copies per Size & Color
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectAll(1)}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px]"
                      >
                        All 1x
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(5)}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[10px]"
                      >
                        All 5x
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAll(0)}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded text-[10px]"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="border border-zinc-800 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-zinc-950 text-zinc-400 text-[10px] uppercase border-b border-zinc-800 sticky top-0">
                        <tr>
                          <th className="py-2 px-2.5">Size/Color</th>
                          <th className="py-2 px-2.5">Barcode</th>
                          <th className="py-2 px-2.5 w-20 text-center">Print Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-sans">
                        {selectedProduct.variants.map((v) => (
                          <tr key={v.id} className="hover:bg-zinc-800/30">
                            <td className="py-1.5 px-2.5">
                              <span className="font-bold text-amber-400">{v.size}</span>
                              <span className="text-zinc-400"> / {v.color}</span>
                            </td>
                            <td className="py-1.5 px-2.5 font-mono text-[11px] text-zinc-400">
                              {v.barcode}
                            </td>
                            <td className="py-1.5 px-2.5 text-center">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={variantCopies[v.id] ?? 0}
                                onChange={(e) => handleCopyChange(v.id, parseInt(e.target.value) || 0)}
                                className="w-14 py-1 px-1.5 bg-zinc-950 border border-zinc-700 rounded text-center text-xs text-white font-bold"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* CUSTOM BARCODE GENERATOR INPUTS */
            <div className="space-y-3">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Barcode Value / Code128 *</label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="890123456789 or SKU"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Garment Article Title</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Italian Wool Suit Jacket"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Size</label>
                  <input
                    type="text"
                    value={customSize}
                    onChange={(e) => setCustomSize(e.target.value)}
                    placeholder="40 / L"
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Color</label>
                  <input
                    type="text"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    placeholder="Navy"
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 font-semibold mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={customMrp}
                    onChange={(e) => setCustomMrp(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1">Number of Labels to Print</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={customCopies}
                  onChange={(e) => setCustomCopies(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-bold"
                />
              </div>
            </div>
          )}

          {/* TEMPLATE FORMAT SELECTION */}
          <div className="pt-3 border-t border-zinc-800 space-y-2.5">
            <label className="block text-zinc-400 font-semibold">Label Size / Format</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: '50x25', label: '50mm x 25mm', sub: 'Standard Roll' },
                { id: '38x25', label: '38mm x 25mm', sub: 'Compact Tag' },
                { id: 'hangtag', label: '60mm x 40mm', sub: 'Garment Hangtag' },
                { id: 'a4_24', label: 'A4 Sheet (3x8)', sub: '24 per page' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id as LabelTemplate)}
                  className={`p-2 rounded-lg border text-left transition-colors ${
                    template === t.id
                      ? 'bg-zinc-800 border-amber-400 text-white'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs">{t.label}</div>
                  <div className="text-[10px] text-zinc-500">{t.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* TOGGLES */}
          <div className="pt-3 border-t border-zinc-800 space-y-2">
            <span className="block text-zinc-400 font-semibold mb-1">Label Content Toggles</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={showShopName}
                  onChange={(e) => setShowShopName(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700"
                />
                <span>Store Name</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700"
                />
                <span>Selling Price</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={showMrp}
                  onChange={(e) => setShowMrp(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700"
                />
                <span>MRP Tag</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={showSizeColor}
                  onChange={(e) => setShowSizeColor(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700"
                />
                <span>Size & Color</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={showSku}
                  onChange={(e) => setShowSku(e.target.checked)}
                  className="rounded bg-zinc-950 border-zinc-700"
                />
                <span>Product SKU</span>
              </label>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Live Printable Preview Grid */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
            <div>
              <h3 className="font-bold text-sm text-white">Live Print Preview & Label Sheet</h3>
              <p className="text-xs text-zinc-400">
                {totalStickerCount} label{totalStickerCount !== 1 ? 's' : ''} queued for printing
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 font-mono">
                Format: {template.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Printable Labels Container */}
          <div className="flex-1 overflow-y-auto p-4 bg-zinc-950/70 border border-zinc-800/80 rounded-xl min-h-[460px] flex justify-center">
            {totalStickerCount === 0 ? (
              <div className="m-auto text-center text-zinc-500 text-xs py-16">
                <ScanBarcode className="w-12 h-12 text-zinc-700 mx-auto mb-2 stroke-1" />
                <p className="font-medium text-zinc-400">No labels selected to print</p>
                <p className="text-[11px] text-zinc-600 mt-0.5">
                  Set print copies on the left to preview your garment tags
                </p>
              </div>
            ) : (
              <div
                id="printable-barcode-sheet"
                className={`p-4 bg-white text-black font-sans transition-all flex flex-wrap gap-3 items-start justify-center shadow-lg ${
                  template === 'a4_24' ? 'w-[794px] min-h-[1123px] grid grid-cols-3 gap-2 content-start' : 'max-w-2xl'
                }`}
              >
                {printableLabels.map((item, idx) => {
                  // Render based on template size
                  if (template === 'hangtag') {
                    return (
                      <div
                        key={idx}
                        className="barcode-label-card w-[220px] h-[150px] border border-black p-2.5 rounded-sm bg-white flex flex-col justify-between text-black text-center leading-tight shadow-xs"
                      >
                        {showShopName && (
                          <div className="border-b border-black pb-1">
                            <div className="font-extrabold text-[11px] uppercase tracking-wider">{settings.shopName}</div>
                            <div className="text-[8px] text-zinc-700 tracking-tight">{settings.tagline}</div>
                          </div>
                        )}

                        <div className="py-1">
                          <div className="font-bold text-[11px] truncate">{item.productName}</div>
                          {showSizeColor && (
                            <div className="text-[10px] font-semibold text-zinc-800 mt-0.5">
                              SIZE: <span className="font-black text-black">{item.size}</span> · CLR: {item.color}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-center py-0.5">
                          <BarcodeRenderer
                            value={item.barcode}
                            width={1.2}
                            height={28}
                            fontSize={9}
                            margin={0}
                          />
                        </div>

                        <div className="pt-1 border-t border-black flex items-center justify-between text-[10px]">
                          {showSku && <span className="font-mono text-[9px] text-zinc-600">{item.sku}</span>}
                          <div className="flex items-center gap-1.5 ml-auto">
                            {showMrp && item.mrp > item.sellingPrice && (
                              <span className="line-through text-zinc-500 text-[9px]">
                                ₹{item.mrp}
                              </span>
                            )}
                            {showPrice && (
                              <span className="font-black text-xs text-black">
                                ₹{item.sellingPrice}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (template === '38x25') {
                    return (
                      <div
                        key={idx}
                        className="barcode-label-card w-[150px] h-[95px] border border-black p-1.5 rounded-xs bg-white flex flex-col justify-between text-black text-center leading-none"
                      >
                        {showShopName && (
                          <div className="font-black text-[9px] uppercase truncate">{settings.shopName}</div>
                        )}
                        <div className="text-[9px] font-semibold truncate">{item.productName}</div>
                        {showSizeColor && (
                          <div className="text-[8px] text-zinc-800">
                            {item.size} / {item.color}
                          </div>
                        )}
                        <div className="flex justify-center">
                          <BarcodeRenderer
                            value={item.barcode}
                            width={1.0}
                            height={22}
                            fontSize={8}
                            margin={0}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold border-t border-zinc-300 pt-0.5">
                          <span>₹{item.sellingPrice}</span>
                          <span className="text-[7px] text-zinc-500 font-normal">Incl. GST</span>
                        </div>
                      </div>
                    );
                  }

                  // Default 50mm x 25mm or A4 24-up
                  return (
                    <div
                      key={idx}
                      className="barcode-label-card w-[190px] h-[105px] border border-black p-2 rounded-xs bg-white flex flex-col justify-between text-black text-center leading-none shadow-xs"
                    >
                      {showShopName && (
                        <div className="font-extrabold text-[10px] uppercase truncate tracking-tight">
                          {settings.shopName}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-[9px] mt-0.5">
                        <span className="font-bold truncate max-w-[110px]">{item.productName}</span>
                        {showSizeColor && (
                          <span className="font-black border border-black px-1 rounded-xs">
                            {item.size}
                          </span>
                        )}
                      </div>

                      <div className="flex justify-center my-0.5">
                        <BarcodeRenderer
                          value={item.barcode}
                          width={1.1}
                          height={26}
                          fontSize={8.5}
                          margin={0}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] border-t border-zinc-400 pt-1">
                        {showSku && <span className="font-mono text-[8px] text-zinc-600 truncate">{item.sku}</span>}
                        <div className="flex items-center gap-1 font-bold">
                          {showMrp && item.mrp > item.sellingPrice && (
                            <span className="line-through text-zinc-500 text-[8px]">
                              ₹{item.mrp}
                            </span>
                          )}
                          {showPrice && (
                            <span className="text-black font-black text-[11px]">
                              ₹{item.sellingPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Barcode Print Stylesheet */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                #printable-barcode-sheet, #printable-barcode-sheet * {
                  visibility: visible;
                }
                #printable-barcode-sheet {
                  position: absolute;
                  left: 0;
                  top: 0;
                  margin: 0;
                  padding: 2mm;
                  box-shadow: none !important;
                }
                .barcode-label-card {
                  page-break-inside: avoid;
                }
              }
            `
          }} />

          {/* Footer Action */}
          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs mt-3">
            <span className="text-zinc-400">
              Compatible with all standard direct thermal sticker rolls and label sheets
            </span>
            <button
              onClick={handlePrint}
              disabled={totalStickerCount === 0}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print {totalStickerCount} Barcode Labels</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
