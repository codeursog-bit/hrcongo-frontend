// ============================================================================
// 📁 lib/payroll-journal-pdf.ts
// ✅ Téléchargement PDF du journal de paie — A4 PAYSAGE, UNE PAGE PDF PAR PAGE
//    DU JOURNAL (chaque bloc [data-journal-page] est capturé séparément →
//    aucune ligne coupée en deux).
//    Netteté : capture à l'échelle 3 + JPEG 0,97. Pour un PDF 100 % vectoriel
//    (texte sélectionnable), utiliser « Imprimer » puis « Enregistrer au
//    format PDF ».
//    Même mécanique que lib/report-print.ts (html2canvas + jsPDF chargés à la
//    demande) — aucune nouvelle dépendance.
// ============================================================================

export async function downloadJournalPDF(rootId: string, filename: string): Promise<void> {
  const root = document.getElementById(rootId);
  if (!root) { alert('Impossible de générer le PDF : journal introuvable.'); return; }

  const pages = Array.from(root.querySelectorAll<HTMLElement>('[data-journal-page]'));
  if (pages.length === 0) { alert('Impossible de générer le PDF : aucune page.'); return; }

  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:297mm;background:#fff;z-index:-1;overflow:visible;';
  document.body.appendChild(container);

  try {
    // Les polices (Calibri/Carlito) et le logo doivent être prêts avant la capture
    if ((document as any).fonts?.ready) await (document as any).fonts.ready;

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < pages.length; i++) {
      const clone = pages[i].cloneNode(true) as HTMLElement;
      clone.style.pageBreakAfter = 'auto';
      container.innerHTML = '';
      container.appendChild(clone);
      await new Promise((r) => setTimeout(r, 150));

      const canvas = await html2canvas(clone, {
        scale: 3, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false,
        width: clone.scrollWidth || clone.offsetWidth, height: clone.scrollHeight || clone.offsetHeight,
      });

      const ratio = canvas.width / canvas.height;
      let w = pdfW;
      let h = pdfW / ratio;
      if (h > pdfH) { h = pdfH; w = pdfH * ratio; } // jamais de débordement
      if (i > 0) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.97), 'JPEG', (pdfW - w) / 2, 0, w, h, '', 'FAST');
    }

    pdf.save(filename);
  } catch (err) {
    console.error('[payroll-journal-pdf] Erreur génération PDF:', err);
    alert("Erreur lors de la génération du PDF. Essayez « Imprimer » puis « Enregistrer au format PDF ».");
  } finally {
    if (document.body.contains(container)) document.body.removeChild(container);
  }
}