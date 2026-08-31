'use client';
// ============================================================================
// 📁 components/blog/BlogEditor.tsx
// Éditeur réutilisable pour RH (nouveau + edit) et Super Admin
// Inclut : upload image Cloudinary, champs SEO, guide structure, CTA auto
// ============================================================================
import React, { useState, useRef, useCallback } from 'react';
import {
  Eye, Save, Send, AlertCircle, Loader2, Upload,
  X, Info, Search, Tag, Globe, Building2, CheckCircle2,
} from 'lucide-react';
import { blogApi, BlogCategory } from '@/services/blog-api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface BlogEditorForm {
  title:       string;
  excerpt:     string;
  content:     string;
  category:    BlogCategory;
  coverImage:  string;
  published:   boolean;
  // SEO
  seoTitle:    string;
  seoDesc:     string;
  keywords:    string[];
}

export interface BlogEditorProps {
  initialForm?:  Partial<BlogEditorForm>;
  mode:          'create' | 'edit';
  isSuperAdmin?: boolean;
  slug?:         string;           // pour mode edit
  onSuccess?:    (slug: string) => void;
  quotaRemaining?: number | null;  // null = illimité
  quotaLimit?:   number;
}

// ─── Catégories ───────────────────────────────────────────────────────────────
const CATS: { value: BlogCategory; label: string; color: string; desc: string }[] = [
  { value:'ANNONCE',       label:'Annonce',          color:'#F59E0B', desc:'Officielles Konza RH'    },
  { value:'PAIE',          label:'Paie & Fiscalité',  color:'#06B6D4', desc:'CGI, CNSS, IRPP'        },
  { value:'DROIT_TRAVAIL', label:'Droit du travail',  color:'#8B5CF6', desc:'Code du Travail CG'     },
  { value:'RECRUTEMENT',   label:'Recrutement',       color:'#10B981', desc:'Bonnes pratiques'       },
  { value:'FORMATION',     label:'Formation',         color:'#3B82F6', desc:'Ressources RH'          },
  { value:'TEMOIGNAGE',    label:'Témoignage',        color:'#EC4899', desc:'Retour d\'expérience'   },
  { value:'GENERAL',       label:'Général',           color:'#94A3B8', desc:'Partage libre'          },
];

const DEFAULT_FORM: BlogEditorForm = {
  title:'', excerpt:'', content:'', category:'GENERAL',
  coverImage:'', published:true,
  seoTitle:'', seoDesc:'', keywords:[],
};

// ─── Toolbar Markdown ─────────────────────────────────────────────────────────
function MdToolbar({ onInsert }: { onInsert: (b: string, a?: string, p?: string) => void }) {
  const tools = [
    { l:'H1', a:()=>onInsert('# ','','Titre principal'),          title:'Titre H1' },
    { l:'H2', a:()=>onInsert('\n## ','','Sous-section'),           title:'Titre H2' },
    { l:'B',  a:()=>onInsert('**','**','gras'),    cls:'font-black',title:'Gras' },
    { l:'I',  a:()=>onInsert('*','*','italique'),  cls:'italic',    title:'Italique' },
    { l:'`',  a:()=>onInsert('`','`','code'),                       title:'Code inline' },
    { l:'–',  a:()=>onInsert('\n- ','','élément'),                  title:'Liste' },
    { l:'❝',  a:()=>onInsert('\n> ','','citation importante'),      title:'Citation' },
    { l:'FAQ',a:()=>onInsert('\n## Questions fréquentes\n\n**Q : ','**\n\nR : Votre réponse ici.'), title:'Bloc FAQ (SEO)' },
    { l:'—',  a:()=>onInsert('\n---\n'),                            title:'Séparateur' },
    { l:'CTA',a:()=>onInsert('\n---\n> 📊 **Gérez la paie de votre équipe avec Konza** — [Essai gratuit →](https://konza-rh.cg/auth/register)\n'), title:'Ajouter CTA' },
  ];
  return (
    <div className="flex flex-wrap gap-1 p-2.5 bg-white/3 border-b border-white/10">
      {tools.map(t => (
        <button key={t.l} onClick={t.a} title={t.title}
          className={`px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-[11px] text-slate-400 hover:text-white transition-all font-mono ${t.cls||''}`}>
          {t.l}
        </button>
      ))}
    </div>
  );
}

