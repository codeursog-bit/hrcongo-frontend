# Cahier des charges — Moteur de modèles de documents (Konza RH)

Version 1 — 24/11/2026 · Destinataire : agent de code (Codex / Claude Code) · Demandeur : Nathan (Konza)

> Lire en entier avant de coder. Ce fichier donne les règles et le plan. Les autres fichiers du dossier font foi pour le détail :
> - `skins.json` : styles et variantes des 8 designs de référence (4 documents administratifs + 4 bulletins).
> - `reference-documents.json` : contenu des documents de référence (champs, libellés par défaut, ordre).
> - `references/pdf/` (20 PDF) et `references/word/` (20 .docx) : rendus visuels cibles.
> - `references/existant/bulletin-novembre-2026.pdf` : bulletin actuel de l'application (point de départ visuel).

---

## 1. Objectif

Tout client doit pouvoir, pour chaque type de document RH : choisir un design professionnel, le personnaliser librement (couleurs, logo, blocs déplaçables, libellés, ordre des lignes, tableau étirable), ou partir d'une page vide. Sans changer le back-end ni les calculs, et sans alourdir le serveur.

## 2. Décisions déjà prises (ne pas les remettre en cause)

1. **Un seul moteur de rendu piloté par du JSON** pour tous les documents. Fin de la multiplication des composants : aujourd'hui 4 renderers de bulletin + 4 variantes (Default / Orca / Standard / Modern) × chaque document.
2. **Modèles proposés au client** : (a) Modèle Orca, pour un client spécifique, composants existants inchangés ; (b) Modèle Standard, pour tout le monde, composants existants inchangés ; (c) « Mes modèles » = le nouveau moteur (4 designs de départ A–D, personnalisation, ou page vide). `DEFAULT` et `MODERN` restent dans l'enum et en base, mais sortent du sélecteur.
3. **Les designs A–D sont des « skins » (données), pas des composants.** On ne crée aucun composant par design.
4. **Les documents ont des données figées** (catalogue de champs par type). L'utilisateur ne crée pas de nouvelle donnée : il choisit lesquelles afficher, où, avec quel libellé.
5. **Clé ≠ affichage.** Chaque champ, ligne ou colonne a une clé stable remplie par le back. L'utilisateur ne change que le libellé, l'ordre, la visibilité, la largeur, le style. « Total cotisations » peut s'afficher « Cotisations » sans toucher au back.
6. **Types de documents à couvrir** : bulletin de paie, congé, demande d'absence / permission d'absence, permission de sortie (ticket de sortie), prêt, avance. Ensuite : facture prestataire (forfait et détaillée), lettre d'autorisation de congé, attestation de formation. D'autres types viendront : le moteur doit permettre d'en ajouter en déclarant seulement un catalogue de champs.
7. **Personnalisation** à partir d'un plan à définir ; **« partir de zéro » réservé au plan Entreprise.**
8. **Rendu professionnel, aucun effet « IA »** (voir §8).
9. **Serveur léger** : rendu côté navigateur, JSON minuscule (voir §9).
10. **Éditeur plein écran sans sidebar** et **guide intégré** : une démonstration automatique jouée par le système lui-même (aucune vidéo montée à la main), des étapes « à vous » validées par l'action réelle, et en option des vidéos MP4 générées automatiquement (voir §7).

## 3. État actuel du code (zip `app` + `prisma`)

