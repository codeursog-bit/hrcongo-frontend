'use client';
// ============================================================================
// 📁 app/(dashboard)/blog/page.tsx — Konza RH · Blog (espace dashboard)
//
// Accès lecture  : tous les rôles connectés
// Accès écriture : HR_MANAGER, ADMIN, CABINET_ADMIN (4 posts/mois)
// SUPER_ADMIN    → redirigé vers /admin/blog (sa propre page)
// ============================================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Search, Heart, Share2, Copy, Check, Loader2,
  PenLine, Trash2, Eye, Calendar, Tag, Globe, Building2,
  ChevronLeft, ChevronRight, X, AlertCircle, FileText,
  Megaphone, BookOpen, Users, Scale, GraduationCap, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/authService';
import {
  blogApi,
  BlogPostSummary, BlogQuota, CreatePostPayload, BlogCategory,
} from '@/services/blog-api';

// ─── Constantes ───────────────────────────────────────────────────────────────
const CAN_POST    = ['HR_MANAGER', 'ADMIN', 'SUPER_ADMIN', 'CABINET_ADMIN'];
const MONTH_LIMIT = 4;

const CATS: { value: BlogCategory | ''; label: string; icon: React.ElementType; color: string }[] = [
  { value: '',             label: 'Tous',           icon: FileText,      color: '#94A3B8' },
  { value: 'ANNONCE',      label: 'Annonces',        icon: Megaphone,     color: '#F59E0B' },
  { value: 'PAIE',         label: 'Paie & Fisc.',    icon: Scale,         color: '#06B6D4' },
  { value: 'DROIT_TRAVAIL',label: 'Droit travail',   icon: Scale,         color: '#8B5CF6' },
  { value: 'RECRUTEMENT',  label: 'Recrutement',     icon: Users,         color: '#10B981' },
  { value: 'FORMATION',    label: 'Formation',       icon: GraduationCap, color: '#3B82F6' },
  { value: 'TEMOIGNAGE',   label: 'Témoignages',     icon: Star,          color: '#EC4899' },
  { value: 'GENERAL',      label: 'Général',         icon: BookOpen,      color: '#94A3B8' },
];

const CAT_COLOR: Record<string, { bg: string; text: string }> = {
  ANNONCE:      { bg: 'bg-amber-500/10',   text: 'text-amber-400'  },
  PAIE:         { bg: 'bg-cyan-500/10',    text: 'text-cyan-400'   },
  DROIT_TRAVAIL:{ bg: 'bg-purple-500/10',  text: 'text-purple-400' },
  RECRUTEMENT:  { bg: 'bg-emerald-500/10', text: 'text-emerald-400'},
  FORMATION:    { bg: 'bg-blue-500/10',    text: 'text-blue-400'   },
  TEMOIGNAGE:   { bg: 'bg-pink-500/10',    text: 'text-pink-400'   },
  GENERAL:      { bg: 'bg-slate-500/10',   text: 'text-slate-400'  },
};

const ROLE_LABEL: Record<string, string> = {
  SUPER_ADMIN: 'Konza RH', ADMIN: 'Administrateur',
  HR_MANAGER: 'Resp. RH',  CABINET_ADMIN: 'Cabinet',
};

