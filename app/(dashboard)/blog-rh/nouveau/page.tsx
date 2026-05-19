'use client';
// ============================================================================
// 📁 app/(dashboard)/blog/nouveau/page.tsx
// Accès : HR_MANAGER, ADMIN, CABINET_ADMIN
// Scope : COMPANY — visible uniquement par leur entreprise
// Quota : 4 posts / mois / entreprise
// Layout : dashboard avec sidebar (même style que formation, recrutement etc.)
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Send, Save, AlertCircle, Loader2,
  CheckCircle2, Eye, PenLine, Image, Tag, Info,
} from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { blogApi, BlogCategory, BlogQuota } from '@/services/blog-api';

// ─── Constantes ───────────────────────────────────────────────────────────────
const CAN_POST = ['HR_MANAGER', 'ADMIN', 'CABINET_ADMIN'];

const CATS: { value: BlogCategory; label: string; color: string; desc: string }[] = [
  { value: 'GENERAL',        label: 'Général',          color: '#94A3B8', desc: 'Partage libre' },
  { value: 'PAIE',           label: 'Paie & Fiscalité', color: '#06B6D4', desc: 'CGI, CNSS, IRPP' },
  { value: 'DROIT_TRAVAIL',  label: 'Droit du travail', color: '#8B5CF6', desc: 'Code du Travail' },
  { value: 'RECRUTEMENT',    label: 'Recrutement',      color: '#10B981', desc: 'Bonnes pratiques' },
  { value: 'FORMATION',      label: 'Formation',        color: '#3B82F6', desc: 'Ressources RH' },
  { value: 'TEMOIGNAGE',     label: 'Témoignage',       color: '#EC4899', desc: 'Retour d\'expérience' },
];

// ─── Toolbar Markdown ─────────────────────────────────────────────────────────
function MdToolbar({ onInsert }: { onInsert: (b: string, a?: string, p?: string) => void }) {
  const tools = [
    { l: 'H1',  a: () => onInsert('# ', '', 'Titre'),             title: 'Titre principal' },
    { l: 'H2',  a: () => onInsert('## ', '', 'Sous-titre'),        title: 'Sous-titre' },
    { l: 'B',   a: () => onInsert('**', '**', 'gras'),             title: 'Gras',     cls: 'font-black' },
    { l: 'I',   a: () => onInsert('*', '*', 'italique'),           title: 'Italique', cls: 'italic' },
    { l: '`',   a: () => onInsert('`', '`', 'code'),              title: 'Code inline' },
    { l: '–',   a: () => onInsert('- ', '', 'élément'),           title: 'Liste' },
    { l: '❝',   a: () => onInsert('> ', '', 'citation'),          title: 'Citation' },
    { l: '—',   a: () => onInsert('\n---\n'),                      title: 'Séparateur' },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 p-2.5 bg-white/3 border-b border-white/10">
      {tools.map(t => (
        <button key={t.l} onClick={t.a} title={t.title}
          className={`px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-400 hover:text-white transition-all font-mono ${t.cls || ''}`}>
          {t.l}
        </button>
      ))}
      <span className="ml-auto flex items-center text-[10px] text-slate-600 gap-1">
        <Info size={10}/> Markdown
      </span>
    </div>
  );
}

