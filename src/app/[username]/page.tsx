import { notFound, redirect } from "next/navigation";
import {
  getPublicProfilePath,
  isValidPublicUsername,
  normalizePublicUsername,
} from "@/lib/public-profile";

type PublicProfileAliasPageProps = {
  params: {
    username: string;
  };
};

export default function PublicProfileAliasPage({
  params,
}: PublicProfileAliasPageProps) {
  const username = normalizePublicUsername(params.username);

  if (!isValidPublicUsername(username)) {
    notFound();
  }

  redirect(getPublicProfilePath(username));
}
