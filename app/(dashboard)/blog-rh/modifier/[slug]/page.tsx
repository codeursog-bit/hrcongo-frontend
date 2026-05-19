'use client';
// ============================================================================
// 📁 app/(dashboard)/blog/modifier/[slug]/page.tsx — Konza RH
// Modifier un article existant (auteur ou SUPER_ADMIN)
// ============================================================================
import React, { useState, useEffect, useRef } from 'react';
import { PenLine, Loader2, Save, Send, ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from '@/lib/services/authService';
import { blogApi, BlogPost, BlogCategory, UpdatePostPayload } from '@/services/blog-api';

const CAN_POST = ['HR_MANAGER','ADMIN','SUPER_ADMIN','CABINET_ADMIN'];

const CATS: { value: BlogCategory; label: string; color: string }[] = [
  { value:'GENERAL',       label:'Général',         color:'#94A3B8' },
  { value:'PAIE',          label:'Paie & Fiscalité', color:'#06B6D4' },
  { value:'DROIT_TRAVAIL', label:'Droit du travail', color:'#8B5CF6' },
  { value:'RECRUTEMENT',   label:'Recrutement',      color:'#10B981' },
  { value:'FORMATION',     label:'Formation',        color:'#3B82F6' },
  { value:'ANNONCE',       label:'Annonce',          color:'#F59E0B' },
  { value:'TEMOIGNAGE',    label:'Témoignage',       color:'#EC4899' },
];

function MdToolbar({ onInsert }: { onInsert: (b: string, a?: string, p?: string) => void }) {
  const tools = [
    { l:'H1', a:()=>onInsert('# ','','Titre') },
    { l:'H2', a:()=>onInsert('## ','','Sous-titre') },
    { l:'B',  a:()=>onInsert('**','**','gras'),   s:{fontWeight:900 as const} },
    { l:'I',  a:()=>onInsert('*','*','italique'), s:{fontStyle:'italic' as const} },
    { l:'`',  a:()=>onInsert('`','`','code') },
    { l:'–',  a:()=>onInsert('- ','','élément') },
    { l:'❝',  a:()=>onInsert('> ','','citation') },
    { l:'—',  a:()=>onInsert('\n---\n') },
  ];
  return (
    <div className="flex gap-1.5 flex-wrap p-2 bg-white/3 border-b border-white/10">
      {tools.map(t => (
        <button key={t.l} onClick={t.a}
          style={t.s}
          className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-400 hover:text-white transition-all font-mono">
          {t.l}
        </button>
      ))}
      <span className="ml-auto text-[10px] text-slate-600 flex items-center">Markdown</span>
    </div>
  );
}

function ContentPreview({ content }: { content: string }) {
  if (!content.trim()) return (
    <div className="flex items-center justify-center h-full text-slate-600 text-sm">Aperçu vide</div>
  );
  return (
    <div className="prose prose-invert prose-sm max-w-none text-slate-300 text-sm leading-relaxed">
      {content.split('\n').map((line, i) => {
        if (line.startsWith('# '))  return <h1 key={i} className="text-xl font-black text-white mt-4 mb-2">{line.slice(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-white mt-3 mb-1.5">{line.slice(3)}</h2>;
        if (line.startsWith('> '))  return <blockquote key={i} className="border-l-2 border-cyan-500 pl-3 italic text-slate-400 my-2">{line.slice(2)}</blockquote>;
        if (line.startsWith('- '))  return <div key={i} className="flex gap-2 my-1"><span className="text-cyan-400">→</span><span>{line.slice(2)}</span></div>;
        if (line.startsWith('---')) return <hr key={i} className="border-white/10 my-3"/>;
        if (!line.trim()) return <div key={i} className="h-2"/>;
        const html = line
          .replace(/\*\*(.+?)\*\*/g,'<strong class="text-white">$1</strong>')
          .replace(/\*(.+?)\*/g,'<em>$1</em>')
          .replace(/`(.+?)`/g,'<code class="bg-white/10 text-cyan-400 px-1 rounded text-xs font-mono">$1</code>');
        return <p key={i} className="my-1" dangerouslySetInnerHTML={{ __html: html }}/>;
      })}
    </div>
  );
}

export default function EditBlogPostPage() {
  const params = useParams();
  const router = useRouter();
  const slug   = params?.slug as string;
  const user   = authService.getCurrentUser();

  const [post,     setPost]     = useState<BlogPost | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [noAccess, setNoAccess] = useState(false);

  const [form, setForm] = useState<UpdatePostPayload & { title:string; content:string; category:BlogCategory }>({
    title:'', excerpt:'', content:'', category:'GENERAL', coverImage:'', published:true,
  });

  const [tab,     setTab]     = useState<'write'|'preview'>('write');
  const [status,  setStatus]  = useState<'idle'|'saving'|'publishing'|'success'|'error'>('idle');
  const [errMsg,  setErrMsg]  = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Charger le post
  useEffect(() => {
    if (!slug) return;
    blogApi.get(slug)
      .then(p => {
        // Vérif accès
        const isOwner  = p.author.id === user?.id;
        const isSA     = user?.role === 'SUPER_ADMIN';
        const isAdmin  = user?.role === 'ADMIN';
        if (!isOwner && !isSA && !isAdmin) { setNoAccess(true); setLoading(false); return; }

        setPost(p);
        setForm({
          title:       p.title,
          excerpt:     p.excerpt || '',
          content:     p.content,
          category:    p.category as BlogCategory,
          coverImage:  p.coverImage || '',
          published:   p.published ?? true,
        });
        setLoading(false);
      })
      .catch(err => {
        if (err.message?.includes('introuvable')) setNotFound(true);
        setLoading(false);
      });
  }, [slug, user]);

  function insertMarkdown(before: string, after = '', placeholder = '') {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart, end = ta.selectionEnd;
    const sel = ta.value.slice(start, end) || placeholder;
    const newVal = ta.value.slice(0, start) + before + sel + after + ta.value.slice(end);
    setForm(p => ({ ...p, content: newVal }));
    setTimeout(() => {
      ta.focus();
      const pos = start + before.length + sel.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>) =>
    setForm(p => ({ ...p, [field]: e.target.type==='checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function submit(publish: boolean) {
    if (!form.title.trim() || form.title.trim().length < 5) { setErrMsg('Titre trop court (min. 5 caractères)'); return; }
    if (!form.content.trim() || form.content.trim().length < 20) { setErrMsg('Contenu trop court (min. 20 caractères)'); return; }

    setStatus(publish ? 'publishing' : 'saving');
    setErrMsg('');

    try {
      await blogApi.update(slug, { ...form, published: publish });
      setStatus('success');
    } catch (ex: any) {
      setErrMsg(ex.message || 'Erreur'); setStatus('error');
    }
  }

  const inp = "w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 transition-colors";

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-cyan-500"/>
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle size={36} className="text-red-400 mb-4"/>
      <h2 className="text-lg font-bold text-white mb-2">Article introuvable</h2>
      <button onClick={() => router.back()} className="text-sm text-cyan-400 hover:underline">← Retour</button>
    </div>
  );

  if (noAccess) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle size={36} className="text-amber-400 mb-4"/>
      <h2 className="text-lg font-bold text-white mb-2">Accès refusé</h2>
      <p className="text-sm text-slate-400 mb-4">Vous ne pouvez modifier que vos propres articles.</p>
      <button onClick={() => router.back()} className="text-sm text-cyan-400 hover:underline">← Retour</button>
    </div>
  );

  if (status === 'success') return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
        <Save size={22} className="text-emerald-400"/>
      </div>
      <h2 className="text-xl font-black text-white mb-3">Article mis à jour !</h2>
      <div className="flex gap-3 justify-center">
        <a href={`/blog/${slug}`} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-bold rounded-xl no-underline">Voir l'article →</a>
        <button onClick={() => setStatus('idle')} className="px-4 py-2 bg-white/5 border border-white/10 text-sm text-slate-300 font-semibold rounded-xl">Continuer l'édition</button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all">
            <ArrowLeft size={16}/>
          </button>
          <div>
            <h1 className="text-xl font-black text-white flex items-center gap-2">
              <PenLine size={18} className="text-cyan-400"/> Modifier l'article
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{post?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => submit(false)} disabled={status==='saving'||status==='publishing'}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-slate-300 transition-all disabled:opacity-40">
            {status==='saving' ? <Loader2 size={13} className="animate-spin"/> : <Save size={13}/>}
            Enregistrer
          </button>
          <button onClick={() => submit(true)} disabled={status==='saving'||status==='publishing'}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 shadow-lg shadow-cyan-500/20">
            {status==='publishing' ? <Loader2 size={13} className="animate-spin"/> : <Send size={13}/>}
            Publier
          </button>
        </div>
      </div>

      {errMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          <AlertCircle size={15}/> {errMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">
        {/* Éditeur */}
        <div className="space-y-4">
          {/* Titre */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Titre *</label>
            <input value={form.title} onChange={set('title')} placeholder="Titre de l'article..." maxLength={255}
              className={`${inp} text-base font-bold py-3`}/>
          </div>

          {/* Résumé */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Résumé</label>
            <textarea value={form.excerpt} onChange={set('excerpt')} rows={2} maxLength={500}
              placeholder="Un court résumé..." className={`${inp} resize-none`}/>
          </div>

          {/* Contenu */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex border-b border-white/10">
              {(['write','preview'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-5 py-3 text-sm font-semibold transition-all border-b-2 ${tab===t ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                  {t === 'write' ? '✏️ Rédiger' : '👁 Aperçu'}
                </button>
              ))}
              <span className="ml-auto flex items-center px-4 text-xs text-slate-600">{form.content.length} car.</span>
            </div>

            {tab === 'write' ? (
              <>
                <MdToolbar onInsert={insertMarkdown}/>
                <textarea ref={textareaRef} value={form.content} onChange={set('content')}
                  className="w-full min-h-[360px] p-5 bg-transparent text-sm text-slate-300 font-mono leading-relaxed resize-none outline-none"
                  placeholder="Rédigez votre article..."/>
              </>
            ) : (
              <div className="p-5 min-h-[360px]">
                <ContentPreview content={form.content}/>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Statut */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</p>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-300">Publié</span>
              <div className={`w-10 h-5 rounded-full transition-all relative ${form.published ? 'bg-emerald-500/70' : 'bg-white/10'}`}
                onClick={() => setForm(p => ({ ...p, published: !p.published }))}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${form.published ? 'right-0.5' : 'left-0.5'}`}/>
              </div>
            </label>
            <p className="text-xs text-slate-600">{form.published ? 'Visible par les membres' : 'Brouillon — non visible'}</p>
          </div>

          {/* Catégorie */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Catégorie</p>
            <div className="space-y-1.5">
              {CATS.map(cat => {
                const active = form.category === cat.value;
                return (
                  <button key={cat.value} onClick={() => setForm(p => ({ ...p, category: cat.value }))}
                    style={{ borderColor: active ? `${cat.color}40` : undefined }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-all border ${
                      active ? 'border-[inherit] text-white font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }}/>
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image de couverture */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Image de couverture</p>
            <input value={form.coverImage} onChange={set('coverImage')} placeholder="https://..."
              className={`${inp} text-xs`}/>
            {form.coverImage && (
              <div className="relative rounded-lg overflow-hidden h-24">
                <img src={form.coverImage} alt="" className="w-full h-full object-cover brightness-75"
                  onError={e => (e.currentTarget as HTMLImageElement).style.display='none'}/>
                <button onClick={() => setForm(p => ({ ...p, coverImage:'' }))}
                  className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 rounded-full text-white text-xs flex items-center justify-center hover:bg-black/80">×</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}