'use client';

// ============================================================================
// app/(dashboard)/parametres/bulletin/page.tsx
// Éditeur complet de bulletin — ultra-simple, split-screen, drag & drop
//
// INSTALLATION : npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/services/api';
import { invalidateBulletinTemplateCache } from '@/hooks/useBulletinTemplate';
import BulletinRenderer from '@/components/BulletinRenderer';
import type {
  BulletinTemplateConfig, BlockConfig, StyleConfig,
  BorderRadius, TemplateId, BulletinPayroll,
} from '@/types/bulletin-template';
import { TEMPLATE_LIST, getBaseTemplate } from '@/lib/bulletin-templates';

// ─── Données démo preview ────────────────────────────────────────────────────

const DEMO: BulletinPayroll = {
  id:'preview', month: new Date().getMonth()+1, year: new Date().getFullYear(),
  status:'VALIDATED', workDays:26, workedDays:24, absenceDays:2, daysOnLeave:0, daysRemote:2,
  overtimeHours10:4, overtimeHours25:2, baseSalary:450000, grossSalary:512000,
  netSalary:438750, totalDeductions:73250, totalBonuses:62000, totalEmployerCost:625400,
  absenceDeduction:34615, cnssSalarial:18000, cnssEmployer:72000,
  cnssEmployerPension:36000, cnssEmployerFamily:25000, cnssEmployerAccident:11000,
  its:55250, tusDgiAmount:10375, tusCnssAmount:28012, tusTotal:38387,
  items:[
    {id:'1',code:'BASE',label:'Salaire de base',type:'GAIN',amount:450000,base:450000,rate:1,isTaxable:true,isCnss:true,order:1},
    {id:'2',code:'OT10',label:'Heures sup. (+10%)',type:'GAIN',amount:12000,rate:0.1,isTaxable:true,isCnss:true,order:2},
    {id:'3',code:'OT25',label:'Heures sup. (+25%)',type:'GAIN',amount:8000,rate:0.25,isTaxable:true,isCnss:true,order:3},
    {id:'4',code:'PRIME_TRANSPORT',label:'Prime de transport',type:'GAIN',amount:30000,isTaxable:false,isCnss:false,order:4},
    {id:'5',code:'PRIME_REPAS',label:'Indemnité de repas',type:'GAIN',amount:24000,isTaxable:false,isCnss:false,order:5},
    {id:'6',code:'CNSS_SAL',label:'CNSS Salariale',type:'DEDUCTION',amount:18000,base:450000,rate:0.04,isTaxable:false,isCnss:true,order:1},
    {id:'7',code:'ITS',label:'ITS',type:'DEDUCTION',amount:55250,base:512000,isTaxable:false,isCnss:false,order:2},
  ],
  bonuses:[{id:'p1',label:'Prime de transport',amount:30000},{id:'p2',label:'Indemnité de repas',amount:24000}],
  employee:{
    id:'emp1',firstName:'Jean-Baptiste',lastName:'Mouamba',employeeNumber:'EMP-2024-042',
    position:'Responsable Comptable',cnssNumber:'CN-4892-76',nationalIdNumber:'CG-19882-B',
    paymentMethod:'BANK_TRANSFER',maritalStatus:'MARRIED',numberOfChildren:2,
    contractType:'CDI',hireDate:'2021-03-15',professionalCategory:'III',echelon:'B',
    department:{name:'Finance & Comptabilité'},
  },
  company:{
    legalName:'Société Générale Congo S.A.',tradeName:'SG Congo',
    address:'34, Avenue Amilcar Cabral',city:'Brazzaville',phone:'+242 06 000 0000',
    rccmNumber:'CG/BZV/24/B/0042',cnssNumber:'CNSS-0042-BZV',
  },
};

// ─── Meta blocs ──────────────────────────────────────────────────────────────

