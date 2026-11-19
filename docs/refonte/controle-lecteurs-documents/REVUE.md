# Lecteurs de documents — 18 novembre 2026

Affichage initial page entière pour les bulletins, largeur automatique pour les autres aperçus, zoom et plein écran. Dix sources intégrées et une modale partagée : détail Paie, Ma paie, trois vues Absences, rapports Présences journalier et hebdomadaire, journal de paie, aperçu des modèles bulletin/facture, émargement Formation. La modale partagée équipe aussi les quatre vues Prêts et les quatre vues Permissions sans changement de leurs appelants. Congés utilisait déjà le lecteur.

Les rapports jusque-là hors écran restent montés une seule fois et consultables via un panneau repliable : mêmes IDs, mêmes données. Les utilitaires d’impression/PDF clonent le document ciblé, pas le lecteur. Les originaux A4, styles, modèles, callbacks, API, effets, états et calculs sont NE PAS TOUCHER et conservés. Aucun fichier de renderer/Printable/export n’a été modifié. Le lecteur isole les documents des styles applicatifs, les commandes disparaissent à l’impression.

Preuves : `mesures.json` conserve les empreintes avant modification sur dix sources. Contrôles : `check-document-readers-review.cjs`, `check-document-reader.cjs`, `check-document-preview-dialog.cjs`, `check-payroll-preview-demo.cjs`, garde-fous Présences/Paie/Congés et TypeScript sans cache. La modale native est vérifiée avec un DOM contrôlé ; le cabinet garde son ancien rendu.

Audit global : palette 12254 → 12253, hex 1648 → 1647. Revue visuelle clair/sombre/mobile et impression comparée à la production toujours attendues ; cases [~]. Pas de besoin back ajouté.
