import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PublicSite, ProductShot, PublicClosing } from '@/components/landing/PublicSite';
import s from '@/components/landing/PublicSite.module.css';
export default function AboutPage() {
  return (
    <PublicSite>
      <section className={[s.container, s.hero].join(' ')}>
        <p className={s.eyebrow}>À propos de Konza RH</p>
        <div className={s.heroGrid}>
          <h1 className={s.title}>
            Pensé à Pointe-Noire.
            <br />
            Construit autour de votre travail.
          </h1>
          <p className={s.intro}>
            Nous développons un outil pour réunir ce qui se retrouve trop souvent dispersé : les
            dossiers du personnel, les présences, la paie et les échanges RH.
          </p>
        </div>
      </section>
      <div className={s.container}>
        <ProductShot
          name="L’espace de travail Konza RH"
          src="/images/produit/dashboard-fourni.png"
          description="Le tableau de bord de l’application Konza RH, conçue à Pointe-Noire."
          priority
        />
      </div>
      <section className={[s.container, s.section, s.editorial].join(' ')}>
        <div>
          <p className={s.eyebrow}>Notre point de départ</p>
          <h2 className={s.sectionTitle}>Les RH ne s’arrêtent pas au bulletin.</h2>
        </div>
        <div className={s.copy} style={{ marginTop: 0 }}>
          <p>
            Un changement de contrat, une absence, une prime ou un congé : chaque information compte
            dans le suivi d’une équipe. Quand elle circule entre plusieurs fichiers, elle devient
            difficile à retrouver et à vérifier.
          </p>
          <p>
            Konza RH rapproche ces étapes dans un même espace, avec les paramètres de paie et les
            documents utilisés par les entreprises congolaises.
          </p>
          <p>
            Le projet est porté par Nathan Bondoma Sogoya, fondateur et développeur basé à
            Pointe-Noire. L’interface et les parcours évoluent à partir des besoins rencontrés dans
            la gestion quotidienne.
          </p>
        </div>
      </section>
      <section className={[s.rule, s.section].join(' ')}>
        <div className={[s.container, s.editorial].join(' ')}>
          <div>
            <p className={s.eyebrow}>Notre façon de construire</p>
            <h2 className={s.sectionTitle}>
              Le concret
              <br />
              avant les promesses.
            </h2>
          </div>
          <div>
            {[
              [
                'Une information lisible',
                'Un montant doit pouvoir se comprendre. Un statut doit aider à décider. Nous privilégions des écrans qui montrent les informations utiles, au bon endroit.',
              ],
              [
                'Un contexte local',
                'FCFA, paramètres fiscaux, cotisations, documents et organisation des équipes : le produit est pensé autour du travail des entreprises au Congo.',
              ],
              [
                'Un outil qui suit votre organisation',
                'Les employés, les managers, les RH et les cabinets ont des besoins différents. Leurs espaces et leurs accès sont adaptés à leur rôle.',
              ],
              [
                'Un échange direct',
                'Une difficulté, une question ou une suggestion ? Vous pouvez écrire à Support Konza depuis votre espace ou nous contacter avant de vous lancer.',
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
      <section className={[s.container, s.section, s.editorial].join(' ')}>
        <p className={s.eyebrow}>L’équipe à vos côtés</p>
        <div>
          <h2 className={s.sectionTitle}>
            Parlons de vos habitudes.
            <br />
            Puis regardons le produit.
          </h2>
          <p className={s.copy}>
            Une démonstration permet de parcourir vos cas concrets : constituer un dossier, suivre
            une présence ou préparer une paie. C’est aussi le moment de parler de la reprise de vos
            données et de la prise en main.
          </p>
          <Link href="/contact" className={s.textLink}>
            Échanger avec l’équipe <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <PublicClosing />
    </PublicSite>
  );
}
