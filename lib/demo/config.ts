export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
export const isDeferredRoute = (path: string) => /^\/(admin|cabinet|portefeuille)(\/|$)/.test(path);
