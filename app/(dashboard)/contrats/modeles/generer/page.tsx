'use client';

// ============================================================================
// 📁 app/(dashboard)/contrats/modeles/generer/page.tsx
// Génération : choisir un modèle + un employé → toutes les variables se
// remplissent depuis leur source. L'utilisateur ne complète que ce qui manque
// (surligné en rouge) ou corrige une valeur, puis télécharge Word / PDF.
// ============================================================================

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, FileSignature, Download, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { useBasePath } from '@/hooks/useBasePath';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';
import { ResolvedVariable, SOURCE_LABEL, SAVABLE_SOURCES, TemplateListItem, saveBlob } from '@/lib/contract-templates';

interface EmployeeOption { id: string; firstName: string; lastName: string; employeeNumber: string; position: string }
interface ResolveResult { template: { id: string; name: string }; variables: ResolvedVariable[]; missingCount: number }

const SOURCE_BADGE: Record<string, string> = {
  EMPLOYEE: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  COMPANY: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  LEGAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  COMPUTED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  MANUAL: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  CUSTOM: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
};

function Content() {
  const router = useRouter();
  const params = useSearchParams();
  const { bp } = useBasePath();
  const { success, error: showError } = useAlert();

  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [templateId, setTemplateId] = useState(params.get('templateId') || '');
  const [employeeId, setEmployeeId] = useState(params.get('employeeId') || '');
  const [search, setSearch] = useState('');
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<ResolveResult | null>(null);
  const [resolving, setResolving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState<{ id: string; name: string } | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  // clés dont l'utilisateur a DÉCOCHÉ « mémoriser » (par défaut, une valeur saisie pour l'entreprise est mémorisée)
  const [noRemember, setNoRemember] = useState<Record<string, boolean>>({});
  const reqId = useRef(0);

  useEffect(() => {
    api.get<TemplateListItem[]>('/contract-templates').then((l) => setTemplates(l.filter((t) => !t.isSystem))).catch(() => {});
    api.get<EmployeeOption[]>('/employees/simple').then((r: any) => setEmployees(r)).catch(() => {});
  }, []);

  const resolve = useCallback(async (tId: string, eId: string, ov: Record<string, string>) => {
    if (!tId || !eId) { setResolved(null); return; }
    const my = ++reqId.current;
    setResolving(true);
    try {
      const r = await api.post<ResolveResult>('/contract-templates/resolve', { templateId: tId, employeeId: eId, overrides: ov });
      if (my !== reqId.current) return;
      setResolved(r);
      setDraft(Object.fromEntries(r.variables.map((v) => [v.key, v.value])));
    } catch (e: any) {
      if (my === reqId.current) showError('Calcul impossible', e?.message || '');
    } finally {
      if (my === reqId.current) setResolving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changer de modèle ou d'employé repart de zéro
  useEffect(() => { setOverrides({}); setDone(null); setPdfUrl(null); resolve(templateId, employeeId, {}); }, [templateId, employeeId, resolve]);

  const commit = (key: string) => {
    const server = resolved?.variables.find((v) => v.key === key)?.value ?? '';
    if ((draft[key] ?? '') === server) return;
    const next = { ...overrides, [key]: draft[key] ?? '' };
    setOverrides(next);
    resolve(templateId, employeeId, next);
  };

  const groups = useMemo(() => {
    const map = new Map<string, ResolvedVariable[]>();
    for (const v of resolved?.variables || []) map.set(v.group, [...(map.get(v.group) || []), v]);
    // les champs manquants / à saisir d'abord
    return [...map.entries()].sort((a, b) => Number(b[1].some((x) => x.missing)) - Number(a[1].some((x) => x.missing)));
  }, [resolved]);

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => !q || `${e.firstName} ${e.lastName} ${e.employeeNumber}`.toLowerCase().includes(q)).slice(0, 50);
  }, [employees, search]);

  const missing = resolved?.missingCount ?? 0;

  const generate = async () => {
    setGenerating(true);
    try {
      // Valeurs d'entreprise saisies ici (sigle, NIU, capital…) : enregistrées UNE fois → automatiques ensuite
      const toRemember = (resolved?.variables || []).filter(
        (v) => SAVABLE_SOURCES.includes(v.source) && v.overridden && !noRemember[v.key] && (overrides[v.key] ?? '').trim(),
      );
      for (const v of toRemember) {
        try { await api.post('/contract-templates/defaults', { key: v.key, value: overrides[v.key] }); } catch { /* non bloquant */ }
      }
      const c = await api.post<{ id: string; name: string }>('/contract-templates/generate', { templateId, employeeId, overrides });
      setDone(c);
      success('Contrat généré', 'Téléchargez-le en Word ou en PDF.');
      const blob = await api.getBlob(`/contract-templates/contracts/${c.id}/pdf`);
      setPdfUrl(URL.createObjectURL(blob));
    } catch (e: any) {
      showError('Génération impossible', e?.message || '');
    } finally {
      setGenerating(false);
    }
  };

  const download = async (kind: 'docx' | 'pdf') => {
    if (!done) return;
    setBusy(kind);
    try {
      const blob = await api.getBlob(`/contract-templates/contracts/${done.id}/${kind}${kind === 'pdf' ? '?download=1' : ''}`);
      saveBlob(blob, `${done.name}.${kind}`);
    } catch (e: any) { showError('Téléchargement impossible', e?.message || ''); }
    finally { setBusy(null); }
  };

  return (
    <ModulePageFrame kind="detail">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push(bp('/contrats/modeles'))} className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><ArrowLeft className="w-4 h-4" /></button>
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Générer un contrat</h1>
            <p className="text-sm text-[var(--text-muted)]">Les informations se remplissent toutes seules depuis la fiche employé et l'entreprise.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold text-[var(--text-muted)]">1. Modèle de contrat</span>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-3 py-2 text-sm">
              <option value="">— Choisir un modèle —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {templates.length === 0 && (
              <span className="mt-1 block text-[11px] text-[var(--text-muted)]">Aucun modèle à vous pour l'instant : importez votre contrat ou copiez une base Konza depuis « Modèles de contrat ».</span>
            )}
          </label>
          <div>
            <span className="text-xs font-bold text-[var(--text-muted)]">2. Employé</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un employé…"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-3 py-2 text-sm" />
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} size={4}
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-2 py-1 text-sm">
              {filteredEmployees.map((e) => <option key={e.id} value={e.id}>{e.lastName} {e.firstName} — {e.position}</option>)}
            </select>
          </div>
        </div>

        {(() => {
          const sel = templates.find((t) => t.id === templateId);
          return sel?.settings?.fromSystemTemplate && !sel.settings.legalReviewed ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Ce modèle vient d'une base Konza RH, commune à toutes les entreprises, et n'est pas marqué « relu par un juriste ». Faites-le relire avant de l'utiliser avec vos salariés.</span>
            </div>
          ) : null;
        })()}

        {resolving && !resolved && <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[var(--brand)]" /></div>}

        {resolved && !done && (
          <>
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${missing ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'}`}>
              {missing ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              {missing ? `${missing} information${missing > 1 ? 's' : ''} à compléter avant de générer` : 'Tout est rempli — vous pouvez générer le contrat'}
              {resolving && <Loader2 className="w-4 h-4 animate-spin ml-auto" />}
            </div>

            {groups.map(([group, vars]) => (
              <section key={group} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
                <h3 className="text-sm font-bold text-[var(--text)]">{group}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {vars.map((v) => (
                    <label key={v.key} className="block">
                      <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--text)]">{v.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${SOURCE_BADGE[v.source] || ''}`}>{SOURCE_LABEL[v.source] || v.source}</span>
                        {v.overridden && <span className="text-[10px] text-amber-600">modifié</span>}
                      </span>
                      <input value={draft[v.key] ?? ''} onChange={(e) => setDraft({ ...draft, [v.key]: e.target.value })}
                        onBlur={() => commit(v.key)}
                        placeholder={v.missing ? 'À compléter' : ''}
                        className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm bg-[var(--surface)] text-[var(--text)] ${v.missing ? 'border-red-400 ring-1 ring-red-300' : 'border-[var(--border)]'}`} />
                      {SAVABLE_SOURCES.includes(v.source) && (v.missing || v.overridden) && (
                        <span className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                          <input type="checkbox" checked={!noRemember[v.key]}
                            onChange={(e) => setNoRemember({ ...noRemember, [v.key]: !e.target.checked })} />
                          Retenir pour tous les prochains contrats de l'entreprise
                        </span>
                      )}
                      {v.source === 'EMPLOYEE' && v.missing && (
                        <span className="mt-1 block text-[11px] text-[var(--text-muted)]">
                          Absent de la fiche de l'employé : saisi pour ce contrat seulement. Complétez la fiche pour que ce soit automatique.
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </section>
            ))}

            <div className="flex justify-end">
              <button onClick={generate} disabled={generating || missing > 0 || resolving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white font-semibold disabled:opacity-50">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />} Générer le contrat
              </button>
            </div>
          </>
        )}

        {done && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-emerald-300/50 bg-emerald-50 dark:bg-emerald-900/20 p-4 flex flex-wrap items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div className="flex-1 min-w-[200px]">
                <div className="font-bold text-[var(--text)]">Contrat prêt</div>
                <div className="text-xs text-[var(--text-muted)]">{done.name}</div>
              </div>
              <button onClick={() => download('docx')} disabled={busy === 'docx'} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold">
                {busy === 'docx' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Word
              </button>
              <button onClick={() => download('pdf')} disabled={busy === 'pdf'} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text)]">
                {busy === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} PDF
              </button>
              <button onClick={() => { setDone(null); setPdfUrl(null); resolve(templateId, employeeId, overrides); }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)]">
                <RefreshCcw className="w-4 h-4" /> Un autre
              </button>
            </div>
            {pdfUrl && <iframe src={pdfUrl} title="Aperçu du contrat" className="w-full h-[80vh] rounded-xl border border-[var(--border)] bg-white" />}
          </div>
        )}
      </div>
    </ModulePageFrame>
  );
}

export default function GenerateFromTemplatePage() {
  return (
    <Suspense fallback={<div className="p-10 flex justify-center"><KonzaLoader /></div>}>
      <Content />
    </Suspense>
  );
}