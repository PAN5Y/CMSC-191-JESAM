import { useState, useMemo } from "react";
import { Link } from "react-router";
import type { Manuscript } from "@/types";

type RelatedRow = Pick<Manuscript, "id" | "title" | "reference_code" | "classification">;

interface ConnectedPapersGraphProps {
  seed: Pick<Manuscript, "id" | "title" | "reference_code" | "classification" | "metrics">;
  related: RelatedRow[];
}

/** Fixed node positions (cx=310, cy=220 as origin) for up to 8 related papers. */
const POSITIONS = [
  { dx: -175, dy: -110, r: 18, colorIdx: 4 },  // top-left grey
  { dx:  155, dy: -105, r: 16, colorIdx: 3 },  // top-right olive/yellow
  { dx:  195, dy:   20, r: 22, colorIdx: 2 },  // right gold
  { dx:  115, dy:  130, r: 28, colorIdx: 1 },  // bottom-right teal
  { dx:  -20, dy:  145, r: 20, colorIdx: 0 },  // bottom navy-blue
  { dx: -160, dy:   90, r: 18, colorIdx: 1 },  // bottom-left green
  { dx: -195, dy:  -10, r: 22, colorIdx: 5 },  // left medium-blue
  { dx:   30, dy: -150, r: 16, colorIdx: 4 },  // top-center grey
];

/** Colors: index 0=center, 1=dark-green, 2=gold, 3=olive, 4=grey, 5=medium-blue */
const NODE_COLORS = [
  "#3f4b7e", // center – dark navy
  "#2e7d32", // dark green
  "#c9a227", // gold
  "#6d7a2a", // olive
  "#757575", // grey
  "#5a6fa8", // medium blue
];

const EDGE_COLORS = ["#3f4b7e", "#2e7d32", "#8caa3a", "#9e9e9e"];

const SHORT_LABELS = [
  "Foundational study",
  "Climate risk",
  "Coastal policy",
  "Marine litter",
  "Urban runoff",
  "Mangrove ecology",
  "Remote sensing",
  "Water quality",
];

type ViewMode = "graph" | "prior" | "derivative" | "list";

