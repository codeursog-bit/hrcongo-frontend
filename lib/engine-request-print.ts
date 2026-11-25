import { printBulletin } from './bulletin-print';

export function printEngineRequest(root: HTMLElement | null) {
  if (!root || (!root.matches('[data-engine-request]') && !root.querySelector('[data-engine-request]'))) return false;
  if (root.matches('[data-document-pending]') || root.querySelector('[data-document-pending]')) {
    window.alert('Attendez le chargement du modèle avant d’imprimer.');
  } else {
    printBulletin(root.id);
  }
  return true;
}
