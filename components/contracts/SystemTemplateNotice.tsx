'use client';

// ============================================================================
// 📁 components/contracts/SystemTemplateNotice.tsx
// Modale affichée avant de copier un modèle fourni par Konza : c'est une simple
// BASE, identique pour toutes les entreprises. L'utilisateur doit confirmer qu'il
// l'adaptera et le fera relire par un juriste avant tout usage.
// ============================================================================
import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function SystemTemplateNotice({
  name, busy, onConfirm, onCancel,
}: { name: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  const [ack, setAck] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><AlertTriangle className="w-5 h-5" /></div>
          <div>
            <h3 className="font-bold text-[var(--text)]">Ce modèle est une simple base</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              « {name} » est un exemple fourni par Konza RH. <strong className="text-[var(--text)]">Il est identique pour toutes les entreprises qui l'utilisent</strong> et ne remplace pas un avis juridique.
            </p>
          </div>
        </div>
        <ul className="text-sm text-[var(--text)] space-y-1.5 list-disc pl-5">
          <li>Retouchez-le : adaptez les clauses à votre activité, à votre convention collective et à vos pratiques, pour que votre contrat soit le vôtre.</li>
          <li>Faites-le relire par un juriste avant de l'utiliser avec vos salariés.</li>
          <li>Vous obtenez une <strong>copie modifiable</strong> : le modèle d'origine ne change pas.</li>
        </ul>
        <label className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--text)] cursor-pointer">
          <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-0.5" />
          <span>Je comprends que je dois adapter ce modèle et le faire relire par un juriste avant tout usage.</span>
        </label>
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--surface-2)]">Annuler</button>
          <button onClick={onConfirm} disabled={busy || !ack}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white disabled:opacity-50 flex items-center gap-2">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Créer ma copie
          </button>
        </div>
      </div>
    </div>
  );
}