'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ListOrdered, PlusCircle } from 'lucide-react';
import { LoansForm } from '@/components/loans/LoansForm'; // Importe le formulaire créé
import { LoansList } from '@/components/loans/LoansList'; // Importe la liste (à créer juste après)
import { GlobalLoader } from '@/components/ui/GlobalLoader'; 
import { useAuth } from '@/hooks/useAuth';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function LoansPage() {
    const { isAuthenticated, userRole } = useAuth();
    const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
    const [refreshKey, setRefreshKey] = useState(0); // Clé pour forcer le rafraîchissement de la liste

    // Fonction pour forcer le rafraîchissement de la liste après la création
    const handleCreationSuccess = useCallback(() => {
        setRefreshKey(prev => prev + 1);
        setView('LIST'); // Revenir à la liste après succès
    }, []);

    if (!isAuthenticated || !['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(userRole as string)) {
        return <GlobalLoader />; // Ou un composant d'accès refusé
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 p-6 lg:p-8">
            <header className="flex justify-between items-center pb-4 border-b border-gray-200 dark:border-white/10">
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <DollarSign size={32} className="text-cyan-600" />
                    Gestion des Prêts & Avances
                </h1>
                
                <button 
                    onClick={() => setView(view === 'LIST' ? 'CREATE' : 'LIST')}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors shadow-lg shadow-cyan-500/30"
                >
                    {view === 'LIST' ? (
                        <>
                            <PlusCircle size={20} /> Nouveau Financement
                        </>
                    ) : (
                        <>
                            <ListOrdered size={20} /> Voir la Liste
                        </>
                    )}
                </button>
            </header>

            <motion.div 
                key={view} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="pt-4"
            >
                {view === 'CREATE' ? (
                    <LoansForm onCreationSuccess={handleCreationSuccess} />
                ) : (
                    <LoansList refreshKey={refreshKey} />
                )}
            </motion.div>
        </motion.div>
    );
}