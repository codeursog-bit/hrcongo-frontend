'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { 
    CreditCard, Clock, CheckCircle, XCircle, List, ArrowDown, ArrowUp, Loader2, 
    Calendar, User, Wallet 
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Types de données pour la liste ---
interface Employee {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    photoUrl?: string;
}

interface Loan {
    id: string;
    amount: number;
    monthlyRepayment: number;
    remainingBalance: number;
    status: 'ACTIVE' | 'PAID' | 'CANCELLED';
    startDate: string;
    endDate: string;
    reason: string;
    employee: Employee;
}

interface Advance {
    id: string;
    amount: number;
    status: 'APPROVED' | 'DEDUCTED' | 'CANCELLED';
    deductMonth: number;
    deductYear: number;
    reason: string;
    employee: Employee;
}

type Tab = 'LOANS' | 'ADVANCES';

const statusStyles: Record<'ACTIVE' | 'PAID' | 'APPROVED' | 'DEDUCTED' | 'CANCELLED', { icon: React.ReactNode, color: string }> = {
    ACTIVE: { icon: <Clock size={16} />, color: 'text-amber-500 bg-amber-500/10' },
    PAID: { icon: <CheckCircle size={16} />, color: 'text-[var(--text-muted)] bg-[var(--surface-2)]' },
    APPROVED: { icon: <CheckCircle size={16} />, color: 'text-emerald-500 bg-emerald-500/10' },
    DEDUCTED: { icon: <Wallet size={16} />, color: 'text-[var(--text-muted)] bg-[var(--surface-2)]' },
    CANCELLED: { icon: <XCircle size={16} />, color: 'text-red-500 bg-red-500/10' },
};

const formatCurrency = (amount: number) => amount ? `${amount.toLocaleString()} F` : '0 F';

export const LoansList = ({ refreshKey }: { refreshKey: number }) => {
    const [activeTab, setActiveTab] = useState<Tab>('LOANS');
    const [loading, setLoading] = useState(true);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [advances, setAdvances] = useState<Advance[]>([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [loansRes, advancesRes] = await Promise.all([
                api.get('/loans'),
                api.get('/loans/advances'),
            ]);
            
            // ✅ Cast des réponses avec les types appropriés
            setLoans(loansRes as Loan[]);
            setAdvances(advancesRes as Advance[]);
        } catch (error) {
            console.error("Erreur lors du chargement des financements", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]); // Déclenché lors du changement de clé de rafraîchissement

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-emerald-500" size={48} />
            </div>
        );
    }

    const currentData = activeTab === 'LOANS' ? loans : advances;

    // Fonction d'affichage pour les prêts
    const renderLoanItem = (loan: Loan) => {
        const status = statusStyles[loan.status];
        return (
            <div key={loan.id} className="grid grid-cols-6 gap-4 items-center p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] hover:bg-[var(--border)] transition-colors">
                <div className="flex items-center gap-3 col-span-2">
                    <User size={20} className="text-emerald-500" />
                    <span className="font-semibold text-[var(--text)] truncate">{loan.employee.firstName} {loan.employee.lastName}</span>
                </div>
                
                <span className="text-sm font-mono">{formatCurrency(loan.amount)}</span>
                <span className="text-sm font-mono text-amber-600">{formatCurrency(loan.monthlyRepayment)}</span>
                
                <div className="text-sm">
                    <p className="text-[var(--text)]">{formatCurrency(loan.remainingBalance)}</p>
                    <p className="text-xs text-[var(--text-muted)]">Solde Restant</p>
                </div>

                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.icon}
                    <span>{loan.status}</span>
                </div>
            </div>
        );
    };

    // Fonction d'affichage pour les avances
    const renderAdvanceItem = (advance: Advance) => {
        const status = statusStyles[advance.status];
        return (
            <div key={advance.id} className="grid grid-cols-6 gap-4 items-center p-4 bg-[var(--surface-2)] rounded-xl border border-[var(--border)] hover:bg-[var(--border)] transition-colors">
                <div className="flex items-center gap-3 col-span-2">
                    <User size={20} className="text-emerald-500" />
                    <span className="font-semibold text-[var(--text)] truncate">{advance.employee.firstName} {advance.employee.lastName}</span>
                </div>
                
                <span className="text-sm font-mono">{formatCurrency(advance.amount)}</span>
                <div className="text-sm">
                    <p className="text-[var(--text)]">{advance.deductMonth}/{advance.deductYear}</p>
                    <p className="text-xs text-[var(--text-muted)]">Mois de déduction</p>
                </div>
                <span className="text-xs text-[var(--text-muted)] italic col-span-1 truncate">{advance.reason}</span>
                
                <div className={`flex items-center justify-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                    {status.icon}
                    <span>{advance.status}</span>
                </div>
            </div>
        );
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="bg-[var(--surface)] rounded-2xl p-6 border border-[var(--border)] shadow-sm"
        >
            {/* Tabs Navigation */}
            <div className="flex border-b border-[var(--border)] mb-6">
                <button 
                    onClick={() => setActiveTab('LOANS')}
                    className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'LOANS' ? 'text-emerald-600 border-b-2 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400' : 'text-[var(--text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                >
                    Prêts ({loans.length})
                </button>
                <button 
                    onClick={() => setActiveTab('ADVANCES')}
                    className={`px-6 py-3 text-sm font-bold transition-colors ${activeTab === 'ADVANCES' ? 'text-emerald-600 border-b-2 border-emerald-600 dark:text-emerald-400 dark:border-emerald-400' : 'text-[var(--text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                >
                    Avances ({advances.length})
                </button>
            </div>
            
            <motion.div 
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
            >
                {/* Headers */}
                <div className="grid grid-cols-6 gap-4 text-xs font-bold uppercase text-[var(--text-muted)] mb-3 px-4">
                    <span className="col-span-2">Employé</span>
                    <span>Montant Total</span>
                    {activeTab === 'LOANS' ? (
                        <>
                            <span>Remb. Mensuel</span>
                            <span>Solde Restant</span>
                            <span>Statut</span>
                        </>
                    ) : (
                        <>
                            <span>Déduction Prévue</span>
                            <span>Raison</span>
                            <span>Statut</span>
                        </>
                    )}
                </div>

                {/* List Items */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {currentData.length > 0 ? (
                        activeTab === 'LOANS' ? 
                            loans.map(renderLoanItem) : 
                            advances.map(renderAdvanceItem)
                    ) : (
                        <div className="text-center py-10 text-[var(--text-muted)]">
                            <List size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Aucun {activeTab === 'LOANS' ? 'Prêt' : 'Avance'} enregistré pour l'instant.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};