import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/admin/dashboard");
  }

  if (!session.user.branchId) {
    redirect("/no-branch");
  }

  redirect("/dashboard");
}
