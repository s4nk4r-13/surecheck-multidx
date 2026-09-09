import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Home, User, Users, Stethoscope, Activity, Camera, ScanLine, TrendingUp,
  TrendingDown, Minus, Bell, Settings as SettingsIcon, LogOut, ChevronRight,
  ChevronLeft, ArrowRight, ShieldCheck, MapPin, ClipboardList, FileText,
  AlertTriangle, CheckCircle2, Clock, BarChart3, Menu, X, Search, Download,
  Plus, Droplets, FlaskConical, Sparkles, MessageSquarePlus, Globe, Lock,
  HelpCircle, ChevronDown, Beaker, Timer, RotateCcw, Check,
} from "lucide-react";

/* =========================================================================
   DESIGN TOKENS
   ========================================================================= */
const T = {
  white: "#FFFFFF",
  surface: "#EFF5FA",
  surface2: "#E3EDF6",
  line: "#D7E3EE",
  navy: "#0E2438",
  navySoft: "#4A5D70",
  blue: "#0B5FA8",
  blueDark: "#084578",
  blueTint: "#DCEBF8",
  cyan: "#3AAFC7",
  green: "#1D8A5E",
  greenTint: "#E1F3EA",
  amber: "#B4790A",
  amberTint: "#FBEFD9",
  red: "#B23A2E",
  redTint: "#F8E4E1",
};

const fontStyle = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
.sc-root { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; color: ${T.navy}; }
.sc-display { font-family: 'Manrope', ui-sans-serif, system-ui, sans-serif; }
.sc-root *:focus-visible { outline: 2px solid ${T.blue}; outline-offset: 2px; }
.sc-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.sc-scroll::-webkit-scrollbar-thumb { background: ${T.line}; border-radius: 4px; }
@keyframes sc-fade-up { from { opacity: 0; transform: translateY(8px);} to { opacity:1; transform:translateY(0);} }
@keyframes sc-flow { 0% { stroke-dashoffset: 24; } 100% { stroke-dashoffset: 0; } }
@keyframes sc-pulse-ring { 0% { opacity:.55; transform: scale(0.9);} 100% { opacity:0; transform: scale(1.35);} }
@keyframes sc-scan-line { 0% { top: 8%; } 50% { top: 88%; } 100% { top: 8%; } }
@keyframes sc-shimmer { 0% { background-position: -200px 0;} 100% { background-position: 200px 0;} }
.sc-anim-in { animation: sc-fade-up .5s ease both; }
`;

/* =========================================================================
   MOCK DATA
   ========================================================================= */
const CURRENT_USER = { name: "Aarav", initials: "A" };

const BIOMARKER_DEFS = [
  { key: "glucose", label: "Glucose", category: "Metabolic", unit: "mg/dL", value: "Negative", status: "normal", trend: "stable" },
  { key: "protein", label: "Protein / Microalbumin", category: "Kidney", unit: "mg/dL", value: "Trace", status: "normal", trend: "stable" },
  { key: "creatinine", label: "Creatinine", category: "Kidney", unit: "mg/dL", value: "1.1", status: "normal", trend: "down" },
  { key: "nitrite", label: "Nitrite", category: "UTI", unit: "—", value: "Not detected", status: "normal", trend: "stable" },
  { key: "leukocyte", label: "Leukocyte Esterase", category: "UTI", unit: "—", value: "Not detected", status: "normal", trend: "stable" },
  { key: "bilirubin", label: "Bilirubin", category: "Liver", unit: "—", value: "Negative", status: "normal", trend: "stable" },
  { key: "urobilinogen", label: "Urobilinogen", category: "Liver", unit: "EU/dL", value: "0.2", status: "normal", trend: "stable" },
];

const CATEGORY_INFO = {
  Kidney: { color: T.blue, tint: T.blueTint, desc: "Protein/microalbumin, creatinine — kidney-risk monitoring" },
  Metabolic: { color: T.cyan, tint: "#E3F5F8", desc: "Glucose screening" },
  Liver: { color: T.amber, tint: T.amberTint, desc: "Bilirubin, urobilinogen" },
  UTI: { color: T.green, tint: T.greenTint, desc: "Nitrite, leukocyte esterase" },
};

function buildTrend(base, wiggle, len = 6) {
  const out = [];
  let v = base;
  for (let i = 0; i < len; i++) {
    v = Math.max(0, v + (Math.sin(i * 1.3) * wiggle) + (Math.random() - 0.5) * wiggle * 0.4);
    out.push({ test: `Test ${i + 1}`, value: Math.round(v * 10) / 10 });
  }
  return out;
}

const TRENDS = {
  Kidney: { data: buildTrend(9, 2.2), note: "Stable", unit: "mg/dL (Protein)" },
  Metabolic: { data: buildTrend(4, 1.5), note: "Stable", unit: "mg/dL (Glucose)" },
  UTI: { data: buildTrend(1, 0.6), note: "Needs review", unit: "index score" },
  Liver: { data: buildTrend(2, 0.8), note: "Improving", unit: "EU/dL (Urobilinogen)" },
};

const PATIENTS = [
  { id: "DP-01", name: "Demo Patient 01", age: "35–44", lastTest: "Today", markers: "Protein ↑, others normal", status: "Review recommended", trend: "up", followUp: "Pending" },
  { id: "DP-02", name: "Demo Patient 02", age: "25–34", lastTest: "Yesterday", markers: "All within range", status: "Normal screening", trend: "stable", followUp: "None" },
  { id: "DP-03", name: "Demo Patient 03", age: "55–64", lastTest: "2 days ago", markers: "Nitrite detected", status: "Follow-up required", trend: "up", followUp: "Scheduled" },
  { id: "DP-04", name: "Demo Patient 04", age: "45–54", lastTest: "3 days ago", markers: "Glucose borderline", status: "Review recommended", trend: "up", followUp: "Pending" },
  { id: "DP-05", name: "Demo Patient 05", age: "18–24", lastTest: "5 days ago", markers: "All within range", status: "Normal screening", trend: "down", followUp: "None" },
  { id: "DP-06", name: "Demo Patient 06", age: "65+", lastTest: "1 week ago", markers: "Creatinine elevated", status: "Follow-up required", trend: "up", followUp: "Scheduled" },
];

const NOTIFICATIONS = [
  { id: 1, type: "followup", title: "Follow-up reminder", message: "Demo Patient 04 has a screening result marked for review.", time: "10 min ago" },
  { id: 2, type: "complete", title: "Test complete", message: "Your SureCheck screening analysis is ready.", time: "1 hr ago" },
  { id: 3, type: "trend", title: "Trend update", message: "A change was detected in your recent screening history.", time: "Yesterday" },
  { id: 4, type: "complete", title: "Screening synced", message: "Demo Patient 02's screening was shared with Dr. Rao.", time: "2 days ago" },
];

const PHC_STATS = {
  today: 18,
  pendingFollowups: 5,
  requiringReview: 3,
  coverage: 214,
  categories: [
    { name: "UTI signals", value: 6 },
    { name: "Kidney-risk signals", value: 4 },
    { name: "Metabolic signals", value: 3 },
  ],
  weekly: [
    { day: "Mon", screened: 14 }, { day: "Tue", screened: 19 }, { day: "Wed", screened: 12 },
    { day: "Thu", screened: 21 }, { day: "Fri", screened: 18 }, { day: "Sat", screened: 9 }, { day: "Sun", screened: 4 },
  ],
};

/* =========================================================================
   PRIMITIVE COMPONENTS
   ========================================================================= */

function Button({ children, variant = "primary", size = "md", icon: Icon, iconRight, className = "", style, ...props }) {
  const sizes = { sm: "text-sm px-3.5 py-2", md: "text-[15px] px-5 py-2.5", lg: "text-base px-7 py-3.5" };
  const variants = {
    primary: { background: T.blue, color: T.white, border: `1px solid ${T.blue}` },
    dark: { background: T.navy, color: T.white, border: `1px solid ${T.navy}` },
    secondary: { background: T.white, color: T.blue, border: `1px solid ${T.blue}` },
    ghost: { background: "transparent", color: T.navy, border: `1px solid ${T.line}` },
    subtle: { background: T.surface, color: T.navy, border: `1px solid transparent` },
    danger: { background: T.white, color: T.red, border: `1px solid ${T.red}` },
  };
  const IconRight = iconRight;
  return (
    <button
      {...props}
      style={{ ...variants[variant], ...style }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-transform duration-150 active:scale-[0.98] hover:brightness-[0.97] disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${className}`}
    >
      {Icon && <Icon size={17} strokeWidth={2} />}
      {children}
      {IconRight && <IconRight size={17} strokeWidth={2} />}
    </button>
  );
}

function DemoBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${className}`}
      style={{ background: T.amberTint, color: T.amber, border: `1px solid ${T.amber}33` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.amber }} />
      Prototype · Demonstration data
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    normal: { bg: T.greenTint, fg: T.green, label: "Normal screening", Icon: CheckCircle2 },
    "Normal screening": { bg: T.greenTint, fg: T.green, label: "Normal screening", Icon: CheckCircle2 },
    review: { bg: T.amberTint, fg: T.amber, label: "Review recommended", Icon: AlertTriangle },
    "Review recommended": { bg: T.amberTint, fg: T.amber, label: "Review recommended", Icon: AlertTriangle },
    followup: { bg: T.redTint, fg: T.red, label: "Follow-up required", Icon: AlertTriangle },
    "Follow-up required": { bg: T.redTint, fg: T.red, label: "Follow-up required", Icon: AlertTriangle },
  };
  const m = map[status] || map.normal;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold" style={{ background: m.bg, color: m.fg }}>
      <m.Icon size={13} strokeWidth={2.5} />
      {m.label}
    </span>
  );
}

function TrendTag({ trend }) {
  const map = {
    up: { Icon: TrendingUp, color: T.amber, label: "Rising" },
    down: { Icon: TrendingDown, color: T.green, label: "Improving" },
    stable: { Icon: Minus, color: T.navySoft, label: "Stable" },
  };
  const m = map[trend] || map.stable;
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] font-medium" style={{ color: m.color }}>
      <m.Icon size={13} /> {m.label}
    </span>
  );
}

function Divider({ className = "" }) {
  return <div className={`h-px w-full ${className}`} style={{ background: T.line }} />;
}

function Disclaimer({ children, tone = "default" }) {
  return (
    <div
      className="rounded-xl p-4 text-[13.5px] leading-relaxed flex gap-3"
      style={{ background: T.surface, border: `1px solid ${T.line}`, color: T.navySoft }}
    >
      <ShieldCheck size={18} style={{ color: T.blue, flexShrink: 0, marginTop: 1 }} />
      <p>{children}</p>
    </div>
  );
}

function Logo({ size = 28, withText = true, dark = false }) {
  const fg = dark ? T.white : T.navy;
  return (
    <div className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke={T.blue} strokeWidth="2.5" />
        <circle cx="20" cy="20" r="3" fill={T.blue} />
        <circle cx="11" cy="14" r="2" fill={T.cyan} />
        <circle cx="29" cy="14" r="2" fill={T.cyan} />
        <circle cx="11" cy="26" r="2" fill={T.cyan} />
        <path d="M12.5 15L18 19M27.5 15L22 19M12.5 25L18 21" stroke={T.cyan} strokeWidth="1.4" />
        <path d="M14 21.5L18.5 26L27 16" stroke={T.blue} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {withText && (
        <div className="leading-none">
          <div className="sc-display font-bold text-[17px]" style={{ color: fg }}>SureCheck</div>
          <div className="text-[10.5px] font-semibold tracking-wide" style={{ color: T.blue }}>MultiDx</div>
        </div>
      )}
    </div>
  );
}

/* Sparkline for compact biomarker cards */
function Sparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={data.map((v, i) => ({ i, v }))}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function BiomarkerCard({ def, onClick }) {
  const cat = CATEGORY_INFO[def.category];
  const spark = useMemo(() => buildTrend(3, 1, 6).map((d) => d.value), []);
  return (
    <button
      onClick={onClick}
      className="text-left rounded-xl p-4 w-full transition-shadow hover:shadow-sm"
      style={{ background: T.white, border: `1px solid ${T.line}` }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: cat.tint, color: cat.color }}>{def.category}</span>
        <TrendTag trend={def.trend} />
      </div>
      <div className="text-[14px] font-semibold mb-0.5" style={{ color: T.navy }}>{def.label}</div>
      <div className="sc-display text-[20px] font-bold mb-1" style={{ color: T.navy }}>{def.value}</div>
      <div className="text-[12px] mb-2" style={{ color: T.navySoft }}>Within expected screening range</div>
      <Sparkline data={spark} color={cat.color} />
    </button>
  );
}

function ProgressStepper({ steps, current }) {
  return (
    <div className="flex items-center w-full">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "todo";
        return (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors"
                style={{
                  background: state === "todo" ? T.white : T.blue,
                  color: state === "todo" ? T.navySoft : T.white,
                  border: `1.5px solid ${state === "todo" ? T.line : T.blue}`,
                }}
              >
                {state === "done" ? <Check size={15} /> : i + 1}
              </div>
              <span className="text-[11px] font-medium hidden sm:block" style={{ color: state === "todo" ? T.navySoft : T.navy }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-[1.5px] mx-1 sm:mx-2 mb-5 sm:mb-4" style={{ background: i < current ? T.blue : T.line }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* =========================================================================
   APP SHELL (sidebar + top bar + mobile bottom nav)
   ========================================================================= */

function AppShell({ role, active, onNav, onOpenNotifications, onLogout, title, subtitle, children }) {
  const navItemsByRole = {
    user: [
      { id: "overview", label: "Overview", Icon: Home },
      { id: "new-test", label: "New Test", Icon: FlaskConical },
      { id: "trends", label: "Trends", Icon: BarChart3 },
      { id: "profile", label: "Profile", Icon: User },
    ],
    doctor: [
      { id: "overview", label: "Overview", Icon: Home },
      { id: "patients", label: "Patients", Icon: Users },
      { id: "trends", label: "Trends", Icon: BarChart3 },
      { id: "profile", label: "Settings", Icon: SettingsIcon },
    ],
    phc: [
      { id: "overview", label: "Overview", Icon: Home },
      { id: "screening", label: "New Screening", Icon: FlaskConical },
      { id: "community", label: "Community", Icon: MapPin },
      { id: "profile", label: "Settings", Icon: SettingsIcon },
    ],
  };
  const items = navItemsByRole[role];
  const roleLabel = { user: "Individual", doctor: "Doctor", phc: "PHC Worker" }[role];

  return (
    <div className="sc-root min-h-screen flex" style={{ background: T.surface }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r px-5 py-6" style={{ borderColor: T.line, background: T.white }}>
        <div className="mb-8 px-1"><Logo /></div>
        <nav className="flex flex-col gap-1">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => onNav(it.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14.5px] font-medium transition-colors"
              style={{
                background: active === it.id ? T.blueTint : "transparent",
                color: active === it.id ? T.blue : T.navySoft,
              }}
            >
              <it.Icon size={18} strokeWidth={2.1} />
              {it.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 flex flex-col gap-3">
          <DemoBadge />
          <div className="flex items-center gap-3 px-1 py-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0" style={{ background: T.blueTint, color: T.blue }}>
              {CURRENT_USER.initials}
            </div>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold truncate">{CURRENT_USER.name}</div>
              <div className="text-[12px] truncate" style={{ color: T.navySoft }}>{roleLabel}</div>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13.5px] font-medium" style={{ color: T.navySoft }}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 px-5 sm:px-8 py-4 border-b lg:border-b-0" style={{ borderColor: T.line, background: T.white }}>
          <div className="lg:hidden"><Logo size={24} /></div>
          <div className="hidden lg:block">
            {title && <h1 className="sc-display text-[22px] font-bold leading-tight">{title}</h1>}
            {subtitle && <p className="text-[13.5px] mt-0.5" style={{ color: T.navySoft }}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onOpenNotifications} className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background: T.surface }}>
              <Bell size={17} style={{ color: T.navy }} />
              <span className="absolute top-1.5 right-2 w-1.5 h-1.5 rounded-full" style={{ background: T.red }} />
            </button>
            <div className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center text-[13px] font-bold lg:hidden" style={{ background: T.blueTint, color: T.blue }}>
              {CURRENT_USER.initials}
            </div>
          </div>
        </header>

        <div className="lg:hidden px-5 sm:px-8 pt-5">
          {title && <h1 className="sc-display text-[20px] font-bold leading-tight">{title}</h1>}
          {subtitle && <p className="text-[13px] mt-0.5" style={{ color: T.navySoft }}>{subtitle}</p>}
        </div>

        <main className="flex-1 px-5 sm:px-8 py-6 pb-24 lg:pb-10 overflow-y-auto sc-scroll">
          <div className="max-w-6xl mx-auto sc-anim-in" key={active}>{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 flex items-stretch justify-around border-t z-30" style={{ background: T.white, borderColor: T.line }}>
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => onNav(it.id)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium"
            style={{ color: active === it.id ? T.blue : T.navySoft }}
          >
            <it.Icon size={20} strokeWidth={active === it.id ? 2.4 : 2} />
            {it.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/* =========================================================================
   NOTIFICATIONS PANEL
   ========================================================================= */
function NotificationsPanel({ onClose }) {
  const iconFor = { followup: AlertTriangle, complete: CheckCircle2, trend: TrendingUp };
  const colorFor = { followup: T.amber, complete: T.green, trend: T.blue };
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(14,36,56,0.35)" }} onClick={onClose}>
      <div
        className="w-full sm:w-[400px] h-full bg-white flex flex-col sc-anim-in"
        style={{ animationDuration: "0.25s" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: T.line }}>
          <h2 className="sc-display text-[17px] font-bold">Notifications</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: T.surface }}>
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto sc-scroll">
          {NOTIFICATIONS.map((n) => {
            const Icon = iconFor[n.type];
            return (
              <div key={n.id} className="flex gap-3 px-5 py-4 border-b" style={{ borderColor: T.line }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${colorFor[n.type]}17` }}>
                  <Icon size={16} style={{ color: colorFor[n.type] }} />
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold">{n.title}</div>
                  <div className="text-[13px] mt-0.5" style={{ color: T.navySoft }}>{n.message}</div>
                  <div className="text-[11.5px] mt-1" style={{ color: T.navySoft }}>{n.time}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   LANDING PAGE
   ========================================================================= */
