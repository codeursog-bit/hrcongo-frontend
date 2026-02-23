'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Save, Loader2, AlertCircle, DollarSign,
  Calendar, Clock, Gift, Minus, Plus, Check
} from 'lucide-react';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PayrollEditData {
  id: string;
  status: string;
  month: number;
  year: number;
  baseSalary: number;
  grossSalary: number;
  netSalary: number;
  workDays: number;
  workedDays: number;
  absenceDays: number;
  cnssSalarial: number;
  its: number;
  overtimeHours10?: number;
  overtimeHours25?: number;
  overtimeHours50?: number;
  overtimeHours100?: number;
  employee?: {
    id: string;
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
    position?: string;
  };
}

interface EmployeeBonus {
  id: string;
  bonusType: string;
  fixedAmount: number | null;
  percentage: number | null;
  calculationType: 'FIXED_AMOUNT' | 'PERCENTAGE';
  frequency: string;
  isActive: boolean;
  // ✅ Flags fiscaux — lus depuis la BDD
  isTaxable: boolean;
  isCnss: boolean;
}

const MONTHS = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];

const fmt = (v: number) => Math.round(v ?? 0).toLocaleString('fr-FR');

// ✅ Badge fiscal non modifiable — juste pour affichage
const FiscalBadge = ({ label, active, color }: { label: string; active: boolean; color: 'cyan' | 'emerald' }) => {
  if (!active) return null;
  return (
    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ml-1 ${
      color === 'cyan'
        ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-700'
        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700'
    }`}>
      {label}
    </span>
  );
};

// ✅ Badge si prime NON imposable → versée directement au net
const NetBadge = () => (
  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full border ml-1
                   bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700">
    Net direct
  </span>
);

export default function EditPayrollPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const alert  = useAlert();

  const [payroll, setPayroll]     = useState<PayrollEditData | null>(null);
  const [bonuses, setBonuses]     = useState<EmployeeBonus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [saved, setSaved]         = useState(false);

  const [baseSalary, setBaseSalary] = useState(0);
  const [workedDays, setWorkedDays] = useState(0);
  const [ot10,  setOt10]            = useState(0);
  const [ot25,  setOt25]            = useState(0);
  const [ot50,  setOt50]            = useState(0);
  const [ot100, setOt100]           = useState(0);

  const [bonusEdits, setBonusEdits]     = useState<Record<string, number>>({});
  const [dirtyBonuses, setDirtyBonuses] = useState<Set<string>>(new Set());

  useEffect(() => { loadPayroll(); }, [params.id]);

  const loadPayroll = async () => {
    try {
      const data = await api.get<PayrollEditData>(`/payrolls/${params.id}`);

      if (data.status !== 'DRAFT') {
        alert.error('Non modifiable', `Un bulletin "${data.status}" ne peut pas être modifié.`);
        router.push(`/paie/${params.id}`);
        return;
      }

      setPayroll(data);
      setBaseSalary(Number(data.baseSalary));
      setWorkedDays(data.workedDays ?? data.workDays ?? 26);
      setOt10(Number(data.overtimeHours10  ?? 0));
      setOt25(Number(data.overtimeHours25  ?? 0));
      setOt50(Number(data.overtimeHours50  ?? 0));
      setOt100(Number(data.overtimeHours100 ?? 0));

      if ((data as any).employee?.id) {
        try {
          const bonusData: any = await api.get(
            `/employee-bonuses?employeeId=${(data as any).employee.id}`
          );
          const list: EmployeeBonus[] = Array.isArray(bonusData)
            ? bonusData
            : bonusData?.data || [];

          // Seules les primes à montant fixe sont modifiables ici
          const fixedBonuses = list.filter(
            b => b.isActive && b.calculationType === 'FIXED_AMOUNT'
          );
          setBonuses(fixedBonuses);

          const initEdits: Record<string, number> = {};
          fixedBonuses.forEach(b => {
            initEdits[b.id] = Number(b.fixedAmount ?? 0);
          });
          setBonusEdits(initEdits);
        } catch {
          // Non bloquant
        }
      }
    } catch {
      alert.error('Erreur', 'Impossible de charger le bulletin.');
      router.push('/paie');
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = payroll ? (
    baseSalary !== Number(payroll.baseSalary)                        ||
    workedDays !== (payroll.workedDays ?? payroll.workDays ?? 26)    ||
    ot10       !== Number(payroll.overtimeHours10  ?? 0)             ||
    ot25       !== Number(payroll.overtimeHours25  ?? 0)             ||
    ot50       !== Number(payroll.overtimeHours50  ?? 0)             ||
    ot100      !== Number(payroll.overtimeHours100 ?? 0)             ||
    dirtyBonuses.size > 0
  ) : false;

  const handleSave = async () => {
    if (!payroll) return;

    const workDays = payroll.workDays ?? 26;

    if (workedDays < 0 || workedDays > workDays) {
      alert.error('Valeur invalide', `Les jours travaillés doivent être entre 0 et ${workDays}.`);
      return;
    }
    if (baseSalary < 70400) {
      alert.error('Salaire invalide', 'Le salaire ne peut pas être inférieur au SMIG (70 400 FCFA).');
      return;
    }

    setIsSaving(true);
    const bonusErrors: string[] = [];

    try {
      await api.patch(`/payrolls/${params.id}`, {
        baseSalary,
        workedDays,
        overtimeHours10:  ot10,
        overtimeHours25:  ot25,
        overtimeHours50:  ot50,
        overtimeHours100: ot100,
      });

      if (dirtyBonuses.size > 0) {
        await Promise.all(
          Array.from(dirtyBonuses).map(async (bonusId) => {
            try {
              await api.patch(`/employee-bonuses/${bonusId}`, {
                fixedAmount: bonusEdits[bonusId],
              });
            } catch {
              bonusErrors.push(
                bonuses.find(b => b.id === bonusId)?.bonusType ?? bonusId
              );
            }
          })
        );
      }

      if (bonusErrors.length > 0) {
        alert.error(
          'Bulletin sauvegardé',
          `${bonusErrors.length} prime(s) n'ont pas pu être modifiées : ${bonusErrors.join(', ')}.`
        );
      } else {
        setSaved(true);
        setTimeout(() => router.push(`/paie/${params.id}`), 800);
      }
    } catch (e: any) {
      alert.error(
        'Erreur de sauvegarde',
        e?.response?.data?.message || e?.message || 'Impossible de sauvegarder.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const OtRow = ({
    label, sub, value, onChange,
  }: { label: string; sub: string; value: number; onChange: (v: number) => void }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', background: 'rgba(251,146,60,0.06)',
      borderRadius: 10, marginBottom: 6,
    }}>
      <div style={{ width: 54, flexShrink: 0 }}>
        <span style={{ fontWeight: 800, color: '#f97316', fontSize: 13 }}>{label}</span>
        <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0', lineHeight: 1.3 }}>{sub}</p>
      </div>
      <button
        onClick={() => onChange(Math.max(0, +(value - 0.5).toFixed(1)))}
        style={{
          width: 28, height: 28, borderRadius: 6,
          border: '1px solid #e5e7eb', background: 'white',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <Minus size={12} />
      </button>
      <span style={{
        minWidth: 44, textAlign: 'center', fontWeight: 700,
        fontFamily: 'monospace', fontSize: 15,
      }}>
        {value.toFixed(1)}
      </span>
      <button
        onClick={() => onChange(+(value + 0.5).toFixed(1))}
        style={{
          width: 28, height: 28, borderRadius: 6,
          border: '1px solid #e5e7eb', background: 'white',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        <Plus size={12} />
      </button>
      <span style={{ fontSize: 11, color: '#9ca3af' }}>h</span>
    </div>
  );

  if (isLoading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={32} color="#6366f1" className="animate-spin" />
    </div>
  );

  if (!payroll) return null;

  const workDays    = payroll.workDays ?? 26;
  const absenceDays = Math.max(0, workDays - workedDays);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px 16px 60px', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 38, height: 38, borderRadius: 10, border: '1px solid #e5e7eb',
            background: 'white', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <ArrowLeft size={18} color="#6b7280" />
        </button>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#111827' }}>
            Modifier le bulletin
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
            {payroll.employee?.firstName} {payroll.employee?.lastName}
            {' · '}{MONTHS[payroll.month - 1]} {payroll.year}
          </p>
        </div>
        <div style={{
          marginLeft: 'auto', padding: '4px 10px',
          background: '#fef9c3', border: '1px solid #fde047',
          borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#854d0e',
        }}>
          DRAFT
        </div>
      </div>

      {/* ── Notice ── */}
      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        background: '#f0f9ff', border: '1px solid #bae6fd',
        borderRadius: 12, marginBottom: 20,
      }}>
        <AlertCircle size={15} color="#0284c7" style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 12, color: '#0369a1', lineHeight: 1.6 }}>
          Après sauvegarde, le bulletin sera <strong>recalculé automatiquement</strong> par le
          backend — CNSS, ITS et net à payer seront mis à jour.
        </p>
      </div>

      {/* ── Valeurs actuelles ── */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
        <h3 style={{
          margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#9ca3af',
          textTransform: 'uppercase', letterSpacing: '.6px',
        }}>
          Valeurs actuelles (avant modification)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Brut',    value: fmt(payroll.grossSalary)  + ' F', color: '#10b981' },
            { label: 'CNSS',    value: fmt(payroll.cnssSalarial) + ' F', color: '#ef4444' },
            { label: 'Net',     value: fmt(payroll.netSalary)    + ' F', color: '#6366f1' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '10px 12px', background: '#f9fafb', borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af', fontWeight: 700 }}>{label}</p>
              <p style={{ margin: '4px 0 0', fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Salaire de base ── */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <DollarSign size={16} color="#10b981" />
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111827' }}>Salaire de base</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="number"
            value={baseSalary}
            onChange={e => setBaseSalary(Number(e.target.value))}
            style={{
              flex: 1, padding: '11px 14px',
              border: `1px solid ${baseSalary < 70400 ? '#fca5a5' : baseSalary !== Number(payroll.baseSalary) ? '#86efac' : '#e5e7eb'}`,
              borderRadius: 10, fontSize: 16, fontWeight: 700,
              fontFamily: 'monospace', outline: 'none',
              background: baseSalary !== Number(payroll.baseSalary) ? '#f0fdf4' : 'white',
              transition: 'border-color .2s',
            }}
          />
          <span style={{ fontSize: 13, color: '#9ca3af', whiteSpace: 'nowrap' }}>FCFA</span>
        </div>

        {baseSalary < 70400 ? (
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#ef4444' }}>
            ⚠️ Inférieur au SMIG (70 400 FCFA)
          </p>
        ) : baseSalary !== Number(payroll.baseSalary) ? (
          <p style={{ margin: '6px 0 0', fontSize: 11, color: '#10b981' }}>
            ✓ {fmt(payroll.baseSalary)} → {fmt(baseSalary)} FCFA
          </p>
        ) : null}
      </div>

      {/* ── Présence ── */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Calendar size={16} color="#6366f1" />
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111827' }}>Présence</h3>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>
            Base : {workDays} jours ouvrables
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <button
            onClick={() => setWorkedDays(d => Math.max(0, d - 1))}
            style={{
              width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb',
              background: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Minus size={14} />
          </button>
          <input
            type="number" min={0} max={workDays} value={workedDays}
            onChange={e => setWorkedDays(Math.min(workDays, Math.max(0, Number(e.target.value))))}
            style={{
              width: 64, padding: '9px', border: '1px solid #e5e7eb',
              borderRadius: 8, textAlign: 'center', fontWeight: 800,
              fontSize: 18, outline: 'none', fontFamily: 'monospace',
            }}
          />
          <button
            onClick={() => setWorkedDays(d => Math.min(workDays, d + 1))}
            style={{
              width: 34, height: 34, borderRadius: 8, border: '1px solid #e5e7eb',
              background: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <Plus size={14} />
          </button>

          {absenceDays > 0 ? (
            <span style={{ fontSize: 13, color: '#f97316', fontWeight: 600 }}>
              → {absenceDays} jour{absenceDays > 1 ? 's' : ''} d'absence
            </span>
          ) : (
            <span style={{ fontSize: 13, color: '#10b981', fontWeight: 600 }}>✓ Mois complet</span>
          )}
        </div>

        <div style={{ height: 7, borderRadius: 99, background: '#f3f4f6', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99, transition: 'width .3s, background .3s',
            width: `${(workedDays / workDays) * 100}%`,
            background: absenceDays === 0 ? '#10b981' : '#f97316',
          }} />
        </div>
      </div>

      {/* ── Heures supplémentaires ── */}
      <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Clock size={16} color="#f97316" />
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111827' }}>
            Heures supplémentaires
          </h3>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>Décret 78-360</span>
        </div>
        <OtRow label="+10%"  sub="5 premières heures"   value={ot10}  onChange={setOt10} />
        <OtRow label="+25%"  sub="Heures suivantes"     value={ot25}  onChange={setOt25} />
        <OtRow label="+50%"  sub="Nuit / repos / férié" value={ot50}  onChange={setOt50} />
        <OtRow label="+100%" sub="Nuit dim. / férié"    value={ot100} onChange={setOt100} />

        {(ot10 + ot25 + ot50 + ot100) > 0 && (
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: 'rgba(249,115,22,.08)', borderRadius: 8,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>
              Total : {(ot10 + ot25 + ot50 + ot100).toFixed(1)} h sup
            </span>
          </div>
        )}
      </div>

      {/* ✅ Primes — avec badges isTaxable et isCnss ── */}
      {bonuses.length > 0 && (
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Gift size={16} color="#06b6d4" />
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#111827' }}>
              Primes de l'employé
            </h3>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 11, color: '#9ca3af' }}>
            Seules les primes à montant fixe sont modifiables ici.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bonuses.map(b => {
              const currentVal = bonusEdits[b.id] ?? Number(b.fixedAmount ?? 0);
              const isDirty    = dirtyBonuses.has(b.id);
              const origVal    = Number(b.fixedAmount ?? 0);

              // ✅ Détecter le type de prime pour afficher le bon badge
              const isNonTaxable = b.isTaxable === false;
              const taxableOnly  = b.isTaxable && b.isCnss === false;

              return (
                <div key={b.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  background: isDirty ? '#f0fdf4' : '#f9fafb',
                  border: `1px solid ${isDirty ? '#86efac' : '#f3f4f6'}`,
                  borderRadius: 10,
                  transition: 'background .2s, border-color .2s',
                }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                      {b.bonusType}
                    </span>
                    <span style={{ marginLeft: 8, fontSize: 11, color: '#9ca3af' }}>
                      {b.frequency === 'MONTHLY' ? 'mensuelle' : 'ponctuelle'}
                    </span>
                    {/* ✅ Badges fiscaux — lecture seule dans l'éditeur de bulletin */}
                    <span style={{ display: 'inline-flex', gap: 4, marginLeft: 6, verticalAlign: 'middle' }}>
                      {!isNonTaxable && (
                        <>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '1px 6px',
                            borderRadius: 99, border: '1px solid #a5f3fc',
                            background: '#cffafe', color: '#0e7490',
                          }}>ITS</span>
                          {!taxableOnly && (
                            <span style={{
                              fontSize: 9, fontWeight: 700, padding: '1px 6px',
                              borderRadius: 99, border: '1px solid #6ee7b7',
                              background: '#d1fae5', color: '#065f46',
                            }}>CNSS</span>
                          )}
                        </>
                      )}
                      {isNonTaxable && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 6px',
                          borderRadius: 99, border: '1px solid #fcd34d',
                          background: '#fef3c7', color: '#92400e',
                        }}>Net direct</span>
                      )}
                      {taxableOnly && !isNonTaxable && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '1px 6px',
                          borderRadius: 99, border: '1px solid #c7d2fe',
                          background: '#e0e7ff', color: '#3730a3',
                        }}>ITS seulement</span>
                      )}
                    </span>
                  </div>

                  <input
                    type="number"
                    value={currentVal}
                    onChange={e => {
                      const v = Number(e.target.value);
                      setBonusEdits(prev => ({ ...prev, [b.id]: v }));
                      setDirtyBonuses(prev => {
                        const next = new Set(prev);
                        v !== origVal ? next.add(b.id) : next.delete(b.id);
                        return next;
                      });
                    }}
                    style={{
                      width: 120, padding: '7px 10px', border: '1px solid #e5e7eb',
                      borderRadius: 8, fontSize: 13, fontFamily: 'monospace',
                      fontWeight: 700, textAlign: 'right', outline: 'none', background: 'white',
                    }}
                  />
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>F</span>

                  {isDirty && (
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ✓ modifiée
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ margin: '10px 0 0', fontSize: 11, color: '#f97316' }}>
            ⚠️ Modifier une prime ici change sa valeur permanente pour les prochains bulletins.
          </p>
        </div>
      )}

      {/* ── Boutons d'action ── */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => router.back()}
          style={{
            flex: 1, padding: '13px', background: '#f3f4f6', border: 'none',
            borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#6b7280',
          }}>
          Annuler
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges || saved}
          style={{
            flex: 2, padding: '13px', border: 'none', borderRadius: 12,
            fontWeight: 800, fontSize: 15,
            cursor: (!hasChanges || isSaving || saved) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: saved
              ? '#10b981'
              : !hasChanges || isSaving
                ? '#e5e7eb'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: (!hasChanges && !saved) ? '#9ca3af' : 'white',
            transition: 'all .2s',
          }}>
          {isSaving ? (
            <><Loader2 size={18} className="animate-spin" /> Sauvegarde...</>
          ) : saved ? (
            <><Check size={18} /> Sauvegardé !</>
          ) : (
            <>
              <Save size={18} />
              Enregistrer
              {dirtyBonuses.size > 0 ? ` + ${dirtyBonuses.size} prime${dirtyBonuses.size > 1 ? 's' : ''}` : ''}
            </>
          )}
        </button>
      </div>

      {!hasChanges && !saved && (
        <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', marginTop: 10 }}>
          Aucune modification — modifiez au moins un champ pour activer la sauvegarde
        </p>
      )}
    </div>
  );
}