"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  History, Phone, CheckCircle2, XCircle, Clock, RefreshCw,
  Search, ChevronLeft, ChevronRight, Download, Database,
  Terminal, Filter, PhoneOff, AlertTriangle, Radio,
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
  voice?: string;
}

const TERMINAL_OK = new Set(["ENDED", "VALID", "PRESSED_0"]);
const TERMINAL_FAIL = new Set(["BUSY", "NOANSWER", "REJECTED", "MACHINE", "ERROR", "INVALID"]);

function classifyCall(log: CallLog): "success" | "failed" | "active" {
  const s = log.status || log.step || "";
  if (TERMINAL_OK.has(s)) return "success";
  if (TERMINAL_FAIL.has(s)) return "failed";
  return "active";
}

function fmtDuration(sec?: number): string {
  if (!sec) return "00:00";
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function fmtTime(ts?: string): string {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
}

const PAGE_SIZE = 20;

export default function HistoryPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all");
  const [page, setPage] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(BACKEND_URL + "/api/asterisk/logs?limit=500", {
        headers: { "X-USER-TOKEN": token },
        credentials: "omit",
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : data.logs || []);
      }
    } catch { /* silently fail */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // Filter + search
  const filtered = logs
    .filter(l => {
      if (filterStatus === "all") return true;
      return classifyCall(l) === filterStatus;
    })
    .filter(l => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (l.target_name || "").toLowerCase().includes(q) ||
        (l.target_number || "").includes(q) ||
        (l.call_type || "").toLowerCase().includes(q) ||
        (l.service_name || "").toLowerCase().includes(q) ||
        (l.call_id || "").toLowerCase().includes(q)
      );
    })
    .reverse();

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const statusCounts = {
    all: logs.length,
    success: logs.filter(l => classifyCall(l) === "success").length,
    failed: logs.filter(l => classifyCall(l) === "failed").length,
  };

  return (
    <div className="page-content" style={{ padding: "20px 24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <Terminal size={14} color="var(--green-dim)" />
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>/root/history.log</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--green-matrix)", letterSpacing: "0.08em", textShadow: "0 0 20px rgba(0,255,65,0.5)" }}>
          CALL_HISTORY
        </h1>
        <span className="cyber-badge green" style={{ marginLeft: "8px" }}>{logs.length} RECORDS</span>
        <button className="hbtn hbtn-ghost" style={{ padding: "4px 10px", fontSize: "9px", marginLeft: "auto" }} onClick={() => { setLoading(true); fetchLogs(); }}>
          <RefreshCw size={10} className={loading ? "anim-spin" : ""} /> RELOAD
        </button>
      </div>

      {/* Filters */}
      <div className="cyber-panel" style={{ padding: "12px 16px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <Filter size={12} color="var(--green-dim)" />
          {/* Status filter tabs */}
          {(["all", "success", "failed"] as const).map(s => (
            <button key={s} className={`step-tab ${filterStatus === s ? "active" : ""}`}
              onClick={() => { setFilterStatus(s); setPage(0); }}
              style={{ fontSize: "10px", padding: "4px 10px" }}>
              {s.toUpperCase()} ({statusCounts[s]})
            </button>
          ))}
          {/* Search */}
          <div style={{ flex: 1, minWidth: "180px", position: "relative", marginLeft: "auto" }}>
            <Search size={12} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-ghost)" }} />
            <input
              className="h-input"
              style={{ paddingLeft: "28px", fontSize: "11px" }}
              placeholder="Search target, number, type..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="cyber-panel">
        <div style={{ padding: "0 16px 16px", overflowX: "auto" }}>
          {paged.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", gap: "10px" }}>
              <Database size={28} style={{ opacity: 0.1 }} color="var(--green-matrix)" />
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                {loading ? "// loading call history..." : "// no matching records found"}
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["", "CALL_ID", "TARGET", "TYPE", "FROM", "STATUS", "DURATION", "TIME"].map(h => (
                    <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-ghost)", letterSpacing: "0.08em", borderBottom: "1px solid var(--border-main)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((log, i) => {
                  const cls = classifyCall(log);
                  const pipColor = cls === "success" ? "green" : cls === "failed" ? "red" : "amber";
                  const StatusIcon = cls === "success" ? CheckCircle2 : cls === "failed" ? XCircle : Radio;
                  const statusColor = cls === "success" ? "var(--green-matrix)" : cls === "failed" ? "var(--red-alert)" : "var(--amber-warn)";
                  return (
                    <tr key={log.call_id || i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 10px" }}><span className={`status-pip ${pipColor}`} /></td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.call_id ? log.call_id.slice(0, 16) : "—"}
                      </td>
                      <td style={{ padding: "10px 10px" }}>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>{log.target_name || "Unknown"}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-muted)" }}>{log.target_number || "—"}</div>
                      </td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--cyan-hack)" }}>{log.call_type || log.service_name || "—"}</td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>{log.from_number || "—"}</td>
                      <td style={{ padding: "10px 10px" }}>
                        <span className={`cyber-badge ${cls === "success" ? "green" : cls === "failed" ? "red" : "amber"}`}>
                          <StatusIcon size={9} /> {log.status || log.step || "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={10} /> {fmtDuration(log.duration)}</span>
                      </td>
                      <td style={{ padding: "10px 10px", fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-ghost)" }}>{fmtTime(log.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", padding: "10px 16px", borderTop: "1px solid var(--border-subtle)" }}>
            <button className="hbtn hbtn-ghost" style={{ padding: "4px 10px", fontSize: "10px" }} disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={12} /> PREV
            </button>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>
              PAGE {page + 1} / {totalPages}
            </span>
            <button className="hbtn hbtn-ghost" style={{ padding: "4px 10px", fontSize: "10px" }} disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              NEXT <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
