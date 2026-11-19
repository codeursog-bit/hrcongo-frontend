'use client';

import React, { useState } from 'react';
import { FoundationPreview } from '@/components/templates/FoundationPreview';
import { ArrowDownToLine, ArrowRight, Check, Moon, Plus, Sun } from 'lucide-react';
import { Badge, Button, Card, DataTable, EmptyState, Input, Select, TableSkeleton, Textarea, type Column } from '@/components/design-system/primitives';
import { Modal, SuccessMark, ToastProvider, useToast } from '@/components/design-system/feedback';
import { CapsuleChart, DonutChart, SmoothChart, type ChartRow } from '@/components/design-system/charts';

const payroll: ChartRow[] = [
  { label: 'Juin', primary: 21800000, secondary: 17400000 }, { label: 'Juil.', primary: 26700000, secondary: 21800000 },
  { label: 'Août', primary: 25300000, secondary: 20100000 }, { label: 'Sept.', primary: 31200000, secondary: 25600000 },
  { label: 'Oct.', primary: 38450000, secondary: 30700000 }, { label: 'Nov.', primary: 36100000, secondary: 29400000 },
];
type Employee = { id: string; name: string; role: string; department: string; salary: string; status: 'Actif' | 'En congé' | 'Inactif' };
const employees: Employee[] = [
  { id: '1', name: 'Sandrine Mvoula', role: 'Responsable comptable', department: 'Finance', salary: '650 000 FCFA', status: 'Actif' },
  { id: '2', name: 'Patrick Likibi', role: 'Chargé de clientèle', department: 'Commercial', salary: '425 000 FCFA', status: 'En congé' },
  { id: '3', name: 'Laure Djouma', role: 'Assistante RH', department: 'Administration', salary: '380 000 FCFA', status: 'Actif' },
];
const swatches = [['Orange', '--brand'], ['Citron', '--lime'], ['Vert', '--green'], ['Moutarde', '--mustard'], ['Texte', '--text'], ['Fond', '--bg']];

