'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Play, Upload, Download, CheckCircle2, AlertCircle,
  Loader2, ArrowRight, X, FileText, Link2, RefreshCw,
} from 'lucide-react';
import { api } from '@/services/api';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

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

const statusIcon = (s: BatchItem['status']) => {
  if (s === 'SUCCESS') return <CheckCircle2 size={14} className="text-emerald-400" />;
  if (s === 'FAILED')  return <AlertCircle  size={14} className="text-red-400" />;
  if (s === 'RUNNING') return <Loader2      size={14} className="text-cyan-400 animate-spin" />;
  if (s === 'SKIPPED') return <AlertCircle  size={14} className="text-amber-400" />;
  return <div className="w-3.5 h-3.5 rounded-full border border-white/20" />;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClotureImportPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;

  // URL de base du backend (sans /api/ — c'est le chemin Next.js qu'on évite)
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year,  setYear]  = useState(now.getFullYear());

  // Clôture groupée
  const [batch,        setBatch]        = useState<BatchProgress | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [companies,    setCompanies]    = useState<{ companyId: string; companyName: string }[]>([]);
  const [selected,     setSelected]     = useState<string[]>([]);
  const evtRef = useRef<EventSource | null>(null);

  // Import
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

  const launchBatch = async () => {
    setBatchLoading(true);
    try {
      const init: any = await api.post(`/cabinet/${cabinetId}/batch-closure/init`, {
        month: month + 1, year,
        companyIds: selected,
      });

      // ── CORRIGÉ : utiliser API_BASE, pas /api/ ────────────────────────────
      const token = localStorage.getItem('accessToken') ?? '';
      const sseUrl = `${API_BASE}/cabinet/${cabinetId}/batch-closure/${init.batchId}/run`;

      // EventSource ne supporte pas les headers custom nativement.
      // On passe le token en query param (le back doit l'accepter).
      const es = new EventSource(`${sseUrl}?token=${token}`, { withCredentials: true });
      evtRef.current = es;

      es.onmessage = (evt) => {
        const progress: BatchProgress = JSON.parse(evt.data);
        setBatch(progress);
        if (['COMPLETED', 'FAILED', 'PARTIAL'].includes(progress.status)) {
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

  const downloadTemplate = async (companyId: string) => {
    const blob: any = await api.get(
      `/cabinet/${cabinetId}/import/template?companyId=${companyId}`,
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-variables-paie.xlsx';
    a.click();
  };

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

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clôture & Import</h1>
          <div className="flex items-center gap-2 mt-1">
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-gray-300 outline-none">
              {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm text-gray-300 outline-none">
              {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section 1 : Clôture groupée */}
      <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Clôture groupée multi-PME</h2>
            <p className="text-gray-500 text-xs mt-0.5">Lance la validation de toutes les paies en une seule opération</p>
          </div>
          {!batch && (
            <button onClick={launchBatch} disabled={batchLoading || selected.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors">
              {batchLoading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              Lancer la clôture ({selected.length} PME)
            </button>
          )}
          {batch?.status === 'COMPLETED' && (
            <button onClick={() => setBatch(null)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors">
              <RefreshCw size={13} /> Nouvelle clôture
            </button>
          )}
        </div>

        <div className="p-5">
          {!batch ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500">Sélectionner les PME à clôturer</p>
                <button onClick={() =>
                  setSelected(selected.length === companies.length ? [] : companies.map(c => c.companyId))
                } className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                  {selected.length === companies.length ? 'Tout déselectionner' : 'Tout sélectionner'}
                </button>
              </div>
              {companies.map(c => (
                <label key={c.companyId}
                  className="flex items-center gap-3 p-3 bg-white/3 border border-white/5 rounded-xl cursor-pointer hover:bg-white/5 transition-colors">
                  <input type="checkbox"
                    checked={selected.includes(c.companyId)}
                    onChange={e => setSelected(prev =>
                      e.target.checked ? [...prev, c.companyId] : prev.filter(x => x !== c.companyId),
                    )}
                    className="rounded" />
                  <span className="text-sm text-white">{c.companyName}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{batch.processedCount} / {batch.totalCompanies} traitées</span>
                <span className="flex items-center gap-3">
                  <span className="text-emerald-400">{batch.successCount} réussies</span>
                  {batch.failedCount > 0 && <span className="text-red-400">{batch.failedCount} échouées</span>}
                </span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${batch.totalCompanies > 0 ? (batch.processedCount / batch.totalCompanies) * 100 : 0}%` }}
                />
              </div>
              <div className="space-y-1.5 mt-4">
                {batch.items.map(item => (
                  <div key={item.companyId} className="flex items-center justify-between px-3 py-2.5 bg-white/3 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      {statusIcon(item.status)}
                      <span className="text-sm text-white">{item.companyName}</span>
                      {item.errorMessage && <span className="text-xs text-amber-400">{item.errorMessage}</span>}
                    </div>
                    {item.status === 'SUCCESS' && (
                      <span className="text-xs text-emerald-400">{item.bulletinsGenerated} bulletins validés</span>
                    )}
                    {item.status === 'SKIPPED' && (
                      <span className="text-xs text-amber-400">Variables manquantes</span>
                    )}
                  </div>
                ))}
              </div>
              {batch.status === 'COMPLETED' && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <p className="text-sm text-emerald-400 font-medium">
                    Clôture terminée — {batch.successCount} PME traitées avec succès
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Section 2 : Import variables */}
      <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Import variables depuis Excel / CSV</h2>
          <p className="text-gray-500 text-xs mt-0.5">Importez les variables d'une PME depuis son fichier mensuel</p>
        </div>

        <div className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <select value={importCompanyId} onChange={e => {
              setImportCompanyId(e.target.value);
              setImportStep('idle');
              setPreviewData(null);
              setFileHeaders([]);
            }}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-cyan-500/50">
              <option value="">— Sélectionner une PME —</option>
              {companies.map(c => (
                <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
              ))}
            </select>
            {importCompanyId && (
              <button onClick={() => downloadTemplate(importCompanyId)}
                className="flex items-center gap-2 px-3 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors whitespace-nowrap">
                <Download size={14} /> Template Konza
              </button>
            )}
          </div>

          {importCompanyId && importStep === 'idle' && (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-cyan-500/30 rounded-2xl p-10 text-center cursor-pointer transition-colors group">
              <Upload size={24} className="text-gray-600 group-hover:text-cyan-400 mx-auto mb-3 transition-colors" />
              <p className="text-gray-400 text-sm">Glissez votre fichier ici ou cliquez pour parcourir</p>
              <p className="text-gray-600 text-xs mt-1">.xlsx, .xls, .csv acceptés</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
            </div>
          )}

          {importLoading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 size={20} className="animate-spin text-cyan-400" />
              <span className="text-gray-400 text-sm">Traitement en cours...</span>
            </div>
          )}

          {importStep === 'mapping' && !importLoading && (
            <div>
              <p className="text-sm text-gray-400 mb-4">
                Faites correspondre les colonnes de votre fichier aux champs Konza.
                Ce mapping sera mémorisé pour les prochains imports.
              </p>
              <div className="space-y-2 mb-5">
                {fileHeaders.map(header => (
                  <div key={header} className="flex items-center gap-3">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 truncate">{header}</div>
                    <Link2 size={14} className="text-gray-600 shrink-0" />
                    <select
                      value={mapping[header] ?? 'ignore'}
                      onChange={e => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-cyan-500/50">
                      {KONZA_FIELDS.map(f => (
                        <option key={f.key} value={f.key}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button onClick={applyMapping} disabled={importLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
                Aperçu de l'import <ArrowRight size={14} />
              </button>
            </div>
          )}

          {importStep === 'preview' && previewData && !importLoading && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                    <CheckCircle2 size={14} /> {previewData.matchedCount} employés reconnus
                  </div>
                  {previewData.unmatchedCount > 0 && (
                    <div className="flex items-center gap-1.5 text-amber-400 text-sm">
                      <AlertCircle size={14} /> {previewData.unmatchedCount} non reconnus
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setImportStep('mapping')} className="text-xs text-gray-500 hover:text-white transition-colors">
                    ← Modifier mapping
                  </button>
                  <button onClick={confirmImport} disabled={importLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl text-sm transition-colors disabled:opacity-50">
                    Confirmer l'import
                  </button>
                </div>
              </div>

              <div className="bg-white/3 border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Employé','Jours','Abs.','H.sup ×1.10','H.sup ×1.25','Avance','Statut'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(previewData.rows ?? []).slice(0, 10).map((row: any, i: number) => (
                      <tr key={i} className={row.matchError ? 'bg-amber-500/5' : ''}>
                        <td className="px-3 py-2 text-white">{row.firstName} {row.lastName}</td>
                        <td className="px-3 py-2 text-gray-400">{row.workedDays}</td>
                        <td className="px-3 py-2 text-gray-400">{row.absentDays || '—'}</td>
                        <td className="px-3 py-2 text-gray-400">{row.overtime10 || '—'}</td>
                        <td className="px-3 py-2 text-gray-400">{row.overtime25 || '—'}</td>
                        <td className="px-3 py-2 text-gray-400">{row.advance || '—'}</td>
                        <td className="px-3 py-2">
                          {row.matchError
                            ? <span className="text-amber-400 flex items-center gap-1"><AlertCircle size={11} /> Non trouvé</span>
                            : <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={11} /> OK</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(previewData.rows?.length ?? 0) > 10 && (
                  <p className="text-center text-xs text-gray-600 py-2">+ {previewData.rows.length - 10} autres lignes</p>
                )}
              </div>
            </div>
          )}

          {importStep === 'done' && (
            <div className="text-center py-8">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-white font-semibold">Import réussi</p>
              <p className="text-gray-400 text-sm mt-1">
                {previewData?.applied} lignes importées · {previewData?.skipped} ignorées
              </p>
              <button
                onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${importCompanyId}/paie`)}
                className="mt-4 flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl text-sm transition-colors mx-auto">
                Saisir les variables <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}