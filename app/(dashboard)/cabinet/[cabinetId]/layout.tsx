// // app/(dashboard)/cabinet/[cabinetId]/layout.tsx
// // Layout minimal pour toutes les routes /cabinet/[cabinetId]/*
// // Il court-circuite le (dashboard)/layout.tsx qui bloquerait les CABINET_ADMIN

// export default function CabinetLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return <>{children}</>;
// }

// app/(dashboard)/cabinet/[cabinetId]/layout.tsx
// Layout cabinet — ajoute le CabinetOnboardingChecklist pour CABINET_ADMIN

import CabinetOnboardingChecklist from '@/components/onboarding/CabinetOnboardingChecklist';

export default function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CabinetOnboardingChecklist />
      {children}
    </>
  );
}