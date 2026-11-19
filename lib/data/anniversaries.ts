import { DEMO_MODE } from '@/lib/demo/config';
import { featureActor } from './context';
import { anniversariesDemo } from './anniversaries.demo';
import { anniversariesApi } from './anniversaries.api';
export const anniversariesAvailable = DEMO_MODE || process.env.NEXT_PUBLIC_FEATURE_ANNIVERSARIES_API !== 'false';
export const getAnniversaries = () => DEMO_MODE ? anniversariesDemo(featureActor()) : anniversariesApi;
