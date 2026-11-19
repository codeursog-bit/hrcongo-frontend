import { DEMO_MODE } from '@/lib/demo/config';
import { featureActor } from './context';
import { dayOverviewDemo } from './day-overview.demo';
import { dayOverviewApi } from './day-overview.api';
export const dayOverviewAvailable = DEMO_MODE || process.env.NEXT_PUBLIC_FEATURE_DAYOVERVIEW_API !== 'false';
export const getDayOverview = () => DEMO_MODE ? dayOverviewDemo(featureActor()) : dayOverviewApi;
