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

interface User {
    id: string;
    role: string;
    [key: string]: any;
}

export function useAuth() {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();

        if (currentUser) {
            setUser(currentUser);
            setUserRole(currentUser.role);
            setIsAuthenticated(true);
        } else {
            setUser(null);
            setUserRole(null);
            setIsAuthenticated(false);
        }

        setLoading(false);
    }, []);

    const logout = async () => {
        // Révoquer le cookie côté serveur + nettoyer localStorage
        await authService.logout();

        // Nettoyer les données offline PWA
        try {
            await clearAllData();
        } catch { /* silencieux */ }

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