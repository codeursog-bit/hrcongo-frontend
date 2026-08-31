// ============================================================================
// 📁 components/documents/orca/OrcaDocumentShell.tsx
// ✅ Habillage commun à tous les documents imprimables au modèle Orca
//    (congé/absence, prêt/avance, marchandise) : en-tête avec logo, titre
//    encadré, pied de page légal — reproduit le modèle Word/Excel fourni
//    par le client au champ près.
// ✅ Réutilisable pour n'importe quelle entreprise cliente ayant son propre
//    modèle : le logo et le cachet viennent de `company`, jamais en dur.
// ============================================================================

interface OrcaCompany {
  legalName: string;
  tradeName?: string | null;
  rccmNumber: string;
  taxNumber?: string | null;
  address: string;
  city: string;
  phone: string;
  logo?: string | null;
  documentFooterText?: string | null;
}

interface OrcaDocumentShellProps {
  company: OrcaCompany;
  title: string;
  reference?: string;
  id?: string;
  children: React.ReactNode;
}

export default function OrcaDocumentShell({ company, title, reference, id, children }: OrcaDocumentShellProps) {
  return (
    <div
      id={id}
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '14mm 16mm',
        background: '#fff',
        color: '#111',
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '12.5px',
        boxSizing: 'border-box',
      }}
    >
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        {company.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={company.logo} alt={company.tradeName || company.legalName} style={{ height: 62 }} />
        ) : (
          <div style={{ fontWeight: 700, fontSize: 18 }}>{company.tradeName || company.legalName}</div>
        )}
        {reference && (
          <div style={{ textAlign: 'right', fontSize: 10.5, color: '#666' }}>
            Référence : {reference}
          </div>
        )}
      </div>

      {/* Titre encadré — reproduit le bandeau gris du modèle original */}
      <div
        style={{
          border: '1.5px solid #111',
          background: '#e5e5e5',
          padding: '10px 14px',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: 0.5,
          margin: '10px 0 22px',
        }}
      >
        {title}
      </div>

      {/* Corps du document */}
      <div>{children}</div>

      {/* Pied de page légal — texte libre si l'entreprise en a défini un (ex. Orca), sinon composé automatiquement */}
      <div style={{ marginTop: 40, textAlign: 'center', fontSize: 9, color: '#555', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
        {company.documentFooterText ? (
          company.documentFooterText
        ) : (
          <>
            <div style={{ fontWeight: 700 }}>{company.legalName}{company.tradeName ? ` (${company.tradeName})` : ''}</div>
            <div>
              RCCM {company.rccmNumber}
              {company.taxNumber ? ` · NIU : ${company.taxNumber}` : ''} · Tél : {company.phone}
            </div>
            <div>{company.address}{company.city ? `, ${company.city}` : ''}</div>
          </>
        )}
      </div>
    </div>
  );
}