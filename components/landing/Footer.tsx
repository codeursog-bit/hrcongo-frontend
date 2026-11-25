import Link from 'next/link';
import Image from 'next/image';
import s from './PublicSite.module.css';
export function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.container}>
        <div className={s.footerGrid}>
          <div>
            <Link href="/" aria-label="Konza RH — Accueil">
              <Image
                src="/logos/konza_logo_h_color.png"
                alt="Konza RH"
                width={140}
                height={40}
                className={s.logo}
              />
            </Link>
            <p className={s.copy} style={{ maxWidth: 320, fontSize: 14 }}>
              Les dossiers du personnel, les présences et la paie. Un même espace pour votre
              entreprise, conçu à Pointe-Noire.
            </p>
          </div>
          <div>
            <h3>Le produit</h3>
            <ul>
              <li>
                <Link href="/#fonctionnalites">Fonctionnalités</Link>
              </li>
              <li>
                <Link href="/tarifs">Tarifs et abonnements</Link>
              </li>
              <li>
                <Link href="/auth/login">Se connecter</Link>
              </li>
              <li>
                <Link href="/auth/register">Créer un compte</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Ressources</h3>
            <ul>
              <li>
                <Link href="/docs">Documentation</Link>
              </li>
              <li>
                <Link href="/blog">Le journal RH</Link>
              </li>
              <li>
                <Link href="/qui-sommes-nous">À propos de Konza</Link>
              </li>
              <li>
                <Link href="/contact">Contacter l’équipe</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Parlons-en</h3>
            <ul>
              <li>
                <a href="tel:+242064133693">+242 06 413 36 93</a>
              </li>
              <li>
                <a href="mailto:rhkonza@gmail.com">rhkonza@gmail.com</a>
              </li>
              <li>Pointe-Noire, Congo</li>
              <li>
                <Link href="/privacy">Confidentialité</Link>
              </li>
              <li>
                <Link href="/cgu">Conditions d’utilisation</Link>
              </li>
            </ul>
          </div>
        </div>
        <div className={s.footerBottom}>
          <span>© {new Date().getFullYear()} Konza RH</span>
          <span>Conçu au Congo, pour le travail au quotidien.</span>
        </div>
      </div>
    </footer>
  );
}
