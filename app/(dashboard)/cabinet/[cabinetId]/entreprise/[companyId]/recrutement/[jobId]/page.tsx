'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
const STATUS: Record<string,string> = { DRAFT:'Brouillon', PUBLISHED:'Publiée', CLOSED:'Clôturée', ARCHIVED:'Archivée' };
export default function CabinetJobPage() {
  const { cabinetId, companyId, jobId } = useParams<{ cabinetId: string; companyId: string; jobId: string }>();
  const base = `/cabinet/${cabinetId}/entreprise/${companyId}/recrutement`;
  const [job, setJob] = useState<any>(null), [candidates, setCandidates] = useState<any[]>([]), [error, setError] = useState('');
  useEffect(() => {
    let active = true; setJob(null); setError('');
    (async () => {
      const r = await api.get<any>(`/recruitment/jobs/${jobId}`);
      if (r.companyId !== companyId) throw new Error('Cette offre ne fait pas partie de la PME sélectionnée.');
      const list = await api.get<any[]>(`/recruitment/jobs/${jobId}/candidates`);
      if (active) { setJob(r); setCandidates(list); }
    })().catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [companyId, jobId]);
  return <div className="p-6 space-y-5 text-slate-100 max-w-5xl"><Link href={base} className="text-cyan-400">← Offres d’emploi</Link>
    {error ? <p role="alert" className="text-red-300">{error}</p> : !job ? <p role="status">Chargement de l’offre…</p> : <>
      <header><h1 className="text-2xl font-semibold">{job.title}</h1><p className="text-slate-400 mt-2">{STATUS[job.status] ?? job.status} · {job.department?.name} · {job.type} · {job.location}</p></header>
      <section className="rounded-xl border border-slate-700 p-5 space-y-3"><h2 className="font-semibold">Description</h2><p className="whitespace-pre-wrap">{job.description}</p>{job.requirements && <><h2 className="font-semibold">Profil recherché</h2><p className="whitespace-pre-wrap">{job.requirements}</p></>}</section>
      {job.status === 'PUBLISHED' && <Link className="inline-block text-cyan-400" href={`/jobs/${job.id}`} target="_blank" rel="noopener noreferrer">Consulter l’offre publique ↗</Link>}
      <section><h2 className="text-lg font-semibold mb-3">Candidatures ({candidates.length})</h2>{!candidates.length ? <p className="text-slate-400">Aucune candidature reçue.</p> : <div className="overflow-x-auto"><table className="w-full text-left"><thead><tr className="border-b border-slate-700"><th className="p-3">Candidat</th><th>Statut</th><th>Reçue le</th></tr></thead><tbody>{candidates.map(c => <tr key={c.id} className="border-b border-slate-800"><td className="p-3"><Link className="text-cyan-400" href={`${base}/${job.id}/candidats/${c.id}`}>{c.firstName} {c.lastName}</Link><p className="text-xs text-slate-400">{c.email}</p></td><td>{c.status}</td><td>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</td></tr>)}</tbody></table></div>}</section>
    </>}
  </div>;
}
