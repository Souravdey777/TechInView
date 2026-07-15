import { redirect } from "next/navigation";

export default function PrepPlanDetailPage({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/prep-guru/${params.id}`);
}
