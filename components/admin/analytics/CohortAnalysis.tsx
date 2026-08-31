// ============================================================================
// Fichier: frontend/components/admin/analytics/CohortAnalysis.tsx
// ============================================================================

import React from 'react';

interface CohortData {
  cohort: string;
  months: number[];
}

interface CohortAnalysisProps {
  data?: CohortData[];
}

export const CohortAnalysis: React.FC<CohortAnalysisProps> = ({ data = [] }) => {
    const getColor = (value: number) => {
        if (value === 0) return 'bg-transparent';
        if (value >= 95) return 'bg-green-500 text-white';
        if (value >= 90) return 'bg-green-600/80 text-white';
        if (value >= 80) return 'bg-green-700/60 text-green-100';
        if (value >= 70) return 'bg-yellow-600/50 text-yellow-100';
        return 'bg-red-900/40 text-red-200';
    };

    return (
        <div className="overflow-x-auto">
            {data.length > 0 ? (
              <table className="w-full text-center text-xs border-collapse">
                  <thead>
                      <tr className="text-gray-500">
                          <th className="p-2 text-left font-medium">Cohort</th>
                          <th className="p-2 font-medium">Month 1</th>
                          <th className="p-2 font-medium">Month 2</th>
                          <th className="p-2 font-medium">Month 3</th>
                          <th className="p-2 font-medium">Month 6</th>
                          <th className="p-2 font-medium">Month 12</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                      {data.map((row, i) => (
                          <tr key={i}>
                              <td className="p-2 text-left text-gray-300 font-mono">{row.cohort}</td>
                              {row.months.map((val, j) => (
                                  <td key={j} className="p-1">
                                      <div className={`w-full h-8 flex items-center justify-center rounded ${getColor(val)}`}>
                                          {val > 0 ? `${val}%` : '-'}
                                      </div>
                                  </td>
                              ))}
                          </tr>
                      ))}
                  </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Données de cohorte non disponibles
              </div>
            )}
        </div>
    );
};