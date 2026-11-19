# Composants communs — 18 novembre 2026

Les primitives UI, sélecteurs, loaders et moteurs Theme/Appearance/Query étaient déjà sur les tokens ou sans présentation : conservés. Les cinq interfaces de feedback encore anciennes et le panneau SlideOver sont modernisés. Les pages Messages/Notifications restent inchangées.

`check-feedback-review.cjs` conserve les API, sockets, minuteries, états, permissions, dédoublonnages et fermetures des providers. `check-feedback-ui.cjs` contrôle les piles et les variantes legacy en DOM simulé ; `check-slideover.cjs` vérifie le dialogue, Échap, le clic extérieur et la restitution du focus. Les variantes antérieures sont déplacées dans `legacy-feedback.tsx` exclusivement pour admin/cabinet. Les messages d’événement ne sont pas altérés ; les emojis d’icône sont retirés à l’affichage moderne seulement.

Les toasts et rappels d’un même coin se placent dans une pile commune, avec actions visibles et boutons nommés. Le panneau natif conserve ses props et ses enfants. Animations sobres, succès du design system et mouvement réduit. Les tests ne remplacent pas la revue visuelle clair/sombre/mobile, qui reste attendue.
