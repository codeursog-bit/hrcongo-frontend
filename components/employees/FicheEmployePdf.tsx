'use client';

import React from 'react';
import {
  Document, Page, View, Text, Image, StyleSheet,
} from '@react-pdf/renderer';

// ============================================================================
// Fiche du personnel — PDF élégant, adapté d'un modèle de CV :
//  • Page 1 : colonne latérale (photo, contact, urgence, santé…) + bandeau
//             avec le nom, le poste, puis identité et emploi/contrat.
//  • Page 2+ : rémunération, régime fiscal, primes, congés, matériel, documents.
// Règle logo : si l'entreprise a un logo, on affiche le logo SEUL (pas le nom).
// ============================================================================

// ── Palette chaleureuse (marque KonzaRH : bleu marine / ciel / citron + orange)
const C = {
  navy: '#1E3A8A',
  navyDark: '#0F1E4A',
  sky: '#38BDF8',
  skySoft: '#E8F3FF',
  lime: '#A3E635',
  orange: '#F97316',
  orangeSoft: '#FFEFD9',
  cream: '#FFF8EF',
  creamLine: '#F3E3CC',
  text: '#1B2559',
  muted: '#8A7B6B',
  line: '#EFE4D3',
  white: '#FFFFFF',
};

const SIDEBAR_W = 196;
const BAND_H = 152;

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
  },

  // ── fonds de la page 1
  sideBg: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SIDEBAR_W, backgroundColor: C.cream },
  bandBg: { position: 'absolute', top: 0, left: SIDEBAR_W, right: 0, height: BAND_H, backgroundColor: C.navy },
  bandAccent: { position: 'absolute', top: BAND_H, left: SIDEBAR_W, right: 0, height: 4, backgroundColor: C.orange },

  row: { flexDirection: 'row' },

  // ── colonne latérale
  side: { width: SIDEBAR_W, paddingTop: 28, paddingHorizontal: 20, paddingBottom: 44 },
  photoWrap: {
    width: 118, height: 140, alignSelf: 'center', borderRadius: 8, overflow: 'hidden',
    backgroundColor: C.white, borderWidth: 3, borderColor: C.white,
  },
  photo: { width: 112, height: 134, objectFit: 'cover' },
  photoFallback: {
    width: 112, height: 134, backgroundColor: C.skySoft, alignItems: 'center', justifyContent: 'center',
  },
  photoInitials: { fontFamily: 'Helvetica-Bold', fontSize: 38, color: C.navy },
  badge: {
    alignSelf: 'center', marginTop: 8, paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10,
    fontFamily: 'Helvetica-Bold', fontSize: 7.5, letterSpacing: 0.8,
  },
  matricule: { alignSelf: 'center', marginTop: 5, fontSize: 8, color: C.muted, letterSpacing: 0.6 },

  sideBlock: { marginTop: 12 },
  sideChip: {
    alignSelf: 'flex-start', backgroundColor: C.white, paddingVertical: 4, paddingHorizontal: 9, marginBottom: 7,
    fontFamily: 'Helvetica-Bold', fontSize: 10, letterSpacing: 1.1, color: C.navyDark,
  },
  sideItem: { marginBottom: 5 },
  sideLabel: { fontFamily: 'Helvetica-Bold', fontSize: 6.8, letterSpacing: 0.9, color: C.orange, marginBottom: 1.5 },
  sideValue: { fontSize: 9, color: C.text, lineHeight: 1.3 },

  // ── colonne principale
  main: { flex: 1, paddingBottom: 44 },
  band: { height: BAND_H, paddingTop: 28, paddingHorizontal: 28 },
  bandTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  logoBox: { backgroundColor: C.white, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 },
  logo: { height: 30, maxWidth: 120, objectFit: 'contain' },
  companyName: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.white, letterSpacing: 0.4 },
  docTag: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, letterSpacing: 1.6, color: '#BFD7FF' },
  firstName: { fontSize: 24, color: C.white, letterSpacing: 2, lineHeight: 1 },
  lastName: { fontFamily: 'Helvetica-Bold', fontSize: 28, color: C.white, letterSpacing: 2, lineHeight: 1.05, marginBottom: 7 },
  position: { fontFamily: 'Helvetica-Bold', fontSize: 10, letterSpacing: 1.6, color: '#FDBA74' },

  mainBody: { paddingTop: 22, paddingHorizontal: 28 },

  stats: { flexDirection: 'row', marginBottom: 6 },
  stat: {
    flex: 1, backgroundColor: C.cream, borderLeftWidth: 3, borderLeftColor: C.orange,
    paddingVertical: 7, paddingHorizontal: 9, marginRight: 8, borderRadius: 3,
  },
  statLast: { marginRight: 0 },
  statLabel: { fontSize: 6.6, letterSpacing: 0.9, color: C.muted, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  statValue: { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.navyDark },

  // ── sections (colonne principale + pages suivantes)
  section: { marginTop: 13 },
  chip: {
    alignSelf: 'flex-start', backgroundColor: C.skySoft, paddingVertical: 4, paddingHorizontal: 10, marginBottom: 9,
    fontFamily: 'Helvetica-Bold', fontSize: 10.5, letterSpacing: 1.2, color: C.navyDark,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', paddingRight: 12, paddingVertical: 4, borderBottomWidth: 0.6, borderBottomColor: C.line },
  cellFull: { width: '100%', paddingRight: 12, paddingVertical: 4, borderBottomWidth: 0.6, borderBottomColor: C.line },
  label: { fontFamily: 'Helvetica-Bold', fontSize: 6.8, letterSpacing: 0.9, color: C.muted, marginBottom: 1.5 },
  value: { fontSize: 9.5, color: C.text, lineHeight: 1.25 },
  valueEmpty: { fontSize: 9.5, color: '#C9BBA8' },

  // ── pages suivantes
  p2: { paddingTop: 66, paddingHorizontal: 36, paddingBottom: 62 },
  slim: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 52, backgroundColor: C.navy,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 36,
  },
  slimAccent: { position: 'absolute', top: 52, left: 0, right: 0, height: 3, backgroundColor: C.orange },
  slimName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.white, letterSpacing: 0.8 },
  slimSub: { fontSize: 7.5, color: '#BFD7FF', marginTop: 1.5, letterSpacing: 0.6 },
  slimLogo: { height: 24, maxWidth: 100, objectFit: 'contain' },
  slimLogoBox: { backgroundColor: C.white, borderRadius: 5, paddingVertical: 3, paddingHorizontal: 6 },

  // ── tableaux
  th: {
    flexDirection: 'row', backgroundColor: C.navy, paddingVertical: 5, paddingHorizontal: 8, borderTopLeftRadius: 3, borderTopRightRadius: 3,
  },
  thText: { fontFamily: 'Helvetica-Bold', fontSize: 7, letterSpacing: 0.9, color: C.white, paddingRight: 8 },
  tr: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 8, borderBottomWidth: 0.6, borderBottomColor: C.line },
  trAlt: { backgroundColor: C.cream },
  td: { fontSize: 8.8, color: C.text, paddingRight: 8 },

  // ── signatures
  sigRow: { position: 'absolute', left: 36, right: 36, bottom: 50, flexDirection: 'row' },
  sigBox: { flex: 1, height: 52, borderWidth: 0.8, borderColor: C.creamLine, borderRadius: 4, padding: 7, marginRight: 12 },
  sigLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, letterSpacing: 0.9, color: C.muted },

  // ── pied de page
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 34, backgroundColor: C.navy,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 36,
  },
  footerAccent: { position: 'absolute', bottom: 34, left: 0, right: 0, height: 2, backgroundColor: C.lime },
  footerMain: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: C.white },
  footerSub: { fontSize: 6.8, color: '#BFD7FF', marginTop: 1.5 },
  footerRight: { fontSize: 7.5, color: '#BFD7FF' },
});

