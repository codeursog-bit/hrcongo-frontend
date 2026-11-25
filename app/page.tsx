import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PublicSite, ProductShot, PublicClosing } from '@/components/landing/PublicSite';
import s from '@/components/landing/PublicSite.module.css';
export default function HomePage() {
  return (
    <PublicSite>
      <section className={[s.container, s.hero].join(' ')}>
        <p className={s.eyebrow}>Ressources humaines & paie · Congo-Brazzaville</p>
        <div className={s.heroGrid}>
          <h1 className={s.title}>
            Vos équipes.
            <br />
            Votre paie.
            <br />
            Une vue d’ensemble.
          </h1>
          <div>
            <p className={s.intro}>
              Du dossier d’un employé à son bulletin de paie, retrouvez le fil de votre gestion RH.
              Sans passer d’un fichier à l’autre.
            </p>
            <div className={s.heroActions}>
              <Link href="/auth/register" className={s.button}>
                Commencer avec Konza <ArrowRight size={17} />
              </Link>
              <Link href="/contact" className={s.secondary}>
                Voir une démonstration
              </Link>
            </div>
            <p className={s.fine}>Pour les entreprises et les cabinets qui travaillent au Congo.</p>
          </div>
        </div>
      </section>
      <div className={s.container}>
        <ProductShot
          name="Le tableau de bord"
          src="/images/produit/dashboard-fourni.png"
          description="Tableau de bord Konza RH : effectifs, masse salariale, bulletins et prochaines échéances."
          priority
        />
        <nav aria-label="Découvrir les fonctionnalités" className={s.index}>
          {[
            ['01', 'Vos effectifs', '#effectifs'],
            ['02', 'La paie', '#paie'],
            ['03', 'Le quotidien RH', '#quotidien'],
            ['04', 'Votre organisation', '#organisation'],
          ].map(([n, label, href]) => (
            <a href={href} key={n}>
              <span>
                {n} / {label}
              </span>
              <ArrowRight size={15} />
            </a>
          ))}
        </nav>
      </div>
      <section id="fonctionnalites" className={[s.container, s.section].join(' ')}>
        <div id="effectifs" className={s.split}>
          <div>
            <p className={s.eyebrow}>01 / Les effectifs</p>
            <h2 className={s.sectionTitle}>
              Un dossier complet.
              <br />
              Des informations faciles à retrouver.
            </h2>
            <p className={s.copy}>
              Coordonnées, contrat, rémunération, documents et situation administrative : les
              informations d’un employé sont réunies dans son dossier.
            </p>
            <ul className={s.featureList}>
              <li>
                <span>01</span>Consultez vos effectifs en liste ou en grille.
              </li>
              <li>
                <span>02</span>Ajoutez un employé ou importez une équipe.
              </li>
              <li>
                <span>03</span>Repérez les déclarations CNSS à suivre.
              </li>
            </ul>
            <Link href="/docs#employes" className={s.textLink}>
              Le guide des dossiers employés <ArrowRight size={16} />
            </Link>
          </div>
          <ProductShot
            name="Gestion des employés"
            src="/images/produit/employes.webp"
            description="Liste des employés dans Konza RH avec contrat, déclaration CNSS et statut."
          />
        </div>
      </section>
      <section id="paie" className={[s.rule, s.section].join(' ')}>
        <div className={[s.container, s.split].join(' ')}>
          <ProductShot
            name="Un bulletin, dans l’application"
            src="/images/produit/bulletin.webp"
            description="Bulletin de paie de démonstration affiché intégralement dans Konza RH."
            document
          />
          <div>
            <p className={s.eyebrow}>02 / La paie</p>
            <h2 className={s.sectionTitle}>
              Du calcul au bulletin,
              <br />
              gardez une lecture claire.
            </h2>
            <p className={s.copy}>
              Salaire de base, primes, cotisations, retenues et net à payer : consultez les éléments
              de rémunération, contrôlez votre paie puis retrouvez les bulletins de la période.
            </p>
            <ul className={s.featureList}>
              <li>
                <span>01</span>Une lecture du brut, du net et du coût employeur.
              </li>
              <li>
                <span>02</span>Les paramètres fiscaux et sociaux de votre entreprise.
              </li>
              <li>
                <span>03</span>Des documents à prévisualiser avant impression.
              </li>
            </ul>
            <Link href="/docs#paie" className={s.textLink}>
              Comprendre le parcours de paie <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section id="quotidien" className={[s.container, s.section].join(' ')}>
        <div className={s.editorial}>
          <div>
            <p className={s.eyebrow}>03 / Au quotidien</p>
            <h2 className={s.sectionTitle}>
              Moins de recherches.
              <br />
              Plus de suivi.
            </h2>
          </div>
          <div>
            {[
              [
                'Présences et absences',
                'Suivez les pointages et retrouvez les demandes à traiter, avec leur statut.',
              ],
              [
                'Congés et départs',
                'Consultez les demandes, les soldes et la planification des départs.',
              ],
              [
                'Recrutement et parcours',
                'Retrouvez les offres, les candidatures et les dossiers qui avancent.',
              ],
            ].map(([title, text], i) => (
              <div className={s.principle} key={title}>
                <span>0{i + 1}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="organisation" className={[s.rule, s.section].join(' ')}>
        <div className={[s.container, s.editorial].join(' ')}>
          <p className={s.eyebrow}>04 / À votre échelle</p>
          <div>
            <h2 className={s.sectionTitle}>
              Une entreprise ou plusieurs.
              <br />
              Un cadre de travail adapté.
            </h2>
            <p className={s.copy}>
              Un espace pour les équipes RH, les managers et les employés. Un portefeuille pour les
              cabinets qui accompagnent plusieurs entreprises. Choisissez les fonctionnalités et
              l’effectif qui correspondent à votre activité.
            </p>
            <Link href="/tarifs" className={s.textLink}>
              Consulter les plans <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <section className={[s.rule, s.section].join(' ')}>
        <div className={[s.container, s.split].join(' ')}>
          <div className={s.mobileProduct}>
            <ProductShot
              name="La pointeuse sur mobile"
              src="/images/produit/pointeuse-mobile-fournie.png"
              description="Capture de la pointeuse Konza RH sur téléphone : scan QR et position GPS."
            />
          </div>
          <div>
            <p className={s.eyebrow}>Au bureau comme sur le terrain</p>
            <h2 className={s.sectionTitle}>
              Le pointage, aussi
              <br />
              depuis le téléphone.
            </h2>
            <p className={s.copy}>
              Une arrivée, un départ et le suivi de la semaine. Les employés retrouvent leur
              pointeuse dans leur espace, avec le scan QR ou la position GPS selon la configuration
              de l’entreprise.
            </p>
            <Link href="/docs#pointage" className={s.textLink}>
              Voir le guide du pointage <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
      <PublicClosing />
    </PublicSite>
  );
}
