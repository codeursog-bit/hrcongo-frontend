// ============================================================================
// 📁 lib/certificate-templates.ts
// Modèles de certificat (A4 paysage, dessinés en canvas, même technique que
// l'actuel generateCertificate de la page Formation) :
//   • 'BLUE'  — « Bleu moderne »  : vagues bleues, nom en écriture manuscrite
//   • 'GREEN' — « Vert classique » : cadre vert, coins Art déco, rosette
// Le modèle sombre actuel reste disponible sous l'identifiant 'CLASSIC'
// (il continue d'être dessiné par la page elle-même).
// Géométrie calquée sur des maquettes 2000 × 1414 px.
// ============================================================================

export type CertificateTemplate = 'CLASSIC' | 'BLUE' | 'GREEN';

export const CERTIFICATE_TEMPLATES: Array<{ id: CertificateTemplate; label: string }> = [
  { id: 'BLUE', label: 'Bleu moderne' },
  { id: 'GREEN', label: 'Vert classique' },
  { id: 'CLASSIC', label: 'Sombre et or' },
];

export const CERTIFICATE_TEMPLATE_KEY = 'konza.certificateTemplate';

export interface CertificateRenderData {
  ref: string;
  employeeName: string;
  courseTitle: string;
  durationHours?: number | null;
  mention: string; // « Satisfaisant » | « Bien » | « Très Bien » | « Excellent »
  validatedBy: string;
  validatedAt: string;
  year: number;
  companyName?: string | null; // absent des anciens certificats → « La Direction »
}

const W = 2000;
const H = 1414;

// ── Polices ──────────────────────────────────────────────────────────────────
const FONT_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@500;600&family=Poppins:wght@400;600&family=Sacramento&family=Source+Serif+4:wght@400;600&display=swap';

const F = {
  title: '"Playfair Display", "Times New Roman", Georgia, serif',
  sans: 'Poppins, "Segoe UI", Arial, sans-serif',
  signature: '"Great Vibes", "Brush Script MT", "Segoe Script", cursive',
  script: 'Sacramento, "Brush Script MT", "Segoe Script", cursive',
  serif: '"Source Serif 4", Georgia, "Times New Roman", serif',
};

/** Charge les polices Google (silencieux si bloqué : les polices de secours prennent le relais). */
export async function ensureCertificateFonts(): Promise<void> {
  if (typeof document === 'undefined') return;
  try {
    if (!document.getElementById('konza-cert-fonts')) {
      const link = document.createElement('link');
      link.id = 'konza-cert-fonts';
      link.rel = 'stylesheet';
      link.href = FONT_CSS_URL;
      document.head.appendChild(link);
    }
    const loads = [
      '500 120px "Playfair Display"', '400 40px Poppins', '600 30px Poppins',
      '120px "Great Vibes"', '120px Sacramento', '400 40px "Source Serif 4"', '600 40px "Source Serif 4"',
    ].map((f) => document.fonts.load(f));
    await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 3500))]);
  } catch {
    /* polices de secours */
  }
}

// ── Utilitaires de dessin ────────────────────────────────────────────────────
type Ctx = CanvasRenderingContext2D;
type P = [number, number];
type Bez = [P, P, P, P];

const bez = (b: Bez, t: number): P => {
  const u = 1 - t;
  return [
    u * u * u * b[0][0] + 3 * u * u * t * b[1][0] + 3 * u * t * t * b[2][0] + t * t * t * b[3][0],
    u * u * u * b[0][1] + 3 * u * u * t * b[1][1] + 3 * u * t * t * b[2][1] + t * t * t * b[3][1],
  ];
};

const pathBez = (ctx: Ctx, b: Bez, move = true) => {
  if (move) ctx.moveTo(b[0][0], b[0][1]);
  ctx.bezierCurveTo(b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]);
};

/** Réduit la taille de police jusqu'à ce que le texte tienne dans maxWidth. */
const fitFont = (ctx: Ctx, text: string, maxWidth: number, startPx: number, minPx: number, make: (px: number) => string) => {
  let px = startPx;
  ctx.font = make(px);
  while (ctx.measureText(text).width > maxWidth && px > minPx) {
    px -= 2;
    ctx.font = make(px);
  }
  return px;
};

