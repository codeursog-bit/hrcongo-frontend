// ============================================================================
// 📁 lib/punch-method.ts
// Libellés des méthodes de pointage + règle d'affichage d'UNE méthode résumée.
// Règle : on garde la méthode de l'ENTRÉE (la première), mais le QR code est
// prioritaire : si l'entrée OU la sortie a été faite par scan QR, on affiche QR.
// Le détail (entrée + sortie) est toujours visible dans le panneau de la présence.
// ============================================================================
export type PunchMethodValue = 'GPS' | 'KIOSK' | 'QR_SCAN' | 'SECRET_CODE' | 'MANUAL';

export const PUNCH_METHOD_LABEL: Record<string, string> = {
  GPS: 'Téléphone (GPS)',
  KIOSK: 'Tablette (badge)',
  QR_SCAN: 'Scan QR',
  SECRET_CODE: 'Code secret',
  MANUAL: 'Saisie manuelle',
};

export function summaryPunchMethod(
  checkInMethod?: string | null,
  checkOutMethod?: string | null,
): string | null {
  if (checkInMethod === 'QR_SCAN' || checkOutMethod === 'QR_SCAN') return 'QR_SCAN';
  return checkInMethod || checkOutMethod || null;
}