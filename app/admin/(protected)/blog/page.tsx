'use client';
// ============================================================================
// 📁 app/admin/blog/page.tsx — Konza RH · Blog Super Admin
//
// Le SUPER_ADMIN peut :
// - Voir TOUS les posts (GLOBAL + COMPANY de toutes les entreprises)
// - Publier des annonces officielles (scope GLOBAL, illimité)
// - Supprimer n'importe quel post
// - Dépublier / republier
// ============================================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, Heart, Share2, Trash2, Eye, Loader2,
  X, Check, Globe, Building2, PenLine, ChevronLeft,
  ChevronRight, Megaphone, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import { blogApi, BlogPostSummary } from '@/services/blog-api';

const CAT_COLOR: Record<string, { bg: string; text: string }> = {
  ANNONCE:      { bg: 'bg-amber-500/10',   text: 'text-amber-400'  },
  PAIE:         { bg: 'bg-cyan-500/10',    text: 'text-cyan-400'   },
  DROIT_TRAVAIL:{ bg: 'bg-purple-500/10',  text: 'text-purple-400' },
  RECRUTEMENT:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400'},
  FORMATION:    { bg: 'bg-blue-500/10',    text: 'text-blue-400'   },
  TEMOIGNAGE:   { bg: 'bg-pink-500/10',    text: 'text-pink-400'   },
  GENERAL:      { bg: 'bg-slate-500/10',   text: 'text-slate-400'  },
};
const CAT_LABEL: Record<string, string> = {
  ANNONCE:'Annonce', PAIE:'Paie', DROIT_TRAVAIL:'Droit', RECRUTEMENT:'Recrutement',
  FORMATION:'Formation', TEMOIGNAGE:'Témoignage', GENERAL:'Général',
};
const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN:'Konza RH', ADMIN:'Admin', HR_MANAGER:'RH', CABINET_ADMIN:'Cabinet',
  MANAGER:'Manager', EMPLOYEE:'Employé',
};

function timeAgo(s: string) {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (d === 0) return 'Aujourd\'hui';
  if (d === 1) return 'Hier';
  if (d < 7)   return `Il y a ${d}j`;
  return new Date(s).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' });
}

