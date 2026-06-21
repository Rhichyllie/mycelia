import { redirect } from "next/navigation";

export default function MyceliaLegacyDemoRedirectPage(): never {
  redirect("/mycelia/runs");
}
