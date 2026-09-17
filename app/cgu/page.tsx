// ============================================================================
// 📁 app/cgu/page.tsx — Conditions Générales d'Utilisation Konza RH
// ============================================================================
// ⚠️ PREMIER JET — à faire relire par un professionnel du droit avant
// publication officielle, en particulier les clauses de paiement,
// résiliation et responsabilité. Ne constitue pas un avis juridique.
// ============================================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation — Konza RH',
  description:
    'Conditions régissant l\'utilisation de la plateforme Konza RH : abonnement, paiement, résiliation, responsabilités.',
  alternates: { canonical: `${SITE_URL}/cgu` },
  robots: { index: true, follow: true },
};

const C = {
  bg: '#050607', card: '#0B0C0F', border: 'rgba(255,255,255,0.07)',
  text: '#F8FAFC', muted: '#64748B', sub: '#94A3B8', accent: '#10B981',
};

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ scrollMarginTop: 100, marginBottom: 40 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 14, letterSpacing: '-0.02em' }}>{title}</h2>
      <div style={{ fontSize: 15.5, lineHeight: 1.8, color: C.sub }}>{children}</div>
    </section>
  );
}

const toc = [
  ['objet', '1. Objet'],
  ['acces', '2. Accès au service'],
  ['abonnement', '3. Abonnement et tarifs'],
  ['paiement', '4. Paiement et résiliation'],
  ['obligations', '5. Obligations de l\'utilisateur'],
  ['propriete', '6. Propriété intellectuelle'],
  ['donnees', '7. Données et confidentialité'],
  ['responsabilite', '8. Responsabilité et disponibilité'],
  ['droit', '9. Droit applicable'],
  ['contact', '10. Contact'],
];

