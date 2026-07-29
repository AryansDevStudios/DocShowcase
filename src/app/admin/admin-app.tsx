"use client";

import { useState } from "react";
import { AdminDashboardClient } from "./admin-dashboard-client";
import { AdminLoginClient } from "./admin-login-client";

export function AdminApp() {
  const [adminPassword, setAdminPassword] = useState<string | null>(null);

  if (!adminPassword) {
    return <AdminLoginClient onLogin={(pwd) => setAdminPassword(pwd)} />;
  }

  return (
    <AdminDashboardClient 
      adminPassword={adminPassword} 
      onLogout={() => setAdminPassword(null)} 
    />
  );
}
