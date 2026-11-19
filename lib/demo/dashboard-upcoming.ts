import { employees } from './employees';
import { payrolls } from './payroll';
export const recentDashboardPayrolls=[...payrolls,
  {...payrolls[0],id:'demo-payroll-october-0',month:10,createdAt:'2026-10-30T08:00:00+01:00'},
  {...payrolls[1],id:'demo-payroll-october-1',month:10,createdAt:'2026-10-30T08:00:00+01:00'},
];
export const dashboardUpcoming={
  upcomingLeaves:[{id:'demo-leave-upcoming',employee:employees[2],startDate:'2026-11-25',endDate:'2026-12-04'}],
  upcomingContracts:[],
};
