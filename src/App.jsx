import { useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEMPLATES = {
  followup: {
    label: "Follow-up", icon: "📬",
    subject: "Following up on your inquiry — EkviraExportHouse",
    body: `Dear [CLIENT],

Thank you for reaching out to us. We wanted to follow up on your recent inquiry and ensure you have all the information needed.

Our team at EkviraExportHouse specialises in premium quality exports and we are delighted to assist you. Please find the details of your inquiry addressed below.

Kindly let us know if you require any further clarification. We look forward to a long and fruitful association.

Warm regards,
EkviraExportHouse Team`,
  },
  shipment: {
    label: "Shipment update", icon: "🚢",
    subject: "Shipment Update — Order #[ORDER_NO]",
    body: `Dear [CLIENT],

We are pleased to inform you that your order has been dispatched on [DATE].

Shipment details:
• Order No: [ORDER_NO]
• Estimated Delivery: [ETA]
• Tracking No: [TRACKING]

Please feel free to contact us for any queries regarding your shipment.

Best regards,
EkviraExportHouse Logistics Team`,
  },
  payment: {
    label: "Payment reminder", icon: "💳",
    subject: "Payment Reminder — Invoice #[INV_NO]",
    body: `Dear [CLIENT],

This is a gentle reminder that Invoice #[INV_NO] amounting to ₹[AMOUNT] is due on [DATE].

Kindly arrange the payment at your earliest convenience to avoid any delays in processing your orders.

For any payment-related queries, feel free to reach us.

Thank you for your continued business.

EkviraExportHouse Accounts Team`,
  },
  quotation: {
    label: "Quotation", icon: "📄",
    subject: "Quotation / Proforma Invoice — EkviraExportHouse",
    body: `Dear [CLIENT],

Thank you for your interest in our products. Please find below the quotation as requested.

[PRODUCT/SERVICE DETAILS]

This quotation is valid for 15 days from the date of this email. We remain open to discussing terms further.

Looking forward to your confirmation.

Sincerely,
EkviraExportHouse Sales Team`,
  },
  welcome: {
    label: "Welcome", icon: "🎉",
    subject: "Welcome to EkviraExportHouse — We're glad to have you!",
    body: `Dear [CLIENT],

A warm welcome from all of us at EkviraExportHouse!

We are excited to have you on board as our valued client. Our team is committed to delivering quality, reliability, and timely service in every transaction.

Your dedicated point of contact will reach out shortly. In the meantime, do not hesitate to write to us for any queries.

Thank you for choosing EkviraExportHouse.

Warm regards,
The EkviraExportHouse Team`,
  },
};

const AUTO_RULES_DEFAULT = [
  { id: 1, title: "New inquiry received",  desc: "Sends acknowledgment within 5 min", enabled: true },
  { id: 2, title: "Payment received",       desc: "Sends receipt + next steps",        enabled: true },
  { id: 3, title: "Shipment dispatched",    desc: "Sends tracking + ETA info",          enabled: false },
  { id: 4, title: "Out-of-office",          desc: "Replies when team is unavailable",   enabled: false },
];

const CAMPAIGNS_DEFAULT = [
  { id: 1, name: "Monthly newsletter — Aug 2025", seg: "14 recipients",     date: "Aug 1, 9:00 AM IST", status: "scheduled" },
  { id: 2, name: "Dussehra greetings",            seg: "All active clients", date: "Oct 2",              status: "scheduled" },
  { id: 3, name: "Q2 shipment recap",             seg: "8 recipients",      date: "Jul 1",              status: "sent" },
];

const SEGMENTS = [
  "All active clients",
  "Pending payment clients",
  "New clients (last 30 days)",
  "Export clients only",
];

const PURPOSES = [
  { value: "",          label: "— pick a purpose —" },
  { value: "followup",  label: "Follow-up after inquiry" },
  { value: "shipment",  label: "Shipment update" },
  { value: "payment",   label: "Payment reminder" },
  { value: "quotation", label: "Quotation / proforma invoice" },
  { value: "welcome",   label: "New client welcome" },
  { value: "custom",    label: "Custom (describe below)" },
];

const TONES = ["Professional", "Warm & friendly", "Formal", "Urgent"];

// ─── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle = {
  width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8,
  background: "#fff", color: "#111827", fontSize: 13, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box",
};

