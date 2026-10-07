import { redirect } from "next/navigation";
import { PrepPlansIndex } from "@/components/prep-plans/PrepPlansIndex";
import { createClient } from "@/lib/supabase/server";
import { hasCapturedPayment } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function PrepGuruPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <PrepPlansIndex isPaid={await hasCapturedPayment(user.id)} />;
}
