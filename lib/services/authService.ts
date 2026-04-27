// ============================================================================
// 📁 lib/services/authService.ts
// Auth unifié — Super Admin ET utilisateurs normaux
// Tokens JWT en cookie HttpOnly (géré par le navigateur + serveur)
// localStorage : uniquement les données d'affichage (user object)
// ============================================================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const authService = {

  // ── Connexion (admin ou user normal) ─────────────────────────────────────
  async login(email: string, password: string) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Identifiants incorrects');

    // Stocker uniquement les données d'affichage
    if (typeof window !== 'undefined' && data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
      // Pour le panel admin on garde aussi admin_user
      if (data.user.role === 'SUPER_ADMIN') {
        localStorage.setItem('admin_user', JSON.stringify(data.user));
      }
    }
    return data;
  },

  // ── Déconnexion — révoque le cookie côté serveur ──────────────────────────
  async logout() {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST', credentials: 'include',
      });
    } catch { /* silencieux */ } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('admin_user');
        localStorage.removeItem('notifications_muted_until');
      }
    }
  },

  // ── Récupérer le user courant ─────────────────────────────────────────────
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    // Essayer d'abord 'user', puis 'admin_user'
    const raw = localStorage.getItem('user') || localStorage.getItem('admin_user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  // ── Vérifier si authentifié (via cookie) ─────────────────────────────────
  async isAuthenticated(): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/auth/verify`, {
        method: 'POST', credentials: 'include',
      });
      return res.ok;
    } catch { return false; }
  },

  // ── Compatibilité avec ancien code qui appelait getToken() ───────────────
  getToken(): string | null {
    // Tokens en cookie HttpOnly — on retourne truthy si user présent
    const user = this.getCurrentUser();
    return user ? 'cookie-based-auth' : null;
  },
};