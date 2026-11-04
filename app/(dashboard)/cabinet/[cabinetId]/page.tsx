import { redirect } from 'next/navigation';
export default function CabinetIndex({ params }: { params: { cabinetId: string } }) {
  redirect(`/cabinet/${params.cabinetId}/dashboard`);
}
