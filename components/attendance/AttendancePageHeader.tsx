'use client';
import React from 'react';
export function AttendancePageHeader({title, description, children}: {title:string;description:string;children?:React.ReactNode}) {
  return <header className="attendance-page-header"><div><h1>{title}</h1><p>{description}</p></div>{children && <div className="attendance-header-actions">{children}</div>}</header>;
}
