// ============================================================================
// 📁 lib/pointeuse-tts.ts
// ✅ Annonce vocale (Web Speech API, 100% navigateur — aucun backend requis)
//    quand un employé pointe son entrée ou sa sortie. Message choisi au
//    hasard dans un pool pour varier, personnalisé avec le prénom.
// ✅ Activé par défaut ; chaque employé peut le désactiver individuellement
//    depuis son propre appareil (préférence stockée en localStorage —
//    donc naturellement "par employé" puisque chacun utilise son propre
//    téléphone/navigateur pour pointer).
// ============================================================================

const STORAGE_KEY = 'pointeuse_voice_enabled';

const IN_MESSAGES = (name: string) => [
  `Bonjour ${name}, merci d'avoir pointé votre entrée. Bon travail !`,
  `${name} a pointé son entrée. Bonne journée à vous !`,
  `Bienvenue ${name}, votre présence est bien enregistrée.`,
  `C'est noté, ${name} ! Passez une excellente journée, et n'oubliez pas de pointer votre sortie.`,
  `Entrée enregistrée pour ${name}. Bon courage pour aujourd'hui !`,
  `Salut ${name}, on a bien reçu votre pointage. Belle journée à vous !`,
];

const OUT_MESSAGES = (name: string) => [
  `Bonne soirée ${name}, à demain !`,
  `${name} a pointé sa sortie. Reposez-vous bien !`,
  `Journée terminée pour ${name}. Merci pour votre travail aujourd'hui !`,
  `C'est enregistré, ${name}. Passez une bonne soirée !`,
  `Sortie confirmée pour ${name}. À très bientôt !`,
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Les voix du navigateur se chargent parfois de façon asynchrone — on les
// garde à jour dès qu'elles sont prêtes plutôt que d'appeler getVoices()
// à chaque fois (peut renvoyer un tableau vide juste après le chargement
// de la page sur certains navigateurs).
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const refreshVoices = () => { cachedVoices = window.speechSynthesis.getVoices(); };
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

export function isVoiceEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === 'true'; // activé par défaut
}

export function setVoiceEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

/**
 * Fait parler le navigateur pour annoncer un pointage. Ne fait rien si la
 * voix est désactivée pour cet employé, ou si le navigateur ne supporte pas
 * la synthèse vocale (ex: certains navigateurs embarqués).
 */
export function speakPointageMessage(firstName: string, type: 'IN' | 'OUT') {
  if (!isVoiceEnabled()) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  const name = firstName?.trim() || 'cher collègue';
  const pool = type === 'IN' ? IN_MESSAGES(name) : OUT_MESSAGES(name);
  const message = pickRandom(pool);

  const utterance = new SpeechSynthesisUtterance(message);
  utterance.lang = 'fr-FR';
  utterance.rate = 1;
  utterance.pitch = 1;

  const frVoice = cachedVoices.find(v => v.lang?.toLowerCase().startsWith('fr'));
  if (frVoice) utterance.voice = frVoice;

  window.speechSynthesis.cancel(); // évite deux annonces qui se chevauchent
  window.speechSynthesis.speak(utterance);
}
