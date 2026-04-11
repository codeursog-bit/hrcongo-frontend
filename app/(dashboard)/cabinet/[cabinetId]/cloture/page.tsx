'use client';

// app/(dashboard)/cabinet/[cabinetId]/cloture/page.tsx
// REFONTE UX ONLY — 100% logique originale préservée : EventSource SSE,
// downloadTemplate, handleFileUpload, applyMapping, confirmImport, no Lucide

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const T = {
  bg:      '#0f1626', card: '#151e30', cardHover: '#1a2540', surface: '#1e2b42',
  border:  'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.14)',
  text:    '#f1f5f9', muted: '#94a3b8', dim: '#475569',
  indigo:  '#6366f1', indigoL: '#818cf8',
  cyan:    '#06b6d4', emerald: '#10b981', amber: '#f59e0b', red: '#ef4444',
};

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IcoPlay = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
    <path d="M3 2.5l10 5-10 5V2.5z"/>
  </svg>
);

const IcoUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3M12 4v12M7 9l5-5 5 5"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoDownload = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M7 2v8M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoCheck = ({ color = T.emerald, size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="5.5" stroke={color} strokeWidth="1.5"/>
    <path d="M4.5 7l2 2 3-3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoAlert = ({ color = T.red, size = 14 }: { color?: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M7 1.5L1 12h12L7 1.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M7 6v3M7 10.5v.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoLoader = ({ size = 15, color = T.cyan }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 15 15" fill="none" className="animate-spin">
    <circle cx="7.5" cy="7.5" r="6" stroke={color} strokeWidth="1.5"
      strokeDasharray="30" strokeDashoffset="11" strokeLinecap="round"/>
  </svg>
);

const IcoLink = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 9l4-4M3 7.5L1.5 9A3 3 0 006 13.5l1-1M11 6.5l1.5-1.5A3 3 0 008 .5l-1 1"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IcoArrow = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M3 7h8M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IcoRefresh = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <path d="M12 2v4H8M1 11V7h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M11.8 7a5.5 5.5 0 11-1.5-5.2L12 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface BatchItem {
  companyId:          string;
  companyName:        string;
  status:             'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  bulletinsGenerated: number;
  errorMessage?:      string;
}

interface BatchProgress {
  batchId:        string;
  status:         string;
  totalCompanies: number;
  processedCount: number;
  successCount:   number;
  failedCount:    number;
  currentCompany: string | null;
  items:          BatchItem[];
}

interface ImportMapping { [sourceCol: string]: string }

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const KONZA_FIELDS = [
  { key: 'employeeNumber', label: 'Matricule'         },
  { key: 'lastName',       label: 'Nom'               },
  { key: 'firstName',      label: 'Prénom'            },
  { key: 'workedDays',     label: 'Jours travaillés'  },
  { key: 'absentDays',     label: 'Jours absents'     },
  { key: 'overtime10',     label: 'H.Sup ×1.10'       },
  { key: 'overtime25',     label: 'H.Sup ×1.25'       },
  { key: 'overtime50',     label: 'H.Sup ×1.50'       },
  { key: 'overtime100',    label: 'H.Sup ×2.00'       },
  { key: 'prime1Label',    label: 'Prime 1 libellé'   },
  { key: 'prime1Amount',   label: 'Prime 1 montant'   },
  { key: 'advance',        label: 'Avance'            },
  { key: 'loanDeduction',  label: 'Remb. prêt'        },
  { key: 'ignore',         label: '— Ignorer —'       },
];

