import { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import LeaveReview from "./LeaveReview";

const DEMO_TASK_PRESET = {
  title: "Mount a 65\" TV in living room",
  description:
    "Need help wall-mounting a Samsung 65\" QLED TV above the fireplace. Mounting bracket and TV are already on-site. Wall is drywall over wood studs. Should take 1-2 hours. Looking for someone who can come this week.",
  location: "Brooklyn, NY",
};

function ClientDashboard() {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();
  const fromCategory = location.state?.fromCategory || null;
  const [searchParams] = useSearchParams();
  const isDemoPrefill = searchParams.get("demo") === "1";

  const [myTasks, setMyTasks] = useState([]);
  const [taskData, setTaskData] = useState(() =>
    isDemoPrefill ? { ...DEMO_TASK_PRESET } : { title: "", description: "", location: "" }
  );
  const [message, setMessage] = useState("");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState(null);

  const fetchMyTasks = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/my-client-tasks");
      setMyTasks(response.data || []);
    } catch (error) {
      console.error("Error fetching my tasks:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyTasks();
    }
  }, [token]);

  useEffect(() => {
    if (fromCategory) {
      setTaskData((prev) => ({
        ...prev,
        title: fromCategory.taskName,
        description:
          prev.description ||
          fromCategory.taskShortDescription ||
          prev.description,
      }));
    }
  }, [fromCategory]);

  const handleChange = (e) =>
    setTaskData({ ...taskData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await axios.post("http://localhost:8000/api/tasks", taskData);
      setMessage("Task posted successfully!");
      setTaskData({ title: "", description: "", location: "" });
      fetchMyTasks();
    } catch (error) {
      setMessage(error.response?.data?.detail || "Failed to post task.");
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.put(`http://localhost:8000/api/tasks/${taskId}/complete`);
      fetchMyTasks();
    } catch (error) {
      console.error("Error completing task:", error);
      alert("Failed to mark task as complete.");
    }
  };

  const openReviewModal = (task) => {
    setSelectedTaskForReview(task);
    setIsReviewModalOpen(true);
  };

  const closeReviewModal = () => {
    setSelectedTaskForReview(null);
    setIsReviewModalOpen(false);
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "open":
        return "bg-[#f4f0ec] text-slate-700 border border-[#e7dfd7]";
      case "in_progress":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      default:
        return "bg-[#f4f0ec] text-slate-700 border border-[#e7dfd7]";
    }
  };

  const stats = useMemo(() => {
    const open = myTasks.filter((task) => task.status === "open").length;
    const inProgress = myTasks.filter((task) => task.status === "in_progress").length;
    const completed = myTasks.filter((task) => task.status === "completed").length;

    return {
      total: myTasks.length,
      open,
      inProgress,
      completed,
    };
  }, [myTasks]);

  return (
    <div className="min-h-[80vh] bg-[#f5f3f1] px-6 py-10">
      {isReviewModalOpen && selectedTaskForReview && (
        <LeaveReview
          task={selectedTaskForReview}
          onClose={closeReviewModal}
          onReviewSubmitted={fetchMyTasks}
        />
      )}

      <div className="mx-auto w-full max-w-[1380px]">
        {/* Top intro */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f3737]">
              Client Dashboard
            </p>
            <h1 className="mt-3 font-serif text-4xl text-slate-900 sm:text-5xl">
              Welcome{user?.full_name ? `, ${user.full_name}` : ""}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Post new tasks, keep an eye on progress, and manage everything from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {import.meta.env.VITE_DEMO_MODE === "true" && (
              <button
                type="button"
                onClick={() => setTaskData({ ...DEMO_TASK_PRESET })}
                className="rounded-full bg-gradient-to-r from-[#2b8f8a] to-[#227670] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:from-[#227670] hover:to-[#1c5e59]"
              >
                ✨ Fill Demo Task
              </button>
            )}
            <Link
              to="/client/tasks"
              className="rounded-full border border-[#8f3737] px-5 py-3 text-sm font-medium text-[#8f3737] transition hover:bg-[#8f3737] hover:text-white"
            >
              View My Tasks
            </Link>
            <Link
              to="/find-tasker"
              className="rounded-full bg-[#8f3737] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#742c2c]"
            >
              Find a Tasker
            </Link>
          </div>
        </div>

        {/* Category banner */}
        {fromCategory && (
          <div className="mb-8 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            Starting a task from{" "}
            <span className="font-semibold">
              {fromCategory.categoryName} → {fromCategory.taskName}
            </span>
            . You can edit the details below before posting.
          </div>
        )}

        {/* Summary cards */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Tasks", value: stats.total },
            { label: "Open", value: stats.open },
            { label: "In Progress", value: stats.inProgress },
            { label: "Completed", value: stats.completed },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[1.75rem] border border-[#e7dfd7] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-3 font-serif text-4xl text-slate-900">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          {/* Post task */}
          <section className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
                Create
              </p>
              <h2 className="mt-2 font-serif text-3xl text-slate-900">
                Post a New Task
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Describe what you need and we’ll help you get it moving.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Task Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={taskData.title}
                  onChange={handleChange}
                  required
                  className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                  placeholder="e.g. Mount a TV in living room"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  name="description"
                  value={taskData.description}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 py-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                  placeholder="Share the details, timing, and anything the tasker should know."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={taskData.location}
                  onChange={handleChange}
                  required
                  className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                  placeholder="e.g. Fullerton, CA"
                />
              </div>

              {message && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    message.includes("successfully")
                      ? "border border-green-200 bg-green-50 text-green-700"
                      : "border border-red-200 bg-red-50 text-red-600"
                  }`}
                >
                  {message}
                </div>
              )}

              <button
                type="submit"
                className="h-14 w-full rounded-full bg-[#8f3737] text-sm font-semibold text-white transition hover:bg-[#742c2c]"
              >
                Post Task
              </button>
            </form>
          </section>

          {/* Recent tasks */}
          <section className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
                  Activity
                </p>
                <h2 className="mt-2 font-serif text-3xl text-slate-900">
                  My Posted Tasks
                </h2>
              </div>

              <Link
                to="/client/tasks"
                className="text-sm font-medium text-[#8f3737] transition hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="space-y-4">
              {myTasks.length === 0 ? (
                <div className="rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] px-5 py-6 text-sm text-slate-500">
                  You haven&apos;t posted any tasks yet.
                </div>
              ) : (
                myTasks.slice(0, 4).map((task) => (
                  <div
                    key={task._id}
                    className="rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="pr-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {task.title || "Untitled task"}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {task.description || "No description provided."}
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          Location: {task.location || "Not specified"}
                        </p>

                        {(task.status === "in_progress" || task.status === "completed") &&
                          task.tasker_username && (
                            <p className="mt-2 text-xs text-slate-500">
                              Tasker:{" "}
                              <Link
                                to={`/taskers/${encodeURIComponent(task.tasker_username)}`}
                                className="font-semibold text-[#8f3737] hover:underline"
                              >
                                {task.tasker_username}
                              </Link>
                            </p>
                          )}
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(
                          task.status
                        )}`}
                      >
                        {(task.status || "open").replace("_", " ")}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {task.status === "in_progress" && (
                        <>
                          <Link
                            to={`/tasks/${task._id}/chat`}
                            className="rounded-full bg-[#2b8f8a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#227670]"
                          >
                            Chat
                          </Link>
                          <button
                            onClick={() => handleCompleteTask(task._id)}
                            className="rounded-full border border-[#2b8f8a] px-4 py-2 text-xs font-semibold text-[#2b8f8a] transition hover:bg-[#2b8f8a] hover:text-white"
                          >
                            Mark Complete
                          </button>
                        </>
                      )}

                      {task.status === "completed" && (
                        <button
                          onClick={() => openReviewModal(task)}
                          className="rounded-full bg-[#2b8f8a] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#227670]"
                        >
                          Leave Review
                        </button>
                      )}

                      <Link
                        to="/client/tasks"
                        className="rounded-full border border-[#e2d8cf] px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
                      >
                        Manage Task
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;