// 📁 app/(dashboard)/loading.tsx
// Affiché automatiquement par Next.js pendant le chargement de n'importe quelle page du dashboard.
import { KonzaLoader } from '@/components/ui/KonzaLoader';

export default function Loading() {
  return <KonzaLoader variant="page" />;
}