function LandingPage({ onStart, onExplore, onLogin }) {
  const [openFaq, setOpenFaq] = useState(null);
  const steps = [
    { n: "01", title: "Collect", desc: "Midstream urine sample collected in a clean container.", Icon: Droplets },
    { n: "02", title: "Test", desc: "The microfluidic strip distributes the sample across detection zones.", Icon: Beaker },
    { n: "03", title: "Scan", desc: "A smartphone captures the strip using an optical calibration reference.", Icon: Camera },
    { n: "04", title: "Understand", desc: "AI-assisted image analysis generates a screening profile.", Icon: Sparkles },
  ];
  const panel = [
    { cat: "Kidney", color: T.blue, tint: T.blueTint, items: ["Protein / Microalbumin", "Creatinine", "Kidney-risk monitoring"] },
    { cat: "Metabolic", color: T.cyan, tint: "#E3F5F8", items: ["Glucose"] },
    { cat: "Liver", color: T.amber, tint: T.amberTint, items: ["Bilirubin", "Urobilinogen"] },
    { cat: "UTI", color: T.green, tint: T.greenTint, items: ["Nitrite", "Leukocyte esterase"] },
  ];

  return (
    <div className="sc-root" style={{ background: T.white }}>
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b" style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", borderColor: T.line }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium" style={{ color: T.navySoft }}>
            <a href="#technology">Technology</a>
            <a href="#panel">Panel</a>
            <a href="#doctors">For Doctors</a>
            <a href="#phc">For PHCs</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={onLogin} className="text-[14px] font-semibold hidden sm:block" style={{ color: T.blue }}>Sign in</button>
            <Button size="sm" onClick={onStart}>Start a test</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <DemoBadge className="mb-6" />
          <h1 className="sc-display font-extrabold leading-[1.05] mb-6" style={{ fontSize: "clamp(2.1rem, 4.2vw, 3.4rem)", color: T.navy }}>
            Smarter urine screening.<br />Closer to care.
          </h1>
          <p className="text-[17px] leading-relaxed mb-8 max-w-lg" style={{ color: T.navySoft }}>
            SureCheck MultiDx combines microfluidic testing, optical calibration and AI-assisted analysis to make multi-parameter urine screening more accessible — in homes, PHCs and decentralized clinics.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Button size="lg" onClick={onStart} iconRight={ArrowRight}>Start a test</Button>
            <Button size="lg" variant="ghost" onClick={onExplore}>Explore the platform</Button>
          </div>
          <p className="text-[12.5px]" style={{ color: T.navySoft }}>Concept-stage platform (TRL 3–4). Not a clinically approved diagnostic device.</p>
        </div>

        {/* Hero visual */}
        <div className="relative">
          <div className="rounded-2xl p-8 relative overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <svg viewBox="0 0 420 380" className="w-full h-auto">
              {/* phone */}
              <rect x="230" y="30" width="140" height="280" rx="20" fill={T.navy} />
              <rect x="238" y="46" width="124" height="248" rx="4" fill="#fff" />
              <rect x="248" y="60" width="104" height="130" rx="8" fill={T.surface} stroke={T.line} />
              {/* scan frame corners inside phone */}
              <path d="M256 66 h14 M256 66 v14" stroke={T.blue} strokeWidth="2.5" fill="none" />
              <path d="M344 66 h-14 M344 66 v14" stroke={T.blue} strokeWidth="2.5" fill="none" />
              <path d="M256 184 h14 M256 184 v-14" stroke={T.blue} strokeWidth="2.5" fill="none" />
              <path d="M344 184 h-14 M344 184 v-14" stroke={T.blue} strokeWidth="2.5" fill="none" />
              <rect x="264" y="118" width="72" height="8" rx="3" fill={T.cyan} opacity="0.5" />
              <rect x="248" y="200" width="104" height="10" rx="3" fill={T.blueTint} />
              <rect x="248" y="216" width="70" height="8" rx="3" fill={T.surface2} />
              <rect x="248" y="230" width="90" height="8" rx="3" fill={T.surface2} />
              <circle cx="300" cy="270" r="3" fill={T.blue} />
              {/* strip */}
              <g transform="translate(20,170) rotate(-8)">
                <rect x="0" y="0" width="170" height="34" rx="6" fill="#fff" stroke={T.line} strokeWidth="1.5" />
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <rect key={i} x={10 + i * 22} y="7" width="16" height="20" rx="3"
                    fill={[T.blueTint, T.greenTint, T.amberTint, T.blueTint, "#E3F5F8", T.greenTint, T.amberTint][i]} />
                ))}
                <rect x="150" y="7" width="12" height="20" rx="2" fill="none" stroke={T.navySoft} strokeDasharray="2 2" />
              </g>
              <text x="20" y="150" fontFamily="Manrope" fontSize="13" fontWeight="700" fill={T.navy}>SureCheck strip</text>
              {/* result card floating */}
              <g transform="translate(20,250)">
                <rect x="0" y="0" width="180" height="86" rx="12" fill="#fff" stroke={T.line} strokeWidth="1.5" />
                <circle cx="22" cy="24" r="10" fill={T.greenTint} />
                <path d="M17 24l4 4 8-8" stroke={T.green} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <text x="40" y="21" fontFamily="Inter" fontSize="10" fill={T.navySoft}>Screening overview</text>
                <text x="40" y="34" fontFamily="Manrope" fontSize="11.5" fontWeight="700" fill={T.navy}>No signal detected</text>
                <rect x="14" y="50" width="152" height="6" rx="3" fill={T.surface} />
                <rect x="14" y="50" width="110" height="6" rx="3" fill={T.blue} />
                <text x="14" y="72" fontFamily="Inter" fontSize="9" fill={T.navySoft}>Prototype demonstration data</text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* Process */}
      <section id="technology" className="max-w-6xl mx-auto px-6 py-16 border-t" style={{ borderColor: T.line }}>
        <h2 className="sc-display text-[28px] font-bold mb-2">From sample to insight</h2>
        <p className="text-[15px] mb-12" style={{ color: T.navySoft }}>A guided four-step workflow, designed for use at home or at the point of care.</p>
        <div className="grid md:grid-cols-4 gap-6 relative">
          <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-px" style={{ background: T.line }} />
          {steps.map((s) => (
            <div key={s.n} className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center relative z-10" style={{ background: T.white, border: `1.5px solid ${T.blue}` }}>
                  <s.Icon size={20} style={{ color: T.blue }} />
                </div>
                <span className="sc-display text-[13px] font-bold" style={{ color: T.navySoft }}>{s.n}</span>
              </div>
              <h3 className="text-[16px] font-bold mb-1.5">{s.title}</h3>
              <p className="text-[13.5px] leading-relaxed" style={{ color: T.navySoft }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Panel */}
      <section id="panel" className="max-w-6xl mx-auto px-6 py-16 border-t" style={{ borderColor: T.line }}>
        <h2 className="sc-display text-[28px] font-bold mb-2">One test. Multiple health signals.</h2>
        <p className="text-[15px] mb-2" style={{ color: T.navySoft }}>Prototype detection panel — target parameters for ongoing development.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {panel.map((p) => (
            <div key={p.cat} className="rounded-xl p-5" style={{ border: `1px solid ${T.line}` }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4" style={{ background: p.tint }}>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
              </div>
              <h3 className="text-[15.5px] font-bold mb-2.5">{p.cat}</h3>
              <ul className="space-y-1.5">
                {p.items.map((it) => (
                  <li key={it} className="text-[13px]" style={{ color: T.navySoft }}>{it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t" style={{ borderColor: T.line }}>
        <h2 className="sc-display text-[28px] font-bold mb-10">How the technology works</h2>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-7">
            {[
              { t: "Microfluidic sample handling", d: "The strip controls sample movement and distribution across detection zones.", Icon: Beaker },
              { t: "Biosensing", d: "Detection zones use colorimetric and biosensor-based reactions.", Icon: FlaskConical },
              { t: "Optical calibration", d: "An integrated reference patch helps compensate for differences in ambient lighting and smartphone cameras.", Icon: ScanLine },
              { t: "AI-assisted analysis", d: "The application analyzes captured images and estimates biomarker responses.", Icon: Sparkles },
            ].map((r) => (
              <div key={r.t} className="flex gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: T.blueTint }}>
                  <r.Icon size={18} style={{ color: T.blue }} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold mb-1">{r.t}</h4>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: T.navySoft }}>{r.d}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-8" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
            <svg viewBox="0 0 400 260" className="w-full h-auto">
              <rect x="20" y="110" width="260" height="30" rx="6" fill="#fff" stroke={T.line} />
              {[0,1,2,3,4,5,6].map(i => (
                <rect key={i} x={30+i*35} y="116" width="24" height="18" rx="3" fill={i%2===0? T.blueTint : T.greenTint} />
              ))}
              <circle cx="300" cy="125" r="14" fill="none" stroke={T.navySoft} strokeDasharray="2 3" />
              <text x="270" y="105" fontFamily="Inter" fontSize="10" fill={T.navySoft}>Calibration ref.</text>
              <path d="M30 90 C 80 60, 220 60, 270 90" stroke={T.cyan} strokeWidth="2" fill="none" strokeDasharray="4 4" />
              <text x="120" y="55" fontFamily="Inter" fontSize="10" fill={T.navySoft}>Sample flow across zones</text>
              <rect x="20" y="170" width="360" height="60" rx="10" fill="#fff" stroke={T.line} />
              <circle cx="45" cy="200" r="14" fill={T.blueTint} />
              <path d="M39 200l4 4 8-9" stroke={T.blue} strokeWidth="2" fill="none" strokeLinecap="round" />
              <text x="70" y="196" fontFamily="Manrope" fontWeight="700" fontSize="12" fill={T.navy}>AI-assisted analysis</text>
              <text x="70" y="212" fontFamily="Inter" fontSize="10.5" fill={T.navySoft}>Estimates biomarker responses from calibrated color data</text>
            </svg>
          </div>
        </div>
      </section>

      {/* For doctors / PHC */}
      <section id="doctors" className="max-w-6xl mx-auto px-6 py-16 border-t grid md:grid-cols-2 gap-6" style={{ borderColor: T.line }}>
        <div className="rounded-2xl p-7" style={{ background: T.navy, color: T.white }}>
          <Stethoscope size={22} style={{ color: T.cyan }} className="mb-4" />
          <h3 className="sc-display text-[19px] font-bold mb-2">For doctors</h3>
          <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: "#C7D6E3" }}>Review patient screening results, trends and follow-up information from one clinical dashboard.</p>
          <Button variant="secondary" size="sm" onClick={onLogin} style={{ background: "transparent", color: T.white, border: "1px solid #ffffff55" }}>Continue as Doctor</Button>
        </div>
        <div id="phc" className="rounded-2xl p-7" style={{ background: T.blueTint }}>
          <Users size={22} style={{ color: T.blue }} className="mb-4" />
          <h3 className="sc-display text-[19px] font-bold mb-2">For PHCs</h3>
          <p className="text-[13.5px] leading-relaxed mb-5" style={{ color: T.navySoft }}>Support decentralized screening and monitor community-level testing at the point of care.</p>
          <Button variant="secondary" size="sm" onClick={onLogin}>Continue as PHC Worker</Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: T.line, background: T.surface }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <Logo size={24} />
              <p className="text-[13px] mt-3" style={{ color: T.navySoft }}>AI-enhanced point-of-care urine screening.</p>
            </div>
            {[
              { h: "Platform", links: ["Overview", "Panel", "Pricing"] },
              { h: "Technology", links: ["Microfluidics", "AI analysis", "Calibration"] },
              { h: "Access", links: ["For Doctors", "For PHCs", "About", "Contact"] },
            ].map((c) => (
              <div key={c.h}>
                <div className="text-[13px] font-bold mb-3">{c.h}</div>
                <ul className="space-y-2">
                  {c.links.map((l) => <li key={l} className="text-[13px]" style={{ color: T.navySoft }}>{l}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <Divider className="mb-6" />
          <p className="text-[12px] leading-relaxed" style={{ color: T.navySoft }}>
            SureCheck MultiDx is a prototype/concept platform. Demonstration results are synthetic and are not intended to diagnose, treat, cure or prevent disease.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* =========================================================================
   LOGIN / ROLE SELECTION
   ========================================================================= */
function LoginPage({ onSelectRole, onBack }) {
  const roles = [
    { id: "user", title: "Individual", Icon: User, desc: "Run a screening test, view your results and track changes over time." },
    { id: "doctor", title: "Doctor", Icon: Stethoscope, desc: "Review patient screening results, trends and follow-up information." },
    { id: "phc", title: "PHC Worker", Icon: Users, desc: "Support decentralized screening and monitor community-level testing." },
  ];
  return (
    <div className="sc-root min-h-screen flex flex-col items-center justify-center px-6 py-16" style={{ background: T.surface }}>
      <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-1.5 text-[14px] font-medium" style={{ color: T.navySoft }}>
        <ChevronLeft size={16} /> Back
      </button>
      <div className="mb-8"><Logo size={32} /></div>
      <div className="text-center mb-10 max-w-md">
        <h1 className="sc-display text-[26px] font-bold mb-2">Welcome to SureCheck</h1>
        <p className="text-[15px]" style={{ color: T.navySoft }}>Choose how you're accessing the platform.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-5 max-w-4xl w-full">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => onSelectRole(r.id)}
            className="text-left rounded-2xl p-6 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md flex flex-col"
            style={{ border: `1.5px solid ${T.line}` }}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5" style={{ background: T.blueTint }}>
              <r.Icon size={20} style={{ color: T.blue }} />
            </div>
            <h3 className="text-[16.5px] font-bold mb-2">{r.title}</h3>
            <p className="text-[13.5px] leading-relaxed mb-6 flex-1" style={{ color: T.navySoft }}>{r.desc}</p>
            <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: T.blue }}>
              Continue as {r.title} <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
      <p className="text-[12px] mt-10" style={{ color: T.navySoft }}>Demo entry only — no real medical information is collected.</p>
    </div>
  );
}

/* =========================================================================
   USER: OVERVIEW
   ========================================================================= */
function UserOverview({ onNav }) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="sc-display text-[24px] font-bold">Good morning, {CURRENT_USER.name}</h2>
        <p className="text-[14px] mt-1" style={{ color: T.navySoft }}>Your health screening overview</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: T.white, border: `1px solid ${T.line}` }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-[12.5px] font-semibold" style={{ color: T.navySoft }}>Latest screening</span>
              <div className="flex items-center gap-2 mt-2">
                <CheckCircle2 size={20} style={{ color: T.green }} />
                <h3 className="sc-display text-[19px] font-bold">No immediate screening concern</h3>
              </div>
            </div>
            <StatusBadge status="normal" />
          </div>
          <p className="text-[13.5px] mb-5" style={{ color: T.navySoft }}>Last test: Today, 10:42 AM</p>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" onClick={() => onNav("results")}>View results</Button>
            <Button size="sm" variant="ghost" onClick={() => onNav("new-test")}>Start new test</Button>
          </div>
        </div>
        <div className="rounded-2xl p-6 flex flex-col justify-between" style={{ background: T.navy, color: T.white }}>
          <div>
            <FlaskConical size={20} style={{ color: T.cyan }} />
            <h3 className="sc-display text-[16px] font-bold mt-3 mb-1">Ready for your next screening?</h3>
            <p className="text-[13px]" style={{ color: "#C7D6E3" }}>Takes about 5 minutes, start to finish.</p>
          </div>
          <Button size="sm" onClick={() => onNav("new-test")} className="mt-5" style={{ background: T.white, color: T.navy, border: "none" }}>Start a test</Button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-bold">Biomarker overview</h3>
          <button onClick={() => onNav("trends")} className="text-[13.5px] font-semibold" style={{ color: T.blue }}>View trends</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {BIOMARKER_DEFS.map((b) => <BiomarkerCard key={b.key} def={b} onClick={() => onNav("results")} />)}
        </div>
      </div>

      <Disclaimer>
        These results are intended for screening and monitoring. They are not a diagnosis. Discuss abnormal or persistent findings with a qualified healthcare professional.
      </Disclaimer>
    </div>
  );
}

/* =========================================================================
   NEW TEST WORKFLOW
   ========================================================================= */
function NewTestFlow({ onFinish }) {
  const steps = ["Sample", "Test", "Scan", "Analyze", "Results"];
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(92);
  const [scanChecks, setScanChecks] = useState([false, false, false, false]);
  const [analyzeStage, setAnalyzeStage] = useState(0);

  // Step 2 (Test) countdown
  useEffect(() => {
    if (step !== 1) return;
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [step, timer]);

  // Step 3 (Scan) checks appearing progressively
  useEffect(() => {
    if (step !== 2) return;
    setScanChecks([false, false, false, false]);
    const delays = [500, 1100, 1700, 2300];
    const timers = delays.map((d, i) => setTimeout(() => setScanChecks((prev) => {
      const next = [...prev]; next[i] = true; return next;
    }), d));
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Step 4 (Analyze) stages
  useEffect(() => {
    if (step !== 3) return;
    setAnalyzeStage(0);
    const stages = 5;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setAnalyzeStage(i);
      if (i >= stages) {
        clearInterval(interval);
        setTimeout(() => setStep(4), 600);
      }
    }, 700);
    return () => clearInterval(interval);
  }, [step]);

  const mm = String(Math.floor(timer / 60)).padStart(2, "0");
  const ss = String(timer % 60).padStart(2, "0");

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <ProgressStepper steps={steps} current={step} />

      {/* STEP 1: Prepare */}
      {step === 0 && (
        <div className="rounded-2xl p-7" style={{ background: T.white, border: `1px solid ${T.line}` }}>
          <h2 className="sc-display text-[20px] font-bold mb-1">Prepare your sample</h2>
          <p className="text-[13.5px] mb-6" style={{ color: T.navySoft }}>Follow these steps before starting the test.</p>
          <ol className="space-y-4 mb-7">
            {[
              "Use a clean container.",
              "Collect a midstream urine sample.",
              "Follow the test kit instructions.",
              "Begin the test when ready.",
            ].map((s, i) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ background: T.blueTint, color: T.blue }}>{i + 1}</span>
                <span className="text-[14.5px] pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <Button onClick={() => setStep(1)} iconRight={ArrowRight}>I'm ready</Button>
        </div>
      )}

      {/* STEP 2: Test strip */}
      {step === 1 && (
        <div className="rounded-2xl p-7" style={{ background: T.white, border: `1px solid ${T.line}` }}>
          <h2 className="sc-display text-[20px] font-bold mb-1">Testing in progress</h2>
          <p className="text-[13.5px] mb-6" style={{ color: T.navySoft }}>Keep the strip flat while the test develops.</p>

          <div className="rounded-xl p-6 mb-6 flex items-center justify-center" style={{ background: T.surface }}>
            <svg viewBox="0 0 340 70" className="w-full max-w-sm h-auto">
              <rect x="0" y="10" width="340" height="50" rx="10" fill="#fff" stroke={T.line} strokeWidth="1.5" />
              {["GLU", "PRO", "CRE", "NIT", "LEU", "BIL", "URO"].map((z, i) => (
                <g key={z}>
                  <rect x={14 + i * 46} y="20" width="34" height="30" rx="5"
                    fill={timer < 92 - i * 8 ? [T.blueTint, T.greenTint, T.blueTint, T.greenTint, T.greenTint, T.amberTint, T.amberTint][i] : T.surface}
                    stroke={T.line} />
                  <text x={31 + i * 46} y="68" fontSize="8" textAnchor="middle" fontFamily="Inter" fill={T.navySoft}>{z}</text>
                </g>
              ))}
              <line x1="0" y1="35" x2="340" y2="35" stroke={T.cyan} strokeWidth="1.5" strokeDasharray="6 6" style={{ animation: "sc-flow 1.2s linear infinite" }} />
            </svg>
          </div>

          <div className="flex items-center justify-between rounded-xl px-5 py-4 mb-6" style={{ background: T.navy }}>
            <div>
              <div className="text-[12px] font-medium" style={{ color: "#9FB4C6" }}>Test in progress</div>
              <div className="sc-display text-[26px] font-bold" style={{ color: T.white }}>{mm}:{ss}</div>
            </div>
            <Timer size={26} style={{ color: T.cyan }} />
          </div>

          <Button disabled={timer > 0} onClick={() => setStep(2)} iconRight={ArrowRight} className="w-full sm:w-auto">
            {timer > 0 ? "Developing…" : "Continue to scan"}
          </Button>
          {timer > 0 && <button onClick={() => setTimer(0)} className="block mt-3 text-[12.5px] font-medium" style={{ color: T.blue }}>Skip demo wait</button>}
        </div>
      )}

      {/* STEP 3: Scan */}
      {step === 2 && (
        <div className="rounded-2xl p-7" style={{ background: T.white, border: `1px solid ${T.line}` }}>
          <h2 className="sc-display text-[20px] font-bold mb-1">Scan your SureCheck strip</h2>
          <p className="text-[13.5px] mb-6" style={{ color: T.navySoft }}>Align the strip inside the frame.</p>

          <div className="relative rounded-xl overflow-hidden mb-6 mx-auto" style={{ background: T.navy, aspectRatio: "4/5", maxWidth: 320 }}>
            <div className="absolute inset-6 rounded-lg" style={{ border: `2px solid ${T.cyan}` }}>
              <div className="absolute -top-0.5 -left-0.5 w-5 h-5 border-t-[3px] border-l-[3px] rounded-tl-md" style={{ borderColor: T.white }} />
              <div className="absolute -top-0.5 -right-0.5 w-5 h-5 border-t-[3px] border-r-[3px] rounded-tr-md" style={{ borderColor: T.white }} />
              <div className="absolute -bottom-0.5 -left-0.5 w-5 h-5 border-b-[3px] border-l-[3px] rounded-bl-md" style={{ borderColor: T.white }} />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 border-b-[3px] border-r-[3px] rounded-br-md" style={{ borderColor: T.white }} />
              <div className="absolute left-0 right-0 mx-auto w-[70%] top-[42%] h-6 rounded flex items-center justify-around px-1" style={{ background: "#ffffffcc" }}>
                {[T.blueTint, T.greenTint, T.amberTint, T.blueTint, T.greenTint].map((c, i) => <div key={i} className="w-2.5 h-3.5 rounded-sm" style={{ background: c }} />)}
              </div>
              {!scanChecks[3] && (
                <div className="absolute left-2 right-2 h-0.5 rounded" style={{ background: T.cyan, animation: "sc-scan-line 2s ease-in-out infinite" }} />
              )}
            </div>
            <span className="absolute bottom-3 left-0 right-0 text-center text-[12px] font-medium" style={{ color: "#C7D6E3" }}>Align the strip inside the frame</span>
          </div>

          <div className="space-y-2 mb-6">
            {[
              { label: "Strip detected", done: scanChecks[0] },
              { label: "Calibration reference detected", done: scanChecks[1] },
              { label: "Lighting acceptable", done: scanChecks[2] },
              { label: "Image alignment good", done: scanChecks[3] },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2.5 text-[13.5px]">
                {c.done
                  ? <CheckCircle2 size={16} style={{ color: T.green }} />
                  : <div className="w-4 h-4 rounded-full" style={{ border: `2px solid ${T.line}` }} />}
                <span style={{ color: c.done ? T.navy : T.navySoft }}>{c.label}</span>
              </div>
            ))}
          </div>

          <Button disabled={!scanChecks.every(Boolean)} onClick={() => setStep(3)} iconRight={Sparkles} className="w-full sm:w-auto">
            Analyze strip
          </Button>
        </div>
      )}

      {/* STEP 4: Analyze */}
      {step === 3 && (
        <div className="rounded-2xl p-7" style={{ background: T.white, border: `1px solid ${T.line}` }}>
          <h2 className="sc-display text-[20px] font-bold mb-1">Analyzing your test</h2>
          <p className="text-[13.5px] mb-8" style={{ color: T.navySoft }}>This usually takes a few seconds.</p>
          <div className="space-y-0">
            {["Image captured", "Calibration reference detected", "Detection zones identified", "Color response analyzed", "Screening profile generated"].map((s, i) => (
              <div key={s} className="flex items-center gap-3 py-3" style={{ borderBottom: i < 4 ? `1px solid ${T.line}` : "none" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{
                  background: analyzeStage > i ? T.greenTint : analyzeStage === i ? T.blueTint : T.surface,
                }}>
                  {analyzeStage > i
                    ? <CheckCircle2 size={14} style={{ color: T.green }} />
                    : analyzeStage === i
                      ? <div className="w-2.5 h-2.5 rounded-full" style={{ background: T.blue, animation: "sc-pulse-ring 1s ease-out infinite" }} />
                      : <div className="w-2 h-2 rounded-full" style={{ background: T.line }} />}
                </div>
                <span className="text-[14px] font-medium" style={{ color: analyzeStage >= i ? T.navy : T.navySoft }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5: transition to results */}
      {step === 4 && (
        <div className="rounded-2xl p-8 text-center" style={{ background: T.white, border: `1px solid ${T.line}` }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: T.greenTint }}>
            <CheckCircle2 size={26} style={{ color: T.green }} />
          </div>
          <h2 className="sc-display text-[20px] font-bold mb-2">Screening profile generated</h2>
          <p className="text-[13.5px] mb-7" style={{ color: T.navySoft }}>Your results are ready to view.</p>
          <Button onClick={onFinish} iconRight={ArrowRight}>View results</Button>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   RESULTS SCREEN
   ========================================================================= */
function ResultsScreen({ onNav }) {
  const [selected, setSelected] = useState(null);
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h2 className="sc-display text-[22px] font-bold">Screening Results</h2>
          <DemoBadge />
        </div>
        <p className="text-[13.5px]" style={{ color: T.navySoft }}>Test completed · Today · 10:45 AM</p>
      </div>

      <div className="rounded-2xl p-6" style={{ background: T.greenTint, border: `1px solid ${T.green}33` }}>
        <div className="flex items-center gap-2.5 mb-2">
          <CheckCircle2 size={22} style={{ color: T.green }} />
          <h3 className="sc-display text-[18px] font-bold">No immediate abnormal screening signal detected</h3>
        </div>
        <p className="text-[13.5px] leading-relaxed" style={{ color: T.navySoft }}>
          These results are intended for screening and monitoring. They are not a diagnosis. Discuss abnormal or persistent findings with a qualified healthcare professional.
        </p>
      </div>

      <div>
        <h3 className="text-[15px] font-bold mb-3">Biomarker results</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {BIOMARKER_DEFS.map((b) => {
            const cat = CATEGORY_INFO[b.category];
            return (
              <button key={b.key} onClick={() => setSelected(b)} className="text-left rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: T.white, border: `1px solid ${T.line}` }}>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold truncate">{b.label}</div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: T.navySoft }}>{b.value === "Not detected" ? "Not detected" : "Within expected screening range"}</div>
                </div>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: T.white, border: `1px solid ${T.line}` }}>
        <h3 className="text-[15px] font-bold mb-2">Screening insight</h3>
        <p className="text-[14px] mb-5" style={{ color: T.navySoft }}>No elevated screening signal detected in this demonstration. One or more screening markers may warrant clinical follow-up if symptoms are present or results change over time.</p>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="secondary">Discuss with a healthcare professional</Button>
          <Button size="sm" variant="ghost" onClick={() => onNav("trends")}>View trends</Button>
        </div>
      </div>

      <Disclaimer>Prototype demonstration data. These values do not represent a real person's medical result and this platform is not a clinically approved diagnostic device.</Disclaimer>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4" style={{ background: "rgba(14,36,56,0.4)" }} onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm sc-anim-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: CATEGORY_INFO[selected.category].tint, color: CATEGORY_INFO[selected.category].color }}>{selected.category}</span>
              <button onClick={() => setSelected(null)}><X size={18} /></button>
            </div>
            <h3 className="text-[17px] font-bold mb-1">{selected.label}</h3>
            <div className="sc-display text-[26px] font-bold mb-2">{selected.value}</div>
            <StatusBadge status="normal" />
            <p className="text-[13px] mt-4" style={{ color: T.navySoft }}>Within expected screening range for this demonstration test. Not a diagnostic result.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   TRENDS SCREEN (shared shape, used by user + doctor)
   ========================================================================= */
function TrendsScreen({ title = "Your health trends" }) {
  const cats = Object.keys(TRENDS);
  const [tab, setTab] = useState(cats[0]);
  const info = CATEGORY_INFO[tab];
  const trend = TRENDS[tab];
  const noteColor = trend.note === "Needs review" ? T.amber : trend.note === "Improving" ? T.green : T.navySoft;

  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="sc-display text-[22px] font-bold">{title}</h2>
      <div className="flex gap-2 flex-wrap">
        {cats.map((c) => (
          <button key={c} onClick={() => setTab(c)} className="px-4 py-2 rounded-full text-[13.5px] font-semibold transition-colors"
            style={{ background: tab === c ? T.blue : T.white, color: tab === c ? T.white : T.navySoft, border: `1px solid ${tab === c ? T.blue : T.line}` }}>
            {c}
          </button>
        ))}
      </div>
      <div className="rounded-2xl p-6" style={{ background: T.white, border: `1px solid ${T.line}` }}>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[15px] font-bold">{tab} marker trend — last 6 tests</h3>
          <span className="text-[12.5px] font-semibold" style={{ color: noteColor }}>{trend.note}</span>
        </div>
        <p className="text-[12.5px] mb-4" style={{ color: T.navySoft }}>{info.desc} · {trend.unit}</p>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trend.data} margin={{ left: -10, right: 10, top: 10 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="test" tick={{ fontSize: 12, fill: T.navySoft }} axisLine={{ stroke: T.line }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: T.navySoft }} axisLine={false} tickLine={false} />
            <RTooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 13 }} />
            <Line type="monotone" dataKey="value" stroke={info.color} strokeWidth={2.5} dot={{ r: 4, fill: info.color }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Disclaimer>Trends illustrate change across screenings, not a diagnosis. Persistent or worsening trends are best discussed with a healthcare professional.</Disclaimer>
    </div>
  );
}

/* =========================================================================
   PROFILE / SETTINGS (shared)
   ========================================================================= */
function SettingsScreen({ role, onLogout }) {
  const [notif, setNotif] = useState(true);
  const [sharing, setSharing] = useState(true);
  const roleLabel = { user: "Individual", doctor: "Doctor", phc: "PHC Worker" }[role];

  function Toggle({ on, onClick }) {
    return (
      <button onClick={onClick} className="w-11 h-6 rounded-full relative transition-colors" style={{ background: on ? T.blue : T.line }}>
        <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: on ? "translateX(21px)" : "translateX(2px)" }} />
      </button>
    );
  }
  function Row({ label, desc, right }) {
    return (
      <div className="flex items-center justify-between py-4">
        <div>
          <div className="text-[14px] font-semibold">{label}</div>
          {desc && <div className="text-[12.5px] mt-0.5" style={{ color: T.navySoft }}>{desc}</div>}
        </div>
        {right}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="sc-display text-[22px] font-bold">Profile & settings</h2>

      <div className="rounded-2xl p-6" style={{ background: T.white, border: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-[18px] font-bold" style={{ background: T.blueTint, color: T.blue }}>{CURRENT_USER.initials}</div>
          <div>
            <div className="text-[16px] font-bold">{CURRENT_USER.name}</div>
            <div className="text-[13px]" style={{ color: T.navySoft }}>{roleLabel} · Demo account</div>
          </div>
        </div>
        <Divider className="my-3" />
        <Row label="Connected healthcare provider" desc="Dr. S. Rao · Community Health Clinic" right={<button className="text-[13px] font-semibold" style={{ color: T.blue }}>Manage</button>} />
        <Divider />
        <Row label="Notification preferences" desc="Follow-up reminders and result alerts" right={<Toggle on={notif} onClick={() => setNotif((v) => !v)} />} />
        <Divider />
        <Row label="Share screenings with provider" desc="Allow your care team to view your results" right={<Toggle on={sharing} onClick={() => setSharing((v) => !v)} />} />
        <Divider />
        <Row label="Language" right={<span className="text-[13px] font-semibold flex items-center gap-1" style={{ color: T.navySoft }}><Globe size={14} /> English</span>} />
        <Divider />
        <Row label="Help & support" right={<HelpCircle size={16} style={{ color: T.navySoft }} />} />
      </div>

      <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 mb-2"><Lock size={16} style={{ color: T.blue }} /><h3 className="text-[14.5px] font-bold">Data & privacy</h3></div>
        <p className="text-[13px] leading-relaxed" style={{ color: T.navySoft }}>Your health information should be handled securely and only shared with authorized healthcare professionals. This prototype does not claim any specific security or regulatory certification.</p>
      </div>

      <Button variant="danger" icon={LogOut} onClick={onLogout}>Sign out</Button>
    </div>
  );
}

/* =========================================================================
   DOCTOR DASHBOARD
   ========================================================================= */
function DoctorOverview({ onOpenPatient, onNav }) {
  const kpis = [
    { label: "Patients screened today", value: "18", Icon: Users },
    { label: "Follow-ups pending", value: "5", Icon: Clock },
    { label: "Abnormal screening signals", value: "3", Icon: AlertTriangle },
    { label: "PHC screening activity", value: "214", Icon: MapPin },
  ];
  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl p-5" style={{ background: T.white, border: `1px solid ${T.line}` }}>
            <k.Icon size={18} style={{ color: T.blue }} />
            <div className="sc-display text-[26px] font-bold mt-3">{k.value}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: T.navySoft }}>{k.label}</div>
          </div>
        ))}
      </div>
      <PatientTable onOpenPatient={onOpenPatient} />
    </div>
  );
}

function PatientTable({ onOpenPatient }) {
  const [query, setQuery] = useState("");
  const filtered = PATIENTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-[16px] font-bold">Patients</h3>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: T.white, border: `1px solid ${T.line}` }}>
          <Search size={15} style={{ color: T.navySoft }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patients" className="text-[13.5px] outline-none bg-transparent w-40" />
        </div>
      </div>
      <div className="rounded-2xl overflow-hidden" style={{ background: T.white, border: `1px solid ${T.line}` }}>
        <div className="overflow-x-auto sc-scroll">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr style={{ background: T.surface }}>
                {["Patient", "Test date", "Key markers", "Screening status", "Trend", "Follow-up", ""].map((h) => (
                  <th key={h} className="text-[12px] font-semibold px-4 py-3" style={{ color: T.navySoft }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${T.line}` }}>
                  <td className="px-4 py-3.5 text-[13.5px] font-semibold whitespace-nowrap">{p.name}</td>
                  <td className="px-4 py-3.5 text-[13px] whitespace-nowrap" style={{ color: T.navySoft }}>{p.lastTest}</td>
                  <td className="px-4 py-3.5 text-[13px] whitespace-nowrap" style={{ color: T.navySoft }}>{p.markers}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3.5"><TrendTag trend={p.trend} /></td>
                  <td className="px-4 py-3.5 text-[13px] whitespace-nowrap" style={{ color: T.navySoft }}>{p.followUp}</td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => onOpenPatient(p)} className="text-[13px] font-semibold" style={{ color: T.blue }}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DoctorPatientProfile({ patient, onBack }) {
  const [note, setNote] = useState("");
  return (
    <div className="max-w-4xl space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: T.blue }}>
        <ChevronLeft size={15} /> Back to patients
      </button>
      <div>
        <h2 className="sc-display text-[22px] font-bold">Patient Screening Profile</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-[13.5px]" style={{ color: T.navySoft }}>
          <span>ID: <strong style={{ color: T.navy }}>{patient.id}</strong></span>
          <span>Age group: <strong style={{ color: T.navy }}>{patient.age}</strong></span>
          <span>Last screening: <strong style={{ color: T.navy }}>{patient.lastTest}</strong></span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={patient.status} />
        <TrendTag trend={patient.trend} />
      </div>

      <div className="rounded-2xl p-6" style={{ background: T.white, border: `1px solid ${T.line}` }}>
        <h3 className="text-[15px] font-bold mb-1">Biomarker trends</h3>
        <p className="text-[12.5px] mb-4" style={{ color: T.navySoft }}>Protein trend — last 6 tests</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={TRENDS.Kidney.data} margin={{ left: -10, right: 10, top: 10 }}>
            <CartesianGrid stroke={T.line} vertical={false} />
            <XAxis dataKey="test" tick={{ fontSize: 12, fill: T.navySoft }} axisLine={{ stroke: T.line }} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: T.navySoft }} axisLine={false} tickLine={false} />
            <RTooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 13 }} />
            <Line type="monotone" dataKey="value" stroke={T.blue} strokeWidth={2.5} dot={{ r: 4, fill: T.blue }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl p-6" style={{ background: T.white, border: `1px solid ${T.line}` }}>
        <h3 className="text-[15px] font-bold mb-3">Recent tests</h3>
        <div className="space-y-0">
          {["Today · 10:42 AM", "5 days ago", "12 days ago"].map((d, i) => (
            <div key={d} className="flex items-center justify-between py-3" style={{ borderTop: i > 0 ? `1px solid ${T.line}` : "none" }}>
              <span className="text-[13.5px]">{d}</span>
              <StatusBadge status={i === 0 ? patient.status : "normal"} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: T.amberTint, border: `1px solid ${T.amber}33` }}>
        <h3 className="text-[14.5px] font-bold mb-2">Screening observations</h3>
        <p className="text-[13.5px] leading-relaxed" style={{ color: T.navySoft }}>Protein marker shows an upward trend across recent screening events. Consider clinical review if persistent.</p>
      </div>

      <div className="rounded-2xl p-6" style={{ background: T.white, border: `1px solid ${T.line}` }}>
        <h3 className="text-[14.5px] font-bold mb-3">Add follow-up note</h3>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Enter clinical notes for this patient…"
          className="w-full rounded-lg p-3 text-[13.5px] outline-none resize-none" style={{ border: `1px solid ${T.line}`, background: T.surface }} />
        <div className="flex flex-wrap gap-3 mt-4">
          <Button size="sm" icon={MessageSquarePlus}>Add follow-up note</Button>
          <Button size="sm" variant="ghost" icon={FileText}>Generate report</Button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   PHC DASHBOARD
   ========================================================================= */
function PHCOverview({ onNav }) {
  const kpis = [
    { label: "Today's screenings", value: PHC_STATS.today, Icon: FlaskConical },
    { label: "Pending follow-ups", value: PHC_STATS.pendingFollowups, Icon: Clock },
    { label: "Tests requiring review", value: PHC_STATS.requiringReview, Icon: AlertTriangle },
    { label: "Community coverage", value: PHC_STATS.coverage, Icon: MapPin },
  ];
  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl p-5" style={{ background: T.white, border: `1px solid ${T.line}` }}>
            <k.Icon size={18} style={{ color: T.blue }} />
            <div className="sc-display text-[26px] font-bold mt-3">{k.value}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: T.navySoft }}>{k.label}</div>
          </div>
        ))}
      </div>
      <button onClick={() => onNav("screening")} className="w-full rounded-2xl p-7 flex items-center justify-between text-left transition-transform active:scale-[0.99]" style={{ background: T.blue, color: T.white }}>
        <div>
          <div className="sc-display text-[19px] font-bold mb-1">Start New Screening</div>
          <div className="text-[13.5px]" style={{ color: "#DCEBF8" }}>Register a beneficiary and begin a guided screening.</div>
        </div>
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: "#ffffff22" }}>
          <Plus size={22} />
        </div>
      </button>
      <PatientTable onOpenPatient={() => onNav("screening")} />
    </div>
  );
}

function PHCScreeningMode({ onDone, onCancel }) {
  const [step, setStep] = useState(0);
  const steps = ["Register", "Collect", "Test", "Scan", "Review", "Refer"];
  const titles = [
    "Register / select beneficiary",
    "Collect sample",
    "Run SureCheck test",
    "Scan strip",
    "Review screening output",
    "Refer if necessary",
  ];
  const [beneficiary, setBeneficiary] = useState("");

  return (
    <div className="max-w-xl mx-auto space-y-7">
      <button onClick={onCancel} className="flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: T.blue }}>
        <ChevronLeft size={15} /> Exit screening
      </button>
      <ProgressStepper steps={steps} current={step} />
      <div className="rounded-2xl p-7" style={{ background: T.white, border: `1px solid ${T.line}` }}>
        <h2 className="sc-display text-[19px] font-bold mb-5">{titles[step]}</h2>

        {step === 0 && (
          <div className="space-y-4">
            <input value={beneficiary} onChange={(e) => setBeneficiary(e.target.value)} placeholder="Beneficiary ID or name"
              className="w-full rounded-xl px-4 py-4 text-[16px] outline-none" style={{ border: `1.5px solid ${T.line}` }} />
            <p className="text-[13px]" style={{ color: T.navySoft }}>Or select a recently registered beneficiary below.</p>
            <div className="grid grid-cols-2 gap-3">
              {PATIENTS.slice(0, 4).map((p) => (
                <button key={p.id} onClick={() => setBeneficiary(p.name)} className="rounded-xl p-4 text-left" style={{ border: `1.5px solid ${beneficiary === p.name ? T.blue : T.line}`, background: beneficiary === p.name ? T.blueTint : T.white }}>
                  <div className="text-[13.5px] font-semibold">{p.name}</div>
                  <div className="text-[11.5px]" style={{ color: T.navySoft }}>{p.age}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <Droplets size={40} style={{ color: T.blue }} />
            <p className="text-[15px] max-w-xs" style={{ color: T.navySoft }}>Guide the beneficiary through a clean, midstream urine sample collection using the kit container.</p>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <Beaker size={40} style={{ color: T.blue }} />
            <p className="text-[15px] max-w-xs" style={{ color: T.navySoft }}>Apply the sample to the SureCheck strip and allow the reaction to develop.</p>
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-col items-center text-center gap-4 py-6">
            <ScanLine size={40} style={{ color: T.blue }} />
            <p className="text-[15px] max-w-xs" style={{ color: T.navySoft }}>Use the tablet or phone camera to scan the strip against the calibration reference.</p>
          </div>
        )}
        {step === 4 && (
          <div className="rounded-xl p-5 text-center" style={{ background: T.greenTint }}>
            <CheckCircle2 size={28} style={{ color: T.green }} className="mx-auto mb-2" />
            <div className="text-[15px] font-bold">No immediate screening concern</div>
            <p className="text-[13px] mt-1" style={{ color: T.navySoft }}>Prototype demonstration data — not a diagnosis.</p>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-4 text-center py-4">
            <p className="text-[15px]" style={{ color: T.navySoft }}>Based on this screening, would you like to flag this beneficiary for clinical follow-up?</p>
            <div className="flex gap-3 justify-center">
              <Button variant="ghost" onClick={onDone}>No follow-up needed</Button>
              <Button variant="secondary" onClick={onDone}>Refer for follow-up</Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-7">
          {step > 0 ? <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)} icon={ChevronLeft}>Back</Button> : <span />}
          {step < 5 && <Button size="lg" onClick={() => setStep((s) => s + 1)} iconRight={ArrowRight} disabled={step === 0 && !beneficiary}>Continue</Button>}
        </div>
      </div>
    </div>
  );
}

function PHCCommunityAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="sc-display text-[22px] font-bold">Community Screening Overview</h2>
        <DemoBadge />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "People screened", value: PHC_STATS.coverage },
          { label: "Screening completion", value: "94%" },
          { label: "Follow-up required", value: "12" },
          { label: "Active screening sites", value: "6" },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-5" style={{ background: T.white, border: `1px solid ${T.line}` }}>
            <div className="sc-display text-[24px] font-bold">{k.value}</div>
            <div className="text-[12.5px] mt-1" style={{ color: T.navySoft }}>{k.label}</div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="rounded-2xl p-6" style={{ background: T.white, border: `1px solid ${T.line}` }}>
          <h3 className="text-[15px] font-bold mb-4">Screenings this week</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PHC_STATS.weekly}>
              <CartesianGrid stroke={T.line} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: T.navySoft }} axisLine={{ stroke: T.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: T.navySoft }} axisLine={false} tickLine={false} />
              <RTooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 13 }} />
              <Bar dataKey="screened" fill={T.blue} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="rounded-2xl p-6" style={{ background: T.white, border: `1px solid ${T.line}` }}>
          <h3 className="text-[15px] font-bold mb-4">Screening signals by category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={PHC_STATS.categories} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid stroke={T.line} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: T.navySoft }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: T.navySoft }} axisLine={false} tickLine={false} width={130} />
              <RTooltip contentStyle={{ borderRadius: 10, border: `1px solid ${T.line}`, fontSize: 13 }} />
              <Bar dataKey="value" fill={T.cyan} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-2xl p-6" style={{ background: T.surface, border: `1px solid ${T.line}` }}>
        <div className="flex items-center gap-2 mb-3"><MapPin size={16} style={{ color: T.blue }} /><h3 className="text-[14.5px] font-bold">Community coverage map</h3></div>
        <div className="rounded-xl h-40 flex items-center justify-center" style={{ background: T.surface2 }}>
          <span className="text-[13px]" style={{ color: T.navySoft }}>Illustrative coverage areas — demonstration dataset, not precise geographic data.</span>
        </div>
      </div>
      <Disclaimer>Demonstration dataset. Figures are synthetic and do not represent real screening activity.</Disclaimer>
    </div>
  );
}

/* =========================================================================
   ROOT APP
   ========================================================================= */
export default function App() {
  const [screen, setScreen] = useState("landing"); // landing | login | app
  const [role, setRole] = useState(null);
  const [view, setView] = useState("overview");
  const [testActive, setTestActive] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [phcMode, setPhcMode] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const goLogin = () => setScreen("login");
  const selectRole = (r) => { setRole(r); setScreen("app"); setView("overview"); setTestActive(false); setPhcMode(false); };
  const logout = () => { setScreen("landing"); setRole(null); };

  const handleNav = (id) => {
    setSelectedPatient(null);
    setPhcMode(false);
    setTestActive(false);
    if (role === "user" && id === "new-test") { setTestActive(true); setView("new-test"); return; }
    setView(id);
  };

  let title = "", subtitle = "";
  if (role === "user") {
    title = { overview: "Overview", "new-test": "New Test", trends: "Trends", profile: "Profile" }[view] || "";
    subtitle = { overview: "Your health screening overview", "new-test": "Guided screening workflow", trends: "Track biomarkers over time", profile: "Manage your account" }[view] || "";
  } else if (role === "doctor") {
    title = selectedPatient ? "Patient Profile" : { overview: "Clinical Dashboard", patients: "Patients", trends: "Trends", profile: "Settings" }[view] || "";
    subtitle = selectedPatient ? "" : { overview: "Screening activity across your patients", patients: "All registered patients", trends: "Aggregate biomarker trends", profile: "Manage your clinical account" }[view] || "";
  } else if (role === "phc") {
    title = phcMode ? "New Screening" : { overview: "PHC Screening Centre", community: "Community Analytics", profile: "Settings" }[view] || "";
    subtitle = phcMode ? "" : { overview: "Today's decentralized screening activity", community: "Aggregate community screening data", profile: "Manage your PHC account" }[view] || "";
  }

  return (
    <div className="sc-root">
      <style>{fontStyle}</style>

      {screen === "landing" && (
        <LandingPage onStart={goLogin} onExplore={() => { const el = document.getElementById("technology"); el && el.scrollIntoView({ behavior: "smooth" }); }} onLogin={goLogin} />
      )}

      {screen === "login" && <LoginPage onSelectRole={selectRole} onBack={() => setScreen("landing")} />}

      {screen === "app" && role === "user" && (
        <AppShell role="user" active={view} onNav={handleNav} onOpenNotifications={() => setShowNotifs(true)} onLogout={logout} title={title} subtitle={subtitle}>
          {view === "overview" && <UserOverview onNav={handleNav} />}
          {view === "new-test" && <NewTestFlow onFinish={() => handleNav("results")} />}
          {view === "results" && <ResultsScreen onNav={handleNav} />}
          {view === "trends" && <TrendsScreen title="Your health trends" />}
          {view === "profile" && <SettingsScreen role="user" onLogout={logout} />}
        </AppShell>
      )}

      {screen === "app" && role === "doctor" && (
        <AppShell role="doctor" active={view} onNav={handleNav} onOpenNotifications={() => setShowNotifs(true)} onLogout={logout} title={title} subtitle={subtitle}>
          {selectedPatient
            ? <DoctorPatientProfile patient={selectedPatient} onBack={() => setSelectedPatient(null)} />
            : <>
                {view === "overview" && <DoctorOverview onOpenPatient={setSelectedPatient} onNav={handleNav} />}
                {view === "patients" && <PatientTable onOpenPatient={setSelectedPatient} />}
                {view === "trends" && <TrendsScreen title="Aggregate patient trends" />}
                {view === "profile" && <SettingsScreen role="doctor" onLogout={logout} />}
              </>
          }
        </AppShell>
      )}

      {screen === "app" && role === "phc" && (
        <AppShell role="phc" active={view} onNav={handleNav} onOpenNotifications={() => setShowNotifs(true)} onLogout={logout} title={title} subtitle={subtitle}>
          {phcMode
            ? <PHCScreeningMode onDone={() => setPhcMode(false)} onCancel={() => setPhcMode(false)} />
            : <>
                {view === "overview" && <PHCOverview onNav={(id) => (id === "screening" ? setPhcMode(true) : handleNav(id))} />}
                {view === "screening" && <PHCScreeningMode onDone={() => handleNav("overview")} onCancel={() => handleNav("overview")} />}
                {view === "community" && <PHCCommunityAnalytics />}
                {view === "profile" && <SettingsScreen role="phc" onLogout={logout} />}
              </>
          }
        </AppShell>
      )}

      {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
    </div>
  );
}
