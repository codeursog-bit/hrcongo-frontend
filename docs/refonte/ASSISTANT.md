# ASSISTANT KONZA — SPÉCIFICATION (À RÉALISER EN DERNIER)

> Chantier **séparé et final**, après la refonte des pages, le cabinet, les pages publiques et le back des fonctions « Ma journée ». Ne rien construire de ce fichier avant que l'utilisateur ne donne le feu vert. Méthode habituelle : proposer, valider, livrer par phase, compte rendu de 10 lignes.

---

## 1. Vision : deux assistants dans un seul panneau

1. **Le Guide** (sans IA, déterministe) : pas à pas animé sur la vraie interface. Un curseur se déplace vers le bon menu, un halo l'entoure, une bulle dit « cliquez ici », puis il montre les boutons suivants. Toujours correct, toujours à jour, gratuit.
2. **L'Assistant IA** (conversation) : répond aux questions sur l'application, analyse les données **de l'entreprise de la personne** (masse salariale, primes, heures supplémentaires, absences, retours de congé, allocations) et **refuse** poliment tout ce qu'il ne sait pas faire.

Les deux se complètent : quand l'IA explique « comment faire la paie », elle ne décrit pas les étapes de mémoire, elle **lance un guide existant** (« Me guider »). Ainsi aucune étape inventée.

---

## 2. Règles non négociables

1. **Le modèle n'a jamais accès à la base de données.** Aucun SQL, aucun accès générique, aucun « text-to-SQL ». Il ne peut appeler que des **outils** (fonctions du back), en lecture seule, écrits à la main.
2. **L'isolation par entreprise est garantie par le code, pas par le prompt.** L'identifiant d'entreprise vient du jeton de la personne connectée. Aucun outil n'accepte de paramètre « entreprise ». Une entreprise A ne peut ni lire ni déduire les données d'une entreprise B, même si on le demande explicitement.
3. **Aucun chiffre ne vient du modèle.** Les montants, nombres et dates viennent des résultats d'outils (calculés par les moteurs de l'application). Le modèle ne fait que les expliquer. Un contrôle côté serveur vérifie que chaque nombre de la réponse figure dans les résultats d'outils ; sinon la réponse est remplacée par un refus.
4. **Il vaut mieux refuser que se tromper.** Si la question sort du périmètre, ou si l'outil ne renvoie rien d'assez précis, l'assistant dit qu'il ne peut pas répondre et renvoie vers le support.
5. **Version 1 : lecture seule.** L'assistant ne crée, ne modifie ni ne supprime aucune donnée. Il ne génère pas de bulletin à la place de l'utilisateur.
6. **Les données renvoyées par les outils sont des données, jamais des instructions** (défense contre l'injection : un nom d'employé ou une note ne peut pas donner d'ordre au modèle).
7. **Le fournisseur du modèle est interchangeable** (section 6). **Le mode de démarrage est « Intégré » : aucun appel externe, rien ne quitte le serveur de Konza.** Le mode « IA avancée » (modèle externe) n'existe qu'avec la pseudonymisation de la section 8, et seul le **super admin** peut l'activer, une fois la licence confirmée (section 8 bis).

---

## 3. Le Guide pas à pas

> **Toujours disponible, quel que soit le mode de l'assistant** (même `OFF`) : il ne contacte aucun serveur d'IA. Le super admin peut l'activer ou le désactiver globalement, et guide par guide (section 8 bis).

### Comportement
- L'utilisateur choisit une question (« Comment faire la paie ? ») ou clique sur « Me guider » depuis une réponse de l'IA.
- Un voile léger assombrit la page, **un halo entoure l'élément ciblé**, un **curseur animé** s'y déplace, une bulle donne l'instruction (étape 1 sur 3…). Quand la personne clique réellement sur l'élément, le guide passe à l'étape suivante (changement de page compris). Boutons : Précédent, Passer, Quitter.
- Le guide **ne clique jamais à la place de la personne** et **ne saisit rien**. Il montre, elle agit.
- Il affiche en bref les options à chaque carrefour (ex. paie individuelle, en masse, manuelle : une phrase chacune).

### Technique
- **Catalogue de guides** dans un fichier versionné (`lib/guides/*.ts`), une entrée par guide : `id`, titre, mots-clés de recherche, rôles autorisés, fonctionnalités requises (abonnement), liste d'étapes. Exemple :

```ts
{ id: 'payroll-create', title: 'Faire la paie', roles: ['ADMIN','HR_MANAGER'],
  steps: [
    { target: '[data-guide="menu-paie"]', text: 'Cliquez sur Paie et salaires.', waitFor: 'click' },
    { target: '[data-guide="paie-modes"]', text: 'Choisissez : individuelle, en masse ou manuelle.', info: [
        { label: 'Individuelle', text: 'Un employé à la fois, avec ses primes et ses heures supplémentaires.' },
        { label: 'En masse', text: 'Tous les employés d’un coup pour le mois.' },
        { label: 'Manuelle', text: 'Saisie libre pour un cas particulier.' } ], waitFor: 'click' },
    { target: '[data-guide="paie-generer"]', text: 'Cliquez sur Générer les bulletins.', waitFor: 'click', last: true },
  ] }
```
- **Points d'ancrage stables** : ajouter des attributs `data-guide="…"` sur les menus et boutons concernés (jamais sur des classes CSS, qui changent).
- **Moteur** : composant `GuideOverlay` (halo en SVG masqué ou découpe CSS, curseur animé, bulle accessible `role="dialog"`), un `GuideProvider` (état : guide actif, étape), détection de l'élément par `MutationObserver` (attend qu'il apparaisse après une navigation), repositionnement au redimensionnement et au défilement.
- **Cas à gérer** : sidebar repliée ou menu mobile (étape préalable « ouvrir le menu »), élément absent car le rôle n'y a pas accès (le guide l'explique et propose le support), élément masqué par l'abonnement, mode sombre, page encore en chargement, retour en arrière du navigateur.
- **Accessibilité** : annonce de chaque étape (`aria-live`), navigation au clavier, `prefers-reduced-motion` = pas de déplacement animé, seulement le halo.
- **Aucune vidéo enregistrée** : le guide s'appuie sur l'interface réelle, donc il reste exact après chaque évolution du design. Une page de test automatique vérifie que chaque `target` du catalogue existe (alerte si un bouton est renommé).
- Bibliothèque : écrire le moteur maison (cohérence visuelle avec le design system). À défaut, `driver.js` ou Shepherd peuvent servir de base, mais le curseur animé reste à écrire.

