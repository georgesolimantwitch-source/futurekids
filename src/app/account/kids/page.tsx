import { redirect } from "next/navigation";

/** Kids are managed per app on My Apps; keep a stable deep link. */
export default function AccountKidsPage() {
  redirect("/account#my-apps");
}
