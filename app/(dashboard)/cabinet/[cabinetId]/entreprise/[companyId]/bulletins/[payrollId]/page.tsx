'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
import { isFactureContract } from '@/lib/facture-contract-types';
const money = (v: any) => `${Number(v ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} XAF`;
const STATUS: Record<string,string> = { DRAFT:'Brouillon', VALIDATED:'Validé', PAID:'Payé' };
export default function CabinetPayrollPage() {
  const { cabinetId, companyId, payrollId } = useParams<{ cabinetId: string; companyId: string; payrollId: string }>();
  const [data, setData] = useState<any>(null), [error, setError] = useState('');
  useEffect(() => {
    let active = true; setData(null); setError('');
    api.get<any>(`/payrolls/${payrollId}?companyId=${companyId}`).then(r => { if (r.companyId !== companyId) throw new Error('Ce bulletin ne fait pas partie de cette PME.'); if (active) setData(r); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [companyId, payrollId]);
  return <div className="p-6 text-slate-100 space-y-5 max-w-5xl">
    <div className="flex justify-between print:hidden"><Link className="text-cyan-400" href={`/cabinet/${cabinetId}/entreprise/${companyId}/bulletins`}>← Bulletins</Link>{data && <button className="rounded-lg bg-indigo-600 px-4 py-2" onClick={() => window.print()}>Imprimer / Enregistrer en PDF</button>}</div>
    {error ? <p role="alert" className="text-red-300">{error}</p> : !data ? <p role="status">Chargement du bulletin…</p> : <article id="cabinet-payroll-document" className="rounded-xl bg-white text-slate-900 p-6 space-y-5">
      <header className="border-b pb-4"><h1 className="text-2xl font-semibold">{isFactureContract(data.employee?.contractType) ? 'Facture de prestation' : 'Bulletin de paie'} — {String(data.month).padStart(2,'0')}/{data.year}</h1><p>{data.company?.legalName}</p><p className="mt-2 font-medium">{data.employee?.firstName} {data.employee?.lastName}</p><p>{data.employee?.position} · {data.employee?.employeeNumber}</p><p>Statut : {STATUS[data.status] ?? data.status}</p></header>
      <dl className="grid sm:grid-cols-3 gap-4"><div><dt>Salaire brut</dt><dd className="text-lg font-semibold">{money(data.grossSalary)}</dd></div><div><dt>Retenues</dt><dd className="text-lg font-semibold">{money(data.totalDeductions)}</dd></div><div><dt>Net à payer</dt><dd className="text-lg font-semibold">{money(data.netSalary)}</dd></div></dl>
      <table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">Rubrique</th><th>Type</th><th className="text-right p-2">Montant</th></tr></thead><tbody>{(data.items ?? []).map((item: any, i: number) => <tr key={item.id ?? i} className="border-b"><td className="p-2">{item.label || item.name || item.code}</td><td>{item.type}</td><td className="text-right p-2">{money(item.amount)}</td></tr>)}</tbody></table>
      <p>Coût total employeur : <strong>{money(data.totalEmployerCost)}</strong></p>
      {data.status === 'DRAFT' && <p className="text-amber-800">Brouillon : ce bulletin n’est pas encore validé.</p>}
    </article>}
    <style>{`@media print { body * { visibility:hidden; } #cabinet-payroll-document, #cabinet-payroll-document * { visibility:visible; } #cabinet-payroll-document { position:absolute; left:0; top:0; width:100%; } }`}</style>
  </div>;
}
