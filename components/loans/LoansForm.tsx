'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
    CreditCard, Calendar, Clock, DollarSign, List, UserCheck, 
    ArrowLeft, ArrowRight, Save, Loader2, CheckCircle, XCircle, 
    Wallet, Search, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

// --- Types ---
interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position: string;
    photoUrl?: string;
    baseSalary?: number;
    departmentId?: string;
    department?: { id: string; name: string };
}

interface LoanData {
    employeeId: string;
    amount: number;
    monthlyRepayment: number;
    startDate: string;
    endDate: string;
    reason: string;
}

interface AdvanceData {
    employeeId: string;
    amount: number;
    deductMonth: number;
    deductYear: number;
    reason: string;
}

type FormType = 'LOAN' | 'ADVANCE';

// --- Input ---
interface InputProps {
    icon?: React.ElementType;
    label: string;
    name: string;
    type?: string;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    placeholder?: string;
    min?: number;
    max?: number;
    required?: boolean;
    disabled?: boolean;
}

const Input = ({ icon: Icon, label, name, type = 'text', value, onChange, placeholder, min, max, required, disabled }: InputProps) => (
    <div>
        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                    <Icon size={18} />
                </div>
            )}
            {type === 'textarea' ? (
                <textarea
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    rows={3}
                    className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                />
            ) : (
                <input
                    type={type}
                    name={name}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                    required={required}
                    disabled={disabled}
                    className={`w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                />
            )}
        </div>
    </div>
);

// --- EmployeeSelect avec recherche ---
interface EmployeeSelectProps {
    label: string;
    name: string;
    value: string;
    onChange: (employeeId: string) => void;
    employees: Employee[];
    loading?: boolean;
    required?: boolean;
}

const EmployeeSelect = ({ label, value, onChange, employees, loading, required }: EmployeeSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const selectedEmployee = employees.find(e => e.id === value);

    const filteredEmployees = useMemo(() => {
        if (!searchQuery) return employees;
        const query = searchQuery.toLowerCase();
        return employees.filter(e =>
            e.firstName.toLowerCase().includes(query) ||
            e.lastName.toLowerCase().includes(query) ||
            (e.employeeNumber || '').toLowerCase().includes(query) ||
            (e.position || '').toLowerCase().includes(query)
        );
    }, [employees, searchQuery]);

    const handleSelect = (employeeId: string) => {
        onChange(employeeId);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="relative">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-left hover:border-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <UserCheck size={18} className="text-gray-400 flex-shrink-0" />
                {loading ? (
                    <span className="text-gray-400 flex-1">Chargement...</span>
                ) : selectedEmployee ? (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                                {selectedEmployee.firstName} {selectedEmployee.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                                {selectedEmployee.employeeNumber && `${selectedEmployee.employeeNumber} · `}{selectedEmployee.position}
                                {selectedEmployee.department?.name && ` · ${selectedEmployee.department.name}`}
                            </p>
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-400 flex-1">Sélectionner un employé</span>
                )}
                <ChevronDown size={18} className={`text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 max-h-80 overflow-hidden"
                    >
                        {/* Barre de recherche */}
                        <div className="p-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher un employé..."
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Liste */}
                        <div className="overflow-y-auto max-h-64">
                            {filteredEmployees.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">
                                    <UserCheck size={32} className="mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Aucun employé trouvé</p>
                                </div>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <button
                                        key={emp.id}
                                        type="button"
                                        onClick={() => handleSelect(emp.id)}
                                        className={`w-full flex items-center gap-3 p-3 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                                            value === emp.id ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm">
                                            {emp.firstName[0]}{emp.lastName[0]}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                                                {emp.firstName} {emp.lastName}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {emp.employeeNumber && `${emp.employeeNumber} · `}{emp.position}
                                                {emp.department?.name && ` · ${emp.department.name}`}
                                            </p>
                                        </div>
                                        {value === emp.id && (
                                            <CheckCircle size={18} className="text-cyan-500 flex-shrink-0" />
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            )}
        </div>
    );
};

// --- Button ---
interface ButtonProps {
    children: React.ReactNode;
    type?: 'button' | 'submit';
    variant?: 'primary' | 'secondary';
    className?: string;
    disabled?: boolean;
    onClick?: () => void;
}

const Button = ({ children, type = 'button', variant = 'primary', className = '', disabled, onClick }: ButtonProps) => {
    const baseStyles = "px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
    const variants = {
        primary: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-lg hover:scale-105",
        secondary: "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
    };
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

// --- Notification ---
interface NotificationProps {
    type: 'success' | 'error';
    message: string;
    onClose: () => void;
    className?: string;
}

const Notification = ({ type, message, onClose, className = '' }: NotificationProps) => {
    const styles = {
        success: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
        error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`flex items-start gap-3 p-4 rounded-xl border-2 ${styles[type]} ${className}`}
        >
            <div className="flex-shrink-0 mt-0.5">
                {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
            </div>
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button onClick={onClose} className="flex-shrink-0 hover:opacity-70 transition-opacity">
                <XCircle size={18} />
            </button>
        </motion.div>
    );
};

// --- GlassCard ---
const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className={`bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-gray-200 dark:border-white/10 shadow-2xl ${className}`}
    >
        {children}
    </motion.div>
);

// ============================================================
// 🏦 COMPOSANT PRINCIPAL
// ============================================================
export const LoansForm = ({ onCreationSuccess }: { onCreationSuccess: () => void }) => {
    const [formType, setFormType] = useState<FormType>('LOAN');
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            setLoadingEmployees(true);
            try {
                // ✅ /employees/simple — liste légère déjà filtrée par entreprise
                // Pas d'objet paginé, pas de filtre baseSalary côté front
                // La validation métier (salaire suffisant) est faite côté backend
                const data = await api.get<Employee[]>('/employees/simple');
                const list = Array.isArray(data) ? data : [];
                console.log(`✅ ${list.length} employés chargés pour le formulaire prêts`);
                setEmployees(list);
            } catch (error) {
                console.error('❌ Erreur chargement employés:', error);
                setEmployees([]);
            } finally {
                setLoadingEmployees(false);
            }
        };
        fetchEmployees();
    }, []);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: ['amount', 'monthlyRepayment', 'deductMonth', 'deductYear'].includes(name)
                ? parseFloat(value) || 0
                : value,
        }));
    }, []);

    const handleEmployeeChange = useCallback((employeeId: string) => {
        setFormData((prev: any) => ({ ...prev, employeeId }));
    }, []);

    const validateForm = useCallback((data: any) => {
        const errors: string[] = [];

        if (!data.employeeId) {
            errors.push("Veuillez sélectionner un employé.");
            return errors;
        }

        if (formType === 'LOAN') {
            const { amount, monthlyRepayment, startDate, endDate } = data as LoanData;
            if (!amount || amount <= 0 || !monthlyRepayment || monthlyRepayment <= 0) {
                errors.push("Le montant et le remboursement mensuel doivent être positifs.");
            }
            if (!startDate || !endDate || new Date(startDate) >= new Date(endDate)) {
                errors.push("Les dates de début et fin de prêt sont invalides.");
            }
            // ⚠️ Validation métier (30% salaire, SMIC, durée 24 mois) → backend uniquement
        } else {
            const { amount, deductMonth, deductYear } = data as AdvanceData;
            if (!amount || amount <= 0) {
                errors.push("Le montant de l'avance doit être positif.");
            }
            if (!deductMonth || deductMonth < 1 || deductMonth > 12 || !deductYear || deductYear < 2024) {
                errors.push("Mois ou année de déduction invalide.");
            }
            // ⚠️ Validation métier (50% salaire) → backend uniquement
        }

        if (!data.reason || data.reason.trim().length < 5) {
            errors.push("Une raison d'au moins 5 caractères est requise.");
        }

        return errors;
    }, [formType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        const errors = validateForm(formData);
        if (errors.length > 0) {
            setMessage({ type: 'error', text: errors.join(' / ') });
            return;
        }

        setLoading(true);
        const endpoint = formType === 'LOAN' ? '/loans' : '/loans/advances';
        const label    = formType === 'LOAN' ? 'Prêt' : 'Avance';

        try {
            await api.post(endpoint, {
                ...formData,
                amount: Number(formData.amount),
                ...(formType === 'LOAN' && { monthlyRepayment: Number(formData.monthlyRepayment) }),
            });
            setMessage({ type: 'success', text: `${label} créé et approuvé avec succès !` });
            setFormData({});
            setTimeout(() => onCreationSuccess(), 1500);
        } catch (error: any) {
            console.error(error);
            // Afficher le message d'erreur métier du backend (30%, SMIC, durée...)
            const msg = error?.response?.data?.message || error?.message || `Erreur lors de la création du ${label}.`;
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    const isLoan = formType === 'LOAN';

    return (
        <GlassCard>
            <div className="flex justify-between items-center mb-6 border-b pb-4 border-gray-200 dark:border-white/10">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <CreditCard size={28} className="text-cyan-500" />
                    Créer Financement
                </h2>
                <div className="flex bg-gray-100 dark:bg-slate-800 rounded-full p-1 shadow-inner">
                    <button
                        onClick={() => setFormType('LOAN')}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-all flex items-center ${isLoan ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-400 hover:bg-white/10'}`}
                    >
                        {isLoan && <ArrowLeft size={16} className="mr-2" />} Prêt
                    </button>
                    <button
                        onClick={() => setFormType('ADVANCE')}
                        className={`px-4 py-2 text-sm font-semibold rounded-full transition-all flex items-center ${!isLoan ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-400 hover:bg-white/10'}`}
                    >
                        Avance {!isLoan && <ArrowRight size={16} className="ml-2" />}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <EmployeeSelect
                        label="Employé Concerné"
                        name="employeeId"
                        value={formData.employeeId || ''}
                        onChange={handleEmployeeChange}
                        employees={employees}
                        loading={loadingEmployees}
                        required
                    />
                    <Input
                        icon={DollarSign}
                        label={isLoan ? "Montant Total du Prêt (FCFA)" : "Montant de l'Avance (FCFA)"}
                        name="amount"
                        type="number"
                        value={formData.amount || ''}
                        onChange={handleChange}
                        min={1}
                        placeholder="Ex: 500000"
                        required
                    />
                </div>

                <AnimatePresence mode="wait">
                    {isLoan ? (
                        <motion.div
                            key="loan"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 overflow-hidden"
                        >
                            <Input icon={Wallet} label="Remboursement Mensuel (FCFA)" name="monthlyRepayment" type="number" value={formData.monthlyRepayment || ''} onChange={handleChange} placeholder="Ex: 25000" min={1} required />
                            <Input icon={Calendar} label="Date de Début" name="startDate" type="date" value={formData.startDate || ''} onChange={handleChange} required />
                            <Input icon={Clock} label="Date de Fin Estimée" name="endDate" type="date" value={formData.endDate || ''} onChange={handleChange} required />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="advance"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 overflow-hidden"
                        >
                            <Input icon={Calendar} label="Mois de Déduction (1-12)" name="deductMonth" type="number" value={formData.deductMonth || ''} onChange={handleChange} min={1} max={12} placeholder="Ex: 10 (Octobre)" required />
                            <Input icon={Clock} label="Année de Déduction" name="deductYear" type="number" value={formData.deductYear || ''} onChange={handleChange} min={new Date().getFullYear()} placeholder="Ex: 2026" required />
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mb-6">
                    <Input icon={List} label="Raison du Financement / Avance" name="reason" type="textarea" value={formData.reason || ''} onChange={handleChange} placeholder="Détaillez la raison (achat immobilier, dépense imprévue, etc.)" required />
                </div>

                <AnimatePresence>
                    {message && (
                        <Notification type={message.type} message={message.text} onClose={() => setMessage(null)} className="mb-4" />
                    )}
                </AnimatePresence>

                <Button type="submit" variant="primary" className="w-full flex items-center justify-center" disabled={loading}>
                    {loading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Traitement...</>
                    ) : (
                        <><Save className="mr-2 h-5 w-5" />{isLoan ? "Approuver et Enregistrer le Prêt" : "Approuver et Enregistrer l'Avance"}</>
                    )}
                </Button>
            </form>
        </GlassCard>
    );
};