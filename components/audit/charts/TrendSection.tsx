'use client';

// ============================================================================
// 📁 components/audit/charts/TrendSection.tsx
// Section « Tendances » de l'onglet Contrôles de paie : charge la tendance du back
// et affiche les 5 graphiques. Fenêtre au choix : 6, 12 ou 24 mois.
// ============================================================================
import React, { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import { auditEngineService, type AuditSummary, type RuleDef, type TrendResponse } from '@/services/audit-engine';
import { TrendCharts } from './TrendCharts';

const WINDOWS = [6, 12, 24] as const;

export default function TrendSection({
  companyId, open, rulesByCode, refreshKey,
}: { companyId?: string; open: AuditSummary['open']; rulesByCode: Record<string, RuleDef>; refreshKey?: unknown }) {
  const [months, setMonths] = useState<(typeof WINDOWS)[number]>(12);
  const [data, setData] = useState<TrendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setError(null);
    auditEngineService.trend({ companyId, months })
      .then(r => { if (alive) setData(r); })
      .catch(e => { if (alive) setError(e?.message || 'Impossible de charger la tendance'); });
    return () => { alive = false; };
  }, [companyId, months, refreshKey]);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-sm font-black text-[var(--text)] flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[var(--brand)]" /> Tendances</p>
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface-2)]">
          {WINDOWS.map(w => (
            <button key={w} type="button" onClick={() => setMonths(w)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${months === w ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
              {w} mois
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {!data && !error && <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 text-[var(--brand)] animate-spin" /></div>}
      {data && <TrendCharts months={data.months} topRules={data.topRules} open={open} rulesByCode={rulesByCode} />}
    </section>
  );
}