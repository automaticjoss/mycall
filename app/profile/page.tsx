"use client";
import { User, Shield, Key, Bell } from "lucide-react";

export default function ProfilePage() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <User size={22} color="var(--accent-cyan)" />
        <h1 style={{ fontSize: "22px", fontWeight: 700, background: "linear-gradient(135deg, var(--accent-cyan), #7dd3fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Profile
        </h1>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "20px", maxWidth: "900px" }}>
        <div className="card" style={{ textAlign: "center" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg, #00d4ff, #0099cc)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 700, color: "#0d0f14", margin: "0 auto 14px" }}>A</div>
          <div style={{ fontWeight: 700, fontSize: "16px" }}>holmgdev</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>ws.club@tonzz.me</div>
          <div style={{ marginTop: "12px", padding: "6px 12px", background: "rgba(0,230,118,0.1)", border: "1px solid rgba(0,230,118,0.2)", borderRadius: "8px", display: "inline-block", fontSize: "11px", color: "var(--accent-green)", fontWeight: 600 }}>✓ Verified</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {[
            { icon: User, title: "Account Details", desc: "Update your username and email address" },
            { icon: Key, title: "API Keys", desc: "Manage provider API keys (Twilio, etc.)" },
            { icon: Shield, title: "Security", desc: "Change password and 2FA settings" },
            { icon: Bell, title: "Notifications", desc: "Configure call alerts and reports" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card" style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer", transition: "border-color 0.2s" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "rgba(0,212,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} color="var(--accent-cyan)" />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>{title}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
