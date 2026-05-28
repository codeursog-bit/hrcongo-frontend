// ============================================================================
// lib/bulletin-print.ts
// Impression & téléchargement PDF — partagé entre les pages paie
// ============================================================================

/**
 * Impression native — ouvre la boîte d'impression du navigateur.
 * Le CSS @media print dans chaque renderer gère A4, marges, masquage UI.
 */
export function printBulletin() {
  window.print();
}

/**
 * Téléchargement PDF réel via l'API window.print() dans un contexte isolé.
 *
 * Stratégie : on crée un blob HTML complet avec le contenu du bulletin,
 * on l'ouvre dans un nouvel onglet configuré pour s'auto-imprimer et se fermer,
 * ce qui déclenche "Enregistrer en PDF" dans Chrome/Edge sans UI visible.
 *
 * Si le navigateur bloque les popups, on fallback sur window.print() normal.
 */
export function downloadBulletinPDF(
  bulletinElementId: string,
  filename: string
) {
  const el = document.getElementById(bulletinElementId);
  if (!el) {
    window.print();
    return;
  }

  // Collecter tous les styles inline + feuilles de style
  const styleSheetText = Array.from(document.styleSheets)
    .map(ss => {
      try {
        return Array.from(ss.cssRules)
          .map(r => r.cssText)
          .join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  // HTML complet du bulletin isolé
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${filename}</title>
  <style>
    ${styleSheetText}
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @page {
      size: A4 portrait;
      margin: 0;
    }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
${el.outerHTML}
<script>
  // Dès que le document est prêt, lancer l'impression
  window.addEventListener('load', function() {
    setTimeout(function() {
      window.print();
      // Fermer l'onglet après impression (marche dans Chrome/Edge)
      setTimeout(function() { window.close(); }, 500);
    }, 300);
  });
<\/script>
</body>
</html>`;

  // Créer un Blob et ouvrir dans un nouvel onglet
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank');

  if (!win) {
    // Popup bloqué → fallback impression normale
    URL.revokeObjectURL(url);
    window.print();
    return;
  }

  // Nettoyer l'URL après usage
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Retourne l'id du div racine du bulletin selon le templateId
 */
export function getBulletinRootId(templateId?: string): string {
  if (templateId === 'corporate') return 'bulletin-corp-root';
  if (templateId === 'admin')     return 'bul-admin-root';
  return 'bulletin-root';
}