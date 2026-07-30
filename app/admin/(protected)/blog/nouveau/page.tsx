'use client';
// ============================================================================
// 📁 app/admin/blog/nouveau/page.tsx — SUPER ADMIN
// Utilise le composant BlogEditor enrichi (SEO + upload image)
// ============================================================================
import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Megaphone } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { BlogEditor } from '@/components/blog/BlogEditor';

export default function AdminBlogNouveauPage() {
  const router = useRouter();
  const user   = authService.getCurrentUser();

  useEffect(() => {
    if (!user) { router.replace('/auth/login'); return; }
    if (user.role !== 'SUPER_ADMIN') router.replace('/rh-blog/nouveau');
  }, [user, router]);

  if (!user || user.role !== 'SUPER_ADMIN') return null;

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
            <Megaphone size={18} className="text-amber-400"/>
            Publier une annonce officielle
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse"/>
            Portée globale · Visible par toute la communauté · Illimité
          </p>
        </div>
      </div>

      <BlogEditor
        mode="create"
        isSuperAdmin={true}
        quotaRemaining={null}
        initialForm={{ category: 'ANNONCE' }}
        onSuccess={slug => router.push(`/blog/${slug}`)}
      />
    </div>
  );
}