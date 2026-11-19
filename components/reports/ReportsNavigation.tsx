'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import RapportsSubNav from '@/components/RapportsSubNav';

export function ReportsNavigation() {
  const path = usePathname();
  const active = path.slice(path.indexOf('/rapports')) || '/rapports';
  return <RapportsSubNav active={active} />;
}
export const ReportsQuickNav = ReportsNavigation;
