'use client';

// ============================================================================
// app/(dashboard)/ma-paie/page.tsx
// ✅ Fix TypeScript : printBulletin wrappé dans une arrow function
// ✅ Fix A4 : width: '210mm' fixe (pas maxWidth: 210mm + width: 100%)
// ✅ Fix impression : pas de position:fixed dans @media print
// ✅ Fix modal : printBulletin reçoit le bon id selon templateId
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Download, Calendar, Loader2,
  ArrowLeft, Eye, Clock, X, Printer,
} from 'lucide-react';
import { api } from '@/services/api';
import BulletinDisplay from '@/components/BulletinDisplay';
import { printBulletin, downloadBulletinPDF, getBulletinRootId } from '@/lib/bulletin-print';

export default function MyPayrollsPage() {
  const router = useRouter();
  const [payrolls, setPayrolls]     = useState<any[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [employee, setEmployee]     = useState<any>(null);
  const [viewing, setViewing]       = useState<any | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get<any>('/employees/me');
        if (!me?.id) { setIsLoading(false); return; }
        setEmployee(me);
        const data = await api.get<any[]>('/payrolls');
        setPayrolls(data);
      } catch (e: any) {
        console.error('Erreur chargement bulletins:', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const fmtMoney = (v: number) => (v ?? 0).toLocaleString('fr-FR');
  const fmtMonth = (m: number) => new Date(0, m - 1).toLocaleString('fr-FR', { month: 'long' });

  const currentYear         = new Date().getFullYear();
  const currentYearPayrolls = payrolls.filter(p => p.year === currentYear);
  const yearTotal           = currentYearPayrolls.reduce((s, p) => s + Number(p.netSalary || 0), 0);

  // ── Id du bulletin actif (dépend du template de l'entreprise) ─────────────
  const activeBulletinId = getBulletinRootId(viewing?.company?.bulletinTemplateId ?? 'default');

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={20} className="text-[var(--text-muted)]" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Mes Bulletins de Paie</h1>
          <p className="text-[var(--text-muted)]">Consultez et téléchargez vos fiches de paie.</p>
        </div>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-emerald-500" size={48} />
        </div>

      ) : payrolls.length === 0 ? (
        <div className="bg-[var(--surface)] rounded-2xl p-10 text-center border border-[var(--border)] shadow-sm">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
            <Clock size={32} />
          </div>
          <h3 className="text-xl font-bold text-[var(--text)] mb-2">Aucun bulletin disponible</h3>
          <p className="text-[var(--text-muted)] max-w-md mx-auto mb-4">
            Vos bulletins de paie apparaîtront ici une fois validés et payés par votre service RH.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-lg text-sm text-emerald-500 border border-emerald-500/20">
            <FileText size={16} />
            <span>Seuls les bulletins avec statut "Payé" sont visibles ici</span>
          </div>
        </div>

      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm text-[var(--text-muted)] font-medium">Bulletins disponibles</p>
              </div>
              <p className="text-3xl font-bold text-[var(--text)]">{payrolls.length}</p>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm text-[var(--text-muted)] font-medium">Dernier bulletin</p>
              </div>
              <p className="text-lg font-bold text-[var(--text)] capitalize">
                {fmtMonth(payrolls[0].month)} {payrolls[0].year}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{fmtMoney(payrolls[0].netSalary)} F net</p>
            </div>

            <div className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Download size={20} className="text-amber-500" />
                </div>
                <p className="text-sm text-[var(--text-muted)] font-medium">Total {currentYear}</p>
              </div>
              <p className="text-2xl font-bold text-[var(--text)]">{fmtMoney(yearTotal)} F</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{currentYearPayrolls.length} bulletin(s)</p>
            </div>
          </div>

          {/* Grille bulletins */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...payrolls]
              .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
              .map((payroll) => (
                <div
                  key={payroll.id}
                  className="group bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-6 shadow-sm hover:shadow-lg transition-colors relative overflow-hidden cursor-pointer"
                  onClick={() => setViewing(payroll)}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-6 -mt-6 group-hover:scale-150 transition-transform" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                        {new Date(0, payroll.month - 1).toLocaleString('fr-FR', { month: 'short' })}
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-bold border bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                        ✓ PAYÉ
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text)] mb-1 capitalize">
                      {fmtMonth(payroll.month)} {payroll.year}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mb-6">
                      N° {payroll.id.substring(0, 8).toUpperCase()}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                      <div>
                        <p className="text-[var(--text-muted)] text-xs uppercase font-bold mb-1">Net à Payer</p>
                        <p className="font-mono font-bold text-xl text-[var(--text)]">
                          {fmtMoney(payroll.netSalary)} F
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setViewing(payroll); }}
                        className="p-2 bg-[var(--surface-2)] text-[var(--text-muted)] rounded-lg hover:bg-emerald-500 hover:text-white transition-colors"
                        title="Voir le bulletin"
                      >
                        <Eye size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Info */}
          <div className="bg-emerald-500/10 rounded-2xl p-6 border border-emerald-500/20">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-[var(--text)] mb-2">💡 Informations</h3>
                <ul className="space-y-1 text-sm text-[var(--text-muted)]">
                  <li>• Seuls les bulletins <strong>payés</strong> apparaissent ici</li>
                  <li>• Cliquez sur une carte pour voir le bulletin complet</li>
                  <li>• Utilisez le bouton imprimer pour obtenir un PDF</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL BULLETIN ── */}
      {viewing && (
        <>
          {/*
            ✅ CSS impression corrigé :
            - Pas de position:fixed (cassait la preview Chrome/Firefox)
            - Le BulletinRenderer gère lui-même @page et le masquage
            - On masque juste la barre d'actions et l'overlay
          */}
          <style>{`
            @media print {
              html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
              .bulletin-modal-bar,
              .no-print { display: none !important; }
              /* L'overlay et la box s'effacent — seul le bulletin reste */
              .bulletin-modal-overlay {
                position: static !important;
                background: #fff !important;
                padding: 0 !important;
                overflow: visible !important;
              }
              .bulletin-modal-box {
                border-radius: 0 !important;
                box-shadow: none !important;
                max-width: none !important;
                width: auto !important;
                overflow: visible !important;
              }
              .bulletin-modal-scroll {
                background: #fff !important;
                padding: 0 !important;
                max-height: none !important;
                overflow: visible !important;
              }
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            }
          `}</style>

          <div
            className="bulletin-modal-overlay"
            style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9999, overflowY:'auto', display:'flex', justifyContent:'center', padding:'40px 20px' }}
            onClick={() => setViewing(null)}
          >
            <div
              className="bulletin-modal-box"
              style={{ background:'#f1f5f9', borderRadius:16, maxWidth:900, width:'100%', overflow:'visible', position:'relative', alignSelf:'flex-start' }}
              onClick={e => e.stopPropagation()}
            >

              {/* Barre actions */}
              <div
                className="bulletin-modal-bar no-print"
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc', borderRadius:'16px 16px 0 0' }}
              >
                <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>
                  Bulletin — {fmtMonth(viewing.month)} {viewing.year}
                </span>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  {/* ✅ Fix TypeScript : arrow function, pas référence directe */}
                  <button
                    disabled={pdfLoading}
                    onClick={async () => {
                      setPdfLoading(true);
                      try {
                        await downloadBulletinPDF(
                          activeBulletinId,
                          `bulletin-${fmtMonth(viewing.month).toLowerCase()}-${viewing.year}.pdf`
                        );
                      } finally {
                        setPdfLoading(false);
                      }
                    }}
                    style={{
                      display:'flex', alignItems:'center', gap:6,
                      padding:'7px 14px', borderRadius:8, border:'none',
                      background: pdfLoading ? '#6b7280' : '#1e293b',
                      cursor: pdfLoading ? 'not-allowed' : 'pointer',
                      fontSize:12, fontWeight:700, color:'#fff',
                      opacity: pdfLoading ? 0.7 : 1, transition:'all .2s',
                    }}
                  >
                    <Download size={14} />
                    {pdfLoading ? 'Génération…' : 'Télécharger PDF'}
                  </button>

                  {/* ✅ Fix TypeScript + bon id */}
                  <button
                    onClick={() => printBulletin(activeBulletinId)}
                    style={{
                      display:'flex', alignItems:'center', gap:6,
                      padding:'7px 14px', borderRadius:8,
                      border:'1px solid #e2e8f0', background:'#fff',
                      cursor:'pointer', fontSize:12, fontWeight:600, color:'#374151',
                    }}
                  >
                    <Printer size={14} /> Imprimer
                  </button>

                  <button
                    onClick={() => setViewing(null)}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'center',
                      width:32, height:32, borderRadius:8,
                      border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer',
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Zone bulletin — fond gris, bulletin blanc centré en A4 */}
              <div
                className="bulletin-modal-scroll"
                style={{ padding:'24px 20px', overflowY:'auto', maxHeight:'calc(100vh - 140px)' }}
              >
                {/*
                  ✅ Fix A4 : width: '210mm' fixe (pas width:100% + maxWidth:210mm)
                  Le BulletinDisplay rend lui-même le div #bulletin-root avec width:210mm
                  Ce wrapper sert juste de centrage visuel dans la modal
                */}
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <BulletinDisplay payroll={viewing} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}