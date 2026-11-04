import { redirect } from 'next/navigation';
export default function CompanyIndex({ params }: { params: { cabinetId: string; companyId: string } }) {
  redirect(`/cabinet/${params.cabinetId}/entreprise/${params.companyId}/dashboard`);
}
