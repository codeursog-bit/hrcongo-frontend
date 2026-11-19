'use client';

import React, { useState } from 'react';
import { User, X } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Input } from '@/components/design-system/primitives';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  position: string;
  baseSalary: number;
  photoUrl?: string;
}

interface EmployeeSelectorProps {
  selectedEmployee: Employee | null;
  employees: Employee[];
  onSelect: (employee: Employee) => void;
  onClear: () => void;
}

export default function EmployeeSelector({ 
  selectedEmployee, 
  employees, 
  onSelect, 
  onClear 
}: EmployeeSelectorProps) {
  const [search, setSearch] = useState('');
  const [showList, setShowList] = useState(false);

  const filteredEmployees = employees.filter(e => 
    e.firstName?.toLowerCase().includes(search.toLowerCase()) || 
    e.lastName?.toLowerCase().includes(search.toLowerCase()) ||
    e.employeeNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (emp: Employee) => {
    onSelect(emp);
    setShowList(false);
    setSearch('');
  };

  return (
    <Card title="Employé" action={selectedEmployee
      ? <Badge tone="success">Sélectionné</Badge>
      : <Badge tone="neutral">À sélectionner</Badge>}>
      <div className="relative">
        {selectedEmployee ? (
          <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl bg-[var(--surface-2)] p-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] font-semibold text-[var(--brand-strong)]">
                {selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <h3 className="truncate font-semibold text-[var(--text)]">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h3>
                <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">{selectedEmployee.position || 'Poste non renseigné'}</p>
                <Badge tone="neutral">{selectedEmployee.employeeNumber || 'Matricule non renseigné'}</Badge>
              </div>
            </div>
            <Button variant="ghost" onClick={onClear}><X size={15} strokeWidth={1.5} />Changer</Button>
          </div>
        ) : (
          <div className="relative">
            <Input
              label="Rechercher un employé"
              type="search"
              placeholder="Nom, prénom ou matricule"
              value={search}
              onChange={e => { setSearch(e.target.value); setShowList(true); }}
              onFocus={() => setShowList(true)}
              onKeyDown={e => { if (e.key === 'Escape') setShowList(false); }}
              autoComplete="off"
            />
            {showList && (
              <ul aria-label="Résultats employés"
                className="absolute left-0 right-0 top-full z-20 mt-2 max-h-60 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow-pop)]">
                {filteredEmployees.length ? filteredEmployees.map(emp => (
                  <li key={emp.id}>
                    <button type="button" onClick={() => handleSelect(emp)}
                      className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-2)]">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-xs font-semibold text-[var(--brand-strong)]">
                        {emp.firstName?.[0]}{emp.lastName?.[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-[var(--text)]">{emp.firstName} {emp.lastName}</span>
                        <span className="block truncate text-xs text-[var(--text-secondary)]">{[emp.employeeNumber, emp.position].filter(Boolean).join(' · ') || 'Informations complémentaires indisponibles'}</span>
                      </span>
                    </button>
                  </li>
                )) : (
                  <li><EmptyState icon={User} title="Aucun résultat">Aucun employé ne correspond à cette recherche.</EmptyState></li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}