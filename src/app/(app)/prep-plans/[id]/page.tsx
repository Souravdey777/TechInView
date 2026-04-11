import { PrepPlanDetail } from "@/components/prep-plans/PrepPlanDetail";

export default function PrepPlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <PrepPlanDetail planId={params.id} />;
}
