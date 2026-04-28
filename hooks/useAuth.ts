// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter, usePathname } from 'next/navigation';
// import { clearAllData } from '@/lib/pwa/db';
// import { authService } from '@/lib/services/authService';

// interface User {
//     id: string;
//     role: string;
//     [key: string]: any;
// }

// export function useAuth() {
//     const router = useRouter();
//     const pathname = usePathname();
//     const [user, setUser] = useState<User | null>(null);
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [userRole, setUserRole] = useState<string | null>(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const currentUser = authService.getCurrentUser();

//         if (currentUser) {
//             setUser(currentUser);
//             setUserRole(currentUser.role);
//             setIsAuthenticated(true);
//         } else {
//             setUser(null);
//             setUserRole(null);
//             setIsAuthenticated(false);
//         }

//         setLoading(false);
//     }, []);

//     const logout = async () => {
//         // Nettoyer avec authService
//         authService.logout();
        
//         // Nettoyer les données offline PWA
//         try {
//             await clearAllData();
//             console.log('✅ Données PWA nettoyées');
//         } catch (error) {
//             console.error('Erreur nettoyage PWA:', error);
//         }
        
//         // Reset state
//         setUser(null);
//         setUserRole(null);
//         setIsAuthenticated(false);
        
//         // ✅ Rediriger selon le contexte (admin ou utilisateur normal)
//         const isAdminRoute = pathname?.startsWith('/admin');
//         router.replace(isAdminRoute ? '/admin/login' : '/auth/login');
//     };

//     return { user, isAuthenticated, userRole, loading, logout };
// }




'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clearAllData } from '@/lib/pwa/db';
import { authService } from '@/lib/services/authService';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface User {
  id: string;
  role: string;
  [key: string]: any;
}

export function useAuth() {
  const router   = useRouter();
  const pathname = usePathname();

  const [user, setUser]                       = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole]               = useState<string | null>(null);
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      // ── 1. Lecture rapide localStorage (affichage optimiste immédiat) ──────
      const localUser = authService.getCurrentUser();
      if (localUser && !cancelled) {
        setUser(localUser);
        setUserRole(localUser.role);
        setIsAuthenticated(true);
      }

      // ── 2. Vérification du cookie via /auth/verify ────────────────────────
      try {
        const res = await fetch(`${API_URL}/auth/verify`, {
          method:      'POST',
          credentials: 'include',
        });

        if (res.ok) {
          // Cookie valide → synchroniser localStorage avec les données fraîches
          const data = await res.json();
          if (data.user && !cancelled) {
            // Fusionner pour ne pas perdre des champs absents du verify (ex: cabinetId)
            const merged = { ...localUser, ...data.user };
            localStorage.setItem('user', JSON.stringify(merged));
            setUser(merged);
            setUserRole(merged.role);
            setIsAuthenticated(true);
          }

        } else if (res.status === 401) {
          // ── 3. Cookie access_token expiré → tenter un refresh silencieux ──
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method:      'POST',
            credentials: 'include',
          });

          if (refreshRes.ok) {
            // Refresh OK → re-vérifier avec le nouveau cookie
            const verifyRes = await fetch(`${API_URL}/auth/verify`, {
              method:      'POST',
              credentials: 'include',
            });

            if (verifyRes.ok && !cancelled) {
              const data = await verifyRes.json();
              if (data.user) {
                const merged = { ...localUser, ...data.user };
                localStorage.setItem('user', JSON.stringify(merged));
                setUser(merged);
                setUserRole(merged.role);
                setIsAuthenticated(true);
              }
            }
          } else {
            // ── 4. Refresh échoué aussi → vraiment déconnecté ────────────
            if (!cancelled) {
              localStorage.removeItem('user');
              setUser(null);
              setUserRole(null);
              setIsAuthenticated(false);
            }
          }
        }
      } catch {
        // Erreur réseau → garder l'état local optimiste, pas de logout
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    initAuth();

    // Cleanup pour éviter des setState après démontage
    return () => { cancelled = true; };
  }, []); // ← une seule fois au montage

  const logout = async () => {
    // Révoquer le cookie côté serveur
    await authService.logout();

    // Nettoyer les données offline PWA
    try { await clearAllData(); } catch { /* silencieux */ }

    // Reset state
    setUser(null);
    setUserRole(null);
    setIsAuthenticated(false);

    // Rediriger selon le contexte
    const isAdminRoute = pathname?.startsWith('/admin');
    router.replace(isAdminRoute ? '/admin/login' : '/auth/login');
  };

  return { user, isAuthenticated, userRole, loading, logout };
}