| Élément | Où | Action |
|---|---|---|
| Config de modèle de bulletin (modes `template` / `canvas`, blocs, style, `footerMessage`) | `types/bulletin-template.ts` (~210 l.) | Conserver. Ajouter un mode `engine`. |
| Blocs canvas + variables | `types/canvas-block.ts` | Réutiliser le vocabulaire de variables et `REQUIRED_VARIABLES`. |
| Éditeur canvas (dnd-kit, ~600 l.) / rendu canvas (~660 l.) | `components/CanvasEditor`, `components/CanvasRenderer` | À refondre (voir §7). |
| 4 renderers de bulletin (~600–850 l. chacun) | `components/BulletinRenderer`, `…Clarifie`, `…Classique`, `…Inf` + dispatcher `BulletinDisplay` | Gelés. Ne rien y ajouter. Retrait progressif (voir §11). |
| Page d'édition du bulletin | `app/(dashboard)/parametres/bulletin/page.tsx` (~835 l.) | Remplacée par la nouvelle page Documents. |
| Impression bulletin | `lib/bulletin-print.ts` (html2canvas + jsPDF, côté navigateur) | À remplacer par l'impression vectorielle (voir §6.4). |
| Modèles de documents (enum `DEFAULT / ORCA / STANDARD / MODERN`) | `lib/document-template.ts`, `components/documents/{orca,standard,modern}/*`, `components/documents/RequestDocuments.tsx` (dispatcher), `components/*Printable.tsx` | Orca et Standard : inchangés. Les autres : voir §11. |
| Factures prestataires | `components/FactureRendererForfait`, `components/FactureRendererDetaillee` | Lot 6. |
| Réglages entreprise | `app/(dashboard)/parametres/entreprise/page.tsx` (sélecteur de modèle ~l.892, pied de page ~l.903) | Lot 0 + Lot 2. |
| Prisma | `model BulletinTemplate` (`config Json`, 1 par entreprise), `enum DocumentTemplate`, `Company.documentTemplate`, `Company.documentFooterText` | Ajouts uniquement (voir §6.5). |

À vérifier par l'agent avant de coder : le dispatcher `RequestDocuments.tsx` (comment `documentTemplate` choisit le composant), le dossier `components/permissions` (champs de la permission de sortie), le layout du dashboard (où la sidebar est montée), le système de plans/abonnements existant.

## 4. Lot 0 — correctifs immédiats (avant tout le reste)

### 4.1 Pied de page : retirer les données d'un client réel
Fichier : `app/(dashboard)/parametres/entreprise/page.tsx`, `<textarea>` « Pied de page des documents » (~l.915). Le `placeholder` contient aujourd'hui les vraies coordonnées de ORCA DECO CONGO (RCCM, NIU, téléphone), visibles par toutes les entreprises clientes. Remplacer par un exemple neutre aux couleurs de la marque :

```
Ex. : KONZA TECH S.A.
Société Anonyme au capital de 10 000 000 FCFA
RCCM CG/XXX/00 B 0000 · NIU : M0000 000000000 · Tél : +242 00 000 00 00
Siège social : Avenue de l’Indépendance, Pointe-Noire
```

Règles : aucun identifiant réel d'un client dans un texte visible par les autres. Faire un `grep -rn "ORCA DECO\|M2014\|14 B 197"` sur tout le projet et corriger toute autre occurrence visible. Le commentaire « ex. Orca » dans `OrcaDocumentShell.tsx` est interne : le reformuler sans nom de client.

### 4.2 Sélecteur de modèle
Même fichier (~l.892) : le menu propose « Modèle par défaut / 1 / 2 / 3 ». Nouveau comportement : « Modèle Standard » toujours visible ; « Modèle Orca » visible seulement si l'entreprise est déjà sur `ORCA` (ou rôle super-admin) ; si la valeur actuelle est `DEFAULT` ou `MODERN`, l'afficher comme « Modèle actuel (ancien) » sans le proposer aux autres. Aucun changement de comportement pour les entreprises existantes tant qu'elles ne changent pas de choix. Ajouter « Mes modèles » au Lot 2.

## 5. Architecture cible

### 5.1 Principes
- **P1** Un document = **spec de contenu** (catalogue de champs du type) + **skin** (tokens + variantes) + **layout du client** (ordre, libellés, visibilité, styles modifiés). Le rendu est une fonction pure de ces trois éléments + les données.
- **P2** Une seule fonction touche les formes de l'API : `buildContext(docType, apiData)` → `{ values, items, company }`. Le moteur de rendu ne connaît pas l'API.
- **P3** Largeurs en pourcentages / `fr`, jamais en pixels fixes : le contenu ne peut pas dépasser son cadre (bug rencontré : un tableau de cumuls plus large que le tableau principal).
- **P4** Les lignes non référencées par le layout (nouvelle rubrique de paie) s'ajoutent automatiquement à la fin du tableau (`autoAppendUnknown`). Aucune donnée ne disparaît silencieusement.
- **P5** Blocs verrouillés non supprimables par type (ex. bulletin : identité du salarié, tableau de paie, net à payer). Réutiliser `REQUIRED_VARIABLES`.
- **P6** Texte seulement : jamais de HTML saisi par l'utilisateur (libellés échappés, longueur ≤ 80 caractères).
- **P7** Polices à liste blanche, **auto-hébergées** : Carlito (≙ Calibri), Caladea (≙ Cambria), Liberation Sans (≙ Arial) — métriques identiques aux PDF de référence, licence libre.
- **P8** Format des nombres : espace insécable comme séparateur de milliers, virgule décimale, `%` précédé d'une espace, chiffres tabulaires alignés à droite.

