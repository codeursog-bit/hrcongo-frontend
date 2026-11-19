// lib/shell/page-index.ts
// Index des pages de l'espace entreprise, utilisé par la recherche (Ctrl/⌘ + K)
// et par le fil d'Ariane de la topbar. Lecture seule : aucune route n'est créée ici.
// Les résultats affichés sont filtrés par rôle (canAccessPath) ET par la présence
// du module correspondant dans le menu latéral de la personne connectée.

export interface ShellPage {
  /** Libellé complet, utilisé par la recherche. */
  label: string;
  /** Libellé court pour le fil d'Ariane (absent = page d'accueil du module). */
  short?: string;
  /** Chemin de la page, sans préfixe d'entreprise. */
  path: string;
  /** Racine du module, qui doit exister dans le menu de la personne. */
  module: string;
  /** Nom du module (regroupement dans les résultats). */
  group: string;
  /** Mots supplémentaires qui permettent de retrouver la page. */
  keywords?: string;
  /** Pages de compte : toujours proposées (sous réserve des droits d'accès). */
  always?: boolean;
}

const P = (group: string, module: string, path: string, label: string, short?: string, keywords?: string, always?: boolean): ShellPage =>
  ({ group, module, path, label, short, keywords, always });

export const SHELL_PAGES: ShellPage[] = [
  P('Tableau de bord', '/dashboard', '/dashboard', 'Tableau de bord', undefined, 'accueil pilotage rh ma journee'),
  P('Messages', '/messages', '/messages', 'Messages', undefined, 'messagerie discussion chat'),
  P('Demandes', '/demandes', '/demandes', 'Demandes', undefined, 'demandes en attente a traiter validation'),

  P('Employés', '/employes', '/employes', 'Employés', undefined, 'salaries personnel agents effectif liste'),
  P('Employés', '/employes', '/employes/nouveau', 'Ajouter un employé', 'Nouvel employé', 'creer nouveau embauche'),
  P('Employés', '/employes', '/employes/import', 'Importer des employés', 'Import', 'excel csv fichier'),

  P('Paie', '/paie', '/paie', 'Paie et salaires', undefined, 'bulletins salaires'),
  P('Paie', '/paie', '/paie/nouveau', 'Nouvelle paie', 'Nouvelle paie', 'creer bulletin'),
  P('Paie', '/paie', '/paie/masse', 'Paie en masse', 'Paie en masse', 'tous les employes lot'),
  P('Paie', '/paie', '/paie/manuel', 'Paie manuelle', 'Paie manuelle'),
  P('Paie', '/paie', '/paie/impayes', 'Salaires impayés', 'Impayés', 'arrieres dettes'),
  P('Paie', '/paie', '/paie/simulateur', 'Simulateur de paie', 'Simulateur', 'calcul net brut'),
  P('Paie', '/paie', '/paie/comptabilite', 'Comptabilité de la paie', 'Comptabilité', 'ecritures export sage'),
  P('Paie', '/paie', '/primes/attribuer', 'Attribuer une prime', 'Primes', 'prime bonus gratification'),

  P('Avances et prêts', '/loans', '/loans', 'Gestion des prêts et avances', undefined, 'pret avance acompte'),
  P('Avances et prêts', '/loans', '/loans/validations', 'Validations des prêts et avances', 'Validations'),
  P('Avances et prêts', '/loans', '/loans/suivi-dettes', 'Suivi des dettes', 'Suivi des dettes', 'remboursement'),
  P('Avances et prêts', '/loans', '/loans/dashboard', 'Tableau de bord des prêts', 'Tableau de bord'),
  P('Avances et prêts', '/loans', '/loans/releve', 'Relevé des prêts', 'Relevé'),
  P('Avances et prêts', '/loans', '/loans/rapport', 'Rapport des prêts', 'Rapport'),
  P('Avances et prêts', '/loans', '/loans/nouveau', 'Nouvelle demande de prêt ou d’avance', 'Nouvelle demande', 'demander pret avance'),
  P('Avances et prêts', '/loans', '/loans/mon-espace', 'Mes prêts et avances', 'Mon espace'),

  P('Congés', '/conges', '/conges', 'Congés', undefined, 'vacances validation'),
  P('Congés', '/conges', '/conges/planning', 'Suivi de congé', 'Suivi'),
  P('Congés', '/conges', '/conges/calendrier', 'Calendrier des congés', 'Calendrier'),
  P('Congés', '/conges', '/conges/soldes', 'Soldes de congés', 'Soldes', 'jours restants'),
  P('Congés', '/conges', '/conges/historique', 'Historique des congés', 'Historique'),
  P('Congés', '/conges', '/conges/diagrammes', 'Diagrammes des congés', 'Diagrammes'),
  P('Congés', '/conges', '/conges/provision', 'Provision pour congés payés', 'Provision'),
  P('Congés', '/conges', '/conges/nouveau', 'Nouvelle demande de congé', 'Nouvelle demande', 'demander conge'),
  P('Congés', '/conges', '/conges/mon-espace', 'Mes congés', 'Mon espace'),
  P('Congés', '/conges', '/conges/programme', 'Programme des départs en congé', 'Programme'),
  P('Congés', '/conges', '/conges/gestion', 'Gestion des congés', 'Gestion'),

  P('Présences', '/presences', '/presences', 'Présences', undefined, 'pointage assiduite'),
  P('Présences', '/presences', '/presences/dashboard', 'Tableau de bord des présences', 'Tableau de bord'),
  P('Présences', '/presences', '/presences/pointage', 'Ma pointeuse', 'Ma pointeuse', 'pointer arrivee depart'),
  P('Présences', '/presences', '/presences/pointage-manuel', 'Pointage manuel', 'Pointage manuel'),
  P('Présences', '/presences', '/presences/shifts', 'Planning des shifts', 'Shifts', 'horaires equipes'),
  P('Présences', '/presences', '/presences/tablettes', 'Tablettes de pointage', 'Tablettes'),
  P('Présences', '/presences', '/presences/ecrans', 'Écrans QR', 'Écrans QR', 'affichage code'),
  P('Présences', '/presences', '/presences/synchronisation', 'Pointeuses connectées', 'Pointeuses', 'synchronisation biometrique'),
  P('Présences', '/presences', '/presences/resume', 'Mon résumé de présence', 'Mon résumé'),

  P('Absences', '/presences', '/presences/absences', 'Gestion des absences', undefined, 'absent absence justification'),
  P('Absences', '/presences', '/presences/absences/suivi', 'Suivi des absences', 'Suivi'),
  P('Absences', '/presences', '/presences/absences/historique', 'Historique des absences', 'Historique'),
  P('Absences', '/presences', '/presences/absences/rapport', 'Rapport des absences', 'Rapport'),
  P('Absences', '/presences', '/presences/absences/nouveau', 'Nouvelle demande d’absence', 'Nouvelle demande', 'declarer absence'),
  P('Absences', '/presences', '/presences/absences/mon-espace', 'Mes absences', 'Mon espace'),

  P('Permissions', '/presences', '/presences/permissions', 'Gestion des permissions', undefined, 'autorisation de sortie ticket'),
  P('Permissions', '/presences', '/presences/permissions/validations', 'Validation des permissions', 'Validations'),
  P('Permissions', '/presences', '/presences/permissions/suivi', 'Suivi des permissions', 'Suivi'),
  P('Permissions', '/presences', '/presences/permissions/historique', 'Historique des permissions', 'Historique'),
  P('Permissions', '/presences', '/presences/permissions/rapport', 'Rapport des permissions', 'Rapport'),
  P('Permissions', '/presences', '/presences/permissions/nouveau', 'Nouveau ticket de permission', 'Nouveau ticket', 'demander permission sortie'),
  P('Permissions', '/presences', '/presences/permissions/mon-espace', 'Mes permissions', 'Mon espace'),

  P('Rapports', '/rapports', '/rapports', 'Rapports', undefined, 'statistiques analyses exports'),
  P('Rapports', '/rapports', '/rapports/complet', 'Rapport complet', 'Rapport complet'),
  P('Rapports', '/rapports', '/rapports/analyse-paie', 'Analyse de la paie et des coûts', 'Paie et coûts'),
  P('Rapports', '/rapports', '/rapports/effectifs', 'Rapport des effectifs', 'Effectifs'),
  P('Rapports', '/rapports', '/rapports/departements', 'Rapport par département', 'Départements'),
  P('Rapports', '/rapports', '/rapports/recap-personnel', 'Récapitulatif du personnel', 'Récap. personnel'),
  P('Rapports', '/rapports', '/rapports/journal-paie', 'Journal de paie', 'Journal de paie', 'ecritures comptable'),
  P('Rapports', '/rapports', '/rapports/mouvements-effectifs', 'Mouvements des effectifs', 'Mouvements', 'entrees sorties'),
  P('Rapports', '/rapports', '/rapports/das-declaration', 'DAS annuelle', 'DAS annuelle', 'declaration annuelle des salaires'),
  P('Rapports', '/rapports', '/rapports/recap-bulletins-annuel', 'Récapitulatif annuel des bulletins', 'Récap. bulletins'),
  P('Rapports', '/rapports', '/rapports/its-bnc', 'ITS et BNC par mois', 'ITS / BNC', 'impot'),
  P('Rapports', '/rapports', '/rapports/indicateurs', 'Indicateurs RH', 'Indicateurs'),
  P('Rapports', '/rapports', '/rapports/analyse-conges', 'Analyse des congés', 'Congés'),
  P('Rapports', '/rapports', '/rapports/absences', 'Rapport des absences (global)', 'Absences'),
  P('Rapports', '/rapports', '/rapports/observatoire-conges', 'Observatoire des congés', 'Observatoire'),
  P('Rapports', '/rapports', '/rapports/comptabilite', 'Export comptable', 'Comptabilité', 'sage compta'),

  P('Performance', '/performance', '/performance', 'Évaluations', undefined, 'performance entretien'),
  P('Performance', '/performance', '/performance/objectifs', 'Objectifs', 'Objectifs'),
  P('Performance', '/performance', '/performance/cycles', 'Campagnes d’évaluation', 'Campagnes', 'cycles'),
  P('Performance', '/performance', '/performance/modeles', 'Grilles d’évaluation', 'Grilles', 'modeles'),
  P('Performance', '/performance', '/performance/competences', 'Compétences', 'Compétences'),
  P('Performance', '/performance', '/performance/carriere', 'Carrière', 'Carrière', 'evolution promotion'),
  P('Performance', '/performance', '/performance/mon-espace', 'Ma performance', 'Ma performance'),

  P('Contrats', '/contrats', '/contrats', 'Contrats', undefined, 'contrat de travail cdi cdd'),
  P('Contrats', '/contrats', '/contrats/generer', 'Générer un contrat', 'Générer', 'creer contrat'),
  P('Contrats', '/contrats', '/contrats/rupture', 'Rupture de contrat', 'Rupture', 'licenciement demission fin'),
  P('Contrats', '/contrats', '/contrats/rupture/pse', 'Rupture économique (PSE)', 'PSE'),

  P('Recrutement', '/recrutement', '/recrutement', 'Recrutement', undefined, 'offres candidats embauche'),
  P('Recrutement', '/recrutement', '/recrutement/entretiens', 'Entretiens', 'Entretiens'),
  P('Recrutement', '/recrutement', '/recrutement/ia/create', 'Créer une offre avec l’IA', 'Offre IA'),
  P('Recrutement', '/recrutement', '/recrutement/manuel/create', 'Créer une offre manuellement', 'Offre manuelle'),
  P('Recrutement', '/recrutement', '/recrutement/ia/candidats', 'Candidats (offres IA)', 'Candidats IA'),
  P('Recrutement', '/recrutement', '/recrutement/manuel/candidats', 'Candidats (offres manuelles)', 'Candidats'),
  P('Recrutement', '/recrutement', '/recrutement/ia/analytics', 'Analyse du recrutement', 'Analyse'),
  P('Recrutement', '/recrutement', '/recrutement/customize-career-page', 'Personnaliser la page carrière', 'Page carrière'),

  P('Documents', '/documents', '/documents', 'Documents administratifs', undefined, 'attestation certificat'),
  P('Documents', '/documents', '/documents/generate', 'Générer un document', 'Générer'),
  P('Documents', '/documents', '/documents/legal', 'Documents légaux', 'Légal'),
  P('CNSS', '/cnss-declaration', '/cnss-declaration', 'Déclaration CNSS', undefined, 'cotisations sociales'),
  P('Formation', '/formation', '/formation', 'Formation', undefined, 'formations competences'),
  P('Matériel', '/materiel', '/materiel', 'Matériel', undefined, 'equipement dotation'),
  P('Finances', '/finances', '/finances', 'Finances', undefined, 'tresorerie depenses'),
  P('Avis', '/avis', '/avis', 'Avis à donner', undefined, 'avis validation circuit'),
  P('Audit', '/audit', '/audit', 'Journal d’audit', undefined, 'historique des actions traces'),
  P('Intégration', '/onboarding', '/onboarding', 'Intégration des nouveaux', undefined, 'onboarding arrivee checklist'),
  P('Mes bulletins', '/ma-paie', '/ma-paie', 'Mes bulletins de paie', undefined, 'ma paie fiche de paie telecharger'),

  P('Paramètres', '/parametres', '/parametres', 'Paramètres', undefined, 'reglages configuration'),
  P('Paramètres', '/parametres', '/parametres/entreprise', 'Paramètres de l’entreprise', 'Entreprise', 'societe logo adresse'),
  P('Paramètres', '/parametres', '/parametres/paie', 'Paramètres de paie', 'Paie', 'cotisations calcul'),
  P('Paramètres', '/parametres', '/parametres/primes', 'Catalogue des primes', 'Primes'),
  P('Paramètres', '/parametres', '/parametres/taxes', 'Taxes et impôts', 'Taxes', 'its tus'),
  P('Paramètres', '/parametres', '/parametres/departements', 'Départements', 'Départements', 'services equipes'),
  P('Paramètres', '/parametres', '/parametres/users', 'Utilisateurs et rôles', 'Utilisateurs', 'comptes acces droits'),
  P('Paramètres', '/parametres', '/parametres/securite', 'Sécurité', 'Sécurité', 'mot de passe double authentification'),
  P('Paramètres', '/parametres', '/parametres/subscription', 'Abonnement', 'Abonnement', 'forfait facturation'),
  P('Paramètres', '/parametres', '/parametres/circuits', 'Circuits de validation', 'Circuits', 'avis workflow'),
  P('Paramètres', '/parametres', '/parametres/bulletin', 'Modèle de bulletin', 'Bulletin', 'personnaliser bulletin facture'),

  P('Mon compte', '/mon-profil', '/mon-profil', 'Mon profil', undefined, 'compte apparence theme mot de passe preferences', true),
  P('Mon compte', '/notifications', '/notifications', 'Notifications', undefined, 'alertes historique', true),
  P('Mon compte', '/ma-signature', '/ma-signature', 'Ma signature', undefined, 'signer parapher', true),
];

const BASE_RE = /^\/(?:pme\/[^/]+|cabinet\/[^/]+\/entreprise\/[^/]+)(?=\/|$)/;

/** Retire le préfixe d'entreprise (/pme/:id, /cabinet/:id/entreprise/:id) d'un chemin. */
export const stripBasePath = (path: string): string => path.replace(BASE_RE, '') || '/';

export interface ShellCrumb { parent: string | null; title: string }

/** Titre et module de la page courante pour le fil d'Ariane (null = page inconnue). */
export function resolveCrumb(pathname: string): ShellCrumb | null {
  const p = (stripBasePath(pathname.split('?')[0]).replace(/\/$/, '') || '/');
  let best: ShellPage | undefined;
  for (const page of SHELL_PAGES) {
    if (p === page.path || p.startsWith(page.path + '/')) {
      if (!best || page.path.length > best.path.length) best = page;
    }
  }
  if (!best) return null;
  return best.short ? { parent: best.group, title: best.short } : { parent: null, title: best.group };
}
