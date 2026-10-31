import { jsPDF } from 'jspdf';
import { CartItem, Customer, Product, Sale, ShopSettings } from '../types';

export const formatCurrency = (amount: number, symbol = '₹'): string => {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return `${symbol} ${rounded.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const calculateItemPricing = (
  unitPrice: number,
  quantity: number,
  discountPercent: number,
  gstRate: number,
  taxInclusive: boolean = true
) => {
  const grossTotal = unitPrice * quantity;
  const discountAmount = (grossTotal * discountPercent) / 100;
  const discountedTotal = grossTotal - discountAmount;

  let taxableAmount = 0;
  let gstAmount = 0;
  let totalAmount = 0;

  if (taxInclusive) {
    taxableAmount = discountedTotal / (1 + gstRate / 100);
    gstAmount = discountedTotal - taxableAmount;
    totalAmount = discountedTotal;
  } else {
    taxableAmount = discountedTotal;
    gstAmount = (taxableAmount * gstRate) / 100;
    totalAmount = taxableAmount + gstAmount;
  }

  return {
    grossTotal,
    discountAmount,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    gstAmount: Math.round(gstAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
};

export const generateNextInvoiceNumber = (prefix: string, salesCount: number): string => {
  const sequence = String(salesCount + 101).padStart(5, '0');
  return `${prefix}${sequence}`;
};

export const downloadCSV = (filename: string, rows: (string | number)[][]) => {
  const processRow = (row: (string | number)[]) =>
    row
      .map((val) => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(',');

  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(processRow).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateInvoicePDF = (sale: Sale, settings: ShopSettings) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.shopName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(settings.tagline, pageWidth / 2, y, { align: 'center' });
  
  y += 5;
  doc.text(`${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}`, pageWidth / 2, y, { align: 'center' });
  
  y += 4.5;
  doc.text(`Phone: ${settings.phone} | GSTIN: ${settings.gstin}`, pageWidth / 2, y, { align: 'center' });

  // Divider
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, pageWidth - 14, y);

  // Invoice & Customer Info Box
  y += 7;
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`TAX INVOICE: ${sale.invoiceNumber}`, 14, y);
  doc.text(`DATE: ${formatDateTime(sale.date)}`, pageWidth - 14, y, { align: 'right' });

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Billed To: ${sale.customerName || 'Walk-in Customer'}`, 14, y);
  if (sale.customerPhone) {
    doc.text(`Phone: ${sale.customerPhone}`, 14, y + 4.5);
  }
  doc.text(`Cashier: ${sale.cashierName} | Payment: ${sale.paymentMethod}`, pageWidth - 14, y, { align: 'right' });

  // Items Table Header
  y += 12;
  doc.setFillColor(245, 245, 245);
  doc.rect(14, y - 4, pageWidth - 28, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 30, 30);
  doc.text('ITEM DESCRIPTION', 16, y);
  doc.text('SIZE/COLOR', 80, y);
  doc.text('QTY', 115, y, { align: 'center' });
  doc.text('RATE', 135, y, { align: 'right' });
  doc.text('DISC%', 155, y, { align: 'right' });
  doc.text('GST%', 170, y, { align: 'right' });
  doc.text('AMOUNT', pageWidth - 16, y, { align: 'right' });

  // Items Rows
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(40, 40, 40);

  sale.items.forEach((item, index) => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    const nameLine = `${index + 1}. ${item.productName}`;
    doc.text(nameLine.length > 38 ? nameLine.substring(0, 36) + '...' : nameLine, 16, y);
    doc.text(`${item.size} / ${item.color}`, 80, y);
    doc.text(String(item.quantity), 115, y, { align: 'center' });
    doc.text(item.unitPrice.toFixed(2), 135, y, { align: 'right' });
    doc.text(`${item.itemDiscountPercent}%`, 155, y, { align: 'right' });
    doc.text(`${item.gstRate}%`, 170, y, { align: 'right' });
    doc.text(item.totalAmount.toFixed(2), pageWidth - 16, y, { align: 'right' });
    y += 5.5;
  });

  // Totals Line
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(14, y, pageWidth - 14, y);
  y += 6;

  // Tax Breakdown & Grand Total
  const cgst = sale.totalGst / 2;
  const sgst = sale.totalGst / 2;

  const rightX = pageWidth - 16;
  const labelX = pageWidth - 65;

  doc.setFontSize(8.5);
  doc.text('Subtotal:', labelX, y);
  doc.text(sale.subtotal.toFixed(2), rightX, y, { align: 'right' });
  y += 4.5;

  if (sale.itemDiscountTotal > 0 || sale.billDiscountAmount > 0) {
    doc.text('Total Discount:', labelX, y);
    doc.text(`-${(sale.itemDiscountTotal + sale.billDiscountAmount).toFixed(2)}`, rightX, y, { align: 'right' });
    y += 4.5;
  }

  doc.text('Taxable Amount:', labelX, y);
  doc.text(sale.taxableTotal.toFixed(2), rightX, y, { align: 'right' });
  y += 4.5;

  doc.text('CGST:', labelX, y);
  doc.text(cgst.toFixed(2), rightX, y, { align: 'right' });
  y += 4.5;

  doc.text('SGST:', labelX, y);
  doc.text(sgst.toFixed(2), rightX, y, { align: 'right' });
  y += 4.5;

  if (sale.loyaltyDiscountAmount > 0) {
    doc.text('Loyalty Redeemed:', labelX, y);
    doc.text(`-${sale.loyaltyDiscountAmount.toFixed(2)}`, rightX, y, { align: 'right' });
    y += 4.5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GRAND TOTAL:', labelX, y + 2);
  doc.text(`${settings.currencySymbol} ${sale.grandTotal.toFixed(2)}`, rightX, y + 2, { align: 'right' });

  // Footer notes & terms
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text(settings.receiptFooter, pageWidth / 2, y, { align: 'center', maxWidth: 160 });

  doc.save(`${sale.invoiceNumber}.pdf`);
};

export const createWhatsAppShareUrl = (sale: Sale, settings: ShopSettings): string => {
  const phone = sale.customerPhone ? sale.customerPhone.replace(/[^0-9]/g, '') : '';
  const message = `*${settings.shopName}*\n` +
    `Tax Invoice: ${sale.invoiceNumber}\n` +
    `Date: ${formatDate(sale.date)}\n` +
    `Dear ${sale.customerName || 'Valued Customer'},\n` +
    `Thank you for shopping with us! Here is your bill summary:\n\n` +
    sale.items.map(i => `• ${i.productName} (${i.size}/${i.color}) x ${i.quantity} = ₹${i.totalAmount.toFixed(0)}`).join('\n') +
    `\n\n*Total Amount:* ₹${sale.grandTotal}\n` +
    `*Payment:* ${sale.paymentMethod}\n` +
    (sale.loyaltyPointsEarned > 0 ? `*Loyalty Points Earned:* ${sale.loyaltyPointsEarned}\n` : '') +
    `\n${settings.receiptFooter}`;

  const cleanPhone = phone.startsWith('91') ? phone : `91${phone}`;
  return `https://wa.me/${phone ? cleanPhone : ''}?text=${encodeURIComponent(message)}`;
};
