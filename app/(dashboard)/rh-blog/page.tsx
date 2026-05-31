'use client';
// ============================================================================
// 📁 app/(dashboard)/rh-blog/page.tsx — VERSION CORRIGÉE
// Fix : gestion erreurs visible + companyId guard + fallback propre
// ============================================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Heart, Share2, Eye, PenLine,
  Trash2, Loader2, ChevronLeft, ChevronRight,
  X, BookOpen, Globe, Building2, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '@/lib/services/authService';
import { blogApi, BlogPostSummary, BlogCategory, BlogQuota } from '@/services/blog-api';

const CAN_POST = ['HR_MANAGER', 'ADMIN', 'CABINET_ADMIN'];

const CATS: { value: BlogCategory | ''; label: string }[] = [
  { value: '',              label: 'Tous'         },
  { value: 'ANNONCE',       label: 'Annonces'     },
  { value: 'PAIE',          label: 'Paie & Fisc.' },
  { value: 'DROIT_TRAVAIL', label: 'Droit'        },
  { value: 'RECRUTEMENT',   label: 'Recrutement'  },
  { value: 'FORMATION',     label: 'Formation'    },
  { value: 'TEMOIGNAGE',    label: 'Témoignages'  },
  { value: 'GENERAL',       label: 'Général'      },
];

const CAT_COLOR: Record<string, { bg: string; text: string }> = {
  ANNONCE:      { bg: 'bg-amber-500/10',   text: 'text-amber-400'   },
  PAIE:         { bg: 'bg-cyan-500/10',    text: 'text-cyan-400'    },
  DROIT_TRAVAIL:{ bg: 'bg-purple-500/10',  text: 'text-purple-400'  },
  RECRUTEMENT:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  FORMATION:    { bg: 'bg-blue-500/10',    text: 'text-blue-400'    },
  TEMOIGNAGE:   { bg: 'bg-pink-500/10',    text: 'text-pink-400'    },
  GENERAL:      { bg: 'bg-slate-500/10',   text: 'text-slate-400'   },
};

