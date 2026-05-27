'use client';
// ============================================================================
// 📁 app/admin/blog/[slug]/edit/page.tsx — SUPER ADMIN
// Modifier n'importe quel article (tous les posts, toutes les entreprises)
// ============================================================================
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2, Megaphone } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { blogApi, BlogPost, BlogCategory } from '@/services/blog-api';
import { BlogEditor, BlogEditorForm } from '@/components/blog/BlogEditor';

export default function AdminBlogEditPage() {
  const { slug } = useParams() as { slug: string };
  const router   = useRouter();
  const user     = authService.getCurrentUser();

  const [post,     setPost]     = useState<BlogPost | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [initForm, setInitForm] = useState<Partial<BlogEditorForm> | null>(null);

  useEffect(() => {
    if (!user) { router.replace('/auth/login'); return; }
    if (user.role !== 'SUPER_ADMIN') router.replace('/rh-blog');
  }, [user, router]);

  useEffect(() => {
    if (!slug || !user) return;
    blogApi.get(slug).then(p => {
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
      <Loader2 size={28} className="animate-spin text-amber-400"/>
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <AlertCircle size={36} className="text-red-400 mb-4"/>
      <h2 className="text-lg font-bold text-white mb-2">Article introuvable</h2>
      <Link href="/admin/blog" className="text-sm text-amber-400 hover:underline no-underline mt-2">← Retour</Link>
    </div>
  );

  if (!initForm) return null;

  const isGlobal = (post as any)?.scope === 'GLOBAL';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin/blog"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all no-underline">
          <ArrowLeft size={16}/>
        </Link>
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            <Megaphone size={16} className="text-amber-400"/>
            Modifier l'article
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
            {post?.title}
            {isGlobal && (
              <span className="ml-2 text-amber-400 font-bold">· Global</span>
            )}
          </p>
        </div>
      </div>

      <BlogEditor
        mode="edit"
        slug={slug}
        isSuperAdmin={true}
        initialForm={initForm}
        quotaRemaining={null}
        onSuccess={s => router.push(`/blog/${s}`)}
      />
    </div>
  );
}