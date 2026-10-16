'use client';

// 📁 app/(dashboard)/forbidden/page.tsx
// ✅ Page 403 — affiche le VRAI rôle de l'utilisateur (avant : « EMPLOYEE » / « ADMIN » écrits en dur).

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import AccessDenied from '@/components/AccessDenied';
import { homeFor } from '@/lib/route-access';

export default function ForbiddenPage() {
  const { userRole } = useAuth();
  return <AccessDenied role={userRole} homeHref={homeFor(userRole)} />;
}
