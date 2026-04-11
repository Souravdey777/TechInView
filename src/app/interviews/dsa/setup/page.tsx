import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function DsaSetupAliasPage({ searchParams }: PageProps) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (typeof value === "string") {
      params.set(key, value);
      continue;
    }

    value?.forEach((item) => params.append(key, item));
  }

  const suffix = params.toString();
  redirect(suffix ? `/interview/setup?${suffix}` : "/interview/setup");
}
