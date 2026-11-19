'use client';
import React,{createContext,useContext,useState,useCallback,useEffect,useLayoutEffect,useRef} from 'react';
import {usePathname} from 'next/navigation';
import {featureActor} from '@/lib/data/context';
import {getAppearance,appearanceAvailable} from '@/lib/data/appearance';
import {APPEARANCE_EVENT,companyAppearanceKey,userAppearanceKey} from '@/lib/data/appearance.demo';
import {appearanceTokens,APPEARANCE_TOKENS} from '@/lib/appearance';
import {DEMO_MODE} from '@/lib/demo/config';
import type {AppearanceActor,AppearanceSnapshot,ColorChoice,CompanyAppearance} from '@/types/contracts/appearance';
import type {ThemePreference} from '@/lib/theme';
export const appearanceExcluded=(path:string)=>path==='/' || /^\/(auth|admin|cabinet|portefeuille|kiosk|ecran|design-system|docs|blog|tarifs|contact|privacy|terms)(\/|$)/.test(path);
function actorFor(path:string):AppearanceActor {const actor=featureActor(),match=path.match(/^\/pme\/([^/]+)/);return {...actor,companyId:match?decodeURIComponent(match[1]):actor.companyId};}
interface Context {available:boolean;loading:boolean;error:string;actor:AppearanceActor|null;snapshot:AppearanceSnapshot|null;refresh:()=>Promise<void>;saveUser:(colors:ColorChoice|null)=>Promise<void>;saveCompany:(value:CompanyAppearance)=>Promise<void>}
const AppearanceContext=createContext<Context|null>(null);
export function AppearanceProvider({children,theme,preference,onServerPreference}:{children:React.ReactNode;theme:'light'|'dark';preference:ThemePreference;onServerPreference?:(mode:ThemePreference,userId:string)=>void}) {
  const path=usePathname()||'';const excluded=appearanceExcluded(path);
  const [state,setState]=useState<{actor:AppearanceActor|null;snapshot:AppearanceSnapshot|null}>({actor:null,snapshot:null});
  const [loading,setLoading]=useState(appearanceAvailable),[error,setError]=useState('');const generation=useRef(0);
  const modeRevision=useRef(0),pendingModes=useRef(0),modeWrites=useRef<Promise<void>>(Promise.resolve());
  const refresh=useCallback(async()=>{const current=++generation.current;if(!appearanceAvailable||appearanceExcluded(path)){setState({actor:null,snapshot:null});setLoading(false);return;}
    const actor=actorFor(path);if(!actor.id||!actor.companyId){setState({actor:null,snapshot:null});setLoading(false);return;}
    const revision=modeRevision.current;
    setLoading(true);try{const snapshot=await getAppearance(actor).get();if(current===generation.current){setState({actor,snapshot});setError('');if(!DEMO_MODE&&!pendingModes.current&&revision===modeRevision.current)onServerPreference?.(snapshot.user.mode,actor.id);}}catch(e){if(current===generation.current){setError(e instanceof Error?e.message:'Apparence indisponible.');setState({actor,snapshot:null});}}finally{if(current===generation.current)setLoading(false);}
  },[path,onServerPreference]);
  useEffect(()=>{void refresh();const sync=()=>void refresh();window.addEventListener(APPEARANCE_EVENT,sync);window.addEventListener('storage',sync);window.addEventListener('focus',sync);return()=>{generation.current++;window.removeEventListener(APPEARANCE_EVENT,sync);window.removeEventListener('storage',sync);window.removeEventListener('focus',sync);};},[refresh]);
  useEffect(()=>{
    const syncMode=(event:Event)=>{const mode=(event as CustomEvent).detail;if(!appearanceAvailable||excluded||!['light','dark','auto'].includes(mode))return;
      const actor=actorFor(path);if(!actor.id||!actor.companyId)return;
      modeRevision.current++;pendingModes.current++;
      modeWrites.current=modeWrites.current.then(async()=>{try{const adapter=getAppearance(actor),snapshot=await adapter.get(),current=actorFor(path);if(current.id!==actor.id||current.companyId!==actor.companyId)return;await adapter.saveUser({...snapshot.user,mode});}catch(e){setError(e instanceof Error?e.message:'Mode conservé sur cet appareil.');}finally{pendingModes.current--;if(!pendingModes.current)await refresh();}});
    };
    window.addEventListener('konza:appearance:mode-changed',syncMode);return()=>window.removeEventListener('konza:appearance:mode-changed',syncMode);
  },[path,excluded,refresh]);
  useLayoutEffect(()=>{
    const root=document.documentElement,actor=actorFor(path);
    const active=appearanceAvailable&&!excluded&&state.snapshot&&state.actor?.id===actor.id&&state.actor.companyId===actor.companyId;
    if(!active){if(loading&&!excluded&&appearanceAvailable&&root.dataset.appearanceIdentity===actor.id+':'+actor.companyId)return;APPEARANCE_TOKENS.forEach(key=>root.style.removeProperty(key));delete root.dataset.appearanceIdentity;return;}
    const colors=state.snapshot!.effective.colors,light=appearanceTokens(colors,false),dark=appearanceTokens(colors,true);
    Object.entries(theme==='dark'?dark:light).forEach(([key,value])=>root.style.setProperty(key,value));
    root.dataset.appearanceIdentity=actor.id+':'+actor.companyId;
    try{const cache={userId:actor.id,companyId:actor.companyId,companyRaw:localStorage.getItem(companyAppearanceKey(actor.companyId)),userRaw:localStorage.getItem(userAppearanceKey(actor.id)),light,dark};localStorage.setItem('konza:appearance:cache:'+(DEMO_MODE?'demo':'api')+':'+actor.id+':'+actor.companyId,JSON.stringify(cache));}catch{/* colour preferences remain usable in memory */}
  },[state,theme,path,excluded,loading]);
  const current=()=>{const actor=actorFor(path);if(!actor.id||!actor.companyId||excluded||!appearanceAvailable)throw new Error('Apparence indisponible.');return actor;};
  const saveUser=async(colors:ColorChoice|null)=>{await getAppearance(current()).saveUser({mode:preference,colors});await refresh();};
  const saveCompany=async(value:CompanyAppearance)=>{await getAppearance(current()).saveCompany(value);await refresh();};
  const actor=typeof window==='undefined'?null:actorFor(path);
  const matches=!!actor&&state.actor?.id===actor.id&&state.actor?.companyId===actor.companyId;
  return <AppearanceContext.Provider value={{available:appearanceAvailable,loading:loading||!!actor?.id&&!matches&&!excluded&&appearanceAvailable,error,actor:matches?state.actor:null,snapshot:matches?state.snapshot:null,refresh,saveUser,saveCompany}}>{children}</AppearanceContext.Provider>;
}
export function useAppearance(){const value=useContext(AppearanceContext);if(!value)throw new Error('AppearanceProvider requis.');return value;}
