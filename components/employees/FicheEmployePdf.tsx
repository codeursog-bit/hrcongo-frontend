'use client';

import React from 'react';
import {
  Document, Page, View, Text, Image, StyleSheet,
} from '@react-pdf/renderer';

// ============================================================================
// Fiche de renseignement — PDF imprimable/téléchargeable pour un employé.
// Structure et champs inspirés du modèle papier "Fiche de renseignement ORCA"
// fourni par l'utilisateur, généralisés pour fonctionner avec n'importe quelle
// entreprise (logo/nom dynamiques au lieu d'être codés en dur).
// ============================================================================

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 50,
    paddingHorizontal: 36,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  headerBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 18,
    borderRadius: 6,
    borderBottomWidth: 3,
    borderBottomColor: '#0ea5e9',
  },
  logo: {
    width: 42,
    height: 42,
    marginRight: 10,
    objectFit: 'contain',
    borderRadius: 4,
  },
  companyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyName: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
  },
  companyTagline: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 1,
  },
  metaBox: {
    alignItems: 'flex-end',
  },
  metaLine: {
    fontSize: 9,
    color: '#374151',
    marginBottom: 2,
  },
  metaLabel: {
    fontWeight: 700,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 4,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#111827',
  },
  subtitle: {
    fontSize: 9,
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 5,
    alignItems: 'center',
  },
  rowAlt: {
    backgroundColor: '#f9fafb',
  },
  label: {
    width: '38%',
    fontSize: 9.5,
    fontWeight: 700,
    color: '#111827',
    paddingRight: 8,
  },
  value: {
    width: '62%',
    fontSize: 10,
    color: '#111827',
  },
  twoCol: {
    flexDirection: 'row',
  },
  colLabel: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#111827',
    marginRight: 6,
  },
  colValue: {
    fontSize: 10,
  },
  sectionSpacer: {
    height: 10,
  },
  checkGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '62%',
  },
  checkOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 2,
  },
  checkBox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: '#111827',
    marginRight: 4,
  },
  checkBoxOn: {
    backgroundColor: '#111827',
  },
  checkLabel: {
    fontSize: 9.5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 36,
    borderTopWidth: 2,
    borderTopColor: '#0ea5e9',
  },
  footerText: {
    fontSize: 8,
    color: '#64748b',
  },
});

function CheckGroup({ options, selected }: { options: string[]; selected?: string | null }) {
  return (
    <View style={styles.checkGroup}>
      {options.map((opt) => (
        <View key={opt} style={styles.checkOption}>
          <View style={[styles.checkBox, selected === opt ? styles.checkBoxOn : undefined]} />
          <Text style={styles.checkLabel}>{opt}</Text>
        </View>
      ))}
    </View>
  );
}

function Row({ label, value, alt }: { label: string; value?: React.ReactNode; alt?: boolean }) {
  return (
    <View style={[styles.row, alt ? styles.rowAlt : undefined]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.value}>
        {typeof value === 'string' || typeof value === 'undefined'
          ? <Text style={styles.value}>{value || '—'}</Text>
          : value}
      </View>
    </View>
  );
}

const MARITAL_LABELS: Record<string, string> = {
  SINGLE: 'Célibataire', MARRIED: 'Marié', DIVORCED: 'Divorcé', WIDOWED: 'Veuf',
};

export interface FicheEmployeData {
  employeeNumber?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  bloodType?: string | null;
  pathology?: string | null;
  address?: string;
  phone?: string;
  email?: string;
  fatherName?: string | null;
  motherName?: string | null;
  maritalStatus?: string;
  numberOfChildren?: number;
  position?: string;
  departmentName?: string | null;
  educationLevel?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  hasDrivingLicense?: boolean;
  drivingLicenseNumber?: string | null;
  foreignLanguages?: string | null;
  bankAccountNumber?: string | null;
  cnssNumber?: string | null;
  nationalIdNumber?: string | null;
  uniformSize?: string | null;
  shoeSize?: string | null;
  hireDate?: string;
}

export interface FicheCompanyData {
  name?: string;
  logoUrl?: string | null;
}

function fmtDate(d?: string) {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('fr-FR'); } catch { return d; }
}

