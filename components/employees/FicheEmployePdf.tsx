'use client';

import React from 'react';
import {
  Document, Page, View, Text, Image, StyleSheet, Svg, Path, Circle,
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
  limeDeep: '#84CC16',
  limeSoft: '#F1FADD',
  orange: '#F97316',
  orangeSoft: '#FFEFD9',
  cream: '#FFF8EF',
  creamLine: '#F3E3CC',
  text: '#1B2559',
  muted: '#8A7B6B',
  line: '#EFE4D3',
  white: '#FFFFFF',
};

const SIDEBAR_W = 200;

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.text,
    backgroundColor: C.white,
  },

  sideBg: { position: 'absolute', top: 0, bottom: 0, left: 0, width: SIDEBAR_W, backgroundColor: C.cream },
  sideStripe: { position: 'absolute', top: 0, bottom: 0, left: SIDEBAR_W - 4, width: 4, backgroundColor: C.orangeSoft },

  row: { flexDirection: 'row' },

  // ── colonne latérale
  side: { width: SIDEBAR_W, paddingTop: 28, paddingHorizontal: 22, paddingBottom: 44 },
  ringOuter: { width: 142, height: 142, borderRadius: 71, backgroundColor: C.orange, alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  ringMid: { width: 134, height: 134, borderRadius: 67, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  ringIn: { width: 124, height: 124, borderRadius: 62, overflow: 'hidden' },
  photo: { width: 124, height: 124, objectFit: 'cover', objectPosition: '50% 18%' },
  photoFallback: { width: 124, height: 124, backgroundColor: C.skySoft, alignItems: 'center', justifyContent: 'center' },
  photoInitials: { fontFamily: 'Helvetica-Bold', fontSize: 40, color: C.navy },
  badge: {
    alignSelf: 'center', marginTop: 10, paddingVertical: 4, paddingHorizontal: 14, borderRadius: 11,
    fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 1,
  },
  matricule: { alignSelf: 'center', marginTop: 6, fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.orange, letterSpacing: 0.8 },

  sideBlock: { marginTop: 16 },
  sideTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9 },
  sideBar: { width: 4, height: 18, borderRadius: 2, backgroundColor: C.orange, marginRight: 6 },
  sideChip: {
    backgroundColor: C.white, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 3,
    fontFamily: 'Helvetica-Bold', fontSize: 10, letterSpacing: 1.1, color: C.navyDark,
  },
  sideItem: { marginBottom: 6 },
  sideLabel: { fontFamily: 'Helvetica-Bold', fontSize: 6.8, letterSpacing: 0.9, color: C.orange, marginBottom: 1.5 },
  sideValue: { fontSize: 9.2, color: C.text, lineHeight: 1.3 },
  sideEmpty: { fontFamily: 'Helvetica-Oblique', fontSize: 8.5, color: C.muted },

  contactRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  icon: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 1 },

  // ── colonne principale
  main: { flex: 1, paddingBottom: 44 },
  band: {
    backgroundColor: C.navy, paddingTop: 26, paddingHorizontal: 28, paddingBottom: 20,
    borderBottomWidth: 4, borderBottomColor: C.orange, overflow: 'hidden',
  },
  bandDeco: { position: 'absolute', top: 0, right: 0 },
  bandTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  logoBox: { backgroundColor: C.white, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 8 },
  logo: { height: 30, maxWidth: 120, objectFit: 'contain' },
  companyName: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.white, letterSpacing: 0.4 },
  docTag: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, letterSpacing: 1.6, color: '#BFD7FF' },
  lastName: { fontFamily: 'Helvetica-Bold', color: C.white, letterSpacing: 1.5, marginTop: 2, marginBottom: 9 },
  position: { fontFamily: 'Helvetica-Bold', fontSize: 10, letterSpacing: 1.6, color: '#FDBA74' },
  limeDash: { width: 34, height: 3, borderRadius: 2, backgroundColor: C.lime, marginBottom: 9 },

  mainBody: { paddingTop: 22, paddingHorizontal: 28 },

  stats: { flexDirection: 'row', marginBottom: 4 },
  stat: { flex: 1, paddingVertical: 9, paddingHorizontal: 10, marginRight: 8, borderRadius: 4, borderLeftWidth: 4 },
  statLast: { marginRight: 0 },
  statLabel: { fontSize: 6.6, letterSpacing: 0.9, color: C.muted, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  statValue: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.navyDark },

  // ── sections
  section: { marginTop: 20 },
  secTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  secBar: { width: 4, height: 20, borderRadius: 2, marginRight: 7 },
  chip: {
    backgroundColor: C.skySoft, paddingVertical: 5, paddingHorizontal: 11, borderRadius: 3,
    fontFamily: 'Helvetica-Bold', fontSize: 10.5, letterSpacing: 1.2, color: C.navyDark,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '50%', paddingRight: 12, paddingVertical: 5, borderBottomWidth: 0.6, borderBottomColor: C.line },
  cellFull: { width: '100%', paddingRight: 12, paddingVertical: 5, borderBottomWidth: 0.6, borderBottomColor: C.line },
  label: { fontFamily: 'Helvetica-Bold', fontSize: 6.8, letterSpacing: 0.9, color: C.muted, marginBottom: 2 },
  value: { fontSize: 10, color: C.text, lineHeight: 1.25 },
  emptyBox: { borderWidth: 0.8, borderColor: C.creamLine, borderStyle: 'dashed', borderRadius: 4, paddingVertical: 10, paddingHorizontal: 12 },
  emptyText: { fontFamily: 'Helvetica-Oblique', fontSize: 9, color: C.muted },

  // ── rémunération / fiscal
  payRow: { flexDirection: 'row' },
  hero: { width: 200, backgroundColor: C.navy, borderRadius: 6, padding: 14, marginRight: 14, justifyContent: 'center' },
  heroLabel: { fontFamily: 'Helvetica-Bold', fontSize: 7, letterSpacing: 1.1, color: '#BFD7FF', marginBottom: 5 },
  heroValue: { fontFamily: 'Helvetica-Bold', fontSize: 19, color: C.white },
  heroUnit: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#FDBA74', marginTop: 3, letterSpacing: 1 },
  payCol: { flex: 1 },
  taxRow: { flexDirection: 'row' },
  taxCard: { flex: 1, backgroundColor: C.cream, borderRadius: 4, padding: 9, marginRight: 8 },
  pill: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 9, fontFamily: 'Helvetica-Bold', fontSize: 8, letterSpacing: 0.8 },

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