const wrap = (ctx: Ctx, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
};

/** Texte centré avec espacement entre lettres (sans dépendre de ctx.letterSpacing). */
const spaced = (ctx: Ctx, text: string, cx: number, y: number, spacing: number) => {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = 'left';
  chars.forEach((c, i) => { ctx.fillText(c, x, y); x += widths[i] + spacing; });
  ctx.textAlign = 'center';
};

const frDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

const description = (d: CertificateRenderData, tail: string) =>
  `a suivi avec succès la formation « ${d.courseTitle} »` +
  `${d.durationHours ? ` (${d.durationHours}\u00A0h)` : ''}, avec la mention ${d.mention}. ${tail}`;

// ════════════════════════════════════════════════════════════════════════════
// MODÈLE BLEU MODERNE
// ════════════════════════════════════════════════════════════════════════════
const NAVY = '#1c3b87';
const NAVY2 = '#2e4799';
const SKY = '#53a3dc';

/** Nappe de fines courbes entre deux guides (+ un second réseau croisé) → effet « fil tendu ». */
const ribbon = (ctx: Ctx, g1: Bez, g2: Bez, n: number, color: string, lw: number, bulge = 70) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  const draw = (a: P, b: P, k: number) => {
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2;
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.quadraticCurveTo(mx - (dy / len) * k, my + (dx / len) * k, b[0], b[1]);
    ctx.stroke();
  };
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    draw(bez(g1, t), bez(g2, t), bulge * Math.sin(Math.PI * t));
  }
  ctx.globalAlpha = 0.7;
  for (let i = 0; i <= n; i += 2) {
    const t = i / n;
    draw(bez(g1, t), bez(g2, 1 - t), -bulge * 0.6 * Math.sin(Math.PI * t));
  }
  ctx.globalAlpha = 1;
};

