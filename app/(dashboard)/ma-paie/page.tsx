'use client';

// ============================================================================
// app/(dashboard)/ma-paie/page.tsx
// ✅ Utilise BulletinDisplay — gère automatiquement mode template ET canvas
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Download, Calendar, Loader2,
  ArrowLeft, Eye, Clock, X, Printer,
} from 'lucide-react';
import { api } from '@/services/api';
import BulletinDisplay from '@/components/BulletinDisplay';

export default function MyPayrollsPage() {
  const router = useRouter();
  const [payrolls, setPayrolls]   = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employee, setEmployee]   = useState<any>(null);
  const [viewing, setViewing]     = useState<any | null>(null);

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

  return (
    <div className="max-w-[1200px] mx-auto pb-20 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-500 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mes Bulletins de Paie</h1>
          <p className="text-gray-500 dark:text-gray-400">Consultez et téléchargez vos fiches de paie.</p>
        </div>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-sky-500" size={48} />
        </div>

      ) : payrolls.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-10 text-center border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
            <Clock size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Aucun bulletin disponible</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
            Vos bulletins de paie apparaîtront ici une fois validés et payés par votre service RH.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-sky-50 dark:bg-sky-900/20 rounded-lg text-sm text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
            <FileText size={16} />
            <span>Seuls les bulletins avec statut "Payé" sont visibles ici</span>
          </div>
        </div>

      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                  <FileText size={20} className="text-sky-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Bulletins disponibles</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{payrolls.length}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <Calendar size={20} className="text-emerald-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Dernier bulletin</p>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                {fmtMonth(payrolls[0].month)} {payrolls[0].year}
              </p>
              <p className="text-xs text-gray-400 mt-1">{fmtMoney(payrolls[0].netSalary)} F net</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Download size={20} className="text-purple-500" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total {currentYear}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{fmtMoney(yearTotal)} F</p>
              <p className="text-xs text-gray-400 mt-1">{currentYearPayrolls.length} bulletin(s)</p>
            </div>
          </div>

          {/* Grille bulletins */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...payrolls]
              .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
              .map((payroll) => (
                <div
                  key={payroll.id}
                  className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden cursor-pointer"
                  onClick={() => setViewing(payroll)}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 dark:bg-sky-900/10 rounded-bl-full -mr-6 -mt-6 group-hover:scale-150 transition-transform" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                        {new Date(0, payroll.month - 1).toLocaleString('fr-FR', { month: 'short' })}
                      </div>
                      <span className="px-2 py-1 rounded text-xs font-bold border bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                        ✓ PAYÉ
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 capitalize">
                      {fmtMonth(payroll.month)} {payroll.year}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      N° {payroll.id.substring(0, 8).toUpperCase()}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div>
                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Net à Payer</p>
                        <p className="font-mono font-bold text-xl text-gray-900 dark:text-white">
                          {fmtMoney(payroll.netSalary)} F
                        </p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setViewing(payroll); }}
                        className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-white rounded-lg hover:bg-sky-500 hover:text-white transition-colors"
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
          <div className="bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-sky-200 dark:border-sky-800">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-sky-600 dark:text-sky-400" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">💡 Informations</h3>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
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
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:9999, overflowY:'auto', display:'flex', justifyContent:'center', padding:'40px 20px' }}
          onClick={() => setViewing(null)}
        >
          <div
            style={{ background:'#fff', borderRadius:16, maxWidth:880, width:'100%', overflow:'hidden', position:'relative', alignSelf:'flex-start' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Barre actions */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #e2e8f0', background:'#f8fafc' }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>
                Bulletin — {fmtMonth(viewing.month)} {viewing.year}
              </span>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => window.print()}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:'#374151' }}>
                  <Printer size={14} /> Imprimer / PDF
                </button>
                <button onClick={() => setViewing(null)}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', width:32, height:32, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer' }}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ✅ BulletinDisplay — gère template ET canvas automatiquement */}
            <BulletinDisplay payroll={viewing} />
          </div>
        </div>
      )}
    </div>
  );
}
