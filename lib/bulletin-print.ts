// ============================================================================
// lib/bulletin-print.ts
// ✅ printBulletin  — iframe isolé → preview navigateur correcte
// ✅ downloadBulletinPDF — html2canvas + jsPDF fiable (fix scrollHeight=0)
// ============================================================================

/**
 * Impression native via iframe isolé.
 * Seul le bulletin s'affiche dans la preview — sidebar et UI masquées.
 */
export function printBulletin(bulletinElementId = 'bulletin-root') {
  const el = document.getElementById(bulletinElementId);
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
  @page { size: A4 portrait; margin: 8mm; }
  html,body { margin:0;padding:0;background:#fff;font-family:"Helvetica Neue",Arial,sans-serif; }
  #${bulletinElementId} {
    width:194mm !important;
    padding:0 !important;
    margin:0 !important;
    box-shadow:none !important;
    border:none !important;
  }
  .bul-legal,.bulletin-legal,.adm-legal,.bulletin-legal-corp { display:none !important; }
  * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
</style>
</head><body>${el.outerHTML}</body></html>`);
  doc.close();

  const win = iframe.contentWindow;
  if (!win) { document.body.removeChild(iframe); window.print(); return; }

  const doPrint = () => {
    try { win.focus(); win.print(); } catch { window.print(); }
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1500);
  };

  if (doc.readyState === 'complete') setTimeout(doPrint, 250);
  else { win.addEventListener('load', () => setTimeout(doPrint, 250), { once: true }); setTimeout(doPrint, 1200); }
}

/**
 * Téléchargement PDF — html2canvas + jsPDF.
 *
 * FIX scrollHeight=0 : on clone l'élément dans un div visible temporaire
 * avant de capturer, ce qui garantit les dimensions correctes même en modal.
 */
export async function downloadBulletinPDF(bulletinElementId: string, filename: string): Promise<void> {
  const el = document.getElementById(bulletinElementId);
  if (!el) {
    console.error(`[bulletin-print] #${bulletinElementId} introuvable`);
    // Debug : lister les ids disponibles
    const ids = Array.from(document.querySelectorAll('[id]')).map(e => e.id).filter(id => id.includes('bulletin') || id.includes('bul-'));
    console.info('[bulletin-print] Ids bulletin trouvés:', ids);
    return;
  }

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // Créer un conteneur temporaire visible (hors écran) pour éviter scrollHeight=0
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;background:#fff;z-index:-1;';
  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.width       = '210mm';
  clone.style.minHeight   = '297mm';
  clone.style.padding     = '8mm 10mm';
  clone.style.boxSizing   = 'border-box';
  clone.style.boxShadow   = 'none';
  clone.style.border      = 'none';
  clone.style.margin      = '0';
  clone.style.background  = '#fff';
  // Masquer les mentions légales
  clone.querySelectorAll<HTMLElement>('.bul-legal,.bulletin-legal,.adm-legal,.bulletin-legal-corp')
    .forEach(n => { n.style.display = 'none'; });
  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    // Petite pause pour que le DOM soit rendu
    await new Promise(r => setTimeout(r, 100));

    const canvas = await html2canvas(clone, {
      scale:            2,          // haute résolution
      useCORS:          true,
      allowTaint:       true,
      backgroundColor:  '#ffffff',
      logging:          false,
      width:            clone.scrollWidth  || 794,
      height:           clone.scrollHeight || 1123,
      windowWidth:      794,
      windowHeight:     1123,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW    = pdf.internal.pageSize.getWidth();   // 210mm
    const pdfH    = pdf.internal.pageSize.getHeight();  // 297mm

    const ratio  = canvas.width / canvas.height;
    const finalW = pdfW;
    const finalH = pdfW / ratio;

    if (finalH > pdfH) {
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
  } finally {
    // Toujours nettoyer
    document.body.removeChild(container);
  }
}

/**
 * Retourne l'id du div racine selon le templateId
 */
export function getBulletinRootId(templateId?: string): string {
  if (templateId === 'corporate') return 'bulletin-corp-root';
  if (templateId === 'admin')     return 'bul-admin-root';
  return 'bulletin-root';
}