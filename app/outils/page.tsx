// ============================================================================
// 📁 app/outils/page.tsx — Hub des outils RH Congo · SEO-first
// ✅ Page référence pour les requêtes "calcul X Congo"
// ✅ Chaque outil = une URL dédiée = une chance de se positionner
// ============================================================================
import type { Metadata } from 'next';
import Link from 'next/link';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://konza-rh.cg';

export const metadata: Metadata = {
  title: 'Outils RH & Paie Congo-Brazzaville 2026 — Calculateurs gratuits',
  description:
    'Calculateurs gratuits pour les entreprises congolaises : ITS 2026, CNSS, CAMU, TUS, heures supplémentaires, cotisations patronales. Conformes au droit congolais.',
  alternates: { canonical: `${SITE_URL}/outils` },
  openGraph: {
    title: 'Outils RH & Paie Congo 2026 — Calculateurs gratuits',
    description: 'ITS, CNSS, CAMU, TUS, heures sup — Tous les calculs RH Congo en un clic.',
    url: `${SITE_URL}/outils`,
    type: 'website',
  },
};

const TOOLS = [
  {
    href: '/simulateur',
    icon: '🧮',
    title: 'Simulateur de paie complet',
    desc: 'Salaire brut → net + coût employeur. ITS, CNSS, TUS, CAMU, heures sup, primes, avances.',
    tags: ['ITS 2026', 'CNSS', 'TUS', 'CAMU'],
    color: 'violet',
    featured: true,
  },
  {
    href: '/outils/calcul-its-congo',
    icon: '📊',
    title: 'Calcul ITS 2026',
    desc: 'Barème progressif officiel : 5 tranches, abattement 20%, quotient familial. Conforme Ordonnance 2025-44.',
    tags: ['ITS 2026', 'Barème', 'Parts fiscales'],
    color: 'indigo',
  },
  {
    href: '/outils/calcul-cnss-congo',
    icon: '🏥',
    title: 'Calcul CNSS Congo',
    desc: 'CNSS salarié (4%) et patronal (pensions 8% + famille 10,03% + AT 2,25%). Plafonds 2026.',
    tags: ['CNSS', 'Cotisations', 'Plafonds'],
    color: 'emerald',
  },
  {
    href: '/outils/calcul-camu-congo',
    icon: '💊',
    title: 'Calcul CAMU',
    desc: 'Assurance maladie universelle : 2,27% salarié + 4,55% employeur. Plafond 600 000 FCFA.',
    tags: ['CAMU', 'Assurance maladie'],
    color: 'rose',
  },
  {
    href: '/outils/calcul-heures-supplementaires-congo',
    icon: '⏰',
    title: 'Calcul heures supplémentaires',
    desc: 'Majorations Décret 78-360 : +10%, +25%, +50%, +100%. Calcul sur taux horaire proratisé.',
    tags: ['HS', 'Majorations', 'Décret 78-360'],
    color: 'orange',
  },
  {
    href: '/outils/calcul-tus-congo',
    icon: '🏦',
    title: 'Calcul TUS Congo',
    desc: 'Taxe Unique sur les Salaires 7,5% : part DGI 2,025% + part CNSS 5,475%.',
    tags: ['TUS', 'DGI', 'Patronal'],
    color: 'amber',
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', badge: 'bg-violet-100 text-violet-700', text: 'text-violet-700 dark:text-violet-300' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', badge: 'bg-indigo-100 text-indigo-700', text: 'text-indigo-700 dark:text-indigo-300' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-700 dark:text-emerald-300' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-800', badge: 'bg-rose-100 text-rose-700', text: 'text-rose-700 dark:text-rose-300' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', badge: 'bg-orange-100 text-orange-700', text: 'text-orange-700 dark:text-orange-300' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-700 dark:text-amber-300' },
};

// JSON-LD ItemList
const toolsJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Outils RH & Paie Congo-Brazzaville',
  description: 'Calculateurs gratuits pour les entreprises congolaises',
  url: `${SITE_URL}/outils`,
  numberOfItems: TOOLS.length,
  itemListElement: TOOLS.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: t.title,
    description: t.desc,
    url: `${SITE_URL}${t.href}`,
  })),
};

export default function OutilsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsJsonLd) }}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Hero */}
        <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-violet-950 text-white">
          <div className="max-w-5xl mx-auto px-4 pt-20 pb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-gray-300 mb-6">
              🇨🇬 Outils RH Congo-Brazzaville 2026
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-3">
              Calculateurs RH & Paie<br />
              <span className="text-violet-400">Congo-Brazzaville</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-xl">
              Tous les outils gratuits pour calculer vos cotisations et impôts congolais.
              Conformes à la législation 2026 : ITS, CNSS, CAMU, TUS, heures supplémentaires.
            </p>
          </div>
        </div>

        {/* Grille outils */}
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOOLS.map((tool) => {
              const c = COLOR_MAP[tool.color];
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group relative flex flex-col p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] hover:shadow-lg
                    ${tool.featured ? `${c.bg} ${c.border}` : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-violet-300'}`}
                >
                  {tool.featured && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 bg-violet-500 text-white rounded-full">
                      Complet
                    </span>
                  )}
                  <span className="text-3xl mb-3">{tool.icon}</span>
                  <h2 className={`font-black text-sm mb-2 ${tool.featured ? c.text : 'text-gray-900 dark:text-white'}`}>
                    {tool.title}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4 flex-1">
                    {tool.desc}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {tool.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tool.featured ? c.badge : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Section SEO textuelle — importante pour Google */}
          <div className="mt-16 prose prose-sm dark:prose-invert max-w-none">
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
              Guide complet de la paie au Congo-Brazzaville 2026
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  title: 'ITS 2026 — L\'essentiel',
                  content: `L'Impôt sur les Traitements et Salaires (ITS) remplace l'IRPP depuis le 1er janvier 2026. Il s'applique sur un barème progressif à 5 tranches après abattement de 20% et annualisation : forfait de 1 200 FCFA jusqu'à 615 000 FCFA, 10% jusqu'à 1 500 000 FCFA, 15% jusqu'à 3 500 000 FCFA, 20% jusqu'à 5 000 000 FCFA et 30% au-delà. Le quotient familial est maintenu.`,
                },
                {
                  title: 'CNSS Congo — Taux 2026',
                  content: `La CNSS (Caisse Nationale de Sécurité Sociale) prélève 4% sur le salaire salarié (plafond 1 200 000 FCFA). L'employeur verse 8% pour les pensions (plafond 1 200 000 FCFA), 10,03% pour les prestations familiales et 2,25% pour les accidents du travail (plafonds 600 000 FCFA).`,
                },
                {
                  title: 'CAMU — Assurance maladie universelle',
                  content: `La CAMU (Caisse d'Assurance Maladie Universelle) est obligatoire depuis 2024. Le taux salarié est de 2,27% et le taux patronal de 4,55%, tous deux plafonnés à 600 000 FCFA de salaire brut. Elle couvre les frais de santé du salarié et de ses ayants droit.`,
                },
                {
                  title: 'TUS — Taxe Unique sur les Salaires',
                  content: `Le TUS (Taxe Unique sur les Salaires) est une charge patronale de 7,5% sur le salaire brut total, répartie entre la DGI (2,025%, versé via eTax) et la CNSS (5,475%, déclaration mensuelle CNSS). Il n'y a pas de plafond d'assiette pour le TUS.`,
                },
              ].map(({ title, content }) => (
                <div key={title} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2">{title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}