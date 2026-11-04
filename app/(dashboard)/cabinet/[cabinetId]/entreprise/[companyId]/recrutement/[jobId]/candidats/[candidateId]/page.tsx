'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';
export default function CabinetCandidatePage() {
  const { cabinetId, companyId, jobId, candidateId } = useParams<{ cabinetId: string; companyId: string; jobId: string; candidateId: string }>();
  const [data, setData] = useState<any>(null), [error, setError] = useState('');
  useEffect(() => {
    let active = true; setData(null); setError('');
    api.get<any>(`/recruitment/candidates/${candidateId}`).then(r => {
      if (r.jobOfferId !== jobId || r.jobOffer?.companyId !== companyId) throw new Error('Candidature étrangère à ce dossier.');
      if (active) setData(r);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [companyId, jobId, candidateId]);
  return <div className="p-6 text-slate-100 space-y-5 max-w-4xl"><Link className="text-cyan-400" href={`/cabinet/${cabinetId}/entreprise/${companyId}/recrutement/${jobId}`}>← Retour à l’offre</Link>
    {error ? <p role="alert" className="text-red-300">{error}</p> : !data ? <p role="status">Chargement de la candidature…</p> : <>
      <h1 className="text-2xl font-semibold">{data.firstName} {data.lastName}</h1>
      <dl className="rounded-xl border border-slate-700 p-5 grid sm:grid-cols-2 gap-4"><div><dt className="text-slate-400">Email</dt><dd>{data.email}</dd></div><div><dt className="text-slate-400">Téléphone</dt><dd>{data.phone || 'Non renseigné'}</dd></div><div><dt className="text-slate-400">Offre</dt><dd>{data.jobOffer?.title}</dd></div><div><dt className="text-slate-400">Statut</dt><dd>{data.status}</dd></div></dl>
      {data.coverLetter && <section><h2 className="font-semibold mb-2">Lettre de motivation</h2><p className="whitespace-pre-wrap">{data.coverLetter}</p></section>}
      {data.hrNotes && <section><h2 className="font-semibold mb-2">Notes RH</h2><p className="whitespace-pre-wrap">{data.hrNotes}</p></section>}
      <p className="text-sm text-slate-400">Dossier consultable par les membres autorisés du cabinet.</p>
    </>}
  </div>;
}
