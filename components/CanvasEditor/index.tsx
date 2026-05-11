'use client';

// ============================================================================
// components/CanvasEditor/index.tsx
//
// Éditeur visuel type Canva pour le bulletin de paie.
// Gauche  : Palette de blocs + Inspecteur du bloc sélectionné
// Droite  : Canvas avec blocs ordonnés (drag & drop dnd-kit) + Preview live
//
// L'utilisateur :
//   1. Glisse un bloc depuis la palette vers le canvas
//   2. Clique dessus pour l'éditer (variable, style, label)
//   3. Voit le résultat en temps réel avec ses vraies données paie
//   4. Sauvegarde → JSON stocké en BDD via PUT /companies/bulletin-template
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CanvasRenderer from '@/components/CanvasRenderer';
import type {
  CanvasLayout, CanvasBlock, CanvasBlockType, CanvasVariable,
  CanvasBlockStyle,
} from '@/types/canvas-block';
import {
  PALETTE_ITEMS, VARIABLE_GROUPS, VARIABLE_LABELS,
  DEFAULT_BLOCK_STYLE, REQUIRED_VARIABLES, EMPTY_CANVAS,
} from '@/types/canvas-block';
import type { BulletinPayroll } from '@/types/bulletin-template';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  payroll:  BulletinPayroll;
  initial?: CanvasLayout;
  onChange: (layout: CanvasLayout) => void;
}

// ─── Génération d'ID unique ───────────────────────────────────────────────────

let _uid = 0;
function uid() { return `blk_${Date.now()}_${++_uid}`; }

// ─── Bloc sur le canvas (drag & drop) ────────────────────────────────────────

