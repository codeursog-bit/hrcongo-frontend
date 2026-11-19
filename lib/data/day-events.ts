import { DEMO_MODE } from '@/lib/demo/config';
import { featureActor } from './context';
import { dayEventsDemo } from './day-events.demo';
import { dayEventsApi } from './day-events.api';
export const dayEventsAvailable = DEMO_MODE || process.env.NEXT_PUBLIC_FEATURE_DAYEVENTS_API !== 'false';
export const getDayEvents = () => DEMO_MODE ? dayEventsDemo(featureActor()) : dayEventsApi;
