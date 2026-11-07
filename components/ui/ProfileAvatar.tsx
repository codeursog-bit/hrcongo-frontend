'use client';
import React,{useState} from 'react';

export function ProfileAvatar({src,name,className='h-9 w-9 rounded-xl'}:{src?:string|null;name:string;className?:string}){
 const [failed,setFailed]=useState<string|null>(null);
 if(src&&src!==failed)return <img src={src} alt={name} className={`${className} object-cover`} onError={()=>setFailed(src)}/>;
 const initials=name.trim().split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]??'').join('').toLocaleUpperCase('fr-FR')||'?';
 return <span role="img" aria-label={name} className={`${className} inline-flex shrink-0 items-center justify-center bg-emerald-500/15 text-sm font-bold text-emerald-600 dark:text-emerald-400`}>{initials}</span>;
}
