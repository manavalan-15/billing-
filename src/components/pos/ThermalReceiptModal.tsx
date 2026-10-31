import React, { useRef } from 'react';
import { Printer, Download, Share2, X, CheckCircle, Tag } from 'lucide-react';
import { Sale, ShopSettings } from '../../types';
import { formatCurrency, formatDateTime, generateInvoicePDF, createWhatsAppShareUrl } from '../../utils/formatters';
import { BarcodeRenderer } from '../common/BarcodeRenderer';

interface ThermalReceiptModalProps {
  sale: Sale;
  settings: ShopSettings;
  onClose: () => void;
  onNewBill: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  sale,
  settings,
  onClose,
  onNewBill,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [thermalFormat, setThermalFormat] = React.useState<'58mm' | '80mm'>(settings.thermalWidth || '80mm');

  const handlePrint = () => {
    window.print();
  };

  const handlePDFDownload = () => {
    generateInvoicePDF(sale, settings);
  };

  const handleWhatsApp = () => {
    const url = createWhatsAppShareUrl(sale, settings);
    window.open(url, '_blank');
  };

  const cgst = sale.totalGst / 2;
  const sgst = sale.totalGst / 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header Actions */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-semibold text-zinc-100 text-sm">Invoice #{sale.invoiceNumber}</h3>
              <p className="text-xs text-zinc-400">Order successfully completed</p>
            </div>
          </div>

          {/* Thermal Format Selector */}
          <div className="flex items-center gap-1 bg-zinc-800 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setThermalFormat('80mm')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                thermalFormat === '80mm' ? 'bg-zinc-700 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              80mm (Standard)
            </button>
            <button
              onClick={() => setThermalFormat('58mm')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                thermalFormat === '58mm' ? 'bg-zinc-700 text-white shadow-xs' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              58mm (Compact)
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Preview Body */}
        <div className="flex-1 overflow-y-auto p-4 flex justify-center bg-zinc-950/70">
          <div
            ref={receiptRef}
            id="printable-thermal-receipt"
            className={`bg-white text-black font-mono shadow-md text-xs leading-tight rounded-sm p-4 transition-all duration-200 ${
              thermalFormat === '58mm' ? 'w-[280px] text-[11px]' : 'w-[360px] text-[12px]'
            }`}
          >
            {/* Store Branding */}
            <div className="text-center pb-2 border-b border-dashed border-zinc-400">
              <div className="font-extrabold text-sm tracking-wider uppercase">{settings.shopName}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{settings.tagline}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">
                {settings.address}, {settings.city}
              </div>
              <div className="text-[10px] text-zinc-600">Ph: {settings.phone}</div>
              <div className="text-[10px] font-semibold mt-1">GSTIN: {settings.gstin}</div>
            </div>

