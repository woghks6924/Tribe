import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth/admin-session";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentAdmin();
  if (!session) redirect("/admin/login");

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebar adminName={session.name} />
      <div className="min-w-0 flex-1 overflow-x-hidden">{children}</div>
    </div>
  );
}