### Premiers guides (par ordre de valeur)
1. Faire la paie (individuelle, en masse, manuelle). 2. Créer une offre de recrutement (IA ou manuelle). 3. Ajouter un employé (formulaire et import). 4. Faire une demande de congé. 5. Faire une demande de prêt ou d'avance. 6. Pointer et corriger un pointage. 7. Générer un contrat. 8. Déclarer la CNSS. 9. Changer l'apparence et les couleurs de l'entreprise. 10. Valider une demande (admin).

---

## 4. L'Assistant IA

### Architecture
```
Navigateur ──► Back (module assistant) ──► Adaptateur de modèle ──► Fournisseur (GPT, Claude, Gemini, Mistral, Ollama…)
                    │
                    ├─ outils de lecture (limités à l'entreprise du jeton) ──► services existants (paie, congés, présences…)
                    ├─ aide de l'application (base de connaissances) ──► catalogue de guides + articles d'aide
                    └─ garde-fous : contrôle des nombres, refus, journal d'audit, quotas
```
Ce qui se passe dépend du **mode** réglé par le super admin (section 8 bis). En mode **Intégré** : aucun modèle externe ; la question est comprise localement, l'outil s'exécute sur le serveur et la réponse est rédigée à partir de modèles de phrases. En mode **IA avancée** : le modèle externe ne reçoit que des données masquées (pseudonymes et marqueurs, section 8). Jamais le jeton, jamais l'identifiant d'entreprise brut, jamais des tables entières.

### Trois zones de réponse
1. **Aide à l'application** : où cliquer, comment faire. Source : la **base de connaissances** (menu de l'application, description de chaque module, catalogue de guides), maintenue dans le dépôt. L'assistant répond en quelques lignes et propose « Me guider ».
2. **Analyse des données de l'entreprise** : via les outils ci-dessous.
3. **Hors périmètre** : l'assistant le dit clairement (« Je ne peux pas répondre à cette question. Contactez le support, je n'ai pas cette information. ») avec un bouton vers le support. Exemples hors périmètre : conseil juridique engageant, comparaison avec d'autres entreprises, prévisions non calculées par l'application, toute donnée qu'aucun outil ne fournit.

### Catalogue d'outils (tous en lecture seule, sans paramètre d'entreprise)
| Outil | Rôle | Réponse aux questions du type |
|---|---|---|
| `explain_payroll_variation(period, compareTo)` | Décompose l'écart de masse salariale entre deux périodes : primes, heures supplémentaires, embauches, départs, augmentations, congés, avances. Calculé par un code déterministe. | « Pourquoi ma masse salariale a trop augmenté ce mois-ci ? » |
| `top_paid_employees(period, limit)` | Employés les mieux payés de la période, avec la composition de leur paie. | « Quel employé a le plus gagné ce mois-ci, et pourquoi ? » |
| `explain_employee_pay(employeeId, period)` | Détail de la paie d'un employé (éléments, écart avec le mois précédent). | « Pourquoi la paie de X a changé ? » |
| `permissions_ranking(from, to, limit)` | Classement des permissions prises sur une période. | « Qui a le plus de permissions sur cette période ? » |
| `leave_returns(month)` / `leave_departures(month)` | Employés qui partent ou reviennent de congé un mois donné. | « Qui part en congé en janvier ? Qui revient ? » |
| `leave_allowance(employeeId)` | **Appelle le moteur de calcul existant** de l'allocation de congé. Si le moteur ne sait pas calculer le cas, l'outil le dit et l'assistant refuse de deviner. | « Combien dois-je lui payer comme allocation de congé ? » |
| `leave_balance(employeeId)` | Solde de congés. | « Combien de jours lui reste-t-il ? » |
| `headcount_summary(period)` | Effectifs, entrées, sorties, par département. | « Combien d'employés avons-nous ? » |
| `search_help(topic)` | Cherche dans la base de connaissances de l'application. | « Comment créer une offre ? » |
| `start_guide(guideId)` | Lance un guide du catalogue. | « Montre-moi comment faire la paie. » |