const BLOC_META: Record<string, { emoji:string; desc:string; required?:boolean; appOnly?:boolean }> = {
  header:     {emoji:'🏢',desc:'Logo, nom, adresse, numéros fiscaux',    required:true  },
  employee:   {emoji:'👤',desc:'Nom, poste, contrat, CNSS, ancienneté',  required:true  },
  time:       {emoji:'📅',desc:'Jours travaillés, absences, congés, HS'                 },
  salary:     {emoji:'💰',desc:'Salaire de base et gains',               required:true  },
  overtime:   {emoji:'⏰',desc:'Heures sup. — Décret n°78-360'                         },
  bonuses:    {emoji:'🎁',desc:'Transport, repas, primes diverses'                      },
  deductions: {emoji:'🏛',desc:'CNSS salariale + ITS/IRPP',             required:true  },
  employer:   {emoji:'🏗',desc:'CNSS patronale + TUS (coût employeur)'                 },
  net:        {emoji:'💵',desc:'Montant net versé à l\'employé',         required:true  },
  recap:      {emoji:'📊',desc:'Brut / net / coût total — synthèse'                    },
  signatures: {emoji:'✍',desc:'Zone signatures employeur + employé'                   },
  message:    {emoji:'💬',desc:'Message personnalisé de l\'employeur'                  },
  legal:      {emoji:'📋',desc:'Réglementation Congo 2026',              appOnly:true   },
};

const COLOR_PRESETS = [
  {name:'KonzaRH',     p:'#0EA5E9',s:'#10B981'},
  {name:'Forêt Congo', p:'#16A34A',s:'#65A30D'},
  {name:'Rouge',       p:'#DC2626',s:'#F59E0B'},
  {name:'Violet',      p:'#7C3AED',s:'#EC4899'},
  {name:'Indigo',      p:'#4F46E5',s:'#0EA5E9'},
  {name:'Ocre',        p:'#B45309',s:'#059669'},
  {name:'Ardoise',     p:'#475569',s:'#0EA5E9'},
  {name:'Or & Nuit',   p:'#111827',s:'#D97706'},
];

// ─── SortableBlock ─────────────────────────────────────────────────────────

function SortableBlock({ block, onToggle, onRename, primary }: {
  block: BlockConfig;
  onToggle: (id:string) => void;
  onRename: (id:string, label:string) => void;
  primary: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const meta = BLOC_META[block.id] ?? { emoji:'□', desc:'' };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(block.label);

  const commit = () => { onRename(block.id, draft || block.label); setEditing(false); };

  return (
    <div ref={setNodeRef} style={{
      transform: CSS.Transform.toString(transform), transition,
      display:'flex', alignItems:'center', gap:10,
      padding:'10px 12px', borderRadius:10, marginBottom:6,
      border: block.visible ? '1.5px solid #e2e8f0' : '1.5px dashed #e2e8f0',
      background: isDragging ? '#eff6ff' : block.visible ? '#fff' : '#f9fafb',
      opacity: isDragging ? 0.7 : 1,
    }}>
      <div {...attributes} {...listeners} style={{ cursor:'grab', display:'flex', flexDirection:'column', gap:3, padding:'2px 3px', flexShrink:0 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:13, height:2, borderRadius:1, background:'#cbd5e1' }} />)}
      </div>

      <span style={{ fontSize:15, flexShrink:0 }}>{meta.emoji}</span>

      <div style={{ flex:1, minWidth:0 }}>
        {editing ? (
          <input autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key==='Enter' && commit()}
            style={{ width:'100%', padding:'2px 6px', borderRadius:5, border:`1.5px solid ${primary}`, fontSize:12, fontWeight:600, outline:'none', boxSizing:'border-box' as const }} />
        ) : (
          <div onClick={() => setEditing(true)} title="Cliquer pour renommer"
            style={{ fontSize:12, fontWeight:600, color: block.visible ? '#0f172a' : '#94a3b8', cursor:'text', padding:'2px 0' }}>
            {block.label}
          </div>
        )}
        <div style={{ fontSize:10, color:'#94a3b8', marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {meta.desc}
          {meta.appOnly  && <span style={{ marginLeft:5, fontSize:9, background:'#f0f9ff', color:'#0284c7', padding:'1px 4px', borderRadius:4, fontWeight:700 }}>app seul</span>}
          {meta.required && <span style={{ marginLeft:5, fontSize:9, background:'#f0fdf4', color:'#16a34a', padding:'1px 4px', borderRadius:4, fontWeight:700 }}>obligatoire</span>}
        </div>
      </div>

      <button onClick={() => !meta.required && onToggle(block.id)}
        title={meta.required ? 'Ce bloc est obligatoire' : (block.visible ? 'Masquer' : 'Afficher')}
        style={{ width:38, height:21, borderRadius:11, border:'none', cursor: meta.required ? 'not-allowed' : 'pointer',
          background: block.visible ? primary : '#e2e8f0', transition:'background .2s', position:'relative', flexShrink:0, opacity: meta.required ? 0.45 : 1 }}>
        <div style={{ position:'absolute', top:2, width:17, height:17, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.2)', transition:'left .2s', left: block.visible ? 18 : 2 }} />
      </button>
    </div>
  );
}

// ─── Micro-composants ─────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase' as const, letterSpacing:'.08em', color:'#94a3b8', marginBottom:8 }}>{children}</div>;
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize:11, color:'#64748b', marginBottom:12, lineHeight:1.6, margin:'0 0 12px' }}>{children}</p>;
}

