"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Phone, History, User,
  Terminal, Shield, ChevronRight, LogOut, Cpu, Menu, X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { label: "Dashboard",  icon: LayoutDashboard, href: "/dashboard", code: "01" },
  { label: "Make Call",  icon: Phone,           href: "/make-call", code: "02" },
  { label: "History",    icon: History,         href: "/history",   code: "03" },
  { label: "Profile",    icon: User,            href: "/profile",   code: "04" },
];

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () =>
      setT(new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function Sidebar() {
  const pathname = usePathname();
  const time = useClock();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  // Close on route change (mobile)
  useEffect(() => { setOpen(false); }, [pathname]);

  const content = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Top accent */}
      <div className="sb-accent-line" />

      {/* Logo */}
      <div className="sb-logo-block">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div className="sb-icon-box">
            <Shield size={16} color="var(--green-matrix)" />
          </div>
          <div>
            <div className="sb-brand">CYBERROAD</div>
            <div className="sb-brand-sub">
              <span style={{ color: "var(--green-dim)" }}>[SYS]</span>
              <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>v2.4.1_SEC</span>
            </div>
          </div>
        </div>
        <div className="sb-clock">
          <Terminal size={10} color="var(--green-dim)" />
          <span>SYS_TIME:</span>
          <span style={{ color: "var(--green-matrix)", letterSpacing: "0.05em" }}>{time}</span>
        </div>
      </div>

      {/* Nav label */}
      <div style={{ padding: "10px 16px 4px", flexShrink: 0 }}>
        <div className="sb-section-label">// navigation_modules</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "4px 8px", overflowY: "auto" }}>
        {navItems.map(({ label, icon: Icon, href, code }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} style={{ textDecoration: "none", display: "block", marginBottom: "3px" }}>
              <div className={`sb-nav-item ${active ? "active" : ""}`}>
                {active && <div className="sb-nav-glow" />}
                <span className="sb-nav-code">{code}</span>
                <Icon size={14} style={{ flexShrink: 0 }} />
                <span className="sb-nav-label">{label}</span>
                {active && <ChevronRight size={11} style={{ opacity: 0.5 }} />}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* System status */}
      <div className="sb-status-block">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
          <Cpu size={11} color="var(--green-dim)" />
          <span className="sb-section-label">SYSTEM_STATUS</span>
        </div>
        {[
          { label: "API_BRIDGE",  val: "ONLINE",  color: "var(--green-matrix)" },
          { label: "VoIP_ENGINE", val: "IDLE",    color: "var(--amber-warn)" },
          { label: "ENCRYPT",     val: "AES-256", color: "var(--cyan-hack)" },
        ].map(({ label, val, color }) => (
          <div key={label} className="sb-status-row">
            <span className="sb-status-key">{label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color, textShadow: `0 0 6px ${color}` }}>{val}</span>
          </div>
        ))}

        <div className="neon-hr" style={{ margin: "10px 0 8px" }} />

        {/* User */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <div className="sb-avatar">{(user?.name || "?")[0].toUpperCase()}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name || "unknown"}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>id:{user?.id || "---"}</div>
          </div>
        </div>

        <button className="sb-logout"
          onClick={logout}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--red-alert)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--text-ghost)")}
        >
          <LogOut size={11} />
          DISCONNECT_SESSION
        </button>
      </div>

      {/* Bottom accent */}
      <div className="sb-accent-line" />
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="sb-hamburger"
        onClick={() => setOpen(o => !o)}
        aria-label="Toggle sidebar"
      >
        {open ? <X size={18} color="var(--green-matrix)" /> : <Menu size={18} color="var(--green-matrix)" />}
      </button>

      {/* Overlay backdrop on mobile */}
      {open && <div className="sb-backdrop" onClick={() => setOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        {content}
      </aside>
    </>
  );
}
