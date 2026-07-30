import { redirect } from "next/navigation";

/** Kids are managed in the My Apps section; keep a stable deep link. */
export default function AccountKidsPage() {
  redirect("/account#my-apps");
}