// ─── Utilitaires ─────────────────────────────────────────────────────────────
function formatDate(s: string) {
  return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
function timeAgo(s: string) {
  const diff = Date.now() - new Date(s).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Aujourd\'hui';
  if (d === 1) return 'Hier';
  if (d < 7)   return `Il y a ${d}j`;
  return formatDate(s);
}

// ─── Composant PostCard ───────────────────────────────────────────────────────
function PostCard({
  post, canManage, onLike, onDelete, onShare,
}: {
  post:      BlogPostSummary;
  canManage: boolean;
  onLike:    (slug: string) => void;
  onDelete:  (slug: string, title: string) => void;
  onShare:   (slug: string, title: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isSA   = post.author.role === 'SUPER_ADMIN';
  const cc     = CAT_COLOR[post.category] || CAT_COLOR.GENERAL;
  const catObj = CATS.find(c => c.value === post.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 hover:-translate-y-1 transition-all duration-200 flex flex-col"
    >
      {/* Cover */}
      {post.coverImage ? (
        <div className="h-40 overflow-hidden relative flex-shrink-0">
          <img src={post.coverImage} alt={post.title}
            className="w-full h-full object-cover brightness-[0.6] hover:brightness-75 transition-[filter] duration-300"/>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0A1628]"/>
          <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${cc.bg} ${cc.text} backdrop-blur-sm border border-white/10`}>
            {catObj?.label}
          </span>
          {isSA && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500">
              Officiel
            </span>
          )}
        </div>
      ) : (
        <div className={`h-14 flex items-center px-4 flex-shrink-0 ${cc.bg}`}>
          <span className={`text-xs font-bold uppercase tracking-wide ${cc.text}`}>{catObj?.label}</span>
          {isSA && <span className="ml-auto text-[10px] font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-500 px-2 py-0.5 rounded-full">Officiel</span>}
        </div>
      )}

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Auteur */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
            {isSA ? 'K' : post.author.firstName[0]}
          </div>
          <span className="text-xs font-semibold text-white/80">
            {isSA ? 'Konza RH' : `${post.author.firstName} ${post.author.lastName}`}
          </span>
          <span className="text-xs text-slate-500">· {ROLE_LABEL[post.author.role] || post.author.role}</span>
        </div>

        {/* Titre */}
        <a href={`/blog/${post.slug}`} className="no-underline">
          <h3 className="text-[15px] font-bold text-white leading-snug line-clamp-2 hover:text-cyan-400 transition-colors cursor-pointer">
            {post.title}
          </h3>
        </a>

        {post.excerpt && (
          <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">{post.excerpt}</p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-slate-500">{timeAgo(post.publishedAt)}</span>

          <div className="flex items-center gap-1">
            {/* Like */}
            <button
              onClick={() => onLike(post.slug)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                post.hasLiked
                  ? 'text-pink-400 bg-pink-500/10'
                  : 'text-slate-500 hover:text-pink-400 hover:bg-pink-500/10'
              }`}
            >
              <Heart size={12} fill={post.hasLiked ? 'currentColor' : 'none'}/>
              {post.likesCount}
            </button>

            {/* Share */}
            <button
              onClick={() => onShare(post.slug, post.title)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all"
            >
              <Share2 size={12}/>
            </button>

            {/* Read */}
            <a
              href={`/blog/${post.slug}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 transition-all no-underline"
            >
              <Eye size={12}/> Lire
            </a>

            {/* Manage menu (auteur ou admin) */}
            {canManage && (
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className="px-2 py-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  ···
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-7 z-20 bg-[#0F1E35] border border-white/10 rounded-xl shadow-xl py-1 w-36" onMouseLeave={() => setMenuOpen(false)}>
                    <a
                      href={`/blog/modifier/${post.slug}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors no-underline"
                    >
                      <PenLine size={13}/> Modifier
                    </a>
                    <button
                      onClick={() => { setMenuOpen(false); onDelete(post.slug, post.title); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
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

// ─── Modal de confirmation suppression ───────────────────────────────────────
function DeleteModal({ title, onConfirm, onCancel, loading }: { title: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
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
          <button onClick={onCancel} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-slate-300 transition-all">
            Annuler
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 size={14} className="animate-spin"/> : <Trash2 size={14}/>}
            Supprimer
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
export default function BlogDashboardPage() {
  const router = useRouter();
  const user   = authService.getCurrentUser();

  // Redirect SUPER_ADMIN vers sa page dédiée
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') router.replace('/admin/blog');
  }, [user, router]);

  const [posts,    setPosts]    = useState<BlogPostSummary[]>([]);
  const [quota,    setQuota]    = useState<BlogQuota | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [totalPgs, setTotalPgs] = useState(1);
  const [total,    setTotal]    = useState(0);
  const [category, setCat]      = useState<BlogCategory | ''>('');
  const [search,   setSearch]   = useState('');
  const [dSearch,  setDSearch]  = useState('');
  const [copied,   setCopied]   = useState<string | null>(null);
  const [delTarget,setDelTarget]= useState<{ slug: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const canPost   = user && CAN_POST.includes(user.role);
  const isHrAdmin = user?.role === 'HR_MANAGER' || user?.role === 'ADMIN' || user?.role === 'CABINET_ADMIN';

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDSearch(search); setPage(1); }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  // Quota
  useEffect(() => {
    if (!canPost || user?.role === 'SUPER_ADMIN') return;
    blogApi.quota().then(setQuota).catch(() => {});
  }, [user]);

  // Fetch posts
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blogApi.list({
        page, limit: 9,
        ...(category ? { category } : {}),
        ...(dSearch   ? { q: dSearch }  : {}),
        ...(user?.companyId ? { companyId: user.companyId } : {}),
      });
      // Merge liked set from localStorage (anonymous)
      const likedRaw = localStorage.getItem('kz_liked_posts');
      const likedSet = new Set<string>(likedRaw ? JSON.parse(likedRaw) : []);
      setPosts(res.posts.map(p => ({ ...p, hasLiked: p.hasLiked || likedSet.has(p.slug) })));
      setTotalPgs(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch { setPosts([]); }
    setLoading(false);
  }, [page, category, dSearch, user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [category, dSearch]);

  // Like
  async function handleLike(slug: string) {
    // Optimistic
    setPosts(p => p.map(post =>
      post.slug === slug
        ? { ...post, hasLiked: !post.hasLiked, likesCount: post.hasLiked ? post.likesCount - 1 : post.likesCount + 1 }
        : post
    ));
    try {
      const res = await blogApi.like(slug);
      setPosts(p => p.map(post => post.slug === slug ? { ...post, hasLiked: res.liked, likesCount: res.likesCount } : post));
      // Persist anon likes
      if (!user) {
        const raw = localStorage.getItem('kz_liked_posts');
        const set = new Set<string>(raw ? JSON.parse(raw) : []);
        if (res.liked) set.add(slug); else set.delete(slug);
        localStorage.setItem('kz_liked_posts', JSON.stringify(Array.from(set)))
      }
    } catch { load(); }
  }

  // Share
  async function handleShare(slug: string, title: string) {
    const url = `${window.location.origin}/blog/${slug}`;
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(slug);
      setTimeout(() => setCopied(null), 2000);
    }
  }

  // Delete
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

  if (user?.role === 'SUPER_ADMIN') return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── En-tête ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Blog RH</h1>
          <p className="text-sm text-slate-400 mt-1">
            Partages, actualités et bonnes pratiques de votre communauté RH
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Quota */}
          {isHrAdmin && quota && !quota.unlimited && (
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
              quota.remaining === 0
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              {quota.remaining}/{quota.limit} posts ce mois
            </div>
          )}
          {canPost && (
            <a href="/blog/nouveau"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 no-underline">
              <Plus size={16}/> Rédiger un article
            </a>
          )}
        </div>
      </div>

      {/* ── Filtres ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-500/50 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X size={14}/>
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex gap-2 flex-wrap">
          {CATS.map(cat => {
            const Icon = cat.icon;
            const active = category === cat.value;
            return (
              <button key={cat.value} onClick={() => setCat(cat.value as BlogCategory | '')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                  active
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                }`}>
                <Icon size={12}/> {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grille articles ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-cyan-500"/>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={40} className="text-slate-600 mb-4"/>
          <h3 className="text-lg font-bold text-white mb-2">Aucun article</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-sm">
            {dSearch ? `Aucun résultat pour "${dSearch}"` : 'Soyez le premier à partager une expérience ou une actualité RH.'}
          </p>
          {canPost && quota?.canPost !== false && (
            <a href="/blog/nouveau"
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm rounded-xl no-underline">
              <Plus size={14}/> Rédiger le premier article
            </a>
          )}
        </div>
      ) : (
        <>
          <div className="text-xs text-slate-500 mb-1">
            {total} article{total > 1 ? 's' : ''}{dSearch ? ` pour "${dSearch}"` : ''}
          </div>
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  canManage={!!user && (post.author.id === user.id || user.role === 'ADMIN')}
                  onLike={handleLike}
                  onDelete={(slug, title) => setDelTarget({ slug, title })}
                  onShare={handleShare}
                />
              ))}
            </div>
          </AnimatePresence>

          {/* Pagination */}
          {totalPgs > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                <ChevronLeft size={14}/> Préc.
              </button>
              {Array.from({ length: Math.min(5, totalPgs) }, (_, i) => {
                const pg = Math.max(1, Math.min(totalPgs - 4, page - 2)) + i;
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all border ${
                      pg === page
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}>
                    {pg}
                  </button>
                );
              })}
              <button onClick={() => setPage(p => Math.min(totalPgs, p + 1))} disabled={page === totalPgs}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white disabled:opacity-30 transition-all">
                Suiv. <ChevronRight size={14}/>
              </button>
            </div>
          )}
        </>
      )}

      {/* Toast copié */}
      <AnimatePresence>
        {copied && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-semibold backdrop-blur-sm">
            <Check size={14}/> Lien copié !
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal suppression */}
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