// ============================================================================
// Types
// ============================================================================

export interface FicheAsset {
  name: string;
  category?: string;
  serialNumber?: string | null;
}

export interface FicheDocument {
  type?: string;
  name: string;
  status?: string;
  expiresAt?: string | null;
}

export interface FicheEmployeData {
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  nationality?: string | null;
  isResident?: boolean;
  photoUrl?: string | null; // data URL (PNG/JPEG) prête pour react-pdf, sinon initiales

  bloodType?: string | null;
  pathology?: string | null;

  address?: string;
  city?: string | null;
  phone?: string;
  secondaryPhone?: string | null;
  email?: string;

  fatherName?: string | null;
  motherName?: string | null;
  maritalStatus?: string;
  numberOfChildren?: number;

  position?: string;
  departmentName?: string | null;
  educationLevel?: string | null;
  professionalCategory?: string | null;
  echelon?: string | null;

  contractType?: string;
  hireDate?: string;
  contractEndDate?: string | null;
  status?: string;
  terminationDate?: string | null;
  terminationReason?: string | null;

  trialStatus?: string | null;
  trialPeriodDays?: number | null;
  trialEndDate?: string | null;
  trialConfirmedAt?: string | null;

  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;

  hasDrivingLicense?: boolean;
  drivingLicenseNumber?: string | null;
  foreignLanguages?: string | null;
  uniformSize?: string | null;
  shoeSize?: string | null;

