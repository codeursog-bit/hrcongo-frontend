'use client';
import React, { useEffect, useRef, useState } from 'react';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';
import { ListPage, DetailPage } from '@/components/templates';
import { RecruitmentNav } from './recruitment-ui';
import './recruitment.css';

export function RecruitmentFrame(props: React.ComponentProps<typeof ModulePageFrame>) {
  return <div className="recruitment-workspace"><ModulePageFrame {...props} /></div>;
}
export function RecruitmentListPage(props: React.ComponentProps<typeof ListPage>) {
  return <div className="recruitment-workspace recruitment-legacy-list"><ListPage {...props} navigation={props.navigation ?? <RecruitmentNav />} /></div>;
}
export function RecruitmentDetailPage(props: React.ComponentProps<typeof DetailPage>) {
  return <div className="recruitment-workspace recruitment-candidate-page"><DetailPage {...props} navigation={props.navigation ?? <RecruitmentNav />} /></div>;
}

/** Jump between existing form sections. Every field stays mounted and validated. */
export function RecruitmentFormOutline({ sections }: { sections: Array<{ id: string; label: string }> }) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(() => sections.map(section => section.id));
  const key = sections.map(section => section.id).join('|');
  useEffect(() => {
    const layout = ref.current?.closest('.recruitment-form-layout');
    if (!layout) return;
    const sync = () => { const ids = sections.filter(section => layout.querySelector(`#${section.id}`)).map(section => section.id); setVisible(previous => previous.join('|') === ids.join('|') ? previous : ids); };
    sync(); const observer = new MutationObserver(sync); observer.observe(layout, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [key]);
  return <nav ref={ref} className="recruitment-form-outline" aria-label="Rubriques de l’offre"><span>Votre offre</span><ol>{sections.filter(section => visible.includes(section.id)).map((section,index) => <li key={section.id}><a href={`#${section.id}`}><span>{String(index+1).padStart(2,'0')}</span>{section.label}</a></li>)}</ol></nav>;
}
