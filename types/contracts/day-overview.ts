export interface DayOverview {
  holidays: { date: string; label: string }[];
  absentColleagues: { id: string; name: string; label: string }[];
  schedule: { label: string; start: string; end: string }[];
}
export interface DayOverviewAdapter { get: () => Promise<DayOverview> }
