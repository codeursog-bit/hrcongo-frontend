# Konza RH — instructions pour l'agent

## Refonte visuelle (priorité en cours)
Pour tout travail sur l'interface, lis d'abord, dans cet ordre :
1. docs/refonte/REFONTE.md (brief maître : règles, design, gabarits, méthode)
2. docs/refonte/PROGRESS.md (où on en est)
3. les images de docs/refonte/refs/

Reprends à la première étape non terminée de PROGRESS.md.

## Règles à ne jamais oublier
- Seul le visuel change : aucun appel API, hook de données, permission, validation, calcul ni route ne doit être modifié.
- Lis le code existant avant de modifier une page ; ne suppose rien.
- Fichiers complets, prêts à copier-coller.
- Une page à la fois : à la fin, compte rendu + mise à jour de PROGRESS.md, puis attends mon feu vert.
- Ne touche pas aux documents imprimables ni aux exports officiels (bulletins, factures de paie, documents de congé/absence, DGC, CNSS, DAS).
- Toutes les pages de demande (prêt, avance, congé, permission, absence…) suivent le même parcours (REFONTE.md §10 bis).
- Le fond de l'app est le gris-blanc des écrans de téléphone du kit, jamais le beige de l'affiche.

## Langue
Réponds en français, de façon simple et directe.
## Vérifications locales
- Si le serveur utilisateur est actif sur 3000, utiliser `npm run dev:check` pour les vérifications : port 3100 et cache `.next-check` isolé.
- Ne jamais lancer un second `next dev` ou `next build` dans le même dossier `.next` que le serveur actif.
- Pour vérifier le chargement, contrôler les scripts JavaScript référencés par la page en plus de sa réponse HTML 200.
