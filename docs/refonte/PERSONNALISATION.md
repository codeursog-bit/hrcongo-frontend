# PERSONNALISATION DE L'APPARENCE — SPÉCIFICATION

> Chantier SÉPARÉ de la refonte des pages, à lire avec `REFONTE.md`. Méthode identique aux autres « fonctions à venir » : **interface + mode démo d'abord, API ensuite**. Ne rien construire de ce fichier avant que l'ordre du plan (section 7) ne l'indique, sauf la préparation de la section 6.

---

## 1. Objectif

Chaque entreprise a sa propre ambiance de couleurs dans Konza RH, et peut autoriser ou non ses employés à personnaliser la leur. Personne n'est bloqué : si l'entreprise n'a rien configuré, les couleurs Konza par défaut s'appliquent.

---

## 2. Règles de résolution (qui décide des couleurs)

1. **L'admin de l'entreprise** configure les couleurs de l'entreprise (Paramètres → Entreprise → « Apparence »).
2. Il active ou désactive l'interrupteur **« Autoriser les employés à personnaliser leurs couleurs »**. Par défaut : **désactivé**.
3. Couleurs effectivement appliquées à un utilisateur :
   - interrupteur **activé** ET l'utilisateur a fait un choix personnel → **son choix** ;
   - sinon, si l'entreprise a configuré ses couleurs → **couleurs de l'entreprise** ;
   - sinon → **couleurs Konza par défaut** (orange, gris-blanc).
4. Si l'admin **désactive** l'interrupteur plus tard : les choix personnels sont **conservés** en base mais **ignorés**. S'il le réactive, ils reviennent.
5. **Le mode d'affichage (Clair / Sombre / Auto) reste TOUJOURS personnel**, quelle que soit la politique de l'entreprise (confort et accessibilité).
6. Un utilisateur rattaché à plusieurs entreprises (ex. comptable) a des préférences personnelles uniques, mais les couleurs de l'entreprise appliquées sont celles de l'**entreprise active**.
7. Zones en phase 2 (`/admin/*`, `/cabinet/*`, `/portefeuille/*`, classe `theme-legacy`) : **non concernées** pour l'instant.
8. Pages avant connexion (login, inscription…) : couleurs Konza par défaut (ou dernière entreprise mémorisée sur l'appareil).

---

## 3. Ce qui est personnalisable (liberté encadrée)

| Élément | Choix | Remarques |
|---|---|---|
| **Couleur d'accent** (marque) | ~10 palettes prêtes (dont l'orange Konza par défaut) ou sélecteur libre | Tout le reste en découle automatiquement (voir §6) |
| **Ambiance de fond clair** | 4-5 ambiances prédéfinies (gris-blanc, blanc chaud, crème, gris pierre…) | Pas de fond totalement libre : garantit la lisibilité |
| **Ambiance de fond sombre** | 3-4 ambiances prédéfinies (anthracite, graphite, chaud…) | Idem |
| **Mode** | Clair / Sombre / Auto | Toujours personnel (§2.5) |

**Jamais personnalisable :** couleurs de statut (vert validé, moutarde en attente, rouge refusé/danger, gris annulé), documents imprimables et exports, couleurs des champs `primaryColor` / `secondaryColor` existants de l'entreprise (ils servent aux bulletins, au journal de paie et aux couleurs de cabinet : **ne pas les réutiliser** pour l'interface).

**Garde-fous :**
- Contrôle de contraste automatique (texte sur fond, texte sur bouton de marque, ratio minimum 4,5:1). Un choix illisible est refusé avec un message clair, ou corrigé automatiquement (texte clair/foncé choisi pour le bouton).
- **Aperçu en direct** avant d'enregistrer.
- Bouton **« Revenir aux couleurs Konza »** (utilisateur) et **« Rétablir les couleurs par défaut »** (admin).
- En mode sombre, l'accent est automatiquement éclairci pour garder le contraste.

---

## 4. Écrans

**Admin — Paramètres → Entreprise → « Apparence »** (carte dédiée)
- Palette d'accent + sélecteur libre, ambiance clair / sombre, aperçu en direct (mini-interface : carte, bouton, badge, courbe).
- Interrupteur « Autoriser les employés à personnaliser leurs couleurs ».
- Enregistrement avec toast de succès.

**Employé — Mon compte → « Apparence »**
- Mode Clair / Sombre / Auto : toujours disponible.
- Si la personnalisation est **autorisée** : palettes, ambiance, aperçu, « Revenir aux couleurs de mon entreprise ».
- Si elle est **désactivée** : carte en lecture seule « Les couleurs sont définies par votre entreprise », avec un aperçu. Pas de contrôle de couleur.

