'use client';
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, AlertTriangle, Moon, QrCode, Settings } from 'lucide-react';
import { DEMO_MODE } from '@/lib/demo/config';
import { DemoBadge } from '@/components/providers/DemoProvider';
import './attendance-display.css';

function DisplayPreview({kind}:{kind:'qr'|'kiosk'}) {
  const [state,setState]=useState(kind==='qr'?'qr':'setup');
  const [time,setTime]=useState('—');
  useEffect(()=>{const update=()=>setTime(new Date().toLocaleTimeString('fr-FR',{timeZone:'Africa/Brazzaville',hour:'2-digit',minute:'2-digit'}));update();const id=setInterval(update,1000);return()=>clearInterval(id);},[]);
  return <main className="attendance-display-preview">
    <DemoBadge />
    <header><span>KONZA RH · Mavoula Services</span><p>Aperçu tablette · aucun pointage enregistré</p></header>
    <nav aria-label="Scénario de démonstration">{[['qr','QR'],['setup','Configuration'],['pairing','Appairage'],['success','Succès'],['error','Refus'],['sleep','Veille']].map(([value,label])=><button key={value} onClick={()=>setState(value)} aria-pressed={state===value}>{label}</button>)}</nav>
    <section className="attendance-display-preview-card" aria-live="polite">
      <p className="attendance-display-clock">{time}</p>
      {state==='qr'&&<><h1>Bienvenue à Brazzaville</h1><p>Scannez le QR depuis Ma pointeuse.</p><div className="attendance-display-qr"><QRCodeSVG value="KONZA-DEMO-NON-VALIDE" size={240} level="M" /></div><p>QR de présentation non valide · renouvellement simulé</p></>}
      {state==='setup'&&<><Settings size={40}/><h1>Configuration de la tablette</h1><p>La clé de la tablette sera fournie par votre administrateur.</p><label>Clé API<input disabled type="password" value="demo-non-valide" readOnly /></label><button onClick={()=>setState('qr')}>Voir l’écran de pointage</button></>}
      {state==='pairing'&&<><QrCode size={40}/><h1>Associer cet écran</h1><p>Présences → Écrans QR</p><strong className="attendance-display-pairing">DEMO42</strong><p>Code fictif, aucun appareil n’est approuvé.</p></>}
      {state==='success'&&<><CheckCircle2 size={80} className="attendance-display-positive"/><h1>Bienvenue, Laure !</h1><p>Exemple de confirmation d’entrée</p><p>Simulation visuelle · aucune donnée RH modifiée</p></>}
      {state==='error'&&<><AlertTriangle size={80} className="attendance-display-warning"/><h1>Code non reconnu</h1><p>Vérifiez votre code ou contactez votre administrateur.</p><button onClick={()=>setState('qr')}>Revenir au pointage</button></>}
      {state==='sleep'&&<><Moon size={48}/><h1>Écran en veille</h1><p>Hors des horaires de travail.</p><button onClick={()=>setState('qr')}>Réveiller l’écran</button></>}
    </section><footer>Les scénarios servent à prévisualiser l’affichage. Caméra, NFC et géolocalisation ne sont pas sollicités.</footer>
  </main>;
}
export function AttendanceDisplayFrame({children,kind}:{children:React.ReactNode;kind:'qr'|'kiosk'}) {
  return <div className="attendance-display">{DEMO_MODE?<DisplayPreview kind={kind}/>:children}</div>;
}
