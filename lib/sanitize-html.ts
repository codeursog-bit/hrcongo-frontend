// ============================================================================
// 📁 lib/sanitize-html.ts
// ✅ Sanitisation du HTML reçu du backend avant tout dangerouslySetInnerHTML.
//    Défense EN PLUS de l'échappement côté back (loans-orca-export.service.ts) —
//    ne remplace pas la correction back, qui reste la protection principale.
// ============================================================================

import DOMPurify from 'dompurify';

// Balises/attributs nécessaires au rendu des documents ORCA (tableaux HTML
// statiques : congé, absence, prêt, avance). Volontairement restrictif :
// aucun <script>, <iframe>, gestionnaire d'événement (onerror, onclick...),
// ni javascript: dans un href/src.
const ORCA_DOCUMENT_CONFIG = {
  ALLOWED_TAGS: [
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
    'div', 'span', 'p', 'br', 'hr',
    'strong', 'b', 'em', 'i', 'u', 'small',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'img',
  ],
  ALLOWED_ATTR: ['style', 'class', 'colspan', 'rowspan', 'align', 'valign', 'width', 'height', 'src', 'alt'],
  // Ceinture supplémentaire : même avec img autorisé, seules les data URI
  // (images encodées, pas de requête réseau déclenchable) ou https passent.
  ALLOWED_URI_REGEXP: /^(?:(?:https?|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

type SanitizeConfig = Parameters<typeof DOMPurify.sanitize>[1];
const CONFIG: SanitizeConfig = ORCA_DOCUMENT_CONFIG as SanitizeConfig;

/**
 * Sanitise le HTML d'un document ORCA (prêt, avance, congé, absence) reçu de
 * GET /loans/:id/document/orca-html (ou équivalent) avant de le passer à
 * dangerouslySetInnerHTML. Retourne null si l'entrée est vide/absente.
 */
export function sanitizeOrcaHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  if (typeof window === 'undefined') {
    // Ne devrait jamais arriver (ces pages sont 'use client'), mais on ne
    // rend jamais du HTML non sanitisé même dans ce cas de figure.
    return null;
  }
  return DOMPurify.sanitize(html, CONFIG);
}

// Balises produites par renderArticleContent() (BlogPostClient.tsx) et par
// l'aperçu live de BlogEditor.tsx — un article structuré, pas de formulaire
// ni de script. renderInline() échappe déjà le texte brut ; ceci est une
// DEUXIÈME barrière (défense en profondeur), au cas où une future évolution
// du parser markdown réintroduirait un chemin non échappé.
const BLOG_ARTICLE_CONFIG = {
  ALLOWED_TAGS: [
    'h2', 'h3', 'h4', 'p', 'br', 'hr', 'blockquote',
    'strong', 'em', 'code', 'a',
    'ul', 'ol', 'li',
    'div', 'span', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  ],
  ALLOWED_ATTR: ['id', 'class', 'href', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};
const BLOG_CONFIG: SanitizeConfig = BLOG_ARTICLE_CONFIG as SanitizeConfig;

/** Sanitise le HTML généré par renderArticleContent() avant dangerouslySetInnerHTML. */
export function sanitizeArticleHtml(html: string | null | undefined): string {
  if (!html) return '';
  if (typeof window === 'undefined') return '';
  return DOMPurify.sanitize(html, BLOG_CONFIG);
}