function SortableCanvasBlock({
  block, selected, onSelect, onDelete, primaryColor,
}: {
  block: CanvasBlock;
  selected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  primaryColor: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });

  const needsVariable = !block.variable && !['divider','signatures'].includes(block.type);
  const labelMap: Record<string, string> = {
    header:'En-tête', 'value-card':'Carte valeur', 'info-grid':'Fiche employé',
    table:'Tableau', divider:'Séparateur', text:'Texte', signatures:'Signatures',
  };
  const iconMap: Record<string, string> = {
    header:'🏢', 'value-card':'💵', 'info-grid':'👤',
    table:'📋', divider:'➖', text:'💬', signatures:'✍️',
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 6,
        borderRadius: 8,
        border: selected
          ? `2px solid ${primaryColor}`
          : needsVariable
            ? '2px dashed #f59e0b'
            : '1.5px solid #e2e8f0',
        background: selected ? `${primaryColor}08` : needsVariable ? '#fffbeb' : '#fff',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Barre du bloc */}
      <div
        style={{
          display:'flex', alignItems:'center', gap:8,
          padding:'8px 10px',
          background: selected ? `${primaryColor}12` : '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
        onClick={() => onSelect(block.id)}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{ cursor:'grab', display:'flex', flexDirection:'column', gap:2.5, padding:'2px 4px', flexShrink:0 }}
          onClick={e => e.stopPropagation()}
        >
          {[0,1,2].map(i => <div key={i} style={{ width:12, height:2, borderRadius:1, background:'#cbd5e1' }} />)}
        </div>

        <span style={{ fontSize:14 }}>{iconMap[block.type] ?? '□'}</span>
        <span style={{ fontSize:12, fontWeight:600, color:'#0f172a', flex:1 }}>
          {block.label || labelMap[block.type] || block.type}
        </span>

        {/* Badge variable */}
        {block.variable && !['divider','signatures'].includes(block.type) && (
          <span style={{ fontSize:10, background: selected ? primaryColor : '#e0f2fe', color: selected ? '#fff' : '#0369a1', padding:'2px 7px', borderRadius:20, fontWeight:600, flexShrink:0 }}>
            {VARIABLE_LABELS[block.variable]?.split(' ').slice(0,3).join(' ') ?? block.variable}
          </span>
        )}

        {/* Alerte variable manquante */}
        {needsVariable && (
          <span style={{ fontSize:10, background:'#fef3c7', color:'#92400e', padding:'2px 7px', borderRadius:20, fontWeight:600, flexShrink:0 }}>
            ⚠️ Variable ?
          </span>
        )}

        {/* Bouton supprimer */}
        {!block.required && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(block.id); }}
            style={{ width:22, height:22, borderRadius:6, border:'none', background:'transparent', cursor:'pointer', color:'#94a3b8', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inspecteur du bloc sélectionné ──────────────────────────────────────────

function BlockInspector({
  block, onChange, primaryColor,
}: {
  block: CanvasBlock;
  onChange: (updated: CanvasBlock) => void;
  primaryColor: string;
}) {
  const setStyle = (key: keyof CanvasBlockStyle, val: any) => {
    onChange({ ...block, style: { ...block.style, [key]: val } });
  };

  const canHaveVariable = !['divider','signatures'].includes(block.type);
  const isTable         = block.type === 'table';
  const isText          = block.type === 'text';

  // Groupes de variables filtrés selon le type de bloc
  const filteredGroups = VARIABLE_GROUPS.filter(g => {
    if (isTable) return g.label === 'Tableaux détail';
    if (block.type === 'header') return ['Entreprise','Période & temps'].includes(g.label);
    if (block.type === 'info-grid') return g.label === 'Employé';
    if (block.type === 'value-card') return g.label === 'Montants clés';
    return true;
  });

  const SLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#94a3b8', marginBottom:7, marginTop:14 }}>
      {children}
    </div>
  );

  const Pill3 = ({ options, value, onChange: onCh }: {
    options: { val: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
      {options.map(o => (
        <button key={o.val} onClick={() => onCh(o.val)}
          style={{ padding:'5px 10px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer',
            border: value === o.val ? `2px solid ${primaryColor}` : '1.5px solid #e2e8f0',
            background: value === o.val ? `${primaryColor}0d` : '#fff', color:'#0f172a', transition:'all .12s' }}>
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ padding:'0 14px 14px' }}>
      {/* Nom du bloc */}
      <SLabel>Nom affiché</SLabel>
      <input
        value={block.label || ''}
        onChange={e => onChange({ ...block, label: e.target.value })}
        placeholder="Ex : Salaires du mois"
        style={{ width:'100%', padding:'7px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:12, outline:'none', boxSizing:'border-box' as const }}
        onFocus={e => e.target.style.borderColor = primaryColor}
        onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
      />

      {/* Variable */}
      {canHaveVariable && (
        <>
          <SLabel>Que doit afficher ce bloc ?</SLabel>
          {filteredGroups.map(group => (
            <div key={group.label} style={{ marginBottom:8 }}>
              <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, marginBottom:4 }}>{group.label}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {group.vars.map(v => (
                  <button key={v} onClick={() => onChange({ ...block, variable: v })}
                    style={{
                      padding:'6px 10px', borderRadius:7, textAlign:'left', cursor:'pointer', fontSize:11, fontWeight:500,
                      border: block.variable === v ? `2px solid ${primaryColor}` : '1px solid #e2e8f0',
                      background: block.variable === v ? `${primaryColor}0d` : '#f9fafb',
                      color: block.variable === v ? primaryColor : '#374151',
                      transition:'all .12s',
                    }}>
                    {block.variable === v && '✓ '}{VARIABLE_LABELS[v]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Texte statique */}
      {isText && block.variable === 'static.text' && (
        <>
          <SLabel>Contenu du texte</SLabel>
          <textarea
            value={block.staticText || ''}
            onChange={e => onChange({ ...block, staticText: e.target.value })}
            placeholder="Ex : Merci pour votre travail ce mois-ci !"
            rows={3}
            style={{ width:'100%', padding:'7px 10px', borderRadius:7, border:'1.5px solid #e2e8f0', fontSize:12, resize:'vertical', fontFamily:'inherit', outline:'none', boxSizing:'border-box' as const }}
          />
        </>
      )}

      {/* Couleurs */}
      <SLabel>Couleur d'accent</SLabel>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ position:'relative', width:36, height:36, borderRadius:8, background: block.style.accentColor, border:'1.5px solid #e2e8f0', overflow:'hidden', flexShrink:0 }}>
          <input type="color" value={block.style.accentColor} onChange={e => setStyle('accentColor', e.target.value)}
            style={{ position:'absolute', inset:-4, width:'180%', height:'180%', opacity:0, cursor:'pointer' }} />
        </div>
        <input type="text" value={block.style.accentColor}
          onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) setStyle('accentColor', e.target.value); }}
          style={{ fontSize:11, fontFamily:'monospace', padding:'4px 8px', borderRadius:6, border:'1px solid #e2e8f0', width:80, outline:'none' }} />
        <button onClick={() => setStyle('accentColor', primaryColor)}
          style={{ fontSize:10, padding:'4px 8px', borderRadius:6, border:'1px solid #e2e8f0', cursor:'pointer', background:'#f9fafb', color:'#374151' }}>
          Couleur app
        </button>
      </div>

      {/* Fond */}
      {block.type !== 'header' && block.type !== 'divider' && (
        <>
          <SLabel>Fond</SLabel>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {['#ffffff','#f8fafc','#f0f9ff','#f0fdf4','#fffbeb','#fef2f2'].map(c => (
              <div key={c} onClick={() => setStyle('backgroundColor', c)}
                style={{ width:26, height:26, borderRadius:6, background:c, border: block.style.backgroundColor === c ? `2px solid ${primaryColor}` : '1.5px solid #e2e8f0', cursor:'pointer' }} />
            ))}
          </div>
        </>
      )}

      {/* Taille police */}
      <SLabel>Taille du texte</SLabel>
      <Pill3
        options={[{val:'sm',label:'Petite'},{val:'md',label:'Normale'},{val:'lg',label:'Grande'}]}
        value={block.style.fontSize}
        onChange={v => setStyle('fontSize', v)}
      />

      {/* Espacement */}
      <SLabel>Espacement</SLabel>
      <Pill3
        options={[{val:'compact',label:'Compact'},{val:'normal',label:'Normal'},{val:'airy',label:'Aéré'}]}
        value={block.style.padding}
        onChange={v => setStyle('padding', v)}
      />

      {/* Coins */}
      <SLabel>Coins</SLabel>
      <Pill3
        options={[{val:'0',label:'Carré'},{val:'4',label:'Léger'},{val:'8',label:'Arrondi'},{val:'16',label:'Pilule'}]}
        value={String(block.style.borderRadius)}
        onChange={v => setStyle('borderRadius', Number(v) as 0|4|8|16)}
      />

      {/* Bordure */}
      <SLabel>Bordure</SLabel>
      <Pill3
        options={[{val:'true',label:'Avec bordure'},{val:'false',label:'Sans bordure'}]}
        value={String(block.style.showBorder)}
        onChange={v => setStyle('showBorder', v === 'true')}
      />
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CanvasEditor({ payroll, initial, onChange }: Props) {
  const [layout, setLayout] = useState<CanvasLayout>(
    initial ?? { ...EMPTY_CANVAS }
  );
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [draggingId, setDraggingId]   = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint:{ distance:6 } }));

  const update = useCallback((next: CanvasLayout) => {
    setLayout(next);
    onChange(next);
  }, [onChange]);

  const selectedBlock = layout.blocks.find(b => b.id === selectedId) ?? null;

  // ── Ajouter un bloc depuis la palette ────────────────────────────────────

  const addBlock = (type: CanvasBlockType, defaultVariable?: CanvasVariable) => {
    const item   = PALETTE_ITEMS.find(p => p.type === type);
    const newBlock: CanvasBlock = {
      id:       uid(),
      type,
      order:    layout.blocks.length,
      variable: defaultVariable ?? item?.defaultVariable,
      label:    item?.label ?? type,
      style: {
        ...DEFAULT_BLOCK_STYLE,
        accentColor: layout.primaryColor,
      },
    };
    const next = { ...layout, blocks: [...layout.blocks, newBlock] };
    update(next);
    setSelectedId(newBlock.id);
  };

  // ── Supprimer un bloc ────────────────────────────────────────────────────

  const deleteBlock = (id: string) => {
    const next = { ...layout, blocks: layout.blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, order:i })) };
    update(next);
    if (selectedId === id) setSelectedId(null);
  };

  // ── Mettre à jour un bloc ────────────────────────────────────────────────

  const updateBlock = (updated: CanvasBlock) => {
    update({ ...layout, blocks: layout.blocks.map(b => b.id === updated.id ? updated : b) });
  };

  // ── Drag & drop réorganisation ───────────────────────────────────────────

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null);
    if (!over || active.id === over.id) return;
    const ids    = layout.blocks.map(b => b.id);
    const oldIdx = ids.indexOf(String(active.id));
    const newIdx = ids.indexOf(String(over.id));
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = arrayMove(layout.blocks, oldIdx, newIdx).map((b, i) => ({ ...b, order:i }));
    update({ ...layout, blocks: reordered });
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const missingRequired = REQUIRED_VARIABLES.filter(rv =>
    !layout.blocks.some(b => b.variable === rv)
  );

  const uninspected = layout.blocks.filter(b =>
    !['divider','signatures'].includes(b.type) && !b.variable
  );

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  const p = layout.primaryColor;

  return (
    <div style={{ display:'flex', height:'100%', gap:0, fontFamily:'"Inter","Helvetica Neue",Arial,sans-serif', fontSize:12 }}>

      {/* ══ PANNEAU GAUCHE ══ */}
      <div style={{ width:280, flexShrink:0, background:'#fff', borderRight:'1.5px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Onglets Palette / Inspecteur */}
        <div style={{ display:'flex', borderBottom:'1.5px solid #e2e8f0', flexShrink:0 }}>
          {[
            { id:'palette',   label: selectedBlock ? '← Palette' : 'Palette' },
            { id:'inspector', label: selectedBlock ? `✏️ ${selectedBlock.label?.split(' ')[0] ?? 'Bloc'}` : 'Bloc…' },
          ].map(tab => {
            const activeTab = selectedBlock ? 'inspector' : 'palette';
            const isActive  = tab.id === activeTab;
            return (
              <button key={tab.id}
                onClick={() => { if (tab.id === 'palette') setSelectedId(null); }}
                style={{ flex:1, padding:'10px', fontSize:12, fontWeight:600, cursor:'pointer', border:'none',
                  background: isActive ? '#fff' : '#f8fafc',
                  color: isActive ? p : '#64748b',
                  borderBottom: isActive ? `2px solid ${p}` : '2px solid transparent',
                }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Palette de blocs */}
        {!selectedBlock && (
          <div style={{ flex:1, overflowY:'auto', padding:12 }}>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:10, lineHeight:1.6 }}>
              Cliquez sur un bloc pour l'ajouter au canvas →
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
              {PALETTE_ITEMS.map(item => (
                <button
                  key={item.type}
                  onClick={() => addBlock(item.type, item.defaultVariable)}
                  style={{
                    padding:'10px 12px', borderRadius:9, border:'1.5px solid #e2e8f0',
                    background:'#fff', cursor:'pointer', textAlign:'left', transition:'all .15s',
                    display:'flex', alignItems:'center', gap:10,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = p; (e.currentTarget as HTMLButtonElement).style.background = `${p}08`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
                >
                  <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:'#0f172a' }}>{item.label}</div>
                    <div style={{ fontSize:10, color:'#94a3b8', marginTop:1 }}>{item.description}</div>
                  </div>
                  <span style={{ marginLeft:'auto', fontSize:16, color:'#d1d5db', flexShrink:0 }}>+</span>
                </button>
              ))}
            </div>

            {/* Couleurs globales */}
            <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid #f1f5f9' }}>
              <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#94a3b8', marginBottom:10 }}>
                Couleurs globales
              </div>
              {[
                { label:'Principale',     key:'primaryColor' as const },
                { label:'Complémentaire', key:'secondaryColor' as const },
              ].map(c => (
                <div key={c.key} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ position:'relative', width:32, height:32, borderRadius:7, background: layout[c.key], border:'1.5px solid #e2e8f0', overflow:'hidden', flexShrink:0 }}>
                    <input type="color" value={layout[c.key]}
                      onChange={e => update({ ...layout, [c.key]: e.target.value })}
                      style={{ position:'absolute', inset:-4, width:'180%', height:'180%', opacity:0, cursor:'pointer' }} />
                  </div>
                  <div style={{ fontSize:11, color:'#0f172a' }}>{c.label}</div>
                  <div style={{ fontSize:11, fontFamily:'monospace', color:'#64748b', marginLeft:'auto' }}>{layout[c.key]}</div>
                </div>
              ))}
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', color:'#94a3b8', marginBottom:7 }}>Police</div>
                <div style={{ display:'flex', gap:5 }}>
                  {([['sans','Moderne'],['serif','Classique'],['mono','Technique']] as const).map(([v,l]) => (
                    <button key={v} onClick={() => update({ ...layout, fontFamily:v })}
                      style={{ flex:1, padding:'5px', borderRadius:7, fontSize:11, fontWeight:600, cursor:'pointer',
                        border: layout.fontFamily===v ? `2px solid ${p}` : '1.5px solid #e2e8f0',
                        background: layout.fontFamily===v ? `${p}0d` : '#fff', color:'#0f172a' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inspecteur du bloc sélectionné */}
        {selectedBlock && (
          <div style={{ flex:1, overflowY:'auto' }}>
            <BlockInspector
              block={selectedBlock}
              onChange={updateBlock}
              primaryColor={p}
            />
          </div>
        )}
      </div>

      {/* ══ CANVAS CENTRAL ══ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#f1f5f9' }}>

        {/* Barre canvas */}
        <div style={{ padding:'8px 14px', background:'#fff', borderBottom:'1.5px solid #e2e8f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:12, fontWeight:600, color:'#0f172a' }}>
              Canvas — {layout.blocks.length} bloc{layout.blocks.length > 1 ? 's' : ''}
            </span>
            {uninspected.length > 0 && (
              <span style={{ fontSize:10, background:'#fef3c7', color:'#92400e', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>
                ⚠️ {uninspected.length} bloc(s) sans variable
              </span>
            )}
            {missingRequired.length > 0 && (
              <span style={{ fontSize:10, background:'#fee2e2', color:'#991b1b', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>
                ✗ Manquants : {missingRequired.length}
              </span>
            )}
            {missingRequired.length === 0 && layout.blocks.length > 0 && uninspected.length === 0 && (
              <span style={{ fontSize:10, background:'#dcfce7', color:'#166534', padding:'2px 8px', borderRadius:20, fontWeight:600 }}>
                ✓ Bulletin valide
              </span>
            )}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button
              onClick={() => setShowPreview(v => !v)}
              style={{ padding:'6px 12px', borderRadius:7, border:`1.5px solid ${showPreview ? p : '#e2e8f0'}`, background: showPreview ? `${p}0d` : '#fff', color: showPreview ? p : '#64748b', fontSize:11, fontWeight:600, cursor:'pointer' }}>
              {showPreview ? '👁 Preview activée' : '👁 Preview désactivée'}
            </button>
            {layout.blocks.length > 0 && (
              <button
                onClick={() => { if (confirm('Vider le canvas ?')) { update({ ...EMPTY_CANVAS, primaryColor:p, secondaryColor:layout.secondaryColor }); setSelectedId(null); } }}
                style={{ padding:'6px 12px', borderRadius:7, border:'1.5px solid #fecaca', background:'#fff', color:'#dc2626', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                Vider
              </button>
            )}
          </div>
        </div>

        {/* Zone canvas + preview */}
        <div style={{ flex:1, overflowY:'auto', display:'flex', gap:12, padding:14 }}>

          {/* Liste des blocs (canvas ordonné) */}
          <div style={{ flex: showPreview ? '0 0 320px' : '1', minWidth:260 }}>
            <div style={{ fontSize:11, color:'#64748b', marginBottom:8 }}>
              Glissez ⠿ pour réordonner — cliquez pour éditer
            </div>

            {layout.blocks.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:10, border:'2px dashed #e2e8f0', padding:'40px 20px', textAlign:'center' }}>
                <div style={{ fontSize:28, marginBottom:10 }}>📄</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:5 }}>Canvas vide</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>Cliquez sur les blocs dans la palette à gauche</div>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter}
                onDragStart={({ active }: DragStartEvent) => setDraggingId(String(active.id))}
                onDragEnd={handleDragEnd}>
                <SortableContext
                  items={[...layout.blocks].sort((a,b)=>a.order-b.order).map(b => b.id)}
                  strategy={verticalListSortingStrategy}>
                  {[...layout.blocks].sort((a,b)=>a.order-b.order).map(block => (
                    <SortableCanvasBlock
                      key={block.id}
                      block={block}
                      selected={selectedId === block.id}
                      onSelect={setSelectedId}
                      onDelete={deleteBlock}
                      primaryColor={p}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}

            {/* Bouton rapide ajouter */}
            {layout.blocks.length > 0 && (
              <button
                onClick={() => setSelectedId(null)}
                style={{ width:'100%', marginTop:8, padding:'9px', borderRadius:8, border:`1.5px dashed ${p}`, background:`${p}06`, color:p, fontSize:12, fontWeight:600, cursor:'pointer' }}>
                + Ajouter un bloc (palette)
              </button>
            )}
          </div>

          {/* Preview live */}
          {showPreview && (
            <div style={{ flex:1, minWidth:320 }}>
              <div style={{ fontSize:11, color:'#64748b', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'#10B981', boxShadow:'0 0 0 3px #d1fae5' }} />
                Preview live — données réelles de votre dernier bulletin
              </div>
              <div style={{ background:'#fff', borderRadius:10, boxShadow:'0 2px 12px rgba(0,0,0,.08)', overflow:'hidden' }}>
                <CanvasRenderer layout={layout} payroll={payroll} previewMode />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
