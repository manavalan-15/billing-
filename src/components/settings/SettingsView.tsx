import React, { useState } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Download,
  Upload,
  Printer,
  Building,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ShopSettings } from '../../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetAllData, exportDatabaseJSON, importDatabaseJSON } = useApp();

  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);

  const handleChange = (field: keyof ShopSettings, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aura_Menswear_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    if (!importText.trim()) return;
    const ok = importDatabaseJSON(importText);
    if (ok) {
      alert('Database restored successfully from backup JSON.');
      setShowImportModal(false);
      setImportText('');
    } else {
      alert('Invalid JSON backup file structure.');
    }
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to restore initial demo data? All new sales and modifications will be reset.')) {
      resetAllData();
      setFormData({ ...settings });
    }
  };

  return (
    <div className="space-y-4 pb-6 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Store Configuration & Hardware Settings</h2>
          <p className="text-xs text-zinc-400">
            Showroom details, GSTIN, thermal printer preferences and automated backup
          </p>
        </div>

        {saveFeedback && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* SECTION 1: Store & GST Identity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Building className="w-4 h-4 text-amber-400" />
            <span>Store Profile & Tax Identity</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Shop / Showroom Name</label>
              <input
                type="text"
                required
                value={formData.shopName}
                onChange={(e) => handleChange('shopName', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Brand Tagline</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">GSTIN Number</label>
              <input
                type="text"
                required
                value={formData.gstin}
                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Showroom Phone</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-zinc-400 font-semibold mb-1">Showroom Address</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">City</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">State & PIN Code</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
                />
                <input
                  type="text"
                  required
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: Billing & Thermal Receipt Settings */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Billing, Invoice Prefix & Thermal Printer Hardware</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Invoice Number Prefix</label>
              <input
                type="text"
                required
                value={formData.invoicePrefix}
                onChange={(e) => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                placeholder="AURA-26-"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Thermal Receipt Width</label>
              <select
                value={formData.thermalWidth}
                onChange={(e) => handleChange('thermalWidth', e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
              >
                <option value="80mm">80mm (Standard Desktop POS)</option>
                <option value="58mm">58mm (Handheld / Compact)</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Default GST Rate (%)</label>
              <select
                value={formData.defaultGstRate}
                onChange={(e) => handleChange('defaultGstRate', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white"
              >
                <option value={12}>12% (Standard Menswear)</option>
                <option value={5}>5% (Apparel &lt; ₹1000)</option>
                <option value={18}>18% (Leather / Suits)</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-zinc-400 font-semibold mb-1">Receipt Footer Exchange Policy Note</label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => handleChange('receiptFooter', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Customer Loyalty Program */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 text-xs">
          <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Gentlemen's Club Loyalty Program</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Loyalty Points Earn Rate</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={formData.loyaltyEarnRate}
                  onChange={(e) => handleChange('loyaltyEarnRate', parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
                />
                <span className="text-zinc-400">Point(s) per ₹100 spent</span>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 font-semibold mb-1">Point Redemption Value (₹)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={formData.loyaltyRedeemValue}
                  onChange={(e) => handleChange('loyaltyRedeemValue', parseInt(e.target.value) || 1)}
                  className="w-24 px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white font-mono"
                />
                <span className="text-zinc-400">Rupee discount per 1 loyalty point</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Preferences</span>
          </button>
        </div>
      </form>

      {/* SECTION 4: Database Backup, Restore & Reset */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 text-xs">
        <h3 className="font-bold text-sm text-white flex items-center gap-2 border-b border-zinc-800 pb-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Data Backup, Portability & System Reset</span>
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="font-semibold text-white">Full JSON Database Backup</div>
            <div className="text-zinc-500">
              Export products, variants, sales history, customer records, and audit logs.
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg font-semibold transition-colors"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download Backup JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg font-semibold transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Restore from Backup</span>
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="font-semibold text-red-400">Restore Factory Initial Dataset</div>
            <div className="text-zinc-500">
              Resets all inventory, sample bills, and demo users to clean starting values.
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800 rounded-lg font-semibold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Database</span>
          </button>
        </div>
      </div>

      {/* IMPORT BACKUP MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-zinc-100 p-5 space-y-4">
            <h3 className="font-bold text-sm text-white">Restore System Backup</h3>
            <p className="text-xs text-zinc-400">
              Paste the JSON backup content below to restore all products, customers, and sales:
            </p>
            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste JSON content here..."
              className="w-full p-3 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-mono text-zinc-200"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs"
              >
                Restore Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
