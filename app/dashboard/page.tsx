"use client";
import { LayoutDashboard, Phone, Activity, Shield, TrendingUp, Clock, Database } from "lucide-react";

const stats = [
  { id: "calls_today", label: "CALLS_EXECUTED", value: "0",  icon: Phone,        color: "var(--green-matrix)", glow: "rgba(0,255,65,0.3)"   },
  { id: "success_rate", label: "SUCCESS_RATE",   value: "—",  icon: TrendingUp,   color: "var(--cyan-hack)",    glow: "rgba(0,255,224,0.3)"  },
  { id: "otp_delivered", label: "OTP_DELIVERED", value: "0",  icon: Shield,       color: "var(--amber-warn)",   glow: "rgba(255,171,0,0.3)"  },
  { id: "avg_duration", label: "AVG_DURATION",   value: "—",  icon: Clock,        color: "var(--purple-sys)",   glow: "rgba(176,64,255,0.3)" },
];

export default function DashboardPage() {
  return (
    <div className="page-content" style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <LayoutDashboard size={14} color="var(--green-dim)" />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>/root/dashboard.sys</span>
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--green-matrix)", letterSpacing: "0.08em", textShadow: "0 0 20px rgba(0,255,65,0.5)", marginBottom: "20px" }}>
        SYSTEM_DASHBOARD
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "20px" }}>
        {stats.map(({ id, label, value, icon: Icon, color, glow }) => (
          <div key={id} className="cyber-panel" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Icon size={13} color={color} style={{ filter: `drop-shadow(0 0 4px ${glow})` }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>{label}</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, color, textShadow: `0 0 12px ${glow}` }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="cyber-panel">
        <div className="panel-header">
          <Activity size={13} color="var(--green-dim)" />
          <span className="panel-header-label">SYSTEM_ACTIVITY</span>
          <span className="bracket-label">[AWAITING_DATA]</span>
        </div>
        <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "180px", gap: "10px" }}>
          <Database size={28} style={{ opacity: 0.1 }} color="var(--green-matrix)" />
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.05em" }}>
            // analytics_feed empty — execute calls to populate data
          </p>
        </div>
      </div>
    </div>
  );
}
