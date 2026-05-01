import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getTaskRecommendations, acceptTask } from "../api/endpoints";
import RecommendedTaskCard from "../components/RecommendedTaskCard";

export default function RecommendedTasksPage() {
  const { token } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [limit, setLimit] = useState(10);
  const [minScore, setMinScore] = useState(50);
  const [radius, setRadius] = useState(25);
  const [includeReasons, setIncludeReasons] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getTaskRecommendations(token, {
        limit,
        min_score: minScore,
        location_radius: radius,
        include_reasons: includeReasons,
      });
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.recommendations)
        ? data.recommendations
        : [];
      setTasks(list);
    } catch (e) {
      setError(e?.message || "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, limit, minScore, radius, includeReasons]);

  const handleAccept = async (task) => {
    if (!token) return;
    const taskId = task.id || task._id;
    if (!taskId) return;

    setAcceptingId(taskId);
    setError("");

    try {
      await acceptTask(token, taskId);
      setTasks((prev) =>
        prev.filter((r) => {
          const t = r.task || r;
          return (t.id || t._id) !== taskId;
        })
      );
    } catch (e) {
      setError(e?.message || "Failed to accept task.");
    } finally {
      setAcceptingId(null);
    }
  };

  if (!token) {
    return <div className="max-w-3xl mx-auto p-4">Log in as a tasker to view recommendations.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Recommended Tasks</h1>
          <p className="text-sm text-slate-600">
            Ranked matches based on your categories, location, and performance.
          </p>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <label className="text-sm">
            Limit
            <input
              type="number"
              min={1}
              max={50}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="ml-2 w-20 rounded border px-2 py-1"
            />
          </label>

          <label className="text-sm">
            Min score
            <input
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="ml-2 w-20 rounded border px-2 py-1"
            />
          </label>

          <label className="text-sm">
            Radius (mi)
            <input
              type="number"
              min={1}
              max={200}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="ml-2 w-24 rounded border px-2 py-1"
            />
          </label>

          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeReasons}
              onChange={(e) => setIncludeReasons(e.target.checked)}
            />
            Reasons
          </label>

          <button
            onClick={load}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50"
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-600">Loading recommendations…</div>
      ) : tasks.length === 0 ? (
        <div className="text-sm text-slate-600">
          No recommendations found. Try lowering min score or increasing radius.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((rec) => {
            const task = rec.task || rec;
            const taskId = task.id || task._id;
            const isAccepting = acceptingId === taskId;

            return (
              <div key={taskId} className={isAccepting ? "opacity-70 pointer-events-none" : ""}>
                <RecommendedTaskCard rec={rec} onAccept={handleAccept} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
