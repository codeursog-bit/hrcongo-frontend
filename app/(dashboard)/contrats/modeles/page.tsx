'use client';

// ============================================================================
// 📁 app/(dashboard)/contrats/modeles/page.tsx
// Mes modèles de contrat (système Konza + ceux de l'entreprise) et les
// contrats générés à partir de ces modèles. Aucun fichier stocké : tout est
// refabriqué à la demande (Word / PDF).
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FilePlus2, FileText, Lock, Pencil, Trash2, Copy, Eye, Download, Loader2, FileSignature, Wand2,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { useBasePath } from '@/hooks/useBasePath';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';
import SystemTemplateNotice from '@/components/contracts/SystemTemplateNotice';
import { CATEGORIES, TemplateListItem, saveBlob } from '@/lib/contract-templates';

interface GeneratedItem {
  id: string;
  name: string;
  generatedAt: string;
  employee: { id: string; firstName: string; lastName: string; position: string } | null;
}

const catLabel = (c: string) => CATEGORIES.find((x) => x.value === c)?.label || c;

export default function ContractTemplatesListPage() {
  const router = useRouter();
  const { bp } = useBasePath();
  const { success, error: showError } = useAlert();

  const [tab, setTab] = useState<'modeles' | 'generes'>('modeles');
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [contracts, setContracts] = useState<GeneratedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<TemplateListItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([
        api.get<TemplateListItem[]>('/contract-templates'),
        api.get<GeneratedItem[]>('/contract-templates/contracts'),
      ]);
      setTemplates(t);
      setContracts(c);
    } catch (e: any) {
      showError('Chargement impossible', e?.message || '');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { load(); }, [load]);

  const copyFromSystem = async () => {
    if (!notice) return;
    setBusyId(notice.id);
    try {
      const copy = await api.post<{ id: string }>(`/contract-templates/${notice.id}/duplicate`, {});
      setNotice(null);
      router.push(bp(`/contrats/modeles/${copy.id}`));
    } catch (e: any) {
      showError('Erreur', e?.message || '');
    } finally {
      setBusyId(null);
    }
  };

  const duplicate = async (t: TemplateListItem) => {
    setBusyId(t.id);
    try {
      await api.post(`/contract-templates/${t.id}/duplicate`, {});
      success('Modèle dupliqué');
      load();
    } catch (e: any) { showError('Erreur', e?.message || ''); }
    finally { setBusyId(null); }
  };

  const removeTemplate = async (t: TemplateListItem) => {
    if (!window.confirm(`Supprimer le modèle « ${t.name} » ? Les contrats déjà générés ne sont pas affectés.`)) return;
    setBusyId(t.id);
    try { await api.delete(`/contract-templates/${t.id}`); success('Modèle supprimé'); load(); }
    catch (e: any) { showError('Erreur', e?.message || ''); }
    finally { setBusyId(null); }
  };

  const removeContract = async (c: GeneratedItem) => {
    if (!window.confirm(`Supprimer « ${c.name} » ?`)) return;
    setBusyId(c.id);
    try { await api.delete(`/contract-templates/contracts/${c.id}`); success('Contrat supprimé'); load(); }
    catch (e: any) { showError('Erreur', e?.message || ''); }
    finally { setBusyId(null); }
  };

  const download = async (c: GeneratedItem, kind: 'docx' | 'pdf') => {
    setBusyId(c.id + kind);
    try {
      const blob = await api.getBlob(`/contract-templates/contracts/${c.id}/${kind}${kind === 'pdf' ? '?download=1' : ''}`);
      saveBlob(blob, `${c.name}.${kind}`);
    } catch (e: any) { showError('Téléchargement impossible', e?.message || ''); }
    finally { setBusyId(null); }
  };

  const openPdf = async (c: GeneratedItem) => {
    setBusyId(c.id + 'view');
    try {
      const blob = await api.getBlob(`/contract-templates/contracts/${c.id}/pdf`);
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (e: any) { showError('Aperçu impossible', e?.message || ''); }
    finally { setBusyId(null); }
  };

  if (loading) return <div className="p-10 flex justify-center"><KonzaLoader /></div>;

  const system = templates.filter((t) => t.isSystem);
  const mine = templates.filter((t) => !t.isSystem);

  const Card = ({ t }: { t: TemplateListItem }) => (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">{t.isSystem ? <Lock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-[var(--text)] truncate">{t.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">{catLabel(t.category)}</span>
            {t.isSystem && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Base Konza · à adapter</span>}
            {!t.isSystem && t.settings?.fromSystemTemplate && !t.settings?.legalReviewed && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">À faire relire</span>}
            {!t.isSystem && t.settings?.legalReviewed && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Relu</span>}
          </div>
          {t.description && <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">{t.description}</p>}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-auto">
        {t.isSystem ? (
          <>
            <button onClick={() => setNotice(t)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold"><Copy className="w-3.5 h-3.5" /> Utiliser ce modèle</button>
            <button onClick={() => router.push(bp(`/contrats/modeles/${t.id}`))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text)] hover:bg-[var(--surface-2)]"><Eye className="w-3.5 h-3.5" /> Lire</button>
          </>
        ) : (
          <>
            <button onClick={() => router.push(bp(`/contrats/modeles/generer?templateId=${t.id}`))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold"><FileSignature className="w-3.5 h-3.5" /> Générer un contrat</button>
            <button onClick={() => router.push(bp(`/contrats/modeles/${t.id}`))} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text)] hover:bg-[var(--surface-2)]"><Pencil className="w-3.5 h-3.5" /> Modifier</button>
            <button onClick={() => duplicate(t)} disabled={busyId === t.id} title="Dupliquer" className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><Copy className="w-3.5 h-3.5" /></button>
            <button onClick={() => removeTemplate(t)} disabled={busyId === t.id} title="Supprimer" className="p-1.5 rounded-lg border border-[var(--border)] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <ModulePageFrame kind="list">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]">Modèles de contrat</h1>
            <p className="text-sm text-[var(--text-muted)]">Collez votre contrat une fois, placez les variables, puis générez-le pour chaque employé en Word et PDF.</p>
          </div>
          <button onClick={() => router.push(bp('/contrats/modeles/nouveau'))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold"><FilePlus2 className="w-4 h-4" /> Nouveau modèle</button>
        </div>

        <div className="flex gap-1 border-b border-[var(--border)]">
          {([['modeles', `Modèles (${templates.length})`], ['generes', `Contrats générés (${contracts.length})`]] as const).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px ${tab === k ? 'border-[var(--brand)] text-[var(--brand)]' : 'border-transparent text-[var(--text-muted)]'}`}>{label}</button>
          ))}
        </div>

        {tab === 'modeles' ? (
          <>
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--text)]">Mes modèles</h2>
              {mine.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-8 text-center space-y-3">
                  <Wand2 className="w-8 h-8 mx-auto text-[var(--brand)]" />
                  <p className="text-sm text-[var(--text)] font-semibold">Vous n'avez pas encore de modèle</p>
                  <p className="text-xs text-[var(--text-muted)]">Importez le contrat que vous utilisez déjà (Word), ou partez d'une base Konza que vous adapterez.</p>
                  <button onClick={() => router.push(bp('/contrats/modeles/nouveau'))} className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold">Créer mon premier modèle</button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{mine.map((t) => <Card key={t.id} t={t} />)}</div>
              )}
            </section>
            {system.length > 0 && (
              <section className="space-y-3">
                <div><h2 className="text-sm font-bold text-[var(--text)]">Bases proposées par Konza RH</h2><p className="text-xs text-[var(--text-muted)] mt-0.5">Identiques pour toutes les entreprises : copiez-en une, adaptez-la, puis faites-la relire par un juriste avant usage.</p></div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{system.map((t) => <Card key={t.id} t={t} />)}</div>
              </section>
            )}
          </>
        ) : contracts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-10">Aucun contrat généré avec les modèles pour l'instant.</p>
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
            {contracts.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-[var(--text)] truncate">{c.name}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {c.employee ? `${c.employee.firstName} ${c.employee.lastName} · ` : ''}{new Date(c.generatedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <button onClick={() => openPdf(c)} disabled={busyId === c.id + 'view'} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text)] hover:bg-[var(--surface-2)]">
                  {busyId === c.id + 'view' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />} Voir
                </button>
                <button onClick={() => download(c, 'docx')} disabled={busyId === c.id + 'docx'} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text)] hover:bg-[var(--surface-2)]">
                  {busyId === c.id + 'docx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Word
                </button>
                <button onClick={() => download(c, 'pdf')} disabled={busyId === c.id + 'pdf'} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--text)] hover:bg-[var(--surface-2)]">
                  {busyId === c.id + 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} PDF
                </button>
                <button onClick={() => removeContract(c)} disabled={busyId === c.id} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {notice && <SystemTemplateNotice name={notice.name} busy={busyId === notice.id} onConfirm={copyFromSystem} onCancel={() => setNotice(null)} />}
    </ModulePageFrame>
  );
}