// ============================================================================
// 📁 src/hooks/usePayrollData.ts (Custom Hook)
// ============================================================================

import { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';

type PayrollStatus = 'Draft' | 'Validated' | 'Paid' | 'Cancelled';

interface PayrollEntry {
  id: string;
  employeeId: string;
  name: string;
  matricule: string;
  avatar: string;
  position: string;
  department: string;
  contractType: string;
  daysWorked: number;
  totalDays: number;
  grossSalary: number;
  netSalary: number;
  charges: number;
  status: PayrollStatus;
  month: string;
  year: number;
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function usePayrollData(selectedMonth: string, selectedYear: number) {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPayrolls = async () => {
    if (entries.length === 0) setIsLoading(true);
    try {
      const data: any[] = await api.get('/payrolls');
      
      const mappedEntries: PayrollEntry[] = data.map(p => ({
        id: p.id,
        employeeId: p.employeeId,
        name: `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.trim() || 'Inconnu',
        matricule: p.employee?.employeeNumber || 'N/A',
        avatar: `https://ui-avatars.com/api/?name=${p.employee?.firstName || 'U'}+${p.employee?.lastName || 'U'}&background=random`,
        position: p.employee?.position || 'N/A',
        department: p.employee?.department?.name || 'N/A',
        contractType: 'CDI',
        daysWorked: Number(p.workedDays) || 0,
        totalDays: Number(p.workDays) || 0,
        // ✅ CORRECTION : Conversion Number explicite
        grossSalary: Number(p.grossSalary) || 0,
        netSalary: Number(p.netSalary) || 0,
        charges: (Number(p.cnssSalarial) || 0) + (Number(p.its) || 0),
        status: p.status === 'DRAFT' ? 'Draft' : p.status === 'VALIDATED' ? 'Validated' : p.status === 'PAID' ? 'Paid' : 'Cancelled',
        month: MONTHS[(p.month || 1) - 1],
        year: p.year || new Date().getFullYear()
      }));

      const filteredByDate = mappedEntries.filter(e => 
        e.month.toLowerCase() === selectedMonth.toLowerCase() && 
        e.year === selectedYear
      );
      
      setEntries(filteredByDate);
    } catch (error) {
      console.error("Failed to fetch payrolls", error);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, [selectedMonth, selectedYear]);

  // ✅ CORRECTION : Stats avec Number()
  const stats = useMemo(() => {
    const totalGross = entries.reduce((acc, curr) => acc + Number(curr.grossSalary || 0), 0);
    const totalNet = entries.reduce((acc, curr) => acc + Number(curr.netSalary || 0), 0);
    const totalCharges = entries.reduce((acc, curr) => acc + Number(curr.charges || 0), 0);
    const paidCount = entries.filter(e => e.status === 'Paid').length;
    const totalActive = entries.length;

    return { totalGross, totalNet, totalCharges, paidCount, totalActive };
  }, [entries]);

  return { entries, isLoading, stats, refetch: fetchPayrolls, setEntries };
}