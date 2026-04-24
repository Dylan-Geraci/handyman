import { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link, useLocation } from "react-router-dom";
import SkeletonLoader from "./SkeletonLoader";

function TaskerDashboard() {
  const { user } = useContext(AuthContext);
  const routerLocation = useLocation();

  const [openTasks, setOpenTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fromCategory = routerLocation.state?.fromCategory || null;

  const fetchAllTasks = async (query = "", location = "") => {
    setIsLoading(true);
    setError("");

    try {
      const openTasksPromise = axios.get("http://localhost:8000/api/tasks", {
        params: { q: query, location: location },
      });

      const myTasksPromise = axios.get(
        "http://localhost:8000/api/my-tasker-tasks"
      );

      const [openTasksResponse, myTasksResponse] = await Promise.all([
        openTasksPromise,
        myTasksPromise,
      ]);

      setOpenTasks(openTasksResponse.data || []);
      setMyTasks(myTasksResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not fetch tasks.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fromCategory?.taskName) {
      setSearchQuery(fromCategory.taskName);
      fetchAllTasks(fromCategory.taskName, "");
    } else {
      fetchAllTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAllTasks(searchQuery, locationFilter);
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await axios.put(`http://localhost:8000/api/tasks/${taskId}/accept`);
      fetchAllTasks(searchQuery, locationFilter);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to accept the task.");
    }
  };

  const matchedTasks = useMemo(() => {
    if (!user || !openTasks.length) return [];

    let skills = [];
    if (Array.isArray(user.skills)) {
      skills = user.skills;
    } else if (typeof user.skills === "string") {
      skills = user.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const normalizedSkills = skills.map((s) => s.toLowerCase());
    const preferredLocation = (user.location || "").toLowerCase();
    const categoryTerm = (fromCategory?.taskName || "").toLowerCase();

    if (!normalizedSkills.length && !preferredLocation && !categoryTerm) {
      return [];
    }

    return openTasks.filter((task) => {
      const title = (task.title || "").toLowerCase();
      const description = (task.description || "").toLowerCase();
      const taskLocation = (task.location || "").toLowerCase();

      const skillMatch = normalizedSkills.length
        ? normalizedSkills.some(
            (skill) => title.includes(skill) || description.includes(skill)
          )
        : true;

      const locationMatch = preferredLocation
        ? taskLocation.includes(preferredLocation)
        : true;

      const categoryMatch = categoryTerm
        ? title.includes(categoryTerm) || description.includes(categoryTerm)
        : true;

      return skillMatch && locationMatch && categoryMatch;
    });
  }, [openTasks, user, fromCategory]);

  const stats = {
    earnings: 420.75,
    tasksCompleted: myTasks.length,
    hoursOnline: 0,
    rating: user?.rating ?? 0,
  };

  const upcomingShifts = [
    { day: "Today", time: "3:00 PM – 7:00 PM", area: "Central OC" },
    { day: "Tomorrow", time: "10:00 AM – 2:00 PM", area: "Irvine / Tustin" },
    { day: "Fri", time: "5:00 PM – 9:00 PM", area: "Anaheim / Orange" },
  ];

  const promos = [
    {
      id: 1,
      title: "Evening Boost",
      description: "Earn +15% on tasks completed between 5 PM – 9 PM.",
      window: "Today only",
    },
    {
      id: 2,
      title: "New Client Bonus",
      description: "Extra $10 for your first task with a new client.",
      window: "Ends Sunday",
    },
  ];

  return (
    <div className="min-h-[82vh] bg-[#f5f3f1] px-6 py-10">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Intro */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f3737]">
              Tasker Dashboard
            </p>
            <h1 className="mt-3 font-serif text-4xl text-slate-900 sm:text-5xl">
              Welcome{user?.full_name ? `, ${user.full_name}` : ""}.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Browse matches, manage accepted jobs, and keep your work flowing.
            </p>
            {user?.location && (
              <p className="mt-2 text-xs text-slate-500">
                Matching tasks near <span className="font-semibold">{user.location}</span>.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/profile/edit"
              className="rounded-full border border-[#8f3737] px-5 py-3 text-sm font-medium text-[#8f3737] transition hover:bg-[#8f3737] hover:text-white"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Summary */}
        <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Earnings", value: `$${stats.earnings.toFixed(2)}` },
            { label: "Accepted Jobs", value: stats.tasksCompleted },
            { label: "Hours Online", value: stats.hoursOnline.toFixed(1) },
            { label: "Rating", value: stats.rating ? stats.rating.toFixed(1) : "—" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[1.75rem] border border-[#e7dfd7] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
            >
              <p className="text-sm text-slate-500">{card.label}</p>
              <p className="mt-3 font-serif text-4xl text-slate-900">{card.value}</p>
            </div>
          ))}
        </section>

        {/* Utility row */}
        <section className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-[1.75rem] border border-[#e7dfd7] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <h2 className="text-base font-semibold text-slate-900">Schedule</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your upcoming working windows.
            </p>

            <div className="mt-4 space-y-3">
              {upcomingShifts.map((shift, idx) => (
                <div
                  key={`${shift.day}-${idx}`}
                  className="rounded-2xl border border-[#e7dfd7] bg-[#fbf8f5] px-4 py-3"
                >
                  <p className="text-sm font-medium text-slate-900">{shift.day}</p>
                  <p className="mt-1 text-sm text-slate-600">{shift.time}</p>
                  <p className="mt-1 text-xs text-slate-500">{shift.area}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#e7dfd7] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <h2 className="text-base font-semibold text-slate-900">Promos & boosts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Extra ways to increase your earnings.
            </p>

            <div className="mt-4 space-y-3">
              {promos.map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-2xl border border-[#e7dfd7] bg-[#fbf8f5] px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-900">{promo.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{promo.description}</p>
                  <p className="mt-1 text-xs text-slate-500">{promo.window}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-[#e7dfd7] bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
            <h2 className="text-base font-semibold text-slate-900">Help & support</h2>
            <p className="mt-1 text-sm text-slate-500">
              Quick answers when something feels off.
            </p>

            <div className="mt-4 space-y-3">
              {[
                "Payment & payout questions",
                "Account & verification",
                "Issues with a task",
              ].map((item) => (
                <button
                  key={item}
                  type="button"
                  className="w-full rounded-2xl border border-[#e7dfd7] bg-[#fbf8f5] px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-white"
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="mt-4 w-full rounded-full bg-[#8f3737] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#742c2c]"
            >
              Contact Support
            </button>
          </div>
        </section>

        {/* Matches + Accepted jobs */}
        <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
                  Recommended
                </p>
                <h2 className="mt-2 font-serif text-3xl text-slate-900">
                  Matches for you
                </h2>
              </div>
              {fromCategory?.taskName && (
                <p className="text-xs text-slate-500">
                  Filtered by <span className="font-semibold">{fromCategory.taskName}</span>
                </p>
              )}
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <>
                  <SkeletonLoader />
                  <SkeletonLoader />
                </>
              ) : matchedTasks.length > 0 ? (
                matchedTasks.map((task) => (
                  <div
                    key={task._id}
                    className="rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] p-5"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="pr-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {task.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {task.description}
                        </p>
                        <p className="mt-3 text-xs text-slate-500">
                          Location: <span className="font-medium">{task.location || "Not specified"}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleAcceptTask(task._id)}
                        className="rounded-full bg-[#8f3737] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#742c2c]"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] px-5 py-6 text-sm text-slate-500">
                  We don&apos;t see strong matches yet based on your skills and location.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
                Active
              </p>
              <h2 className="mt-2 font-serif text-3xl text-slate-900">
                My Accepted Jobs
              </h2>
            </div>

            <div className="space-y-4">
              {myTasks.length > 0 ? (
                myTasks.map((task) => (
                  <div
                    key={task._id}
                    className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">{task.title}</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      Location: <span className="font-medium">{task.location}</span>
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Client: <span className="font-medium">{task.client_username}</span>
                    </p>

                    <div className="mt-4">
                      <Link
                        to={`/tasks/${task._id}/chat`}
                        className="inline-flex rounded-full bg-[#2b8f8a] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#227670]"
                      >
                        Chat with client
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] px-5 py-6 text-sm text-slate-500">
                  You haven&apos;t accepted any jobs yet.
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Search + all jobs */}
        <section className="mt-8 rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
              Browse
            </p>
            <h2 className="mt-2 font-serif text-3xl text-slate-900">
              Available Jobs
            </h2>
          </div>

          <form onSubmit={handleSearch} className="mb-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              placeholder="Search by keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
            />
            <input
              type="text"
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="h-14 rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
            />
            <button
              type="submit"
              className="h-14 rounded-full bg-[#8f3737] px-7 text-sm font-semibold text-white transition hover:bg-[#742c2c]"
            >
              Search
            </button>
          </form>

          <div className="space-y-4">
            {isLoading ? (
              <>
                <SkeletonLoader />
                <SkeletonLoader />
                <SkeletonLoader />
              </>
            ) : openTasks.length > 0 ? (
              openTasks.map((task) => (
                <div
                  key={task._id}
                  className="rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="pr-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {task.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {task.description}
                      </p>
                      <div className="mt-3 text-xs text-slate-500">
                        <span className="font-medium">Location:</span> {task.location}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAcceptTask(task._id)}
                      className="rounded-full bg-[#8f3737] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#742c2c]"
                    >
                      Accept Task
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] px-5 py-6 text-sm text-slate-500">
                No open tasks found matching your criteria.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default TaskerDashboard;