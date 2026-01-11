import JobApplyClient from './JobApplyClient';

export default function PublicJobPage({
  params,
}: {
  params: { id: string };
}) {
  return <JobApplyClient id={params.id} />;
}
