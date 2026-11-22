'use client';

// ============================================================================
// 📁 components/contracts/contract-editor/ContractEditor.tsx
//
// Éditeur de modèle de contrat : on COLLE le contrat (Word → gras/italique/
// alignement/tableaux conservés ; PDF → texte brut), puis on place les
// variables depuis le panneau (ou en cliquant les « ………… » surlignés).
// Le contenu est du JSON (TipTap) — aucun fichier.
// ============================================================================

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table2, Undo2, Redo2, SeparatorHorizontal, Search, Plus, X, Wand2,
  Crosshair, Trash2, Rows3, Columns3, Settings2,
} from 'lucide-react';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';
import {
  CatalogVariable, TemplateSettings, DEFAULT_SETTINGS, FONT_CHOICES, SOURCE_LABEL, slugKey,
} from '@/lib/contract-templates';
import { Variable, PageBreak, GapHighlight, findGaps, joinBrokenLines } from './extensions';
import './editor.css';

interface Props {
  initialContent: any;
  settings: TemplateSettings;
  editable?: boolean;
  onChange: (json: any) => void;
  onSettingsChange: (s: TemplateSettings) => void;
}

const SOURCE_DOT: Record<string, string> = {
  EMPLOYEE: 'bg-sky-500', COMPANY: 'bg-violet-500', LEGAL: 'bg-amber-500',
  COMPUTED: 'bg-emerald-500', MANUAL: 'bg-rose-500', CUSTOM: 'bg-slate-500',
};

const EditableCtx = React.createContext(true);

/** Bouton de la barre d'outils — défini HORS du composant pour ne pas être recréé (et remonté) à chaque rendu. */
function Btn({ onClick, active, disabled, title, children }: any) {
  const editable = React.useContext(EditableCtx);
  return (
    <button
      type="button" title={title} disabled={disabled || !editable}
      onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className={`p-1.5 rounded-lg text-sm transition-colors disabled:opacity-40 ${
        active ? 'bg-[var(--brand-soft)] text-[var(--brand)]' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
      }`}
    >
      {children}
    </button>
  );
}
function Sep() {
  return <span className="w-px h-5 bg-[var(--border)] mx-1" />;
}