function timeAgo(s: string) {
  const d = Math.floor((Date.now() - new Date(s).getTime()) / 86400000);
  if (d === 0) return 'Aujourd\'hui';
  if (d === 1) return 'Hier';
  if (d < 7)   return `Il y a ${d}j`;
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({
  post, userId, onLike, onDelete,
}: {
  post:     BlogPostSummary;
  userId:   string;
  onLike:   (slug: string) => void;
  onDelete: (slug: string, title: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const cc       = CAT_COLOR[post.category] || CAT_COLOR.GENERAL;
  const isSA     = post.author.role === 'SUPER_ADMIN';
  const isOwn    = post.author.id === userId;
  const catLabel = CATS.find(c => c.value === post.category)?.label || post.category;

  async function share() {
    const url = `${window.location.origin}/blog/${post.slug}`;
    if (navigator.share) navigator.share({ title: post.title, url }).catch(() => {});
    else navigator.clipboard.writeText(url);
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:-translate-y-1 transition-all duration-200 flex flex-col">

      {post.coverImage ? (
        <div className="h-40 overflow-hidden relative flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title}
            className="w-full h-full object-cover brightness-[0.6] hover:brightness-75 transition-[filter] duration-300"/>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0A1628]/80"/>
          <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cc.bg} ${cc.text} backdrop-blur-sm border border-white/10`}>
            {catLabel}
          </span>
          {isSA && <span className="absolute top-3 right-3 text-[10px] font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 px-2 py-0.5 rounded-full">Officiel</span>}
        </div>
      ) : (
        <div className={`h-14 flex items-center px-4 flex-shrink-0 ${cc.bg}`}>
          <span className={`text-xs font-bold uppercase tracking-wide ${cc.text}`}>{catLabel}</span>
          {isSA && <span className="ml-2 text-[10px] font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 px-2 py-0.5 rounded-full">Officiel</span>}
          <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
            {post.scope === 'GLOBAL' ? <Globe size={9}/> : <Building2 size={9}/>}
          </span>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {isSA ? 'K' : post.author.firstName?.[0] || '?'}
          </div>
          <span className="text-xs font-semibold text-white/80">
            {isSA ? 'Konza RH' : `${post.author.firstName} ${post.author.lastName}`}
          </span>
          <span className="text-xs text-slate-500">· {timeAgo(post.publishedAt)}</span>
          {isOwn && <span className="ml-auto text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">Mon post</span>}
        </div>

        <a href={`/blog/${post.slug}`} className="no-underline">
          <h3 className="text-[15px] font-bold text-white leading-snug line-clamp-2 hover:text-cyan-400 transition-colors cursor-pointer">
            {post.title}
          </h3>
        </a>

        {post.excerpt && (
          <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{post.excerpt}</p>
        )}

        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-500">{timeAgo(post.publishedAt)}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onLike(post.slug)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                post.hasLiked ? 'text-pink-400 bg-pink-500/10' : 'text-slate-500 hover:text-pink-400 hover:bg-pink-500/10'
              }`}>
              <Heart size={11} fill={post.hasLiked ? 'currentColor' : 'none'}/> {post.likesCount}
            </button>
            <button onClick={share}
              className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all">
              <Share2 size={11}/>
            </button>
            <a href={`/blog/${post.slug}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 transition-all no-underline">
              <Eye size={11}/> Lire
            </a>
            {isOwn && (
              <div className="relative">
                <button onClick={() => setMenu(v => !v)}
                  className="px-2 py-1 text-slate-500 hover:text-white text-xs rounded-lg hover:bg-white/5 transition-all">
                  ···
                </button>
                {menu && (
                  <div className="absolute right-0 top-7 z-20 bg-[#0F1E35] border border-white/10 rounded-xl shadow-xl py-1 w-36"
                    onMouseLeave={() => setMenu(false)}>
                    <Link href={`/rh-blog/${post.slug}/edit`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors no-underline">
                      <PenLine size={13}/> Modifier
                    </Link>
                    <button onClick={() => { setMenu(false); onDelete(post.slug, post.title); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={13}/> Supprimer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Modal suppression ────────────────────────────────────────────────────────
function DeleteModal({ title, onConfirm, onCancel, loading }: {
  title: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0A1628] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <Trash2 size={20} className="text-red-400"/>
        </div>
        <h3 className="text-lg font-bold text-white text-center mb-2">Supprimer cet article ?</h3>
        <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
          "<span className="text-white font-semibold">{title}</span>" sera définitivement supprimé.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-slate-300 transition-all">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>} Supprimer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function RhBlogPage() {
  const router = useRouter();
  const user   = authService.getCurrentUser();

  useEffect(() => {
    if (!user) { router.replace('/auth/login'); return; }
    if (user.role === 'SUPER_ADMIN') router.replace('/admin/blog');
  }, [user, router]);

  const [posts,     setPosts]     = useState<BlogPostSummary[]>([]);
  const [quota,     setQuota]     = useState<BlogQuota | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [apiError,  setApiError]  = useState('');           // ← erreur visible
  const [page,      setPage]      = useState(1);
  const [totalPgs,  setTotalPgs]  = useState(1);
  const [total,     setTotal]     = useState(0);
  const [cat,       setCat]       = useState<BlogCategory | ''>('');
  const [search,    setSearch]    = useState('');
  const [dSearch,   setDSearch]   = useState('');
  const [delTarget, setDelTarget] = useState<{ slug: string; title: string } | null>(null);
  const [deleting,  setDeleting]  = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const canPost = user && CAN_POST.includes(user.role);

  // Debounce search
  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setDSearch(search); setPage(1); }, 400);
    return () => clearTimeout(timer.current);
  }, [search]);

  // Quota
  useEffect(() => {
    if (!canPost) return;
    blogApi.quota().then(setQuota).catch(err => {
      console.warn('[quota error]', err);
    });
  }, [canPost]);

  // ─── Fetch posts ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      // ⚠️ FIX : on n'envoie companyId QUE si c'est une string non vide
      const params: Parameters<typeof blogApi.list>[0] = {
        page,
        limit: 9,
      };
      if (cat)                                        params.category   = cat;
      if (dSearch)                                    params.q          = dSearch;
      // companyId : seulement si défini et non vide
      if (user?.companyId && user.companyId !== 'undefined') {
        params.companyId = user.companyId;
      }

      const res = await blogApi.list(params);

      const likedSet = new Set<string>(
        JSON.parse(localStorage.getItem('kz_liked_posts') || '[]')
      );

      setPosts(
        res.posts.map(p => ({ ...p, hasLiked: p.hasLiked || likedSet.has(p.slug) }))
      );
      setTotalPgs(res.pagination.totalPages);
      setTotal(res.pagination.total);

    } catch (err: any) {
      // ⚠️ FIX : on affiche l'erreur au lieu de la masquer
      console.error('[rh-blog load error]', err);
      setApiError(err?.message || 'Impossible de charger les articles. Vérifiez que le backend est démarré.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [page, cat, dSearch, user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [cat, dSearch]);

  // ─── Like ────────────────────────────────────────────────────────────────────
  async function handleLike(slug: string) {
    setPosts(p => p.map(post =>
      post.slug === slug
        ? { ...post, hasLiked: !post.hasLiked, likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1 }
        : post
    ));
    try {
      const res = await blogApi.like(slug);
      setPosts(p => p.map(post =>
        post.slug === slug ? { ...post, hasLiked: res.liked, likesCount: res.likesCount } : post
      ));
      const set = new Set<string>(JSON.parse(localStorage.getItem('kz_liked_posts') || '[]'));
      if (res.liked) set.add(slug); else set.delete(slug);
      localStorage.setItem('kz_liked_posts', JSON.stringify([...set]));
    } catch { load(); }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!delTarget) return;
    setDeleting(true);
    try {
      await blogApi.delete(delTarget.slug);
      setPosts(p => p.filter(post => post.slug !== delTarget.slug));
      setDelTarget(null);
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la suppression');
    }
    setDeleting(false);
  }

  if (!user || user.role === 'SUPER_ADMIN') return null;

  const quotaFull = quota && !quota.unlimited && quota.remaining <= 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BookOpen size={20} className="text-cyan-400"/> Blog RH
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Articles de votre entreprise et annonces officielles Konza RH
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canPost && quota && !quota.unlimited && (
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
          {canPost && (
            <Link href="/rh-blog/nouveau"
              className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition-all no-underline ${
                quotaFull
                  ? 'bg-white/5 border border-white/10 text-slate-500 pointer-events-none opacity-50'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20'
              }`}>
              <Plus size={16}/> Rédiger un article
            </Link>
          )}
        </div>
      </div>

      {/* Quota épuisé */}
      {quotaFull && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/8 border border-red-500/20 rounded-xl text-sm text-red-400">
          <X size={15} className="flex-shrink-0"/>
          Quota mensuel atteint — {quota?.limit} posts/mois maximum. Revenez le mois prochain.
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 transition-colors"/>
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={13}/>
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATS.map(c => (
            <button key={c.value} onClick={() => setCat(c.value)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                cat === c.value
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Contenu ──────────────────────────────────────────────────────── */}

      {/* Erreur API visible */}
      {apiError && !loading && (
        <div className="flex items-start gap-3 px-4 py-4 bg-red-500/8 border border-red-500/20 rounded-xl">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5"/>
          <div>
            <p className="text-sm font-bold text-red-400 mb-1">Erreur de chargement</p>
            <p className="text-xs text-slate-400 leading-relaxed">{apiError}</p>
            <button onClick={load}
              className="mt-3 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:text-white transition-all">
              Réessayer
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-cyan-500"/>
        </div>
      ) : !apiError && posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={40} className="text-slate-600 mb-4"/>
          <h3 className="text-lg font-bold text-white mb-2">Aucun article</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            {dSearch
              ? `Aucun résultat pour "${dSearch}"`
              : 'Aucun article disponible. Rédigez le premier !'}
          </p>
          {canPost && !quotaFull && (
            <Link href="/rh-blog/nouveau"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm rounded-xl no-underline">
              <Plus size={14}/> Rédiger le premier article
            </Link>
          )}
        </div>
      ) : !apiError ? (
        <>
          <p className="text-xs text-slate-500">
            {total} article{total > 1 ? 's' : ''}{dSearch ? ` pour "${dSearch}"` : ''}
          </p>

          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  userId={user!.id}
                  onLike={handleLike}
                  onDelete={(slug, title) => setDelTarget({ slug, title })}
                />
              ))}
            </div>
          </AnimatePresence>

          {totalPgs > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                <ChevronLeft size={14}/> Préc.
              </button>
              {Array.from({ length: Math.min(5, totalPgs) }, (_, i) => {
                const pg = Math.max(1, Math.min(totalPgs - 4, page - 2)) + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold border transition-all ${
                      pg === page
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPgs, p + 1))} disabled={page === totalPgs}
                className="flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                Suiv. <ChevronRight size={14}/>
              </button>
            </div>
          )}
        </>
      ) : null}

      {delTarget && (
        <DeleteModal
          title={delTarget.title}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setDelTarget(null)}
        />
      )}
    </div>
  );
}