const labelStyle = {
  fontSize: 11, color: "#6B7280", textTransform: "uppercase",
  letterSpacing: "0.06em", fontWeight: 600, marginBottom: 4,
};

const btnStyle = {
  display: "inline-flex", alignItems: "center", gap: 6,
  padding: "8px 14px", border: "1px solid #E5E7EB", borderRadius: 8,
  background: "#fff", color: "#374151", fontSize: 13, cursor: "pointer",
  fontFamily: "inherit",
};

const primaryBtn = { ...btnStyle, background: "#2563EB", color: "#fff", border: "none" };
const successBtn = { ...btnStyle, background: "#D1FAE5", color: "#065F46", borderColor: "#6EE7B7" };

// ─── UI primitives ─────────────────────────────────────────────────────────────

const Badge = ({ status }) => {
  const map = {
    scheduled: { bg: "#FEF3C7", color: "#92400E", label: "Scheduled" },
    sent:      { bg: "#D1FAE5", color: "#065F46", label: "Sent" },
    draft:     { bg: "#F3F4F6", color: "#6B7280", label: "Draft" },
    active:    { bg: "#DBEAFE", color: "#1E40AF", label: "Active" },
    off:       { bg: "#F3F4F6", color: "#6B7280", label: "Off" },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 99, letterSpacing: "0.03em" }}>
      {s.label}
    </span>
  );
};

const Toggle = ({ checked, onChange }) => (
  <div onClick={() => onChange(!checked)} style={{ width: 36, height: 20, borderRadius: 99, cursor: "pointer", flexShrink: 0, background: checked ? "#3B82F6" : "#D1D5DB", position: "relative", transition: "background 0.2s" }}>
    <div style={{ position: "absolute", top: 3, left: checked ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
  </div>
);

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={btnStyle}>
      {copied ? "✓ Copied!" : "📋 Copy"}
    </button>
  );
};

// ─── Compose Tab ───────────────────────────────────────────────────────────────

