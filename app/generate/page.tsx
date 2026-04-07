'use client';

import { useState } from 'react';
import { TECHNICIANS, DEFAULT_PRICE } from '@/lib/constants';

export default function GeneratePage() {
  const [form, setForm] = useState({
    storeNumber: '',
    woNumber: '',
    invoiceNumber: '',
    price: DEFAULT_PRICE.toString(),
    serviceDate: new Date().toISOString().split('T')[0],
    technician: '',
    startTime: '21:00',
    stopTime: '03:00',
    address: '',
    city: '',
    state: '',
    zip: '',
    storePhone: '',
  });
  const [generating, setGenerating] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function generatePDF(type: 'invoice' | 'work-order' | 'both') {
    setGenerating(true);
    try {
      const { generateInvoicePDF } = await import('@/lib/pdf/invoice');
      const { generateWorkOrderPDF } = await import('@/lib/pdf/work-order');

      const invoiceData = {
        storeNumber: form.storeNumber,
        woNumber: form.woNumber,
        invoiceNumber: form.invoiceNumber,
        price: parseFloat(form.price) || DEFAULT_PRICE,
        serviceDate: form.serviceDate,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
      };

      const woData = {
        storeNumber: form.storeNumber,
        woNumber: form.woNumber,
        address: form.address,
        city: form.city,
        state: form.state,
        zip: form.zip,
        storePhone: form.storePhone,
        serviceDate: form.serviceDate,
        technician: form.technician,
        startTime: form.startTime,
        stopTime: form.stopTime,
      };

      if (type === 'invoice' || type === 'both') {
        const inv = generateInvoicePDF(invoiceData);
        inv.save(`Invoice_${form.storeNumber}_${form.invoiceNumber || 'draft'}.pdf`);
      }
      if (type === 'work-order' || type === 'both') {
        const wo = generateWorkOrderPDF(woData);
        wo.save(`WO_${form.storeNumber}_${form.woNumber || 'draft'}.pdf`);
      }
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Failed to generate PDF. Check console for details.');
    }
    setGenerating(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Generate Documents</h1>
        <p className="text-gray-400 text-sm mt-1">Create Invoice and Work Order PDFs</p>
      </div>

      <div className="bg-[#111827] rounded-lg border border-[#1f2937] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Store #" value={form.storeNumber} onChange={(v) => update('storeNumber', v)} placeholder="00806" />
          <Field label="WO #" value={form.woNumber} onChange={(v) => update('woNumber', v)} placeholder="WO number" />
          <Field label="Invoice #" value={form.invoiceNumber} onChange={(v) => update('invoiceNumber', v)} placeholder="INV-001" />
          <Field label="Price ($)" value={form.price} onChange={(v) => update('price', v)} type="number" />
          <Field label="Service Date" value={form.serviceDate} onChange={(v) => update('serviceDate', v)} type="date" />
          <div>
            <label className="block text-sm text-gray-400 mb-1">Technician</label>
            <select
              value={form.technician}
              onChange={(e) => update('technician', e.target.value)}
              className="w-full bg-[#0a0f1a] border border-[#374151] rounded px-3 py-2 text-sm text-gray-100 focus:border-[#00A4C7] focus:outline-none"
            >
              <option value="">Select technician...</option>
              {TECHNICIANS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <Field label="Start Time" value={form.startTime} onChange={(v) => update('startTime', v)} type="time" />
          <Field label="Stop Time" value={form.stopTime} onChange={(v) => update('stopTime', v)} type="time" />
          <Field label="Address" value={form.address} onChange={(v) => update('address', v)} placeholder="301 Greenwich Ave" />
          <Field label="City" value={form.city} onChange={(v) => update('city', v)} placeholder="Greenwich" />
          <Field label="State" value={form.state} onChange={(v) => update('state', v)} placeholder="CT" />
          <Field label="Zip" value={form.zip} onChange={(v) => update('zip', v)} placeholder="06830" />
          <Field label="Store Phone" value={form.storePhone} onChange={(v) => update('storePhone', v)} placeholder="(203) 555-0100" />
        </div>

        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-[#1f2937]">
          <button
            onClick={() => generatePDF('invoice')}
            disabled={generating}
            className="px-5 py-2.5 bg-[#00A4C7] text-white rounded text-sm font-medium hover:bg-[#0090b0] transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Download Invoice PDF'}
          </button>
          <button
            onClick={() => generatePDF('work-order')}
            disabled={generating}
            className="px-5 py-2.5 bg-[#00A4C7] text-white rounded text-sm font-medium hover:bg-[#0090b0] transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Download Work Order PDF'}
          </button>
          <button
            onClick={() => generatePDF('both')}
            disabled={generating}
            className="px-5 py-2.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Download Both'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0a0f1a] border border-[#374151] rounded px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:border-[#00A4C7] focus:outline-none"
      />
    </div>
  );
}
