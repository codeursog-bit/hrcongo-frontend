'use client';

// ============================================================================
// 📁 components/LeaveAuthorizationLetterPrintable.tsx
// ✅ Reproduit le modèle de lettre officielle "Autorisation de départ en
//    congé annuel" fourni par le client — entièrement dynamique (aucune
//    donnée ORCA en dur), pour fonctionner avec n'importe quelle entreprise
//    cliente de Konza.
// ✅ N'a de sens qu'une fois la demande APPROUVÉE (nécessite un signataire).
// ============================================================================

import React from 'react';

interface CompanyInfo {
  legalName?: string; tradeName?: string; logo?: string | null;
  rccmNumber?: string; taxNumber?: string; address?: string; city?: string; phone?: string;
}

export interface LeaveLetterData {
  company: CompanyInfo;
  employee: {
    firstName: string; lastName: string; position?: string;
    hireDate?: string | Date; gender?: 'MALE' | 'FEMALE' | string;
  };
  leaveYear: number;
  startDate: string | Date;
  endDate: string | Date;
  daysCount: number | string;
  remainingDays?: number | string | null;
  extraDaysGranted?: number | string | null;
  resumptionNote?: string | null;
  signatoryName?: string;
  approvedAt?: string | Date;
}

const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const fmtLongDate = (d?: string | Date) => {
  if (!d) return '.................';
  const date = new Date(d);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};
const fmtMonthYear = (d?: string | Date) => {
  if (!d) return '';
  const date = new Date(d);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};
const addDays = (d: string | Date, n: number) => {
  const date = new Date(d);
  date.setDate(date.getDate() + n);
  return date;
};

export default function LeaveAuthorizationLetterPrintable({ id, data }: { id: string; data: LeaveLetterData }) {
  const companyName = data.company.tradeName || data.company.legalName || 'Entreprise';
  const civility = data.employee.gender === 'FEMALE' ? 'Madame' : 'Monsieur';
  const resumptionDate = addDays(data.endDate, 1);

  return (
    <div
      id={id}
      style={{
        width: '210mm', minHeight: '297mm', background: '#fff', color: '#1a1a1a',
        fontFamily: "'Times New Roman', Georgia, serif", padding: '18mm 20mm',
        boxSizing: 'border-box', fontSize: 12.5, lineHeight: 1.55,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* En-tête expéditeur */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          {data.company.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.company.logo} alt={companyName} style={{ height: 50, objectFit: 'contain', marginBottom: 8 }} />
          )}
          <p style={{ fontWeight: 700, margin: 0 }}>{companyName}</p>
          {data.company.address && <p style={{ margin: 0 }}>{data.company.address}</p>}
          {data.company.phone && <p style={{ margin: 0 }}>Tél : {data.company.phone}</p>}
          <p style={{ margin: 0 }}>{data.company.city || 'Pointe-Noire'} – République du Congo</p>
        </div>
        <p style={{ whiteSpace: 'nowrap' }}>{data.company.city || 'Pointe-Noire'}, le {fmtLongDate(data.approvedAt || new Date())}</p>
      </div>

      {/* Destinataire */}
      <div style={{ textAlign: 'right', marginBottom: 30 }}>
        <p style={{ margin: 0 }}>Monsieur le Directeur des Ressources Humaines</p>
        <p style={{ margin: 0 }}>de la société {companyName}</p>
        <p style={{ fontWeight: 700, margin: 0 }}>{data.company.city || 'Pointe-Noire'}</p>
        <p style={{ margin: '6px 0' }}>A</p>
        <p style={{ fontWeight: 700, margin: 0 }}>{civility} {data.employee.lastName} {data.employee.firstName}</p>
        <p style={{ margin: 0 }}>{data.employee.position || ''}</p>
      </div>

      <p style={{ fontWeight: 700, margin: '0 0 16px' }}>Objet : Autorisation de départ en congé annuel</p>

      <p style={{ margin: '0 0 12px' }}>{civility},</p>

      <p style={{ textAlign: 'justify', margin: '0 0 12px' }}>
        Je soussigné, <strong>{data.signatoryName || 'La Direction des Ressources Humaines'}</strong>, Directeur des
        Ressources Humaines de la société {companyName}, autorise <strong>{data.employee.firstName} {data.employee.lastName}</strong>,
        employé{data.employee.gender === 'FEMALE' ? 'e' : ''} au sein de la société {companyName}
        {data.employee.hireDate ? ` depuis ${fmtMonthYear(data.employee.hireDate)}` : ''}, en qualité
        de {data.employee.position || '—'}, de bénéficier de son congé annuel de l&apos;année {data.leaveYear}, du{' '}
        <strong>{fmtLongDate(data.startDate)}</strong> au <strong>{fmtLongDate(data.endDate)}</strong>, ce qui correspond
        à <strong>{data.daysCount} jours ouvrables</strong> de congé annuel.
      </p>

      {(data.remainingDays || data.extraDaysGranted) && (
        <p style={{ textAlign: 'justify', margin: '0 0 12px' }}>
          {data.remainingDays ? <>Les <strong>{data.remainingDays} jours</strong> restants</> : null}
          {data.remainingDays && data.extraDaysGranted ? ', ainsi que ' : ''}
          {data.extraDaysGranted ? <>les <strong>{data.extraDaysGranted} jours</strong> de congé supplémentaires</> : ''}
          {' '}seront {data.resumptionNote ? data.resumptionNote : 'pris ultérieurement, selon accord avec la Direction'}.
        </p>
      )}

      <p style={{ textAlign: 'justify', margin: '0 0 12px' }}>
        Je vous souhaite de bien profiter de cette période de repos, afin de garantir la continuité de votre
        rendement en entreprise après une année de dur labeur et de tâches accomplies.
      </p>

      <p style={{ textAlign: 'justify', margin: '0 0 12px' }}>
        Vous reprendrez le travail, en date du <strong>{fmtLongDate(resumptionDate)}</strong> aux heures habituelles
        de début de service.
      </p>

      <p style={{ margin: '0 0 4px' }}>Je reste à votre disposition pour toute information complémentaire.</p>
      <p style={{ margin: '0 0 40px' }}>Recevez, je vous prie, nos salutations distinguées.</p>

      <p style={{ textAlign: 'right', fontWeight: 700, marginRight: 20 }}>{data.signatoryName || 'La Direction des Ressources Humaines'}</p>

      {/* Pied de page légal */}
      <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: 9.5, color: '#4b5563', lineHeight: 1.6, borderTop: '1px solid #d1d5db', paddingTop: 10 }}>
        <div style={{ fontWeight: 700 }}>{companyName}</div>
        {(data.company.rccmNumber || data.company.taxNumber) && (
          <div>
            {data.company.rccmNumber && <>RCCM : {data.company.rccmNumber}&nbsp;&nbsp;</>}
            {data.company.taxNumber && <>NIU : {data.company.taxNumber}</>}
          </div>
        )}
        {data.company.address && <div>{data.company.address}</div>}
      </div>
    </div>
  );
}