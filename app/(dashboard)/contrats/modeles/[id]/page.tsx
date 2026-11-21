'use client';

// ============================================================================
// 📁 app/(dashboard)/contrats/modeles/[id]/page.tsx
// Édition d'un modèle de contrat. /contrats/modeles/nouveau = modèle vierge
// (on y colle le contrat du client). Un modèle SYSTÈME s'ouvre en lecture seule.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Loader2, Lock, Copy, X, FileUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import { useBasePath } from '@/hooks/useBasePath';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';
import SystemTemplateNotice from '@/components/contracts/SystemTemplateNotice';
import {
  CATEGORIES, DEFAULT_SETTINGS, EMPTY_DOC, ImportDocxResult, TemplateFull, TemplateSettings,
} from '@/lib/contract-templates';

// TipTap n'a pas besoin du rendu serveur
const ContractEditor = dynamic(() => import('@/components/contracts/contract-editor/ContractEditor'), { ssr: false });

export default function ContractTemplateEditPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { bp } = useBasePath();
  const { success, error: showError } = useAlert();
  const isNew = id === 'nouveau';

  const [loading, setLoading] = useState(!isNew);
  const [tpl, setTpl] = useState<TemplateFull | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('CDI');
  const [description, setDescription] = useState('');
  const [settings, setSettings] = useState<TemplateSettings>(DEFAULT_SETTINGS);
  const [initial, setInitial] = useState<any>(EMPTY_DOC);
  const contentRef = useRef<any>(EMPTY_DOC);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [askCopy, setAskCopy] = useState(false);
  const [copying, setCopying] = useState(false);
  // Import Word : le fichier est envoyé, lu en mémoire par le serveur puis jeté (jamais stocké)
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [importInfo, setImportInfo] = useState<ImportDocxResult | null>(null);
  const [hasContent, setHasContent] = useState(false);

  const readOnly = !!tpl?.isSystem;

  useEffect(() => {
    if (isNew) return;
    api.get<TemplateFull>(`/contract-templates/${id}`)
      .then((t) => {
        setTpl(t);
        setName(t.name);
        setCategory(t.category);
        setDescription(t.description || '');
        setSettings({ ...DEFAULT_SETTINGS, ...(t.settings || {}) });
        setInitial(t.content || EMPTY_DOC);
        contentRef.current = t.content || EMPTY_DOC;
        setHasContent(true);
      })
      .catch((e: any) => { showError('Modèle introuvable', e?.message || ''); router.push(bp('/contrats/modeles')); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Prévient si on quitte avec des modifications non enregistrées
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const save = async (): Promise<string | null> => {
    if (name.trim().length < 2) { showError('Nom requis', 'Donnez un nom à ce modèle.'); return null; }
    setSaving(true);
    try {
      const body = { name, category, description, content: contentRef.current, settings };
      if (isNew) {
        const created = await api.post<TemplateFull>('/contract-templates', body);
        setDirty(false);
        success('Modèle créé', 'Vous pouvez maintenant l\'utiliser pour générer des contrats.');
        router.replace(bp(`/contrats/modeles/${created.id}`));
        return created.id;
      }
      await api.put(`/contract-templates/${id}`, body);
      setDirty(false);
      success('Modèle enregistré');
      return id;
    } catch (e: any) {
      showError('Enregistrement impossible', e?.message || '');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const preview = async () => {
    const savedId = dirty || isNew ? await save() : id;
    if (!savedId) return;
    setPreviewing(true);
    try {
      const blob = await api.getBlob(`/contract-templates/${savedId}/preview-pdf`);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e: any) {
      showError('Aperçu impossible', e?.message || '');
    } finally {
      setPreviewing(false);
    }
  };

  const makeCopy = async () => {
    setCopying(true);
    try {
      const copy = await api.post<TemplateFull>(`/contract-templates/${id}/duplicate`, {});
      success('Copie créée', 'Vous pouvez maintenant la modifier.');
      router.replace(bp(`/contrats/modeles/${copy.id}`));
    } catch (e: any) {
      showError('Erreur', e?.message || '');
    } finally {
      setCopying(false);
    }
  };

  const importWord = async (file: File) => {
    if (!/\.docx$/i.test(file.name)) {
      showError('Format non accepté', 'Importez un fichier Word (.docx). Pour un PDF, copiez-collez son texte dans l\'éditeur.');
      return;
    }
    if (hasContent && !window.confirm('Remplacer le contenu actuel du modèle par ce fichier Word ?')) return;
    const fd = new FormData();
    fd.append('file', file);
    setImporting(true);
    try {
      const r = await api.postFormData<ImportDocxResult>('/contract-templates/import-docx', fd);
      contentRef.current = r.content;
      setInitial(r.content);
      setSettings({ ...DEFAULT_SETTINGS, ...r.settings });
      setImportInfo(r);
      setHasContent(true);
      setDirty(true);
      if (!name.trim()) setName(file.name.replace(/\.docx$/i, ''));
      setEditorKey((k) => k + 1); // recharge l'éditeur avec le contenu importé
      success('Fichier Word importé', r.stats.gaps > 0
        ? `${r.stats.gaps} champ(s) « ………… » à remplacer par des variables.`
        : 'Placez maintenant les variables depuis le panneau de droite.');
    } catch (e: any) {
      showError('Import impossible', e?.message || 'Le fichier n\'a pas pu être lu.');
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) importWord(f);
  };

  if (loading) return <div className="p-10 flex justify-center"><KonzaLoader /></div>;

  return (
    <ModulePageFrame kind="detail">
      <div className="space-y-4">
        {/* En-tête */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => router.push(bp('/contrats/modeles'))}
            className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)]"><ArrowLeft className="w-4 h-4" /></button>
          <div className="flex-1 min-w-[220px]">
            <input value={name} disabled={readOnly} onChange={(e) => { setName(e.target.value); setDirty(true); }}
              placeholder="Nom du modèle (ex. CDD — Papagallo)"
              className="w-full text-lg font-bold bg-transparent text-[var(--text)] outline-none border-b border-transparent focus:border-[var(--brand)] disabled:opacity-70" />
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <select value={category} disabled={readOnly} onChange={(e) => { setCategory(e.target.value); setDirty(true); }}
                className="text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-2 py-1">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input value={description} disabled={readOnly} onChange={(e) => { setDescription(e.target.value); setDirty(true); }}
                placeholder="Description (facultatif)" className="flex-1 min-w-[160px] text-xs bg-transparent text-[var(--text-muted)] outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <button onClick={() => fileRef.current?.click()} disabled={importing}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--surface-2)] disabled:opacity-50">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />} Importer un Word
              </button>
            )}
            <button onClick={preview} disabled={previewing || saving}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--text)] hover:bg-[var(--surface-2)] disabled:opacity-50">
              {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Aperçu PDF
            </button>
            {readOnly ? (
              <button onClick={() => setAskCopy(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold"><Copy className="w-4 h-4" /> Utiliser ce modèle</button>
            ) : (
              <button onClick={save} disabled={saving || (!dirty && !isNew)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
              </button>
            )}
          </div>
        </div>

        {readOnly && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            <Lock className="w-4 h-4 shrink-0" /> Modèle Konza RH en lecture seule : une base commune à toutes les entreprises. Cliquez sur « Utiliser ce modèle » pour en créer votre copie, à adapter puis à faire relire par un juriste.
          </div>
        )}
        <input ref={fileRef} type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importWord(f); }} />

        {!readOnly && settings.fromSystemTemplate && !settings.legalReviewed && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Ce modèle vient d'une base Konza RH, identique pour toutes les entreprises. Adaptez-le à votre activité et faites-le relire par un juriste ; cochez ensuite « relu par un juriste » dans les paramètres <span className="font-semibold">(roue dentée)</span> de l'éditeur.</span>
          </div>
        )}

        {isNew && !hasContent && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed p-6 text-center space-y-3 transition-colors ${dragOver ? 'border-[var(--brand)] bg-[var(--brand-soft)]' : 'border-[var(--border)] bg-[var(--surface)]'}`}
          >
            <FileUp className="w-8 h-8 mx-auto text-[var(--brand)]" />
            <div>
              <p className="font-bold text-[var(--text)]">Vous avez déjà votre contrat ? Importez-le.</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Glissez votre fichier Word (.docx) ici. Il est lu puis supprimé : rien n'est conservé sur nos serveurs.
                Titres, gras, listes, tableaux et sauts de page sont repris tels quels.
              </p>
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={importing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-sm font-semibold disabled:opacity-60">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />} Choisir un fichier Word
            </button>
            <p className="text-xs text-[var(--text-muted)]">
              Votre contrat est en PDF ? Copiez son texte et collez-le directement dans l'éditeur ci-dessous (Ctrl+V), puis utilisez « Nettoyer (PDF) ».
            </p>
          </div>
        )}

        {importInfo && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1 text-sm text-[var(--text)]">
                <strong>Fichier importé</strong> — {importInfo.stats.paragraphs} paragraphes, {importInfo.stats.tables} tableau(x), {importInfo.stats.lists} liste(s).
                {importInfo.stats.gaps > 0
                  ? <> Cliquez sur les <span className="px-1 rounded bg-amber-200 text-amber-900">«&nbsp;…………&nbsp;»</span> surlignés (ou sur « Champ suivant ») pour choisir la variable à y placer.</>
                  : <> Placez les variables depuis le panneau de droite, aux endroits à compléter.</>}
              </div>
              <button onClick={() => setImportInfo(null)} className="p-1 text-[var(--text-muted)]"><X className="w-3.5 h-3.5" /></button>
            </div>
            {importInfo.warnings.length > 0 && (
              <ul className="space-y-1 pl-6">
                {importInfo.warnings.map((w, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <ContractEditor
          key={`${tpl?.id || 'new'}-${editorKey}`}
          initialContent={initial}
          settings={settings}
          editable={!readOnly}
          onChange={(json) => { contentRef.current = json; setDirty(true); setHasContent(true); }}
          onSettingsChange={(s) => { setSettings(s); setDirty(true); }}
        />
      </div>

      {askCopy && tpl && (
        <SystemTemplateNotice name={tpl.name} busy={copying} onConfirm={makeCopy} onCancel={() => setAskCopy(false)} />
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-white">Aperçu avec des données d'exemple</span>
            <button onClick={() => { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
              className="p-2 rounded-xl bg-white/10 text-white hover:bg-white/20"><X className="w-4 h-4" /></button>
          </div>
          <iframe src={previewUrl} className="flex-1 w-full rounded-xl bg-white" title="Aperçu du modèle" />
        </div>
      )}
    </ModulePageFrame>
  );
}