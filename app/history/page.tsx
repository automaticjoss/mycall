"use client";
import { History, Phone, CheckCircle2, XCircle, Clock } from "lucide-react";

const MOCK_HISTORY = [
  { id: 1, to: "+12305859999", name: "John", type: "Login Verification", provider: "Twilio", duration: "01:24", status: "success", time: "2 mins ago" },
  { id: 2, to: "+4915112345678", name: "Maria", type: "Password Reset", provider: "No Agency", duration: "00:47", status: "success", time: "14 mins ago" },
  { id: 3, to: "+13105554321", name: "Carlos", type: "Bank Transfer", provider: "Twilio", duration: "00:12", status: "failed", time: "1 hour ago" },
];

export default function HistoryPage() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
        <History size={22} color="var(--accent-cyan)" />
        <h1 style={{ fontSize: "22px", fontWeight: 700, background: "linear-gradient(135deg, var(--accent-cyan), #7dd3fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Call History
        </h1>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600, fontSize: "13px" }}>Recent Calls</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{MOCK_HISTORY.length} records</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)" }}>
              {["Recipient", "Call Type", "Provider", "Duration", "Status", "Time"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid var(--border-subtle)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_HISTORY.map((row) => (
              <tr key={row.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontWeight: 500, fontSize: "13px" }}>{row.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>{row.to}</div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-secondary)" }}>{row.type}</td>
                <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--accent-cyan)" }}>{row.provider}</td>
                <td style={{ padding: "12px 16px", fontSize: "12px", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={11} />{row.duration}</span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px",
                    background: row.status === "success" ? "rgba(0,230,118,0.1)" : "rgba(255,83,112,0.1)",
                    color: row.status === "success" ? "var(--accent-green)" : "#ff5370",
                  }}>
                    {row.status === "success" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                    {row.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontSize: "12px", color: "var(--text-muted)" }}>{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