function drawBlue(ctx: Ctx, d: CertificateRenderData) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);

  // Voiles dégradés haut / bas
  let g = ctx.createLinearGradient(640, 0, 1890, 0);
  g.addColorStop(0, 'rgba(214,222,236,0)');
  g.addColorStop(0.4, 'rgba(206,215,232,0.75)');
  g.addColorStop(1, '#92a5cc');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(640, 0);
  ctx.bezierCurveTo(800, 95, 1000, 100, 1180, 95);
  ctx.bezierCurveTo(1450, 140, 1700, 150, 1890, 165);
  ctx.lineTo(1890, 0);
  ctx.closePath();
  ctx.fill();

  g = ctx.createLinearGradient(150, 0, 1500, 0);
  g.addColorStop(0, '#c9d3e6');
  g.addColorStop(1, '#8fa4cc');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(150, H);
  ctx.bezierCurveTo(330, 1285, 560, 1275, 830, 1335);
  ctx.bezierCurveTo(1100, 1310, 1350, 1340, 1500, H);
  ctx.closePath();
  ctx.fill();

  // Nappes de lignes grises
  ribbon(ctx, [[130, 525], [330, 700], [470, 980], [455, 1250]], [[0, 700], [150, 900], [330, 1150], [330, H]], 34, '#b9b9b9', 2);
  ribbon(ctx, [[1880, 120], [1750, 380], [1480, 560], [1490, 800]], [[1990, 360], [1850, 700], [1700, 1000], [1790, 1100]], 34, '#b9b9b9', 2);

  // Gauche : bloc bleu, bande ciel, bas marine
  const L: Bez = [[262, 0], [245, 300], [120, 540], [0, 765]];
  ctx.fillStyle = NAVY2;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(262, 0);
  pathBez(ctx, L, false);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = SKY;
  ctx.lineWidth = 68;
  ctx.beginPath();
  pathBez(ctx, L);
  ctx.stroke();
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.moveTo(0, 800);
  ctx.bezierCurveTo(120, 980, 210, 1190, 165, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Droite : coin marine haut, bande ciel + bloc bas
  ctx.fillStyle = NAVY;
  ctx.beginPath();
  ctx.moveTo(1780, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, 440);
  ctx.bezierCurveTo(1930, 330, 1830, 170, 1780, 0);
  ctx.closePath();
  ctx.fill();

  const R1: Bez = [[W, 610], [1930, 850], [1800, 1010], [1760, 1180]];
  const R2: Bez = [[1760, 1180], [1735, 1290], [1712, 1350], [1712, H]];
  ctx.fillStyle = NAVY2;
  ctx.beginPath();
  ctx.moveTo(W, 560);
  ctx.lineTo(W, 610);
  pathBez(ctx, R1, false);
  pathBez(ctx, R2, false);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = SKY;
  ctx.lineWidth = 82;
  ctx.beginPath();
  pathBez(ctx, R1);
  pathBez(ctx, R2, false);
  ctx.stroke();

  // ── Textes ────────────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = NAVY;
  fitFont(ctx, 'CERTIFICAT', 1150, 250, 120, (px) => `500 ${px}px ${F.title}`);
  ctx.fillText('CERTIFICAT', 1000, 308);

  ctx.fillStyle = '#000';
  ctx.font = `400 62px ${F.sans}`;
  ctx.fillText('DE FIN DE FORMATION', 1000, 402);

  ctx.font = `400 35px ${F.sans}`;
  ctx.fillText('ce certificat est fièrement décerné à', 1000, 540);

  ctx.fillStyle = NAVY;
  fitFont(ctx, d.employeeName, 1180, 190, 70, (px) => `400 ${px}px ${F.signature}`);
  ctx.fillText(d.employeeName, 1000, 790);

  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(428, 838);
  ctx.lineTo(1572, 838);
  ctx.stroke();

  ctx.fillStyle = '#000';
  ctx.font = `400 34px ${F.sans}`;
  const lines = wrap(ctx, description(d, 'Votre engagement et votre participation active sont vivement appréciés.'), 1130);
  lines.slice(0, 4).forEach((l, i) => ctx.fillText(l, 1000, 940 + i * 48));

  // Signatures
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(511, 1187); ctx.lineTo(741, 1187); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1259, 1187); ctx.lineTo(1489, 1187); ctx.stroke();
  ctx.fillStyle = '#000';
  ctx.font = `600 28px ${F.sans}`;
  const l1 = fitFont(ctx, d.validatedBy, 300, 28, 18, (px) => `600 ${px}px ${F.sans}`);
  ctx.fillText(d.validatedBy, 626, 1230);
  fitFont(ctx, d.companyName || 'La Direction', 300, l1, 18, (px) => `600 ${px}px ${F.sans}`);
  ctx.fillText(d.companyName || 'La Direction', 1374, 1230);
  ctx.font = `400 22px ${F.sans}`;
  ctx.fillStyle = '#333';
  ctx.fillText('Responsable RH', 626, 1262);
  ctx.fillText('Direction', 1374, 1262);

  // Pied : date + référence
  ctx.fillStyle = NAVY;
  ctx.font = `400 24px ${F.sans}`;
  ctx.fillText(`Délivré le ${frDate(d.validatedAt)}  •  Réf. ${d.ref}`, 1000, 1345);
  ctx.font = `400 20px ${F.sans}`;
  ctx.fillText(`Vérifiable en ligne : konza-rh.cg/verify/${d.ref}`, 1000, 1376);
}

// ════════════════════════════════════════════════════════════════════════════
// MODÈLE VERT CLASSIQUE
// ════════════════════════════════════════════════════════════════════════════
const GREEN = '#89b68b';
const TEAL = '#126b69';
const INK = '#0c1a27';

