'use client';
import React from 'react';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';
import './leave-workspace.css';

export function LeaveModuleFrame(props: React.ComponentProps<typeof ModulePageFrame>) {
  return <div className="leave-workspace"><ModulePageFrame {...props} /></div>;
}