// ─── Preview contenu ──────────────────────────────────────────────────────────
function Preview({ content }: { content: string }) {
  if (!content.trim()) return (
    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
      <Eye size={28} className="text-slate-500"/>
      <p className="text-sm text-slate-500">Aperçu apparaîtra ici</p>
    </div>
  );
  return (
    <div className="text-sm text-slate-300 leading-relaxed space-y-1">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('# '))  return <h1 key={i} className="text-2xl font-black text-white mt-4 mb-2 tracking-tight">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-white mt-3 mb-1.5">{line.slice(3)}</h2>;
        if (line.startsWith('### '))return <h3 key={i} className="text-lg font-bold text-white mt-2 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith('> '))  return <blockquote key={i} className="border-l-2 border-cyan-500 pl-3 italic text-slate-400 my-2">{line.slice(2)}</blockquote>;
        if (line.startsWith('- ') || line.startsWith('* ')) return (
          <div key={i} className="flex gap-2 my-1"><span className="text-cyan-400 flex-shrink-0">→</span><span>{line.slice(2)}</span></div>
        );
        if (line.startsWith('---')) return <hr key={i} className="border-white/10 my-3"/>;
        if (!line.trim()) return <div key={i} className="h-2"/>;
        const html = line
          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
          .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
          .replace(/`(.+?)`/g, '<code class="bg-white/10 text-cyan-400 px-1 rounded text-xs font-mono">$1</code>');
        return <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: html }}/>;
      })}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function NewPostDashboardPage() {
  const router = useRouter();
  const user   = authService.getCurrentUser();

  const [quota,    setQuota]    = useState<BlogQuota | null>(null);
  const [form,     setForm]     = useState({ title: '', excerpt: '', content: '', category: 'GENERAL' as BlogCategory, coverImage: '', published: true });
  const [tab,      setTab]      = useState<'write' | 'preview'>('write');
  const [status,   setStatus]   = useState<'idle' | 'saving' | 'publishing' | 'success' | 'error'>('idle');
  const [err,      setErr]      = useState('');
  const [newSlug,  setNewSlug]  = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auth guard
  useEffect(() => {
    if (!user) { router.replace('/auth/login'); return; }
    if (!CAN_POST.includes(user.role)) { router.replace('/dashboard/blog'); return; }
  }, [user, router]);

  // Quota
  useEffect(() => {
    if (!user || !CAN_POST.includes(user.role)) return;
    blogApi.quota().then(setQuota).catch(() => {});
  }, [user]);

  function insertMd(before: string, after = '', placeholder = '') {
    const ta = taRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = ta.value.slice(s, e) || placeholder;
    const next = ta.value.slice(0, s) + before + sel + after + ta.value.slice(e);
    setForm(p => ({ ...p, content: next }));
    setTimeout(() => { ta.focus(); const pos = s + before.length + sel.length; ta.setSelectionRange(pos, pos); }, 0);
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [f]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  function validate() {
    if (!form.title.trim() || form.title.length < 5) return 'Titre trop court (min. 5 caractères)';
    if (!form.content.trim() || form.content.length < 20) return 'Contenu trop court (min. 20 caractères)';
    if (quota && !quota.unlimited && quota.remaining <= 0) return `Quota atteint — ${quota.limit} posts/mois maximum`;
    return null;
  }

  async function submit(publish: boolean) {
    const e = validate();
    if (e) { setErr(e); return; }
    setStatus(publish ? 'publishing' : 'saving');
    setErr('');
    try {
      const post = await blogApi.create({ ...form, published: publish });
      setNewSlug((post as any).slug || '');
      setStatus('success');
    } catch (ex: any) {
      setErr(ex.message || 'Erreur serveur');
      setStatus('error');
    }
  }

  if (!user || !CAN_POST.includes(user.role)) return null;

  const quotaFull   = quota && !quota.unlimited && quota.remaining <= 0;
  const isSubmitting = status === 'saving' || status === 'publishing';

  // ── Succès ───────────────────────────────────────────────────────────────────
  if (status === 'success') return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
        <CheckCircle2 size={28} className="text-emerald-400"/>
      </div>
      <h2 className="text-2xl font-black text-white mb-3">
        {form.published ? 'Article publié !' : 'Brouillon enregistré !'}
      </h2>
      <p className="text-sm text-slate-400 mb-8 max-w-sm leading-relaxed">
        {form.published
          ? 'Votre article est visible par les membres de votre entreprise.'
          : 'Brouillon sauvegardé. Publiez-le quand vous êtes prêt.'}
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        {form.published && newSlug && (
          <a href={`/blog/${newSlug}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm rounded-xl no-underline">
            <Eye size={14}/> Voir l'article
          </a>
        )}
        <Link href="/dashboard/blog"
          className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-slate-300 font-semibold text-sm rounded-xl no-underline">
          ← Retour au blog
        </Link>
        <button onClick={() => { setStatus('idle'); setForm({ title:'', excerpt:'', content:'', category:'GENERAL', coverImage:'', published:true }); setNewSlug(''); }}
          className="flex items-center gap-2 px-5 py-2.5 border border-cyan-500/30 text-cyan-400 font-semibold text-sm rounded-xl bg-transparent cursor-pointer">
          <PenLine size={13}/> Écrire un autre
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/blog"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all no-underline">
            <ArrowLeft size={16}/>
          </Link>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Rédiger un article</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Visible par les membres de votre entreprise · Scope : Entreprise
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quota */}
          {quota && !quota.unlimited && (
            <div className={`px-3 py-2 rounded-xl border text-center ${
              quotaFull
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              <div className={`text-lg font-black font-mono leading-none ${quotaFull ? 'text-red-400' : 'text-emerald-400'}`}>
                {quota.remaining}/{quota.limit}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">posts ce mois</div>
            </div>
          )}

          {/* Boutons */}
          <button onClick={() => submit(false)} disabled={isSubmitting || !form.title.trim() || !form.content.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-slate-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {status === 'saving' ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
            Brouillon
          </button>
          <button onClick={() => submit(true)} disabled={isSubmitting || quotaFull || !form.title.trim() || !form.content.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20">
            {status === 'publishing' ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
            Publier
          </button>
        </div>
      </div>

      {/* Erreur */}
      {err && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 mb-5">
          <AlertCircle size={15} className="flex-shrink-0"/> {err}
        </div>
      )}

      {/* Quota épuisé */}
      {quotaFull && (
        <div className="flex items-start gap-3 px-4 py-4 bg-red-500/8 border border-red-500/20 rounded-xl text-sm text-red-300 mb-5">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-400"/>
          <div>
            <span className="font-bold text-red-400">Quota mensuel atteint — </span>
            Votre entreprise a publié ses {quota?.limit} articles ce mois. Revenez le mois prochain.
          </div>
        </div>
      )}

      {/* Layout éditeur */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* Colonne principale */}
        <div className="space-y-4">

          {/* Titre */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Titre *
            </label>
            <input value={form.title} onChange={set('title')} maxLength={255}
              placeholder="Un titre accrocheur qui donne envie de lire..."
              className={`w-full px-4 py-3 bg-[#020817] border rounded-xl text-white text-base font-bold placeholder:text-slate-600 outline-none transition-colors font-[inherit] ${
                form.title.length > 0 && form.title.length < 5
                  ? 'border-red-500/50 focus:border-red-500'
                  : 'border-white/10 focus:border-cyan-500/50'
              }`}
            />
            <div className="flex justify-between mt-1.5">
              {form.title.length > 0 && form.title.length < 5
                ? <span className="text-xs text-red-400">Minimum 5 caractères</span>
                : <span/>
              }
              <span className="text-[11px] text-slate-600 ml-auto">{form.title.length}/255</span>
            </div>
          </div>

          {/* Résumé */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Résumé <span className="normal-case font-normal tracking-normal text-slate-600">(optionnel)</span>
            </label>
            <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} maxLength={500}
              placeholder="Un court résumé affiché dans la liste..."
              className="w-full px-4 py-3 bg-[#020817] border border-white/10 focus:border-cyan-500/50 rounded-xl text-sm text-white placeholder:text-slate-600 outline-none transition-colors resize-none font-[inherit]"
            />
            <div className="text-right mt-1">
              <span className={`text-[11px] ${form.excerpt.length > 450 ? 'text-amber-400' : 'text-slate-600'}`}>
                {form.excerpt.length}/500
              </span>
            </div>
          </div>

          {/* Éditeur */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
              {(['write', 'preview'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                    tab === t
                      ? 'border-cyan-500 text-cyan-400'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}>
                  {t === 'write' ? '✏️ Rédiger' : '👁 Aperçu'}
                </button>
              ))}
              <div className="ml-auto flex items-center px-4">
                <span className={`text-[11px] ${form.content.length > 1800 ? 'text-amber-400' : 'text-slate-600'}`}>
                  {form.content.length} car.
                </span>
              </div>
            </div>

            {tab === 'write' ? (
              <>
                <MdToolbar onInsert={insertMd}/>
                <textarea
                  ref={taRef}
                  value={form.content}
                  onChange={set('content')}
                  placeholder={`Rédigez votre article...\n\n# Titre principal\n## Sous-section\n\n- Point 1\n- Point 2\n\n> Citation importante\n\n**Texte en gras**, *italique*, \`code\``}
                  className="w-full min-h-[380px] p-5 bg-transparent text-sm text-slate-300 font-mono leading-relaxed resize-none outline-none"
                />
                {form.content.length > 0 && form.content.length < 20 && (
                  <div className="px-5 py-2 bg-red-500/5 border-t border-red-500/15 text-xs text-red-400">
                    Contenu trop court — minimum 20 caractères
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 min-h-[380px]">
                <Preview content={form.content}/>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Statut publication */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Statut</p>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-300">Publier immédiatement</span>
              <div
                onClick={() => setForm(p => ({ ...p, published: !p.published }))}
                className={`w-10 h-5 rounded-full relative transition-all cursor-pointer ${form.published ? 'bg-emerald-500/70' : 'bg-white/10'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${form.published ? 'right-0.5' : 'left-0.5'}`}/>
              </div>
            </label>
            <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
              {form.published
                ? '✓ Visible par les membres de votre entreprise'
                : '○ Enregistré comme brouillon'}
            </p>
          </div>

          {/* Catégorie */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Catégorie</p>
            <div className="space-y-1.5">
              {CATS.map(cat => {
                const active = form.category === cat.value;
                return (
                  <button key={cat.value} onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                    style={{ borderColor: active ? `${cat.color}40` : undefined, background: active ? `${cat.color}12` : undefined }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all border border-transparent hover:bg-white/5`}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }}/>
                    <div>
                      <div className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-400'}`}>{cat.label}</div>
                      <div className="text-[10px] text-slate-600">{cat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image de couverture */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Image size={11}/> Image de couverture
            </p>
            <input value={form.coverImage} onChange={set('coverImage')} placeholder="https://..."
              className="w-full px-3 py-2.5 bg-[#020817] border border-white/10 focus:border-cyan-500/50 rounded-lg text-xs text-white placeholder:text-slate-600 outline-none transition-colors font-[inherit]"
            />
            {form.coverImage && (
              <div className="relative mt-2.5 rounded-lg overflow-hidden h-20 border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImage} alt="" onError={e => (e.currentTarget as HTMLImageElement).style.display = 'none'}
                  className="w-full h-full object-cover brightness-75"/>
                <button onClick={() => setForm(p => ({ ...p, coverImage: '' }))}
                  className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full text-white text-xs flex items-center justify-center hover:bg-black/80 border-none cursor-pointer">
                  ×
                </button>
              </div>
            )}
            <p className="text-[11px] text-slate-600 mt-2">URL Unsplash recommandé · Format 16:9</p>
          </div>

          {/* Aide Markdown */}
          <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-4">
            <p className="text-xs font-bold text-cyan-400 mb-2.5">📝 Markdown</p>
            <div className="space-y-1.5">
              {[
                ['# Titre',       'Titre H1'],
                ['## Sous-titre', 'Titre H2'],
                ['**gras**',      'Gras'],
                ['*italique*',    'Italique'],
                ['- item',        'Liste'],
                ['> texte',       'Citation'],
                ['`code`',        'Code'],
                ['---',           'Séparateur'],
              ].map(([s, d]) => (
                <div key={s} className="flex items-baseline gap-2">
                  <code className="text-[11px] text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded font-mono flex-shrink-0">{s}</code>
                  <span className="text-[11px] text-slate-600">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}