function Gallery({ dark, setDark }: { dark: boolean; setDark: (v: boolean) => void }) {
  const notify = useToast(); const [modal, setModal] = useState(false); const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState('Tous'); const [descending, setDescending] = useState(false); const [loading, setLoading] = useState(false);
  const columns: Column<Employee>[] = [
    { key: 'name', label: 'Employé', sort: descending ? 'descending' : 'ascending', onSort: () => setDescending(v => !v), render: e => <><strong>{e.name}</strong><small>{e.role}</small></> },
    { key: 'department', label: 'Département', render: e => e.department },
    { key: 'salary', label: 'Salaire mensuel', render: e => e.salary },
    { key: 'status', label: 'Statut', render: e => <Badge tone={e.status === 'Actif' ? 'success' : e.status === 'En congé' ? 'warning' : 'neutral'}>{e.status}</Badge> },
  ];
  const rows = employees.filter(e => filter === 'Tous' || e.status === filter).sort((a, b) => (descending ? -1 : 1) * a.name.localeCompare(b.name, 'fr'));
  return <div className="k-showcase-wrap">
    <header className="k-showcase-header"><a href="#intro" className="k-wordmark" aria-label="Konza RH, haut de page"><svg width="28" height="32" viewBox="0 0 28 32" fill="none" aria-hidden="true"><path d="M3 3v26M25 3 5 17l20 12" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>Konza RH</a><div className="k-header-meta"><span>Bibliothèque d’interface</span><Button variant="secondary" onClick={() => setDark(!dark)} aria-label={dark ? 'Afficher le thème clair' : 'Afficher le thème sombre'}>{dark ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}{dark ? 'Clair' : 'Sombre'}</Button></div></header>
    <main id="intro"><div className="k-intro"><div><span className="k-eyebrow">Les fondations · 01</span><h1>De la clarté, chaque jour.</h1><p>Une interface qui laisse la place à votre équipe.<br />Couleurs, gestes et repères pour le quotidien RH.</p></div><span className="k-version">Étape 1 · Aperçu {dark ? 'sombre' : 'clair'} · Données fictives</span></div>
      <Card title="Une palette qui respire" action={<span className="k-caption">Orange, vert et moutarde</span>}><div className="k-palette">{swatches.map(([name, token]) => <div className="k-swatch" key={token}><div className="k-swatch-color" style={{ background: `var(${token})` }} /><strong>{name}</strong><small>{token}</small></div>)}</div></Card>
      <div className="k-section-title"><h2>Lire les chiffres, simplement</h2><span>Courbe, donut et barres · Recharts</span></div>
      <div className="k-grid"><Card className="k-col-8" title="Évolution de la masse salariale" action={<Badge>6 mois</Badge>}><SmoothChart data={payroll} /></Card><Card className="k-col-4" title="Répartition des équipes"><DonutChart total="84" label="employés" data={[{ name: 'Opérations', value: 36 }, { name: 'Commercial', value: 28 }, { name: 'Support', value: 20 }]} /></Card>
        <Card className="k-col-5" title="Masse salariale et salaire net"><CapsuleChart data={payroll} /></Card><Card className="k-col-7" title="Les bons repères"><div className="k-row"><Badge tone="success">Approuvée</Badge><Badge tone="warning">En attente</Badge><Badge tone="danger">Refusée</Badge><Badge>Annulée</Badge></div><div className="k-divider" /><p className="k-caption">Masse salariale · Novembre 2026</p><div className="k-feature-number k-numeric">36 100 000 <span style={{ fontSize: 16, letterSpacing: 0 }}>FCFA</span></div><p className="k-caption">Plus Jakarta Sans · Titres 600 · Corps 400–500<br />Chiffres tabulaires pour les montants et les tableaux.</p><div className="k-divider" /><div className="k-row"><Button onClick={() => setModal(true)}><Plus size={17} strokeWidth={1.5} />Nouvelle demande</Button><Button variant="secondary" onClick={() => notify('info', 'Aperçu du téléchargement', 'Cet exemple ne génère aucun document officiel.')}><ArrowDownToLine size={17} strokeWidth={1.5} />Exporter</Button><Button variant="ghost" onClick={() => notify('info', 'Liste complète', 'Vous consultez un exemple de trois employés.')}>Voir tout<ArrowRight size={16} strokeWidth={1.5} /></Button></div></Card>
      </div>
      <div className="k-section-title"><h2>Une équipe, des informations lisibles</h2><span>Tri, filtre et cartes sur mobile</span></div>
      <Card title="Employés" action={<div className="k-filter"><Select label="Filtrer par statut" value={filter} onChange={e => setFilter(e.target.value)}><option>Tous</option><option>Actif</option><option>En congé</option><option>Inactif</option></Select></div>}><DataTable caption="Exemple de liste des employés" rows={rows} columns={columns} rowKey={e => e.id} empty={<EmptyState title="Tout le monde est en activité">Aucun employé inactif dans cette équipe de démonstration.</EmptyState>} /></Card>
      <div className="k-section-title"><h2>Des actions qui répondent</h2><span>Formulaire, confirmation et notifications</span></div>
      <div className="k-grid"><Card className="k-col-7" title="Préparer une demande"><form className="k-demo-form" onSubmit={e => { e.preventDefault(); setSaved(true); notify('success', 'Brouillon enregistré', 'Vous pouvez le reprendre à tout moment.'); }}>
        <Input label="Nom du demandeur" defaultValue="Laure Djouma" required autoComplete="name" /><Select label="Type de demande" defaultValue="leave"><option value="leave">Congé annuel</option><option value="loan">Prêt</option><option value="advance">Avance sur salaire</option></Select><Input label="Date de début" type="date" defaultValue="2026-11-16" /><Input label="Date de fin" type="date" error="Choisissez une date de fin après le début." aria-label="Date de fin, exemple en erreur" /><div className="k-wide"><Textarea label="Commentaire" rows={3} placeholder="Précisez votre demande…" hint="Une information utile pour la personne qui traite votre demande." /></div><Input label="Service" defaultValue="Administration" disabled hint="Renseigné depuis votre fiche employé." /><div className="k-wide k-row"><Button type="submit">{saved && <Check size={18} strokeWidth={1.5} />}Enregistrer le brouillon</Button>{saved && <span className="k-row k-caption" role="status"><SuccessMark />Brouillon enregistré</span>}</div></form></Card>
        <Card className="k-col-5" title="Retours et états"><div className="k-stack"><p className="k-caption">Un message court, une suite claire. Les notifications se ferment automatiquement, avec pause au survol ou au clavier.</p><div className="k-row"><Button variant="secondary" onClick={() => notify('success', 'Demande envoyée', 'Votre responsable RH va la traiter.')}>Succès</Button><Button variant="secondary" onClick={() => notify('error', 'Envoi interrompu', 'Vérifiez votre connexion puis réessayez.')}>Erreur</Button><Button variant="secondary" onClick={() => notify('warning', 'Pièce justificative attendue', 'Ajoutez le document avant de poursuivre.')}>Attention</Button><Button variant="secondary" onClick={() => notify('info', 'Brouillon conservé', 'Vous pourrez terminer la demande plus tard.')}>Information</Button></div><div className="k-divider" /><div className="k-row"><Button loading>Envoi en cours…</Button><Button disabled>Indisponible</Button></div><Button variant="secondary" onClick={() => setModal(true)}>Ouvrir la fenêtre de confirmation</Button><p className="k-caption">Échap et clic extérieur pour fermer. Navigation et focus contenus dans la fenêtre.</p></div></Card>
        <Card className="k-col-5" title="Quand la liste attend son premier élément"><EmptyState title="Votre prochaine demande commence ici" action={<Button onClick={() => setModal(true)}><Plus size={17} strokeWidth={1.5} />Nouvelle demande</Button>}>Vos demandes et leur suivi apparaîtront dans cet espace.</EmptyState></Card><Card className="k-col-7" title="Chargement à la forme du contenu" action={<Button variant="ghost" onClick={() => setLoading(v => !v)}>{loading ? 'Afficher le squelette' : 'Afficher le résultat'}</Button>}>{loading ? <DataTable caption="Employés chargés" columns={columns.slice(0, 2)} rows={employees} rowKey={e => e.id} /> : <TableSkeleton />}</Card>
      </div>
      <FoundationPreview />
    </main><footer className="k-footer"><span>Konza RH · Design system · 12 novembre 2026</span><span>Clair et sombre · Mobile · Clavier · Mouvements réduits</span></footer>
    <Modal open={modal} onClose={() => setModal(false)} title="Envoyer cette demande ?" actions={<><Button variant="secondary" onClick={() => setModal(false)}>Annuler</Button><Button onClick={() => { setModal(false); notify('success', 'Demande envoyée', 'Votre responsable RH va la traiter.'); }}>Envoyer la demande</Button></>}><p>Vous pouvez relire les informations avant de confirmer. Cet exemple utilise uniquement des données fictives.</p><Badge tone="warning">En attente de votre confirmation</Badge></Modal>
  </div>;
}
export default function DesignSystemPage() {
  const [dark, setDark] = useState(false);
  return <div className={`k-showcase ${dark ? 'dark' : 'k-showcase-light'}`}><ToastProvider><Gallery dark={dark} setDark={setDark} /></ToastProvider></div>;
}
