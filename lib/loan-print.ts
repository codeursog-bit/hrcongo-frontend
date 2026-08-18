// ============================================================================
// 📁 lib/loan-print.ts
// ✅ Même technique éprouvée que absence-print.ts / leave-print.ts.
// ============================================================================

function findElement(elementId: string): HTMLElement | null {
  return document.getElementById(elementId);
}

export function printLoanDocument(elementId: string) {
  const el = findElement(elementId);
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
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; }
  * { color-scheme: light !important; }
  body > *:not(#loan-print-target) { display: none !important; }
  #loan-print-target {
    width: 210mm !important; margin: 0 auto !important; background: #fff !important;
    /* ✅ CORRECTIF : garantit UNE seule page à l'impression navigateur —
       le téléchargement PDF avait déjà ce garde-fou (mise à l'échelle),
       l'impression native window.print() n'en avait aucun : le moindre
       dépassement de 297mm produisait une 2e page quasi vide. */
    height: 297mm !important; overflow: hidden !important;
  }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
</style>
</head><body>
<div id="loan-print-target">${el.outerHTML}</div>
</body></html>`);
  doc.close();

  const win = iframe.contentWindow;
  if (!win) { document.body.removeChild(iframe); window.print(); return; }

  const doPrint = () => {
    try { win.focus(); win.print(); } catch { window.print(); }
    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1500);
  };

  if (doc.readyState === 'complete') setTimeout(doPrint, 300);
  else {
    win.addEventListener('load', () => setTimeout(doPrint, 300), { once: true });
    setTimeout(doPrint, 1500);
  }
}

export async function downloadLoanDocumentPDF(elementId: string, filename: string): Promise<void> {
  const el = findElement(elementId);
  if (!el) { alert('Impossible de générer le PDF : document introuvable.'); return; }

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:210mm;background:#fff;z-index:-1;overflow:visible;';

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.cssText = 'width:210mm;min-height:297mm;padding:14mm 16mm;margin:0;box-shadow:none;border:none;background:#fff;box-sizing:border-box;color-scheme:light;';

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await new Promise(r => setTimeout(r, 200));
    const W = clone.scrollWidth  || clone.offsetWidth  || 794;
    const H = clone.scrollHeight || clone.offsetHeight || 1123;

    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false, width: W, height: H, windowWidth: 794, windowHeight: 1123 });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const pdf     = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfW    = pdf.internal.pageSize.getWidth();
    const pdfH    = pdf.internal.pageSize.getHeight();
    const imgRatio = canvas.width / canvas.height;

    // ✅ CORRECTIF : ces formulaires tiennent sur UNE page — l'ancienne
    // logique paginait dès que le contenu dépassait 297mm de la moindre
    // fraction de mm (marges d'arrondi, cachet/logo agrandis, etc.), ce qui
    // produisait une 2e page quasi vide. On ajuste maintenant l'échelle pour
    // TOUJOURS tenir sur une seule page — au pire une réduction visuelle
    // à peine perceptible, jamais une 2e page.
    let finalW = pdfW;
    let finalH = pdfW / imgRatio;
    if (finalH > pdfH) {
      finalH = pdfH;
      finalW = pdfH * imgRatio;
    }
    const offsetX = (pdfW - finalW) / 2;
    pdf.addImage(imgData, 'JPEG', offsetX, 0, finalW, finalH, '', 'FAST');

    pdf.save(filename);
  } catch (err) {
    console.error('[loan-print] Erreur génération PDF:', err);
    alert("Erreur lors de la génération du PDF. Essayez l'impression navigateur.");
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container);
  }
}