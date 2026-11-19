// app/rupture/page.tsx
import { ConventionGuard } from '@/components/ConventionGuard';
import ContractRupturePage from '@/components/ContractRupturePage';
import { ModulePageFrame } from '@/components/requests/ModulePageFrame';

export default function Page() {
  return (
    <ConventionGuard>
      <ModulePageFrame kind="list">
        <ContractRupturePage />
      </ModulePageFrame>
    </ConventionGuard>
  );
}