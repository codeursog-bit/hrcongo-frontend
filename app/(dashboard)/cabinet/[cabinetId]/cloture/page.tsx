'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/cloture/page.tsx
// REFONTE UX — Clôture & Import batch, design cabinet-ui
// ============================================================================

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';
import {
  C, Ico, TopBar, Card, SectionHeader, Badge,
  Avatar, Btn, LoadingScreen, Banner,
} from '@/components/cabinet/cabinet-ui';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

interface BatchItem {
  companyId:          string;
  companyName:        string;
  status:             'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  bulletinsGenerated: number;
  errorMessage?:      string;
}

interface BatchProgress {
  batchId: string; status: string; totalCompanies: number;
  processedCount: number; successCount: number; failedCount: number;
  currentCompany: string | null; items: BatchItem[];
}

const KONZA_FIELDS = [
  { key: 'employeeNumber', label: 'Matricule' },
  { key: 'lastName',       label: 'Nom' },
  { key: 'firstName',      label: 'Prénom' },
  { key: 'workedDays',     label: 'Jours travaillés' },
  { key: 'absentDays',     label: 'Jours absents' },
  { key: 'overtime10',     label: 'H.Sup ×1.10' },
  { key: 'overtime25',     label: 'H.Sup ×1.25' },
  { key: 'overtime50',     label: 'H.Sup ×1.50' },
  { key: 'overtime100',    label: 'H.Sup ×2.00' },
  { key: 'prime1Label',    label: 'Prime 1 libellé' },
  { key: 'prime1Amount',   label: 'Prime 1 montant' },
  { key: 'advance',        label: 'Avance' },
  { key: 'loanDeduction',  label: 'Remb. prêt' },
  { key: 'ignore',         label: '— Ignorer —' },
];

function statusVariant(s: BatchItem['status']): any {
  if (s === 'SUCCESS') return 'success';
  if (s === 'FAILED')  return 'danger';
  if (s === 'RUNNING') return 'warning';
  if (s === 'SKIPPED') return 'default';
  return 'default';
}

function statusLabel(s: BatchItem['status']): string {
  if (s === 'SUCCESS') return 'Réussi';
  if (s === 'FAILED')  return 'Échoué';
  if (s === 'RUNNING') return 'En cours';
  if (s === 'SKIPPED') return 'Ignoré';
  return 'En attente';
}

