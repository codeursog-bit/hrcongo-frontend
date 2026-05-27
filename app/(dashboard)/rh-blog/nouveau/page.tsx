'use client';
// ============================================================================
// 📁 app/(dashboard)/rh-blog/nouveau/page.tsx
// Utilise le composant BlogEditor enrichi (SEO + upload image)
// ============================================================================
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { authService } from '@/lib/services/authService';
import { blogApi, BlogQuota } from '@/services/blog-api';
import { BlogEditor } from '@/components/blog/BlogEditor';

const CAN_POST = ['HR_MANAGER', 'ADMIN', 'CABINET_ADMIN'];

export default function RhBlogNouveauPage() {
  const router = useRouter();
  const user   = authService.getCurrentUser();

  const [quota, setQuota] = useState<BlogQuota | null>(null);

  useEffect(() => {
    if (!user) { router.replace('/auth/login'); return; }
    if (user.role === 'SUPER_ADMIN') { router.replace('/admin/blog/nouveau'); return; }
    if (!CAN_POST.includes(user.role)) { router.replace('/rh-blog'); return; }
    blogApi.quota().then(setQuota).catch(() => {});
  }, [user, router]);

  if (!user || !CAN_POST.includes(user.role)) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/rh-blog"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all no-underline">
          <ArrowLeft size={16}/>
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">Rédiger un article</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visible par les membres de votre entreprise · Scope : Entreprise
            {quota && !quota.unlimited && (
              <span className={`ml-3 font-bold ${quota.remaining === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {quota.remaining}/{quota.limit} posts ce mois
              </span>
            )}
          </p>
        </div>
      </div>

      <BlogEditor
        mode="create"
        isSuperAdmin={false}
        quotaRemaining={quota?.unlimited ? null : (quota?.remaining ?? undefined)}
        quotaLimit={quota?.limit}
        onSuccess={slug => router.push(`/blog/${slug}`)}
      />
    </div>
  );
}