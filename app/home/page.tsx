import { redirect } from "next/navigation";

/** Ancienne route /home → page d'accueil unifiée sur / */
export default function HomeRedirect() {
  redirect("/");
}