---

## 5. Contrat de données (proposition ; le back pourra ajuster)

```ts
type Ambiance = string; // identifiant d'une ambiance prédéfinie
interface ColorChoice { accent: string /* #RRGGBB */; ambianceLight: Ambiance; ambianceDark: Ambiance }

interface CompanyAppearance {
  colors: ColorChoice | null;               // null = couleurs Konza par défaut
  allowEmployeeCustomization: boolean;      // défaut : false
}
interface UserAppearance {
  mode: 'light' | 'dark' | 'auto';          // toujours personnel
  colors: ColorChoice | null;               // ignoré si l'entreprise n'autorise pas
}
interface EffectiveAppearance {             // renvoyé résolu pour l'utilisateur connecté
  colors: ColorChoice;
  mode: 'light' | 'dark' | 'auto';
  source: 'USER' | 'COMPANY' | 'DEFAULT';
  canCustomize: boolean;
}
```
Routes proposées : `GET /appearance/me` (company + user + effective, selon l'entreprise active) · `PATCH /companies/:id/appearance` (admin d'entreprise uniquement ; journalisé dans l'audit) · `PATCH /users/me/appearance`.
Stockage : **nouveaux champs uniquement** (JSON de préférences sur l'utilisateur ; JSON d'apparence + booléen sur l'entreprise). Aucune modification des champs existants. Validation côté back : format hex, ambiance connue, rôle autorisé.

---

## 6. Préparation technique (à faire dès l'étape 1/2, sans construire la fonction)

- Dériver `--brand-strong`, `--brand-soft`, `--on-brand` (texte sur bouton de marque) et la couleur de focus **depuis `--brand`** (ex. `color-mix()`), pas de valeurs fixes.
- Graphiques Recharts et composants : ils lisent les tokens ; **aucune couleur de marque en dur** dans les nouveaux composants.
- Couleurs de statut séparées et fixes.
- Application au runtime : le `ThemeProvider` (étendu à l'étape 2) pose les variables sur `<html>` à partir d'un objet de thème venant d'un adaptateur `lib/data/appearance.*` (démo = stockage local ; API = squelette). Dernière apparence effective mise en cache localement pour éviter tout flash au chargement.
- Les ambiances sont des jeux de tokens nommés (fond, surface, surface-2, bordure, texte) définis une seule fois dans le code.

---

## 7. Plan et ordre

1. **Maintenant (étape 1-2)** : seulement la préparation de la section 6.
2. **Étape 2 (coquille)** : étendre `ThemeProvider` (mode Auto + application du thème effectif via l'adaptateur démo).
3. **Page Mon compte** : section « Apparence » (cas autorisé et cas verrouillé), en mode démo.
4. **Page Paramètres → Entreprise** : carte « Apparence » (admin), en mode démo.
5. **Plus tard, chantier back** : champs, routes, audit, validations ; puis on remplit `appearance.api.ts` et on active le drapeau `NEXT_PUBLIC_FEATURE_APPEARANCE_API`. Le front ne change pas.

---

## 8. Critères de réussite

Changer la couleur d'accent change tous les boutons, éléments actifs, graphiques et badges de marque des pages refondues, en clair et en sombre · aucun texte illisible quel que soit le choix · bulletins et exports identiques · aucun flash de couleurs au chargement · cas « personnalisation désactivée » vérifié · un utilisateur multi-entreprises voit les bonnes couleurs en changeant d'entreprise.

## 9. Réalisation front (12 novembre 2026)

À la demande de l’utilisateur, ce chantier a été avancé avant Prêts → Suivi des dettes. Page `/apparence`, vue entreprise `?scope=company`, liens depuis Mon compte et Paramètres → Entreprise, moteur et stockage démo livrés. Les réglages utilisent des champs d’apparence séparés, jamais primaryColor/secondaryColor.

**19 novembre — liaison réelle :** champs JSON, politique, routes Nest, audit et adaptateur HTTP livrés et testés sur PostgreSQL local. Le mode personnel se restaure depuis le serveur, avec sauvegardes ordonnées. Hors démo, le drapeau est actif par défaut (valeur explicite `false` pour suspendre la fonction). Migration appliquée localement seulement ; déployer le back et la migration avant le front ailleurs. La démo locale existante reste activée. Voir [LIAISON-BACKEND.md](LIAISON-BACKEND.md) pour les preuves et l’activation ; revue visuelle toujours distincte.
