import { cookies } from "next/headers";
import { AdminDashboardClient } from "./admin-dashboard-client";
import { AdminLoginClient } from "./admin-login-client";
import { getAllDocuments } from "@/lib/actions";

export const metadata = {
  title: "Admin Dashboard | DocShowcase",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin-token")?.value;
  const adminPass = process.env.ADMIN_PASSWORD;

  const isAuthorized = !!adminPass && token === adminPass;

  if (!isAuthorized) {
    return <AdminLoginClient />;
  }

  const documents = await getAllDocuments();

  return <AdminDashboardClient initialDocuments={documents} />;
}
