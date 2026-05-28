// ============================================================================
// lib/bulletin-print.ts
// Utilitaires impression & téléchargement PDF partagés entre les 2 pages
// ============================================================================

/**
 * Ouvre la boîte d'impression native du navigateur.
 * Le CSS @media print dans chaque renderer gère le reste (A4, marges, masquage).
 */
export function printBulletin() {
  window.print();
}

/**
 * Télécharge le bulletin en PDF sans boîte de dialogue via une iframe cachée.
 * - Copie le contenu HTML du bulletin dans une iframe
 * - Lance window.print() dans l'iframe → le navigateur propose "Enregistrer en PDF"
 * - Compatible Chrome, Edge, Firefox (natif)
 *
 * @param elementId  — id du div qui contient le bulletin (ex: "bulletin-root")
 * @param filename   — nom du fichier suggéré (ex: "bulletin-mai-2026.pdf")
 */
export function downloadBulletinPDF(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) { window.print(); return; }

  // Récupérer tous les styles de la page
  const styles = Array.from(document.styleSheets)
    .map(ss => {
      try {
        return Array.from(ss.cssRules).map(r => r.cssText).join('\n');
      } catch { return ''; }
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>${filename}</title>
  <style>
    ${styles}
    @page { size: A4 portrait; margin: 0; }
    @media print {
      html, body { margin:0; padding:0; background:#fff; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#fff;">
  ${el.outerHTML}
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) { window.print(); document.body.removeChild(iframe); return; }

  doc.open();
  doc.write(html);
  doc.close();

  // Attendre le rendu puis imprimer
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch { window.print(); }
      // Nettoyer après fermeture de la boîte
      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch {}
      }, 2000);
    }, 400);
  };
}

/**
 * Retourne le bon elementId selon le templateId actif
 */
export function getBulletinRootId(templateId?: string): string {
  if (templateId === 'corporate') return 'bulletin-corp-root';
  if (templateId === 'admin')     return 'bul-admin-root';
  return 'bulletin-root'; // default
}