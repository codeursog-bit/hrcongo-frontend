import type { CertificateRenderData } from './certificate-templates';

export function drawClassicCertificate(canvas: HTMLCanvasElement, data: CertificateRenderData) {
  canvas.width  = 1122;
  canvas.height = 794;
  const ctx = canvas.getContext('2d')!;

  // ── Fond ────────────────────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, 1122, 794);
  bg.addColorStop(0,   '#0c1426');
  bg.addColorStop(0.5, '#0f1e3d');
  bg.addColorStop(1,   '#0c1426');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1122, 794);

  // ── Motif géométrique fond ───────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.025)';
  ctx.lineWidth   = 1;
  for (let i = 0; i < 1122; i += 40) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 794); ctx.stroke();
  }
  for (let j = 0; j < 794; j += 40) {
    ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(1122, j); ctx.stroke();
  }

  // ── Bordure extérieure or ────────────────────────────────────────────────
  const borderGrad = ctx.createLinearGradient(0, 0, 1122, 0);
  borderGrad.addColorStop(0,   '#b8860b');
  borderGrad.addColorStop(0.5, '#ffd700');
  borderGrad.addColorStop(1,   '#b8860b');
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth   = 8;
  ctx.strokeRect(24, 24, 1074, 746);

  // ── Bordure intérieure fine ──────────────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,215,0,0.25)';
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(36, 36, 1050, 722);

  // ── Coins décoratifs ─────────────────────────────────────────────────────
  const corners = [[50,50],[1072,50],[50,744],[1072,744]];
  corners.forEach(([cx, cy]) => {
    ctx.strokeStyle = 'rgba(255,215,0,0.6)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,215,0,0.15)';
    ctx.fill();
  });

  // ── En-tête : République du Congo + entreprise ───────────────────────────
  ctx.fillStyle   = 'rgba(255,215,0,0.12)';
  ctx.fillRect(0, 60, 1122, 70);

  ctx.fillStyle   = 'rgba(255,215,0,0.8)';
  ctx.font        = 'bold 11px sans-serif';
  ctx.textAlign   = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText('RÉPUBLIQUE DU CONGO  •  CERTIFICAT OFFICIEL DE FORMATION PROFESSIONNELLE', 561, 100);
  ctx.letterSpacing = '0px';

  // ── Ligne décorative ─────────────────────────────────────────────────────
  const lineGrad = ctx.createLinearGradient(100, 0, 1022, 0);
  lineGrad.addColorStop(0,   'transparent');
  lineGrad.addColorStop(0.3, 'rgba(255,215,0,0.8)');
  lineGrad.addColorStop(0.7, 'rgba(255,215,0,0.8)');
  lineGrad.addColorStop(1,   'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(100, 142); ctx.lineTo(1022, 142); ctx.stroke();

  // ── Sceau central (cercle) ───────────────────────────────────────────────
  const sealGrad = ctx.createRadialGradient(561, 390, 20, 561, 390, 70);
  sealGrad.addColorStop(0,   'rgba(255,215,0,0.25)');
  sealGrad.addColorStop(1,   'rgba(255,215,0,0.03)');
  ctx.fillStyle = sealGrad;
  ctx.beginPath(); ctx.arc(561, 390, 70, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,215,0,0.35)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath(); ctx.arc(561, 390, 70, 0, Math.PI*2); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,215,0,0.15)';
  ctx.beginPath(); ctx.arc(561, 390, 80, 0, Math.PI*2); ctx.stroke();
  // Étoile au centre
  ctx.fillStyle = 'rgba(255,215,0,0.6)';
  ctx.font      = '32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★', 561, 403);

  // ── Texte principal ──────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(200,220,255,0.55)';
  ctx.font      = '13px serif';
  ctx.textAlign = 'center';
  ctx.fillText('Ce certificat est décerné à', 561, 178);

  // Nom employé
  ctx.fillStyle = '#ffffff';
  ctx.font      = 'bold 46px serif';
  ctx.fillText(data.employeeName, 561, 240);

  // Poste + département
  ctx.fillStyle = 'rgba(200,220,255,0.5)';
  ctx.font      = 'italic 14px serif';
  const posInfo = [data.position, data.department].filter(Boolean).join(' — ');
  if (posInfo) ctx.fillText(posInfo, 561, 268);

  // Ligne sous nom
  ctx.strokeStyle = 'rgba(255,215,0,0.3)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(200, 284); ctx.lineTo(922, 284); ctx.stroke();

  ctx.fillStyle = 'rgba(200,220,255,0.45)';
  ctx.font      = '13px serif';
  ctx.fillText('pour avoir complété avec succès la formation', 561, 318);

  // Titre formation
  ctx.fillStyle = '#7dd3fc';
  ctx.font      = 'bold 26px serif';
  let title = data.courseTitle;
  while (ctx.measureText(title).width > 860 && title.length > 10)
    title = title.slice(0,-4)+'...';
  ctx.fillText(title, 561, 362);

  // Durée + organisme
  const details = [
    data.durationHours ? `Durée : ${data.durationHours}h` : '',
    data.providerName  ? `Organisme : ${data.providerName}` : '',
  ].filter(Boolean).join('   •   ');
  if (details) {
    ctx.fillStyle = 'rgba(200,220,255,0.4)';
    ctx.font      = '12px serif';
    ctx.fillText(details, 561, 420);
  }

  // ── Mention (badge central) ──────────────────────────────────────────────
  const mentionColors: Record<string,string> = {
    'Satisfaisant': '#94a3b8',
    'Bien':         '#34d399',
    'Très Bien':    '#60a5fa',
    'Excellent':    '#fbbf24',
  };
  const mc = mentionColors[data.mention] ?? '#fbbf24';
  // Badge
  ctx.strokeStyle = mc;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  const bw = 200, bh = 38, bx = 561 - bw/2, by = 460;
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.stroke();
  ctx.fillStyle = mc + '18';
  ctx.fill();
  ctx.fillStyle = mc;
  ctx.font      = 'bold 15px sans-serif';
  ctx.fillText(`Mention : ${data.mention.toUpperCase()}`, 561, 484);

  // Note du valideur (si présente)
  if (data.validationNote) {
    ctx.fillStyle = 'rgba(200,220,255,0.35)';
    ctx.font      = 'italic 11px serif';
    ctx.fillText(`"${data.validationNote}"`, 561, 518);
  }

  // ── Ligne séparation bas ─────────────────────────────────────────────────
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(100, 548); ctx.lineTo(1022, 548); ctx.stroke();

  // ── Zone bas : date gauche | référence centre | signature droite ─────────

  // Date
  const dateStr = new Date(data.validatedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  ctx.fillStyle = 'rgba(200,220,255,0.4)';
  ctx.font      = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Brazzaville, le ' + dateStr, 80, 620);

  // Référence
  ctx.textAlign   = 'center';
  ctx.fillStyle   = 'rgba(255,215,0,0.5)';
  ctx.font        = 'bold 10px monospace';
  ctx.fillText('Réf. ' + data.ref, 561, 600);
  // QR-like placeholder
  ctx.strokeStyle = 'rgba(255,215,0,0.2)';
  ctx.lineWidth   = 1;
  ctx.strokeRect(524, 608, 74, 74);
  ctx.fillStyle   = 'rgba(255,215,0,0.06)';
  ctx.fillRect(524, 608, 74, 74);
  ctx.fillStyle   = 'rgba(255,215,0,0.25)';
  ctx.font        = '8px monospace';
  ctx.fillText('VÉRIFIABLE', 561, 650);
  ctx.fillText('HRCONGO.COM', 561, 664);
  ctx.fillText(data.ref.slice(-8), 561, 678);

  // Signature RH
  ctx.textAlign   = 'right';
  ctx.fillStyle   = '#ffffff';
  ctx.font        = 'bold 13px serif';
  ctx.fillText(data.validatedBy, 1042, 620);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth   = 1;
  ctx.beginPath(); ctx.moveTo(900, 628); ctx.lineTo(1042, 628); ctx.stroke();
  ctx.fillStyle   = 'rgba(200,220,255,0.4)';
  ctx.font        = '10px sans-serif';
  ctx.fillText('Responsable Ressources Humaines', 1042, 645);

  // ── Pied de page ─────────────────────────────────────────────────────────
  ctx.fillStyle   = 'rgba(255,215,0,0.2)';
  ctx.fillRect(0, 718, 1122, 52);
  ctx.fillStyle   = 'rgba(255,215,0,0.45)';
  ctx.font        = '9px monospace';
  ctx.textAlign   = 'center';
  ctx.fillText('Document officiel généré par Konza RH | Académie Formation | Loi 45-75 Code du Travail — République du Congo', 561, 738);
  ctx.fillText('Ce certificat est vérifiable en ligne sur konza-rh.cg/verify/' + data.ref, 561, 754);
}
