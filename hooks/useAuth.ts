// hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    role: string;
    [key: string]: any;
}

export function useAuth() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');

        if (storedUser) {
            try {
                const parsedUser: User = JSON.parse(storedUser);
                setUser(parsedUser);
                setUserRole(parsedUser.role);
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Erreur parsing user", error);
                setUser(null);
                setUserRole(null);
                setIsAuthenticated(false);
            }
        } else {
            setUser(null);
            setUserRole(null);
            setIsAuthenticated(false);
        }

        setLoading(false);
    }, []);

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
        router.replace('/auth/login'); // Redirection après déconnexion
    };

    return { user, isAuthenticated, userRole, loading, logout };
}
