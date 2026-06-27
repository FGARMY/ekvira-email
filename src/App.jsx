import React, { useState, useEffect } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEMPLATES = {
  followup: {
    label: "Follow-up", icon: "📬",
    subject: "Following up on your inquiry — EkviraExportHouse",
    body: `Dear [CLIENT],\n\nThank you for reaching out to us. We wanted to follow up on your recent inquiry and ensure you have all the information needed.\n\nOur team at EkviraExportHouse specialises in premium quality exports and we are delighted to assist you. Please find the details of your inquiry addressed below.\n\nKindly let us know if you require any further clarification. We look forward to a long and fruitful association.\n\nWarm regards,\nEkviraExportHouse Team`,
  },
  shipment: {
    label: "Shipment update", icon: "🚢",
    subject: "Shipment Update — Order #[ORDER_NO]",
    body: `Dear [CLIENT],\n\nWe are pleased to inform you that your order has been dispatched on [DATE].\n\nShipment details:\n• Order No: [ORDER_NO]\n• Estimated Delivery: [ETA]\n• Tracking No: [TRACKING]\n\nPlease feel free to contact us for any queries regarding your shipment.\n\nBest regards,\nEkviraExportHouse Logistics Team`,
  },
  payment: {
    label: "Payment reminder", icon: "💳",
    subject: "Payment Reminder — Invoice #[INV_NO]",
    body: `Dear [CLIENT],\n\nThis is a gentle reminder that Invoice #[INV_NO] amounting to ₹[AMOUNT] is due on [DATE].\n\nKindly arrange the payment at your earliest convenience to avoid any delays in processing your orders.\n\nFor any payment-related queries, feel free to reach us.\n\nThank you for your continued business.\n\nEkviraExportHouse Accounts Team`,
  },
  quotation: {
    label: "Quotation", icon: "📄",
    subject: "Quotation / Proforma Invoice — EkviraExportHouse",
    body: `Dear [CLIENT],\n\nThank you for your interest in our products. Please find below the quotation as requested.\n\n[PRODUCT/SERVICE DETAILS]\n\nThis quotation is valid for 15 days from the date of this email. We remain open to discussing terms further.\n\nLooking forward to your confirmation.\n\nSincerely,\nEkviraExportHouse Sales Team`,
  },
  welcome: {
    label: "Welcome", icon: "🎉",
    subject: "Welcome to EkviraExportHouse — We're glad to have you!",
    body: `Dear [CLIENT],\n\nA warm welcome from all of us at EkviraExportHouse!\n\nWe are excited to have you on board as our valued client. Our team is committed to delivering quality, reliability, and timely service in every transaction.\n\nYour dedicated point of contact will reach out shortly. In the meantime, do not hesitate to write to us for any queries.\n\nThank you for choosing EkviraExportHouse.\n\nWarm regards,\nThe EkviraExportHouse Team`,
  },
};

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
  width: "100%", padding: "10px 14px", border: "1px solid #CBD5E1", borderRadius: 8,
  background: "#F8FAFC", color: "#0F172A", fontSize: 14, fontFamily: "inherit",
  outline: "none", boxSizing: "border-box", transition: "all 0.2s ease"
};

const labelStyle = {
  fontSize: 12, color: "#64748B", fontWeight: 600, marginBottom: 6, display: "block", textTransform: "uppercase", letterSpacing: "0.05em"
};

const btnStyle = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "10px 18px", border: "1px solid #E2E8F0", borderRadius: 8,
  background: "#fff", color: "#334155", fontSize: 14, fontWeight: 500, cursor: "pointer",
  fontFamily: "inherit", transition: "all 0.2s ease", boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
};

const primaryBtn = { ...btnStyle, background: "#2563EB", color: "#fff", border: "none", boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.2)" };
const successBtn = { ...btnStyle, background: "#10B981", color: "#fff", border: "none", boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)" };

