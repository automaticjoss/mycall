"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  User, Shield, Key, Terminal, Copy, CheckCircle2, LogOut,
  Cpu, Clock, Phone, Activity, RefreshCw,
} from "lucide-react";

const BACKEND_URL = "/api/proxy";

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const [copied, setCopied] = useState(false);
  const [callCount, setCallCount] = useState(0);
  const [showToken, setShowToken] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(BACKEND_URL + "/api/asterisk/logs?limit=9999", {
      headers: { "X-USER-TOKEN": token },
      credentials: "omit",
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const arr = Array.isArray(data) ? data : data.logs || [];
        setCallCount(arr.length);
      })
      .catch(() => {});
  }, [token]);

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const maskedToken = token
    ? token.slice(0, 6) + "•".repeat(Math.max(0, token.length - 10)) + token.slice(-4)
    : "—";

  return (
    <div className="page-content" style={{ padding: "20px 24px", maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <Terminal size={14} color="var(--green-dim)" />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>/root/profile.cfg</span>
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--green-matrix)", letterSpacing: "0.08em", textShadow: "0 0 20px rgba(0,255,65,0.5)", marginBottom: "20px" }}>
        USER_PROFILE
      </h1>

      <div className="responsive-grid-main" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px" }}>
        {/* Left — User Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="cyber-panel" style={{ padding: "20px 16px", textAlign: "center" }}>
            <div style={{
              width: "60px", height: "60px", margin: "0 auto 12px",
              border: "2px solid var(--green-matrix)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700,
              color: "var(--green-matrix)", background: "var(--bg-elevated)",
              boxShadow: "0 0 20px rgba(0,255,65,0.2), inset 0 0 12px rgba(0,255,65,0.05)",
              clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
            }}>
              {(user?.name || "U")[0].toUpperCase()}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
              {user?.name || "unknown"}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
              ID: {user?.id || "—"}
            </div>
            <div className="cyber-badge green" style={{ marginTop: "10px" }}>
              <CheckCircle2 size={9} /> AUTHENTICATED
            </div>
          </div>

          {/* Quick stats */}
          <div className="cyber-panel" style={{ padding: "14px 16px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-ghost)", letterSpacing: "0.08em", marginBottom: "10px" }}>// SESSION_STATS</div>
            {[
              { icon: Phone, label: "TOTAL_CALLS", value: callCount.toString(), color: "var(--green-matrix)" },
              { icon: Activity, label: "SESSION", value: "ACTIVE", color: "var(--green-matrix)" },
              { icon: Shield, label: "ENCRYPT", value: "AES-256", color: "var(--cyan-hack)" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-ghost)" }}>
                  <Icon size={10} /> {label}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color, textShadow: `0 0 6px ${color}` }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right — Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Access Token */}
          <div className="cyber-panel">
            <div className="panel-header">
              <Key size={13} color="var(--cyan-hack)" />
              <span className="panel-header-label" style={{ color: "var(--cyan-hack)", textShadow: "0 0 8px var(--cyan-hack)" }}>ACCESS_TOKEN</span>
              <span className="bracket-label">[API_KEY]</span>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-ghost)", marginBottom: "8px" }}>
                // your authentication token for API access
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                background: "var(--bg-void)", border: "1px solid var(--border-subtle)",
                padding: "10px 12px",
              }}>
                <span style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {showToken ? token : maskedToken}
                </span>
                <button className="hbtn hbtn-ghost" style={{ padding: "4px 8px", fontSize: "9px" }} onClick={() => setShowToken(v => !v)}>
                  {showToken ? "HIDE" : "SHOW"}
                </button>
                <button className="hbtn hbtn-ghost" style={{ padding: "4px 8px", fontSize: "9px" }} onClick={copyToken}>
                  {copied ? <><CheckCircle2 size={9} /> OK</> : <><Copy size={9} /> COPY</>}
                </button>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="cyber-panel">
            <div className="panel-header">
              <User size={13} color="var(--green-dim)" />
              <span className="panel-header-label">ACCOUNT_INFO</span>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              {[
                { label: "USERNAME", value: user?.name || "—" },
                { label: "USER_ID", value: user?.id || "—" },
                { label: "AUTH_METHOD", value: "TOKEN_BASED" },
                { label: "PROTOCOL", value: "HTTPS/TLS_1.3" },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-ghost)", letterSpacing: "0.06em" }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="cyber-panel" style={{ borderColor: "rgba(255,23,68,0.2)" }}>
            <div className="panel-header" style={{ borderBottomColor: "rgba(255,23,68,0.15)" }}>
              <Shield size={13} color="var(--red-alert)" />
              <span className="panel-header-label" style={{ color: "var(--red-alert)", textShadow: "0 0 8px var(--red-alert)" }}>DANGER_ZONE</span>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              <button
                className="hbtn hbtn-exec active-call"
                style={{ width: "100%", padding: "10px 14px", fontSize: "12px", fontWeight: 700 }}
                onClick={logout}
              >
                <LogOut size={13} /> DISCONNECT_SESSION
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