### 5.2 Types de documents

| `DocType` | Contenu (voir `reference-documents.json`) | Lot |
|---|---|---|
| `PAYSLIP` | Bulletin de paie | 1 |
| `LEAVE` | Congé | 4 |
| `ABSENCE` | Demande / permission d'absence (catalogue conventionnel des motifs et durées) | 4 |
| `EXIT_PERMISSION` | Permission / ticket de sortie (champs à reprendre de `components/permissions`) | 4 |
| `LOAN` | Prêt | 4 |
| `ADVANCE` | Avance sur salaire | 4 |
| `CONTRACTOR_INVOICE` | Facture prestataire (forfait / détaillée) | 6 |
| `LEAVE_AUTHORIZATION` | Lettre d'autorisation de congé | 6 |
| `TRAINING_CERTIFICATE` | Attestation de formation | 6 (optionnel) |

Ajouter un type = déclarer un catalogue `{ key, labelDefaut, kind, requis }` + un adaptateur `buildContext` + un layout par défaut. Aucun composant React nouveau.

### 5.3 Schéma du layout (JSON stocké)

```ts
export type DocType = 'PAYSLIP' | 'LEAVE' | 'ABSENCE' | 'EXIT_PERMISSION' | 'LOAN' | 'ADVANCE'
  | 'CONTRACTOR_INVOICE' | 'LEAVE_AUTHORIZATION' | 'TRAINING_CERTIFICATE';

export interface DocLayout {
  schemaVersion: 2;
  docType: DocType;
  basePreset: string | null;          // 'A_CLASSIQUE' … ; null = créé depuis zéro
  page: { size: 'A4'; orientation: 'portrait' | 'landscape';
          marginsMm: { top: number; right: number; bottom: number; left: number } };
  tokens: {
    fonts: { title: FontId; body: FontId };               // liste blanche
    sizeBasePt: number;                                   // 8 à 11
    colors: { ink: string; muted: string; main: string; accent?: string; line: string;
              headFill?: string; headText?: string; soft?: string };
    lineWidthPt: number;                                  // 0.25 à 1.5
  };
  variants: { header: string; title: string; section: string; field: string;
              table: string; signature: string; footer: string };   // énumérations de skins.json
  logo?: { assetUrl: string; align: 'left' | 'center' | 'right'; widthMm: number; hideNameWhenLogo: boolean };
  blocks: Block[];
  labels: Record<string, string>;     // clé stable → libellé affiché
  footer: { text?: string; showPageNumber: boolean };
}

export interface Block {
  id: string;
  type: BlockType;                    // header | title | meta | fieldGroup | table | cumuls | checklist | textLines
                                      // | declaration | dateSignature | decision | reviewTable | signatures
                                      // | image | freeText | divider | spacer | note
  row: number; col: number; span: number;   // grille de 12 colonnes
  visible: boolean;
  locked?: boolean;
  heightMm?: number | 'auto' | 'fill';
  config: Record<string, unknown>;    // typé par BlockType
}

export interface TableConfig {
  columns: { key: string; widthPct: number; align: 'left' | 'center' | 'right'; visible: boolean }[]; // somme des visibles = 100
  rows: { order: string[]; hidden: string[]; autoAppendUnknown: true };   // clés = code de rubrique
  fill: 'content' | 'page';           // 'page' : le tableau occupe la hauteur restante (comme le bulletin actuel)
  totalsStyle: 'fill' | 'rules';
}
```

Pourquoi une grille de 12 colonnes et pas du positionnement libre : l'utilisateur peut placer deux blocs côte à côte, remonter la signature, étirer le tableau, tout en gardant une impression A4 propre. Le positionnement en pixels casse à l'impression.