function ToggleRow({ label, sub, val, onChange, primary }: { label:string; sub:string; val:boolean; onChange:()=>void; primary:string }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, border:'1.5px solid #e2e8f0', marginBottom:8, background:'#fff' }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{label}</div>
        <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{sub}</div>
      </div>
      <button onClick={onChange} style={{ width:38, height:21, borderRadius:11, border:'none', cursor:'pointer', flexShrink:0, position:'relative', background: val ? primary : '#e2e8f0', transition:'background .2s' }}>
        <div style={{ position:'absolute', top:2, width:17, height:17, borderRadius:'50%', background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,.2)', transition:'left .2s', left: val ? 18 : 2 }} />
      </button>
    </div>
  );
}

function PillGrid({ children, cols=3 }: { children: React.ReactNode; cols?: number }) {
  return <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:6, marginBottom:0 }}>{children}</div>;
}

function Pill({ label, sub, active, onClick, primary }: { label:string; sub?:string; active:boolean; onClick:()=>void; primary:string }) {
  return (
    <button onClick={onClick} style={{
      padding:'8px 6px', borderRadius:8, cursor:'pointer', textAlign:'center' as const, width:'100%',
      border: active ? `2px solid ${primary}` : '1.5px solid #e2e8f0',
      background: active ? `${primary}0d` : '#fff', transition:'all .15s',
    }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#0f172a' }}>{label}</div>
      {sub && <div style={{ fontSize:9, color:'#94a3b8' }}>{sub}</div>}
    </button>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function BulletinDesignerPage() {
  const [cfg, setCfg]       = useState<BulletinTemplateConfig>(getBaseTemplate('default'));
  const [payroll, setPayroll] = useState<BulletinPayroll>(DEMO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [tab, setTab]         = useState<'gabarit'|'style'|'blocs'|'options'>('gabarit');
  const [toast, setToast]     = useState<{msg:string;ok:boolean}|null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint:{ distance:6 } }));

  useEffect(() => {
    (async () => {
      try {
        const [tRes, pRes] = await Promise.allSettled([
          api.get<{config:BulletinTemplateConfig}>('/companies/bulletin-template'),
          api.get<any[]>('/payrolls?limit=1&sort=createdAt:desc'),
        ]);
        if (tRes.status==='fulfilled' && tRes.value?.config) {
          const base = getBaseTemplate(tRes.value.config.templateId ?? 'default');
          setCfg({ ...base, ...tRes.value.config, style:{ ...base.style, ...tRes.value.config.style },
            blocks: tRes.value.config.blocks?.length ? tRes.value.config.blocks : base.blocks });
        }
        if (pRes.status==='fulfilled' && pRes.value?.[0]) setPayroll(pRes.value[0]);
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, []);

  const setStyle = useCallback(<K extends keyof StyleConfig>(k:K, v:StyleConfig[K]) => {
    setCfg(prev => ({ ...prev, style: { ...prev.style, [k]:v } }));
  }, []);

  const applyTemplate = (id: TemplateId) => {
    const base = getBaseTemplate(id);
    setCfg(prev => ({ ...base, style: { ...base.style, primaryColor:prev.style.primaryColor, secondaryColor:prev.style.secondaryColor } }));
  };

  const toggleBlock = (id:string) => {
    setCfg(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id===id ? {...b,visible:!b.visible} : b) }));
  };

  const renameBlock = (id:string, label:string) => {
    setCfg(prev => ({ ...prev, blocks: prev.blocks.map(b => b.id===id ? {...b,label} : b) }));
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
  if (!over || active.id === over.id) return;
  setCfg(prev => {
    const ids: string[] = prev.blocks.map(b => b.id as string);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return prev;
    return {
      ...prev,
      blocks: arrayMove(prev.blocks, oldIdx, newIdx).map((b, i) => ({ ...b, order: i })),
    };
  });
};

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/companies/bulletin-template', cfg);
      invalidateBulletinTemplateCache();
      flash('Bulletin enregistré — actif partout dans l\'application ✓', true);
    } catch { flash('Erreur lors de l\'enregistrement. Réessayez.', false); }
    finally { setSaving(false); }
  };

  const flash = (msg:string, ok:boolean) => { setToast({msg,ok}); setTimeout(()=>setToast(null),3500); };

  // ── Onglet Gabarit ──────────────────────────────────────────────────────────

  const GabaritTab = () => (
    <div>
      <Sub>Choisissez un gabarit de départ. Vous pourrez tout modifier ensuite dans les autres onglets.</Sub>
      {TEMPLATE_LIST.map(tpl => {
        const active = cfg.templateId===tpl.templateId;
        return (
          <div key={tpl.templateId} onClick={() => applyTemplate(tpl.templateId)}
            style={{ padding:'12px 14px', borderRadius:10, cursor:'pointer', marginBottom:8,
              border: active ? `2px solid ${cfg.style.primaryColor}` : '1.5px solid #e2e8f0',
              background: active ? `${cfg.style.primaryColor}0d` : '#fff', transition:'all .15s' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:3 }}>{tpl.name}</div>
                <div style={{ fontSize:10.5, color:'#64748b' }}>
                  {tpl.style.layout==='2col'?'2 colonnes':'1 colonne'} · {tpl.style.density==='compact'?'Dense':tpl.style.density==='airy'?'Aéré':'Normal'} · {tpl.style.headerStyle==='dark'?'En-tête sombre':tpl.style.headerStyle==='gradient'?'En-tête coloré':tpl.style.headerStyle==='line'?'Sobre':'Minimaliste'}
                </div>
              </div>
              {active && (
                <div style={{ width:20, height:20, borderRadius:'50%', background:cfg.style.primaryColor, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </div>
            <div style={{ marginTop:8, display:'flex', gap:3, height:5 }}>
              <div style={{ flex:2, borderRadius:2, background: active ? tpl.style.primaryColor : '#cbd5e1' }} />
              <div style={{ flex:3, borderRadius:2, background:'#e5e7eb' }} />
              <div style={{ flex:1, borderRadius:2, background: active ? tpl.style.secondaryColor : '#e5e7eb' }} />
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Onglet Style ────────────────────────────────────────────────────────────

  const StyleTab = () => (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <Label>Palette de couleurs</Label>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
          {COLOR_PRESETS.map(pr => {
            const active = cfg.style.primaryColor===pr.p;
            return (
              <button key={pr.name} onClick={()=>{setStyle('primaryColor',pr.p);setStyle('secondaryColor',pr.s);}}
                style={{ padding:'8px 10px', borderRadius:8, cursor:'pointer', textAlign:'left' as const,
                  border: active ? `2px solid ${pr.p}` : '1.5px solid #e2e8f0',
                  background: active ? `${pr.p}12` : '#fff', transition:'all .15s' }}>
                <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                  <div style={{ width:16, height:16, borderRadius:4, background:pr.p }} />
                  <div style={{ width:16, height:16, borderRadius:4, background:pr.s }} />
                </div>
                <div style={{ fontSize:11, fontWeight:600, color:'#374151' }}>{pr.name}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Couleurs personnalisées</Label>
        {([['Couleur principale','primaryColor'],['Couleur complémentaire','secondaryColor']] as const).map(([lbl,k]) => (
          <div key={k} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <div style={{ position:'relative', width:40, height:40, borderRadius:8, background:cfg.style[k], border:'1.5px solid #e2e8f0', overflow:'hidden', flexShrink:0, boxShadow:`0 2px 6px ${cfg.style[k]}66` }}>
              <input type="color" value={cfg.style[k]} onChange={e=>setStyle(k,e.target.value)} style={{ position:'absolute', inset:-4, width:'180%', height:'180%', opacity:0, cursor:'pointer' }} />
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>{lbl}</div>
              <input type="text" value={cfg.style[k]}
                onChange={e=>{ if(/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setStyle(k,e.target.value); }}
                style={{ fontSize:11, fontFamily:'monospace', padding:'3px 8px', borderRadius:6, border:'1px solid #e2e8f0', color:'#374151', width:88, marginTop:2, outline:'none' }} />
            </div>
          </div>
        ))}
      </div>

      <div>
        <Label>Style d'écriture</Label>
        <PillGrid>
          {([['sans','Moderne','Inter'],['serif','Classique','Georgia'],['mono','Technique','Mono']] as const).map(([v,l,s])=>(
            <Pill key={v} label={l} sub={s} active={cfg.style.fontFamily===v} onClick={()=>setStyle('fontFamily',v)} primary={cfg.style.primaryColor} />
          ))}
        </PillGrid>
      </div>

      <div>
        <Label>Taille du texte</Label>
        <PillGrid>
          {([['sm','Petite'],['md','Normale'],['lg','Grande']] as const).map(([v,l])=>(
            <Pill key={v} label={l} active={cfg.style.fontSize===v} onClick={()=>setStyle('fontSize',v)} primary={cfg.style.primaryColor} />
          ))}
        </PillGrid>
      </div>

      <div>
        <Label>Espacement</Label>
        <PillGrid>
          {([['compact','Compact','Dense'],['normal','Normal','Équilibré'],['airy','Aéré','Spacieux']] as const).map(([v,l,s])=>(
            <Pill key={v} label={l} sub={s} active={cfg.style.density===v} onClick={()=>setStyle('density',v)} primary={cfg.style.primaryColor} />
          ))}
        </PillGrid>
      </div>

      <div>
        <Label>Forme des éléments (coins)</Label>
        <PillGrid cols={4}>
          {([0,4,8,16] as BorderRadius[]).map(v=>(
            <button key={v} onClick={()=>setStyle('borderRadius',v)} style={{
              padding:'8px 4px', borderRadius:v, cursor:'pointer', width:'100%',
              border: cfg.style.borderRadius===v ? `2px solid ${cfg.style.primaryColor}` : '1.5px solid #e2e8f0',
              background: cfg.style.borderRadius===v ? `${cfg.style.primaryColor}0d` : '#fff', transition:'all .15s' }}>
              <div style={{ width:24, height:14, borderRadius:v, background: cfg.style.borderRadius===v ? cfg.style.primaryColor : '#e5e7eb', margin:'0 auto 4px' }} />
              <div style={{ fontSize:9, color:'#64748b' }}>{v===0?'Carré':v===4?'Léger':v===8?'Arrondi':'Pilule'}</div>
            </button>
          ))}
        </PillGrid>
      </div>

      <div>
        <Label>Style de l'en-tête</Label>
        <PillGrid cols={2}>
          {([['gradient','🌈 Dégradé coloré'],['dark','🌑 Fond sombre'],['line','📏 Sobre & ligne'],['minimal','✂️ Minimaliste']] as const).map(([v,l])=>(
            <Pill key={v} label={l} active={cfg.style.headerStyle===v} onClick={()=>setStyle('headerStyle',v)} primary={cfg.style.primaryColor} />
          ))}
        </PillGrid>
      </div>

      <div>
        <Label>Disposition du bulletin</Label>
        <PillGrid cols={2}>
          <button onClick={()=>setStyle('layout','1col')} style={{ padding:'10px', borderRadius:8, cursor:'pointer', border: cfg.style.layout==='1col' ? `2px solid ${cfg.style.primaryColor}` : '1.5px solid #e2e8f0', background: cfg.style.layout==='1col' ? `${cfg.style.primaryColor}0d` : '#fff', transition:'all .15s' }}>
            <div style={{ height:20, borderRadius:4, background: cfg.style.layout==='1col' ? cfg.style.primaryColor : '#e5e7eb', marginBottom:5 }} />
            <div style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>1 colonne</div>
          </button>
          <button onClick={()=>setStyle('layout','2col')} style={{ padding:'10px', borderRadius:8, cursor:'pointer', border: cfg.style.layout==='2col' ? `2px solid ${cfg.style.primaryColor}` : '1.5px solid #e2e8f0', background: cfg.style.layout==='2col' ? `${cfg.style.primaryColor}0d` : '#fff', transition:'all .15s' }}>
            <div style={{ display:'flex', gap:3, height:20, marginBottom:5 }}>
              <div style={{ flex:1, borderRadius:4, background: cfg.style.layout==='2col' ? cfg.style.primaryColor : '#e5e7eb' }} />
              <div style={{ flex:1, borderRadius:4, background: cfg.style.layout==='2col' ? `${cfg.style.primaryColor}88` : '#e5e7eb' }} />
            </div>
            <div style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>2 colonnes</div>
          </button>
        </PillGrid>
      </div>
    </div>
  );

  // ── Onglet Blocs ────────────────────────────────────────────────────────────

  const BlocsTab = () => {
    const ordered = [...cfg.blocks].sort((a,b)=>a.order-b.order);
    return (
      <div>
        <Sub>Glissez ⠿ pour réordonner. Cliquez sur un nom pour le renommer. L'interrupteur active/désactive le bloc.</Sub>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ordered.map(b=>b.id)} strategy={verticalListSortingStrategy}>
            {ordered.map(block=>(
              <SortableBlock key={block.id} block={block} onToggle={toggleBlock} onRename={renameBlock} primary={cfg.style.primaryColor} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    );
  };

  // ── Onglet Options ──────────────────────────────────────────────────────────

  const OptionsTab = () => (
    <div>
      <Label>En-tête entreprise</Label>
      <ToggleRow label="Logo de l'entreprise" sub="Affiché en haut du bulletin" val={cfg.style.showLogo} onChange={()=>setStyle('showLogo',!cfg.style.showLogo)} primary={cfg.style.primaryColor} />
      <ToggleRow label="Adresse" sub="Adresse et ville de l'entreprise" val={cfg.style.showAddress} onChange={()=>setStyle('showAddress',!cfg.style.showAddress)} primary={cfg.style.primaryColor} />
      <ToggleRow label="Numéros officiels" sub="RCCM, CNSS employeur, téléphone" val={cfg.style.showFiscalNumbers} onChange={()=>setStyle('showFiscalNumbers',!cfg.style.showFiscalNumbers)} primary={cfg.style.primaryColor} />

      {cfg.style.showLogo && (
        <div style={{ marginBottom:16, marginTop:8 }}>
          <Label>Position du logo</Label>
          <PillGrid>
            {(['left','center','right'] as const).map(v=>(
              <Pill key={v} label={v==='left'?'Gauche':v==='center'?'Centre':'Droite'} active={cfg.style.logoPosition===v} onClick={()=>setStyle('logoPosition',v)} primary={cfg.style.primaryColor} />
            ))}
          </PillGrid>
        </div>
      )}

      <div style={{ marginTop:16 }}>
        <Label>Pied de page</Label>
        <ToggleRow label="Numéro de page" sub="Page 1/1 en bas" val={cfg.style.showPageNumber} onChange={()=>setStyle('showPageNumber',!cfg.style.showPageNumber)} primary={cfg.style.primaryColor} />
        <ToggleRow label="Date de génération" sub="Date à laquelle le bulletin a été créé" val={cfg.style.showGeneratedDate} onChange={()=>setStyle('showGeneratedDate',!cfg.style.showGeneratedDate)} primary={cfg.style.primaryColor} />
        <ToggleRow label="Ligne signature RH" sub="Zone signature du responsable RH" val={cfg.style.showHrSignature} onChange={()=>setStyle('showHrSignature',!cfg.style.showHrSignature)} primary={cfg.style.primaryColor} />
      </div>

      <div style={{ marginTop:16 }}>
        <Label>Message pour vos employés</Label>
        <Sub>Apparaît dans un encadré en bas du bulletin. Activez aussi le bloc "Message employeur" dans l'onglet Blocs.</Sub>
        <textarea
          value={cfg.style.footerMessage}
          onChange={e=>setStyle('footerMessage',e.target.value)}
          placeholder="Ex : Merci pour votre engagement ce mois-ci. Bonne continuation à tous !"
          rows={4}
          style={{ width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e2e8f0', fontSize:12, color:'#0f172a', resize:'vertical' as const, fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const }}
          onFocus={e=>e.target.style.borderColor=cfg.style.primaryColor}
          onBlur={e=>e.target.style.borderColor='#e2e8f0'}
        />
      </div>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'80vh', gap:14, fontFamily:'Inter,sans-serif' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid #e2e8f0', borderTopColor:'#0EA5E9', animation:'spin .8s linear infinite' }} />
      <div style={{ color:'#64748b', fontSize:14 }}>Chargement de votre bulletin…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const TABS = [
    {id:'gabarit',label:'🏗 Gabarit'},
    {id:'style',  label:'🎨 Style'},
    {id:'blocs',  label:'📦 Blocs'},
    {id:'options',label:'⚙️ Options'},
  ] as const;

  const p = cfg.style.primaryColor;

  return (
    <div style={{ display:'grid', gridTemplateColumns: showPreview ? '360px 1fr' : '460px', height:'calc(100vh - 80px)', overflow:'hidden', fontFamily:'"Inter","Helvetica Neue",Arial,sans-serif', background:'#f8fafc' }}>

      {/* ══ PANNEAU GAUCHE ══ */}
      <div style={{ background:'#fff', borderRight:'1.5px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'16px 16px 0', borderBottom:'1px solid #f1f5f9', flexShrink:0 }}>
          <h1 style={{ fontSize:16, fontWeight:800, color:'#0f172a', margin:'0 0 2px' }}>Mon bulletin de paie</h1>
          <p style={{ fontSize:11, color:'#64748b', margin:'0 0 12px' }}>Personnalisez l'apparence — la preview se met à jour en temps réel</p>
          <div style={{ display:'flex', gap:5, flexWrap:'wrap' as const, marginBottom:12 }}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as typeof tab)}
                style={{ padding:'7px 12px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer', transition:'all .15s',
                  background: tab===t.id ? p : 'transparent', color: tab===t.id ? '#fff' : '#64748b',
                  border: tab===t.id ? 'none' : '1.5px solid #e2e8f0' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>
          {tab==='gabarit' && <GabaritTab />}
          {tab==='style'   && <StyleTab   />}
          {tab==='blocs'   && <BlocsTab   />}
          {tab==='options' && <OptionsTab />}
        </div>

        <div style={{ padding:'14px 16px', borderTop:'1.5px solid #e2e8f0', display:'flex', gap:8, flexShrink:0 }}>
          <button onClick={save} disabled={saving}
            style={{ flex:1, padding:'12px', borderRadius:10, border:'none', cursor: saving?'wait':'pointer',
              background:p, color:'#fff', fontSize:13, fontWeight:700, opacity: saving?0.7:1,
              boxShadow:`0 3px 10px ${p}44`, transition:'all .15s' }}>
            {saving ? '⏳ Enregistrement…' : '✅ Enregistrer'}
          </button>
          <button onClick={() => { if(confirm(`Revenir au gabarit "${cfg.name}" d'origine ?`)) setCfg(getBaseTemplate(cfg.templateId)); }}
            title="Réinitialiser au gabarit de base"
            style={{ padding:'12px 13px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, background:'#fff', border:'1.5px solid #e2e8f0', color:'#64748b' }}>↺</button>
          <button onClick={()=>setShowPreview(v=>!v)} title={showPreview?'Masquer preview':'Afficher preview'}
            style={{ padding:'12px 13px', borderRadius:10, cursor:'pointer', fontSize:13, background: showPreview?'#f0f9ff':'#fff', border:`1.5px solid ${showPreview?p:'#e2e8f0'}`, color: showPreview?p:'#64748b' }}>👁</button>
        </div>
      </div>

      {/* ══ PANNEAU DROIT — PREVIEW LIVE ══ */}
      {showPreview && (
        <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div style={{ padding:'10px 16px', background:'#fff', borderBottom:'1.5px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#10B981', boxShadow:'0 0 0 3px #d1fae5' }} />
              <span style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>Preview live</span>
              <span style={{ fontSize:11, color:'#94a3b8' }}>— exactement ce que verront vos employés</span>
            </div>
            <button onClick={()=>window.print()}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1.5px solid #e2e8f0', background:'#fff', cursor:'pointer', fontSize:12, fontWeight:600, color:'#374151' }}>
              🖨️ Imprimer / PDF
            </button>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:'20px', background:'#f1f5f9', display:'flex', justifyContent:'center' }}>
            <div style={{ width:794, background:'#fff', borderRadius:10, boxShadow:'0 4px 20px rgba(0,0,0,.1)', overflow:'hidden' }}>
              <BulletinRenderer payroll={payroll} template={cfg} previewMode />
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, padding:'12px 18px', borderRadius:10, fontSize:12, fontWeight:700, color:'#fff', background: toast.ok?'#10B981':'#EF4444', boxShadow:'0 6px 20px rgba(0,0,0,.2)', animation:'fadeUp .3s ease' }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
