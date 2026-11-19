import type { ColorChoice, CompanyAppearance, UserAppearance, AppearanceSnapshot } from '@/types/contracts/appearance';
export const DEFAULT_COLORS: ColorChoice = { accent:'#F7874B', ambianceLight:'neutral', ambianceDark:'anthracite' };
export const ACCENT_PALETTES = [ ['Orange Konza','#F7874B'],['Terracotta','#C86A50'],['Corail','#E66F68'],['Moutarde','#C49430'],['Olive','#7C9245'],['Forêt','#40836C'],['Lagon','#248B93'],['Bleu','#507FB9'],['Prune','#976F9B'],['Graphite','#73767B'] ] as const;
export const LIGHT_AMBIANCES = {
  neutral:{label:'Gris-blanc',bg:'#F3F4F4',surface:'#FAFAFA',surface2:'#ECEEEE',text:'#26282A',muted:'#62686D',border:'rgba(20,20,20,0.06)'},
  warm:{label:'Blanc chaud',bg:'#F7F5F1',surface:'#FDFBF7',surface2:'#EDEAE3',text:'#302C27',muted:'#696157',border:'rgba(35,28,20,0.06)'},
  cream:{label:'Crème',bg:'#F6F2E8',surface:'#FCF9F1',surface2:'#EAE4D7',text:'#302D25',muted:'#696354',border:'rgba(35,30,20,0.06)'},
  stone:{label:'Gris pierre',bg:'#EEEDEB',surface:'#F8F7F5',surface2:'#E1DFDB',text:'#292826',muted:'#65615B',border:'rgba(30,28,24,0.06)'},
};
export const DARK_AMBIANCES = {
  anthracite:{label:'Anthracite',bg:'#171717',surface:'#212121',surface2:'#2A2A2A',text:'#F2F2F2',muted:'#B8B8B8',border:'rgba(255,255,255,0.07)'},
  graphite:{label:'Graphite',bg:'#202122',surface:'#282A2B',surface2:'#333638',text:'#F4F4F4',muted:'#BFC2C4',border:'rgba(255,255,255,0.07)'},
  warm:{label:'Sombre chaud',bg:'#201C19',surface:'#292420',surface2:'#37302A',text:'#F6F1EB',muted:'#C4B8AC',border:'rgba(255,255,255,0.07)'},
};
export function validateColors(value: unknown): asserts value is ColorChoice {
  const c=value as ColorChoice;
  if (!c || !/^#[\da-f]{6}$/i.test(c.accent || '') || !Object.hasOwn(LIGHT_AMBIANCES,c.ambianceLight) || !Object.hasOwn(DARK_AMBIANCES,c.ambianceDark)) throw new Error('Choisissez une couleur au format #RRGGBB et des ambiances proposées.');
}
export function resolveAppearance(company: CompanyAppearance, user: UserAppearance): AppearanceSnapshot {
  const personal=company.allowEmployeeCustomization && !!user.colors;
  return {company,user,effective:{colors:personal ? user.colors! : company.colors || DEFAULT_COLORS,mode:user.mode,source:personal?'USER':company.colors?'COMPANY':'DEFAULT',canCustomize:company.allowEmployeeCustomization}};
}
const rgb=(hex:string)=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const hex=(values:number[])=>'#'+values.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
const mix=(a:number[],b:number[],ratio:number)=>a.map((v,i)=>v*ratio+b[i]*(1-ratio));
const luminance=(values:number[])=>values.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
export function contrast(a:string,b:string) {const x=luminance(rgb(a)),y=luminance(rgb(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
/** Only appearance tokens; semantic colours and document branding are excluded. */
export function appearanceTokens(choice:ColorChoice, dark:boolean): Record<string,string> {
  validateColors(choice);
  const a=dark?DARK_AMBIANCES[choice.ambianceDark as keyof typeof DARK_AMBIANCES]:LIGHT_AMBIANCES[choice.ambianceLight as keyof typeof LIGHT_AMBIANCES];
  let brand=choice.accent;
  if(dark)for(let i=0;i<=100;i++){brand=hex(mix(rgb(choice.accent),[255,255,255],1-i/100));if(contrast(brand,hex(mix(rgb(brand),rgb(a.surface),.14)))>=4.5)break;}
  let action=brand,ratio=100;
  const target=dark?'white':'black',end=dark?[255,255,255]:[0,0,0];
  const soft=hex(mix(rgb(brand),rgb(a.surface),dark?.14:.2));
  for(let i=0;i<=100;i++){ratio=100-i;action=hex(mix(rgb(brand),end,ratio/100));if(contrast(action,a.surface)>=4.5&&contrast(action,soft)>=4.5)break;}
  let focusRatio=70;
  while(focusRatio>0 && contrast(hex(mix(rgb(brand),rgb(a.text),focusRatio/100)),a.surface)<3)focusRatio-=5;
  const on=contrast(action,'#FFFFFF')>=contrast(action,'#000000')?'#FFFFFF':'#000000';
  return {'--bg':a.bg,'--surface':a.surface,'--surface-2':a.surface2,'--border':a.border,'--text':a.text,'--text-muted':a.muted,'--text-secondary':a.muted,'--brand':brand,'--brand-strong':`color-mix(in srgb, var(--brand) ${dark?84:88}%, ${dark?'white':'black'})`,'--brand-soft':`color-mix(in srgb, var(--brand) ${dark?14:20}%, ${dark?'transparent':'var(--surface)'})`,'--focus':`color-mix(in srgb, var(--brand) ${focusRatio}%, var(--text))`,'--action':`color-mix(in srgb, var(--brand) ${ratio}%, ${target})`,'--on-brand':on,'--on-brand-surface':contrast(brand,'#FFFFFF')>=contrast(brand,'#000000')?'#FFFFFF':'#000000'};
}
export const APPEARANCE_TOKENS=Object.keys(appearanceTokens(DEFAULT_COLORS,false));
