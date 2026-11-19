import { DEMO_MODE } from '@/lib/demo/config';
import type { AppearanceActor } from '@/types/contracts/appearance';
import { appearanceDemo } from './appearance.demo';
import { appearanceApi } from './appearance.api';
export const appearanceAvailable=DEMO_MODE || process.env.NEXT_PUBLIC_FEATURE_APPEARANCE_API!== 'false';
export const getAppearance=(actor:AppearanceActor)=>DEMO_MODE?appearanceDemo(actor):appearanceApi;
