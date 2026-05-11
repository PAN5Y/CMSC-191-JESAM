/**
 * JESAM Analytics Dashboard
 * ─────────────────────────────────────────────────────────────
 * Requires in .env.local:
 *   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 *
 * Requires in index.html <head>:
 *   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
 *   <script>
 *     window.dataLayer = window.dataLayer || [];
 *     function gtag(){dataLayer.push(arguments);}
 *     gtag('js', new Date());
 *     gtag('config', 'G-XXXXXXXXXX');
 *   </script>
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";
import { useSubmissions } from "@/modules/submission/hooks/useSubmissions";
import type { Manuscript, JournalClassification } from "@/types";

// ─── GA4 ─────────────────────────────────────────────────────
declare global {
  interface Window {
    gtag?: (command: "config" | "event" | "js", targetId: string | Date, config?: Record<string, unknown>) => void;
    dataLayer?: unknown[];
  }
}
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
function gaEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window.gtag === "function" && GA_ID) {
    window.gtag("event", name, { ...params, send_to: GA_ID });
  }
}

// ─── Brand colour (sidebar / active states) ───────────────────
const BRAND = "#3f4b7e";

// ─── Focus colours ────────────────────────────────────────────
const FOCUS_COLORS: Record<JournalClassification, string> = {
  Land:   "#4ade80",
  Water:  "#38bdf8",
  Air:    "#818cf8",
  People: "#fb923c",
};

const STATUS_COLORS: Record<string, string> = {
  "Pending Format Verification": "#94a3b8",
  "Editor In Chief Screening":   "#fbbf24",
  "Peer Review":                 "#38bdf8",
  "Revision Requested":          "#fb923c",
  "Returned to Author":          "#f472b6",
  "Rejected":                    "#f87171",
  "Accepted":                    "#34d399",
  "In Production":               "#818cf8",
  "Published":                   "#4ade80",
  "Return to Revision":          "#fcd34d",
  "Retracted":                   "#e11d48",
};

type TimeRange = "all" | "30d" | "90d" | "1y";

// ─── Utilities ───────────────────────────────────────────────
function pct(part: number, whole: number) {
  if (!whole) return 0;
  return Math.round((part / whole) * 100);
}

function filterByTimeRange(manuscripts: Manuscript[], range: TimeRange): Manuscript[] {
  if (range === "all") return manuscripts;
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const cutoff = Date.now() - days * 86_400_000;
  return manuscripts.filter((m) => new Date(m.created_at).getTime() >= cutoff);
}

function groupByMonth(manuscripts: Manuscript[]) {
  const map: Record<string, number> = {};
  manuscripts.forEach((m) => {
    const d = new Date(m.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map[key] = (map[key] ?? 0) + 1;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, count]) => ({ month: k.slice(5) + "/" + k.slice(0, 4), count }));
}

function topAffiliations(manuscripts: Manuscript[], topN = 8) {
  const map: Record<string, number> = {};
  manuscripts.forEach((m) => {
    (m.submission_metadata?.author_details ?? []).forEach((a) => {
      const aff = (a.affiliation ?? "").trim();
      if (aff) map[aff] = (map[aff] ?? 0) + 1;
    });
  });
  return Object.entries(map)
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([name, count]) => ({
      name: name.length > 32 ? name.slice(0, 30) + "…" : name,
      count,
    }));
}

function authorCountDist(manuscripts: Manuscript[]) {
  const buckets: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5+": 0 };
  manuscripts.forEach((m) => {
    const key = m.authors.length >= 5 ? "5+" : String(m.authors.length);
    buckets[key] = (buckets[key] ?? 0) + 1;
  });
  return Object.entries(buckets).map(([label, count]) => ({ label, count }));
}

function workflowFunnel(manuscripts: Manuscript[]) {
  return [
    { stage: "Submitted",   statuses: ["Pending Format Verification", "Editor In Chief Screening"] },
    { stage: "Peer Review", statuses: ["Peer Review", "Revision Requested", "Returned to Author"] },
    { stage: "Accepted",    statuses: ["Accepted", "In Production"] },
    { stage: "Published",   statuses: ["Published"] },
  ].map(({ stage, statuses }) => ({
    stage,
    count: manuscripts.filter((m) => statuses.includes(m.status)).length,
  }));
}

function focusRadarData(manuscripts: Manuscript[]) {
  return (["Land", "Water", "Air", "People"] as JournalClassification[]).map((focus) => ({
    focus,
    Published:     manuscripts.filter((m) => m.classification === focus && m.status === "Published").length,
    "Peer Review": manuscripts.filter((m) => m.classification === focus && m.status === "Peer Review").length,
    Accepted:      manuscripts.filter((m) => m.classification === focus && m.status === "Accepted").length,
  }));
}

// ─── Shared chart tooltip ─────────────────────────────────────
const TOOLTIP_STYLE = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  color: "#111827",
  fontSize: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
};

// ─── Sub-components ───────────────────────────────────────────

/** Section label — matches peer-review's h2 pattern */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">
      {children}
    </h2>
  );
}

