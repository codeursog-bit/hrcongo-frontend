'use client';

import React, { useState } from 'react';
import { User, X } from 'lucide-react';

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
    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <User size={20} className="text-sky-500" /> Employé
      </h2>
      
      <div className="relative">
        {selectedEmployee ? (
          <div className="flex items-start justify-between bg-sky-50 dark:bg-sky-900/10 p-4 rounded-xl border border-sky-100 dark:border-sky-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-200 rounded-full flex items-center justify-center font-bold text-sky-700">
                {selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedEmployee.position}</p>
                <p className="text-xs text-sky-600 dark:text-sky-400 font-mono mt-1">
                  {selectedEmployee.employeeNumber}
                </p>
              </div>
            </div>
            <button 
              onClick={onClear}
              className="text-xs text-red-500 hover:underline mt-2 flex items-center justify-end gap-1"
            >
              <X size={12} /> Changer
            </button>
          </div>
        ) : (
          <div className="relative">
            <input 
              type="text" 
              placeholder="Rechercher par nom ou matricule..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowList(true); }}
              onFocus={() => setShowList(true)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all"
            />
            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            
            {showList && filteredEmployees.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-h-60 overflow-y-auto z-20">
                {filteredEmployees.map(emp => (
                  <div 
                    key={emp.id} 
                    onClick={() => handleSelect(emp)}
                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-gray-750 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold">
                      {emp.firstName?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{emp.employeeNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}