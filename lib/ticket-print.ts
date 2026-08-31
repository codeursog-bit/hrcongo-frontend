// ============================================================================
// 📁 lib/ticket-print.ts
// ✅ Même technique que absence-print.ts / report-print.ts, adaptée au petit
//    format du ticket de permission (80mm, comme un reçu de caisse).
//
// 🔧 Corrections apportées :
//    1. Le logo entreprise est hébergé sur Cloudinary (URL absolue,
//       cf. companies.service.ts → uploadPublicFile) — donc pas un souci
//       d'URL relative. Le <base href> ci-dessous reste ajouté par
//       robustesse générale (au cas où une feuille de style copiée référence
//       une police ou une image en chemin relatif), mais le vrai bug logo
//       était ailleurs :
//    2. Pour le PDF (downloadTicketPDF, via html2canvas) : une image
//       cross-origin (Cloudinary) ne peut être capturée en pixels que si
//       elle est chargée en mode crossOrigin="anonymous". Si le navigateur
//       l'avait déjà en cache sans ce mode, html2canvas la rend vide/blanche
//       silencieusement. On force donc un rechargement CORS + cache-bust et
//       on attend avant de capturer (voir plus bas).
//    3. Rendu noir & blanc renforcé : le logo (et toute image) est passé en
//       niveaux de gris + contraste à l'impression, pour un rendu net sur
//       une imprimante thermique noir & blanc.
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

  // ✅ Base absolue pour que les URLs relatives (logo, etc.) se résolvent correctement
  const baseHref = window.location.origin + '/';

  doc.open();
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<base href="${baseHref}">
${styleLinks}
${styleInlines}
<style>
  @page { size: 80mm auto; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: 'Courier New', Courier, monospace; }
  * { color-scheme: light !important; }
  body > *:not(#ticket-print-target) { display: none !important; }
  #ticket-print-target { width: 80mm !important; margin: 0 auto !important; background: #fff !important; }
  /* ✅ Impression noir & blanc fiable : on NE force PAS toutes les couleurs
     en noir (ça casserait un badge à fond noir/texte blanc) — on s'assure
     juste que les fonds de couleur définis par le composant s'impriment
     réellement (beaucoup de navigateurs les ignorent par défaut), et que
     les images ressortent nettes en niveaux de gris. */
  #ticket-print-target img {
    filter: grayscale(1) contrast(1.35) !important;
    -webkit-print-color-adjust: exact !important;
  }
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
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
    // ✅ Le logo est hébergé sur Cloudinary (URL absolue) — donc PAS un
    //    problème d'URL relative ici. Le vrai problème pour le PDF
    //    (html2canvas) est le CORS : html2canvas ne peut lire les pixels
    //    d'une image cross-origin que si elle est chargée en mode
    //    crossOrigin="anonymous". Si l'image était déjà en cache navigateur
    //    sans ce mode (affichée ailleurs dans l'app sans crossOrigin),
    //    html2canvas la laisse vide/blanche.
    //    → on force un rechargement CORS avec cache-bust, et on attend le
    //    chargement avant de capturer.
    const logoImgs = Array.from(clone.querySelectorAll<HTMLImageElement>('img'));
    await Promise.all(logoImgs.map((img) => new Promise<void>((resolve) => {
      img.style.setProperty('filter', 'grayscale(1) contrast(1.35)', 'important');
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve();
      img.onerror = () => resolve(); // on n'empêche jamais la génération du PDF si le logo échoue
      const src = img.getAttribute('src') || '';
      img.src = src + (src.includes('?') ? '&' : '?') + 'cb=' + Date.now();
      // filet de sécurité si onload/onerror ne se déclenchent jamais
      setTimeout(resolve, 2500);
    })));

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