export function FicheEmployePdf({ employee, company }: { employee: FicheEmployeData; company?: FicheCompanyData }) {
  const today = new Date().toLocaleDateString('fr-FR');
  const naissance = employee.dateOfBirth || employee.placeOfBirth
    ? `${fmtDate(employee.dateOfBirth)}${employee.placeOfBirth ? `  —  ${employee.placeOfBirth}` : ''}`
    : undefined;

  return (
    <Document title={`Fiche_${employee.lastName}_${employee.firstName}`}>
      <Page size="A4" style={styles.page}>

        {/* En-tête — bandeau pleine largeur */}
        <View style={styles.headerBand} fixed>
          <View style={styles.companyBlock}>
            {company?.logoUrl && <Image src={company.logoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.companyName}>{company?.name || 'Entreprise'}</Text>
              <Text style={styles.companyTagline}>Dossier du personnel</Text>
            </View>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLine}><Text style={styles.metaLabel}>Fiche N° : </Text>{employee.employeeNumber || '—'}</Text>
            <Text style={styles.metaLine}><Text style={styles.metaLabel}>Date : </Text>{today}</Text>
          </View>
        </View>

        <Text style={styles.title}>FICHE DE RENSEIGNEMENT</Text>
        <Text style={styles.subtitle}>Dossier administratif de l'employé — document interne confidentiel</Text>

        <Row label="Nom(s) & prénom(s)" value={`${employee.lastName} ${employee.firstName}`} />
        <Row label="Date & lieu de naissance" value={naissance} alt />
        <Row label="Groupe sanguin" value={employee.bloodType || undefined} />
        <Row label="Pathologie (maladie habituelle)" value={employee.pathology || 'Aucune renseignée'} alt />
        <Row label="Adresse" value={employee.address} />
        <Row label="Téléphone" value={employee.phone} alt />
        <Row label="Adresse mail (e-mail)" value={employee.email} />
        <Row label="Nom(s) & prénom(s) du père" value={employee.fatherName || undefined} alt />
        <Row label="Nom(s) & prénom(s) de la mère" value={employee.motherName || undefined} />

        <View style={[styles.row, styles.rowAlt]}>
          <Text style={styles.label}>Situation familiale</Text>
          <CheckGroup options={['Marié', 'Célibataire', 'Divorcé', 'Veuf']} selected={employee.maritalStatus ? MARITAL_LABELS[employee.maritalStatus] : null} />
        </View>

        <Row label="Nombre d'enfant(s)" value={employee.numberOfChildren !== undefined ? String(employee.numberOfChildren) : undefined} />
        <Row label="Profession" value={employee.position} alt />
        <Row label="Département / Service" value={employee.departmentName || undefined} />
        <Row label="Niveau d'études ou diplôme le plus élevé" value={employee.educationLevel || undefined} alt />

        <Row
          label="Personne en cas d'urgence"
          value={
            <View style={styles.twoCol}>
              <Text style={styles.colValue}>{employee.emergencyContactName || '—'}</Text>
              {employee.emergencyContactRelation && (
                <Text style={[styles.colValue, { marginLeft: 10, color: '#6b7280' }]}>({employee.emergencyContactRelation})</Text>
              )}
            </View>
          }
        />
        <Row label="Téléphone (urgence)" value={employee.emergencyContactPhone || undefined} alt />

        <View style={styles.row}>
          <Text style={styles.label}>Permis de conduire</Text>
          <View style={styles.checkGroup}>
            <View style={styles.checkOption}>
              <View style={[styles.checkBox, employee.hasDrivingLicense ? styles.checkBoxOn : undefined]} />
              <Text style={styles.checkLabel}>Oui</Text>
            </View>
            <View style={styles.checkOption}>
              <View style={[styles.checkBox, !employee.hasDrivingLicense ? styles.checkBoxOn : undefined]} />
              <Text style={styles.checkLabel}>Non</Text>
            </View>
            {employee.hasDrivingLicense && employee.drivingLicenseNumber && (
              <Text style={[styles.checkLabel, { marginLeft: 6, color: '#6b7280' }]}>N° {employee.drivingLicenseNumber}</Text>
            )}
          </View>
        </View>

        <Row label="Langue étrangère" value={employee.foreignLanguages || undefined} alt />
        <Row label="Registre d'identité bancaire (RIB)" value={employee.bankAccountNumber || undefined} />
        <Row label="N° CNSS" value={employee.cnssNumber || undefined} alt />
        <Row label="Numéro de la pièce nationale d'identité" value={employee.nationalIdNumber || undefined} />

        <View style={[styles.row, styles.rowAlt]}>
          <Text style={styles.label}>Taille de la tenue</Text>
          <CheckGroup options={['S', 'M', 'L', 'XL', 'XXL']} selected={employee.uniformSize || null} />
        </View>

        <Row label="Pointure de chaussures" value={employee.shoeSize || undefined} />
        <Row label="Date de recrutement" value={fmtDate(employee.hireDate)} alt />

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{company?.name || 'Entreprise'}</Text>
          <Text style={styles.footerText}>Document confidentiel — usage interne uniquement</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}