function AdminPostRow({
  post, onDelete, onTogglePublish,
}: {
  post: BlogPostSummary & { published?: boolean };
  onDelete: (slug: string, title: string) => void;
  onTogglePublish: (slug: string, published: boolean) => void;
}) {
  const cc   = CAT_COLOR[post.category] || CAT_COLOR.GENERAL;
  const isSA = post.author.role === 'SUPER_ADMIN';
  const company = post.author.company?.tradeName || post.author.company?.legalName || '';

  return (
    <motion.div layout initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
      className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
      <div className="flex items-start gap-4">
        {/* Cover mini */}
        {post.coverImage ? (
          <div className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
            <img src={post.coverImage} alt="" className="w-full h-full object-cover brightness-75"/>
          </div>
        ) : (
          <div className={`w-20 h-14 rounded-lg flex-shrink-0 flex items-center justify-center ${cc.bg}`}>
            <span className={`text-[10px] font-bold ${cc.text} text-center px-1`}>{CAT_LABEL[post.category]}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>
              {CAT_LABEL[post.category]}
            </span>
            {post.scope === 'GLOBAL'
              ? <span className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full"><Globe size={9}/> Global</span>
              : <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-full"><Building2 size={9}/> Entreprise</span>
            }
            {!post.published && (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">Brouillon</span>
            )}
          </div>

          <h3 className="text-sm font-bold text-white leading-snug line-clamp-1 mb-1">{post.title}</h3>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-400">
              {isSA ? 'Konza RH' : `${post.author.firstName} ${post.author.lastName}`}
            </span>
            <span>·</span>
            <span>{ROLE_LABEL[post.author.role]}</span>
            {company && !isSA && <><span>·</span><span className="truncate max-w-[120px]">{company}</span></>}
            <span>·</span>
            <span>{timeAgo(post.publishedAt)}</span>
          </div>
        </div>

        {/* Stats + actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Heart size={11}/> {post.likesCount}
          </div>

          <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all no-underline">
            <Eye size={14}/>
          </a>

          <a href={`/blog/modifier/${post.slug}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-all no-underline">
            <PenLine size={14}/>
          </a>

          <button
            onClick={() => onTogglePublish(post.slug, !post.published)}
            className={`p-1.5 rounded-lg transition-all ${
              post.published
                ? 'text-emerald-400 hover:text-amber-400 hover:bg-amber-500/10'
                : 'text-amber-400 hover:text-emerald-400 hover:bg-emerald-500/10'
            }`}
            title={post.published ? 'Dépublier' : 'Publier'}
          >
            {post.published ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
          </button>

          <button
            onClick={() => onDelete(post.slug, post.title)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <Trash2 size={14}/>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DeleteModal({ title, onConfirm, onCancel, loading }: { title:string; onConfirm:()=>void; onCancel:()=>void; loading:boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-[#0A1628] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-400"/>
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">Supprimer cet article ?</h3>
        <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
          "<span className="text-white font-semibold">{title}</span>" sera définitivement supprimé.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-slate-300 transition-all">Annuler</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>} Supprimer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminBlogPage() {
  const router = useRouter();
  const user   = authService.getCurrentUser();

  useEffect(() => {
    if (!user || user.role !== 'SUPER_ADMIN') router.replace('/dashboard');
  }, [user, router]);

  const [posts,     setPosts]     = useState<(BlogPostSummary & { published?: boolean })[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [totalPgs,  setTotalPgs]  = useState(1);
  const [total,     setTotal]     = useState(0);
  const [search,    setSearch]    = useState('');
  const [dSearch,   setDSearch]   = useState('');
  const [scopeFilter, setScope]   = useState<'all'|'GLOBAL'|'COMPANY'>('all');
  const [delTarget, setDelTarget] = useState<{ slug:string; title:string }|null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const [copied,    setCopied]    = useState<string|null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setDSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer.current);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogApi.list({ page, limit: 15, ...(dSearch ? { q: dSearch } : {}) });
      let filtered = res.posts;
      if (scopeFilter !== 'all') filtered = filtered.filter(p => p.scope === scopeFilter);
      setPosts(filtered);
      setTotalPgs(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch { setPosts([]); }
    setLoading(false);
  }, [page, dSearch, scopeFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [dSearch, scopeFilter]);

  async function handleDelete() {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await blogApi.delete(delTarget.slug);
      setPosts(p => p.filter(post => post.slug !== delTarget.slug));
      setDelTarget(null);
    } catch (e: any) { alert(e.message || 'Erreur'); }
    setDeleting(false);
  }

  async function handleTogglePublish(slug: string, publish: boolean) {
    try {
      await blogApi.update(slug, { published: publish });
      setPosts(p => p.map(post => post.slug === slug ? { ...post, published: publish } : post));
    } catch (e: any) { alert(e.message); }
  }

  if (!user || user.role !== 'SUPER_ADMIN') return null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Megaphone size={22} className="text-amber-400"/> Blog — Super Admin
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Vue complète · Tous les articles de toutes les entreprises · {total} posts
          </p>
        </div>
        <a href="/blog/nouveau"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 no-underline">
          <Plus size={16}/> Publier une annonce officielle
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:'Total articles', value: total, color:'text-white' },
          { label:'Portée globale', value: posts.filter(p => p.scope==='GLOBAL').length, color:'text-cyan-400' },
          { label:'Portée entreprise', value: posts.filter(p => p.scope==='COMPANY').length, color:'text-blue-400' },
          { label:'Likes totaux', value: posts.reduce((s,p) => s + p.likesCount, 0), color:'text-pink-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className={`text-2xl font-black ${s.color} font-mono`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 transition-colors"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X size={13}/></button>}
        </div>
        <div className="flex gap-2">
          {[
            { value:'all',     label:'Tous' },
            { value:'GLOBAL',  label:'Global' },
            { value:'COMPANY', label:'Entreprises' },
          ].map(f => (
            <button key={f.value} onClick={() => setScope(f.value as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                scopeFilter === f.value
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-amber-400"/>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">Aucun article trouvé</div>
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {posts.map(post => (
                <AdminPostRow
                  key={post.id} post={post}
                  onDelete={(slug, title) => setDelTarget({ slug, title })}
                  onTogglePublish={handleTogglePublish}
                />
              ))}
            </div>
          </AnimatePresence>

          {totalPgs > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                className="flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                <ChevronLeft size={14}/> Préc.
              </button>
              {Array.from({length:Math.min(5,totalPgs)},(_,i)=>{
                const pg=Math.max(1,Math.min(totalPgs-4,page-2))+i;
                return <button key={pg} onClick={()=>setPage(pg)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold border transition-all ${pg===page?'bg-amber-500/20 border-amber-500/40 text-amber-400':'bg-white/5 border-white/10 text-slate-400 hover:text-white'}`}>{pg}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPgs,p+1))} disabled={page===totalPgs}
                className="flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                Suiv. <ChevronRight size={14}/>
              </button>
            </div>
          )}
        </>
      )}

      {copied && (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0,y:20}}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-semibold">
          <Check size={14}/> Lien copié !
        </motion.div>
      )}

      {delTarget && (
        <DeleteModal title={delTarget.title} loading={deleting} onConfirm={handleDelete} onCancel={() => setDelTarget(null)}/>
      )}
    </div>
  );
}