function ComposeTab({ emailsSent, setEmailsSent }) {
  const [purpose, setPurpose]       = useState("");
  const [client, setClient]         = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes]           = useState("");
  const [tone, setTone]             = useState("Professional");
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody]     = useState("");
  const [isEditing, setIsEditing]   = useState(false);
  const [saved, setSaved]           = useState(false);
  const [sending, setSending]       = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const parseEmail = (text) => {
    const lines = text.split("\n");
    const sl   = lines.find(l => l.toLowerCase().startsWith("subject:"));
    const subj = sl ? sl.replace(/^subject:\s*/i, "").trim() : "";
    const body = lines.filter(l => !l.toLowerCase().startsWith("subject:")).join("\n").trim();
    return { subj, body };
  };

  const generate = async () => {
    if (!purpose) { alert("Please select a purpose first."); return; }
    setLoading(true); setResult(""); setIsEditing(false);
    const purposeLabels = {
      followup: "follow-up after inquiry", shipment: "shipment update",
      payment: "payment reminder",          quotation: "quotation / proforma invoice",
      welcome: "new client welcome",        custom: "custom purpose",
    };
    const prompt = `You are writing a business email for EkviraExportHouse, an Indian export trading company. Write a ${purposeLabels[purpose] || purpose} email.\n\nClient name: ${client || "[Client]"}\nTone: ${tone}\nKey details: ${notes || "(none provided)"}\n\nWrite a professional, complete email including Subject line. Keep it concise — max 150 words. Use Indian export business context naturally. Return only the email text, no commentary.`;
    try {
      // Calls our own /api/chat proxy — API key never leaves the server
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "grok-beta", messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
      setResult(text);
      const { subj, body } = parseEmail(text);
      setEditSubject(subj); setEditBody(body);
      setEmailsSent(n => n + 1);
    } catch {
      setResult("Could not generate email. Please check your connection and try again.");
    }
    setLoading(false);
  };

  const startEdit  = () => { const { subj, body } = parseEmail(result); setEditSubject(subj); setEditBody(body); setIsEditing(true); };
  const saveEdit   = () => { setResult(`Subject: ${editSubject}\n\n${editBody}`); setIsEditing(false); };
  const cancelEdit = () => { const { subj, body } = parseEmail(result); setEditSubject(subj); setEditBody(body); setIsEditing(false); };

  const sendEmail = async () => {
    if (!clientEmail.trim()) { alert("Please enter a Client Email to send."); return; }
    
    setSending(true);
    const finalSubject = isEditing ? editSubject : parseEmail(result).subj;
    const finalBody = isEditing ? editBody : parseEmail(result).body;
    
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: clientEmail, subject: finalSubject, body: finalBody }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 3000);
      } else {
        alert("Failed to send: " + data.error);
      }
    } catch (err) {
      alert("Error sending email: " + err.message);
    }
    setSending(false);
  };

  const fullText = isEditing ? `Subject: ${editSubject}\n\n${editBody}` : result;

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        {[{ n: emailsSent, l: "Emails generated today" }, { n: "2", l: "Auto-replies active" }].map((s, i) => (
          <div key={i} style={{ background: "#F9FAFB", borderRadius: 8, padding: "12px 16px" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: "#111827" }}>{s.n}</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {[
        { label: "Purpose", node: <select value={purpose} onChange={e => setPurpose(e.target.value)} style={inputStyle}>{PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select> },
        { label: "Client name", node: <input value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Global Traders Ltd." style={inputStyle} /> },
        { label: "Client email", node: <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@example.com" style={inputStyle} /> },
        { label: "Key details / notes", node: <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. Order #EVH-2024-089, 500 kg turmeric, ETA Aug 12" style={{ ...inputStyle, resize: "none" }} /> },
        { label: "Tone", node: <select value={tone} onChange={e => setTone(e.target.value)} style={inputStyle}>{TONES.map(t => <option key={t}>{t}</option>)}</select> },
      ].map(({ label, node }) => (
        <div key={label} style={{ marginBottom: 12 }}>
          <div style={labelStyle}>{label}</div>
          {node}
        </div>
      ))}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={generate} disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1 }}>
          {loading ? "⏳ Generating…" : "✨ Generate email"}
        </button>
        <button onClick={() => { setPurpose(""); setClient(""); setClientEmail(""); setNotes(""); setResult(""); setIsEditing(false); }} style={btnStyle}>✕ Clear</button>
      </div>

      {result && (
        <div style={{ marginTop: 16 }}>
          <div style={{ height: 1, background: "#E5E7EB", marginBottom: 14 }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={labelStyle}>Generated email</div>
            {!isEditing ? (
              <button onClick={startEdit} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", border: "1px solid #D1D5DB", borderRadius: 6, background: "#fff", color: "#374151", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✏️ Edit</button>
            ) : (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={saveEdit}   style={{ padding: "4px 10px", border: "none",            borderRadius: 6, background: "#2563EB", color: "#fff",    fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✓ Save</button>
                <button onClick={cancelEdit} style={{ padding: "4px 10px", border: "1px solid #D1D5DB", borderRadius: 6, background: "#fff",    color: "#6B7280", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕ Cancel</button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, fontWeight: 500 }}>SUBJECT</div>
            {isEditing
              ? <input value={editSubject} onChange={e => setEditSubject(e.target.value)} style={{ ...inputStyle, fontWeight: 500 }} />
              : <div style={{ background: "#F0F9FF", border: "1px solid #BAE6FD", borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 500, color: "#0C4A6E" }}>{parseEmail(result).subj || "—"}</div>
            }
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4, fontWeight: 500 }}>BODY</div>
            {isEditing
              ? <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={10} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.75 }} />
              : <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: 14, fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "#111827", fontFamily: "inherit" }}>{parseEmail(result).body}</div>
            }
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={sendEmail} disabled={sending} style={{ ...successBtn, opacity: sending ? 0.7 : 1 }}>
              {sending ? "⏳ Sending…" : sendSuccess ? "✓ Sent!" : "📤 Send Email"}
            </button>
            <CopyBtn text={fullText} />
            <button onClick={() => setSaved(true)} style={btnStyle}>{saved ? "✓ Saved!" : "🔖 Save as template"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Templates Tab ─────────────────────────────────────────────────────────────

function TemplatesTab() {
  const [sel, setSel]             = useState("followup");
  const [customName, setCustomName] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [extras, setExtras]       = useState([]);
  const [copied, setCopied]       = useState(false);

  const allTemplates = { ...TEMPLATES, ...Object.fromEntries(extras.map(e => [e.key, e])) };
  const current = allTemplates[sel];

  const copy = () => {
    navigator.clipboard.writeText(`Subject: ${current.subject}\n\n${current.body}`).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  const addCustom = () => {
    if (!customName.trim() || !customBody.trim()) return;
    const key = "custom_" + Date.now();
    setExtras(e => [...e, { key, label: customName, icon: "📝", subject: customName, body: customBody }]);
    setCustomName(""); setCustomBody("");
  };

  return (
    <div>
      <div style={labelStyle}>Quick-insert templates</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, marginTop: 6 }}>
        {Object.entries(allTemplates).map(([k, t]) => (
          <button key={k} onClick={() => setSel(k)} style={{ padding: "6px 12px", border: `1px solid ${sel === k ? "#3B82F6" : "#E5E7EB"}`, borderRadius: 8, background: sel === k ? "#EFF6FF" : "#fff", color: sel === k ? "#1D4ED8" : "#374151", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: "#E5E7EB", marginBottom: 12 }} />

      {current && (
        <>
          <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
            <strong style={{ color: "#374151" }}>Subject:</strong> {current.subject}
          </div>
          <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: 14, fontSize: 13, lineHeight: 1.75, whiteSpace: "pre-wrap", color: "#111827", minHeight: 140, fontFamily: "inherit" }}>
            {current.body}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button onClick={copy} style={primaryBtn}>{copied ? "✓ Copied!" : "📋 Copy template"}</button>
          </div>
        </>
      )}

      <div style={{ height: 1, background: "#E5E7EB", margin: "18px 0 12px" }} />
      <div style={labelStyle}>Add custom template</div>
      <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Template name" style={{ ...inputStyle, marginBottom: 8, marginTop: 6 }} />
      <textarea value={customBody} onChange={e => setCustomBody(e.target.value)} rows={4} placeholder="Template body — use [CLIENT], [DATE], [ORDER_NO] as placeholders" style={{ ...inputStyle, resize: "none" }} />
      <div style={{ marginTop: 8 }}>
        <button onClick={addCustom} style={btnStyle}>+ Save template</button>
      </div>
    </div>
  );
}

// ─── Auto-reply Tab ────────────────────────────────────────────────────────────

function AutoReplyTab() {
  const [rules, setRules] = useState(AUTO_RULES_DEFAULT);
  const [inboxLogs, setInboxLogs] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const toggle = (id) => setRules(r => r.map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));

  const checkInbox = async () => {
    setIsChecking(true);
    setInboxLogs(null);
    try {
      const res = await fetch("/api/check-emails");
      const data = await res.json();
      
      if (data.error) {
        setInboxLogs({ type: "error", message: data.error });
      } else {
        setInboxLogs({ 
          type: "success", 
          message: data.message || `Processed ${data.processed} emails.`,
          logs: data.logs || []
        });
      }
    } catch (err) {
      setInboxLogs({ type: "error", message: "Error checking emails: " + err.message });
    }
    setIsChecking(false);
  };

  return (
    <div>
      <div style={labelStyle}>Auto-reply rules</div>
      <div style={{ border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden", marginTop: 8 }}>
        {rules.map((rule, i) => (
          <div key={rule.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < rules.length - 1 ? "1px solid #F3F4F6" : "none" }}>
            <Toggle checked={rule.enabled} onChange={() => toggle(rule.id)} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{rule.title}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{rule.desc}</div>
            </div>
            <Badge status={rule.enabled ? "active" : "off"} />
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        <button onClick={() => setRules(r => [...r, { id: Date.now(), title: "New rule", desc: "Click to configure", enabled: false }])} style={btnStyle}>
          + Add rule
        </button>
      </div>

      <div style={{ marginTop: 18, background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 10, padding: "12px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#1E40AF", marginBottom: 4 }}>💡 How auto-replies work</div>
        <div style={{ fontSize: 12, color: "#1E3A8A", lineHeight: 1.6 }}>
          Active rules trigger automatically when matching emails arrive in your Gmail inbox. Connect Gmail via OAuth to enable live auto-replies.
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button style={{ ...primaryBtn, fontSize: 12, padding: "6px 12px" }} onClick={() => window.location.href = "/api/auth/google"}>
            Connect Gmail (OAuth) ↗
          </button>
          <button style={{ ...successBtn, fontSize: 12, padding: "6px 12px", opacity: isChecking ? 0.7 : 1 }} onClick={checkInbox} disabled={isChecking}>
            {isChecking ? "⏳ Checking..." : "🔄 Check Inbox Now"}
          </button>
        </div>

        {inboxLogs && (
          <div style={{ marginTop: 14, background: "#fff", borderRadius: 8, padding: 12, border: `1px solid ${inboxLogs.type === 'error' ? '#FCA5A5' : '#D1D5DB'}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: inboxLogs.type === 'error' ? '#DC2626' : '#111827', marginBottom: 6 }}>
              {inboxLogs.message}
            </div>
            {inboxLogs.logs && inboxLogs.logs.length > 0 && (
              <div style={{ fontSize: 11, color: "#4B5563", fontFamily: "monospace", whiteSpace: "pre-wrap", background: "#F9FAFB", padding: 8, borderRadius: 6, border: "1px solid #E5E7EB" }}>
                {inboxLogs.logs.map((log, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>• {log}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Scheduled Tab ─────────────────────────────────────────────────────────────

function ScheduledTab() {
  const [campaigns, setCampaigns] = useState(CAMPAIGNS_DEFAULT);
  const [name, setName]           = useState("");
  const [seg, setSeg]             = useState(SEGMENTS[0]);
  const [dt, setDt]               = useState("");
  const [saved, setSaved]         = useState(false);

  const schedule = () => {
    if (!name.trim() || !dt) { alert("Please fill in campaign name and send time."); return; }
    const d = new Date(dt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    setCampaigns(c => [{ id: Date.now(), name, seg, date: d, status: "scheduled" }, ...c]);
    setName(""); setDt(""); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <div style={labelStyle}>Scheduled campaigns</div>
      <div style={{ marginTop: 8, marginBottom: 16 }}>
        {campaigns.map(c => (
          <div key={c.id} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#fff" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{c.name}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>{c.seg} · {c.status === "sent" ? "Sent" : "Sending"} {c.date}</div>
            </div>
            <Badge status={c.status} />
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: "#E5E7EB", marginBottom: 14 }} />
      <div style={labelStyle}>Schedule a new campaign</div>
      <div style={{ marginTop: 8 }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Campaign name" style={{ ...inputStyle, marginBottom: 8 }} />
        <select value={seg} onChange={e => setSeg(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }}>
          {SEGMENTS.map(s => <option key={s}>{s}</option>)}
        </select>
        <input type="datetime-local" value={dt} onChange={e => setDt(e.target.value)} style={inputStyle} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
        <button onClick={schedule} style={primaryBtn}>📅 Schedule campaign</button>
        {saved && <span style={{ fontSize: 13, color: "#059669" }}>✓ Campaign scheduled!</span>}
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "compose",   label: "✨ AI Compose" },
  { id: "templates", label: "📄 Templates" },
  { id: "auto",      label: "🔁 Auto-reply" },
  { id: "schedule",  label: "📅 Scheduled" },
];

export default function App() {
  const [tab, setTab]               = useState("compose");
  const [emailsSent, setEmailsSent] = useState(0);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#fff", maxWidth: 680, margin: "0 auto", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      <div style={{ background: "#1E3A8A", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📦</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>EkviraExportHouse</div>
          <div style={{ fontSize: 11, color: "#93C5FD" }}>Email Automation Hub</div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid #E5E7EB", background: "#F9FAFB" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "10px 4px", border: "none", borderBottom: `2px solid ${tab === t.id ? "#2563EB" : "transparent"}`, background: "none", color: tab === t.id ? "#1D4ED8" : "#6B7280", fontSize: 12, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "18px 20px" }}>
        {tab === "compose"   && <ComposeTab emailsSent={emailsSent} setEmailsSent={setEmailsSent} />}
        {tab === "templates" && <TemplatesTab />}
        {tab === "auto"      && <AutoReplyTab />}
        {tab === "schedule"  && <ScheduledTab />}
      </div>

      <div style={{ borderTop: "1px solid #F3F4F6", padding: "10px 20px", background: "#F9FAFB", fontSize: 11, color: "#9CA3AF", display: "flex", justifyContent: "space-between" }}>
        <span>EkviraExportHouse · Export Trade CRM</span>
        <span>Powered by Grok AI</span>
      </div>
    </div>
  );
}
