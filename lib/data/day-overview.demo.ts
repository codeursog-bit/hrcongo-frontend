import { dayOverview } from '@/lib/demo/day-overview';
import { requireActor } from './context';
import type { DayOverviewAdapter } from '@/types/contracts/day-overview';
import type { FeatureActor } from '@/types/contracts/tasks';
export function dayOverviewDemo(actor: FeatureActor): DayOverviewAdapter { return { async get() { requireActor(actor); return actor.companyId === 'demo-company' ? structuredClone(dayOverview) : { holidays: [], absentColleagues: [], schedule: [] }; } }; }
