import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeRendererProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  className?: string;
  lineColor?: string;
  background?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.5,
  height = 40,
  displayValue = true,
  fontSize = 11,
  margin = 2,
  className = '',
  lineColor = '#000000',
  background = 'transparent',
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      // If requested format is EAN13 but value is not 12-13 digits, fallback to CODE128
      let actualFormat = format;
      const cleanVal = String(value).trim();
      
      if (format === 'EAN13' && (!/^\d{12,13}$/.test(cleanVal))) {
        actualFormat = 'CODE128';
      }

      JsBarcode(svgRef.current, cleanVal, {
        format: actualFormat,
        width,
        height,
        displayValue,
        fontSize,
        font: 'monospace',
        margin,
        lineColor,
        background,
        textMargin: 2,
      });
    } catch (e) {
      console.warn('Barcode render error:', e);
      // Fallback try Code128 with clean value
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, String(value).trim(), {
            format: 'CODE128',
            width,
            height,
            displayValue,
            fontSize,
            margin,
            lineColor,
            background,
          });
        }
      } catch (err2) {
        console.error('Final barcode render fallback failed:', err2);
      }
    }
  }, [value, format, width, height, displayValue, fontSize, margin, lineColor, background]);

  return <svg ref={svgRef} className={`inline-block ${className}`} />;
};
