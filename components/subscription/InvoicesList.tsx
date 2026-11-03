// ============================================================================
// 🧾 MES FACTURES — côté client (entreprise)
// Fichier: frontend/components/subscription/InvoicesList.tsx
// À afficher dans app/(dashboard)/parametres/subscription/page.tsx,
// juste sous le bloc « Historique des paiements » :   <InvoicesList />
// ============================================================================

'use client';

import React, { useEffect, useState } from 'react';
import { FileText, Download, Mail, Loader2 } from 'lucide-react';
import { api } from '@/services/api';

interface InvoiceRow {
  id: string;
  number: string;
  issuedAt: string;
  total: number;
  currency: string;
  emailSentAt?: string | null;
}

export function InvoicesList() {
  const [invoices, setInvoices] = useState<InvoiceRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api.get<{ invoices: InvoiceRow[] }>('/subscriptions/invoices')
      .then((r) => setInvoices(r.invoices))
      .catch(() => setInvoices([]));
  }, []);

  const download = async (inv: InvoiceRow) => {
    setBusy(`d${inv.id}`); setNotice(null);
    try {
      const blob = await api.getBlob(`/subscriptions/invoices/${inv.id}/pdf`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `${inv.number}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setNotice({ ok: false, text: e.message || 'Téléchargement impossible' });
    } finally { setBusy(null); }
  };

  const resend = async (inv: InvoiceRow) => {
    setBusy(`r${inv.id}`); setNotice(null);
    try {
      await api.post(`/subscriptions/invoices/${inv.id}/resend`, {});
      setNotice({ ok: true, text: `La facture ${inv.number} vous a été renvoyée par email.` });
    } catch (e: any) {
      setNotice({ ok: false, text: e.message || "Envoi impossible" });
    } finally { setBusy(null); }
  };

  if (invoices === null || invoices.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <FileText size={13} className="text-gray-400" />
        <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mes factures</h2>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
          {invoices.length}
        </span>
      </div>

      {notice && (
        <p className={`mb-3 text-xs rounded-xl px-3 py-2 border ${
          notice.ok
            ? 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20'
            : 'text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
        }`}>{notice.text}</p>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {invoices.map((inv, i) => (
          <div key={inv.id}
            className={`flex items-center gap-4 px-5 py-4 ${i !== invoices.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 dark:bg-emerald-900/30">
              <FileText size={14} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-white font-mono">{inv.number}</p>
              <p className="text-[11px] text-gray-400">
                {new Date(inv.issuedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className="font-bold text-sm text-gray-900 dark:text-white font-mono whitespace-nowrap hidden sm:block">
              {inv.total.toLocaleString('fr-FR')} {inv.currency}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => download(inv)} disabled={busy !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">
                {busy === `d${inv.id}` ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} PDF
              </button>
              <button onClick={() => resend(inv)} disabled={busy !== null} title="Renvoyer par email"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50">
                {busy === `r${inv.id}` ? <Loader2 size={12} className="animate-spin" /> : <Mail size={12} />} Email
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