const cardStyle = {
  background: "#fff", borderRadius: 16, padding: 32,
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  border: "1px solid #E2E8F0", marginBottom: 24
};

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
    <span style={{ background: s.bg, color: s.color, fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99, letterSpacing: "0.03em" }}>
      {s.label}
    </span>
  );
};

const Toggle = ({ checked, onChange }) => (
  <div onClick={() => onChange(!checked)} style={{ width: 44, height: 24, borderRadius: 99, cursor: "pointer", flexShrink: 0, background: checked ? "#2563EB" : "#CBD5E1", position: "relative", transition: "background 0.2s" }}>
    <div style={{ position: "absolute", top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
  </div>
);

const CopyBtn = ({ text }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }} style={btnStyle}>
      {copied ? "✓ Copied!" : "📋 Copy Text"}
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
      const res  = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setResult(`Error: ${data.error?.message || data.error || 'Failed to generate email'}`);
      } else if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
        const text = data.candidates[0].content.parts[0].text;
        setResult(text);
        const { subj, body } = parseEmail(text);
        setEditSubject(subj); setEditBody(body);
        setEmailsSent(n => n + 1);
      } else {
        setResult("Error: Gemini returned unexpected data format.");
      }
    } catch (err) {
      setResult(`Error: Could not generate email. (${err.message}). Are you running on Vercel?`);
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {[{ n: emailsSent, l: "Emails generated today", color: "#3B82F6", bg: "#EFF6FF" }, { n: "2", l: "Auto-replies active", color: "#10B981", bg: "#ECFDF5" }].map((s, i) => (
          <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}40`, borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
             <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.n}</div>
             <div style={{ fontSize: 14, color: "#475569", fontWeight: 500 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 20 }}>Email Details</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
          
          <div>
            <label style={labelStyle}>Purpose</label>
            <select value={purpose} onChange={e => setPurpose(e.target.value)} style={inputStyle}>{PURPOSES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Client Name</label>
              <input value={client} onChange={e => setClient(e.target.value)} placeholder="e.g. Global Traders Ltd." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Client Email</label>
              <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@example.com" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Tone</label>
            <select value={tone} onChange={e => setTone(e.target.value)} style={inputStyle}>{TONES.map(t => <option key={t}>{t}</option>)}</select>
          </div>

          <div>
            <label style={labelStyle}>Key Details / Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="e.g. Order #EVH-2024-089, 500 kg turmeric, ETA Aug 12" style={{ ...inputStyle, resize: "none" }} />
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <button onClick={generate} disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.7 : 1, padding: "12px 24px", fontSize: 15 }}>
              {loading ? "⏳ Generating with AI..." : "✨ Generate Draft"}
            </button>
            <button onClick={() => { setPurpose(""); setClient(""); setClientEmail(""); setNotes(""); setResult(""); setIsEditing(false); }} style={btnStyle}>✕ Clear Form</button>
          </div>
        </div>
      </div>

      {result && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>Generated Email</h2>
            {!isEditing ? (
              <button onClick={startEdit} style={btnStyle}>✏️ Edit Draft</button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={saveEdit}   style={primaryBtn}>✓ Save Changes</button>
                <button onClick={cancelEdit} style={btnStyle}>✕ Cancel</button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Subject</label>
            {isEditing
              ? <input value={editSubject} onChange={e => setEditSubject(e.target.value)} style={{ ...inputStyle, fontWeight: 500, fontSize: 15 }} />
              : <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px", fontSize: 15, fontWeight: 600, color: "#0F172A" }}>{parseEmail(result).subj || "—"}</div>
            }
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Message Body</label>
            {isEditing
              ? <textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={12} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />
              : <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "16px 20px", fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#334155", fontFamily: "inherit" }}>{parseEmail(result).body}</div>
            }
          </div>

          <div style={{ height: 1, background: "#E2E8F0", margin: "24px 0" }} />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={sendEmail} disabled={sending} style={{ ...successBtn, opacity: sending ? 0.7 : 1, padding: "12px 24px", fontSize: 15 }}>
              {sending ? "⏳ Sending Email..." : sendSuccess ? "✓ Sent Successfully!" : "📤 Send Email via Gmail"}
            </button>
            <CopyBtn text={fullText} />
            <button onClick={() => setSaved(true)} style={btnStyle}>{saved ? "✓ Saved!" : "🔖 Save as Template"}</button>
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
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 20 }}>Quick-insert Templates</h2>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
          {Object.entries(allTemplates).map(([k, t]) => (
            <button key={k} onClick={() => setSel(k)} style={{ padding: "10px 16px", border: `1px solid ${sel === k ? "#3B82F6" : "#E2E8F0"}`, borderRadius: 10, background: sel === k ? "#EFF6FF" : "#F8FAFC", color: sel === k ? "#1D4ED8" : "#475569", fontSize: 14, fontWeight: sel === k ? 600 : 500, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {current && (
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 12 }}>
              <strong style={{ color: "#0F172A", fontSize: 15 }}>Subject:</strong> <span style={{ fontSize: 15, color: "#1E293B" }}>{current.subject}</span>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, padding: 20, fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap", color: "#334155", minHeight: 180, fontFamily: "inherit" }}>
              {current.body}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              <button onClick={copy} style={primaryBtn}>{copied ? "✓ Copied to Clipboard!" : "📋 Copy Template"}</button>
            </div>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 20 }}>Create Custom Template</h2>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={labelStyle}>Template Name / Subject</label>
            <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. Price Negotiation Follow-up" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Template Body</label>
            <textarea value={customBody} onChange={e => setCustomBody(e.target.value)} rows={6} placeholder="Template body — use [CLIENT], [DATE], [ORDER_NO] as placeholders" style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div>
            <button onClick={addCustom} style={btnStyle}>+ Save Template</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Auto-reply Tab ────────────────────────────────────────────────────────────

function AutoReplyTab() {
  const getInitialRules = () => {
    const saved = localStorage.getItem('ekvira-autoreply-rules');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, title: "General Inquiry", desc: "If it's a general inquiry, reply thanking them and stating that the team will contact them in a few hours.", enabled: true },
      { id: 2, title: "Payment Received", desc: "If they mention a payment, thank them for the payment and state the accounting team will verify it shortly.", enabled: false }
    ];
  };

  const [rules, setRules] = useState(getInitialRules);
  const [inboxLogs, setInboxLogs] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    localStorage.setItem('ekvira-autoreply-rules', JSON.stringify(rules));
  }, [rules]);

  const toggle = (id) => setRules(r => r.map(rule => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));
  const updateRuleDesc = (id, newDesc) => setRules(r => r.map(rule => rule.id === id ? { ...rule, desc: newDesc } : rule));
  const updateRuleTitle = (id, newTitle) => setRules(r => r.map(rule => rule.id === id ? { ...rule, title: newTitle } : rule));
  const deleteRule = (id) => setRules(r => r.filter(rule => rule.id !== id));

  const checkInbox = async () => {
    setIsChecking(true);
    setInboxLogs(null);
    try {
      const enabledRules = rules.filter(r => r.enabled).map(r => r.desc);
      const res = await fetch("/api/check-emails", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: enabledRules })
      });
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
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>1. Define AI Routing Rules</h2>
        </div>
        <p style={{ fontSize: 14, color: "#475569", marginBottom: 24, lineHeight: 1.6 }}>
          Write instructions for how the AI should respond to incoming emails. When new emails arrive, Gemini AI will read these enabled rules and apply the most relevant one automatically.
        </p>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {rules.map((rule) => (
            <div key={rule.id} style={{ background: rule.enabled ? "#F8FAFC" : "#FFFFFF", border: `1px solid ${rule.enabled ? '#93C5FD' : '#E2E8F0'}`, borderRadius: 12, padding: 20, opacity: rule.enabled ? 1 : 0.6, transition: "all 0.2s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, width: "100%" }}>
                  <Toggle checked={rule.enabled} onChange={() => toggle(rule.id)} />
                  <input 
                    type="text" 
                    value={rule.title} 
                    onChange={(e) => updateRuleTitle(rule.id, e.target.value)}
                    style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", border: "none", outline: "none", width: "100%", background: "transparent" }} 
                    placeholder="E.g., Payment Inquiry"
                  />
                </div>
                <button onClick={() => deleteRule(rule.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: 20, padding: 4 }} title="Delete rule">×</button>
              </div>
              <div style={{ paddingLeft: 60 }}>
                <label style={labelStyle}>AI Instruction</label>
                <textarea 
                  value={rule.desc}
                  onChange={(e) => updateRuleDesc(rule.id, e.target.value)}
                  style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                  placeholder="If they ask about X, tell them Y..."
                />
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => setRules(r => [...r, { id: Date.now(), title: "New Automation", desc: "", enabled: true }])} style={{ ...btnStyle, marginTop: 16, width: "100%", justifyContent: "center", borderStyle: "dashed", padding: "14px" }}>
          + Add New Routing Rule
        </button>
      </div>

      <div style={{ ...cardStyle, background: "#EFF6FF", border: "1px solid #BFDBFE" }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1E3A8A", marginBottom: 8, margin: 0 }}>2. Execute Automations</h2>
        <p style={{ fontSize: 14, color: "#1E40AF", marginBottom: 24, lineHeight: 1.6 }}>
          Connect your Gmail account, then click "Check Inbox". The system will process unread emails in the background and reply using your active rules above.
        </p>
        
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <button style={{ ...primaryBtn, padding: "14px 24px", fontSize: 15 }} onClick={() => window.location.href = "/api/auth/google"}>
            Link Gmail Account ↗
          </button>
          <button style={{ ...successBtn, padding: "14px 24px", fontSize: 15, opacity: isChecking ? 0.7 : 1 }} onClick={checkInbox} disabled={isChecking}>
            {isChecking ? "⏳ Processing Inbox..." : "🔄 Check Inbox Now"}
          </button>
        </div>

        {inboxLogs && (
          <div style={{ marginTop: 24, background: "#fff", borderRadius: 12, padding: 20, border: `1px solid ${inboxLogs.type === 'error' ? '#FCA5A5' : '#E2E8F0'}`, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: inboxLogs.type === 'error' ? '#DC2626' : '#0F172A', marginBottom: 12 }}>
              {inboxLogs.message}
            </div>
            {inboxLogs.logs && inboxLogs.logs.length > 0 && (
              <div style={{ fontSize: 13, color: "#475569", fontFamily: "monospace", whiteSpace: "pre-wrap", background: "#F8FAFC", padding: 16, borderRadius: 8, border: "1px solid #E2E8F0", lineHeight: 1.5 }}>
                {inboxLogs.logs.map((log, i) => (
                  <div key={i} style={{ marginBottom: 6 }}>• {log}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Inbox Tab ─────────────────────────────────────────────────────────────────

function InboxTab() {
  const [folder, setFolder] = useState('inbox');
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [draft, setDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchInbox = async () => {
    setLoading(true); setError(null); setSelectedEmail(null);
    try {
      const res = await fetch(`/api/inbox?folder=${folder}`);
      const data = await res.json();
      if (data.error) setError(data.error);
      else setEmails(data.emails || []);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchInbox(); }, [folder]);

  const generateReply = async (email) => {
    setSelectedEmail(email); setGenerating(true); setDraft("");
    try {
      const rules = JSON.parse(localStorage.getItem('ekvira-autoreply-rules') || "[]");
      const activeRulesText = rules.filter(r => r.enabled).map(r => r.desc).join("\\n");
      const prompt = `You are the AI auto-reply assistant for EkviraExportHouse, an Indian export trading company. 
We received an email from: ${email.sender}
Subject: ${email.subject}
Message: ${email.bodyFull}

Please read the email and apply the most relevant rule from this list:
${activeRulesText || "Rule 1: For all general inquiries, reply politely thanking them and stating that the team will contact them in a few hours."}

If none of the specific rules apply, just write a standard polite acknowledgment stating the team will get back to them.
Write ONLY the body of the response email. Do not include the subject line or any commentary. Keep it professional.`;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (res.ok && data.candidates && data.candidates[0].content.parts[0]) {
        setDraft(data.candidates[0].content.parts[0].text);
      } else {
        alert("Failed to generate: " + (data.error?.message || "Unknown error"));
      }
    } catch (err) {
      alert("Error generating reply: " + err.message);
    }
    setGenerating(false);
  };

  const startManualReply = (email) => {
    setSelectedEmail(email);
    setDraft("");
  };

  const sendReply = async () => {
    setSending(true);
    const toAddress = selectedEmail.sender.match(/<([^>]+)>/) ? selectedEmail.sender.match(/<([^>]+)>/)[1] : selectedEmail.sender;
    try {
      const res = await fetch("/api/send-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toAddress,
          subject: selectedEmail.subject,
          body: draft,
          threadMessageId: selectedEmail.messageId,
          gmailId: selectedEmail.id
        })
      });
      if (res.ok) {
        alert("Sent successfully!");
        setSelectedEmail(null);
        fetchInbox(); // refresh
      } else {
        const d = await res.json();
        alert("Failed to send: " + d.error);
      }
    } catch (err) {
      alert("Error sending: " + err.message);
    }
    setSending(false);
  };

  if (selectedEmail) {
    return (
      <div style={cardStyle}>
        <button onClick={() => setSelectedEmail(null)} style={{ ...btnStyle, marginBottom: 16 }}>← Back</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Draft Reply</h2>
        <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 8, marginBottom: 16, border: "1px solid #E2E8F0" }}>
          <strong>Replying to:</strong> {selectedEmail.sender}<br />
          <strong>Subject:</strong> Re: {selectedEmail.subject}
        </div>
        <label style={labelStyle}>{generating ? "AI Generating..." : "Message Body"}</label>
        <textarea 
          value={draft} 
          onChange={e => setDraft(e.target.value)}
          style={{ ...inputStyle, minHeight: 200, resize: "vertical", marginBottom: 16 }}
          placeholder={generating ? "Generating..." : "Type your reply here..."}
          disabled={generating}
        />
        <button onClick={sendReply} disabled={generating || sending} style={{ ...primaryBtn, padding: "12px 24px" }}>
          {sending ? "⏳ Sending..." : "📤 Send Reply"}
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <button 
            onClick={() => setFolder('inbox')} 
            style={{ ...btnStyle, background: folder === 'inbox' ? "#EFF6FF" : "transparent", border: folder === 'inbox' ? "1px solid #3B82F6" : "1px solid transparent", color: folder === 'inbox' ? "#1D4ED8" : "#64748B" }}
          >
            📥 Inbox
          </button>
          <button 
            onClick={() => setFolder('sent')} 
            style={{ ...btnStyle, background: folder === 'sent' ? "#EFF6FF" : "transparent", border: folder === 'sent' ? "1px solid #3B82F6" : "1px solid transparent", color: folder === 'sent' ? "#1D4ED8" : "#64748B" }}
          >
            📤 Sent Emails
          </button>
        </div>
        <button onClick={fetchInbox} style={btnStyle} disabled={loading}>{loading ? "⏳ Loading..." : "🔄 Refresh"}</button>
      </div>
      
      {error && <div style={{ color: "#DC2626", marginBottom: 16 }}>Error: {error}</div>}
      
      {!loading && emails.length === 0 && (
        <div style={{ color: "#64748B", textAlign: "center", padding: 32 }}>No emails found.</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {emails.map(email => (
          <div key={email.id} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#F8FAFC" }}>
            <div style={{ flex: 1, paddingRight: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{email.sender}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#1E293B", marginBottom: 8 }}>{email.subject}</div>
              <div style={{ fontSize: 13, color: "#64748B" }}>{email.bodySnippet}...</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button onClick={() => generateReply(email)} style={successBtn}>✨ AI Reply</button>
              <button onClick={() => startManualReply(email)} style={btnStyle}>💬 Manual Reply</button>
            </div>
          </div>
        ))}
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
      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 20 }}>Scheduled Campaigns</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {campaigns.map(c => (
            <div key={c.id} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: "#64748B" }}>{c.seg} · {c.status === "sent" ? "Sent on" : "Sending at"} {c.date}</div>
              </div>
              <Badge status={c.status} />
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 20 }}>Schedule New Campaign</h2>
        <div style={{ display: "grid", gap: 16 }}>
          <div>
            <label style={labelStyle}>Campaign Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q4 Trade Digest" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Target Segment</label>
            <select value={seg} onChange={e => setSeg(e.target.value)} style={inputStyle}>
              {SEGMENTS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Send Date & Time</label>
            <input type="datetime-local" value={dt} onChange={e => setDt(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 8 }}>
            <button onClick={schedule} style={primaryBtn}>📅 Schedule Campaign</button>
            {saved && <span style={{ fontSize: 14, fontWeight: 500, color: "#10B981" }}>✓ Campaign scheduled successfully!</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root Application Layout ───────────────────────────────────────────────────

const TABS = [
  { id: "compose",   label: "AI Compose", icon: "✨" },
  { id: "inbox",     label: "Inbox Review", icon: "📥" },
  { id: "templates", label: "Templates",  icon: "📄" },
  { id: "auto",      label: "Auto-reply", icon: "🔁" },
  { id: "schedule",  label: "Scheduled",  icon: "📅" },
];

export default function App() {
  const [tab, setTab]               = useState("compose");
  const [emailsSent, setEmailsSent] = useState(0);

  const activeTabDetails = TABS.find(t => t.id === tab);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif", background: "#F1F5F9", width: "100%", height: "100vh", display: "flex", overflow: "hidden" }}>
      
      {/* Sidebar */}
      <div style={{ width: 260, background: "#0F172A", color: "#F8FAFC", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Brand */}
        <div style={{ padding: "24px", borderBottom: "1px solid #1E293B", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: "0 4px 6px -1px rgba(37, 99, 235, 0.4)" }}>📦</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.01em" }}>EkviraExportHouse</div>
            <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, fontWeight: 500 }}>CRM & Automation</div>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ padding: "24px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 12px", marginBottom: 4 }}>Menu</div>
          {TABS.map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)} 
              style={{ 
                display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", 
                border: "none", borderRadius: 10, background: tab === t.id ? "#1E293B" : "transparent", 
                color: tab === t.id ? "#F8FAFC" : "#94A3B8", fontSize: 14, fontWeight: 600, 
                cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s", textAlign: "left"
              }}
            >
              <span style={{ fontSize: 16 }}>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: "24px", borderTop: "1px solid #1E293B" }}>
          <div style={{ fontSize: 12, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }}></div>
            Powered by Gemini AI
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ background: "#FFFFFF", padding: "20px 32px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            {activeTabDetails.label}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#475569" }}>
              SB
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px", scrollBehavior: "smooth" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", width: "100%" }}>
            {tab === "compose"   && <ComposeTab emailsSent={emailsSent} setEmailsSent={setEmailsSent} />}
            {tab === "inbox"     && <InboxTab />}
            {tab === "templates" && <TemplatesTab />}
            {tab === "auto"      && <AutoReplyTab />}
            {tab === "schedule"  && <ScheduledTab />}
          </div>
        </div>
        
      </div>
    </div>
  );
}
