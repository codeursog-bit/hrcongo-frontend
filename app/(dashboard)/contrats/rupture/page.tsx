// app/rupture/page.tsx
import { ConventionGuard } from '@/components/ConventionGuard';
import ContractRupturePage from '@/components/ContractRupturePage';

export default function Page() {
  return (
    <ConventionGuard>
      <ContractRupturePage />
    </ConventionGuard>
  );
}