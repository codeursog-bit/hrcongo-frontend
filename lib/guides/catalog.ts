export type GuideFeature =
  | "hasPayrollIndividual"
  | "hasPayrollBulk"
  | "hasRecruitmentManual"
  | "hasRecruitmentAI"
  | "hasEmployeeImportExcel";
export interface GuideStep {
  id: string;
  target: string;
  route: string;
  text: string;
  waitFor: "click" | "continue";
  next?: string;
  choices?: Record<string, string>;
  prerequisite?: string;
  /** Sous-pages que la personne peut ouvrir pendant cette étape sans quitter le parcours. */
  detour?: string[];
  detourText?: string;
  feature?: GuideFeature;
  info?: { label: string; text: string }[];
}
export interface Guide {
  id: string;
  title: string;
  description: string;
  keywords: string[];
  roles: string[];
  features?: GuideFeature[];
  steps: GuideStep[];
}
const roles = ["ADMIN", "HR_MANAGER"];
export const GUIDES: Guide[] = [
  {
    id: "payroll-create",
    title: "Faire la paie",
    description: "Repérer les trois parcours et préparer un bulletin.",
    keywords: ["paie", "bulletin", "salaire", "masse", "manuelle"],
    roles,
    features: ["hasPayrollIndividual", "hasPayrollBulk"],
    steps: [
      {
        id: "menu",
        target: '[data-guide="menu-paie"]',
        route: "*",
        text: "Ouvrez Paie & Salaires dans le menu.",
        waitFor: "click",
        next: "modes",
      },
      {
        id: "modes",
        target: '[data-guide="paie-modes"]',
        route: "/paie",
        text: "Choisissez le parcours adapté à votre besoin.",
        waitFor: "click",
        choices: {
          "paie-individuelle": "individual",
          "paie-masse": "bulk",
          "paie-manuelle": "manual",
        },
        info: [
          {
            label: "Individuelle",
            text: "Un employé, avec ses éléments de paie et un aperçu.",
          },
          {
            label: "En masse",
            text: "Une période, puis les employés à inclure et une vérification avant lancement.",
          },
          {
            label: "Manuelle",
            text: "Saisie détaillée pour un cas particulier, avec simulation avant confirmation.",
          },
        ],
      },
      {
        id: "individual",
        target: '[data-guide="paie-individual-workspace"]',
        route: "/paie/nouveau",
        text: "Sélectionnez l’employé, renseignez la période et vérifiez les éléments et l’aperçu. Le bouton de création reste sous votre contrôle : le guide ne génère aucun bulletin.",
        waitFor: "continue",
        feature: "hasPayrollIndividual",
      },
      {
        id: "bulk",
        target: '[data-guide="paie-bulk-workspace"]',
        route: "/paie/masse",
        text: "Commencez par la période, puis choisissez les employés. Vérifiez les estimations avant de lancer le traitement. Le guide vous laisse poursuivre et ne déclenche aucune génération.",
        waitFor: "continue",
        feature: "hasPayrollBulk",
      },
      {
        id: "manual",
        target: '[data-guide="paie-manual-workspace"]',
        route: "/paie/manuel",
        text: "Choisissez l’employé et la période, renseignez les rubriques puis contrôlez la simulation. Vous décidez de confirmer la création après vérification.",
        waitFor: "continue",
        feature: "hasPayrollIndividual",
      },
    ],
  },
  {
    id: "recruitment-create",
    title: "Créer une offre de recrutement",
    description: "Choisir le mode, puis retrouver le formulaire de l’offre.",
    keywords: ["offre", "recruter", "recrutement", "emploi", "ia"],
    roles,
    features: ["hasRecruitmentManual", "hasRecruitmentAI"],
    steps: [
      {
        id: "menu",
        target: '[data-guide="menu-recrutement"]',
        route: "*",
        text: "Ouvrez Recrutement dans le menu.",
        waitFor: "click",
        next: "create",
      },
      {
        id: "create",
        target: '[data-guide="recrutement-create"]',
        route: "/recrutement",
        text: "Cliquez sur Nouvelle offre pour choisir le mode de traitement.",
        waitFor: "click",
        next: "modes",
      },
      {
        id: "modes",
        target: '[data-guide="recrutement-modes"]',
        route: "/recrutement",
        prerequisite: '[data-guide="recrutement-create"]',
        text: "Choisissez le mode de votre campagne. Le guide n’appelle aucun service IA ; le mode IA de recrutement reste une fonction distincte.",
        waitFor: "click",
        choices: { "recrutement-ia": "ai", "recrutement-manuel": "manual" },
        info: [
          {
            label: "Manuel",
            text: "Vous préparez l’offre et gardez la main sur les évaluations.",
          },
          {
            label: "IA",
            text: "Parcours de recrutement assisté, selon votre abonnement.",
          },
        ],
      },
      {
        id: "manual",
        target: '[data-guide="recrutement-manual-form"]',
        route: "/recrutement/manuel/create",
        feature: "hasRecruitmentManual",
        text: "Renseignez le poste et les conditions, puis vérifiez la publication et la visibilité. Relisez votre offre avant de la soumettre ; le guide n’enregistre rien.",
        waitFor: "continue",
      },
      {
        id: "ai",
        target: '[data-guide="recrutement-ai-form"]',
        route: "/recrutement/ia/create",
        feature: "hasRecruitmentAI",
        text: "Renseignez le poste, les critères et les questions d’évaluation. Vérifiez les paramètres avant de soumettre. Aucune création ni génération IA n’est lancée par le guide.",
        waitFor: "continue",
      },
    ],
  },
  {
    id: "employee-create",
    title: "Ajouter un employé",
    description: "Créer un dossier ou préparer un import Excel.",
    keywords: ["employé", "salarié", "dossier", "ajouter", "import", "excel"],
    roles,
    steps: [
      {
        id: "menu",
        target: '[data-guide="menu-employes"]',
        route: "*",
        text: "Ouvrez Gestion Employés dans le menu.",
        waitFor: "click",
        next: "create",
      },
      {
        id: "create",
        target: '[data-guide="employes-create"]',
        route: "/employes",
        text: "Cliquez sur Ajouter un employé pour choisir le parcours.",
        waitFor: "click",
        next: "method",
      },
      {
        id: "method",
        target: '[data-guide="employes-methods"]',
        route: "/employes/nouveau",
        text: "Choisissez un dossier individuel ou un import de plusieurs employés.",
        waitFor: "click",
        choices: { "employes-formulaire": "form", "employes-import": "import" },
        info: [
          {
            label: "Créer un dossier",
            text: "Un parcours guidé, avec vérification finale.",
          },
          {
            label: "Importer une équipe",
            text: "Un fichier Excel, une correspondance de colonnes et une vérification avant import.",
          },
        ],
      },
      {
        id: "form",
        target: '[data-guide="employes-form-workspace"]',
        route: "/employes/nouveau/formulaire",
        text: "Suivez le parcours en haut du formulaire : identité, famille, contrat, compléments et vérification. Les champs obligatoires sont signalés. Vous confirmez la création après relecture.",
        waitFor: "continue",
      },
      {
        id: "import",
        target: '[data-guide="employes-import-workspace"]',
        route: "/employes/import",
        feature: "hasEmployeeImportExcel",
        text: "Utilisez le modèle proposé ou votre fichier Excel. Associez les colonnes et corrigez les lignes signalées avant de lancer l’import. Le guide ne choisit ni ne transmet de fichier.",
        waitFor: "continue",
      },
    ],
  },
  {
    id: "getting-started",
    title: "Premiers pas dans Konza",
    description:
      "Configurer votre entreprise, ajouter vos employés et préparer un premier bulletin.",
    keywords: ["commencer", "démarrer", "premiers pas", "configurer", "configuration", "parcours", "débuter"],
    roles,
    steps: [
      {
        id: "menu",
        target: '[data-guide="menu-parametres"]',
        route: "*",
        text: "Ouvrez Paramètres dans le menu.",
        waitFor: "click",
        next: "company",
      },
      {
        id: "company",
        target: '[data-guide="parametres-entreprise"]',
        route: "/parametres",
        text: "Les informations de votre entreprise sont déjà renseignées à votre inscription. Vous pouvez les vérifier ou les modifier ici à tout moment.",
        detour: ["/parametres/entreprise"],
        detourText: "Vérifiez ou modifiez les informations de votre entreprise. Dès que vous enregistrez, le guide passe aux primes. Vous pouvez aussi continuer sans modifier.",
        waitFor: "continue",
        next: "primes-hub",
      },
      {
        id: "primes-hub",
        target: '[data-guide="parametres-primes"]',
        route: "/parametres",
        text: "Ouvrez le Catalogue des primes : c’est là que vous créez les primes et indemnités que vous attribuerez à vos employés.",
        waitFor: "click",
        next: "primes",
      },
      {
        id: "primes",
        target: '[data-guide="primes-new"]',
        route: "/parametres/primes",
        text: "Avec « Nouvelle prime », créez chaque prime : son nom, sa nature fiscale (imposable avec CNSS, imposable seulement ou indemnité nette), son mode de calcul et sa fréquence. Le guide n’enregistre rien.",
        waitFor: "continue",
        next: "taxes-hub",
      },
      {
        id: "taxes-hub",
        target: '[data-guide="parametres-taxes"]',
        route: "/parametres",
        text: "Passez ensuite aux Cotisations & Taxes.",
        waitFor: "click",
        next: "taxes",
      },
      {
        id: "taxes",
        target: '[data-guide="taxes-new"]',
        route: "/parametres/taxes",
        text: "Les taxes légales sont déjà gérées. Avec « Nouvelle taxe », ajoutez celles propres à votre entreprise, par exemple la CAMU ou une taxe régionale : base de calcul, taux, contrats concernés et, pour une taxe ponctuelle, le mois et l’année.",
        waitFor: "continue",
        next: "employees-menu",
      },
      {
        id: "employees-menu",
        target: '[data-guide="menu-employes"]',
        route: "*",
        text: "Ouvrez Gestion Employés dans le menu.",
        waitFor: "click",
        next: "employees-create",
      },
      {
        id: "employees-create",
        target: '[data-guide="employes-create"]',
        route: "/employes",
        text: "Cliquez sur Ajouter un employé pour choisir le parcours.",
        waitFor: "click",
        next: "employees-method",
      },
      {
        id: "employees-method",
        target: '[data-guide="employes-methods"]',
        route: "/employes/nouveau",
        text: "Créez un dossier individuel ou importez plusieurs employés d’un coup.",
        waitFor: "click",
        choices: {
          "employes-formulaire": "employees-form",
          "employes-import": "employees-import",
        },
        info: [
          { label: "Créer un dossier", text: "Un parcours guidé, avec vérification finale." },
          { label: "Importer une équipe", text: "Un fichier Excel, une correspondance de colonnes et une vérification avant import." },
        ],
      },
      {
        id: "employees-form",
        target: '[data-guide="employes-form-workspace"]',
        route: "/employes/nouveau/formulaire",
        text: "Suivez le parcours en haut du formulaire : identité, famille, contrat, compléments et vérification. Vous confirmez la création après relecture.",
        detour: ["/employes", "/employes/*"],
        detourText: "Une fois votre employé créé, cliquez sur Continuer : le guide passe à l’attribution des primes.",
        waitFor: "continue",
        next: "bonuses",
      },
      {
        id: "employees-import",
        target: '[data-guide="employes-import-workspace"]',
        route: "/employes/import",
        feature: "hasEmployeeImportExcel",
        text: "Utilisez le modèle proposé ou votre fichier Excel, associez les colonnes et corrigez les lignes signalées avant de lancer l’import.",
        detour: ["/employes", "/employes/*"],
        detourText: "Une fois l’import terminé, cliquez sur Continuer : le guide passe à l’attribution des primes.",
        waitFor: "continue",
        next: "bonuses",
      },
      {
        id: "bonuses",
        target: '[data-guide="primes-workspace"]',
        route: "/primes/attribuer",
        text: "Attribuez maintenant leurs primes aux employés : choisissez un employé, puis « Attribuer une prime ». Si vos primes figuraient déjà dans votre fichier d’import, vous pouvez passer cette étape.",
        detour: ["/primes", "/primes/*", "/employes/*"],
        detourText: "Quand vous avez fini d’attribuer les primes, cliquez sur Continuer pour passer au premier bulletin.",
        waitFor: "continue",
        next: "payroll",
      },
      {
        id: "payroll",
        target: '[data-guide="paie-individual-workspace"]',
        route: "/paie/nouveau",
        text: "Dernier pas : créez un premier bulletin pour tester. Choisissez l’employé et la période, vérifiez les gains et les retenues. Le guide ne génère aucun bulletin.",
        detour: ["/paie", "/paie/*"],
        detourText: "Une fois votre bulletin créé, cliquez sur Continuer pour terminer le guide.",
        waitFor: "continue",
      },
    ],
  },
  {
    id: "contract-generate",
    title: "Générer un contrat",
    description: "Choisir un modèle, sélectionner l’employé et produire le contrat en PDF.",
    keywords: ["contrat", "contrats", "générer", "generer", "modèle", "modele", "cdi", "cdd", "stage", "prestation"],
    roles,
    steps: [
      {
        id: "menu-other",
        target: '[data-guide="menu-autre"]',
        route: "*",
        text: "Ouvrez la section Autre du menu.",
        waitFor: "click",
        next: "menu",
      },
      {
        id: "menu",
        target: '[data-guide="menu-contrats"]',
        route: "*",
        text: "Cliquez sur Contrats.",
        waitFor: "click",
        next: "generate",
      },
      {
        id: "generate",
        target: '[data-guide="contrats-generate"]',
        route: "/contrats",
        text: "Cliquez sur « Générer un contrat ». Pas encore de modèle ? « Modèles » permet de copier une base proposée par Konza RH ou d’importer le vôtre.",
        waitFor: "click",
        next: "model",
      },
      {
        id: "model",
        target: '[data-guide="contrat-model"]',
        route: "/contrats/modeles/generer",
        text: "1. Choisissez le modèle de contrat à utiliser (CDI, CDD, essai, stage, prestation…).",
        waitFor: "continue",
        next: "employee",
      },
      {
        id: "employee",
        target: '[data-guide="contrat-employee"]',
        route: "/contrats/modeles/generer",
        text: "2. Recherchez puis sélectionnez l’employé. Les informations se remplissent toutes seules depuis sa fiche et celle de l’entreprise.",
        waitFor: "continue",
        next: "submit",
      },
      {
        id: "submit",
        target: '[data-guide="contrat-submit"]',
        route: "/contrats/modeles/generer",
        text: "Vérifiez les champs affichés : ceux qui manquent doivent être complétés, sinon le bouton reste grisé. Puis « Générer le contrat » : l’aperçu PDF s’affiche et « Un autre » permet d’en préparer un nouveau.",
        waitFor: "continue",
      },
    ],
  },
  {
    id: "contract-manage",
    title: "Gérer les contrats",
    description: "Suivre les contrats, renouveler, confirmer un essai et préparer une rupture.",
    keywords: ["contrat", "contrats", "renouveler", "renouvellement", "essai", "rupture", "licenciement", "démission", "demission", "historique", "avenant"],
    roles,
    steps: [
      {
        id: "menu-other",
        target: '[data-guide="menu-autre"]',
        route: "*",
        text: "Ouvrez la section Autre du menu.",
        waitFor: "click",
        next: "menu",
      },
      {
        id: "menu",
        target: '[data-guide="menu-contrats"]',
        route: "*",
        text: "Cliquez sur Contrats.",
        waitFor: "click",
        next: "tabs",
      },
      {
        id: "tabs",
        target: '[data-guide="contrats-tabs"]',
        route: "/contrats",
        text: "Les onglets classent vos contrats : Actifs, Expirant bientôt, Périodes d’essai (où l’on peut confirmer ou rompre un essai), BNC pour les consultants et prestataires, et Terminés.",
        waitFor: "continue",
        next: "search",
      },
      {
        id: "search",
        target: '[data-guide="contrats-search"]',
        route: "/contrats",
        text: "Recherchez un contrat par nom, matricule ou poste.",
        waitFor: "continue",
        next: "actions",
      },
      {
        id: "actions",
        target: '[data-guide="contrats-actions"]',
        route: "/contrats",
        text: "Sur chaque ligne : « Renouveler » (pour un CDD, « Renouveler / CDI » ouvre l’historique du contrat avec les contrôles légaux), « Historique » (traçabilité, avenants, exports PDF et Word) et la flèche pour ouvrir le dossier.",
        waitFor: "continue",
        next: "rupture",
      },
      {
        id: "rupture",
        target: '[data-guide="contrats-rupture"]',
        route: "/contrats",
        text: "Pour mettre fin à un contrat, utilisez « Rupture de contrat » : vous choisirez votre convention collective et le motif, et l’application calcule les indemnités. L’historique des ruptures est conservé.",
        waitFor: "continue",
      },
    ],
  },
];
export const guideById = (id: string) => GUIDES.find((g) => g.id === id);
export const guidePath = (path: string) =>
  path.replace(/^\/pme\/[^/]+(?=\/|$)/, "") || "/";