            {/* Invoice Meta */}
            <div className="py-2 border-b border-dashed border-zinc-400 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>INVOICE:</span>
                <span className="font-bold">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{formatDateTime(sale.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>CUSTOMER:</span>
                <span className="font-medium truncate max-w-[170px]">{sale.customerName}</span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between">
                  <span>PHONE:</span>
                  <span>{sale.customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CASHIER:</span>
                <span>{sale.cashierName}</span>
              </div>
            </div>

            {/* Items Header */}
            <div className="pt-2 pb-1 border-b border-dashed border-zinc-400 font-bold text-[11px]">
              <div className="flex justify-between">
                <span className="flex-1">ITEM (SIZE/CLR)</span>
                <span className="w-10 text-center">QTY</span>
                <span className="w-14 text-right">RATE</span>
                <span className="w-16 text-right">AMT</span>
              </div>
            </div>

            {/* Item Rows */}
            <div className="py-1 divide-y divide-dashed divide-zinc-200">
              {sale.items.map((item, idx) => (
                <div key={idx} className="py-1.5 text-[11px]">
                  <div className="font-semibold leading-none">{item.productName}</div>
                  <div className="flex justify-between text-zinc-600 text-[10px] mt-0.5">
                    <span className="flex-1">
                      {item.size} / {item.color} {item.itemDiscountPercent > 0 ? `(-${item.itemDiscountPercent}%)` : ''}
                    </span>
                    <span className="w-10 text-center">{item.quantity}</span>
                    <span className="w-14 text-right">{item.unitPrice.toFixed(0)}</span>
                    <span className="w-16 text-right font-medium text-black">{item.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-2 border-t border-dashed border-zinc-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal ({sale.items.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span>₹{sale.subtotal.toFixed(2)}</span>
              </div>

              {(sale.itemDiscountTotal > 0 || sale.billDiscountAmount > 0) && (
                <div className="flex justify-between text-emerald-800">
                  <span>Total Discount:</span>
                  <span>-₹{(sale.itemDiscountTotal + sale.billDiscountAmount).toFixed(2)}</span>
                </div>
              )}

              {sale.loyaltyDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-800">
                  <span>Loyalty Redeemed:</span>
                  <span>-₹{sale.loyaltyDiscountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-zinc-600">
                <span>Taxable Value:</span>
                <span>₹{sale.taxableTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-zinc-600">
                <span>CGST:</span>
                <span>₹{cgst.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-zinc-600">
                <span>SGST:</span>
                <span>₹{sgst.toFixed(2)}</span>
              </div>

              {sale.roundOff !== 0 && (
                <div className="flex justify-between text-zinc-500">
                  <span>Round Off:</span>
                  <span>{sale.roundOff > 0 ? `+₹${sale.roundOff}` : `-₹${Math.abs(sale.roundOff)}`}</span>
                </div>
              )}

              {/* Grand Total Bar */}
              <div className="flex justify-between items-center text-sm font-extrabold border-y-2 border-dashed border-black py-1.5 mt-1">
                <span>NET PAYABLE:</span>
                <span>₹{sale.grandTotal.toFixed(2)}</span>
              </div>

              {/* Payment Details */}
              <div className="pt-1 text-[10px] space-y-0.5 text-zinc-700">
                <div className="flex justify-between">
                  <span>Payment Mode:</span>
                  <span className="font-bold">{sale.paymentMethod.toUpperCase()}</span>
                </div>
                {sale.paymentMethod === 'Cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>Cash Tendered:</span>
                      <span>₹{sale.amountReceived.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Change Due:</span>
                      <span>₹{sale.changeReturned.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {sale.paymentMethod === 'Split' && sale.splitDetails && (
                  <div className="space-y-0.5 text-zinc-600">
                    {sale.splitDetails.cash > 0 && <div>• Cash: ₹{sale.splitDetails.cash}</div>}
                    {sale.splitDetails.upi > 0 && <div>• UPI: ₹{sale.splitDetails.upi}</div>}
                    {sale.splitDetails.card > 0 && <div>• Card: ₹{sale.splitDetails.card}</div>}
                  </div>
                )}
                {sale.loyaltyPointsEarned > 0 && (
                  <div className="flex justify-between text-zinc-800 font-semibold pt-1">
                    <span>Loyalty Points Earned:</span>
                    <span>+{sale.loyaltyPointsEarned} pts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Barcode & Footer */}
            <div className="mt-4 pt-3 border-t border-dashed border-zinc-400 text-center flex flex-col items-center">
              <BarcodeRenderer
                value={sale.invoiceNumber}
                format="CODE128"
                width={thermalFormat === '58mm' ? 1.2 : 1.5}
                height={32}
                fontSize={10}
                margin={1}
                className="max-w-full"
              />
              <div className="text-[9px] text-zinc-500 mt-2 leading-relaxed text-center">
                {settings.receiptFooter}
              </div>
              <div className="text-[8px] text-zinc-400 mt-1 uppercase">Powered by Aura Menswear POS</div>
            </div>
          </div>
        </div>

        {/* Print Stylesheet injection specifically for the thermal receipt */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-thermal-receipt, #printable-thermal-receipt * {
                visibility: visible;
              }
              #printable-thermal-receipt {
                position: absolute;
                left: 0;
                top: 0;
                width: ${thermalFormat === '58mm' ? '58mm' : '80mm'};
                margin: 0;
                padding: 4mm;
                box-shadow: none !important;
              }
            }
          `
        }} />

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-medium rounded-lg text-xs transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Receipt
            </button>
            <button
              onClick={handlePDFDownload}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg text-xs transition-colors border border-zinc-700"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>
            <button
              onClick={handleWhatsApp}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-medium rounded-lg text-xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp Bill
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onNewBill();
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-lg text-xs transition-colors"
          >
            Start New Bill (F2)
          </button>
        </div>
      </div>
    </div>
  );
};