// ─── Preview Markdown ─────────────────────────────────────────────────────────
function Preview({ content, isSA }: { content: string; isSA?: boolean }) {
  if (!content.trim()) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30 min-h-[300px]">
      <Eye size={28} className="text-slate-500"/>
      <p className="text-sm text-slate-500">L'aperçu s'affichera ici</p>
    </div>
  );
  return (
    <div className="text-sm text-slate-300 leading-relaxed min-h-[300px]">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('# '))  return <h1 key={i} className="text-2xl font-black text-white mt-4 mb-2">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-3 mb-1.5">{line.slice(3)}</h2>;
        if (line.startsWith('### '))return <h3 key={i} className="text-lg font-bold text-white mt-2 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('> '))  return <blockquote key={i} className={`border-l-2 ${isSA?'border-amber-400':'border-cyan-500'} pl-3 italic text-slate-400 my-2`}>{line.slice(2)}</blockquote>;
        if (line.startsWith('- ') || line.startsWith('* ')) return (
          <div key={i} className="flex gap-2 my-1"><span className={`${isSA?'text-amber-400':'text-cyan-400'} flex-shrink-0`}>→</span><span>{line.slice(2)}</span></div>
        );
        if (line.startsWith('---')) return <hr key={i} className="border-white/10 my-3"/>;
        if (!line.trim()) return <div key={i} className="h-2"/>;
        const html = line
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, `<code class="bg-white/10 ${isSA?'text-amber-400':'text-cyan-400'} px-1 rounded text-xs font-mono">$1</code>`)
          .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-cyan-400 underline" target="_blank">$1</a>');
        return <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: html }}/>;
      })}
    </div>
  );
}

