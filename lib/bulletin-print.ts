// ============================================================================
// lib/bulletin-print.ts
// ✅ downloadBulletinPDF  → vrai PDF téléchargé via html2canvas + jsPDF
//    — AUCUN dialogue d'impression, fichier sauvegardé directement
// ✅ printBulletin        → impression native window.print()
// ============================================================================

/**
 * Impression native — ouvre la boîte d'impression du navigateur.
 * Le CSS @media print dans chaque renderer gère le A4, les marges, le masquage UI.
 */
export function printBulletin() {
  window.print();
}

/**
 * Téléchargement PDF réel — html2canvas + jsPDF.
 * Aucun dialogue d'impression. Le fichier est téléchargé directement.
 *
 * @param bulletinElementId  id du div racine du renderer (ex: "bulletin-root")
 * @param filename           nom du fichier .pdf (ex: "bulletin-mai-2026.pdf")
 */
export async function downloadBulletinPDF(
  bulletinElementId: string,
  filename: string
): Promise<void> {
  const el = document.getElementById(bulletinElementId);
  if (!el) {
    console.error(`[bulletin-print] Élément #${bulletinElementId} introuvable`);
    return;
  }

  // Import dynamique pour ne pas alourdir le bundle initial
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // A4 en pixels à 150 DPI (bon compromis qualité/performance)
  // 210mm × 297mm = 1240 × 1754 px à 150dpi
  const A4_W_PX = 1240;
  const A4_H_PX = 1754;

  // Capturer le bulletin en canvas haute résolution
  const canvas = await html2canvas(el, {
    scale:            2,           // 2× pour la netteté
    useCORS:          true,        // autorise les images cross-origin (logo)
    allowTaint:       true,
    backgroundColor:  '#ffffff',
    logging:          false,
    width:            el.scrollWidth,
    height:           el.scrollHeight,
    windowWidth:      el.scrollWidth,
    windowHeight:     el.scrollHeight,
    onclone: (doc) => {
      // Dans le clone utilisé par html2canvas, forcer fond blanc
      const root = doc.getElementById(bulletinElementId);
      if (root) {
        root.style.background = '#fff';
        root.style.width      = '210mm';
      }
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  // Créer le PDF A4 portrait
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit:        'mm',
    format:      'a4',
  });

  const pdfW = pdf.internal.pageSize.getWidth();   // 210mm
  const pdfH = pdf.internal.pageSize.getHeight();  // 297mm

  // Calculer les dimensions de l'image pour qu'elle remplisse le A4
  const imgW  = canvas.width;
  const imgH  = canvas.height;
  const ratio = imgW / imgH;

  let finalW = pdfW;
  let finalH = pdfW / ratio;

  // Si le contenu dépasse une page → paginer
  if (finalH > pdfH) {
    let posY = 0;
    while (posY < finalH) {
      if (posY > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -posY, finalW, finalH, '', 'FAST');
      posY += pdfH;
    }
  } else {
    // Une seule page — centrer verticalement
    pdf.addImage(imgData, 'JPEG', 0, 0, finalW, finalH, '', 'FAST');
  }

  // Télécharger directement — AUCUN dialogue
  pdf.save(filename);
}

/**
 * Retourne l'id du div racine selon le templateId
 */
export function getBulletinRootId(templateId?: string): string {
  if (templateId === 'corporate') return 'bulletin-corp-root';
  if (templateId === 'admin')     return 'bul-admin-root';
  return 'bulletin-root';
}