export default function ContractEditor({ initialContent, settings, editable = true, onChange, onSettingsChange }: Props) {
  // ⚠️ La classe « loan-document-protected » (racine ci-dessous) empêche le cadre de page
  // (LoanModuleFrame) d'« annoter » les tableaux de l'éditeur : ses observateurs entraient
  // en boucle infinie avec ceux de ProseMirror et gelaient tout le navigateur.
  const { success, error: showError } = useAlert();
  const [catalog, setCatalog] = useState<CatalogVariable[]>([]);
  const [query, setQuery] = useState('');
  const [picker, setPicker] = useState<{ from: number; to: number; x: number; y: number } | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customForm, setCustomForm] = useState({ label: '', value: '' });
  const [savingCustom, setSavingCustom] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadCatalog = useCallback(() => {
    api.get<CatalogVariable[]>('/contract-templates/variables').then(setCatalog).catch(() => {});
  }, []);
  useEffect(loadCatalog, [loadCatalog]);

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    content: initialContent,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // Ce que le serveur n'accepte pas n'est même pas proposé :
        codeBlock: false, code: false, blockquote: false, strike: false, horizontalRule: false,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'], alignments: ['left', 'center', 'right', 'justify'] }),
      Table.configure({ resizable: false }),
      TableRow, TableHeader, TableCell,
      Variable, PageBreak, GapHighlight,
    ],
    editorProps: {
      handleClick(view, _pos, event) {
        const el = (event.target as HTMLElement)?.closest?.('.ct-gap') as HTMLElement | null;
        if (!el) return false;
        const from = Number(el.dataset.from);
        const to = Number(el.dataset.to);
        const rect = el.getBoundingClientRect();
        const host = wrapRef.current?.getBoundingClientRect();
        setPicker({ from, to, x: rect.left - (host?.left || 0), y: rect.bottom - (host?.top || 0) + 6 });
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  useEffect(() => { editor?.setEditable(editable); }, [editor, editable]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = catalog.filter((v) => !q || v.label.toLowerCase().includes(q) || v.key.includes(q));
    const map = new Map<string, CatalogVariable[]>();
    for (const v of list) map.set(v.group, [...(map.get(v.group) || []), v]);
    return [...map.entries()];
  }, [catalog, query]);

  const insertVariable = (key: string) => {
    if (!editor || !editable) return;
    if (picker) {
      editor.chain().focus().insertContentAt({ from: picker.from, to: picker.to }, { type: 'variable', attrs: { key } }).run();
      setPicker(null);
    } else {
      editor.chain().focus().insertContent({ type: 'variable', attrs: { key } }).run();
    }
  };

  /** Va au prochain « ………… » (en partant du curseur) et ouvre la liste de variables dessus. */
  const nextGap = () => {
    if (!editor) return;
    const gaps = findGaps(editor.state.doc);
    if (!gaps.length) { success('Aucun champ à compléter', 'Tous les « ………… » sont remplacés.'); return; }
    const cur = editor.state.selection.from;
    const g = gaps.find((x) => x.from >= cur) || gaps[0];
    editor.chain().focus().setTextSelection({ from: g.from, to: g.to }).scrollIntoView().run();
    requestAnimationFrame(() => {
      const el = wrapRef.current?.querySelector(`.ct-gap[data-from="${g.from}"]`) as HTMLElement | null;
      const rect = el?.getBoundingClientRect();
      const host = wrapRef.current?.getBoundingClientRect();
      if (rect) setPicker({ from: g.from, to: g.to, x: rect.left - (host?.left || 0), y: rect.bottom - (host?.top || 0) + 6 });
    });
  };

  const cleanBreaks = () => {
    if (!editor) return;
    editor.commands.setContent(joinBrokenLines(editor.getJSON()), true);
    success('Retours à la ligne nettoyés', 'Les lignes coupées au milieu d\'une phrase ont été recollées.');
  };

  const saveCustomVar = async () => {
    const label = customForm.label.trim();
    const key = slugKey(label);
    if (!label || key.length < 2) { showError('Nom requis', 'Donnez un nom à la variable (ex. Sigle de l\'entreprise).'); return; }
    setSavingCustom(true);
    try {
      await api.post('/contract-templates/custom-variables', { key, label, value: customForm.value });
      setCustomForm({ label: '', value: '' });
      setShowCustom(false);
      loadCatalog();
      success('Variable ajoutée', `{${key}} est maintenant disponible dans tous vos modèles.`);
    } catch (e: any) {
      showError('Erreur', e?.message || 'Impossible d\'ajouter la variable');
    } finally {
      setSavingCustom(false);
    }
  };

  if (!editor) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center text-sm text-[var(--text-muted)]">
        Préparation de l'éditeur…
      </div>
    );
  }
  const inTable = editor.isActive('table');
  const gapCount = findGaps(editor.state.doc).length;

  return (
    <EditableCtx.Provider value={editable}>
    <div className="flex flex-col lg:flex-row gap-4 items-start loan-document-protected" ref={wrapRef}>
      {/* ── Feuille + barre d'outils ───────────────────────────────────────── */}
      <div className="flex-1 min-w-0 w-full relative">
        <div className="sticky top-0 z-20 mb-3 flex flex-wrap items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 shadow-sm">
          <Btn title="Annuler" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 className="w-4 h-4" /></Btn>
          <Btn title="Rétablir" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 className="w-4 h-4" /></Btn>
          <Sep />
          <select
            disabled={!editable}
            value={editor.isActive('heading', { level: 1 }) ? '1' : editor.isActive('heading', { level: 2 }) ? '2' : editor.isActive('heading', { level: 3 }) ? '3' : '0'}
            onChange={(e) => {
              const v = Number(e.target.value);
              const c = editor.chain().focus();
              v === 0 ? c.setParagraph().run() : c.setHeading({ level: v as 1 | 2 | 3 }).run();
            }}
            className="text-xs rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-2 py-1"
          >
            <option value="0">Texte</option>
            <option value="1">Titre 1</option>
            <option value="2">Titre 2</option>
            <option value="3">Titre 3</option>
          </select>
          <Sep />
          <Btn title="Gras" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></Btn>
          <Btn title="Italique" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></Btn>
          <Btn title="Souligné" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4" /></Btn>
          <Sep />
          <Btn title="Aligner à gauche" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="w-4 h-4" /></Btn>
          <Btn title="Centrer" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="w-4 h-4" /></Btn>
          <Btn title="Aligner à droite" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="w-4 h-4" /></Btn>
          <Btn title="Justifier" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify className="w-4 h-4" /></Btn>
          <Sep />
          <Btn title="Liste à puces" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></Btn>
          <Btn title="Liste numérotée" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></Btn>
          <Btn title="Insérer un tableau" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run()}><Table2 className="w-4 h-4" /></Btn>
          {inTable && (
            <>
              <Btn title="Ajouter une ligne" onClick={() => editor.chain().focus().addRowAfter().run()}><Rows3 className="w-4 h-4" /></Btn>
              <Btn title="Ajouter une colonne" onClick={() => editor.chain().focus().addColumnAfter().run()}><Columns3 className="w-4 h-4" /></Btn>
              <Btn title="Supprimer le tableau" onClick={() => editor.chain().focus().deleteTable().run()}><Trash2 className="w-4 h-4" /></Btn>
            </>
          )}
          <Btn title="Saut de page" onClick={() => editor.chain().focus().insertContent({ type: 'pageBreak' }).run()}><SeparatorHorizontal className="w-4 h-4" /></Btn>
          <Sep />
          <button
            type="button" onClick={nextGap} disabled={!editable}
            title="Aller au prochain champ « ………… » à remplacer par une variable"
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 disabled:opacity-40"
          >
            <Crosshair className="w-3.5 h-3.5" /> Champ suivant{gapCount > 0 && <span className="font-bold">({gapCount})</span>}
          </button>
          <button
            type="button" onClick={cleanBreaks} disabled={!editable}
            title="Texte collé depuis un PDF : recolle les lignes coupées en plein milieu d'une phrase"
            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-2)] disabled:opacity-40"
          >
            <Wand2 className="w-3.5 h-3.5" /> Nettoyer (PDF)
          </button>
          <div className="ml-auto relative">
            <Btn title="Police, taille, en-tête" active={showSettings} onClick={() => setShowSettings((s) => !s)}><Settings2 className="w-4 h-4" /></Btn>
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 z-30 w-64 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-xl space-y-3 text-sm">
                <label className="block">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Police</span>
                  <select value={settings.fontFamily} onChange={(e) => onSettingsChange({ ...settings, fontFamily: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] px-2 py-1.5">
                    {(FONT_CHOICES.includes(settings.fontFamily) ? FONT_CHOICES : [settings.fontFamily, ...FONT_CHOICES]).map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-[var(--text-muted)]">Taille du texte : {settings.fontSize} pt</span>
                  <input type="range" min={9} max={14} step={0.5} value={settings.fontSize}
                    onChange={(e) => onSettingsChange({ ...settings, fontSize: Number(e.target.value) })} className="mt-1 w-full" />
                </label>
                {settings.fromSystemTemplate && (
                  <label className="flex items-start gap-2 rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 p-2">
                    <input type="checkbox" checked={!!settings.legalReviewed} disabled={!editable}
                      onChange={(e) => onSettingsChange({ ...settings, legalReviewed: e.target.checked })} className="mt-0.5" />
                    <span className="text-xs text-[var(--text)]">J'ai adapté ce modèle à mon entreprise et il a été relu par un juriste
                      <span className="block text-[var(--text-muted)]">Modèle issu d'une base Konza RH, commune à toutes les entreprises.</span></span>
                  </label>
                )}
                <label className="flex items-start gap-2">
                  <input type="checkbox" checked={settings.letterhead} onChange={(e) => onSettingsChange({ ...settings, letterhead: e.target.checked })} className="mt-0.5" />
                  <span className="text-xs text-[var(--text)]">Ajouter le logo en en-tête et les coordonnées de l'entreprise en pied de page
                    <span className="block text-[var(--text-muted)]">À décocher si votre modèle a déjà sa propre page de garde.</span></span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="ct-sheet" style={{ fontFamily: `'${settings.fontFamily}', serif`, fontSize: `${settings.fontSize * 1.333}px` }}>
          <EditorContent editor={editor} />
        </div>

        {/* Sélecteur de variable posé sur un champ « ………… » */}
        {picker && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setPicker(null)} />
            <div className="absolute z-40 w-72 max-h-80 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl p-2"
              style={{ left: Math.max(0, Math.min(picker.x, 420)), top: picker.y }}>
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-xs font-bold text-[var(--text)]">Quelle information ici ?</span>
                <button onClick={() => setPicker(null)} className="p-1 text-[var(--text-muted)]"><X className="w-3.5 h-3.5" /></button>
              </div>
              <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher (ex. salaire, naissance…)"
                className="w-full mb-1 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] px-2 py-1.5 text-xs" />
              {grouped.map(([group, vars]) => (
                <div key={group} className="mb-1">
                  <div className="px-1 pt-1 text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)]">{group}</div>
                  {vars.map((v) => (
                    <button key={v.key} onClick={() => insertVariable(v.key)}
                      className="w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg text-xs text-[var(--text)] hover:bg-[var(--surface-2)]">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${SOURCE_DOT[v.source] || 'bg-slate-400'}`} />
                      <span className="flex-1 truncate">{v.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Panneau des variables ───────────────────────────────────────────── */}
      <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 space-y-3 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
        <div>
          <h3 className="text-sm font-bold text-[var(--text)]">Variables</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Cliquez pour insérer au curseur. Chaque variable est déjà reliée à sa source : rien à configurer.
          </p>
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher une variable"
            className="w-full pl-8 pr-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] text-xs" />
        </div>

        {grouped.map(([group, vars]) => (
          <div key={group}>
            <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-muted)] mb-1">{group}</div>
            <div className="flex flex-wrap gap-1">
              {vars.map((v) => (
                <button key={v.key} disabled={!editable} onMouseDown={(e) => e.preventDefault()} onClick={() => insertVariable(v.key)}
                  title={`${SOURCE_LABEL[v.source] || v.source} · exemple : ${v.example}`}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-[var(--border)] text-xs text-[var(--text)] hover:border-[var(--brand)] hover:bg-[var(--brand-soft)] disabled:opacity-40">
                  <span className={`w-1.5 h-1.5 rounded-full ${SOURCE_DOT[v.source] || 'bg-slate-400'}`} />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-[var(--border)]">
          {!showCustom ? (
            <button onClick={() => setShowCustom(true)} disabled={!editable}
              className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand)] hover:underline disabled:opacity-40">
              <Plus className="w-3.5 h-3.5" /> Il manque une variable ? L'ajouter
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-[var(--text-muted)]">
                Pour une information propre à votre entreprise (sigle, NIU, capital…). Saisie une seule fois, réutilisée dans tous vos modèles.
              </p>
              <input value={customForm.label} onChange={(e) => setCustomForm({ ...customForm, label: e.target.value })}
                placeholder="Nom (ex. Capital social)" className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] px-2 py-1.5 text-xs" />
              <input value={customForm.value} onChange={(e) => setCustomForm({ ...customForm, value: e.target.value })}
                placeholder="Valeur (ex. 100 000 000 FCFA)" className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] px-2 py-1.5 text-xs" />
              <div className="flex gap-2">
                <button onClick={saveCustomVar} disabled={savingCustom}
                  className="px-3 py-1.5 rounded-lg bg-[var(--brand)] text-white text-xs font-semibold disabled:opacity-50">Ajouter</button>
                <button onClick={() => setShowCustom(false)} className="px-3 py-1.5 rounded-lg text-xs text-[var(--text-muted)]">Annuler</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-[var(--border)]">
          {Object.entries(SOURCE_LABEL).filter(([k]) => k !== 'UNKNOWN').map(([k, label]) => (
            <span key={k} className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
              <span className={`w-1.5 h-1.5 rounded-full ${SOURCE_DOT[k]}`} /> {label}
            </span>
          ))}
        </div>
      </aside>
    </div>
    </EditableCtx.Provider>
  );
}