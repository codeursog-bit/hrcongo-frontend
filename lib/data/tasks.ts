import { DEMO_MODE } from '@/lib/demo/config';
import { featureActor } from './context';
import { tasksDemo } from './tasks.demo';
import { tasksApi } from './tasks.api';
export const tasksAvailable = DEMO_MODE || process.env.NEXT_PUBLIC_FEATURE_TASKS_API !== 'false';
export const getTasks = () => DEMO_MODE ? tasksDemo(featureActor()) : tasksApi;
