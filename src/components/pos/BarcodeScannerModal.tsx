import React, { useState } from 'react';
import { ScanBarcode, Camera, Search, X, Check, AlertCircle } from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { BarcodeRenderer } from '../common/BarcodeRenderer';

interface BarcodeScannerModalProps {
  products: Product[];
  onScan: (barcodeOrSku: string) => void;
  onClose: () => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  products,
  onScan,
  onClose,
}) => {
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Flatten variants with barcodes
  const sampleBarcodes: { product: Product; variant: ProductVariant }[] = [];
  products.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.barcode && sampleBarcodes.length < 12) {
        sampleBarcodes.push({ product: p, variant: v });
      }
    });
  });

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCode.trim()) return;

    onScan(manualCode.trim());
    setFeedback(`Scanned code: ${manualCode.trim()}`);
    setManualCode('');
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleQuickScan = (code: string) => {
    onScan(code);
    setFeedback(`Scanned: ${code}`);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanBarcode className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Barcode & SKU Scanner</h3>
              <p className="text-xs text-zinc-400">Scan product label or select from quick list</p>
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
          {/* Animated Scanner Viewfinder */}
          {cameraActive && (
            <div className="relative h-44 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-radial from-amber-500/5 to-transparent"></div>
              
              {/* Corner brackets */}
              <div className="absolute top-4 left-6 w-6 h-6 border-t-2 border-l-2 border-amber-400"></div>
              <div className="absolute top-4 right-6 w-6 h-6 border-t-2 border-r-2 border-amber-400"></div>
              <div className="absolute bottom-4 left-6 w-6 h-6 border-b-2 border-l-2 border-amber-400"></div>
              <div className="absolute bottom-4 right-6 w-6 h-6 border-b-2 border-r-2 border-amber-400"></div>

              {/* Animated laser line */}
              <div className="w-3/4 h-0.5 bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.9)] animate-pulse my-auto"></div>

              <div className="absolute bottom-3 text-[11px] text-zinc-400 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-zinc-400" />
                <span>Scanner Active · Point barcode at camera or type SKU below</span>
              </div>
            </div>
          )}

          {feedback && (
            <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Manual Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                autoFocus
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Type Barcode or SKU (e.g. 890123400101)..."
                className="w-full px-3 py-2 pl-9 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-amber-400 font-mono"
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs transition-colors"
            >
              Scan
            </button>
          </form>

          {/* Quick Clickable Product Barcodes */}
          <div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-2">
              Quick Barcode Tag Tester (Click to simulate scan)
            </div>
            <div className="grid grid-cols-2 gap-2.5 max-h-52 overflow-y-auto pr-1">
              {sampleBarcodes.map(({ product, variant }) => (
                <button
                  key={variant.id}
                  type="button"
                  onClick={() => handleQuickScan(variant.barcode)}
                  className="p-2 bg-zinc-950 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg text-left transition-colors flex flex-col justify-between group shadow-xs"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-xs text-zinc-200 truncate flex-1">{product.name}</span>
                    <span className="text-[10px] font-bold text-amber-400 font-mono ml-1">{variant.size}</span>
                  </div>
                  <div className="bg-white rounded px-2 py-1 my-1.5 flex justify-center">
                    <BarcodeRenderer
                      value={variant.barcode}
                      width={1.0}
                      height={20}
                      fontSize={8}
                      margin={0}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span>{variant.color}</span>
                    <span className="font-mono text-zinc-300 font-semibold">{variant.barcode}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
