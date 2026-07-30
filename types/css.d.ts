// ============================================================================
// 📁 src/types/css.d.ts  (ou à la racine : types/css.d.ts)
// ============================================================================
// Résout l'erreur :
//   "Cannot find module or type declarations for side-effect import of './globals.css'"
//
// Ce fichier dit à TypeScript : "les imports .css sont valides, laisse-les passer"
// ============================================================================

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}