const nonEmpty = (v?: string | null) => !!(v && String(v).trim());

function Icon({ kind }: { kind: 'phone' | 'mail' | 'pin' }) {
  return (
    <View style={S.icon}>
      <Svg width={11} height={11} viewBox="0 0 14 14">
        {kind === 'mail' && (
          <>
            <Path d="M1.5 3.5 H12.5 V10.5 H1.5 Z" stroke="#FFFFFF" strokeWidth={1.3} fill="none" />
            <Path d="M1.5 3.8 L7 8 L12.5 3.8" stroke="#FFFFFF" strokeWidth={1.3} fill="none" />
          </>
        )}
        {kind === 'pin' && (
          <>
            <Path d="M7 13 C7 13 2.5 8.6 2.5 5.6 A4.5 4.5 0 0 1 11.5 5.6 C11.5 8.6 7 13 7 13 Z" fill="#FFFFFF" />
            <Circle cx={7} cy={5.6} r={1.6} fill="#F97316" />
          </>
        )}
        {kind === 'phone' && (
          <Path d="M3 1.5 L5.6 1.2 L6.7 4 L5.4 5.1 C6.2 6.8 7.2 7.8 8.9 8.6 L10 7.3 L12.8 8.4 L12.5 11 C6.5 12.4 1.4 7.2 3 1.5 Z" fill="#FFFFFF" />
        )}
      </Svg>
    </View>
  );
}

function ContactRow({ kind, label, value }: { kind: 'phone' | 'mail' | 'pin'; label: string; value?: string | null }) {
  if (!nonEmpty(value)) return null;
  return (
    <View style={S.contactRow} wrap={false}>
      <Icon kind={kind} />
      <View style={{ flex: 1 }}>
        <Text style={S.sideLabel}>{label.toUpperCase()}</Text>
        <Text style={S.sideValue}>{value}</Text>
      </View>
    </View>
  );
}

function SideItem({ label, value }: { label: string; value?: string | null }) {
  if (!nonEmpty(value)) return null;
  return (
    <View style={S.sideItem} wrap={false}>
      <Text style={S.sideLabel}>{label.toUpperCase()}</Text>
      <Text style={S.sideValue}>{value}</Text>
    </View>
  );
}

function SideBlock({ title, empty, children }: { title: string; empty?: boolean; children?: React.ReactNode }) {
  return (
    <View style={S.sideBlock}>
      <View style={S.sideTitleRow}>
        <View style={S.sideBar} />
        <Text style={S.sideChip}>{title}</Text>
      </View>
      {empty ? <Text style={S.sideEmpty}>Non renseigné</Text> : children}
    </View>
  );
}