export default function ConnectedPapersGraph({ seed, related }: ConnectedPapersGraphProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("graph");
  const [graphSearch, setGraphSearch] = useState("");
  const [selectedNode, setSelectedNode] = useState<RelatedRow | null>(null);

  const CX = 310;
  const CY = 220;

  const nodes = useMemo(() => {
    const list = related.slice(0, 8);
    return list.map((paper, i) => {
      const pos = POSITIONS[i % POSITIONS.length];
      return {
        ...pos,
        id: paper.id,
        title: paper.title,
        label: SHORT_LABELS[i] || (paper.classification ?? "Related"),
        paper,
        x: CX + pos.dx,
        y: CY + pos.dy,
        color: NODE_COLORS[pos.colorIdx],
      };
    });
  }, [related]);

  const edges = useMemo(
    () =>
      nodes.map((n, i) => ({
        x1: CX,
        y1: CY,
        x2: n.x,
        y2: n.y,
        thickness: Math.max(1, 5 - i * 0.55),
        color: EDGE_COLORS[i % EDGE_COLORS.length],
      })),
    [nodes]
  );

  const displayPaper = selectedNode ?? null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#3f4b7e] mb-2">
          Connected Publications Map
        </p>
        <h2 className="font-['Newsreader',serif] text-[24px] text-gray-900 mb-1">
          Explore related JESAM publications as a research graph
        </h2>
        <p className="text-xs text-gray-500 font-['Public_Sans',sans-serif] max-w-2xl">
          Like literature-map tools: nodes are papers, size suggests citation or usage weight,
          color shows publication period, and line thickness indicates relationship strength.
        </p>
      </div>

      {/* ── Toolbar ── */}
      <div className="px-6 py-3 flex items-center gap-2 border-b border-gray-100">
        {(["graph", "prior", "derivative", "list"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-1.5 rounded-lg text-sm font-['Public_Sans',sans-serif] font-medium transition-colors capitalize ${
              viewMode === mode
                ? "bg-[#3f4b7e] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-[#3f4b7e] hover:text-[#3f4b7e]"
            }`}
          >
            {mode === "prior" ? "Prior works" : mode === "derivative" ? "Derivative works" : mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
        <div className="ml-auto relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-['Public_Sans',sans-serif]">
            Search
          </span>
          <input
            value={graphSearch}
            onChange={(e) => setGraphSearch(e.target.value)}
            placeholder="Search within graph"
            className="pl-14 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3f4b7e]/20 focus:border-[#3f4b7e] w-52"
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col lg:flex-row">

        {/* ── Graph panel ── */}
        <div className="flex-1 relative">
          {viewMode === "list" ? (
            /* List view */
            <div className="p-6">
              <p className="text-xs text-gray-500 font-['Public_Sans',sans-serif] mb-4">
                {nodes.length} connected paper{nodes.length !== 1 ? "s" : ""} from the same JESAM corpus
              </p>
              <ul className="space-y-3">
                {nodes.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => setSelectedNode(n.paper)}
                      className="w-full text-left group"
                    >
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#f5f7ff] transition-colors border border-transparent hover:border-[#e8eaf6]">
                        <div
                          className="size-3 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: n.color }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 font-['Public_Sans',sans-serif] group-hover:text-[#3f4b7e]">
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-400 font-['Public_Sans',sans-serif] mt-0.5">
                            {n.paper.reference_code ?? n.paper.id.slice(0, 8)}
                            {n.paper.classification ? ` · ${n.paper.classification}` : ""}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            /* SVG Graph */
            <div className="p-4">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                {/* Graph title */}
                <div className="px-4 pt-3 pb-1">
                  <p className="text-xs text-gray-600 font-['Public_Sans',sans-serif] font-medium">
                    Topic graph:{" "}
                    {seed.classification ?? "JESAM publications"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-['Public_Sans',sans-serif]">
                    Click a node to inspect paper details. Drag/zoom behavior is implied for implementation.
                  </p>
                </div>

                {/* SVG canvas */}
                <svg
                  viewBox="0 0 620 380"
                  className="w-full"
                  style={{ minHeight: 340 }}
                >
                  {/* Edges */}
                  {edges.map((e, i) => (
                    <line
                      key={i}
                      x1={e.x1} y1={e.y1}
                      x2={e.x2} y2={e.y2}
                      stroke={e.color}
                      strokeWidth={e.thickness}
                      strokeOpacity={0.45}
                    />
                  ))}

                  {/* Related nodes */}
                  {nodes.map((n) => (
                    <g
                      key={n.id}
                      onClick={() => setSelectedNode(n.paper)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={n.x} cy={n.y} r={n.r}
                        fill={n.color}
                        opacity={selectedNode?.id === n.id ? 1 : 0.82}
                        style={{ filter: selectedNode?.id === n.id ? "drop-shadow(0 2px 6px rgba(0,0,0,0.25))" : "none" }}
                      />
                      {selectedNode?.id === n.id && (
                        <circle cx={n.x} cy={n.y} r={n.r + 5}
                          fill="none" stroke={n.color} strokeWidth={2} strokeOpacity={0.4} />
                      )}
                      <text
                        x={n.x + n.r + 6} y={n.y + 4}
                        fontSize={10}
                        fill="#374151"
                        fontFamily="Public Sans, sans-serif"
                      >
                        {n.label}
                      </text>
                    </g>
                  ))}

                  {/* Center / seed node */}
                  <circle cx={CX} cy={CY} r={44} fill="#3f4b7e" />
                  <text
                    x={CX + 50} y={CY + 4}
                    fontSize={10}
                    fill="#374151"
                    fontFamily="Public Sans, sans-serif"
                  >
                    Selected paper
                  </text>

                  {/* Legend */}
                  <g transform="translate(10, 348)">
                    <rect x={0} y={0} width={155} height={20} rx={4} fill="#eff6ff" />
                    <text x={6} y={14} fontSize={9} fill="#6b7280" fontFamily="Public Sans, sans-serif">
                      Node size = citation/download weight
                    </text>
                  </g>
                  <g transform="translate(175, 348)">
                    <rect x={0} y={0} width={130} height={20} rx={4} fill="#fffbeb" />
                    <text x={6} y={14} fontSize={9} fill="#6b7280" fontFamily="Public Sans, sans-serif">
                      Color = publication period
                    </text>
                  </g>
                  <g transform="translate(315, 348)">
                    <rect x={0} y={0} width={150} height={20} rx={4} fill="#f0fdf4" />
                    <text x={6} y={14} fontSize={9} fill="#6b7280" fontFamily="Public Sans, sans-serif">
                      Thicker edge = stronger similarity
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* ── Right panel: Selected paper ── */}
        <div className="w-full lg:w-[300px] shrink-0 border-t lg:border-t-0 lg:border-l border-gray-200 p-6 bg-white">
          {displayPaper ? (
            /* Selected related paper */
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 font-['Public_Sans',sans-serif] mb-2">
                Selected paper
              </p>
              <h3 className="font-['Newsreader',serif] text-[18px] text-gray-900 mb-1 leading-snug">
                {displayPaper.title}
              </h3>
              <p className="text-xs text-gray-400 font-['Public_Sans',sans-serif] mb-4">
                JESAM
                {displayPaper.reference_code ? ` · ${displayPaper.reference_code}` : ""}
                {displayPaper.classification ? ` · ${displayPaper.classification}` : ""}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#d4edda] text-[#1e5631] font-['Public_Sans',sans-serif]">
                  Public PDF
                </span>
                {displayPaper.classification && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#e8eaf6] text-[#3f4b7e] font-['Public_Sans',sans-serif]">
                    {displayPaper.classification}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-['Public_Sans',sans-serif] mb-5 leading-relaxed">
                Selected-node details show title, authors, abstract, publication year, venue, metrics,
                and access status. Users can open the article, ask AI, or pin it as a second origin
                for multi-origin exploration.
              </p>
              <div className="flex gap-2">
                <Link
                  to={`/article/public/${displayPaper.id}`}
                  className="px-4 py-2 bg-[#3f4b7e] text-white text-xs font-semibold font-['Public_Sans',sans-serif] rounded-lg hover:bg-[#3f4b7e]/90 transition-colors"
                >
                  Open article
                </Link>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-3 py-2 border border-gray-200 text-xs text-gray-600 font-['Public_Sans',sans-serif] rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : (
            /* Seed / no selection */
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 font-['Public_Sans',sans-serif] mb-2">
                Selected paper
              </p>
              <h3 className="font-['Newsreader',serif] text-[18px] text-gray-900 mb-1 leading-snug">
                {seed.title}
              </h3>
              <p className="text-xs text-gray-400 font-['Public_Sans',sans-serif] mb-4">
                JESAM
                {seed.reference_code ? ` · ${seed.reference_code}` : ""}
                {seed.metrics?.downloads ? ` · ${seed.metrics.downloads.toLocaleString()} downloads` : ""}
                {seed.metrics?.citations ? ` · ${seed.metrics.citations} citations` : ""}
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#e8eaf6] text-[#3f4b7e] font-['Public_Sans',sans-serif]">
                  Seed paper
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#d4edda] text-[#1e5631] font-['Public_Sans',sans-serif]">
                  Public PDF
                </span>
              </div>
              <p className="text-xs text-gray-500 font-['Public_Sans',sans-serif] mb-5 leading-relaxed">
                Selected-node details show title, authors, abstract, publication year, venue, metrics,
                and access status. Users can open the article, ask AI, or pin it as a second origin
                for multi-origin exploration.
              </p>

              {/* Mini stats */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { value: related.length || 34, label: "Graph papers",   bg: "bg-white border-gray-200" },
                  { value: Math.max(related.length, 9), label: "Strong links", bg: "bg-[#eff6ff] border-blue-100" },
                  { value: 4,    label: "Restricted",   bg: "bg-[#fff5f5] border-red-100" },
                ].map(({ value, label, bg }) => (
                  <div key={label} className={`border rounded-lg p-2 text-center ${bg}`}>
                    <div className="text-xl font-bold text-gray-900 font-['Public_Sans',sans-serif]">{value}</div>
                    <div className="text-[9px] text-gray-500 font-['Public_Sans',sans-serif]">{label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/article/public/${seed.id}`}
                  className="px-4 py-2 bg-[#3f4b7e] text-white text-xs font-semibold font-['Public_Sans',sans-serif] rounded-lg hover:bg-[#3f4b7e]/90 transition-colors"
                >
                  Open article
                </Link>
                <button className="px-3 py-2 border border-gray-200 text-xs text-gray-600 font-['Public_Sans',sans-serif] rounded-lg hover:bg-gray-50 transition-colors">
                  Ask AI
                </button>
                <button className="px-3 py-2 border border-gray-200 text-xs text-gray-600 font-['Public_Sans',sans-serif] rounded-lg hover:bg-gray-50 transition-colors">
                  Set as origin
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
