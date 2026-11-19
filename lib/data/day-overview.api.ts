import type { DayOverviewAdapter } from '@/types/contracts/day-overview';
import { api } from '@/services/api';
import type { DayOverview } from '@/types/contracts/day-overview';
// Live: GET /day-overview/me — tenant-scoped, privacy-filtered coworkers,
// configured holidays and the authenticated employee's actual schedule.
export const dayOverviewApi: DayOverviewAdapter = { get: () => api.get<DayOverview>('/day-overview/me') };
