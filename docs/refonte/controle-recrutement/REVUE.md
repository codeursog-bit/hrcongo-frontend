# Recrutement — 18 novembre 2026

## Périmètre

17 routes déjà présentes, ModeSelectionModal et deux composants communs : 20 sources photographiées avant ce lot. Six routes absentes de l’ancien inventaire (dashboard, demandes, pipeline, fiche commune, comparaison, modèles) ont été réinventoriées. Le diff Git a été consulté ; les sources récentes ont été conservées, sans attribution fiable par auteur. Aucun fichier backend n’a été modifié.

## Présentation

Offres avec étapes et actions distinctes ; indicateurs sans pastilles décoratives ; priorités et agenda côte à côte ; colonnes de pipeline défilantes ; dossier candidat séparant contact et suivi ; formulaires navigables par rubriques, informations essentielles avant l’image facultative, publication fixe ; modèles d’e-mails avec aperçu latéral ; aperçu carrière disponible sur mobile. Navigation ModuleNav partagée et sélecteurs communs. Les champs restent montés et la validation native est conservée. Pas de nouvelles règles de candidature, de scoring ni de transition.

## Preuves

`mesures.json` compare les API, effets, états, conditions, variables métier, contraintes, callbacks (dont drag/drop), documents et exports aux empreintes avant modification. `check-recruitment-review.cjs` les vérifie ; `check-recruitment-views.cjs` rend neuf vues avec données fictives et teste filtres, refus des mutations et séparation des rôles en démo. Compilation complète puis ciblée sur les fichiers ajoutés réussie. Cinq pages HTTP et 22 scripts vérifiés ; aucun contrôle visuel par navigateur. Palette des 20 sources : 59 → 0. Les valeurs hex restantes de la page carrière sont ses champs de personnalisation existants, conservés.

Démo : aperçu de lecture uniquement ; aucune publication, IA, embauche, écriture ou communication réelle. Cabinet/super admin et fichiers imprimables restent hors périmètre. Cases [~] jusqu’à la revue visuelle utilisateur.

## Paie et sidebar

72 % est le zoom initial des bulletins, avec ajustement page entière toujours disponible. Commande de réduction alignée sur le logo et à la même hauteur dans les deux états. Le total des retenues de la liste lisait uniquement CNSS + ITS ; il lit maintenant le champ serveur totalDeductions, sans recalcul de taxe. Le libellé devient Retenues salariales, seule normalisation éditoriale autorisée par le garde-fou historique de Paie. Les lignes DEDUCTION et EMPLOYER_COST du serveur alimentent les détails, avec indemnités non imposables et repli sur les montants patronaux fournis. Les totaux du bulletin restent ceux du serveur. Tests : check-payroll-taxes-display.cjs, check-document-reader.cjs et garde-fous Paie/documents. Le calculateur backend lu inclut employeeCustomTaxTotal dans totalDeductions et employerCustomTaxTotal dans totalEmployerCost, selon les taxes applicables/configurées ; il n’a pas été modifié.