### 5.4 Designs de départ
`skins.json` décrit les 8 designs : tokens (couleurs, polices) et variantes de composants à implémenter une seule fois (`wordmark-rules`, `dark-band`, `cartouche-3-cells`, `roman-hairline`, `leader-dots`, `grid-filled-header`, etc.). Les PDF de `references/pdf/` sont la cible visuelle. Les designs sont des fichiers livrés avec l'application (aucune ligne en base tant que le client n'a rien modifié).

### 5.5 Rendu, pagination, impression
- `<DocumentRenderer docType layout data mode="screen|print" />`, composant unique, chargé à la demande.
- Page A4 = conteneur 210 mm × 297 mm ; `@page { size: A4; margin: 0 }` ; marges internes issues de `layout.page`.
- `fill: 'page'` : mise en page en colonne flex, le tableau a `flex: 1` et pousse les cumuls et les signatures en bas.
- Trop de lignes pour une page : réduire la hauteur de ligne jusqu'à 80 %, puis passer à 2 pages avec l'en-tête du tableau répété ; cumuls, net à payer et signatures restent sur la dernière page.
- **Impression vectorielle** (`window.print()` + CSS print, texte sélectionnable, net) comme voie principale. `html2canvas` + jsPDF seulement en repli. Bulletins en masse : voir §9.

### 5.6 Stockage, API, Prisma (ajouts seulement)

```prisma
model DocumentLayout {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId  String   @db.Uuid
  company    Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  docType    String                      // valeur de DocType
  name       String   @default("Mon modèle")
  basePreset String?
  config     Json                        // DocLayout
  version    Int      @default(1)
  createdAt  DateTime @default(now()) @db.Timestamptz
  updatedAt  DateTime @updatedAt @db.Timestamptz

  @@unique([companyId, docType])         // 1 layout par type et par entreprise (V1)
  @@index([companyId])
  @@map("document_layouts")
}
```
- Ajouter `documentLayouts DocumentLayout[]` sur `Company`.
- Ajouter la valeur `CUSTOM` à l'enum `DocumentTemplate` (ajout seulement). `CUSTOM` = « Mes modèles ». Pour un type donné : s'il existe un `DocumentLayout`, utiliser le moteur ; sinon, retomber sur le design par défaut du type.
- Choisir un design de départ = **copie** dans `DocumentLayout` (copy-on-select). Réinitialiser = supprimer la ligne ou recopier le design de base.
- Bulletin : tant que la migration n'est pas faite, `BulletinTemplate.config` reste lu pour les modes `template` / `canvas`. Si un `DocumentLayout` `PAYSLIP` existe, il prend le dessus.
- API (JWT, `companyId` toujours pris du token, jamais du body) : `GET /document-layouts/:docType`, `PUT /document-layouts/:docType` (validation + `version` incrémentée), `DELETE /document-layouts/:docType` (réinitialiser). Validation avec Joi ou class-validator (déjà installés).
- Logo : réutiliser l'upload existant du logo d'entreprise (voir §9 pour les limites).

### 5.7 Plans et droits
- Personnalisation : drapeau de plan `canCustomizeDocuments`.
- Partir de zéro : drapeau `canBuildDocumentsFromScratch` (plan Entreprise).
- Édition réservée aux rôles administrateur / RH, brancher sur les permissions existantes. Tous les autres rôles : lecture / impression seulement.
- Brancher sur le mécanisme de plans existant ; ne pas en créer un second.

## 6. Éditeur — refonte

L'éditeur actuel (liste verticale de blocs) devient un vrai outil de composition, plus simple qu'Excel et Word : l'utilisateur doit obtenir un bulletin propre en quelques clics.

### 6.1 Mode plein écran, sans sidebar
- L'éditeur vit sur une **route dédiée hors du layout dashboard** (groupe de routes `(editor)` avec son propre layout) : pas de sidebar ni de barre d'application, toute la largeur de l'écran. Ex. `/documents/editeur/[docType]`.
- Barre haute fine : `← Retour` · nom du modèle (éditable) · annuler / rétablir · zoom · aperçu · Enregistrer.
- En quittant (Retour, Échap, ou clic sur le logo) : confirmation si des modifications ne sont pas enregistrées ; l'utilisateur revient sur la page d'où il est parti, avec **sa sidebar dans l'état où il l'avait laissée** (ouverte ou réduite).
- Si la structure du layout dashboard impose la sidebar, l'alternative acceptable est un état global `immersive` qui la masque, mais la route dédiée est préférée (aucun risque de sidebar qui réapparaît ou bloque).
- Éditeur réservé à l'écran large (≥ 1024 px). Sur mobile : message clair + aperçu en lecture seule.

