'use client';
import React,{useState,useEffect,useId} from 'react';
import Link from 'next/link';
import {useSearchParams,usePathname} from 'next/navigation';
import {SettingsPage} from '@/components/templates';
import {Card,Button,Input,Select,Badge,Skeleton} from '@/components/design-system/primitives';
import {useToast} from '@/components/design-system/feedback';
import {ThemeControl} from '@/components/layout/ThemeControl';
import {useAppearance} from '@/components/providers/AppearanceProvider';
import {ACCENT_PALETTES,DEFAULT_COLORS,LIGHT_AMBIANCES,DARK_AMBIANCES,appearanceTokens,validateColors} from '@/lib/appearance';
import type {ColorChoice} from '@/types/contracts/appearance';
import './appearance.css';
export function AppearancePreview({colors}:{colors:ColorChoice}) {
  const id=useId().replace(/:/g,'');
  return <div className="appearance-previews">{[false,true].map(dark=><div key={String(dark)} className={dark?'appearance-preview dark':'appearance-preview k-showcase-light'} style={appearanceTokens(colors,dark) as React.CSSProperties}><p>{dark?'Sombre':'Clair'}</p><div className="appearance-mini"><strong>Mavoula Services</strong><span className="k-button k-button-primary">Nouvelle demande</span><div className="k-row"><Badge tone="success">Approuvée</Badge><Badge tone="warning">En attente</Badge><Badge tone="danger">Refusée</Badge></div><svg viewBox="0 0 240 70" role="img" aria-label="Exemple de courbe de marque"><defs><linearGradient id={id+String(dark)} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--brand)" stopOpacity=".25"/><stop offset="100%" stopColor="var(--brand)" stopOpacity="0"/></linearGradient></defs><path d="M0 60Q30 55 50 35T110 40T160 20T240 8V70H0Z" fill={`url(#${id+String(dark)})`}/><path d="M0 60Q30 55 50 35T110 40T160 20T240 8" fill="none" stroke="var(--brand)" strokeWidth="2"/></svg><p>Les statuts gardent leurs couleurs.</p></div></div>)}</div>;
}
export default function AppearancePage() {
  const context=useAppearance(),notify=useToast(),params=useSearchParams(),path=usePathname()||'';
  const requested=params.get('scope')==='company',company=requested&&context.actor?.role==='ADMIN';
  const [draft,setDraft]=useState<ColorChoice>({...DEFAULT_COLORS}),[allow,setAllow]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState('');
  useEffect(()=>{if(!context.snapshot)return;setDraft({...((company?context.snapshot.company.colors:context.snapshot.user.colors)||context.snapshot.effective.colors)});setAllow(context.snapshot.company.allowEmployeeCustomization);setError('');},[context.snapshot,company]);
  let validation='';try{validateColors(draft);}catch(e){validation=e instanceof Error?e.message:'Couleur invalide.';}
  const snapshot=context.snapshot,editable=!!snapshot&&(company||snapshot.effective.canCustomize);
  const base=path.match(/^\/pme\/[^/]+/)?.[0]||'';
  const persist=async(reset=false)=>{setSaving(true);setError('');try{if(company)await context.saveCompany({colors:reset?null:draft,allowEmployeeCustomization:allow});else await context.saveUser(reset?null:draft);notify('success',reset?'Couleurs rétablies':'Apparence enregistrée');}catch(e){setError(e instanceof Error?e.message:'Enregistrement impossible.');}finally{setSaving(false);}};
  return <div className="appearance-page"><SettingsPage title={company?'Apparence de l’entreprise':'Mon apparence'} description="Couleurs et ambiance de l’interface. Les documents officiels conservent leur présentation." onSubmit={e=>{e.preventDefault();if(editable&&!validation&&!saving)void persist();}} saveAction={editable?<Button type="submit" loading={saving} disabled={!!validation}>Enregistrer l’apparence</Button>:null} error={error}
    navigation={<div className="appearance-navigation"><Link href={base+'/mon-profil'}>Mon compte</Link>{context.actor?.role==='ADMIN'&&<><Link href={base+'/apparence'} aria-current={!company?'page':undefined}>Mes couleurs</Link><Link href={base+'/apparence?scope=company'} aria-current={company?'page':undefined}>Couleurs de l’entreprise</Link></>}</div>}>
    <Card title="Mode d’affichage"><ThemeControl/><p className="k-help">Le mode reste personnel, même si votre entreprise définit les couleurs.</p></Card>
    {context.loading&&!snapshot?<Card><div role="status" aria-label="Chargement de l’apparence"><Skeleton/><Skeleton style={{height:180,marginTop:20}}/></div></Card>:!context.available?<Card title="Personnalisation bientôt disponible"><p className="k-help">Les réglages de couleurs seront disponibles après le branchement du service. Le choix Clair / Sombre / Auto reste disponible.</p></Card>:!snapshot?<Card title="Apparence indisponible"><p role="alert" className="k-error">{context.error||'Connectez-vous pour retrouver vos couleurs.'}</p><Button variant="secondary" onClick={()=>void context.refresh()}>Réessayer</Button></Card>:<>
      {requested&&!company&&<p role="status" className="k-help">Seul l’admin de l’entreprise peut modifier ses couleurs.</p>}
      {!editable&&<Card title="Les couleurs sont définies par votre entreprise"><p className="k-help">Vos choix personnels restent conservés. Ils pourront être réutilisés si l’entreprise autorise la personnalisation.</p></Card>}
      {editable&&<Card title="Couleurs"><div className="appearance-fields"><fieldset><legend>Couleur d’accent</legend><div className="appearance-palettes">{ACCENT_PALETTES.map(([label,color])=><button key={label} type="button" aria-label={label} aria-pressed={draft.accent.toUpperCase()===color.toUpperCase()} onClick={()=>setDraft({...draft,accent:color})}><span style={{background:color}}/>{label}</button>)}</div></fieldset><div className="appearance-custom"><label>Choisir une couleur<input type="color" value={validation?DEFAULT_COLORS.accent:draft.accent} onChange={e=>setDraft({...draft,accent:e.target.value})}/></label><Input label="Code couleur" value={draft.accent} error={validation||undefined} onChange={e=>setDraft({...draft,accent:e.target.value})} placeholder="#F7874B" maxLength={7}/></div><div className="appearance-previews"><Select label="Ambiance claire" value={draft.ambianceLight} onChange={e=>setDraft({...draft,ambianceLight:e.target.value})}>{Object.entries(LIGHT_AMBIANCES).map(([value,a])=><option key={value} value={value}>{a.label}</option>)}</Select><Select label="Ambiance sombre" value={draft.ambianceDark} onChange={e=>setDraft({...draft,ambianceDark:e.target.value})}>{Object.entries(DARK_AMBIANCES).map(([value,a])=><option key={value} value={value}>{a.label}</option>)}</Select></div>
      {company&&<label className="appearance-policy"><input type="checkbox" checked={allow} onChange={e=>setAllow(e.target.checked)}/>Autoriser les employés à personnaliser leurs couleurs</label>}
      <div className="k-row"><Button variant="secondary" disabled={saving} onClick={()=>void persist(true)}>{company?'Rétablir les couleurs par défaut':'Revenir aux couleurs de mon entreprise'}</Button>{!company&&<Button variant="ghost" onClick={()=>setDraft({...DEFAULT_COLORS})}>Revenir aux couleurs Konza</Button>}</div></div></Card>}
      <Card title="Aperçu avant enregistrement"><AppearancePreview colors={validation?DEFAULT_COLORS:editable?draft:snapshot.effective.colors}/><p className="k-help">L’aperçu n’applique rien à votre équipe avant l’enregistrement. Les contrastes sont ajustés automatiquement pour les boutons et le focus.</p></Card>
    </>}
  </SettingsPage></div>;
}