/** White card — matches peer-review's card pattern exactly */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/** Card heading — matches peer-review's h3 pattern */
function CardHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-gray-900 mb-1">{children}</h3>
  );
}

/** Card sub-label — matches peer-review's h4 / label pattern */
function CardSubLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
      {children}
    </p>
  );
}

/**
 * KPI card — accent dot sits on the same line as the label,
 * with the large value below.
 */
function KpiCard({
  label, value, sub, accentColor,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accentColor?: string;
}) {
  return (
    <Card className="p-4">
      {/* Label row: accent dot + text side-by-side */}
      <div className="flex items-center gap-2 mb-1">
        <span
          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: accentColor ?? BRAND }}
        />
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      {/* Value */}
      <p className="text-3xl font-bold text-gray-900 leading-none pl-4">{value}</p>
      {sub && (
        <p className="text-xs text-gray-400 mt-1.5 pl-4">{sub}</p>
      )}
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const { manuscripts, fetchManuscripts } = useSubmissions();
  const [timeRange, setTimeRange] = useState<TimeRange>("all");

  useEffect(() => {
    if (typeof window.gtag === "function" && GA_ID) {
      window.gtag("config", GA_ID, { page_path: "/analytics" });
    }
    gaEvent("page_view", { page_title: "Analytics Dashboard", page_location: window.location.href });
  }, []);

  useEffect(() => { void fetchManuscripts(); }, [fetchManuscripts]);

  const handleRange = useCallback((r: TimeRange) => {
    setTimeRange(r);
    gaEvent("filter_time_range", { range: r });
  }, []);

  const ms = useMemo(() => filterByTimeRange(manuscripts, timeRange), [manuscripts, timeRange]);

  // KPIs
  const total     = ms.length;
  const published = ms.filter((m) => m.status === "Published").length;
  const inReview  = ms.filter((m) => m.status === "Peer Review").length;
  const accepted  = ms.filter((m) => m.status === "Accepted").length;
  const rejected  = ms.filter((m) => m.status === "Rejected").length;
  const retracted = ms.filter((m) => m.status === "Retracted").length;

  const impact = useMemo(() => ms.reduce(
    (acc, m) => {
      acc.views     += m.metrics?.views     ?? 0;
      acc.downloads += m.metrics?.downloads ?? 0;
      acc.citations += m.metrics?.citations ?? 0;
      return acc;
    },
    { views: 0, downloads: 0, citations: 0 }
  ), [ms]);

  const focusData = useMemo(() =>
    (["Land", "Water", "Air", "People"] as JournalClassification[]).map((f) => ({
      name: f, value: ms.filter((m) => m.classification === f).length, color: FOCUS_COLORS[f],
    })), [ms]);

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    ms.forEach((m) => { map[m.status] = (map[m.status] ?? 0) + 1; });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value, color: STATUS_COLORS[name] ?? "#94a3b8" }));
  }, [ms]);

  const timelineData = useMemo(() => groupByMonth(manuscripts), [manuscripts]);
  const affiliations = useMemo(() => topAffiliations(ms), [ms]);
  const authorCounts = useMemo(() => authorCountDist(ms), [ms]);
  const funnelData   = useMemo(() => workflowFunnel(ms), [ms]);
  const radarData    = useMemo(() => focusRadarData(ms), [ms]);

  const ranges: { label: string; value: TimeRange }[] = [
    { label: "All time", value: "all" },
    { label: "Last 30d", value: "30d" },
    { label: "Last 90d", value: "90d" },
    { label: "Last year", value: "1y" },
  ];

  const funnelColors = [BRAND, "#38bdf8", "#34d399", "#4ade80"];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header — mirrors PeerReviewDashboard exactly ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-2 max-w-3xl leading-relaxed">
                Operational throughput, demographic analysis, and journal focus distribution
                across all manuscripts.
              </p>
            </div>

            {/* Time-range filter */}
            <div className="flex items-center gap-2 flex-shrink-0 pt-1">
              {ranges.map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleRange(r.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    timeRange === r.value
                      ? "text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                  style={timeRange === r.value ? { backgroundColor: BRAND, borderColor: BRAND } : undefined}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Overview KPIs ── */}
        <section>
          <SectionLabel>Overview</SectionLabel>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard label="Total"       value={total}                                              accentColor="#94a3b8" />
            <KpiCard label="Published"   value={published}  sub={`${pct(published, total)}% of total`}  accentColor="#4ade80" />
            <KpiCard label="Peer Review" value={inReview}                                           accentColor="#38bdf8" />
            <KpiCard label="Accepted"    value={accepted}                                           accentColor="#34d399" />
            <KpiCard label="Rejected"    value={rejected}   sub={`${pct(rejected, total)}% of total`}   accentColor="#f87171" />
            <KpiCard label="Retracted"   value={retracted}                                          accentColor="#e11d48" />
          </div>
        </section>

        {/* ── Publication Impact ── */}
        <section>
          <SectionLabel>Publication Impact</SectionLabel>
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Total Views"  value={impact.views.toLocaleString()}     accentColor={BRAND} />
            <KpiCard label="Downloads"    value={impact.downloads.toLocaleString()} accentColor={BRAND} />
            <KpiCard label="Citations"    value={impact.citations.toLocaleString()} accentColor="#F5C344" />
          </div>
        </section>

        {/* ── Journal Focus Analysis ── */}
        <section>
          <SectionLabel>Journal Focus Analysis — Land · Water · Air · People</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Donut */}
            <Card className="p-4">
              <CardHeading>Focus Distribution</CardHeading>
              <CardSubLabel>Share of manuscripts by SESAM focus area</CardSubLabel>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={focusData}
                    cx="50%" cy="50%"
                    innerRadius={52} outerRadius={84}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {focusData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {focusData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-gray-600">
                      {d.name} <span className="text-gray-400">({d.value})</span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Bar by focus */}
            <Card className="p-4">
              <CardHeading>Manuscripts by Focus Area</CardHeading>
              <CardSubLabel>Raw count per journal theme</CardSubLabel>
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={focusData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {focusData.map((d) => <Cell key={d.name} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Focus x Status grouped bar */}
            <Card className="p-4">
              <CardHeading>Focus × Status Breakdown</CardHeading>
              <CardSubLabel>Manuscripts per focus area, split by workflow stage</CardSubLabel>

              <div className="flex items-center gap-4 mb-3">
                {[
                  { label: "Published",   color: "#4ade80" },
                  { label: "Peer Review", color: "#38bdf8" },
                  { label: "Accepted",    color: "#34d399" },
                ].map(({ label, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-[11px] text-gray-500">{label}</span>
                  </div>
                ))}
              </div>

              <ResponsiveContainer width="100%" height={195}>
                <BarChart
                  data={radarData}
                  margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  barCategoryGap="28%"
                  barGap={3}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                  <XAxis dataKey="focus" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="Published"   fill="#4ade80" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Peer Review" fill="#38bdf8" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Accepted"    fill="#34d399" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </section>

        {/* ── Demographic Analysis ── */}
        <section>
          <SectionLabel>Demographic Analysis</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card className="p-4">
              <CardHeading>Top Author Affiliations</CardHeading>
              <CardSubLabel>Institutions contributing the most authors across submissions</CardSubLabel>
              {affiliations.length === 0 ? (
                <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg p-4 bg-white/80">
                  No affiliation data found. Ensure author details are captured on submission.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={affiliations} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fill: "#6b7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f9fafb" }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} fill={BRAND} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-4">
              <CardHeading>Authors per Manuscript</CardHeading>
              <CardSubLabel>Co-authorship distribution across submitted works</CardSubLabel>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={authorCounts} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "#f9fafb" }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#F5C344" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </section>

        {/* ── Submission Timeline ── */}
        <section>
          <SectionLabel>Submission Timeline</SectionLabel>
          <Card className="p-4">
            <CardHeading>Monthly Submission Volume</CardHeading>
            <CardSubLabel>Full corpus — not filtered by selected time range</CardSubLabel>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timelineData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="jesam-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={BRAND} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="count" stroke={BRAND} strokeWidth={2} fill="url(#jesam-area)" dot={{ r: 3, fill: BRAND }} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </section>

        {/* ── Workflow & Pipeline ── */}
        <section>
          <SectionLabel>Workflow & Pipeline</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <Card className="p-4">
              <CardHeading>Manuscripts by Status</CardHeading>
              <CardSubLabel>All workflow stages with share of total</CardSubLabel>
              <div className="space-y-3">
                {statusData.map(({ name, value, color }) => (
                  <div key={name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-700">{name}</span>
                      <span className="text-gray-400">
                        {value} <span className="text-gray-300">({pct(value, total)}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${pct(value, total)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <CardHeading>Submission Funnel</CardHeading>
              <CardSubLabel>Aggregated pipeline from submission to publication</CardSubLabel>
              <div className="space-y-4 mt-2">
                {funnelData.map(({ stage, count }, i) => {
                  const maxCount = Math.max(...funnelData.map((d) => d.count), 1);
                  const color = funnelColors[i] ?? BRAND;
                  return (
                    <div key={stage} className="flex items-center gap-3">
                      <span className="text-xs font-semibold w-24 shrink-0 text-right text-gray-600">
                        {stage}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="h-6 rounded-full flex items-center justify-end pr-3 transition-all duration-700"
                          style={{ width: `${(count / maxCount) * 100}%`, backgroundColor: color, opacity: 0.85 }}
                        >
                          <span className="text-white text-xs font-semibold">{count}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Manuscripts may appear in multiple stages across their lifecycle.
              </p>
            </Card>
          </div>
        </section>

        {/* ── GA notice ── */}
        {!GA_ID && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-700">
            <strong>Google Analytics not connected.</strong>{" "}
            Add{" "}
            <code className="bg-amber-100 px-1 rounded font-mono">VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX</code>{" "}
            to <code className="bg-amber-100 px-1 rounded font-mono">.env.local</code> and include the
            gtag snippet in <code className="bg-amber-100 px-1 rounded font-mono">index.html</code>.
          </div>
        )}

      </div>
    </div>
  );
}
