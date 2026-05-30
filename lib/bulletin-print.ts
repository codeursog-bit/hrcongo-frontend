// ============================================================================
// lib/bulletin-print.ts
//
// ✅ printBulletin  — iframe isolé → preview navigateur correcte
// ✅ downloadBulletinPDF — html2canvas + jsPDF, téléchargement direct
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

  // Récupérer tous les styles de la page hôte
  const styleLinks   = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.outerHTML).join('\n');
  const styleInlines = Array.from(document.querySelectorAll('style')).map(s => `<style>${s.innerHTML}</style>`).join('\n');

  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
${styleLinks}
${styleInlines}
<style>
  @page { size: A4 portrait; margin: 8mm; }
  html,body { margin:0;padding:0;background:#fff; font-family:"Helvetica Neue",Arial,sans-serif; }
  #${bulletinElementId} {
    width:194mm !important; padding:0 !important; margin:0 !important;
    box-shadow:none !important; border:none !important;
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
 * Téléchargement PDF — html2canvas + jsPDF, aucun dialogue.
 */
export async function downloadBulletinPDF(bulletinElementId: string, filename: string): Promise<void> {
  const el = document.getElementById(bulletinElementId);
  if (!el) { console.error(`[bulletin-print] #${bulletinElementId} introuvable`); return; }

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'), import('jspdf'),
  ]);

  const canvas = await html2canvas(el, {
    scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#fff', logging: false,
    width: el.scrollWidth, height: el.scrollHeight,
    windowWidth: el.scrollWidth, windowHeight: el.scrollHeight,
    onclone: (d) => {
      const r = d.getElementById(bulletinElementId);
      if (r) { r.style.background = '#fff'; r.style.width = '210mm'; r.style.boxShadow = 'none'; }
      d.querySelectorAll<HTMLElement>('.bul-legal,.bulletin-legal,.adm-legal,.bulletin-legal-corp')
       .forEach(n => { n.style.display = 'none'; });
    },
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfW = pdf.internal.pageSize.getWidth();
  const finalH = pdfW / (canvas.width / canvas.height);

  if (finalH > pdf.internal.pageSize.getHeight()) {
    let posY = 0;
    while (posY < finalH) {
      if (posY > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, -posY, pdfW, finalH, '', 'FAST');
      posY += pdf.internal.pageSize.getHeight();
    }
  } else {
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, finalH, '', 'FAST');
  }
  pdf.save(filename);
}

export function getBulletinRootId(templateId?: string): string {
  if (templateId === 'corporate') return 'bulletin-corp-root';
  if (templateId === 'admin')     return 'bul-admin-root';
  return 'bulletin-root';
}