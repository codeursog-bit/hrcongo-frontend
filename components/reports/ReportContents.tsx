'use client';
import React from 'react';

export function ReportContents({ sections }: { sections: { id: string; label: string }[] }) {
  return <nav className="reports-contents" aria-label="Rubriques du rapport"><span>Dans ce rapport</span><div>{sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.label}</a>)}</div></nav>;
}
