# Captures du produit — 24 novembre 2026

Captures réelles du front local, en mode démo : aucun compte ni document client.

| Fichier | Écran source |
|---|---|
| dashboard.webp | /dashboard, Pilotage RH |
| employes.webp | /employes, liste par défaut |
| paie.webp | /paie |
| bulletin.webp | /paie/demo-payroll-0, document complet sans modification du modèle |

Régénération : lancer `dev:check` avec le mode démo, puis `node scripts/capture-public-product.cjs` (Playwright et Chromium requis). `KONZA_TEST_PLAYWRIGHT` permet d'utiliser une installation isolée ; `KONZA_CHROME` désigne le binaire Chrome installé. Sortie WebP, capture à densité 2 et viewport 1440 × 1120. Les rappels sont fermés par leur bouton normal ; les données et les écrans ne sont pas recomposés.

## Captures fournies par l’utilisateur

`dashboard-fourni.png` et `pointeuse-mobile-fournie.png` sont les deux captures fournies le 24 novembre. Elles sont utilisées telles quelles, sans recomposition. Le dashboard fourni remplace la capture de démonstration sur la vitrine et l’authentification ; la pointeuse illustre l’accès mobile. Le script de régénération ne remplace pas ces deux fichiers.
