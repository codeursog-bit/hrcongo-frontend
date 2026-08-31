// ============================================================================
// 📁 services/blog-api.ts — Konza RH · Client blog typé
// Suit exactement le même pattern que services/api.ts
// ============================================================================
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────
export type BlogCategory =
  | 'GENERAL' | 'PAIE' | 'DROIT_TRAVAIL'
  | 'RECRUTEMENT' | 'FORMATION' | 'ANNONCE' | 'TEMOIGNAGE';

export type BlogScope = 'GLOBAL' | 'COMPANY';

export interface BlogAuthor {
  id:        string;
  firstName: string;
  lastName:  string;
  role:      string;
  company?:  { tradeName?: string; legalName: string; logo?: string };
}

export interface BlogPostSummary {
  id:          string;
  title:       string;
  slug:        string;
  excerpt?:    string;
  coverImage?: string;
  category:    BlogCategory;
  scope:       BlogScope;
  likesCount:  number;
  // Après
  published:   boolean;
  publishedAt: string;
  createdAt:   string;
  hasLiked?:   boolean;
  author:      BlogAuthor;
  company?:    { tradeName?: string; legalName: string };
}

export interface BlogPost extends BlogPostSummary {
  content:   string;
  updatedAt: string;
}

export interface BlogPagination {
  page:       number;
  limit:      number;
  total:      number;
  totalPages: number;
  hasNext:    boolean;
  hasPrev:    boolean;
}

export interface BlogListResponse {
  posts:      BlogPostSummary[];
  pagination: BlogPagination;
}

export interface BlogQuota {
  unlimited?: boolean;
  used:       number;
  limit:      number;
  remaining:  number;
  canPost:    boolean;
}

export interface CreatePostPayload {
  title:        string;
  excerpt?:     string;
  content:      string;
  category?:    BlogCategory;
  coverImage?:  string;
  published?:   boolean;
}

export interface UpdatePostPayload extends Partial<CreatePostPayload> {}

export interface LikeResponse {
  liked:      boolean;
  likesCount: number;
}

// ─── Fingerprint anonyme (visiteurs sans compte) ─────────────────────────────
function getFingerprint(): string {
  if (typeof window === 'undefined') return 'ssr';
  const key = 'kz_fp';
  let fp = localStorage.getItem(key);
  if (!fp) {
    fp = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(key, fp);
  }
  return fp;
}

// ─── API Blog ─────────────────────────────────────────────────────────────────
export const blogApi = {

  // ── Liste paginée (public) ─────────────────────────────────────────────────
  list(params: {
    page?:      number;
    limit?:     number;
    category?:  BlogCategory | '';
    q?:         string;
    companyId?: string;
  } = {}): Promise<BlogListResponse> {
    const qs = new URLSearchParams();
    if (params.page)      qs.set('page',      String(params.page));
    if (params.limit)     qs.set('limit',     String(params.limit));
    if (params.category)  qs.set('category',  params.category);
    if (params.q)         qs.set('q',         params.q);
    if (params.companyId) qs.set('companyId', params.companyId);
    const query = qs.toString();
    return api.get<BlogListResponse>(`/blog${query ? `?${query}` : ''}`);
  },

  // ── Détail par slug (public) ───────────────────────────────────────────────
  get(slug: string): Promise<BlogPost> {
    return api.get<BlogPost>(`/blog/${slug}`);
  },

  // ── Créer un post (HR_MANAGER, ADMIN, SUPER_ADMIN, CABINET_ADMIN) ──────────
  create(payload: CreatePostPayload): Promise<BlogPost> {
    return api.post<BlogPost>('/blog', payload);
  },

  // ── Modifier un post (auteur ou SUPER_ADMIN) ───────────────────────────────
  update(slug: string, payload: UpdatePostPayload): Promise<BlogPost> {
    return api.patch<BlogPost>(`/blog/${slug}`, payload);
  },

  // ── Supprimer un post (auteur ou SUPER_ADMIN) ──────────────────────────────
  delete(slug: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/blog/${slug}`);
  },

  // ── Quota mensuel de l'utilisateur connecté ────────────────────────────────
  quota(): Promise<BlogQuota> {
    return api.get<BlogQuota>('/blog/quota');
  },

  // ── Like / Unlike ──────────────────────────────────────────────────────────
  // Fonctionne pour les utilisateurs connectés (userId côté server)
  // et les visiteurs anonymes (fingerprint)
  like(slug: string): Promise<LikeResponse> {
    return api.post<LikeResponse>(`/blog/${slug}/like`, {
      fingerprint: getFingerprint(),
    });
  },
};