type GridItem = { label: string; value?: string | null; full?: boolean };

// Les champs vides sont masqués (rendu plus aéré et plus vivant)
function Grid({ items, emptyText = 'Aucune information renseignée' }: { items: GridItem[]; emptyText?: string }) {
  const shown = items.filter((i) => nonEmpty(i.value));
  if (shown.length === 0) {
    return <View style={S.emptyBox}><Text style={S.emptyText}>{emptyText}</Text></View>;
  }
  return (
    <View style={S.grid}>
      {shown.map((i) => (
        <View key={i.label} style={i.full ? S.cellFull : S.cell} wrap={false}>
          <Text style={S.label}>{i.label.toUpperCase()}</Text>
          <Text style={S.value}>{i.value}</Text>
        </View>
      ))}
    </View>
  );
}

function Section({ title, accent = C.orange, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <View style={S.section}>
      <View style={S.secTitleRow} minPresenceAhead={60}>
        <View style={[S.secBar, { backgroundColor: accent }]} />
        <Text style={S.chip}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Pill({ value }: { value?: boolean | null }) {
  if (value === null || value === undefined) return <Text style={[S.pill, { backgroundColor: '#EEE7DC', color: C.muted }]}>—</Text>;
  return value
    ? <Text style={[S.pill, { backgroundColor: '#DDF5B8', color: '#3F6212' }]}>OUI</Text>
    : <Text style={[S.pill, { backgroundColor: '#EEE7DC', color: '#6B5E50' }]}>NON</Text>;
}

function TaxCard({ label, value, last }: { label: string; value?: boolean | null; last?: boolean }) {
  return (
    <View style={[S.taxCard, last ? { marginRight: 0 } : {}]}>
      <Text style={S.label}>{label.toUpperCase()}</Text>
      <Pill value={value} />
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

  // Taille du prénom adaptée à sa longueur (évite tout chevauchement avec le nom)
  const fn = (e.firstName || '').toUpperCase();
  const fnSize = fn.length <= 14 ? 24 : fn.length <= 20 ? 20 : 16;
  const ln = (e.lastName || '').toUpperCase();
  const lnSize = ln.length <= 12 ? 30 : ln.length <= 18 ? 26 : 21;

  const naissance = [fmtDate(e.dateOfBirth), e.placeOfBirth].filter(Boolean).join(' — à ') +
    (age !== null && e.dateOfBirth ? `  (${age} ans)` : '');
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

  const urgenceEmpty = ![e.emergencyContactName, e.emergencyContactRelation, e.emergencyContactPhone].some(nonEmpty);
  const santeEmpty = ![e.bloodType, e.pathology, e.uniformSize, e.shoeSize].some(nonEmpty);
  const compEmpty = ![e.educationLevel, e.foreignLanguages].some(nonEmpty) && !e.hasDrivingLicense;

  const logoNode = hasLogo
    ? <View style={S.logoBox}><Image src={company!.logoUrl as string} style={S.logo} /></View>
    : <Text style={S.companyName}>{company?.name || 'Entreprise'}</Text>;

  const slimLogoNode = hasLogo
    ? <View style={S.slimLogoBox}><Image src={company!.logoUrl as string} style={S.slimLogo} /></View>
    : <Text style={S.slimName}>{company?.name || 'Entreprise'}</Text>;

  const payCells: GridItem[] = [
    { label: 'Mode de paiement', value: PAYMENT[e.paymentMethod || ''] || e.paymentMethod, full: true },
    { label: 'Banque', value: e.bankName },
    { label: 'N° de compte / RIB', value: e.bankAccountNumber },
    { label: 'Opérateur Mobile Money', value: e.mobileMoneyOperator },
    { label: 'N° Mobile Money', value: e.mobileMoneyNumber },
  ];

  return (
    <Document title={`Fiche_${e.lastName}_${e.firstName}`} author={company?.name || 'KonzaRH'} subject="Fiche du personnel">

      {/* ════════════════════════ PAGE 1 — identité ════════════════════════ */}
      <Page size="A4" style={S.page}>
        <View style={S.sideBg} />
        <View style={S.sideStripe} />

        <View style={S.row}>
          {/* ── Colonne latérale ── */}
          <View style={S.side}>
            <View style={S.ringOuter}>
              <View style={S.ringMid}>
                <View style={S.ringIn}>
                  {e.photoUrl
                    ? <Image src={e.photoUrl} style={S.photo} />
                    : <View style={S.photoFallback}><Text style={S.photoInitials}>{initials}</Text></View>}
                </View>
              </View>
            </View>
            <Text style={[S.badge, { backgroundColor: st.bg, color: st.fg }]}>{st.label}</Text>
            <Text style={S.matricule}>MATRICULE  {e.employeeNumber || '—'}</Text>

            <SideBlock title="CONTACT">
              <ContactRow kind="phone" label="Téléphone" value={e.phone} />
              <ContactRow kind="phone" label="Téléphone secondaire" value={e.secondaryPhone} />
              <ContactRow kind="mail" label="E-mail" value={e.email} />
              <ContactRow kind="pin" label="Adresse" value={[e.address, e.city].filter(Boolean).join(', ')} />
            </SideBlock>

            <SideBlock title="URGENCE" empty={urgenceEmpty}>
              <SideItem label="Personne à prévenir" value={e.emergencyContactName} />
              <SideItem label="Lien de parenté" value={e.emergencyContactRelation} />
              <SideItem label="Téléphone" value={e.emergencyContactPhone} />
            </SideBlock>

            <SideBlock title="SANTÉ & TENUE" empty={santeEmpty}>
              <SideItem label="Groupe sanguin" value={e.bloodType} />
              <SideItem label="Pathologie habituelle" value={e.pathology} />
              <SideItem label="Taille de la tenue" value={e.uniformSize} />
              <SideItem label="Pointure" value={e.shoeSize} />
            </SideBlock>

            <SideBlock title="COMPÉTENCES" empty={compEmpty}>
              <SideItem label="Niveau d'études" value={e.educationLevel} />
              <SideItem label="Langues étrangères" value={e.foreignLanguages} />
              <SideItem
                label="Permis de conduire"
                value={e.hasDrivingLicense ? `Oui${e.drivingLicenseNumber ? ` — N° ${e.drivingLicenseNumber}` : ''}` : ''}
              />
            </SideBlock>
          </View>

          {/* ── Colonne principale ── */}
          <View style={S.main}>
            <View style={S.band}>
              <Svg style={S.bandDeco} width={230} height={190} viewBox="0 0 230 190">
                <Circle cx={190} cy={30} r={86} fill="#2C4FA6" />
                <Circle cx={254} cy={168} r={42} fill="#F97316" fillOpacity={0.9} />
                <Circle cx={204} cy={112} r={8} fill="#A3E635" fillOpacity={0.95} />
                <Circle cx={96} cy={14} r={6} fill="#38BDF8" fillOpacity={0.9} />
              </Svg>
              <View style={S.bandTop}>
                <View style={{ flex: 1, paddingRight: 12, alignItems: 'flex-start' }}>{logoNode}</View>
                <Text style={S.docTag}>FICHE DU PERSONNEL  •  {today}</Text>
              </View>
              <Text style={{ fontSize: fnSize, color: C.white, letterSpacing: 1.5, lineHeight: 1.15 }}>{fn}</Text>
              <Text style={[S.lastName, { fontSize: lnSize, lineHeight: 1.1 }]}>{ln}</Text>
              <View style={S.limeDash} />
              <Text style={S.position}>{fullTitle || 'EMPLOYÉ'}</Text>
            </View>

            <View style={S.mainBody}>
              <View style={S.stats}>
                <View style={[S.stat, { backgroundColor: C.orangeSoft, borderLeftColor: C.orange }]}>
                  <Text style={S.statLabel}>EMBAUCHÉ(E) LE</Text>
                  <Text style={S.statValue}>{fmtShort(e.hireDate) || '—'}</Text>
                </View>
                <View style={[S.stat, { backgroundColor: C.skySoft, borderLeftColor: C.sky }]}>
                  <Text style={S.statLabel}>ANCIENNETÉ</Text>
                  <Text style={S.statValue}>{seniority(e.hireDate, e.terminationDate) || '—'}</Text>
                </View>
                <View style={[S.stat, S.statLast, { backgroundColor: C.limeSoft, borderLeftColor: C.limeDeep }]}>
                  <Text style={S.statLabel}>CONTRAT</Text>
                  <Text style={S.statValue}>{e.contractType || '—'}</Text>
                </View>
              </View>

              <Section title="IDENTITÉ" accent={C.orange}>
                <Grid
                  items={[
                    { label: 'Naissance', value: naissance, full: true },
                    { label: 'Genre', value: GENDER[e.gender || ''] || e.gender },
                    { label: 'Nationalité', value: countryName(e.nationality) },
                    { label: 'Résidence', value: e.isResident === true ? 'Résident' : e.isResident === false ? 'Non résident' : '' },
                    { label: 'Situation familiale', value: MARITAL[e.maritalStatus || ''] || e.maritalStatus },
                    { label: 'Enfant(s) à charge', value: e.numberOfChildren !== undefined && e.numberOfChildren !== null ? String(e.numberOfChildren) : '' },
                    { label: 'Père', value: e.fatherName },
                    { label: 'Mère', value: e.motherName },
                  ]}
                />
              </Section>

              <Section title="PIÈCES & NUMÉROS" accent={C.sky}>
                <Grid
                  emptyText="Aucune pièce ni aucun numéro renseigné"
                  items={[
                    { label: "Pièce d'identité", value: e.nationalIdNumber },
                    { label: 'N° CNSS', value: e.cnssNumber },
                    { label: 'NIU', value: e.niu },
                    { label: 'N° contribuable', value: e.taxNumber },
                  ]}
                />
              </Section>

              <Section title="EMPLOI & CONTRAT" accent={C.limeDeep}>
                <Grid
                  items={[
                    { label: 'Poste', value: e.position },
                    { label: 'Département / service', value: e.departmentName },
                    { label: 'Catégorie / échelon', value: classification },
                    { label: 'Type de contrat', value: e.contractType },
                    { label: "Date d'embauche", value: fmtDate(e.hireDate) },
                    { label: 'Fin de contrat', value: e.contractEndDate ? fmtDate(e.contractEndDate) : (e.contractType === 'CDI' ? 'Durée indéterminée' : '') },
                    { label: "Période d'essai", value: essai, full: true },
                    { label: 'Date de sortie', value: e.terminationDate ? fmtDate(e.terminationDate) : '' },
                    { label: 'Motif de sortie', value: e.terminationReason },
                  ]}
                />
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
          <Section title="RÉMUNÉRATION & PAIEMENT" accent={C.orange}>
            <View style={S.payRow}>
              <View style={S.hero}>
                <Text style={S.heroLabel}>SALAIRE DE BASE</Text>
                <Text style={S.heroValue}>{fmtMoney(e.baseSalary) || '—'}</Text>
                <Text style={S.heroUnit}>PAR MOIS</Text>
              </View>
              <View style={S.payCol}>
                <Grid items={payCells.map((c) => ({ ...c, full: true }))} emptyText="Aucun moyen de paiement renseigné" />
              </View>
            </View>
          </Section>
        )}

        <Section title="RÉGIME FISCAL & SOCIAL" accent={C.sky}>
          <View style={S.taxRow}>
            <TaxCard label="ITS / IRPP" value={e.isSubjectToIrpp} />
            <TaxCard label="CNSS" value={e.isSubjectToCnss} />
            <TaxCard label="TUS" value={e.isSubjectToTus} />
            <View style={[S.taxCard, { marginRight: 0 }]}>
              <Text style={S.label}>ZONE TOL</Text>
              <Text style={[S.pill, { backgroundColor: C.skySoft, color: C.navy }]}>
                {(e.tolZone === 'PERIPHERIE' ? 'PÉRIPHÉRIE' : e.tolZone === 'VILLE' ? 'VILLE' : e.tolZone || '—')}
              </Text>
            </View>
          </View>
          {e.taxExemptionReason ? (
            <View style={{ marginTop: 8 }}>
              <Grid items={[{ label: "Motif d'exonération", value: e.taxExemptionReason, full: true }]} />
            </View>
          ) : null}
        </Section>

        <Section title="MATÉRIEL EN DOTATION" accent={C.limeDeep}>
          {assets.length > 0 ? (
            <Table
              cols={[
                { title: 'Équipement', width: '50%' },
                { title: 'Catégorie', width: '25%' },
                { title: 'N° de série', width: '25%' },
              ]}
              rows={assets.map((a) => [a.name, a.category || '', a.serialNumber || ''])}
            />
          ) : (
            <View style={S.emptyBox}><Text style={S.emptyText}>Aucun matériel en dotation</Text></View>
          )}
        </Section>

        <Section title="DOCUMENTS AU DOSSIER" accent={C.orange}>
          {docs.length > 0 ? (
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
          ) : (
            <View style={S.emptyBox}><Text style={S.emptyText}>Aucun document enregistré dans le dossier</Text></View>
          )}
        </Section>

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