"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // Login page gets full-screen layout (no sidebar)
  const isLoginPage = pathname === "/login";

  if (isLoginPage || (!loading && !user)) {
    return <div style={{ width: "100vw", height: "100vh" }}>{children}</div>;
  }

  return (
    <>
      <Sidebar />
      <main className="layout-main">{children}</main>
    </>
  );
}
