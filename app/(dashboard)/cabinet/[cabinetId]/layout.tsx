// app/(dashboard)/cabinet/[cabinetId]/layout.tsx
// Layout minimal pour toutes les routes /cabinet/[cabinetId]/*
// Il court-circuite le (dashboard)/layout.tsx qui bloquerait les CABINET_ADMIN

export default function CabinetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}