export default function CguPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif", color: C.text }}>
      <Navbar />

      <section style={{ padding: '130px 32px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <nav aria-label="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13 }}>
            <Link href="/" style={{ color: C.muted, textDecoration: 'none' }}>Accueil</Link>
            <span style={{ color: C.border }}>›</span>
            <span style={{ color: C.sub }}>Conditions Générales d'Utilisation</span>
          </nav>

          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Conditions Générales d'Utilisation
          </h1>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 40 }}>
            Dernière mise à jour : septembre 2026
          </p>

          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.85, marginBottom: 44 }}>
            Les présentes Conditions Générales d'Utilisation (« CGU ») régissent l'accès et l'utilisation de la
            plateforme Konza RH, éditée depuis Pointe-Noire, République du Congo. En créant un compte ou en
            utilisant le service, vous acceptez ces conditions sans réserve.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 32px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 48 }} className="cgu-layout">

          <nav aria-label="Sommaire" style={{ position: 'sticky', top: 100, alignSelf: 'start' }} className="cgu-toc">
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Sommaire</p>
            {toc.map(([id, label]) => (
              <a key={id} href={`#${id}`} style={{ display: 'block', fontSize: 13, color: C.sub, textDecoration: 'none', padding: '6px 0', lineHeight: 1.4 }}>
                {label}
              </a>
            ))}
          </nav>

          <div>
            <Section id="objet" title="1. Objet">
              <p>Konza RH est un logiciel en ligne (SaaS) de gestion des ressources humaines et de la paie, destiné aux entreprises basées en République du Congo. Il permet notamment : la génération de bulletins de paie conformes à la législation congolaise (CNSS, ITS, CAMU, TUS, TOL), la gestion des congés, du pointage, des contrats, du recrutement, de la formation et des avances sur salaire.</p>
            </Section>

            <Section id="acces" title="2. Accès au service">
              <p>L'accès nécessite la création d'un compte avec une adresse email professionnelle valide. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée depuis votre compte. Toute suspicion d'accès non autorisé doit nous être signalée immédiatement.</p>
            </Section>

            <Section id="abonnement" title="3. Abonnement et tarifs">
              <p style={{ marginBottom: 14 }}>Konza RH est proposé sous forme d'abonnement mensuel ou annuel, selon des paliers calculés en fonction du nombre d'employés gérés (Starter, Business, Pro, Entreprise — cette dernière formule étant établie sur devis). Un premier mois d'essai gratuit et sans engagement est proposé aux nouveaux clients.</p>
              <p>Les tarifs en vigueur sont ceux affichés sur la page <Link href="/tarifs" style={{ color: C.accent }}>Tarifs</Link> au moment de la souscription. Konza RH se réserve le droit de faire évoluer ses tarifs, avec un préavis raisonnable communiqué aux clients existants avant application sur un nouveau cycle de facturation.</p>
            </Section>

            <Section id="paiement" title="4. Paiement et résiliation">
              <p style={{ marginBottom: 14 }}>Le paiement est dû selon la périodicité choisie (mensuelle ou annuelle) à compter de la fin de la période d'essai gratuit. Un défaut de paiement peut entraîner la suspension temporaire de l'accès au service, après notification.</p>
              <p>Vous pouvez résilier votre abonnement à tout moment, sans engagement de durée minimale au-delà de la période déjà payée. La résiliation prend effet à la fin de la période de facturation en cours ; aucun remboursement au prorata n'est effectué pour une période déjà entamée, sauf disposition contraire prévue au moment de la souscription.</p>
            </Section>

            <Section id="obligations" title="5. Obligations de l'utilisateur">
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Fournir des informations exactes lors de l'inscription et les tenir à jour</li>
                <li>Utiliser le service conformément à la loi congolaise, notamment en matière de droit du travail et de protection des données de vos employés</li>
                <li>Ne pas tenter de contourner les mesures de sécurité du service ni d'accéder à des données ne vous appartenant pas</li>
                <li>Rester seul responsable de l'exactitude des données de paie que vous saisissez ; Konza RH calcule les cotisations et impôts sur la base des informations que vous fournissez</li>
              </ul>
            </Section>

            <Section id="propriete" title="6. Propriété intellectuelle">
              <p>Le logiciel Konza RH, son code, son design et sa marque sont la propriété exclusive de Konza RH. Votre abonnement vous accorde un droit d'usage du service, non exclusif et non transférable, pour la durée de votre abonnement — il ne constitue en aucun cas un transfert de propriété du logiciel. Les données que vous saisissez (données RH et de paie de votre entreprise) restent votre propriété.</p>
            </Section>

            <Section id="donnees" title="7. Données et confidentialité">
              <p>Le traitement des données personnelles est détaillé dans notre <Link href="/privacy" style={{ color: C.accent }}>Politique de confidentialité</Link>, qui fait partie intégrante des présentes CGU.</p>
            </Section>

            <Section id="responsabilite" title="8. Responsabilité et disponibilité">
              <p style={{ marginBottom: 14 }}>Konza RH met en œuvre des moyens raisonnables pour assurer la disponibilité et la fiabilité du service, sans garantie d'absence totale d'interruption (maintenance, incident technique, cas de force majeure).</p>
              <p>Konza RH ne saurait être tenu responsable des conséquences d'une erreur de saisie de données par l'utilisateur, ni d'une mauvaise interprétation du droit du travail congolais laissée à l'appréciation de l'entreprise cliente ; le logiciel est un outil d'aide à la gestion, pas un substitut à un conseil juridique ou comptable professionnel.</p>
            </Section>

            <Section id="droit" title="9. Droit applicable">
              <p>Les présentes CGU sont soumises au droit de la République du Congo et à l'espace OHADA. Tout litige relatif à leur interprétation ou leur exécution sera, à défaut de résolution amiable, soumis aux juridictions compétentes de Pointe-Noire.</p>
            </Section>

            <Section id="contact" title="10. Contact">
              <p>Pour toute question relative à ces CGU : <a href="mailto:contact@konza-rh.cg" style={{ color: C.accent }}>contact@konza-rh.cg</a> ou <a href="tel:+242064133693" style={{ color: C.accent }}>+242 06 413 36 93</a>.</p>
            </Section>
          </div>
        </div>
      </section>

      <Footer />
      <style>{`
        @media(max-width:768px){ .cgu-layout{grid-template-columns:1fr!important} .cgu-toc{display:none!important} }
      `}</style>
    </div>
  );
}