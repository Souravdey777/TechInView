import { notFound } from "next/navigation";
import { OrbLab } from "./OrbLab";

export default function OrbLabPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <OrbLab />;
}