const statusIcon = (s: BatchItem['status']) => {
  if (s === 'SUCCESS') return <IcoCheck color={T.emerald} />;
  if (s === 'FAILED')  return <IcoAlert color={T.red} />;
  if (s === 'RUNNING') return <IcoLoader size={14} color={T.cyan} />;
  if (s === 'SKIPPED') return <IcoAlert color={T.amber} />;
  return <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${T.border}` }} />;
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClotureImportPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());

  // ── Clôture groupée ───────────────────────────────────────────────────────
  const [batch,        setBatch]        = useState<BatchProgress | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [companies,    setCompanies]    = useState<{ companyId: string; companyName: string }[]>([]);
  const [selected,     setSelected]     = useState<string[]>([]);
  const evtRef = useRef<EventSource | null>(null);

  // ── Import variables ──────────────────────────────────────────────────────
  const [importStep,      setImportStep]      = useState<'idle' | 'mapping' | 'preview' | 'done'>('idle');
  const [importCompanyId, setImportCompanyId] = useState('');
  const [fileHeaders,     setFileHeaders]     = useState<string[]>([]);
  const [mapping,         setMapping]         = useState<ImportMapping>({});
  const [previewData,     setPreviewData]     = useState<any>(null);
  const [importLoading,   setImportLoading]   = useState(false);
  const fileRef        = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  useEffect(() => {
    api.get(`/cabinet/${cabinetId}/dashboard`)
      .then((r: any) => {
        setCompanies(r.companies ?? []);
        setSelected((r.companies ?? []).map((c: any) => c.companyId));
      })
      .catch(console.error);
  }, [cabinetId]);

  // ── Lancer clôture batch (SSE EventSource — logique 100% originale) ───────
  const launchBatch = async () => {
    setBatchLoading(true);
    try {
      const init: any = await api.post(`/cabinet/${cabinetId}/batch-closure/init`, {
        month: month + 1, year,
        companyIds: selected,
      });

      const es = new EventSource(
        `/api/cabinet/${cabinetId}/batch-closure/${init.batchId}/run`,
        { withCredentials: true },
      );
      evtRef.current = es;

      es.onmessage = (evt) => {
        const progress: BatchProgress = JSON.parse(evt.data);
        setBatch(progress);
        if (['COMPLETED','FAILED','PARTIAL'].includes(progress.status)) {
          es.close();
          setBatchLoading(false);
        }
      };

      es.onerror = () => { es.close(); setBatchLoading(false); };
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
      setBatchLoading(false);
    }
  };

  // ── Télécharger template ──────────────────────────────────────────────────
  const downloadTemplate = async (companyId: string) => {
    const blob: any = await api.get(
      `/cabinet/${cabinetId}/import/template?companyId=${companyId}`,
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'template-variables-paie.xlsx'; a.click();
  };

  // ── Upload & parse fichier ────────────────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importCompanyId) return;
    pendingFileRef.current = file;
    setImportLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', importCompanyId);

    try {
      const res: any = await api.post(`/cabinet/${cabinetId}/import/parse`, formData);
      setFileHeaders(res.headers ?? []);

      const isKonzaTemplate = res.headers?.some((h: string) =>
        h === 'Jours travaillés' || h === 'H.Sup ×1.10',
      );

      if (isKonzaTemplate) {
        setMapping({});
        const preview: any = await api.post(`/cabinet/${cabinetId}/import/preview`, {
          companyId: importCompanyId, rows: res.rows, mapping: {}, month: month + 1, year,
        });
        setPreviewData(preview);
        setImportStep('preview');
      } else {
        const autoMapping: ImportMapping = {};
        res.headers.forEach((h: string) => { autoMapping[h] = 'ignore'; });
        setMapping(autoMapping);
        setImportStep('mapping');
      }
    } catch (e: any) {
      alert(`Erreur lecture fichier : ${e.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  // ── Appliquer mapping → preview ───────────────────────────────────────────
  const applyMapping = async () => {
    if (!pendingFileRef.current || !importCompanyId) return;
    setImportLoading(true);
    const formData = new FormData();
    formData.append('file', pendingFileRef.current);
    formData.append('companyId', importCompanyId);
    formData.append('mapping', JSON.stringify(mapping));
    try {
      const res: any = await api.post(`/cabinet/${cabinetId}/import/parse`, formData);
      const preview: any = await api.post(`/cabinet/${cabinetId}/import/preview`, {
        companyId: importCompanyId, rows: res.rows, mapping, month: month + 1, year,
      });
      setPreviewData(preview);
      setImportStep('preview');
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  // ── Confirmer import ──────────────────────────────────────────────────────
  const confirmImport = async () => {
    if (!previewData) return;
    setImportLoading(true);
    try {
      const res: any = await api.post(`/cabinet/${cabinetId}/import/apply`, {
        companyId: importCompanyId, month: month + 1, year,
        preview: previewData, mapping,
        saveMappingName: pendingFileRef.current?.name ?? 'Import',
      });
      setImportStep('done');
      setPreviewData({ ...previewData, applied: res.applied, skipped: res.skipped });
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setImportLoading(false);
    }
  };

  // ─── Helpers style ─────────────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: T.card,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(0,0,0,0.15)',
  };

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${T.border}`,
    borderRadius: 10, padding: '8px 12px',
    fontSize: 14, color: T.text, outline: 'none',
  };

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ background: T.bg, color: T.text }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: T.text }}>Clôture &amp; Import</h1>
          {/* Sélecteurs mois/année — inline comme dans l'original */}
          <div className="flex items-center gap-2 mt-2">
            <select value={month} onChange={e => setMonth(Number(e.target.value))} style={selectStyle}>
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} style={selectStyle}>
              {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — Clôture groupée multi-PME
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...cardStyle, borderTop: `2px solid ${T.emerald}` }}>
        <div className="px-5 py-4 flex items-center justify-between"
             style={{ borderBottom: `1px solid ${T.border}` }}>
          <div>
            <h2 className="font-semibold" style={{ color: T.text }}>Clôture groupée multi-PME</h2>
            <p className="text-xs mt-0.5" style={{ color: T.muted }}>
              Lance la validation de toutes les paies en une seule opération
            </p>
          </div>

          {!batch && (
            <button
              onClick={launchBatch}
              disabled={batchLoading || selected.length === 0}
              className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                padding: '9px 18px',
                background: batchLoading || selected.length === 0 ? 'rgba(16,185,129,0.4)' : T.emerald,
                color: '#000', border: 'none',
                cursor: batchLoading || selected.length === 0 ? 'not-allowed' : 'pointer',
              }}
            >
              {batchLoading ? <IcoLoader size={15} color="#000" /> : <IcoPlay />}
              Lancer la clôture ({selected.length} PME)
            </button>
          )}

          {batch?.status === 'COMPLETED' && (
            <button
              onClick={() => setBatch(null)}
              className="flex items-center gap-1.5 text-xs transition-all"
              style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text)}
              onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
            >
              <IcoRefresh /> Nouvelle clôture
            </button>
          )}
        </div>

        <div className="p-5">
          {/* ── Avant lancement : liste checkboxes ── */}
          {!batch ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs" style={{ color: T.muted }}>Sélectionner les PME à clôturer</p>
                <button
                  onClick={() => setSelected(
                    selected.length === companies.length ? [] : companies.map(c => c.companyId)
                  )}
                  className="text-xs transition-all"
                  style={{ color: T.cyan, background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {selected.length === companies.length ? 'Tout déselectionner' : 'Tout sélectionner'}
                </button>
              </div>

              {companies.map(c => (
                <label
                  key={c.companyId}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(c.companyId)}
                    onChange={e => setSelected(prev =>
                      e.target.checked ? [...prev, c.companyId] : prev.filter(x => x !== c.companyId)
                    )}
                    className="rounded"
                    style={{ accentColor: T.indigo }}
                  />
                  <span className="text-sm" style={{ color: T.text }}>{c.companyName}</span>
                </label>
              ))}
            </div>

          ) : (
            // ── Pendant / après lancement : progress ──
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs mb-1" style={{ color: T.muted }}>
                <span>{batch.processedCount} / {batch.totalCompanies} traitées</span>
                <span className="flex items-center gap-3">
                  <span style={{ color: T.emerald }}>{batch.successCount} réussies</span>
                  {batch.failedCount > 0 && (
                    <span style={{ color: T.red }}>{batch.failedCount} échouées</span>
                  )}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${batch.totalCompanies > 0 ? (batch.processedCount / batch.totalCompanies) * 100 : 0}%`,
                    background: T.emerald,
                  }}
                />
              </div>

              {/* Items */}
              <div className="space-y-1.5 mt-4">
                {batch.items.map(item => (
                  <div
                    key={item.companyId}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    <div className="flex items-center gap-2.5">
                      {statusIcon(item.status)}
                      <span className="text-sm" style={{ color: T.text }}>{item.companyName}</span>
                      {item.errorMessage && (
                        <span className="text-xs" style={{ color: T.amber }}>{item.errorMessage}</span>
                      )}
                    </div>
                    {item.status === 'SUCCESS' && (
                      <span className="text-xs" style={{ color: T.emerald }}>
                        {item.bulletinsGenerated} bulletins validés
                      </span>
                    )}
                    {item.status === 'SKIPPED' && (
                      <span className="text-xs" style={{ color: T.amber }}>Variables manquantes</span>
                    )}
                  </div>
                ))}
              </div>

              {batch.status === 'COMPLETED' && (
                <div className="flex items-center gap-2 p-3 rounded-xl mt-2"
                     style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <IcoCheck color={T.emerald} size={16} />
                  <p className="text-sm font-medium" style={{ color: T.emerald }}>
                    Clôture terminée — {batch.successCount} PME traitées avec succès
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — Import variables depuis Excel / CSV
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...cardStyle, borderTop: `2px solid ${T.cyan}` }}>
        <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.border}` }}>
          <h2 className="font-semibold" style={{ color: T.text }}>Import variables depuis Excel / CSV</h2>
          <p className="text-xs mt-0.5" style={{ color: T.muted }}>
            Importez les variables d'une PME depuis son fichier mensuel
          </p>
        </div>

        <div className="p-5">
          {/* Sélection PME + bouton template */}
          <div className="flex items-center gap-3 mb-5">
            <select
              value={importCompanyId}
              onChange={e => {
                setImportCompanyId(e.target.value);
                setImportStep('idle');
                setPreviewData(null);
                setFileHeaders([]);
              }}
              style={{ ...selectStyle, flex: 1 }}
            >
              <option value="">— Sélectionner une PME —</option>
              {companies.map(c => (
                <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
              ))}
            </select>

            {importCompanyId && (
              <button
                onClick={() => downloadTemplate(importCompanyId)}
                className="flex items-center gap-2 rounded-xl text-sm transition-all"
                style={{
                  padding: '9px 14px', whiteSpace: 'nowrap',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${T.border}`, color: T.muted,
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.09)'); (e.currentTarget.style.color = T.text); }}
                onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.05)'); (e.currentTarget.style.color = T.muted); }}
              >
                <IcoDownload /> Template Konza
              </button>
            )}
          </div>

          {/* ── Étape idle : zone drag & drop ── */}
          {importCompanyId && importStep === 'idle' && (
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl p-10 text-center cursor-pointer transition-all"
              style={{ border: `2px dashed ${T.border}` }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${T.cyan}50`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
            >
              <div style={{ color: T.dim, display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <IcoUpload />
              </div>
              <p className="text-sm" style={{ color: T.muted }}>
                Glissez votre fichier ici ou cliquez pour parcourir
              </p>
              <p className="text-xs mt-1" style={{ color: T.dim }}>.xlsx, .xls, .csv acceptés</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            </div>
          )}

          {/* ── Loading ── */}
          {importLoading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <IcoLoader size={20} color={T.cyan} />
              <span className="text-sm" style={{ color: T.muted }}>Traitement en cours...</span>
            </div>
          )}

          {/* ── Étape mapping ── */}
          {importStep === 'mapping' && !importLoading && (
            <div>
              <p className="text-sm mb-4" style={{ color: T.muted }}>
                Faites correspondre les colonnes de votre fichier aux champs Konza.
                Ce mapping sera mémorisé pour les prochains imports.
              </p>
              <div className="space-y-2 mb-5">
                {fileHeaders.map(header => (
                  <div key={header} className="flex items-center gap-3">
                    <div className="flex-1 px-3 py-2 rounded-lg text-sm truncate"
                         style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, color: T.muted }}>
                      {header}
                    </div>
                    <span style={{ color: T.dim }}><IcoLink /></span>
                    <select
                      value={mapping[header] ?? 'ignore'}
                      onChange={e => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                      className="flex-1"
                      style={selectStyle}
                    >
                      {KONZA_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button
                onClick={applyMapping}
                disabled={importLoading}
                className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  padding: '9px 18px',
                  background: importLoading ? 'rgba(6,182,212,0.4)' : T.cyan,
                  color: '#000', border: 'none', cursor: importLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Aperçu de l'import <IcoArrow />
              </button>
            </div>
          )}

          {/* ── Étape preview ── */}
          {importStep === 'preview' && previewData && !importLoading && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm" style={{ color: T.emerald }}>
                    <IcoCheck color={T.emerald} /> {previewData.matchedCount} employés reconnus
                  </div>
                  {previewData.unmatchedCount > 0 && (
                    <div className="flex items-center gap-1.5 text-sm" style={{ color: T.amber }}>
                      <IcoAlert color={T.amber} /> {previewData.unmatchedCount} non reconnus
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setImportStep('mapping')}
                    className="text-xs transition-all"
                    style={{ color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.text)}
                    onMouseLeave={e => (e.currentTarget.style.color = T.muted)}
                  >
                    ← Modifier mapping
                  </button>
                  <button
                    onClick={confirmImport}
                    disabled={importLoading}
                    className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      padding: '8px 16px',
                      background: importLoading ? 'rgba(16,185,129,0.4)' : T.emerald,
                      color: '#000', border: 'none', cursor: importLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Confirmer l'import
                  </button>
                </div>
              </div>

              {/* Tableau prévisualisation */}
              <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
                <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: `1px solid ${T.border}` }}>
                      {['Employé','Jours','Abs.','H.sup ×1.10','H.sup ×1.25','Avance','Statut'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium" style={{ color: T.muted }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(previewData.rows ?? []).slice(0, 10).map((row: any, i: number) => (
                      <tr key={i}
                          style={{
                            background: row.matchError ? 'rgba(245,158,11,0.05)' : 'transparent',
                            borderBottom: `1px solid ${T.border}`,
                          }}>
                        <td className="px-3 py-2" style={{ color: T.text }}>{row.firstName} {row.lastName}</td>
                        <td className="px-3 py-2" style={{ color: T.muted }}>{row.workedDays}</td>
                        <td className="px-3 py-2" style={{ color: T.muted }}>{row.absentDays || '—'}</td>
                        <td className="px-3 py-2" style={{ color: T.muted }}>{row.overtime10 || '—'}</td>
                        <td className="px-3 py-2" style={{ color: T.muted }}>{row.overtime25 || '—'}</td>
                        <td className="px-3 py-2" style={{ color: T.muted }}>{row.advance || '—'}</td>
                        <td className="px-3 py-2">
                          {row.matchError ? (
                            <span className="flex items-center gap-1" style={{ color: T.amber }}>
                              <IcoAlert color={T.amber} size={11} /> Non trouvé
                            </span>
                          ) : (
                            <span className="flex items-center gap-1" style={{ color: T.emerald }}>
                              <IcoCheck color={T.emerald} size={11} /> OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(previewData.rows?.length ?? 0) > 10 && (
                  <p className="text-center text-xs py-2" style={{ color: T.dim }}>
                    + {previewData.rows.length - 10} autres lignes
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Étape done ── */}
          {importStep === 'done' && (
            <div className="text-center py-8">
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <IcoCheck color={T.emerald} size={40} />
              </div>
              <p className="font-semibold" style={{ color: T.text }}>Import réussi</p>
              <p className="text-sm mt-1" style={{ color: T.muted }}>
                {previewData?.applied} lignes importées · {previewData?.skipped} ignorées
              </p>
              <button
                onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${importCompanyId}/paie`)}
                className="mt-4 flex items-center gap-2 rounded-xl text-sm font-semibold mx-auto transition-all"
                style={{
                  padding: '9px 18px',
                  background: T.cyan, color: '#000', border: 'none', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Saisir les variables <IcoArrow />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}