export const routeMatches = (step: GuideStep, path: string) =>
  step.route === "*" || guidePath(path) === step.route;
// Un détour se termine par « /* » pour couvrir toutes les sous-pages (ex. /employes/*).
export const onGuideDetour = (step: GuideStep, path: string) => {
  const current = guidePath(path);
  return !!step.detour?.some((d) =>
    d.endsWith("/*") ? current.startsWith(d.slice(0, -1)) : current === d,
  );
};
export const guideAllowed = (guide: Guide, role: string) =>
  guide.roles.includes(role);
export function guideEntry(guide: Guide, path: string) {
  const route = guidePath(path);
  return (
    [...guide.steps]
      .reverse()
      .find((s) => s.route === route && s.waitFor === "continue")?.id ||
    guide.steps.find((s) => s.route === route)?.id ||
    guide.steps[0].id
  );
}
export function nextGuideStep(step: GuideStep, anchor?: string) {
  return step.choices ? step.choices[anchor || ""] : step.next;
}
export function remainingGuideSteps(
  guide: Guide,
  id: string,
  seen = new Set<string>(),
): number {
  if (seen.has(id)) return 0;
  const step = guide.steps.find((s) => s.id === id);
  if (!step) return 0;
  const next = step.choices
    ? Object.values(step.choices)
    : step.next
      ? [step.next]
      : [];
  return (
    1 +
    Math.max(
      0,
      ...next.map((n) => remainingGuideSteps(guide, n, new Set([...seen, id]))),
    )
  );
}
export const normalizeGuideSearch = (value: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
export function searchGuides(query: string, role: string) {
  const q = normalizeGuideSearch(query);
  return GUIDES.filter(
    (g) =>
      guideAllowed(g, role) &&
      normalizeGuideSearch(
        [g.title, g.description, ...g.keywords].join(" "),
      ).includes(q),
  );
}