export default function CloturePage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;

  const now     = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year,  setYear]  = useState(now.getFullYear());

  const [batchRunning, setBatchRunning] = useState(false);
  const [progress,     setProgress]     = useState<BatchProgress | null>(null);
  const [error,        setError]        = useState('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Import CSV
  const [companies,    setCompanies]    = useState<any[]>([]);
  const [selectedComp, setSelectedComp] = useState('');
  const [csvHeaders,   setCsvHeaders]   = useState<string[]>([]);
  const [csvRows,      setCsvRows]      = useState<string[][]>([]);
  const [mapping,      setMapping]      = useState<Record<string, string>>({});
  const [importing,    setImporting]    = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get(`/cabinet/${cabinetId}/dashboard`)
      .then((r: any) => setCompanies(r.companies ?? []))
      .catch(console.error);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [cabinetId]);

  // Lancer clôture batch
  const launchBatch = async () => {
    setError(''); setBatchRunning(true); setProgress(null);
    try {
      const res: any = await api.post(`/cabinet/${cabinetId}/payrolls/batch-generate`, { month, year });
      const batchId  = res.batchId;
      pollRef.current = setInterval(async () => {
        try {
          const p: any = await api.get(`/cabinet/${cabinetId}/payrolls/batch-status/${batchId}`);
          setProgress(p);
          if (['COMPLETED','FAILED','PARTIAL'].includes(p.status)) {
            clearInterval(pollRef.current!);
            setBatchRunning(false);
          }
        } catch { clearInterval(pollRef.current!); setBatchRunning(false); }
      }, 2000);
    } catch (e: any) { setError(e.message); setBatchRunning(false); }
  };

  // Parse CSV
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const text   = ev.target?.result as string;
      const lines  = text.split('\n').filter(l => l.trim());
      const sep    = lines[0].includes(';') ? ';' : ',';
      const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ''));
      const rows    = lines.slice(1).map(l => l.split(sep).map(c => c.trim().replace(/^"|"$/g, '')));
      setCsvHeaders(headers); setCsvRows(rows);
      const auto: Record<string, string> = {};
      headers.forEach(h => {
        const match = KONZA_FIELDS.find(f => f.label.toLowerCase() === h.toLowerCase() || f.key.toLowerCase() === h.toLowerCase());
        auto[h] = match?.key ?? 'ignore';
      });
      setMapping(auto);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const submitImport = async () => {
    if (!selectedComp) { setError('Sélectionnez une PME'); return; }
    setImporting(true); setError('');
    try {
      const result: any = await api.post(
        `/cabinet/${cabinetId}/entreprise/${selectedComp}/payrolls/import-csv`,
        { headers: csvHeaders, rows: csvRows, mapping, month, year }
      );
      setImportResult(result);
    } catch (e: any) { setError(e.message); }
    finally { setImporting(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: C.pageBg }}>
      <CabinetSidebar cabinetId={cabinetId} />

      <div className="ml-56">
        <TopBar title="Clôture & Import" subtitle="Génération batch et import CSV" breadcrumb="Cabinet" />

        <div className="p-8 space-y-6">

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                 style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.2)`, color: '#f87171' }}>
              <Ico.Alert size={14} color="#f87171" /> {error}
            </div>
          )}

          {/* ── Sélecteur mois/année ─────────────────────────────────────── */}
          <Card accentColor={C.cyan} className="p-5">
            <p className="text-sm font-semibold mb-4" style={{ color: C.textPrimary }}>Période de traitement</p>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: C.textSecondary }}>Mois</label>
                <select
                  value={month}
                  onChange={e => setMonth(Number(e.target.value))}
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.textPrimary }}
                >
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: C.textSecondary }}>Année</label>
                <select
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.textPrimary }}
                >
                  {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-5">

            {/* ── Clôture batch ────────────────────────────────────────── */}
            <Card>
              <SectionHeader
                title="Clôture batch"
                sub="Générer tous les bulletins d'un coup"
                action={
                  <Btn
                    variant="primary"
                    size="sm"
                    icon={
                      batchRunning
                        ? <Ico.Loader size={14} color="#fff" />
                        : (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M3 2l9 5-9 5V2z" fill="white"/>
                          </svg>
                        )
                    }
                    onClick={launchBatch}
                  >
                    {batchRunning ? 'En cours…' : 'Lancer'}
                  </Btn>
                }
              />
              <div className="p-5">
                {!progress ? (
                  <div className="py-8 text-center text-sm" style={{ color: C.textMuted }}>
                    Cliquez sur "Lancer" pour générer les bulletins de {MONTHS[month - 1]} {year} pour toutes vos PME.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Progress bar globale */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span style={{ color: C.textSecondary }}>
                          {progress.processedCount} / {progress.totalCompanies} PME
                        </span>
                        <div className="flex items-center gap-2">
                          <span style={{ color: C.emerald }}>✓ {progress.successCount}</span>
                          {progress.failedCount > 0 && <span style={{ color: C.red }}>✗ {progress.failedCount}</span>}
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress.totalCompanies > 0 ? (progress.processedCount / progress.totalCompanies) * 100 : 0}%`,
                            background: C.indigo,
                          }}
                        />
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {progress.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg"
                             style={{ background: 'rgba(255,255,255,0.03)' }}>
                          <Avatar name={item.companyName.slice(0, 2)} size={26} index={i} />
                          <p className="flex-1 text-xs font-medium truncate" style={{ color: C.textPrimary }}>
                            {item.companyName}
                          </p>
                          <Badge label={statusLabel(item.status)} variant={statusVariant(item.status)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* ── Import CSV ───────────────────────────────────────────── */}
            <Card>
              <SectionHeader title="Import CSV" sub="Variables de paie par fichier" />
              <div className="p-5 space-y-4">

                {/* Sélection PME */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: C.textSecondary }}>PME cible</label>
                  <select
                    value={selectedComp}
                    onChange={e => setSelectedComp(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.textPrimary }}
                  >
                    <option value="">Sélectionner…</option>
                    {companies.map(c => (
                      <option key={c.companyId} value={c.companyId}>
                        {c.tradeName || c.legalName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Upload zone */}
                <div
                  className="flex flex-col items-center gap-2 py-6 rounded-xl cursor-pointer transition-all"
                  style={{
                    border: `1.5px dashed ${C.border}`,
                    background: 'rgba(255,255,255,0.02)',
                  }}
                  onClick={() => fileRef.current?.click()}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = C.indigo)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M4 20v2a2 2 0 002 2h16a2 2 0 002-2v-2M14 4v14M8 10l6-6 6 6" stroke={C.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p className="text-xs" style={{ color: C.textMuted }}>
                    {csvHeaders.length > 0 ? `${csvRows.length} lignes chargées` : 'Cliquer pour sélectionner un CSV'}
                  </p>
                  <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
                </div>

                {/* Mapping colonnes */}
                {csvHeaders.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <p className="text-xs font-medium" style={{ color: C.textSecondary }}>Correspondance colonnes</p>
                    {csvHeaders.map(h => (
                      <div key={h} className="flex items-center gap-2">
                        <span className="text-xs flex-1 truncate" style={{ color: C.textMuted }}>{h}</span>
                        <select
                          value={mapping[h] ?? 'ignore'}
                          onChange={e => setMapping(prev => ({ ...prev, [h]: e.target.value }))}
                          className="text-xs px-2 py-1.5 rounded-lg outline-none"
                          style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, color: C.textPrimary }}
                        >
                          {KONZA_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                )}

                {csvHeaders.length > 0 && (
                  <Btn
                    variant="primary"
                    icon={<Ico.FileText size={14} color="#fff" />}
                    onClick={submitImport}
                  >
                    {importing ? 'Import en cours…' : 'Importer'}
                  </Btn>
                )}

                {importResult && (
                  <div className="px-3 py-2 rounded-xl text-xs"
                       style={{ background: 'rgba(16,185,129,0.1)', border: `1px solid rgba(16,185,129,0.2)`, color: '#34d399' }}>
                    Import réussi · {importResult.updatedCount ?? importResult.count ?? 0} employé(s) mis à jour
                  </div>
                )}
              </div>
            </Card>

          </div>

        </div>
      </div>
    </div>
  );
}