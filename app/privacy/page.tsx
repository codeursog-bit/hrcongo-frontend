// ============================================================================
// 📁 app/privacy/page.tsx — Politique de confidentialité Konza RH
// ============================================================================
// ⚠️ PREMIER JET — à faire relire par un professionnel du droit avant
// publication officielle. Rédigé à partir de ce que Konza RH fait réellement
// avec les données (paie, CNSS/ITS/CAMU, pointage GPS, recrutement,
// affiliation), mais ne constitue pas un avis juridique.
// ============================================================================
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Konza RH',
  description:
    'Comment Konza RH collecte, utilise et protège vos données personnelles et celles de vos employés. Conforme au droit congolais.',
  alternates: { canonical: `${SITE_URL}/privacy` },
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
  ['collecte', 'Quelles données nous collectons'],
  ['finalites', 'Pourquoi nous les collectons'],
  ['base-legale', 'Base légale du traitement'],
  ['partage', 'Avec qui elles sont partagées'],
  ['conservation', 'Combien de temps elles sont conservées'],
  ['securite', 'Comment elles sont sécurisées'],
  ['cookies', 'Cookies et traceurs'],
  ['droits', 'Vos droits'],
  ['contact', 'Nous contacter'],
];

export default function PrivacyPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "system-ui,-apple-system,'Segoe UI',sans-serif", color: C.text }}>
      <Navbar />

      <section style={{ padding: '130px 32px 0' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <nav aria-label="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13 }}>
            <Link href="/" style={{ color: C.muted, textDecoration: 'none' }}>Accueil</Link>
            <span style={{ color: C.border }}>›</span>
            <span style={{ color: C.sub }}>Politique de confidentialité</span>
          </nav>

          <h1 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Politique de confidentialité
          </h1>
          <p style={{ fontSize: 15, color: C.muted, marginBottom: 40 }}>
            Dernière mise à jour : septembre 2026 · Applicable à konza-rh.cg et à l'application Konza RH
          </p>

          <p style={{ fontSize: 16, color: C.sub, lineHeight: 1.85, marginBottom: 44 }}>
            Konza RH (« nous », « notre ») propose un logiciel de gestion des ressources humaines et de la paie
            destiné aux entreprises basées en République du Congo. Cette page explique quelles données nous
            collectons — sur les visiteurs de notre site, sur les utilisateurs de notre plateforme, et sur les
            employés dont les données sont traitées par nos clients via Konza RH — et comment nous les utilisons.
          </p>
        </div>
      </section>

      <section style={{ padding: '0 32px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '200px 1fr', gap: 48 }} className="privacy-layout">

          <nav aria-label="Sommaire" style={{ position: 'sticky', top: 100, alignSelf: 'start' }} className="privacy-toc">
            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Sommaire</p>
            {toc.map(([id, label]) => (
              <a key={id} href={`#${id}`} style={{ display: 'block', fontSize: 13, color: C.sub, textDecoration: 'none', padding: '6px 0', lineHeight: 1.4 }}>
                {label}
              </a>
            ))}
          </nav>

          <div>
            <Section id="collecte" title="1. Quelles données nous collectons">
              <p style={{ marginBottom: 14 }}><strong style={{ color: C.text }}>Visiteurs du site public</strong> — nom, email et message si vous utilisez notre formulaire de contact ; aucune donnée n'est collectée par simple navigation en dehors des cookies techniques décrits plus bas.</p>
              <p style={{ marginBottom: 14 }}><strong style={{ color: C.text }}>Comptes utilisateurs (administrateurs RH, gestionnaires, employés)</strong> — nom, email professionnel, mot de passe (stocké chiffré), rôle dans l'entreprise, numéro de téléphone.</p>
              <p style={{ marginBottom: 14 }}><strong style={{ color: C.text }}>Données RH et paie des employés</strong>, saisies par nos clients (les entreprises) dans le cadre de leur gestion RH : identité, date et lieu de naissance, nationalité, situation familiale (statut marital, nombre d'enfants), photo, coordonnées, adresse, numéro de pièce d'identité nationale, contrat de travail, salaire et éléments de rémunération, numéro CNSS, numéro fiscal (NIU), données fiscales (ITS, CAMU, TUS, TOL), coordonnées bancaires ou de mobile money pour le versement du salaire, congés, prêts et avances, historique de présence, évaluations de performance, formations suivies.</p>
              <p style={{ marginBottom: 14 }}><strong style={{ color: C.text }}>Données de l'entreprise cliente</strong> — raison sociale, numéro RCCM, numéro CNSS employeur, numéro fiscal, adresse et localisation GPS de l'établissement (pour délimiter la zone de pointage autorisée des employés).</p>
              <p style={{ marginBottom: 14 }}><strong style={{ color: C.text }}>Données de géolocalisation</strong> — si votre entreprise active le pointage par géolocalisation, la position GPS est enregistrée au moment du pointage uniquement, pas en continu.</p>
              <p style={{ marginBottom: 14 }}><strong style={{ color: C.text }}>Candidats au recrutement</strong> — nom, email, téléphone, CV et lettre de motivation, réponses aux tests d'évaluation, pour les entreprises utilisant notre module recrutement.</p>
              <p><strong style={{ color: C.text }}>Affiliés</strong> — numéro de téléphone et identifiant de paiement Mobile Money (MTN/Airtel/Orange) nécessaire au versement des commissions.</p>
            </Section>

            <Section id="finalites" title="2. Pourquoi nous les collectons">
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Fournir le service : gestion de la paie, des congés, du pointage, des contrats et du recrutement pour nos entreprises clientes</li>
                <li>Calculer correctement les cotisations et impôts légaux (CNSS, ITS, CAMU, TUS, TOL) selon le droit congolais en vigueur</li>
                <li>Sécuriser les comptes (authentification, détection d'activité suspecte)</li>
                <li>Répondre aux demandes envoyées via le formulaire de contact</li>
                <li>Verser les commissions d'affiliation</li>
                <li>Améliorer le produit à partir de statistiques d'usage anonymisées</li>
              </ul>
            </Section>

            <Section id="base-legale" title="3. Base légale du traitement">
              <p>Pour les données d'un compte utilisateur et les données RH saisies par nos clients, le traitement repose sur l'exécution du contrat qui vous lie (ou lie votre employeur) à Konza RH, ainsi que sur le respect des obligations légales congolaises en matière de paie et de cotisations sociales. Pour le formulaire de contact, la base légale est votre consentement à nous écrire.</p>
              <p style={{ marginTop: 14 }}>Pour les entreprises clientes : elles restent responsables des données de leurs employés qu'elles saisissent dans Konza RH (nous agissons comme sous-traitant technique) ; Konza RH est responsable des données de compte et de facturation de ses clients directs.</p>
            </Section>

            <Section id="partage" title="4. Avec qui elles sont partagées">
              <p style={{ marginBottom: 14 }}>Nous ne vendons aucune donnée. Elles sont partagées uniquement avec :</p>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>Hetzner, notre hébergeur (Allemagne), pour le stockage technique des données de l'application, sur un serveur que nous administrons directement</li>
                <li>Moteki et Yabetoo, nos prestataires de paiement mobile money, pour le traitement du paiement de votre abonnement et le versement des commissions d'affiliation</li>
                <li>Les administrations congolaises compétentes (CNSS, DGI) lorsque la loi l'exige, via les exports de déclaration générés par nos clients eux-mêmes</li>
              </ul>
            </Section>

            <Section id="conservation" title="5. Combien de temps elles sont conservées">
              <p>Les données de compte sont conservées tant que le compte est actif. Les données de paie et RH sont conservées selon les durées de conservation légales applicables aux documents sociaux et fiscaux en République du Congo, y compris après la fin de la relation contractuelle si la loi l'exige. Vous pouvez demander la suppression des données qui ne sont plus soumises à une obligation légale de conservation.</p>
            </Section>

            <Section id="securite" title="6. Comment elles sont sécurisées">
              <p>Connexions chiffrées (HTTPS), mots de passe stockés de façon chiffrée, authentification par cookies sécurisés (HttpOnly), accès aux données restreint par rôle au sein de chaque entreprise cliente. Aucun système n'est infaillible à 100 % ; en cas d'incident de sécurité affectant vos données, nous vous informerons dans les meilleurs délais.</p>
            </Section>

            <Section id="cookies" title="7. Cookies et traceurs">
              <p>Nous utilisons uniquement des cookies techniques nécessaires au fonctionnement du service (maintien de la connexion) et un identifiant anonyme local pour éviter les votes multiples sur le blog. Nous n'utilisons aucun cookie publicitaire ni traceur tiers à des fins de marketing.</p>
            </Section>

            <Section id="droits" title="8. Vos droits">
              <p style={{ marginBottom: 14 }}>Vous pouvez demander à tout moment :</p>
              <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                <li>L'accès aux données que nous détenons vous concernant</li>
                <li>La correction de données inexactes</li>
                <li>La suppression de vos données, sous réserve des obligations légales de conservation</li>
              </ul>
              <p>Si vous êtes un employé et que vos données sont gérées par votre employeur via Konza RH, adressez votre demande en priorité à votre employeur, qui reste responsable de ces données ; nous pouvons également vous orienter.</p>
            </Section>

            <Section id="contact" title="9. Nous contacter">
              <p>Pour toute question sur cette politique ou pour exercer vos droits : <a href="mailto:contact@konza-rh.cg" style={{ color: C.accent }}>contact@konza-rh.cg</a> ou <a href="tel:+242064133693" style={{ color: C.accent }}>+242 06 413 36 93</a>.</p>
            </Section>
          </div>
        </div>
      </section>

      <Footer />
      <style>{`
        @media(max-width:768px){ .privacy-layout{grid-template-columns:1fr!important} .privacy-toc{display:none!important} }
      `}</style>
    </div>
  );
}