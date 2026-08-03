// ============================================================================
// 📁 lib/leave-print.ts
// ✅ Même technique éprouvée que absence-print.ts, paramétrée par élément —
//    sert à la fois pour le formulaire de demande et la lettre d'autorisation.
// ============================================================================

function findElement(elementId: string): HTMLElement | null {
  return document.getElementById(elementId);
}

export function printLeaveDocument(elementId: string, orientation: 'portrait' | 'landscape' = 'portrait') {
  const el = findElement(elementId);
  if (!el) { window.print(); return; }

  const pageWidth = orientation === 'landscape' ? '297mm' : '210mm';
  const pageHeight = orientation === 'landscape' ? '210mm' : '297mm';

  const iframe = document.createElement('iframe');
  iframe.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${pageWidth};height:${pageHeight};border:none;visibility:hidden;`;
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
  @page { size: A4 ${orientation}; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: Arial, Helvetica, sans-serif; }
  * { color-scheme: light !important; }
  body > *:not(#leave-print-target) { display: none !important; }
  #leave-print-target { width: ${pageWidth} !important; margin: 0 auto !important; background: #fff !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
</style>
</head><body>
<div id="leave-print-target">${el.outerHTML}</div>
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

export async function downloadLeaveDocumentPDF(elementId: string, filename: string, orientation: 'portrait' | 'landscape' = 'portrait'): Promise<void> {
  const el = findElement(elementId);
  if (!el) { alert('Impossible de générer le PDF : document introuvable.'); return; }

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const isLandscape = orientation === 'landscape';
  const pageWidthMm = isLandscape ? 297 : 210;
  const pageHeightMm = isLandscape ? 210 : 297;
  // Correspondance mm → px à 96dpi (utilisée par html2canvas/windowWidth)
  const pagePxWidth = Math.round(pageWidthMm * 3.7795);
  const pagePxHeight = Math.round(pageHeightMm * 3.7795);

  const container = document.createElement('div');
  container.style.cssText = `position:fixed;left:-9999px;top:0;width:${pageWidthMm}mm;background:#fff;z-index:-1;overflow:visible;`;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.cssText = `width:${pageWidthMm}mm;min-height:${pageHeightMm}mm;padding:${isLandscape ? '10mm 12mm' : '14mm 16mm'};margin:0;box-shadow:none;border:none;background:#fff;box-sizing:border-box;color-scheme:light;`;

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await new Promise(r => setTimeout(r, 200));

    const W = clone.scrollWidth  || clone.offsetWidth  || pagePxWidth;
    const H = clone.scrollHeight || clone.offsetHeight || pagePxHeight;

    // scale 2.5 : plus net qu'avant (2), important sur un tableau large avec
    // beaucoup de texte serré — évite le flou à l'impression/zoom.
    const canvas = await html2canvas(clone, { scale: 2.5, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false, width: W, height: H, windowWidth: pagePxWidth, windowHeight: pagePxHeight });
    const imgData = canvas.toDataURL('image/jpeg', 0.97);
    const pdf     = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const pdfW    = pdf.internal.pageSize.getWidth();
    const pdfH    = pdf.internal.pageSize.getHeight();

    const imgRatio = canvas.width / canvas.height;
    const finalW   = pdfW;
    const finalH   = pdfW / imgRatio;

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
  } catch (err) {
    console.error('[leave-print] Erreur génération PDF:', err);
    alert("Erreur lors de la génération du PDF. Essayez l'impression navigateur.");
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container);
  }
}