// ─── Upload Image ─────────────────────────────────────────────────────────────
function ImageUpload({
  value, onChange, accentColor = '#06B6D4',
}: {
  value: string;
  onChange: (url: string) => void;
  accentColor?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');
  const [dragOver,  setDragOver]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    // Validation côté client
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { setError('Format non autorisé. JPG, PNG ou WEBP.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Fichier trop lourd (max 5 Mo).'); return; }

    setUploading(true); setError('');
    try {
      const token = localStorage.getItem('accessToken');
      const fd = new FormData();
      fd.append('image', file);

      const res = await fetch(`${API}/blog/upload-image`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Erreur upload');
      onChange(d.url);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'upload');
    }
    setUploading(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <div className="space-y-2">
      {/* Zone de drop */}
      {!value ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          style={{ borderColor: dragOver ? accentColor : undefined }}
          className={`relative flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            dragOver
              ? 'border-current bg-white/5'
              : 'border-white/20 hover:border-white/40 hover:bg-white/3'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={22} className="animate-spin text-slate-400"/>
              <p className="text-xs text-slate-500">Upload en cours...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={20} className="text-slate-500"/>
              <p className="text-xs text-slate-400 font-medium">Glisser une image ici</p>
              <p className="text-[10px] text-slate-600">ou cliquer pour parcourir · JPG, PNG, WEBP · 5Mo max</p>
            </div>
          )}
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={e => e.target.files?.[0] && upload(e.target.files[0])}/>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden h-32 border border-white/10 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Couverture" className="w-full h-full object-cover brightness-75"/>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button onClick={() => inputRef.current?.click()} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs text-white font-semibold backdrop-blur-sm border-none cursor-pointer">
              Changer
            </button>
            <button onClick={() => onChange('')} className="p-1.5 bg-red-500/70 hover:bg-red-500 rounded-lg text-white backdrop-blur-sm border-none cursor-pointer">
              <X size={14}/>
            </button>
          </div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={e => e.target.files?.[0] && upload(e.target.files[0])}/>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle size={11}/> {error}
        </p>
      )}
      <p className="text-[10px] text-slate-600">Ratio 16:9 recommandé — utilisée pour WhatsApp, LinkedIn et Google</p>
    </div>
  );
}

// ─── Input mots-clés (tags) ───────────────────────────────────────────────────
function KeywordsInput({
  value, onChange, accentColor = '#06B6D4',
}: {
  value: string[];
  onChange: (kw: string[]) => void;
  accentColor?: string;
}) {
  const [input, setInput] = useState('');

  function add() {
    const kw = input.trim();
    if (!kw || value.includes(kw) || value.length >= 10) { setInput(''); return; }
    onChange([...value, kw]);
    setInput('');
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); } }}
          placeholder='Ex: "ITS 2026", "paie Congo"'
          className="flex-1 px-3 py-2 bg-[#020817] border border-white/10 focus:border-cyan-500/50 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none transition-colors font-[inherit]"
        />
        <button onClick={add} disabled={!input.trim() || value.length >= 10}
          style={{ background: accentColor }}
          className="px-3 py-2 rounded-lg text-white text-xs font-bold border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
          +
        </button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map(kw => (
            <span key={kw} className="flex items-center gap-1 px-2 py-0.5 bg-white/8 border border-white/15 rounded-full text-[11px] text-slate-300">
              <Tag size={8}/>
              {kw}
              <button onClick={() => onChange(value.filter(k => k !== kw))} className="ml-0.5 text-slate-500 hover:text-white border-none bg-transparent cursor-pointer">×</button>
            </span>
          ))}
        </div>
      )}
      <p className="text-[10px] text-slate-600">{value.length}/10 mots-clés · Appuyez Entrée ou virgule pour ajouter</p>
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export function BlogEditor({
  initialForm, mode, isSuperAdmin, slug, onSuccess, quotaRemaining, quotaLimit,
}: BlogEditorProps) {
  const accentColor = isSuperAdmin ? '#F59E0B' : '#06B6D4';
  const accentFrom  = isSuperAdmin ? 'from-amber-500' : 'from-cyan-500';
  const accentTo    = isSuperAdmin ? 'to-orange-500'  : 'to-blue-600';

  const [form,    setForm]    = useState<BlogEditorForm>({ ...DEFAULT_FORM, ...initialForm });
  const [tab,     setTab]     = useState<'write'|'preview'|'seo'>('write');
  const [status,  setStatus]  = useState<'idle'|'saving'|'publishing'|'success'|'error'>('idle');
  const [err,     setErr]     = useState('');
  const [newSlug, setNewSlug] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-remplir seoTitle depuis title
  const prevTitle = useRef(form.title);
  React.useEffect(() => {
    if (prevTitle.current !== form.title) {
      prevTitle.current = form.title;
      if (!form.seoTitle || form.seoTitle === prevTitle.current) {
        setForm(p => ({ ...p, seoTitle: form.title.slice(0, 60) }));
      }
    }
  }, [form.title]);

  // Auto-remplir seoDesc depuis excerpt
  React.useEffect(() => {
    if (form.excerpt && !form.seoDesc) {
      setForm(p => ({ ...p, seoDesc: form.excerpt.slice(0, 160) }));
    }
  }, [form.excerpt]);

  function insertMd(before: string, after = '', placeholder = '') {
    const ta = taRef.current; if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = ta.value.slice(s, e) || placeholder;
    const next = ta.value.slice(0, s) + before + sel + after + ta.value.slice(e);
    setForm(p => ({ ...p, content: next }));
    setTimeout(() => { ta.focus(); const pos = s + before.length + sel.length; ta.setSelectionRange(pos, pos); }, 0);
  }

  const set = (f: keyof BlogEditorForm) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  function validate() {
    if (!form.title.trim() || form.title.length < 5) return 'Titre trop court (min. 5 caractères)';
    if (!form.content.trim() || form.content.length < 20) return 'Contenu trop court (min. 20 caractères)';
    if (quotaRemaining !== null && quotaRemaining !== undefined && quotaRemaining <= 0) return `Quota mensuel atteint (${quotaLimit} posts/mois)`;
    return null;
  }

  async function submit(publish: boolean) {
    const e = validate(); if (e) { setErr(e); return; }
    setStatus(publish ? 'publishing' : 'saving'); setErr('');
    try {
      const payload = { ...form, published: publish };
      let post: any;
      if (mode === 'create') {
        post = await blogApi.create(payload);
      } else {
        post = await blogApi.update(slug!, payload);
      }
      setNewSlug(post.slug || slug || '');
      setStatus('success');
      onSuccess?.(post.slug || slug || '');
    } catch (ex: any) { setErr(ex.message || 'Erreur serveur'); setStatus('error'); }
  }

  const isSubmitting = status === 'saving' || status === 'publishing';
  const quotaFull = quotaRemaining !== null && quotaRemaining !== undefined && quotaRemaining <= 0;

  // ── Succès ─────────────────────────────────────────────────────────────────
  if (status === 'success') return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-6">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: `${accentColor}18`, border: `1px solid ${accentColor}40` }}>
        <CheckCircle2 size={28} style={{ color: accentColor }}/>
      </div>
      <h2 className="text-2xl font-black text-white mb-2">
        {mode === 'create'
          ? (form.published ? 'Article publié !' : 'Brouillon enregistré !')
          : 'Article mis à jour !'}
      </h2>
      <p className="text-sm text-slate-400 mb-8 max-w-sm leading-relaxed">
        {form.published
          ? isSuperAdmin
            ? 'Votre annonce est visible par toute la communauté Konza RH.'
            : 'Votre article est visible par les membres de votre entreprise.'
          : 'Brouillon sauvegardé.'}
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        {newSlug && (
          <a href={`/blog/${newSlug}`} className="flex items-center gap-2 px-5 py-2.5 text-white font-bold text-sm rounded-xl no-underline"
            style={{ background: `linear-gradient(135deg,${accentColor},${isSuperAdmin ? '#ea580c' : '#2563eb'})` }}>
            <Eye size={14}/> Voir l'article
          </a>
        )}
        <a href={isSuperAdmin ? '/admin/blog' : '/rh-blog'} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm rounded-xl no-underline">
          ← Retour au blog
        </a>
        {mode === 'create' && (
          <button onClick={() => { setStatus('idle'); setForm({ ...DEFAULT_FORM }); setNewSlug(''); }}
            className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl bg-transparent cursor-pointer border"
            style={{ borderColor: `${accentColor}40`, color: accentColor }}>
            Écrire un autre
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Erreur globale */}
      {err && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertCircle size={15} className="flex-shrink-0"/> {err}
        </div>
      )}

      {/* Quota épuisé */}
      {quotaFull && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-xl text-sm text-red-300">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-400"/>
          <span>Quota mensuel atteint — {quotaLimit} posts/mois maximum. Revenez le mois prochain.</span>
        </div>
      )}

      {/* Annonce Super Admin */}
      {isSuperAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl text-sm text-amber-300">
          <Globe size={15} className="flex-shrink-0 text-amber-400"/>
          <span>Portée globale · Visible par <strong className="text-amber-400">toute la communauté Konza RH</strong> · Illimité</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">

        {/* ── Colonne principale ──────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Titre */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">Titre *</label>
            <input value={form.title} onChange={set('title')} maxLength={255}
              placeholder={isSuperAdmin ? 'Titre de l\'annonce officielle...' : 'Un titre qui répond à une vraie question...'}
              className={`w-full px-4 py-3 bg-[#020817] border rounded-xl text-white text-base font-bold placeholder:text-slate-600 outline-none transition-colors font-[inherit] ${
                form.title.length > 0 && form.title.length < 5 ? 'border-red-500/50' : 'border-white/10'
              }`}
              style={{ ['--tw-ring-color' as string]: accentColor }}
              onFocus={e => e.target.style.borderColor = `${accentColor}60`}
              onBlur={e => e.target.style.borderColor = form.title.length > 0 && form.title.length < 5 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}
            />
            <div className="flex justify-between mt-1.5">
              {form.title.length > 0 && form.title.length < 5 && <span className="text-xs text-red-400">Minimum 5 caractères</span>}
              <span className="text-[11px] text-slate-600 ml-auto">{form.title.length}/255</span>
            </div>
          </div>

          {/* Résumé */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Résumé <span className="normal-case font-normal tracking-normal text-slate-600">(affiché dans la liste et dans Google)</span>
            </label>
            <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} maxLength={500}
              placeholder="Un court résumé qui donne envie de cliquer depuis Google..."
              className="w-full px-4 py-3 bg-[#020817] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none transition-colors resize-none font-[inherit]"
              onFocus={e => e.target.style.borderColor = `${accentColor}60`}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-slate-600">Idéalement 120-160 caractères pour Google</span>
              <span className={`text-[11px] ${form.excerpt.length > 450 ? 'text-amber-400' : 'text-slate-600'}`}>{form.excerpt.length}/500</span>
            </div>
          </div>

          {/* Éditeur contenu */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/10 overflow-x-auto">
              {(['write','preview','seo'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-4 py-3 text-sm font-semibold transition-all border-b-2 -mb-px whitespace-nowrap flex-shrink-0 ${
                    tab === t
                      ? `border-current text-current`
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                  style={{ color: tab === t ? accentColor : undefined, borderColor: tab === t ? accentColor : undefined }}>
                  {t === 'write' ? '✏️ Rédiger' : t === 'preview' ? '👁 Aperçu' : '🔍 SEO'}
                </button>
              ))}
              <div className="ml-auto flex items-center px-4 flex-shrink-0">
                <span className={`text-[11px] ${form.content.length > 1800 ? 'text-amber-400' : 'text-slate-600'}`}>{form.content.length} car.</span>
              </div>
            </div>

            {tab === 'write' && (
              <>
                <MdToolbar onInsert={insertMd}/>
                {/* Guide structure SEO */}
                <div className="px-4 py-2 bg-white/2 border-b border-white/5 flex items-center gap-2">
                  <Info size={11} className="text-slate-600 flex-shrink-0"/>
                  <span className="text-[10px] text-slate-600">Structure recommandée : H1 (titre) → H2 (sections) → H2 "Questions fréquentes" → CTA final</span>
                </div>
                <textarea
                  ref={taRef} value={form.content} onChange={set('content')}
                  placeholder={`# ${form.title || 'Votre titre principal ici'}\n\n## Introduction\n\nCommencez par répondre directement à la question principale en 2-3 phrases...\n\n## Qu'est-ce que [sujet] au Congo ?\n\nExplication claire et détaillée...\n\n## Ce qui change en 2026\n\n- Point 1\n- Point 2\n- Point 3\n\n## Exemple chiffré\n\nPrenons le cas d'un employé à 450 000 FCFA...\n\n## Questions fréquentes\n\n**Q : [question courante ?]**\n\nR : Votre réponse ici.\n\n---\n> 📊 **Gérez la paie de votre équipe avec Konza** — [Essai gratuit →](https://konza-rh.cg/auth/register)`}
                  className="w-full min-h-[400px] p-5 bg-transparent text-sm text-slate-300 font-mono leading-relaxed resize-y outline-none"
                />
                {form.content.length > 0 && form.content.length < 20 && (
                  <div className="px-5 py-2 bg-red-500/5 border-t border-red-500/15 text-xs text-red-400">
                    Contenu trop court — minimum 20 caractères
                  </div>
                )}
              </>
            )}

            {tab === 'preview' && (
              <div className="p-6"><Preview content={form.content} isSA={isSuperAdmin}/></div>
            )}

            {tab === 'seo' && (
              <div className="p-5 space-y-5">
                {/* Preview Google */}
                <div className="bg-white rounded-xl p-4">
                  <p className="text-[10px] text-gray-400 mb-2 font-medium uppercase tracking-wide">Aperçu Google</p>
                  <div className="text-green-700 text-xs mb-0.5">konza-rh.cg/blog/{form.title ? form.title.toLowerCase().replace(/\s+/g, '-').slice(0, 40) : 'votre-article'}</div>
                  <div className="text-blue-700 text-base font-medium leading-snug mb-1 line-clamp-1">
                    {form.seoTitle || form.title || 'Titre SEO de votre article'}
                  </div>
                  <div className="text-gray-600 text-sm leading-snug line-clamp-2">
                    {form.seoDesc || form.excerpt || 'La meta description apparaîtra ici. Rédigez-la pour donner envie de cliquer depuis les résultats Google.'}
                  </div>
                </div>

                {/* Titre SEO */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Titre SEO <span className="normal-case font-normal tracking-normal text-slate-600">(balise title — max 60 car.)</span>
                  </label>
                  <input value={form.seoTitle} onChange={set('seoTitle')} maxLength={60}
                    placeholder={form.title || 'Titre optimisé pour Google...'}
                    className="w-full px-3 py-2.5 bg-[#020817] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none transition-colors font-[inherit]"
                    onFocus={e => e.target.style.borderColor = `${accentColor}60`}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-600">Entre 40 et 60 caractères = idéal</span>
                    <span className={`text-[11px] ${form.seoTitle.length > 55 ? 'text-amber-400' : form.seoTitle.length > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {form.seoTitle.length}/60
                    </span>
                  </div>
                </div>

                {/* Meta description */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Meta description <span className="normal-case font-normal tracking-normal text-slate-600">(max 160 car.)</span>
                  </label>
                  <textarea value={form.seoDesc} onChange={set('seoDesc')} rows={3} maxLength={160}
                    placeholder={form.excerpt || 'Description qui apparaît sous le titre dans Google. Doit donner envie de cliquer...'}
                    className="w-full px-3 py-2.5 bg-[#020817] border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none transition-colors resize-none font-[inherit]"
                    onFocus={e => e.target.style.borderColor = `${accentColor}60`}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-600">Entre 120 et 160 caractères = idéal</span>
                    <span className={`text-[11px] ${form.seoDesc.length > 150 ? 'text-amber-400' : form.seoDesc.length >= 120 ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {form.seoDesc.length}/160
                    </span>
                  </div>
                </div>

                {/* Mots-clés */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Mots-clés <span className="normal-case font-normal tracking-normal text-slate-600">(max 10)</span>
                  </label>
                  <KeywordsInput value={form.keywords} onChange={kw => setForm(p => ({ ...p, keywords: kw }))} accentColor={accentColor}/>
                </div>

                {/* Score SEO simple */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Search size={10}/> Checklist SEO
                  </p>
                  <div className="space-y-2">
                    {[
                      { ok: form.title.length >= 5, label: 'Titre renseigné' },
                      { ok: form.excerpt.length >= 50, label: 'Résumé de 50+ caractères' },
                      { ok: form.seoTitle.length >= 20 && form.seoTitle.length <= 60, label: 'Titre SEO entre 20-60 car.' },
                      { ok: form.seoDesc.length >= 120 && form.seoDesc.length <= 160, label: 'Meta description 120-160 car.' },
                      { ok: form.keywords.length >= 3, label: '3+ mots-clés renseignés' },
                      { ok: !!form.coverImage, label: 'Image de couverture ajoutée' },
                      { ok: form.content.includes('## '), label: 'Sous-titres H2 dans le contenu' },
                      { ok: form.content.includes('## Questions'), label: 'Section "Questions fréquentes"' },
                      { ok: form.content.includes('konza-rh.cg'), label: 'CTA Konza en fin d\'article' },
                    ].map(c => (
                      <div key={c.label} className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${c.ok ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                          {c.ok
                            ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                            : <div className="w-1.5 h-1.5 rounded-full bg-slate-600"/>
                          }
                        </div>
                        <span className={`text-xs ${c.ok ? 'text-slate-300' : 'text-slate-600'}`}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5">
                    {(() => {
                      const score = [
                        form.title.length >= 5, form.excerpt.length >= 50,
                        form.seoTitle.length >= 20, form.seoDesc.length >= 120,
                        form.keywords.length >= 3, !!form.coverImage,
                        form.content.includes('## '), form.content.includes('## Questions'),
                        form.content.includes('konza-rh.cg'),
                      ].filter(Boolean).length;
                      const pct = Math.round((score / 9) * 100);
                      const color = pct >= 80 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
                      return (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background:color }}/>
                          </div>
                          <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Boutons publication */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Publication</p>
            <div className="space-y-2.5">
              <button onClick={() => submit(true)} disabled={isSubmitting || !!quotaFull || !form.title.trim() || !form.content.trim()}
                className={`w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r ${accentFrom} ${accentTo} text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg`}
                style={{ boxShadow: `0 0 20px ${accentColor}25` }}>
                {status === 'publishing' ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
                {mode === 'create' ? 'Publier maintenant' : 'Mettre à jour'}
              </button>
              <button onClick={() => submit(false)} disabled={isSubmitting || !form.title.trim() || !form.content.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                {status === 'saving' ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
                Enregistrer brouillon
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-3 text-center leading-relaxed">
              {isSuperAdmin
                ? <span className="flex items-center justify-center gap-1"><Globe size={9}/> Visible par toute la communauté</span>
                : <span className="flex items-center justify-center gap-1"><Building2 size={9}/> Visible par votre entreprise</span>
              }
            </p>
          </div>

          {/* Toggle publié */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-300">Publié</span>
              <div onClick={() => setForm(p => ({ ...p, published: !p.published }))}
                className="w-10 h-5 rounded-full relative transition-all cursor-pointer"
                style={{ background: form.published ? `${accentColor}B0` : 'rgba(255,255,255,0.1)' }}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${form.published ? 'right-0.5' : 'left-0.5'}`}/>
              </div>
            </label>
          </div>

          {/* Catégorie */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Catégorie</p>
            <div className="space-y-1.5">
              {CATS.filter(c => isSuperAdmin || c.value !== 'ANNONCE').concat(isSuperAdmin ? [] : []).map(cat => {
                const active = form.category === cat.value;
                return (
                  <button key={cat.value} onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                    style={{ borderColor: active ? `${cat.color}40` : undefined, background: active ? `${cat.color}12` : undefined }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all border border-transparent hover:bg-white/5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }}/>
                    <div>
                      <div className={`text-xs font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{cat.label}</div>
                      <div className="text-[10px] text-slate-600">{cat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image de couverture */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Image de couverture</p>
            <ImageUpload
              value={form.coverImage}
              onChange={url => setForm(p => ({ ...p, coverImage: url }))}
              accentColor={accentColor}
            />
          </div>

          {/* Conseils SEO rapides */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4">
            <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Search size={10}/> Conseils SEO
            </p>
            <div className="space-y-2 text-[11px] text-slate-600 leading-relaxed">
              <p>📌 Titre : répondre à une vraie question Google</p>
              <p>📝 Structure : H1 → H2 → H2 FAQ → CTA</p>
              <p>🖼️ Image : toujours ajouter une image de couverture</p>
              <p>🔗 CTA : terminer par un lien vers Konza</p>
              <p>📊 Longueur : 600-1200 mots = idéal pour Google</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}