  nationalIdNumber?: string | null;
  cnssNumber?: string | null;
  taxNumber?: string | null;
  niu?: string | null;

  baseSalary?: number | string | null;
  paymentMethod?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  mobileMoneyOperator?: string | null;
  mobileMoneyNumber?: string | null;

  isSubjectToIrpp?: boolean | null;
  isSubjectToCnss?: boolean | null;
  isSubjectToTus?: boolean | null;
  taxExemptionReason?: string | null;
  tolZone?: string | null;

  assets?: FicheAsset[];
  documents?: FicheDocument[];
}

export interface FicheCompanyData {
  name?: string;
  logoUrl?: string | null; // data URL (PNG/JPEG) prête pour react-pdf
  address?: string | null;
  rccmNumber?: string | null;
  phone?: string | null;
  email?: string | null;
}

// ============================================================================
// Utilitaires
// ============================================================================

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function parseDate(d?: string | null): Date | null {
  if (!d) return null;
  const x = new Date(d);
  return isNaN(x.getTime()) ? null : x;
}

// UTC volontaire : les dates "Date" de la base sont à minuit UTC
function fmtDate(d?: string | null): string {
  const x = parseDate(d);
  if (!x) return '';
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
}

function fmtShort(d?: string | null): string {
  const x = parseDate(d);
  if (!x) return '';
  const dd = String(x.getUTCDate()).padStart(2, '0');
  const mm = String(x.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${x.getUTCFullYear()}`;
}

function fmtMoney(v?: number | string | null): string {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (isNaN(n)) return '';
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

function ageFrom(d?: string | null): number | null {
  const b = parseDate(d);
  if (!b) return null;
  const now = new Date();
  let a = now.getFullYear() - b.getUTCFullYear();
  const m = now.getMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getUTCDate())) a--;
  return a;
}

function seniority(hire?: string | null, end?: string | null): string {
  const h = parseDate(hire);
  if (!h) return '';
  const e = parseDate(end) || new Date();
  let months = (e.getFullYear() - h.getUTCFullYear()) * 12 + (e.getMonth() - h.getUTCMonth());
  if (e.getDate() < h.getUTCDate()) months--;
  if (months < 0) months = 0;
  const y = Math.floor(months / 12);
  const r = months % 12;
  if (y === 0) return `${r} mois`;
  return `${y} an${y > 1 ? 's' : ''}${r > 0 ? ` ${r} mois` : ''}`;
}

function countryName(code?: string | null): string {
  if (!code) return '';
  try {
    const n = new Intl.DisplayNames(['fr'], { type: 'region' }).of(code.toUpperCase());
    return n && n !== code.toUpperCase() ? n : code;
  } catch { return code; }
}

const GENDER: Record<string, string> = { MALE: 'Homme', FEMALE: 'Femme', OTHER: 'Autre' };
const MARITAL: Record<string, string> = {
  SINGLE: 'Célibataire', MARRIED: 'Marié(e)', DIVORCED: 'Divorcé(e)', WIDOWED: 'Veuf / Veuve',
};
const PAYMENT: Record<string, string> = {
  BANK_TRANSFER: 'Virement bancaire', CHECK: 'Chèque', CASH: 'Espèces', MOBILE_MONEY: 'Mobile Money',
};
const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  ACTIVE: { label: 'ACTIF', bg: '#E3F7C7', fg: '#3F6212' },
  ON_LEAVE: { label: 'EN CONGÉ', bg: '#DBEAFE', fg: '#1E40AF' },
  SUSPENDED: { label: 'SUSPENDU', bg: '#FFE8CC', fg: '#9A3412' },
  TERMINATED: { label: 'SORTI', bg: '#FEE2E2', fg: '#991B1B' },
  RETIRED: { label: 'RETRAITÉ', bg: '#EDE9FE', fg: '#5B21B6' },
};
const TRIAL: Record<string, string> = {
  NONE: '', IN_PROGRESS: 'En cours', CONFIRMED: 'Confirmée', FAILED: 'Non concluante', EXPIRED: 'Expirée',
};
const DOC_TYPE: Record<string, string> = {
  CNI: "Carte d'identité", PASSPORT: 'Passeport', DRIVER_LICENSE: 'Permis de conduire', CONTRACT: 'Contrat',
  AVENANT: 'Avenant', PAYSLIP: 'Bulletin de paie', WORK_CERTIFICATE: 'Certificat de travail',
  SALARY_ATTESTATION: 'Attestation de salaire', EMPLOYMENT_LETTER: "Lettre d'embauche", DIPLOMA: 'Diplôme',
  CERTIFICATION: 'Certification', TRAINING_CERT: 'Attestation de formation', MEDICAL_CERT: 'Certificat médical',
  MEDICAL_VISIT: 'Visite médicale', RESUME: 'CV', RIB: 'RIB', OTHER: 'Autre',
};
const DOC_STATUS: Record<string, string> = {
  PENDING_REVIEW: 'À vérifier', VERIFIED: 'Validé', REJECTED: 'Rejeté', EXPIRED: 'Expiré',
};

const yesNo = (v?: boolean | null) => (v === null || v === undefined ? '' : v ? 'Oui' : 'Non');

// ============================================================================
// Briques de mise en page
// ============================================================================

function SideItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={S.sideItem} wrap={false}>
      <Text style={S.sideLabel}>{label.toUpperCase()}</Text>
      <Text style={S.sideValue}>{value || '—'}</Text>
    </View>
  );
}

function SideBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={S.sideBlock}>
      <Text style={S.sideChip}>{title}</Text>
      {children}
    </View>
  );
}

function Cell({ label, value, full }: { label: string; value?: string | null; full?: boolean }) {
  return (
    <View style={full ? S.cellFull : S.cell} wrap={false}>
      <Text style={S.label}>{label.toUpperCase()}</Text>
      {value ? <Text style={S.value}>{value}</Text> : <Text style={S.valueEmpty}>—</Text>}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={S.section}>
      <Text style={S.chip} minPresenceAhead={60}>{title}</Text>
      {children}
    </View>
  );
}

function Table({
  cols, rows,
}: {
  cols: { title: string; width: string; align?: 'left' | 'right' }[];
  rows: string[][];
}) {
  return (
    <View>
      <View style={S.th} wrap={false}>
        {cols.map((c) => (
          <Text key={c.title} style={[S.thText, { width: c.width, textAlign: c.align || 'left' }]}>{c.title.toUpperCase()}</Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[S.tr, i % 2 === 1 ? S.trAlt : {}]} wrap={false}>
          {r.map((cell, j) => (
            <Text key={j} style={[S.td, { width: cols[j].width, textAlign: cols[j].align || 'left' }]}>{cell || '—'}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function Footer({ company }: { company?: FicheCompanyData }) {
  const hasLogo = !!company?.logoUrl;
  const line2 = [company?.address, company?.rccmNumber ? `RCCM : ${company.rccmNumber}` : null, company?.phone]
    .filter(Boolean).join('  •  ');
  return (
    <>
      <View style={S.footerAccent} fixed />
      <View style={S.footer} fixed>
        <View style={{ flex: 1, paddingRight: 16 }}>
          {!hasLogo && <Text style={S.footerMain}>{company?.name || 'Entreprise'}</Text>}
          {line2 ? <Text style={hasLogo ? S.footerMain : S.footerSub}>{line2}</Text> : null}
        </View>
        <Text style={S.footerRight} render={({ pageNumber, totalPages }) => `Confidentiel  •  Page ${pageNumber} / ${totalPages}`} />
      </View>
    </>
  );
}

// ============================================================================
// Document
// ============================================================================

export function FicheEmployePdf({ employee: e, company }: { employee: FicheEmployeData; company?: FicheCompanyData }) {
  const today = fmtShort(new Date().toISOString());
  const hasLogo = !!company?.logoUrl;
  const initials = `${(e.firstName || '?').charAt(0)}${(e.lastName || '').charAt(0)}`.toUpperCase();
  const st = STATUS[e.status || 'ACTIVE'] || STATUS.ACTIVE;
  const age = ageFrom(e.dateOfBirth);
  const fullTitle = [e.position, e.departmentName].filter(Boolean).join('  •  ').toUpperCase();

  const naissance = [fmtDate(e.dateOfBirth), e.placeOfBirth].filter(Boolean).join(' — à ') +
    (age !== null ? `  (${age} ans)` : '');
  const nationalite = [countryName(e.nationality), e.isResident === false ? 'non résident' : e.isResident === true ? 'résident' : null]
    .filter(Boolean).join(' — ');
  const classification = e.echelon || e.professionalCategory;

  const essai = e.trialStatus && e.trialStatus !== 'NONE'
    ? [
        TRIAL[e.trialStatus] || e.trialStatus,
        e.trialPeriodDays ? `${e.trialPeriodDays} jours` : null,
        e.trialEndDate ? `jusqu'au ${fmtShort(e.trialEndDate)}` : null,
      ].filter(Boolean).join(' • ')
    : '';

  const hasSalaryInfo = e.baseSalary !== null && e.baseSalary !== undefined;
  const assets = e.assets || [];
  const docs = e.documents || [];

  const logoNode = hasLogo
    ? <View style={S.logoBox}><Image src={company!.logoUrl as string} style={S.logo} /></View>
    : <Text style={S.companyName}>{company?.name || 'Entreprise'}</Text>;

  const slimLogoNode = hasLogo
    ? <View style={S.slimLogoBox}><Image src={company!.logoUrl as string} style={S.slimLogo} /></View>
    : <Text style={S.slimName}>{company?.name || 'Entreprise'}</Text>;

  return (
    <Document title={`Fiche_${e.lastName}_${e.firstName}`} author={company?.name || 'KonzaRH'} subject="Fiche du personnel">

      {/* ════════════════════════ PAGE 1 — identité ════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.sideBg} />
        <View style={S.bandBg} />
        <View style={S.bandAccent} />

        <View style={S.row}>
          {/* ── Colonne latérale ── */}
          <View style={S.side}>
            <View style={S.photoWrap}>
              {e.photoUrl
                ? <Image src={e.photoUrl} style={S.photo} />
                : <View style={S.photoFallback}><Text style={S.photoInitials}>{initials}</Text></View>}
            </View>
            <Text style={[S.badge, { backgroundColor: st.bg, color: st.fg }]}>{st.label}</Text>
            <Text style={S.matricule}>MATRICULE  {e.employeeNumber || '—'}</Text>

            <SideBlock title="CONTACT">
              <SideItem label="Téléphone" value={e.phone} />
              {e.secondaryPhone ? <SideItem label="Téléphone secondaire" value={e.secondaryPhone} /> : null}
              <SideItem label="E-mail" value={e.email} />
              <SideItem label="Adresse" value={[e.address, e.city].filter(Boolean).join(', ')} />
            </SideBlock>

            <SideBlock title="URGENCE">
              <SideItem label="Personne à prévenir" value={e.emergencyContactName} />
              <SideItem label="Lien de parenté" value={e.emergencyContactRelation} />
              <SideItem label="Téléphone" value={e.emergencyContactPhone} />
            </SideBlock>

            <SideBlock title="SANTÉ & TENUE">
              <SideItem label="Groupe sanguin" value={e.bloodType} />
              <SideItem label="Pathologie habituelle" value={e.pathology || 'Aucune renseignée'} />
              <SideItem label="Taille de la tenue" value={e.uniformSize} />
              <SideItem label="Pointure" value={e.shoeSize} />
            </SideBlock>

            <SideBlock title="COMPÉTENCES">
              <SideItem label="Niveau d'études" value={e.educationLevel} />
              <SideItem label="Langues étrangères" value={e.foreignLanguages} />
              <SideItem
                label="Permis de conduire"
                value={e.hasDrivingLicense ? `Oui${e.drivingLicenseNumber ? ` — N° ${e.drivingLicenseNumber}` : ''}` : 'Non'}
              />
            </SideBlock>
          </View>

          {/* ── Colonne principale ── */}
          <View style={S.main}>
            <View style={S.band}>
              <View style={S.bandTop}>
                <View style={{ flex: 1, paddingRight: 12, alignItems: 'flex-start' }}>{logoNode}</View>
                <Text style={S.docTag}>FICHE DU PERSONNEL  •  {today}</Text>
              </View>
              <Text style={S.firstName}>{(e.firstName || '').toUpperCase()}</Text>
              <Text style={S.lastName}>{(e.lastName || '').toUpperCase()}</Text>
              <Text style={S.position}>{fullTitle || 'EMPLOYÉ'}</Text>
            </View>

            <View style={S.mainBody}>
              <View style={S.stats}>
                <View style={S.stat}>
                  <Text style={S.statLabel}>EMBAUCHÉ(E) LE</Text>
                  <Text style={S.statValue}>{fmtShort(e.hireDate) || '—'}</Text>
                </View>
                <View style={S.stat}>
                  <Text style={S.statLabel}>ANCIENNETÉ</Text>
                  <Text style={S.statValue}>{seniority(e.hireDate, e.terminationDate) || '—'}</Text>
                </View>
                <View style={[S.stat, S.statLast]}>
                  <Text style={S.statLabel}>CONTRAT</Text>
                  <Text style={S.statValue}>{e.contractType || '—'}</Text>
                </View>
              </View>

              <Section title="IDENTITÉ">
                <View style={S.grid}>
                  <Cell label="Nom complet" value={`${e.lastName || ''} ${e.firstName || ''}`.trim()} full />
                  <Cell label="Genre" value={GENDER[e.gender || ''] || e.gender} />
                  <Cell label="Nationalité" value={nationalite} />
                  <Cell label="Naissance" value={naissance} full />
                  <Cell label="Père" value={e.fatherName} />
                  <Cell label="Mère" value={e.motherName} />
                  <Cell label="Situation familiale" value={MARITAL[e.maritalStatus || ''] || e.maritalStatus} />
                  <Cell label="Enfant(s) à charge" value={e.numberOfChildren !== undefined ? String(e.numberOfChildren) : ''} />
                </View>
              </Section>

              <Section title="PIÈCES & NUMÉROS">
                <View style={S.grid}>
                  <Cell label="Pièce d'identité" value={e.nationalIdNumber} />
                  <Cell label="N° CNSS" value={e.cnssNumber} />
                  <Cell label="NIU" value={e.niu} />
                  <Cell label="N° contribuable" value={e.taxNumber} />
                </View>
              </Section>

              <Section title="EMPLOI & CONTRAT">
                <View style={S.grid}>
                  <Cell label="Poste" value={e.position} />
                  <Cell label="Département / service" value={e.departmentName} />
                  <Cell label="Catégorie / échelon" value={classification} />
                  <Cell label="Type de contrat" value={e.contractType} />
                  <Cell label="Date d'embauche" value={fmtDate(e.hireDate)} />
                  <Cell label="Fin de contrat" value={e.contractEndDate ? fmtDate(e.contractEndDate) : (e.contractType === 'CDI' ? 'Durée indéterminée' : '')} />
                  {essai ? <Cell label="Période d'essai" value={essai} full /> : null}
                  {e.terminationDate ? <Cell label="Date de sortie" value={fmtDate(e.terminationDate)} /> : null}
                  {e.terminationReason ? <Cell label="Motif de sortie" value={e.terminationReason} /> : null}
                </View>
              </Section>
            </View>
          </View>
        </View>

        <Footer company={company} />
      </Page>

      {/* ════════════════════════ PAGE 2+ — paie & dossier ════════════════════════ */}
      <Page size="A4" style={[S.page, S.p2]}>
        <View style={S.slim} fixed>
          {slimLogoNode}
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={S.slimName}>{`${e.lastName || ''} ${e.firstName || ''}`.trim().toUpperCase()}</Text>
            <Text style={S.slimSub}>{`MATRICULE ${e.employeeNumber || '—'}  •  ${e.position || ''}`}</Text>
          </View>
        </View>
        <View style={S.slimAccent} fixed />

        {hasSalaryInfo && (
          <Section title="RÉMUNÉRATION & PAIEMENT">
            <View style={S.grid}>
              <Cell label="Salaire de base" value={fmtMoney(e.baseSalary)} />
              <Cell label="Mode de paiement" value={PAYMENT[e.paymentMethod || ''] || e.paymentMethod} />
              {e.bankName || e.bankAccountNumber ? (
                <>
                  <Cell label="Banque" value={e.bankName} />
                  <Cell label="N° de compte / RIB" value={e.bankAccountNumber} />
                </>
              ) : null}
              {e.mobileMoneyNumber || e.mobileMoneyOperator ? (
                <>
                  <Cell label="Opérateur Mobile Money" value={e.mobileMoneyOperator} />
                  <Cell label="N° Mobile Money" value={e.mobileMoneyNumber} />
                </>
              ) : null}
            </View>
          </Section>
        )}

        <Section title="RÉGIME FISCAL & SOCIAL">
          <View style={S.grid}>
            <Cell label="Soumis à l'ITS / IRPP" value={yesNo(e.isSubjectToIrpp)} />
            <Cell label="Soumis à la CNSS" value={yesNo(e.isSubjectToCnss)} />
            <Cell label="Soumis à la TUS" value={yesNo(e.isSubjectToTus)} />
            <Cell label="Zone TOL" value={e.tolZone === 'PERIPHERIE' ? 'Périphérie' : e.tolZone === 'VILLE' ? 'Ville' : e.tolZone} />
            {e.taxExemptionReason ? <Cell label="Motif d'exonération" value={e.taxExemptionReason} full /> : null}
          </View>
        </Section>

        {assets.length > 0 && (
          <Section title="MATÉRIEL EN DOTATION">
            <Table
              cols={[
                { title: 'Équipement', width: '50%' },
                { title: 'Catégorie', width: '25%' },
                { title: 'N° de série', width: '25%' },
              ]}
              rows={assets.map((a) => [a.name, a.category || '', a.serialNumber || ''])}
            />
          </Section>
        )}

        {docs.length > 0 && (
          <Section title="DOCUMENTS AU DOSSIER">
            <Table
              cols={[
                { title: 'Type', width: '26%' },
                { title: 'Document', width: '36%' },
                { title: 'Statut', width: '18%' },
                { title: 'Expire le', width: '20%', align: 'right' },
              ]}
              rows={docs.map((d) => [
                DOC_TYPE[d.type || ''] || d.type || '',
                d.name,
                DOC_STATUS[d.status || ''] || d.status || '',
                fmtShort(d.expiresAt),
              ])}
            />
          </Section>
        )}

        <View style={S.sigRow}>
          <View style={S.sigBox}><Text style={S.sigLabel}>VISA DES RESSOURCES HUMAINES</Text></View>
          <View style={[S.sigBox, { marginRight: 0 }]}><Text style={S.sigLabel}>SIGNATURE DE L'EMPLOYÉ(E)</Text></View>
        </View>

        <Footer company={company} />
      </Page>
    </Document>
  );
}

