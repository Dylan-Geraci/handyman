import { useState } from "react";

function scoreColor(score) {
  if (score >= 80) return { bg: "#2b8f8a", text: "white", label: "Excellent" };
  if (score >= 65) return { bg: "#8f3737", text: "white", label: "Strong" };
  if (score >= 50) return { bg: "#d4a373", text: "white", label: "Good" };
  return { bg: "#9ca3af", text: "white", label: "Fair" };
}

function formatPostedAgo(minutes) {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const FACTOR_LABELS = {
  category_match: { name: "Category match", max: 20 },
  semantic_match: { name: "AI skill match", max: 30 },
  distance: { name: "Distance", max: 25 },
  recency: { name: "Recency", max: 15 },
  difficulty_match: { name: "Difficulty fit", max: 10 },
  historical_success: { name: "Past success", max: 10 },
  competition: { name: "Low competition", max: 5 },
};

export default function RecommendedTaskCard({ rec, onAccept }) {
  const [expanded, setExpanded] = useState(false);
  const task = rec.task || rec;
  const score = rec.match_score ?? 0;
  const breakdown = rec.match_breakdown || {};
  const reasons = rec.match_reasons || [];
  const distance = rec.distance_miles;
  const postedAgo = formatPostedAgo(rec.posted_minutes_ago);
  const color = scoreColor(score);

  return (
    <div className="rounded-[1.5rem] border border-[#e7dfd7] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 pr-2">
          <div className="mb-2 flex items-center gap-2 flex-wrap">
            {task.category_populated?.name && (
              <span className="inline-flex rounded-full bg-[#f1ebe6] px-3 py-1 text-[11px] font-medium text-[#7b2e2f]">
                {task.category_populated.name}
              </span>
            )}
            {postedAgo && (
              <span className="text-xs text-slate-500">Posted {postedAgo}</span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-3">
            {task.description}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>
              <span className="font-medium">Location:</span>{" "}
              {task.location || "Not specified"}
            </span>
            {distance != null && distance > 0 && (
              <span>
                <span className="font-medium">Distance:</span>{" "}
                {distance.toFixed(1)} mi
              </span>
            )}
            {task.budget_range && (
              <span>
                <span className="font-medium">Budget:</span> {task.budget_range}
              </span>
            )}
          </div>
        </div>

        {/* Score badge */}
        <div className="flex flex-col items-center sm:items-end gap-2 shrink-0">
          <div
            className="flex h-20 w-20 flex-col items-center justify-center rounded-full text-center shadow-md"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            <div className="text-2xl font-bold leading-none">
              {Math.round(score)}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider opacity-90">
              match
            </div>
          </div>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
            style={{ backgroundColor: color.bg, color: color.text }}
          >
            {color.label}
          </span>
        </div>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="mt-5 space-y-1.5">
          {reasons.map((reason, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm text-slate-700"
            >
              <span className="mt-0.5 text-[#2b8f8a]">✓</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Breakdown toggle */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="mt-4 text-xs font-medium text-[#8f3737] transition hover:underline"
      >
        {expanded ? "Hide" : "Show"} match breakdown
      </button>

      {expanded && (
        <div className="mt-3 grid gap-2 rounded-2xl border border-[#e7dfd7] bg-[#fbf8f5] p-4 sm:grid-cols-2">
          {Object.entries(FACTOR_LABELS).map(([key, meta]) => {
            const value = breakdown[key] ?? 0;
            const pct = Math.min(100, (value / meta.max) * 100);
            return (
              <div key={key} className="text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>{meta.name}</span>
                  <span className="font-mono text-slate-500">
                    {value.toFixed(1)} / {meta.max}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#ece6df]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 70 ? "#2b8f8a" : "#8f3737",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-wrap items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => onAccept?.(task)}
          className="rounded-full bg-[#8f3737] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#742c2c]"
        >
          Accept Task
        </button>
      </div>
    </div>
  );
}
