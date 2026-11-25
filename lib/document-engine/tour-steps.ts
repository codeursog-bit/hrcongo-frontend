export type TourSignal = 'preset' | 'selection' | 'move' | 'rename' | 'color' | 'font' | 'fill' | 'logo' | 'real-preview' | 'save';
export type TourReveal = 'structure' | 'canvas' | 'styles' | 'table' | 'logo';

type TourMove = { action: 'drag'; target: string; to: string; source: string; destination: string };
type TourChange = { action: 'select' | 'type'; target: string; value: string };
type TourClick = { action: 'click' | 'dblclick' | 'file'; target: string };
export type TourGesture = TourMove | TourChange | TourClick;

export type TourStep = {
  id: string;
  title: string;
  caption: string;
  target: string;
  action: 'click' | 'drag' | 'dblclick' | 'type' | 'select';
  params: { reveal?: TourReveal; nextTarget?: string; gestures: TourGesture[] };
  waitFor: TourSignal[];
};

export const tourSteps: TourStep[] = [
  { id: 'start', title: 'Point de départ', caption: 'Ouvrez les points de départ, puis choisissez un design.',
    target: 'start', action: 'click', params: { nextTarget: 'preset-B_VERT', gestures: [{ action: 'click', target: 'start' }, { action: 'click', target: 'preset-B_VERT' }] }, waitFor: ['preset'] },
  { id: 'select', title: 'Sélection', caption: 'Sélectionnez le bloc Identité du salarié dans la structure.',
    target: 'select-fieldGroup', action: 'click', params: { reveal: 'structure', gestures: [{ action: 'click', target: 'select-fieldGroup' }] }, waitFor: ['selection'] },
  { id: 'move', title: 'Déplacement', caption: 'Déplacez le bloc Identité par glisser-déposer ou avec les flèches.',
    target: 'block-fieldGroup', action: 'drag', params: { reveal: 'canvas', gestures: [
      { action: 'drag', target: 'block-fieldGroup', to: 'block-meta', source: 'fieldGroup', destination: 'meta' },
    ] }, waitFor: ['move'] },
  { id: 'rename', title: 'Libellés', caption: 'Double-cliquez sur le titre du bulletin, renommez-le puis validez avec Entrée.',
    target: 'document-title', action: 'dblclick', params: { reveal: 'canvas', nextTarget: 'label-input', gestures: [
      { action: 'dblclick', target: 'document-title' }, { action: 'type', target: 'label-input', value: 'BULLETIN MENSUEL' },
    ] }, waitFor: ['rename'] },
  { id: 'style', title: 'Couleurs et police', caption: 'Changez la couleur des titres, puis choisissez une autre police de titre.',
    target: 'title-color', action: 'select', params: { reveal: 'styles', nextTarget: 'title-font', gestures: [
      { action: 'select', target: 'title-color', value: '#72395d' }, { action: 'select', target: 'title-font', value: 'caladea' },
    ] }, waitFor: ['color', 'font'] },
  { id: 'table', title: 'Hauteur du tableau', caption: 'Basculez « Remplir la page » ou étirez le tableau avec sa poignée du bas.',
    target: 'table-fill', action: 'click', params: { reveal: 'table', gestures: [{ action: 'click', target: 'table-fill' }] }, waitFor: ['fill'] },
  { id: 'logo', title: 'Logo', caption: 'Importez un logo, ou choisissez le logo de votre entreprise.',
    target: 'logo-import', action: 'select', params: { reveal: 'logo', gestures: [{ action: 'file', target: 'logo-import' }] }, waitFor: ['logo'] },
  { id: 'preview', title: 'Aperçu sur un bulletin', caption: 'Ouvrez les données réelles, puis choisissez un bulletin dans la liste.',
    target: 'real-data', action: 'select', params: { reveal: 'canvas', nextTarget: 'preview-payroll', gestures: [
      { action: 'click', target: 'real-data' }, { action: 'select', target: 'preview-payroll', value: 'guide-example' },
    ] }, waitFor: ['real-preview'] },
  { id: 'save', title: 'Enregistrement', caption: 'Enregistrez le modèle une fois que le résultat vous convient.',
    target: 'save', action: 'click', params: { reveal: 'canvas', gestures: [{ action: 'click', target: 'save' }] }, waitFor: ['save'] },
];

export const tourChapters = [
  { id: 'choisir-un-design', title: 'Choisir un design', steps: ['start'] },
  { id: 'deplacer-et-renommer', title: 'Déplacer et renommer', steps: ['select', 'move', 'rename'] },
  { id: 'couleurs-et-logo', title: 'Couleurs et logo', steps: ['style', 'logo'] },
  { id: 'etirer-le-tableau', title: 'Étirer le tableau', steps: ['table'] },
  { id: 'enregistrer', title: 'Enregistrer', steps: ['preview', 'save'] },
] as const;
