'use client';

// ============================================================================
// 📁 components/formation/AttendanceSheetPrintable.tsx
// ✅ Feuille d'émargement d'une session de formation — A4 paysage, plusieurs
//    pages si besoin (beaucoup de participants ou de jours).
//    Une colonne « Matin » et une « Après-midi » par jour : l'employé signe.
//    En-tête entreprise dynamique (logo ou nom), même technique d'impression
//    que les autres documents (printLeaveDocument — styles « std-* » verrouillés).
// ============================================================================

import React from 'react';

interface CompanyInfo {
  legalName?: string;
  tradeName?: string;
  logo?: string | null;
  rccmNumber?: string;
  taxNumber?: string;
}

export interface SheetSession {
  courseTitle: string;
  label?: string | null;
  startDate: string; // AAAA-MM-JJ
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  trainerName?: string | null;
  durationHours?: number | null;
}

export interface SheetParticipant {
  firstName: string;
  lastName: string;
  position?: string | null;
  department?: string | null;
}

const DAYS_PER_PAGE = 4;
const ROWS_PER_PAGE = 12;

const frDate = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
};
const frDay = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' });
};

const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out.length ? out : [[]];
};

export default function AttendanceSheetPrintable({
  id, company, session, days, participants,
}: {
  id: string;
  company: CompanyInfo;
  session: SheetSession;
  days: string[];
  participants: SheetParticipant[];
}) {
  const companyName = company.tradeName || company.legalName || 'Entreprise';
  const dayChunks = chunk(days, DAYS_PER_PAGE);
  const rowChunks = chunk(participants, ROWS_PER_PAGE);

  // Une page par (groupe de jours × groupe de participants)
  const pages: Array<{ days: string[]; rows: SheetParticipant[]; offset: number }> = [];
  dayChunks.forEach((dc) =>
    rowChunks.forEach((rc, ri) => pages.push({ days: dc, rows: rc, offset: ri * ROWS_PER_PAGE })),
  );

  const period =
    session.startDate === session.endDate
      ? `Le ${frDate(session.startDate)}`
      : `Du ${frDate(session.startDate)} au ${frDate(session.endDate)}`;
  const hours =
    session.startTime && session.endTime ? `${session.startTime} – ${session.endTime}` : session.startTime ?? '';

  return (
    <div id={id} className="std-train-root">
      {/* Les classes std-* échappent à la remise à blanc de l'impression : on verrouille nos couleurs ici */}
      <style>{`
        .std-train-root { font-family: Arial, Helvetica, sans-serif; background:#fff !important; }
        .std-train-page { width:297mm !important; height:210mm !important; box-sizing:border-box !important; padding:9mm 12mm !important; background:#fff !important; color:#111 !important; display:flex !important; flex-direction:column !important; overflow:hidden !important; page-break-after:always; break-after:page; }
        .std-train-page:last-child { page-break-after:auto; break-after:auto; }
        .std-train-title { text-align:center; font-size:16px; font-weight:800; letter-spacing:1px; margin:2px 0 8px; color:#111 !important; }
        .std-train-info { display:grid !important; grid-template-columns:1fr 1fr 1fr !important; gap:3px 18px !important; font-size:10.5px !important; margin-bottom:8px !important; color:#111 !important; }
        .std-train-info b { color:#111 !important; }
        .std-train-table { width:100% !important; border-collapse:collapse !important; table-layout:fixed !important; color:#111 !important; }
        .std-train-th { background:#e8eef5 !important; border:1px solid #222 !important; font-size:9.5px !important; font-weight:700 !important; padding:3px 4px !important; text-align:center !important; color:#111 !important; }
        .std-train-td { border:1px solid #222 !important; font-size:10px !important; padding:2px 5px !important; height:8.6mm !important; color:#111 !important; background:#fff !important; overflow:hidden !important; }
        .std-train-sign { background:#fff !important; }
        .std-train-foot { display:flex !important; justify-content:space-between !important; gap:20mm !important; margin-top:auto !important; padding-top:6px !important; font-size:10px !important; color:#111 !important; }
        .std-train-box { flex:1 !important; border-top:1px solid #222 !important; padding-top:3px !important; min-height:13mm !important; color:#111 !important; }
      `}</style>

      {pages.map((pg, pi) => (
        <div key={pi} className="std-train-page">
          {/* En-tête entreprise */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            {company.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo} alt={companyName} style={{ height: 38, objectFit: 'contain' }} />
            )}
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>{companyName}</p>
              {(company.rccmNumber || company.taxNumber) && (
                <p style={{ fontSize: 8.5, margin: 0 }}>
                  {company.rccmNumber && <>RCCM : {company.rccmNumber} </>}
                  {company.taxNumber && <>— NIU : {company.taxNumber}</>}
                </p>
              )}
            </div>
            <p style={{ margin: '0 0 0 auto', fontSize: 9 }}>
              Page {pi + 1} / {pages.length}
            </p>
          </div>

          <p className="std-train-title">FEUILLE D’ÉMARGEMENT — FORMATION</p>

          <div className="std-train-info">
            <div><b>Formation :</b> {session.courseTitle}</div>
            <div><b>Période :</b> {period}</div>
            <div><b>Lieu :</b> {session.location || '—'}</div>
            <div><b>Session :</b> {session.label || '—'}</div>
            <div><b>Horaires :</b> {hours || '—'}{session.durationHours ? ` (${session.durationHours} h)` : ''}</div>
            <div><b>Formateur :</b> {session.trainerName || '—'}</div>
          </div>

          <table className="std-train-table">
            <colgroup>
              <col style={{ width: '8mm' }} />
              <col style={{ width: '52mm' }} />
              <col style={{ width: '40mm' }} />
              {pg.days.flatMap((d) => [<col key={`${d}m`} />, <col key={`${d}a`} />])}
            </colgroup>
            <thead>
              <tr>
                <th className="std-train-th" rowSpan={2}>N°</th>
                <th className="std-train-th" rowSpan={2}>Nom et prénom</th>
                <th className="std-train-th" rowSpan={2}>Poste / Service</th>
                {pg.days.map((d) => (
                  <th key={d} className="std-train-th" colSpan={2}>{frDay(d)}</th>
                ))}
              </tr>
              <tr>
                {pg.days.flatMap((d) => [
                  <th key={`${d}m`} className="std-train-th">Matin</th>,
                  <th key={`${d}a`} className="std-train-th">Après-midi</th>,
                ])}
              </tr>
            </thead>
            <tbody>
              {pg.rows.map((p, i) => (
                <tr key={`${p.lastName}-${p.firstName}-${pg.offset + i}`}>
                  <td className="std-train-td" style={{ textAlign: 'center' }}>{pg.offset + i + 1}</td>
                  <td className="std-train-td"><b>{p.lastName.toUpperCase()}</b> {p.firstName}</td>
                  <td className="std-train-td" style={{ fontSize: 9 }}>
                    {[p.position, p.department].filter(Boolean).join(' — ')}
                  </td>
                  {pg.days.flatMap((d) => [
                    <td key={`${d}m`} className="std-train-td std-train-sign" />,
                    <td key={`${d}a`} className="std-train-td std-train-sign" />,
                  ])}
                </tr>
              ))}
              {/* Lignes vides pour compléter la page (ajouts de dernière minute) */}
              {pg.rows.length < ROWS_PER_PAGE && pi === pages.length - 1 &&
                Array.from({ length: Math.min(2, ROWS_PER_PAGE - pg.rows.length) }).map((_, k) => (
                  <tr key={`empty-${k}`}>
                    <td className="std-train-td" style={{ textAlign: 'center' }}>{pg.offset + pg.rows.length + k + 1}</td>
                    <td className="std-train-td" />
                    <td className="std-train-td" />
                    {pg.days.flatMap((d) => [
                      <td key={`${d}m`} className="std-train-td std-train-sign" />,
                      <td key={`${d}a`} className="std-train-td std-train-sign" />,
                    ])}
                  </tr>
                ))}
            </tbody>
          </table>

          <div className="std-train-foot">
            <div className="std-train-box">Le formateur (nom et signature)</div>
            <div className="std-train-box">Visa du service RH</div>
          </div>
        </div>
      ))}
    </div>
  );
}
