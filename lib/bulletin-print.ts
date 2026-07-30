// ============================================================================
// lib/bulletin-print.ts
// ✅ printBulletin      — iframe isolé → preview navigateur correcte
// ✅ downloadBulletinPDF — html2canvas + jsPDF fiable
// ✅ Détection robuste : id explicite → data-bulletin-root → fallback ids
// ============================================================================

// Tous les ids possibles de bulletins dans le DOM
const BULLETIN_IDS = [
  'bulletin-root',
  'bulletin-corp-root',
  'bul-admin-root',
  'bul-wrap',        // BulletinRendererDefault
  'bul-default',
];

/**
 * Trouve le div bulletin dans le DOM.
 * Ordre : id explicite → data-bulletin-root → liste des ids connus
 */
function findBulletinElement(bulletinElementId?: string): HTMLElement | null {
  // 1. Id explicite passé en paramètre
  if (bulletinElementId) {
    const el = document.getElementById(bulletinElementId);
    if (el) return el;
  }

  // 2. Attribut data-bulletin-root (BulletinRendererDefault v8+)
  const byAttr = document.querySelector<HTMLElement>('[data-bulletin-root="true"]');
  if (byAttr) return byAttr;

  // 3. Fallback : chercher parmi tous les ids connus
  for (const id of BULLETIN_IDS) {
    const el = document.getElementById(id);
    if (el) return el;
  }

  return null;
}

// ============================================================================
// IMPRESSION
// ============================================================================

/**
 * Impression native via iframe isolé.
 * Seul le bulletin s'affiche dans la preview — sidebar et UI masquées.
 */
export function printBulletin(bulletinElementId?: string) {
  const el = findBulletinElement(bulletinElementId);
  if (!el) { window.print(); return; }

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;visibility:hidden;';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); window.print(); return; }

  const styleLinks   = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.outerHTML).join('\n');
  const styleInlines = Array.from(document.querySelectorAll('style')).map(s => `<style>${s.innerHTML}</style>`).join('\n');

  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
${styleLinks}
${styleInlines}
<style>
  @page { size: A4 portrait; margin: 8mm 6mm; }
  html, body {
    margin: 0; padding: 0;
    background: #fff;
    font-family: Arial, Helvetica, sans-serif;
  }
  /* Forcer light mode — dark mode app ne doit pas passer */
  * { color-scheme: light !important; }
  /* Masquer tout sauf le bulletin */
  body > *:not(#bul-print-target) { display: none !important; }
  #bul-print-target {
    width: 210mm !important;
    margin: 0 auto !important;
    background: #fff !important;
  }
  /* Masquer mentions légales */
  .bul-legal, .bulletin-legal, .adm-legal, .bulletin-legal-corp { display: none !important; }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
</style>
</head><body>
<div id="bul-print-target">${el.outerHTML}</div>
</body></html>`);
  doc.close();

  const win = iframe.contentWindow;
  if (!win) { document.body.removeChild(iframe); window.print(); return; }

  const doPrint = () => {
    try { win.focus(); win.print(); } catch { window.print(); }
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 1500);
  };

  if (doc.readyState === 'complete') setTimeout(doPrint, 300);
  else {
    win.addEventListener('load', () => setTimeout(doPrint, 300), { once: true });
    setTimeout(doPrint, 1500);
  }
}

// ============================================================================
// TÉLÉCHARGEMENT PDF
// ============================================================================

/**
 * Téléchargement PDF — html2canvas + jsPDF.
 * Clone dans un div temporaire visible hors écran (fix scrollHeight=0).
 */
export async function downloadBulletinPDF(
  bulletinElementId: string,
  filename: string,
): Promise<void> {
  const el = findBulletinElement(bulletinElementId);
  if (!el) {
    console.error('[bulletin-print] Aucun div bulletin trouvé. Ids cherchés:', BULLETIN_IDS);
    alert('Impossible de générer le PDF : bulletin non trouvé.');
    return;
  }

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // Conteneur temporaire visible hors écran — évite scrollHeight=0
  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'left:-9999px',
    'top:0',
    'width:210mm',
    'background:#fff',
    'z-index:-1',
    'overflow:visible',
  ].join(';');

  const clone = el.cloneNode(true) as HTMLElement;

  // Forcer dimensions A4 sur le clone
  clone.style.cssText = [
    'width:210mm',
    'min-height:297mm',
    'padding:0',
    'margin:0',
    'box-shadow:none',
    'border:none',
    'background:#fff',
    'box-sizing:border-box',
    'color-scheme:light',
  ].join(';');

  // Masquer mentions légales dans le clone
  clone.querySelectorAll<HTMLElement>(
    '.bul-legal,.bulletin-legal,.adm-legal,.bulletin-legal-corp'
  ).forEach(n => { n.style.display = 'none'; });

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    // Laisser le DOM se rendre
    await new Promise(r => setTimeout(r, 200));

    // Dimensions réelles — px à 96dpi : 210mm ≈ 794px, 297mm ≈ 1123px
    const W = clone.scrollWidth  || clone.offsetWidth  || 794;
    const H = clone.scrollHeight || clone.offsetHeight || 1123;

    const canvas = await html2canvas(clone, {
      scale:           2,        // haute résolution
      useCORS:         true,
      allowTaint:      true,
      backgroundColor: '#ffffff',
      logging:         false,
      width:           W,
      height:          H,
      windowWidth:     794,
      windowHeight:    1123,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW    = pdf.internal.pageSize.getWidth();   // 210mm
    const pdfH    = pdf.internal.pageSize.getHeight();  // 297mm

    // Ratio image → dimensions PDF
    const imgRatio = canvas.width / canvas.height;
    const finalW   = pdfW;
    const finalH   = pdfW / imgRatio;

    if (finalH > pdfH) {
      // Bulletin multi-page (rare mais géré)
      let posY = 0;
      while (posY < finalH) {
        if (posY > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -posY, finalW, finalH, '', 'FAST');
        posY += pdfH;
      }
    } else {
      pdf.addImage(imgData, 'JPEG', 0, 0, finalW, finalH, '', 'FAST');
    }

    pdf.save(filename);
  } catch (err) {
    console.error('[bulletin-print] Erreur génération PDF:', err);
    alert('Erreur lors de la génération du PDF. Essayez l\'impression navigateur.');
  } finally {
    // Toujours nettoyer le DOM
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

// ============================================================================
// HELPER
// ============================================================================

/**
 * Retourne l'id du div racine selon le templateId.
 * Avec le nouveau renderer default, on passe par data-bulletin-root
 * donc n'importe quel id fonctionne — on garde pour compatibilité.
 */
export function getBulletinRootId(templateId?: string): string {
  if (templateId === 'corporate') return 'bulletin-corp-root';
  if (templateId === 'admin')     return 'bul-admin-root';
  return 'bul-wrap'; // BulletinRendererDefault
}