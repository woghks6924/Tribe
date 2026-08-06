import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { AdminAuthForm } from "@/components/admin/admin-auth-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await getCurrentAdmin();
  if (session) redirect("/admin");

  const adminCount = await prisma.adminUser.count();

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <AdminAuthForm isSetup={adminCount === 0} />
    </div>
  );
}
