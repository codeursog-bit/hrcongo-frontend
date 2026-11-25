'use client';

import BulletinRenderer from '@/components/BulletinRenderer';
import BulletinRendererClarifie from '@/components/BulletinRendererClarifie';
import BulletinRendererClassique from '@/components/BulletinRendererClassique';
import BulletinRendererInf from '@/components/BulletinRendererInf';
import { getBaseTemplate } from '@/lib/bulletin-templates';
import type { BulletinPayroll } from '@/types/bulletin-template';

const renderers = { default: BulletinRenderer, clarifie: BulletinRendererClarifie,
  classique: BulletinRendererClassique, inf: BulletinRendererInf };

export default function HistoricPayslip({ source, payroll }: {
  source: keyof typeof renderers;
  payroll: BulletinPayroll;
}) {
  const Renderer = renderers[source];
  return <Renderer template={getBaseTemplate(source)} payroll={payroll} />;
}
