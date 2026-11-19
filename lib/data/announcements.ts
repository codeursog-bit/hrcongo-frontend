import { DEMO_MODE } from '@/lib/demo/config';
import { featureActor } from './context';
import { announcementsDemo } from './announcements.demo';
import { announcementsApi } from './announcements.api';
export const announcementsAvailable = DEMO_MODE || process.env.NEXT_PUBLIC_FEATURE_ANNOUNCEMENTS_API !== 'false';
export const getAnnouncements = () => DEMO_MODE ? announcementsDemo(featureActor()) : announcementsApi;
