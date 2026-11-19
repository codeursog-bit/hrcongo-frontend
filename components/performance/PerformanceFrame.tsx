'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';
import './performance.css';

export function PerformanceFrame(props:React.ComponentProps<typeof ModulePageFrame>) {
  const path=usePathname()||'';
  if(/^\/(admin|cabinet)(\/|$)/.test(path))return <ModulePageFrame {...props}/>;
  return <MotionConfig reducedMotion="user"><div className="performance-workspace"><ModulePageFrame {...props}/></div></MotionConfig>;
}