// ============================================================================
// Aide : prépare une image (logo / photo) pour react-pdf.
// react-pdf ne gère que PNG/JPEG et exige le CORS : on convertit tout en
// data URL via un canvas (gère aussi le WebP). En cas d'échec → null (le PDF
// retombe sur les initiales / le nom de l'entreprise, sans jamais planter).
// ============================================================================

export async function prepareImageForPdf(
  src?: string | null,
  opts: { maxSize?: number; format?: 'png' | 'jpeg' } = {},
): Promise<string | null> {
  if (!src || typeof window === 'undefined') return null;
  const { maxSize = 700, format = 'png' } = opts;

  const draw = (img: HTMLImageElement): string => {
    const ratio = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * ratio));
    const h = Math.max(1, Math.round(img.naturalHeight * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas indisponible');
    if (format === 'jpeg') { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, w, h); }
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL(format === 'jpeg' ? 'image/jpeg' : 'image/png', 0.92);
  };

  const load = (url: string, cors: boolean) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      if (cors) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('chargement image'));
      img.src = url;
    });

  // 1) fetch → blob (évite le cache navigateur sans en-têtes CORS) ; 2) <img> direct
  try {
    if (src.startsWith('data:')) return draw(await load(src, false));
    const res = await fetch(src, { mode: 'cors', cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blobUrl = URL.createObjectURL(await res.blob());
    try { return draw(await load(blobUrl, false)); } finally { URL.revokeObjectURL(blobUrl); }
  } catch {
    try { return draw(await load(src, true)); } catch { return null; }
  }
}