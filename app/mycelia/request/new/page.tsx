import { redirect } from "next/navigation";

export default function MyceliaLegacyRequestCreationRedirectPage(): never {
  redirect("/mycelia/runs");
}