### 6.2 Disposition
- **Gauche (repliable)** : palette de blocs disponibles pour ce type de document + structure en arbre (ordre, œil de visibilité, cadenas des blocs verrouillés).
- **Centre** : la page A4 en direct, zoom 50–150 %, repères de marges, avertissement de dépassement.
- **Droite (repliable)** : inspecteur du bloc sélectionné (libellés, colonnes, largeurs, couleurs, polices, filets) ; sans sélection : réglages de la page et du design (couleurs, polices, logo).

### 6.3 Interactions
- Cliquer un bloc le sélectionne ; glisser le déplace (aimantation à la grille, indicateur d'insertion).
- Deux blocs côte à côte en les glissant sur la même rangée ; poignées de bordure pour changer la largeur (`span`).
- Tableau : glisser les lignes pour les réordonner (ex. Camu avant ITS) ; poignée basse pour étirer ; option « Remplir la page » ; largeurs de colonnes par poignée dans l'en-tête ; colonnes masquables.
- Double-clic sur un libellé : renommage en place (stocké dans `labels`, la clé ne change pas). Bouton « rétablir le libellé d'origine ».
- Couleurs : pipette + palette suggérée **extraite du logo** ; contrôle de contraste (alerte sous 4,5:1).
- Logo : import, position, taille libres ; option « masquer le nom quand le logo est présent ».
- Annuler / rétablir (≥ 50 niveaux), raccourcis clavier, déplacement des blocs aux flèches.
- Aperçu avec **données réelles** (un vrai salarié / une vraie demande) ou **données d'exemple**, au choix.
- Brouillon conservé localement ; enregistrement explicite (pas d'envoi à chaque geste).

### 6.4 Garde-fous
- Un bloc verrouillé ne peut pas être supprimé ; un champ requis ne peut pas être masqué.
- Contrôle d'**ajustement à la page** : si le contenu dépasse, afficher un avertissement et proposer « réduire les marges / la taille du texte ».
- Contrôle de largeur : somme des colonnes visibles = 100 %, sinon correction automatique.
- Bouton « Réinitialiser au design de départ ».

### 6.5 Points de départ
Au premier lancement : trois choix clairs. (1) **Un design prêt** (les 4 skins), (2) **Une copie de mon modèle actuel**, (3) **Page vide** (plan Entreprise). La page vide ne contient que les blocs verrouillés du type (identité entreprise, informations employé, tableau, net à payer pour le bulletin).

## 7. Guide intégré : visite guidée, démonstration automatique, vidéos générées

Le besoin : un utilisateur qui n'a jamais conçu de document doit savoir « fais ça, puis ça » sans tutoriel externe et sans que personne ne monte de vidéo. C'est l'application qui guide.

- **Visite guidée en surbrillance** sur l'éditeur réel : le fond est assombri, l'élément à utiliser est mis en lumière, une bulle courte (≤ 20 mots) dit quoi faire. Chaque étape **attend l'action de l'utilisateur** (ex. « Glissez ce bloc vers le haut ») avant de passer à la suivante ; progression visible, bouton « Passer », étape précédente possible.
- **Mini-animations générées par le code** (curseur qui glisse un bloc, double-clic sur un libellé, poignée qui étire le tableau) : composants React avec CSS / SVG, chacun ≤ 3 Ko. Aucun fichier vidéo, aucun montage manuel. Respecter `prefers-reduced-motion` (images fixes à la place).
- Étapes proposées : 1 choisir un point de départ · 2 sélectionner un bloc · 3 le déplacer · 4 renommer un libellé · 5 changer couleurs et police · 6 étirer le tableau / « Remplir la page » · 7 ajouter le logo · 8 prévisualiser avec de vraies données · 9 enregistrer.
- Bouton « ? Aide » toujours visible : relance la visite ou ouvre une étape précise. Petites bulles d'aide à la première survol des poignées et boutons. États vides explicites (« Ajoutez un bloc depuis la liste à gauche »).
- Les textes de la visite sont dans un fichier de données (`tour-steps.ts`) : modifiables sans toucher à la logique. Français uniquement pour l'instant.
- Mémoriser « visite terminée » par utilisateur (localStorage, puis préférence utilisateur en base si elle existe déjà).
- Librairie légère (type driver.js, ~5 Ko gzip) ou implémentation maison ; chargée seulement à la première ouverture de l'éditeur.

### 7.1 Démonstration automatique (aucune vidéo à monter)

Le besoin : l'utilisateur peut regarder « quelqu'un » concevoir un bulletin et le suivre pas à pas, mais ce « quelqu'un » est le système, pas un humain qui monte une vidéo.

- **Source unique** : un fichier de données `tour-steps.ts`. Chaque étape = `{ id, caption, target, action, params, waitFor }` avec `action` ∈ `click | drag | dblclick | type | select`, et `target` = un identifiant `data-tour` posé sur l'élément réel de l'éditeur.
- **Mode « Regarder »** : le système joue lui-même les étapes dans l'éditeur réel. Un faux curseur animé (SVG) se déplace vers la cible, fait l'action en appelant **les mêmes commandes que l'utilisateur** (même store, mêmes actions), avec un sous-titre en bas. Contrôles : lecture / pause / précédent / suivant / vitesse 0,5× à 2×. La démo s'exécute sur un **modèle d'exemple isolé** (rien n'est enregistré, l'état est restauré à la fin).
- **Mode « À vous »** : la même étape attend que l'utilisateur fasse l'action lui-même (visite guidée décrite plus haut). On passe de l'un à l'autre à tout moment.
- **Suivi pendant la conception** : l'utilisateur garde un petit panneau flottant « Étape 3 / 9 » (déplaçable, réductible) à côté de l'éditeur ; il regarde l'étape, la refait sur son propre bulletin, puis passe à la suivante. C'est l'équivalent de « suivre la vidéo pour concevoir son bulletin ».
- **Pourquoi pas un fichier vidéo en premier** : la démo cible les vrais éléments, donc elle reste exacte quand l'interface change ; elle ne pèse rien (pas de MP4 à télécharger) ; les sous-titres sont du texte, donc accessibles et traduisibles.
- **Contrainte de conception de l'éditeur** : chaque geste (déplacer un bloc, renommer un libellé, changer une couleur, étirer le tableau) doit être une **commande nommée** du store, pas seulement un événement souris. C'est aussi ce qui permet annuler / rétablir (§6.3).
- **Test** : chaque étape de `tour-steps.ts` est jouée dans un test de bout à bout (Playwright). Si une cible disparaît ou change, le test échoue : la démo ne peut pas se périmer sans que ça se voie.

### 7.2 Vidéos MP4 générées automatiquement (optionnel, lot 7)

- Le **même script** `tour-steps.ts` est joué par Playwright (navigateur sans interface) sur un compte de démonstration, avec l'enregistrement vidéo activé. Sortie 1280 × 720, 20 à 60 s par chapitre : « Choisir un design », « Déplacer et renommer », « Couleurs et logo », « Étirer le tableau », « Enregistrer ».
- Sous-titres générés à partir des `caption` (fichier `.vtt` ou incrustés). Pas de voix off en V1 ; une synthèse vocale pourra s'ajouter plus tard.
- Régénération **automatique** à chaque release de l'éditeur (tâche CI), pour qu'aucune vidéo ne soit en retard sur l'interface.
- Hébergement : fichiers statiques sur le stockage existant (Cloudinary est déjà utilisé), lecture avec `preload="none"` et une image d'aperçu, ≤ 3 Mo par chapitre. Aucun traitement serveur au moment de la lecture.
- Usage : centre d'aide, lien partageable, e-mail d'accueil. N'envisager Remotion ou un outil HTML → vidéo que si le rendu Playwright ne suffit pas.

## 8. Qualité visuelle — « pas d'effet IA »

Règles pour tous les documents imprimables :
- Aucun dégradé, ombre portée, effet verre, coins très arrondis, émoji ni icône décorative.
- Filets fins (0,25 à 1,5 pt), alignements sur une grille, marges régulières.
- 2 polices maximum, 1 couleur principale + 1 accent au plus ; lisible en noir et blanc.
- Libellés en petites capitales espacées, valeurs en gras sobre ; nombres alignés à droite en chiffres tabulaires.
- Taille de texte minimale à l'impression : 7 pt.
- Reproduire fidèlement `references/pdf/` : c'est la barre de qualité. Les designs doivent ressembler à des documents d'une grande entreprise, pas à une interface web imprimée.

Tests de régression visuelle : pour chaque design × type, rendre avec les données d'exemple de `reference-documents.json` à 794 × 1123 px (A4 à 96 dpi) et comparer au PDF de référence (tolérance à définir). Tests automatiques : aucun débordement horizontal (`scrollWidth ≤ clientWidth` pour chaque bloc), somme des colonnes = 100 %, texte ≥ 7 pt.

## 9. Performance (budgets)

Cible : 10 entreprises qui conçoivent chacune leurs modèles ne doivent pas se voir sur la charge du serveur.

- **Rendu 100 % côté navigateur.** Le serveur ne stocke et ne renvoie qu'un petit JSON. Aucun PDF fabriqué côté serveur pour un document unique.
- JSON de layout : ≤ 40 Ko (≈ 6 Ko gzip), ≤ 60 blocs, libellés ≤ 80 caractères ; refus côté serveur au-delà.
- `GET` du layout : cache mémoire serveur 5 min (LRU ~500 entrées) + `ETag` ; une requête par ouverture de page.
- `PUT` : enregistrement explicite, 1 par seconde maximum côté client, `@nestjs/throttler` ~20/min par entreprise.
- Logo : redimensionné côté client (≤ 600 px de large), ≤ 300 Ko, PNG / JPEG / WebP. **Pas de SVG** (risque de script) sauf assainissement.
- Éditeur, visite guidée et démonstration chargés par `dynamic import` ; la démo automatique ne télécharge aucun fichier vidéo ; les MP4 (lot 7) sont des fichiers statiques chargés seulement à la lecture ; `dnd-kit` n'est chargé que sur les pages d'édition.
- Rendu d'un bulletin ≤ 100 ms sur un PC moyen. Mémoïser par (id de paie, version du layout).
- **Bulletins en masse** (paie du mois, plusieurs dizaines de PDF) : lot côté navigateur, un document à la fois dans un iframe caché, fusion avec `pdf-lib`, barre de progression. Si un traitement serveur devient nécessaire plus tard : file d'attente avec 1 à 2 tâches parallèles, par entreprise, avec cache par (id de paie, version du layout). Ne pas dupliquer le renderer en `@react-pdf/renderer`.
- Estimation : 10 entreprises × 1 layout par type × 40 Ko ≈ quelques Mo en base, sans charge CPU serveur.

## 10. Sécurité et multi-entreprise

- `companyId` toujours issu du JWT. Jamais du corps de la requête.
- Validation stricte du JSON (schéma, longueurs, listes blanches de polices et de variantes, couleurs hex).
- Aucun HTML saisi par l'utilisateur ; échapper tous les libellés.
- Rôles : édition réservée aux administrateurs / RH.
- Ne jamais exposer à une entreprise des données d'une autre (voir Lot 0 : fuite des coordonnées d'Orca).

## 11. Migration et dépréciation

1. Aucune donnée existante n'est modifiée. Toutes les entreprises gardent leur rendu actuel jusqu'à ce qu'elles choisissent « Mes modèles ».
2. `ORCA` et `STANDARD` : composants conservés tels quels.
3. `DEFAULT` et `MODERN` : cachés du sélecteur, comportement inchangé pour qui les utilise déjà.
4. Bulletin : les 4 renderers actuels sont **gelés** (corrections de bugs seulement). Les 4 nouveaux designs du moteur les remplacent dans le choix proposé aux nouveaux clients. Les entreprises encore sur un ancien renderer restent servies. Suppression du code des anciens renderers seulement après : parité visuelle validée, période de transition, plus aucune entreprise en mode `template` / `canvas`.
5. Un convertisseur optionnel (ancien `BulletinTemplateConfig` → `DocLayout`) pourra être écrit en Lot 6, sans bloquer la livraison.

## 12. Plan de livraison par lots

Chaque lot est livré complet, testé, sans casser l'existant.

| Lot | Contenu | Critères d'acceptation |
|---|---|---|
| **0** | Correctifs §4 (pied de page, sélecteur) | Plus aucun identifiant de client réel visible ; les entreprises existantes voient le même rendu. |
| **1** | Types (`DocLayout`), registre des types de documents, `buildContext` du bulletin, `DocumentRenderer` pour `PAYSLIP`, les 4 designs du bulletin, impression vectorielle | Les 4 bulletins reproduisent `references/pdf/Konza_BulletinPaie_*.pdf`. Aucun débordement. Le tableau remplit la page avec « Remplir la page ». |
| **2** | Page « Documents » (galerie) : choisir un design, option « Mes modèles », stockage `DocumentLayout` + API + `CUSTOM` | Le choix d'un design crée une copie par entreprise ; réinitialisation possible. |
| **3** | Nouvel éditeur plein écran (§6) : blocs, libellés, ordre des lignes, couleurs, logo, tableau étirable, annuler/rétablir | Un utilisateur novice obtient un bulletin personnalisé en quelques clics. Aucune sidebar visible dans l'éditeur ; elle revient dans le même état à la sortie. |
| **3b** | Guide intégré (§7.1) : fichier `tour-steps.ts`, mode « Regarder » (démonstration jouée par le système), mode « À vous », panneau flottant « Étape x / y » | La démo se joue de bout en bout sur un modèle d'exemple sans rien enregistrer ; chaque étape est couverte par un test de bout à bout ; `prefers-reduced-motion` respecté. |
| **4** | Autres documents via le même moteur : absence, congé, permission de sortie, prêt, avance, avec les 4 designs | Les 16 PDF de référence sont reproduits. Orca et Standard inchangés. |
| **5** | « Partir de zéro » (plan Entreprise), barrières de plan | Page vide avec seulement les blocs verrouillés ; accès refusé hors plan. |
| **6** | Facture prestataire (forfait / détaillée), lettre d'autorisation de congé, attestation de formation (si le budget le permet), convertisseur de l'ancien format, suppression des anciens renderers | Parité visuelle validée avant tout retrait de code. |
| **7** (optionnel) | Vidéos MP4 générées automatiquement à partir de `tour-steps.ts` (§7.2) | 5 chapitres générés sans intervention manuelle, sous-titrés, ≤ 3 Mo chacun, régénérés à chaque release. |

Si les crédits manquent : lots 0 → 1 → 2 → 3 d'abord (valeur immédiate), puis 3b, 4 et 5, le lot 6 ensuite, le lot 7 en dernier.

## 13. Consignes de travail pour l'agent

- Lire le code existant avant d'écrire : ne pas réinventer ce qui existe (types, variables, upload du logo, mécanisme de plans, permissions).
- Livrer des **fichiers complets** et des modifications Prisma **par ajouts uniquement** (pas de renommage, pas de suppression).
- Ne jamais modifier les valeurs calculées ni la logique de paie. Le moteur n'affiche que des valeurs fournies.
- Ne pas ajouter de composant par design ni par type de document ; tout passe par le moteur, les skins et les catalogues.
- Tout texte visible en français. Pas d'identifiant de client réel dans le code ni dans les exemples (utiliser « Konza Tech » et des valeurs d'exemple).
- Chaque lot : types stricts (`tsc --noEmit`), lint, tests de régression visuelle du §8, aucune régression sur Orca / Standard.
- Si une décision manque, appliquer le choix le plus simple et le noter dans le compte rendu du lot.

## 14. Questions à confirmer avec Nathan

1. **Numérotation des modèles** : le texte parle de « Modèle 1 » et de « Orca ». Dans le code actuel, `ORCA` s'affiche « Modèle 1 » et `STANDARD` « Modèle 2 ». Hypothèse retenue : les deux modèles gardés sont **Orca** (client spécifique) et **Standard** (tous). Si « Modèle 1 » désigne en réalité le standard, ajuster les libellés du sélecteur (§4.2).
2. **Plan de départ** de la personnalisation (Business ? Pro ?) pour le drapeau `canCustomizeDocuments`.
3. **Permission de sortie** : fournir ou valider la liste exacte des champs (à extraire de `components/permissions`).
4. **Nombre de layouts par type et par entreprise** : 1 en V1 (contrainte `@@unique`). À ouvrir plus tard si besoin de plusieurs modèles actifs.