/** Coin « éventail » vert (haut-gauche, coordonnées absolues). */
function fanCorner(ctx: Ctx) {
  ctx.strokeStyle = GREEN;
  ctx.fillStyle = GREEN;
  ctx.lineWidth = 3;

  // règle horizontale hachurée
  ctx.strokeRect(258, 137, 184, 28);
  ctx.lineWidth = 1.5;
  for (let x = 264; x < 442; x += 7) { ctx.beginPath(); ctx.moveTo(x, 138); ctx.lineTo(x, 164); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(442, 165); ctx.lineTo(468, 137); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = TEAL;
  ctx.beginPath(); ctx.moveTo(215, 128); ctx.lineTo(428, 128); ctx.stroke();
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(258, 174); ctx.lineTo(402, 174); ctx.moveTo(250, 182); ctx.lineTo(390, 182); ctx.stroke();

  // règle verticale hachurée
  ctx.lineWidth = 3;
  ctx.strokeRect(128, 262, 30, 188);
  ctx.lineWidth = 1.5;
  for (let y = 268; y < 450; y += 7) { ctx.beginPath(); ctx.moveTo(129, y); ctx.lineTo(157, y); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(128, 450); ctx.lineTo(156, 476); ctx.stroke();

  // quarts de cercle
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(258, 262, 130, Math.PI, Math.PI * 1.5); ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(258, 262, 112, Math.PI, Math.PI * 1.5); ctx.stroke();

  // fleur en éventail
  ctx.lineWidth = 3;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const a = (10 + i * 18) * (Math.PI / 180);
    ctx.save();
    ctx.translate(133, 142);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(52, 0, 52, 21, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = GREEN;
  ctx.beginPath(); ctx.arc(133, 142, 9, 0, Math.PI * 2); ctx.fill();
}

/** Coin « soleil » sarcelle (haut-droite, coordonnées absolues). */
function sunCorner(ctx: Ctx) {
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(1650, 130); ctx.lineTo(1876, 130); ctx.lineTo(1876, 360); ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(1660, 139); ctx.lineTo(1867, 139); ctx.lineTo(1867, 350); ctx.stroke();
  ctx.setLineDash([14, 10]);
  ctx.beginPath(); ctx.moveTo(1565, 130); ctx.lineTo(1636, 130); ctx.moveTo(1873, 372); ctx.lineTo(1873, 440); ctx.stroke();
  ctx.setLineDash([]);

  const cx = 1868;
  const cy = 195;
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, 62, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke();
  for (let i = 0; i <= 9; i++) {
    const a = Math.PI + (i * (Math.PI / 2)) / 9;
    const len = i % 2 === 0 ? 150 : 100;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 68, cy + Math.sin(a) * 68);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(1752, 252); ctx.lineTo(1775, 205); ctx.lineTo(1815, 170); ctx.stroke();
}

function rosette(ctx: Ctx, cx: number, cy: number, mention: string) {
  // rubans
  ctx.fillStyle = TEAL;
  ctx.beginPath(); ctx.moveTo(cx - 44, cy + 70); ctx.lineTo(cx - 84, cy + 135); ctx.lineTo(cx - 20, cy + 122); ctx.lineTo(cx + 2, cy + 156); ctx.lineTo(cx + 10, cy + 80); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx + 44, cy + 70); ctx.lineTo(cx + 84, cy + 135); ctx.lineTo(cx + 20, cy + 122); ctx.lineTo(cx - 2, cy + 156); ctx.lineTo(cx - 10, cy + 80); ctx.closePath(); ctx.fill();
  // corps festonné
  ctx.fillStyle = GREEN;
  ctx.beginPath(); ctx.arc(cx, cy, 92, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 18; i++) {
    const a = (i * Math.PI * 2) / 18;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 94, cy + Math.sin(a) * 94, 14, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#f7f5f6';
  ctx.beginPath(); ctx.arc(cx, cy, 77, 0, Math.PI * 2); ctx.fill();

  // mention au centre
  ctx.fillStyle = TEAL;
  ctx.textAlign = 'center';
  ctx.font = `600 17px ${F.serif}`;
  ctx.fillText('MENTION', cx, cy - 14);
  fitFont(ctx, mention.toUpperCase(), 118, 26, 14, (px) => `600 ${px}px ${F.serif}`);
  ctx.fillText(mention.toUpperCase(), cx, cy + 20);
}

function drawGreen(ctx: Ctx, d: CertificateRenderData) {
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, H);

  // Cadres : sarcelle, blanc, vert clair
  ctx.fillStyle = TEAL;
  ctx.fillRect(64, 74, 1872, 1266);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(74, 84, 1852, 1246);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 11;
  ctx.strokeRect(99, 108, 1802, 1198);

  // Coins : éventail (haut-gauche, bas-droite), soleil (haut-droite, bas-gauche)
  // — rognés à l'intérieur du cadre vert clair pour ne jamais déborder
  ctx.save();
  ctx.beginPath();
  ctx.rect(106, 115, 1788, 1184);
  ctx.clip();
  fanCorner(ctx);
  sunCorner(ctx);
  ctx.save(); ctx.translate(W, H); ctx.rotate(Math.PI); fanCorner(ctx); sunCorner(ctx); ctx.restore();
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = INK;
  ctx.font = `400 150px ${F.serif}`;
  spaced(ctx, 'CERTIFICAT', 1000, 345, 46);

  ctx.fillStyle = TEAL;
  ctx.font = `400 108px ${F.script}`;
  ctx.fillText('de participation', 1000, 458);

  ctx.fillStyle = INK;
  ctx.font = `400 50px ${F.serif}`;
  ctx.fillText('Ce Certificat Est Fièrement Décerné À', 1000, 575);

  ctx.fillStyle = TEAL;
  fitFont(ctx, d.employeeName, 1100, 150, 64, (px) => `400 ${px}px ${F.script}`);
  ctx.fillText(d.employeeName, 1000, 722);

  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(355, 763); ctx.lineTo(1650, 763); ctx.stroke();

  ctx.fillStyle = INK;
  ctx.font = `400 38px ${F.serif}`;
  const lines = wrap(ctx, description(d, ''), 1140);
  lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 1000, 830 + i * 47));

  rosette(ctx, 1000, 1072, d.mention);

  // Signatures (nom au-dessus du trait, fonction dessous)
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(238, 1134); ctx.lineTo(675, 1134); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1325, 1134); ctx.lineTo(1762, 1134); ctx.stroke();
  ctx.fillStyle = INK;
  fitFont(ctx, d.validatedBy, 400, 36, 20, (px) => `400 ${px}px ${F.serif}`);
  ctx.fillText(d.validatedBy, 456, 1118);
  fitFont(ctx, d.companyName || 'La Direction', 400, 36, 20, (px) => `400 ${px}px ${F.serif}`);
  ctx.fillText(d.companyName || 'La Direction', 1543, 1118);
  ctx.font = `400 36px ${F.serif}`;
  ctx.fillText('Responsable RH', 456, 1168);
  ctx.fillText('Direction', 1543, 1168);

  // Référence
  ctx.fillStyle = TEAL;
  ctx.font = `400 22px ${F.serif}`;
  ctx.fillText(`Délivré le ${frDate(d.validatedAt)}  •  Réf. ${d.ref}`, 1000, 1262);
  ctx.font = `400 19px ${F.serif}`;
  ctx.fillText(`Vérifiable en ligne : konza-rh.cg/verify/${d.ref}`, 1000, 1288);
}

// ════════════════════════════════════════════════════════════════════════════
// API publique
// ════════════════════════════════════════════════════════════════════════════
/** Dessine le certificat sur le canvas fourni (2000 × 1414). */
export function drawCertificate(canvas: HTMLCanvasElement, template: 'BLUE' | 'GREEN', data: CertificateRenderData) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  if (template === 'GREEN') drawGreen(ctx, data);
  else drawBlue(ctx, data);
}

/** Dessine puis télécharge en PNG. */
export async function downloadCertificate(template: 'BLUE' | 'GREEN', data: CertificateRenderData) {
  await ensureCertificateFonts();
  const canvas = document.createElement('canvas');
  drawCertificate(canvas, template, data);
  const link = document.createElement('a');
  link.download = `certificat-${data.employeeName.replace(/\s+/g, '-').toLowerCase()}-${data.year}.png`;
  link.href = canvas.toDataURL('image/png', 1.0);
  link.click();
}
