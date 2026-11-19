export const company = { id: 'demo-company', legalName: 'Mavoula Services', tradeName: 'Mavoula Services', city: 'Brazzaville', country: 'Congo', address: 'Avenue de la Paix', email: 'contact@example.test', phone: '+242 06 000 00 00', conventionId: null, setupCompleted: true };
export const departments = [
  { id: 'demo-rh', name: 'Administration', color: '#F7874B', employeeCount: 1 },
  { id: 'demo-finance', name: 'Finance', color: '#2FBF8F', employeeCount: 1 },
  { id: 'demo-sales', name: 'Commercial', color: '#E8B23A', employeeCount: 1 },
];
export const employees = [
  { id: 'demo-laure', firstName: 'Laure', lastName: 'Djouma', position: 'Assistante RH', baseSalary: 380000, netSalary: 340000, department: departments[0] },
  { id: 'demo-sandrine', firstName: 'Sandrine', lastName: 'Mvoula', position: 'Responsable comptable', baseSalary: 650000, netSalary: 570000, department: departments[1] },
  { id: 'demo-patrick', firstName: 'Patrick', lastName: 'Likibi', position: 'Chargé de clientèle', baseSalary: 425000, netSalary: 380000, department: departments[2] },
].map((e, i) => ({ ...e, employeeNumber: `MS-00${i + 1}`, employeeId: e.id, companyId: company.id, departmentId: e.department.id, email: `${e.firstName.toLocaleLowerCase('fr')}@example.test`, phone: '+242 06 000 00 00', address: 'Brazzaville', city: 'Brazzaville', status: 'ACTIVE', contractType: 'CDI', hireDate: '2024-01-08', dateOfBirth: '1992-11-12', gender: i === 2 ? 'MALE' : 'FEMALE', maritalStatus: 'SINGLE', numberOfChildren: 0, nationality: 'Congolaise', photoUrl: null, company, selfServiceEnabled: false }));
export function demoUser(role: 'ADMIN' | 'EMPLOYEE' = 'ADMIN') { return { id: 'demo-user', firstName: 'Laure', lastName: 'Djouma', name: 'Laure Djouma', email: 'laure@example.test', role, employeeId: employees[0].id, companyId: company.id, departmentId: 'demo-rh', company, managedByCabinet: false, manageMultipleCompanies: false, onboardingCompleted: true }; }
