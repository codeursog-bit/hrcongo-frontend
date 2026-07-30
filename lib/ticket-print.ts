// ============================================================================
// 📁 lib/ticket-print.ts
// ✅ Même technique que absence-print.ts / report-print.ts, adaptée au petit
//    format du ticket de permission (80mm, comme un reçu de caisse).
// ============================================================================

function findElement(elementId: string): HTMLElement | null {
  return document.getElementById(elementId);
}

export function printTicket(elementId: string) {
  const el = findElement(elementId);
  if (!el) { window.print(); return; }

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:80mm;height:150mm;border:none;visibility:hidden;';
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
  @page { size: 80mm auto; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: 'Courier New', Courier, monospace; }
  * { color-scheme: light !important; }
  body > *:not(#ticket-print-target) { display: none !important; }
  #ticket-print-target { width: 80mm !important; margin: 0 auto !important; background: #fff !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
</style>
</head><body>
<div id="ticket-print-target">${el.outerHTML}</div>
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

export async function downloadTicketPDF(elementId: string, filename: string): Promise<void> {
  const el = findElement(elementId);
  if (!el) { alert('Impossible de générer le PDF : ticket introuvable.'); return; }

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:80mm;background:#fff;z-index:-1;overflow:visible;';

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.cssText = 'width:80mm;margin:0;box-shadow:none;background:#fff;box-sizing:border-box;color-scheme:light;';

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    await new Promise(r => setTimeout(r, 200));

    const W = clone.scrollWidth  || clone.offsetWidth;
    const H = clone.scrollHeight || clone.offsetHeight;

    const canvas = await html2canvas(clone, { scale: 3, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false, width: W, height: H });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    const pdfWmm = 80;
    const pdfHmm = (canvas.height / canvas.width) * pdfWmm;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfWmm, pdfHmm] });
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWmm, pdfHmm, '', 'FAST');
    pdf.save(filename);
  } catch (err) {
    console.error('[ticket-print] Erreur génération PDF:', err);
    alert("Erreur lors de la génération du PDF. Essayez l'impression navigateur.");
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container);
  }
}