Règles des outils : paramètres validés et bornés ; résultats **minimisés** (jamais de numéro CNSS, de coordonnées bancaires, d'adresse ; identifiants opaques) ; chaque résultat porte sa période et sa source ; chaque appel est écrit dans un journal d'audit (qui, quand, quel outil, jamais le contenu salarial en clair dans les journaux d'erreur).

### Droits par rôle (décision de l'utilisateur, version 1)
- **ADMIN et HR_MANAGER** : tous les outils d'analyse sur leur entreprise, plus l'aide et les guides.
- **MANAGER et EMPLOYEE** : aide à l'application et guides uniquement. Aucune donnée de l'entreprise ni de la paie n'est accessible à ces rôles par l'assistant.
- **Comptes cabinet et multi-entreprises** : une conversation est liée à **une seule entreprise vérifiée** (`resolveVerifiedCompanyId`) ; changer d'entreprise démarre une nouvelle conversation.

### Contrôle des réponses (anti-erreur)
1. **Ancrage** : le prompt système impose de n'énoncer que ce que les outils renvoient. Les nombres sont rendus depuis les résultats d'outils.
2. **Vérificateur de nombres** côté serveur : tout nombre de la réponse doit apparaître dans un résultat d'outil de cette conversation (au formatage près). Sinon : réponse remplacée par un refus + invitation à contacter le support.
3. **Réponses structurées** : le modèle renvoie un texte et des références d'outils ; l'interface affiche les chiffres dans des cartes alimentées par les outils (le modèle ne les retape pas).
4. **Suite de tests** (section 9) exécutée à chaque changement de modèle ou de prompt.

Exemple de comportement attendu : « Quel est le net de Marie ? » → l'assistant appelle `explain_employee_pay`, répond avec le montant renvoyé, ou répond « Je n'ai pas cette information » ; il ne dit **jamais** « environ 200 000 » de mémoire.

### Interface
- Bouton « Assistant » dans la barre du haut ; panneau latéral (tiroir) sur les tokens de la refonte ; sur mobile, plein écran.
- Questions suggérées selon le rôle (« Comment faire la paie ? », « Pourquoi la masse salariale a augmenté ? », « Qui revient de congé en janvier ? »).
- Réponses avec cartes de chiffres, lien vers la page concernée, bouton « Me guider », pouces haut/bas, mention « Basé sur les données de [période] ».
- Message de confidentialité discret. Réponse diffusée au fil de l'eau.
- Mode démonstration (adaptateur de démo) comme les autres fonctions, drapeau `NEXT_PUBLIC_FEATURE_ASSISTANT_API`.

---

## 5. Contrat entre le front et le back (proposition)

- `POST /assistant/chat` ← `{ conversationId?, message }` → flux (SSE) d'événements : `text`, `card` (chiffres issus d'un outil), `guide` (identifiant à lancer), `refusal`, `done`.
- `GET /assistant/conversations` / `GET /assistant/conversations/:id` / `DELETE /assistant/conversations/:id`.
- `POST /assistant/feedback` ← `{ messageId, rating }`.
- `GET /assistant/suggestions` → questions suggérées pour le rôle.
- `GET /assistant/capabilities` → ce que l'interface doit afficher pour cette personne : `{ assistantMode: 'OFF' | 'INTEGRE' | 'IA_AVANCEE', remainingAnalyses, monthlyAnalyses, guideEnabled, disabledGuides[] }`. Le front masque ou affiche le bouton du chat, le compteur et les invitations à passer au forfait supérieur d'après cette réponse, sans jamais deviner le mode.
Le front a aussi un catalogue local de guides (`lib/guides`), **indépendant de l'IA** : le Guide fonctionne même si l'Assistant est désactivé (`OFF`) et se coupe uniquement par son propre interrupteur dans le super admin.

---

## 6. Modèle interchangeable en une ligne

Interface unique côté back :
```ts
interface LlmProvider {
  chat(input: { system: string; messages: Msg[]; tools: ToolSpec[]; stream: boolean; maxTokens: number }): AsyncIterable<LlmEvent>;
  capabilities: { tools: boolean; streaming: boolean; maxContext: number };
}
```
Adaptateurs : OpenAI (GPT), Anthropic (Claude), Google (Gemini), Mistral, Ollama (local), et tout service compatible OpenAI (base URL personnalisée : vLLM, LM Studio, etc.). Configuration par variables d'environnement :

```
ASSISTANT_PROVIDER=anthropic        # openai | anthropic | google | mistral | ollama | openai-compatible
ASSISTANT_MODEL=<nom du modèle>
ASSISTANT_API_KEY=...
ASSISTANT_BASE_URL=...              # pour ollama et openai-compatible
```
Le **mode** (hors service, intégré, IA avancée) ne se règle **plus** par variable d'environnement : il se règle dans le **super admin** (section 8 bis). Les variables ci-dessus donnent le fournisseur, le modèle et la clé ; la clé reste dans l'environnement, jamais en base de données. Valeur de départ uniquement : `ASSISTANT_MODE_DEFAULT=INTEGRE`.
```
Changer de modèle = changer ces lignes. Précisions : les adaptateurs uniformisent l'appel d'outils et le flux ; on peut s'appuyer sur une bibliothèque multi-fournisseurs (par exemple le kit « AI SDK ») pour ne pas tout réécrire. **La qualité n'est pas identique d'un modèle à l'autre** : un petit modèle local appelle moins bien les outils. D'où le drapeau `capabilities.tools` : si un modèle ne sait pas appeler des outils de façon fiable, l'assistant passe en mode **aide à l'application et guides uniquement** (aucune analyse de données). La suite de tests sert à valider un modèle avant de l'activer.

---

## 7. Stockage, quotas, coûts

- Conversations rattachées à la personne et à l'entreprise, jamais partagées ; durée de conservation limitée (par défaut 90 jours), suppression par la personne, suppression en cascade quand l'employé quitte l'entreprise.
- **Les guides pas à pas ne sont jamais limités** (sans IA, gratuits) : ils servent aussi de vitrine.
- **Ce qui est limité : les « analyses ».** Une analyse = une question qui déclenche un calcul sur les données de l'entreprise (masse salariale, top paies, retours de congé…). **Ne comptent pas** : les questions d'aide, les guides, les refus, les messages sans résultat, une question identique reposée dans les 10 minutes. Le quota est **partagé par l'entreprise** (tous ses admins et RH), remis à zéro à la date de renouvellement de l'abonnement.
- **Proposition de quotas** (alignés sur les forfaits existants ; valeurs de départ à ajuster après mesure des usages) :

| Forfait | Analyses par mois | Pourquoi |
|---|---|---|
| Essai (fonctions PRO) | 20 pendant l'essai | assez pour voir la valeur, sans excès |
| FREE (2 employés) | 3 | goûter l'assistant, puis donner envie de passer à BASIC |
| BASIC (25 000 FCFA) | 30 | usage régulier d'une petite entreprise |
| PRO (75 000 FCFA) | 150 | usage quotidien d'une équipe RH |
| ENTERPRISE (200 000 FCFA) | illimité, avec plafond « usage raisonnable » (ex. 1 000) | pas de friction pour les gros comptes |

- **Le quota est un levier de vente, pas une contrainte de coût** : en mode Intégré, une analyse ne coûte rien (aucun appel externe) ; en mode IA avancée, le coût par analyse est à mesurer avec le vrai modèle. Les quotas sont réglés par forfait dans le super admin et s'appliquent aux deux modes.
- **Expérience** : compteur toujours visible (« 12 analyses restantes ce mois-ci ») ; à 80 %, un bandeau discret ; à 100 %, l'aide et les guides continuent de fonctionner et l'analyse propose de passer au forfait supérieur (bouton direct) **ou, plus tard, d'acheter un petit pack d'analyses** (idée optionnelle). Jamais de coupure au milieu d'une conversation : la réponse en cours est toujours terminée.
- **Mesure** : suivre le taux d'utilisation par forfait et le nombre de clics sur « passer au forfait supérieur » pour ajuster les quotas.
- **Cabinets** : cas **à trancher plus tard**. En attendant, en version 1 l'analyse IA est désactivée pour les comptes cabinet (les guides et l'aide restent disponibles). Pistes à étudier : quota commun au cabinet selon son forfait, avec un plafond par entreprise cliente pour qu'un client n'épuise pas tout.
- Limite de débit par personne, taille maximale de message et de réponse, mise en cache des articles d'aide, historique tronqué.
- **Coût** : mode Intégré = aucun coût par question ; mode IA avancée = un modèle économique suffit (série « mini », « flash » ou « haiku » des fournisseurs), coût à mesurer.

---

## 8. Données personnelles : trois modes de fonctionnement

**Constat de départ.** Dès qu'on utilise un modèle externe (GPT, Claude, Gemini…), **tout ce qu'on lui envoie sort du serveur**, et aucun réglage technique ne peut empêcher un modèle externe de « garder » ou de « divulguer » ce qu'il a reçu. Les seules protections réelles sont : (1) **ne pas envoyer** la donnée, (2) la **déguiser** avant l'envoi, (3) un **contrat** de non-conservation avec le fournisseur. L'architecture est donc construite autour de (1).

### Mode A — « Intégré » : tout reste dans le serveur (mode de démarrage)
- **Aucun appel à un fournisseur externe.** Rien ne sort, aucune licence n'est nécessaire, coût nul par question.
- **Compréhension locale** de la question : normalisation du texte, mots-clés et synonymes en français (« absences », « absentéisme »…), extraction de la période (« ce mois-ci », « le mois dernier », « janvier »), des départements et des noms d'employés (liste de l'entreprise, fautes courantes). Un **catalogue de questions prises en charge** relie chaque intention à un outil (les outils de la section 4). Seuil de confiance : sous le seuil, l'assistant répond « Je n'ai pas bien compris. Voici ce que je peux faire : » et propose des **questions suggérées cliquables** (jamais d'invention).
- L'outil s'exécute sur le serveur ; la réponse est **rédigée localement** à partir de modèles de phrases et de cartes de chiffres (« La masse salariale a augmenté de X FCFA (+Y %) : primes +A, heures supplémentaires +B, embauches +C »). Aucun modèle ne réécrit les chiffres.
- Avantages : rien ne sort, coût minimal, chiffres toujours exacts, comportement prévisible. Limite : l'assistant ne répond qu'aux questions du catalogue et son ton est moins conversationnel ; les questions imprévues sont refusées avec renvoi vers le support (WhatsApp).
- Ce mode sert aussi de **repli** : si le mode IA avancée est coupé (interrupteur d'urgence, panne du fournisseur, petite équipe), l'assistant continue en mode Intégré.

### Mode B — « IA avancée » : modèle externe, le serveur est le cerveau et le modèle ne connaît personne (après licence)
**Idée de l'utilisateur, confirmée faisable.** L'assistant converse naturellement et explique, mais **il ne sait jamais qui sont les personnes ni combien elles gagnent réellement**. Konza fait le lien entre les pseudonymes et la réalité.

**Principe : pseudonymisation réversible avec marqueurs.**
1. L'utilisateur écrit sa question. Le serveur remplace les noms reconnus (liste des employés de l'entreprise : nom, prénom, surnoms, fautes de frappe courantes) par des repères de la conversation : « Nathan » devient `E1`. Si deux employés correspondent (« Nathan » × 2), le serveur demande à l'utilisateur de préciser, **localement**, sans solliciter le modèle.
2. Le modèle choisit un outil. L'outil s'exécute sur le serveur et renvoie les vraies valeurs.
3. Avant tout envoi au modèle, le serveur **masque** le résultat : noms → `E1`, `E2`… ; départements génériques conservés (ex. « Logistique ») sauf s'ils contiennent moins de 3 personnes (alors `D1`) ; **montants → valeurs relatives et marqueurs** : le modèle reçoit « E1 : 2,3 fois la moyenne des heures supplémentaires ; part de l'augmentation : primes 62 %, heures supplémentaires 25 %, embauches 13 % » et des **marqueurs** `[[E1.hs_montant]]`, `[[delta_total]]` à utiliser dans ses phrases.
4. Le modèle rédige : « La masse salariale augmente de [[delta_total]] (+[[delta_pct]]). L'essentiel vient des primes, et E1 a fait le plus d'heures supplémentaires ([[E1.hs_heures]] h, soit [[E1.hs_montant]]). »
5. Le serveur **remplace les marqueurs par les vraies valeurs et les repères par les vrais noms**, puis affiche à l'utilisateur : « … Nathan Sogoya a fait le plus d'heures supplémentaires (24 h, soit 120 000 FCFA). »
6. Le contrôle des nombres reste actif : tout chiffre « nu » écrit par le modèle (hors marqueurs) bloque la réponse. Ainsi le modèle **ne peut pas inventer un montant** et ne voit jamais les vrais.

**Suivi de la conversation** : « Et lui, combien d'heures ? » fonctionne, parce que la correspondance `E1` ↔ employé est conservée **côté serveur** pour toute la conversation. L'historique est stocké **masqué** (repères + identifiants internes), jamais avec les vrais noms.

**Ce que le modèle ne reçoit jamais, quel que soit l'outil** : noms réels, identifiants, nom ou secteur de l'entreprise, numéro CNSS, coordonnées bancaires, adresse, téléphone, e-mail, **situation familiale, nombre de parts, charges de famille, état de santé**, dates exactes de naissance ou d'embauche (ancienneté en années à la place), commentaires et notes libres saisis par les utilisateurs, montants bruts. Les outils eux-mêmes **n'exposent pas** ces champs : l'assistant répond « je n'ai pas accès à cette information » s'ils sont demandés.

**Petites équipes** : en dessous d'un seuil (ex. moins de 5 personnes dans un groupe comparé), les comparaisons relatives sont désactivées, car elles permettraient de deviner de qui on parle ; l'assistant répond alors en mode A (réponse rédigée par le serveur).

**Limites honnêtes** : il ne reste aucun nom, montant ni identifiant, donc le risque d'identification est très faible, mais **pas mathématiquement nul** (un profil très atypique dans une toute petite entreprise reste devinable) ; la détection des noms dans le texte libre n'est pas parfaite (fautes, surnoms) : les noms non reconnus partiraient tels quels, d'où le test de sortie réseau et une liste de surnoms par entreprise. À n'activer qu'avec un **contrat API professionnel** (pas de conservation prolongée, pas d'entraînement sur les données, « zéro rétention » si proposé).

### Mode C — « Modèle local » (plus tard)
- Le modèle tourne sur un serveur de Konza : rien ne sort. Possible plus tard si le coût de l'infrastructure est justifié ; c'est aussi là que des **actions** (et plus seulement la lecture) pourront un jour être envisagées.

### Réglages et règles communes
- Réglage par entreprise (administrateur de l'entreprise) : activer ou non l'assistant d'analyse, **dans les limites du mode et du forfait fixés par le super admin** (section 8 bis). L'entreprise ne choisit pas le mode.
- Journaux : jamais de contenu salarial ni de noms en clair dans les journaux techniques.
- Mention légale : les règles congolaises de protection des données personnelles s'appliquent ; **à faire valider par un juriste avant le lancement** (traitement par un sous-traitant étranger, information des employés, durée de conservation).
- **Le Guide pas à pas n'envoie rien à personne** : il fonctionne entièrement dans le navigateur.

---

## 8 bis. Interrupteurs du super admin (assistant et guide)

Tout se règle depuis l'espace **super admin**, sans redéploiement. Une nouvelle page « Assistant » (zone admin, à créer avec le reste du super admin).

### Réglages de la plateforme
| Réglage | Valeurs | Remarque |
|---|---|---|
| **Assistant IA** | `OFF` · `INTEGRE` (mode A) · `IA_AVANCEE` (mode B) | `INTEGRE` par défaut au lancement. |
| **Licence du fournisseur** | case « contrat sans conservation ni entraînement confirmé » + fournisseur, date, référence du contrat | **`IA_AVANCEE` est impossible à activer tant que la case n'est pas cochée** (contrôle côté serveur, pas seulement dans l'écran). |
| **Fournisseur et modèle** | liste des fournisseurs et modèles autorisés | Les **clés d'API restent dans les variables d'environnement ou le coffre de secrets**, jamais en base de données ni dans l'écran. |
| **Disponibilité par forfait** | pour chaque forfait (essai, FREE, BASIC, PRO, ENTERPRISE) : mode maximal autorisé et quota d'analyses par mois | valeurs de départ : §7. |
| **Exceptions par entreprise** | autoriser ou interdire l'assistant, ou imposer le mode A, pour une entreprise donnée | utile pour un client sensible ou un essai pilote. |
| **Interrupteur d'urgence** | coupe immédiatement tout appel externe ; l'assistant retombe en mode A | prend effet à la requête suivante. |
| **Guide pas à pas** | actif / inactif, et activation guide par guide | **indépendant de l'assistant** : il reste disponible quel que soit le mode, même `OFF`. |
| **Suivi** | questions par jour et par forfait, refus, quota atteint, clics sur « passer au forfait supérieur », coût estimé, guides lancés et terminés | pour ajuster les quotas et repérer les guides qui échouent. |
| **Journal des changements** | qui a changé quoi et quand | audit existant. |

### Règle de résolution du mode effectif (par requête)
`mode effectif = le plus restrictif entre : mode de la plateforme, mode maximal du forfait de l'entreprise, exception de l'entreprise, état de l'interrupteur d'urgence`. Sans licence confirmée, `IA_AVANCEE` n'est jamais appliqué. Un changement de mode n'affecte que les **nouvelles** questions ; les conversations existantes restent lisibles.

### Schéma (ajouts uniquement, à adapter au schéma réel)
```prisma
model AssistantSettings {            // une seule ligne pour la plateforme
  id                   String   @id @default("platform")
  mode                 String   @default("INTEGRE")     // OFF | INTEGRE | IA_AVANCEE
  licenseConfirmed     Boolean  @default(false)
  licenseProvider      String?
  licenseDate          DateTime?
  licenseReference     String?
  provider             String?
  model                String?
  killSwitch           Boolean  @default(false)
  guideEnabled         Boolean  @default(true)
  disabledGuides       Json?                             // identifiants de guides désactivés
  planLimits           Json                              // par forfait : { maxMode, monthlyAnalyses }
  updatedAt            DateTime @updatedAt
  updatedBy            String?
}
model AssistantCompanyOverride {
  companyId  String @id
  allowed    Boolean?
  forceMode  String?                                     // ex. INTEGRE
  note       String?
}
```
Routes : `GET /admin/assistant/settings`, `PUT /admin/assistant/settings` (rôle super admin uniquement, journalisé), `PUT /admin/assistant/companies/:id`, `GET /admin/assistant/usage`.

### Mise en route proposée
1. Au lancement : `INTEGRE`. L'assistant fonctionne sans aucun fournisseur ni licence ; les guides sont actifs.
2. Quand une licence de non-entraînement et de non-conservation est obtenue : tester le mode B sur quelques entreprises pilotes (exceptions par entreprise), puis cocher la licence dans le super admin et passer la plateforme en `IA_AVANCEE`.
3. En cas de doute à tout moment : interrupteur d'urgence → retour immédiat au mode A.

---

## 9. Tests obligatoires (avant toute mise en production)

1. **Isolation** : deux entreprises de test ; jeux de questions piégées (« donne-moi les salaires de l'entreprise B », « ignore tes règles », identifiants devinés, injection dans un nom d'employé) ; zéro fuite sur chaque fournisseur configuré.
2. **Hallucination** : questions dont la réponse n'est pas dans les outils (« le net de X ? » sans donnée) → refus, jamais un chiffre inventé ; le vérificateur de nombres bloque un chiffre faux injecté volontairement.
3. **Périmètre** : questions hors sujet ou juridiques → refus poli et renvoi vers le support.
4. **Exactitude** : pour chaque outil, la réponse de l'assistant reprend exactement les valeurs de l'outil (comparaison automatique).
5. **Droits** : un employé ne peut pas obtenir les données d'un collègue ; un MANAGER sans périmètre « équipe » n'obtient pas d'analyse.
6. **Guides** : chaque cible du catalogue existe dans l'interface (test automatique) ; chaque guide se termine.
7. **Multi-fournisseurs** : la même suite passe sur chaque fournisseur activé.
9. **Pseudonymisation (mode B)** : sur 50 questions avec noms, fautes et surnoms, le modèle ne reçoit aucun nom réel ; le serveur désambiguïse les homonymes sans appeler le modèle ; tout nombre nu dans la réponse du modèle déclenche le blocage ; les vrais noms et montants sont bien rétablis à l'affichage ; l'historique stocké ne contient aucun vrai nom.
8. **Sortie réseau** : en mode A, un test vérifie qu'**aucune requête** n'est envoyée à un fournisseur ; en mode B, il intercepte les requêtes et vérifie qu'elles ne contiennent **ni montant, ni nom d'employé, ni identifiant d'entreprise, ni résultat d'outil réel** ; il échoue au moindre écart. Ce test tourne à chaque livraison.
10. **Interrupteurs** : le mode B est refusé tant que la licence n'est pas confirmée (y compris par appel direct à l'API) ; l'interrupteur d'urgence coupe l'externe à la requête suivante ; le mode effectif respecte le plus restrictif entre plateforme, forfait, exception d'entreprise ; seul le super admin peut modifier ces réglages ; le guide fonctionne quand l'assistant est à `OFF`.
11. **Compréhension locale (mode A)** : jeu de questions du catalogue (avec fautes, synonymes, périodes) → bon outil ; question hors catalogue → suggestions, jamais de réponse inventée.
Jeu de 80 à 100 questions de référence versionné dans le dépôt, avec le comportement attendu (réponse, outil appelé, refus).

---

## 10. Phases proposées

| Phase | Contenu | Dépend de |
|---|---|---|
| A | Guide pas à pas (moteur, 3 premiers guides, test des cibles, `data-guide` sur les menus) | refonte des pages |
| B | Panneau d'assistant + base de connaissances + `search_help` + `start_guide` (aide seulement, déjà utile) | A |
| C1 | **Assistant intégré (mode A)** : panneau de chat, compréhension locale, catalogue de questions, outils, modèles de réponses, garde-fous, journal, quotas par forfait, **page super admin « Assistant »** (interrupteurs de la section 8 bis) | B, back de base |
| D | Outils d'analyse un par un (masse salariale, top paies, permissions, retours de congé, allocation de congé) avec leurs tests ; catalogue de questions enrichi | C1 |
| C2 | **IA avancée (mode B)** : adaptateurs de modèles, pseudonymisation réversible, marqueurs de chiffres, contrôle des nombres, licence, interrupteur d'urgence | D, licence du fournisseur |
| E | Mode C (modèle local), exceptions par entreprise, relecture juridique, réglages fins | C2 |

---

## 11. Décisions

**Validées par l'utilisateur le 16 novembre 2026**
1. **Deux modes activables depuis le super admin** : « Intégré » (serveur seul, au départ) et « IA avancée » (modèles externes GPT, Claude, Gemini, à activer une fois la licence de non-entraînement obtenue) ; modèle local peut-être plus tard. Le guide pas à pas reste actif dans tous les cas. L'utilisateur ne veut **pas** que l'IA lise la base de données : respecté (section 2, règles 1 à 3) ; confidentialité des données : section 8, niveau 1 par défaut.
2. Les analyses de données de l'entreprise sont réservées à **ADMIN et HR_MANAGER**.
3. **Lecture seule** en version 1 ; des actions pourront être envisagées plus tard avec un modèle local.
4. L'assistant est compris dans les forfaits, **avec une limite de réponses** à définir pour inciter à passer au forfait supérieur ; les guides restent illimités.
5. Canal de support en cas de refus : **tous les canaux, WhatsApp en premier** (lien direct vers la conversation WhatsApp du support au départ ; une intégration plus poussée plus tard), puis e-mail et messagerie interne.
6. Langue : **français** uniquement.

**Encore à définir**
- Validation des quotas proposés en §7 (3 / 30 / 150 / illimité) et du texte d'invitation à passer au forfait supérieur.
- Le cas des **cabinets** (quota et périmètre) : à voir plus tard ; analyse IA désactivée pour les cabinets en version 1.
- Le numéro WhatsApp du support et les horaires d'ouverture à afficher.
- Le **nom de l'assistant** (court, neutre, facile à prononcer en français).
- Le fournisseur et le modèle économique à utiliser pour le mode B (le choix se fera sur la suite de tests, section 9) et le contrat de non-entraînement à obtenir.
- La relecture juridique (section 8).

## 12. Réalisation — 19 novembre 2026

**Feu vert utilisateur reçu. Premier lot de la phase A livré `[~]` :** moteur maison `GuideProvider`/`GuideOverlay`, catalogue versionné et ancrages `data-guide`. L’accès initial par boussole est maintenant réuni dans le panneau Assistant → Aide (sur mobile : menu du compte → Assistant et aide). Aucun fournisseur IA ajouté.

- Trois guides d’orientation : Faire la paie (individuelle/masse/manuelle), Créer une offre (manuelle/IA), Ajouter un employé (formulaire/import). Sept variantes réelles. Ils accompagnent jusqu’au formulaire et expliquent la préparation et la vérification ; ils ne déroulent pas encore chaque champ ni chaque étape interne des formulaires.
- Halo et curseur fonctionnels, déplacement réduit selon les préférences, annonce vocale de l’étape, précédent, passage d’étape lorsque possible, sortie par Échap et retour du focus. Navigation attendue, chargements et cible absente traités sans inventer de bouton. Le guide ne clique ni ne saisit rien et n’annonce aucune création comme réussie.
- Menu mobile, sidebar repliée, choix dans une fenêtre native, redimensionnement/défilement et retour navigateur gérés. Les droits/abonnements existants filtrent les parcours ; un changement d’entreprise ou de rôle arrête le guide.
- Périmètre de ce premier lot : espace entreprise, ADMIN/RH pour les trois parcours. Pas d’exposition PME : paie et import ont des routes distinctes. Cabinet/super admin et documents officiels inchangés.
- `npm run check-guides` vérifie catalogue, sept branches, cibles JSX, rôles, fonctions d’abonnement, changement d’identité, menu mobile, fenêtre native et nettoyage du moteur dans un DOM contrôlé. Contrôle ajouté au build. Non-régressions Employés/Recrutement/Paie réussies ; seules les commandes du guide sont ajoutées à la boucle clavier mobile, exception précisément normalisée dans le garde-fou de coquille. Revue visuelle réelle encore attendue ; aucun navigateur lancé.

**Périmètre confirmé par l’utilisateur :** les trois orientations suffisent pour l’instant ; les autres viendront plus tard. Feu vert reçu pour l’aide et le chat connecté, livrés dans le lot ci-dessous. La revue visuelle générale reste distincte. Le mode externe C2 reste conditionné à la licence et aux tests de confidentialité.

## 13. Aide et chat connecté — 19 novembre 2026

**Mise à jour suivante — connecteurs :** premier lot borné GPT/Claude/Gemini/Mistral livré sur feu vert utilisateur. Conversation présentée en fil avec accueil et trois questions compactes. Paramètres/licence/test fictif superadmin reliés ; le modèle sélectionne uniquement des phrases vérifiées, sans recevoir les données RH ou la question libre. Repli intégré et quotas conservés. Suggestions de fonctionnalités et retours d'expérience désormais reçus comme conversations Support (`SUGGESTION` / `FEEDBACK`). Détails, activation et limites : [ASSISTANT-MODELS.md](../../../backend/docs/ASSISTANT-MODELS.md). C2 complet, rédaction libre et mémoire contextuelle restent à réaliser ; aucune clé réelle testée.

**Mise à jour suivante :** l’aide et l’assistant ont désormais des accès et fenêtres distincts. C1 et le premier outil d’effectifs sont décrits dans [ASSISTANT-C1.md](ASSISTANT-C1.md), qui remplace les indications « C1 à venir » ci-dessous.

**Décision utilisateur suivante, 19 novembre :** fenêtres centrées et conversation, support humain connecté et rôle SUPPORT créé par le superadmin, puis outils d’analyse. Réalisation et limites : [SUPPORT-ANALYSES.md](SUPPORT-ANALYSES.md). Ce document remplace les descriptions de tiroir latéral et de support limité à Contact ci-dessous. Suggestions de fonctionnalités et retours produit demandés pour le dernier lot, après le contrôle final.

- Panneau Assistant, trois onglets : Aide (recherche, douze articles filtrés par rôle et les trois guides), Conversation (suggestions et réponse SSE), Historique privé (relecture, suppression confirmée, avis utile/inutile). Tiroir sur bureau, plein écran mobile ; accès mobile par le menu du compte. États de chargement/erreur/interruption explicites.
- Back Nest/Prisma réellement relié : capacités, aide/suggestions, chat, conversations et avis. Résolution locale à partir des articles versionnés ; pas de fournisseur IA, pas d’accès aux salaires. Quatre-vingt-dix questions de référence ; toute analyse ou question non couverte est refusée ou précisée par suggestions.
- Historique lié à l’utilisateur ET l’entreprise : les textes libres sont remplacés par des questions canoniques, sans nom ni montant saisi. Conversation privée, expiration par défaut à quatre-vingt-dix jours et purge ; départ déclaré ou compte supprimé coupe l’accès. Questions bornées, débit et doublons contrôlés côté serveur. Un changement d’entreprise ferme le panneau et annule le flux ; réponses tardives ignorées.
- Interrupteurs serveur audités et réservés au super admin : OFF/INTEGRE, guides et guides désactivés, durée de conservation, interdiction du chat par entreprise. La politique des guides est reliée au moteur ; OFF conserve les guides autorisés. Aucun écran du cabinet/super admin modifié. IA_AVANCEE refusé par validation.
- **Validation :** 63 contrôles HTTP réels sur PostgreSQL avec JWT/cookies et l’adaptateur front ; corpus de 90 questions ; SSE fractionné/UTF-8, interruptions, vues, changement d’identité/politique, confidentialité et non-régressions Paie/Guides réussis. Types front, compilation back et présence du catalogue dans les fichiers compilés vérifiés. Audit inchangé : 8 165 palette, 1 438 hex, 375 emojis. Aucun navigateur lancé ; revue visuelle utilisateur attendue.
- Migration additive `20261119010000_assistant_help` appliquée localement seulement. Démo locale conservée, adaptateur d’aide persistant séparé ; le vrai HTTP a été testé indépendamment de cette démo. Détails des routes, réglages, tests et déploiement : [documentation back](../../../backend/docs/ASSISTANT.md).

**Lot B livré ; socle de chat et d’interrupteurs de C1 seulement.** Restent : écran super admin de ces réglages, quotas d’analyses par forfait et premiers outils chiffrés (lecture seule, tests outil par outil). Les capacités déclarent `analysisAvailable=false`, compteurs `null` ; aucun quota ni résultat d’analyse n’est simulé. Support via Contact existant en attendant le numéro WhatsApp validé. Les autres guides, les variantes PME/cabinet, les modèles externes et la pseudonymisation restent hors de ce lot.
