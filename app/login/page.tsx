"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Shield, Terminal, Lock, AlertTriangle, Loader2, ChevronRight, Key } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showCaret, setShowCaret] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Blink caret
  useEffect(() => {
    const id = setInterval(() => setShowCaret((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Already logged in → redirect
  useEffect(() => {
    if (!loading && user) router.replace("/make-call");
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim() || submitting) return;
    setError("");
    setSubmitting(true);
    const res = await login(token.trim());
    if (res.ok) {
      router.replace("/make-call");
    } else {
      setError(res.error || "ACCESS_DENIED");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-void)" }}>
        <Loader2 size={24} color="var(--green-matrix)" className="anim-spin" />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg-void)",
      padding: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative grid lines */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.03,
        backgroundImage: `
          linear-gradient(var(--green-matrix) 1px, transparent 1px),
          linear-gradient(90deg, var(--green-matrix) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      {/* Radial glow */}
      <div style={{
        position: "absolute",
        top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(0,255,65,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "56px", height: "56px", margin: "0 auto 16px",
            background: "var(--bg-card)",
            border: "1px solid var(--green-matrix)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 24px rgba(0,255,65,0.3), inset 0 0 16px rgba(0,255,65,0.06)",
            clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
          }}>
            <Shield size={24} color="var(--green-matrix)" />
          </div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700,
            color: "var(--green-matrix)", letterSpacing: "0.12em",
            textShadow: "0 0 20px rgba(0,255,65,0.5)",
            marginBottom: "4px",
          }}>
            CYBERROAD
          </h1>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "10px",
            color: "var(--text-muted)", letterSpacing: "0.08em",
          }}>
            // VoIP OTP CALL SYSTEM v2.4
          </div>
        </div>

        {/* Login panel */}
        <div className="cyber-panel" style={{ padding: 0 }}>
          {/* Panel header */}
          <div className="panel-header" style={{ marginBottom: 0 }}>
            <Lock size={13} color="var(--green-dim)" />
            <span className="panel-header-label">AUTHENTICATE</span>
            <span className="bracket-label">[TOKEN_AUTH]</span>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "20px 20px 24px" }}>
            {/* Terminal-style info */}
            <div style={{
              fontFamily: "var(--font-mono)", fontSize: "11px",
              color: "var(--text-muted)", marginBottom: "16px",
              lineHeight: 1.8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Terminal size={11} color="var(--green-dim)" />
                <span>/root/auth/</span>
                <ChevronRight size={9} color="var(--text-ghost)" />
                <span style={{ color: "var(--green-matrix)" }}>login.sys</span>
              </div>
              <div style={{ marginTop: "8px", color: "var(--text-ghost)" }}>
                {"> "}Enter access token to establish session.
              </div>
              <div style={{ color: "var(--text-ghost)" }}>
                {"> "}Token is generated from admin panel.
              </div>
            </div>

            {/* Token input */}
            <div style={{ marginBottom: "16px" }}>
              <label className="h-label">
                <Key size={9} />
                ACCESS_TOKEN
              </label>
              <div style={{ position: "relative" }}>
                <input
                  ref={inputRef}
                  className="h-input"
                  type="password"
                  value={token}
                  onChange={(e) => { setToken(e.target.value); setError(""); }}
                  placeholder="paste_token_here"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    fontSize: "14px",
                    padding: "12px 14px",
                    letterSpacing: "0.04em",
                  }}
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                marginBottom: "14px", padding: "10px 12px",
                background: "rgba(255,23,68,0.06)",
                border: "1px solid rgba(255,23,68,0.25)",
                fontFamily: "var(--font-mono)", fontSize: "11px",
              }}>
                <AlertTriangle size={13} color="var(--red-alert)" />
                <span style={{ color: "var(--red-alert)" }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="hbtn hbtn-exec"
              disabled={submitting || !token.trim()}
              style={{
                width: "100%", padding: "14px 16px",
                fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em",
              }}
            >
              {submitting ? (
                <><Loader2 size={14} className="anim-spin" /> AUTHENTICATING...</>
              ) : (
                <><Lock size={14} /> INITIALIZE_SESSION</>
              )}
            </button>

            {/* Bottom decorative */}
            <div className="neon-hr" style={{ marginTop: "18px" }} />
            <div style={{
              marginTop: "10px", textAlign: "center",
              fontFamily: "var(--font-mono)", fontSize: "9px",
              color: "var(--text-ghost)", letterSpacing: "0.06em",
            }}>
              {showCaret ? "█ " : "  "}SECURE_CHANNEL // AES-256 // SESSION_ENCRYPTED
            </div>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          marginTop: "18px", textAlign: "center",
          fontFamily: "var(--font-mono)", fontSize: "9px",
          color: "var(--text-ghost)", letterSpacing: "0.05em",
        }}>
          cyberroad systems &copy; 2026 // all_rights_reserved
        </div>
      </div>
    </div>
  );
}
