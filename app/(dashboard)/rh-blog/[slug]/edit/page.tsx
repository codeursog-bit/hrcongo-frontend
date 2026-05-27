'use client';
// ============================================================================
// 📁 app/(dashboard)/rh-blog/[slug]/edit/page.tsx
// Utilise le composant BlogEditor enrichi (SEO + upload image)
// ============================================================================
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { blogApi, BlogPost, BlogCategory } from '@/services/blog-api';
import { BlogEditor, BlogEditorForm } from '@/components/blog/BlogEditor';

const CAN_POST = ['HR_MANAGER', 'ADMIN', 'CABINET_ADMIN'];

export default function RhBlogEditPage() {
  const { slug } = useParams() as { slug: string };
  const router   = useRouter();
  const user     = authService.getCurrentUser();

  const [post,      setPost]      = useState<BlogPost | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [noAccess,  setNoAccess]  = useState(false);
  const [notFound,  setNotFound]  = useState(false);
  const [initForm,  setInitForm]  = useState<Partial<BlogEditorForm> | null>(null);

  useEffect(() => {
    if (!user) { router.replace('/auth/login'); return; }
    if (user.role === 'SUPER_ADMIN') { router.replace(`/admin/blog/${slug}/edit`); return; }
    if (!CAN_POST.includes(user.role)) { router.replace('/rh-blog'); return; }
  }, [user, router, slug]);

  useEffect(() => {
    if (!slug || !user) return;
    blogApi.get(slug).then(p => {
      const isOwner = p.author.id === user.id;
      const isAdmin = user.role === 'ADMIN';
      if (!isOwner && !isAdmin) { setNoAccess(true); setLoading(false); return; }

      setPost(p);
      setInitForm({
        title:      p.title,
        excerpt:    p.excerpt || '',
        content:    p.content,
        category:   p.category as BlogCategory,
        coverImage: p.coverImage || '',
        published:  (p as any).published ?? true,
        seoTitle:   (p as any).seoTitle  || p.title.slice(0, 60),
        seoDesc:    (p as any).seoDesc   || p.excerpt?.slice(0, 160) || '',
        keywords:   (p as any).keywords  ? JSON.parse((p as any).keywords) : [],
      });
      setLoading(false);
    }).catch(e => {
      if (e.message?.includes('introuvable')) setNotFound(true);
      setLoading(false);
    });
  }, [slug, user]);

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <Loader2 size={28} className="animate-spin text-cyan-500"/>
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle size={36} className="text-red-400 mb-4"/>
      <h2 className="text-lg font-bold text-white mb-2">Article introuvable</h2>
      <Link href="/rh-blog" className="text-sm text-cyan-400 hover:underline no-underline mt-2">← Retour</Link>
    </div>
  );

  if (noAccess) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle size={36} className="text-amber-400 mb-4"/>
      <h2 className="text-lg font-bold text-white mb-2">Accès refusé</h2>
      <p className="text-sm text-slate-400 mb-4">Vous ne pouvez modifier que vos propres articles.</p>
      <Link href="/rh-blog" className="text-sm text-cyan-400 hover:underline no-underline">← Retour</Link>
    </div>
  );

  if (!initForm) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rh-blog"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all no-underline">
          <ArrowLeft size={16}/>
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Modifier l'article</h1>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{post?.title}</p>
        </div>
      </div>

      <BlogEditor
        mode="edit"
        slug={slug}
        isSuperAdmin={false}
        initialForm={initForm}
        quotaRemaining={null} // pas de quota pour l'édition
        onSuccess={s => router.push(`/blog/${s}`)}
      />
    </div>
  );
}