// ============================================================================
// 📁 src/hooks/usePayrollData.ts (Custom Hook)
// ============================================================================
// 🐛 FIX (2026-11-23) — Page Paie vide pour certains mois (Juillet/Août/Sept.)
//   Cause : l'ancien hook appelait GET /payrolls SANS mois/année. Le serveur
//   renvoyait alors ses 200 bulletins les plus récents (tri année/mois desc),
//   soit ~2 mois à 100 employés (Nov + Oct). Le filtre du mois choisi se
//   faisait ensuite dans le navigateur sur ces 200 lignes → liste vide.
//   Correctif : on demande uniquement le mois/année affichés et on pagine
//   par blocs de 500 (limit + skip) jusqu'à épuisement → fonctionne pour
//   500, 1000 bulletins ou plus, sans dépendre d'un plafond serveur.
//   Le hook garde exactement la même forme de retour (+ `error`).
// ============================================================================

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { api } from '@/services/api';

type PayrollStatus = 'Draft' | 'Validated' | 'ToPay' | 'Paid' | 'Cancelled';

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

// Taille d'un bloc demandé au serveur (le serveur accepte jusqu'à 1000).
const PAGE_SIZE = 500;
// Garde-fou anti-boucle : 20 × 500 = 10 000 bulletins max pour un mois.
const MAX_PAGES = 20;

// Accepte un tableau brut OU un objet { data: [...] } / { items: [...] }
function extractRows(res: any): any[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

function mapStatus(s: string): PayrollStatus {
  switch (s) {
    case 'DRAFT': return 'Draft';
    case 'VALIDATED': return 'Validated';
    case 'TO_PAY': return 'ToPay';
    case 'PAID': return 'Paid';
    default: return 'Cancelled';
  }
}

export function usePayrollData(selectedMonth: string, selectedYear: number) {
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Évite qu'une réponse lente d'un ancien mois écrase le mois affiché.
  const requestId = useRef(0);

  const fetchPayrolls = useCallback(async () => {
    const myRequest = ++requestId.current;

    const monthIndex = MONTHS.findIndex(
      (m) => m.toLowerCase() === selectedMonth.toLowerCase(),
    );
    if (monthIndex < 0) {
      setEntries([]);
      setIsLoading(false);
      return;
    }
    const monthNumber = monthIndex + 1;

    setIsLoading(true);
    setError(null);

    try {
      const rows: any[] = [];
      const seen = new Set<string>();

      for (let page = 0; page < MAX_PAGES; page++) {
        const res: any = await api.get(
          `/payrolls?month=${monthNumber}&year=${selectedYear}&limit=${PAGE_SIZE}&skip=${page * PAGE_SIZE}`,
        );
        const batch = extractRows(res);

        let added = 0;
        for (const p of batch) {
          if (p?.id && !seen.has(p.id)) {
            seen.add(p.id);
            rows.push(p);
            added++;
          }
        }

        // Dernier bloc : moins de lignes que demandé, ou plus rien de nouveau.
        if (batch.length < PAGE_SIZE || added === 0) break;
      }

      if (myRequest !== requestId.current) return; // réponse périmée

      const mapped: PayrollEntry[] = rows.map((p) => ({
        id: p.id,
        employeeId: p.employeeId,
        name:
          `${p.employee?.firstName || ''} ${p.employee?.lastName || ''}`.trim() ||
          'Inconnu',
        matricule: p.employee?.employeeNumber || 'N/A',
        avatar: `https://ui-avatars.com/api/?name=${p.employee?.firstName || 'U'}+${p.employee?.lastName || 'U'}&background=random`,
        position: p.employee?.position || 'N/A',
        department: p.employee?.department?.name || 'N/A',
        contractType: p.employee?.contractType || 'CDI',
        daysWorked: Number(p.workedDays) || 0,
        totalDays: Number(p.workDays) || 0,
        grossSalary: Number(p.grossSalary) || 0,
        netSalary: Number(p.netSalary) || 0,
        charges: Number(p.totalDeductions) || 0,
        status: mapStatus(p.status),
        month: MONTHS[(p.month || 1) - 1],
        year: p.year || new Date().getFullYear(),
      }));

      // Sécurité : on garde le filtre mois/année (au cas où le serveur l'ignore).
      setEntries(
        mapped.filter(
          (e) =>
            e.month.toLowerCase() === selectedMonth.toLowerCase() &&
            e.year === selectedYear,
        ),
      );
    } catch (err: any) {
      if (myRequest !== requestId.current) return;
      console.error('Failed to fetch payrolls', err);
      setEntries([]);
      setError(err?.message || 'Impossible de charger les bulletins.');
    } finally {
      if (myRequest === requestId.current) setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const stats = useMemo(() => {
    const activeEntries=entries.filter(entry=>entry.status!=='Cancelled');
    const totalGross = activeEntries.reduce((acc, curr) => acc + Number(curr.grossSalary || 0), 0);
    const totalNet = activeEntries.reduce((acc, curr) => acc + Number(curr.netSalary || 0), 0);
    const totalCharges = activeEntries.reduce((acc, curr) => acc + Number(curr.charges || 0), 0);
    const paidCount = entries.filter((e) => e.status === 'Paid').length;
    const totalActive = activeEntries.length;

    return { totalGross, totalNet, totalCharges, paidCount, totalActive };
  }, [entries]);

  return { entries, isLoading, error, stats, refetch: fetchPayrolls, setEntries };
}
