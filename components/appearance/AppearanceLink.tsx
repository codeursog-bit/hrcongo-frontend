'use client';
import React from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Card} from '@/components/design-system/primitives';
export function AppearanceLink({company=false}:{company?:boolean}) {const path=usePathname()||'',base=path.match(/^\/pme\/[^/]+/)?.[0]||'';return <Card title="Apparence"><p className="k-help">{company?'Définir les couleurs d’interface de l’entreprise et autoriser la personnalisation.':'Retrouver vos couleurs et les règles définies par votre entreprise.'}</p><Link className="k-link" href={base+'/apparence'+(company?'?scope=company':'')} style={{display:'inline-block',marginTop:16}}>Personnaliser les couleurs</Link></Card>;}
