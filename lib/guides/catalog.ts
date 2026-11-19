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
];
export const guideById = (id: string) => GUIDES.find((g) => g.id === id);
export const guidePath = (path: string) =>
  path.replace(/^\/pme\/[^/]+(?=\/|$)/, "") || "/";
export const routeMatches = (step: GuideStep, path: string) =>
  step.route === "*" || guidePath(path) === step.route;
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
