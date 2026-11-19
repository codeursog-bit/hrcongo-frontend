'use client';
import React,{Suspense} from 'react';
import AppearancePage from '@/components/appearance/AppearancePage';
export default function Page(){return <Suspense fallback={<p role="status">Chargement de l’apparence…</p>}><AppearancePage/></Suspense>;}
