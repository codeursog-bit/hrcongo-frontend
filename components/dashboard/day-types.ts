export interface PersonalStats {
  pendingLeaves?: number; remainingLeaves?: string; checkIn?: string; checkOut?: string; lastSalary?: string; lastSalaryMonth?: string;
  totalDebt?: number; totalPaid?: number; presenceRateMonth?: number;
  leaveEx?: { base?: { acquired?: number; max?: number }; totals?: { remaining?: number; taken?: number }; seniority?: { days?: number }; nextDeparture?: { kind: string; startDate?: string; endDate?: string; status?: string; reason?: string } } | null;
}
export interface DayContext {
  employee?: { id: string; firstName?: string; lastName?: string; photoUrl?: string; companyId?: string } | null;
  attendance?: { checkIn?: string; checkOut?: string; isRemote?: boolean; checkInSiteName?: string };
  leaves?: { id: string; status: string; type?: string; startDate: string; endDate: string; daysCount?: number }[];
  dayStatuses?: { date: string; status: string }[];
}
