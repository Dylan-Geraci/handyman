import { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import SkeletonLoader from './SkeletonLoader';
import { softRed, actionTeal, successGreen, neutrals } from '../styles/theme';

function TaskerDashboard() {
  const { user } = useContext(AuthContext);
  const routerLocation = useLocation();

  const [openTasks, setOpenTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // If Tasker came from Categories page (clicked a task type)
  const fromCategory = routerLocation.state?.fromCategory || null;

  const fetchAllTasks = async (query = '', location = '') => {
    setIsLoading(true);
    setError('');
    try {
      const openTasksPromise = axios.get('http://localhost:8000/api/tasks', {
        params: { q: query, location: location },
      });
      const myTasksPromise = axios.get(
        'http://localhost:8000/api/my-tasker-tasks'
      );

      const [openTasksResponse, myTasksResponse] = await Promise.all([
        openTasksPromise,
        myTasksPromise,
      ]);

      setOpenTasks(openTasksResponse.data);
      setMyTasks(myTasksResponse.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not fetch tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  // On mount, if we came from Categories with a selected task type, use that as the initial search
  useEffect(() => {
    if (fromCategory?.taskName) {
      setSearchQuery(fromCategory.taskName);
      fetchAllTasks(fromCategory.taskName, '');
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
      setError(err.response?.data?.detail || 'Failed to accept the task.');
    }
  };

  // --- Matches section: use user.skills + user.location (+ optional fromCategory) ---
  const matchedTasks = useMemo(() => {
    if (!user || !openTasks.length) return [];

    // user.skills might be an array or a comma-separated string
    let skills = [];
    if (Array.isArray(user.skills)) {
      skills = user.skills;
    } else if (typeof user.skills === 'string') {
      skills = user.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const normalizedSkills = skills.map((s) => s.toLowerCase());
    const preferredLocation = (user.location || '').toLowerCase();
    const categoryTerm = (fromCategory?.taskName || '').toLowerCase();

    if (!normalizedSkills.length && !preferredLocation && !categoryTerm) {
      return [];
    }

    return openTasks.filter((task) => {
      const title = (task.title || '').toLowerCase();
      const description = (task.description || '').toLowerCase();
      const taskLocation = (task.location || '').toLowerCase();

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

  // ---- Dashboard summary stats (wire what we can for now) ----
  const stats = {
    rangeLabel: 'This week',
    earnings: 420.75, // TODO: replace with real earnings from backend
    tasksCompleted: myTasks.length, // wired to accepted jobs
    hoursOnline: 0, // TODO: replace with real hours once tracked
    rating: user?.rating ?? 0, // if you add rating to user model later, this will start working
  };

  // TODO: replace with real schedule data once you have it
  const upcomingShifts = [
    { day: 'Today', time: '3:00 PM – 7:00 PM', area: 'Central OC' },
    { day: 'Tomorrow', time: '10:00 AM – 2:00 PM', area: 'Irvine / Tustin' },
    { day: 'Fri', time: '5:00 PM – 9:00 PM', area: 'Anaheim / Orange' },
  ];

  // TODO: replace with real promos / boosts from backend
  const promos = [
    {
      id: 1,
      title: 'Evening Boost',
      description: 'Earn +15% on tasks completed between 5 PM – 9 PM.',
      window: 'Today only',
    },
    {
      id: 2,
      title: 'New Client Bonus',
      description: 'Extra $10 for your first task with a new client.',
      window: 'Ends Sunday',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className={`${neutrals.card} ${neutrals.border} p-6 md:p-8 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] space-y-10`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight ${neutrals.mainText}`}>
              Tasker Dashboard
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Welcome, <span className="font-medium">{user?.full_name}</span>!
            </p>
            {user?.role === 'tasker' && user?.location && (
              <p className="text-xs text-slate-500 mt-1">
                Matching tasks near{' '}
                <span className="font-semibold">{user.location}</span>.
              </p>
            )}
          </div>
          <Link
            to="/profile/edit"
            className={`text-white font-bold py-2 px-4 rounded-md transition-colors text-sm ${softRed.main} ${softRed.hover}`}
          >
            Edit Profile
          </Link>
        </div>

        {error && (
          <p className="text-red-500 text-center my-2 text-sm">{error}</p>
        )}

        {/* --- This week summary --- */}
        <section className="rounded-2xl bg-gradient-to-r from-neutral-50 to-white border border-neutral-200 shadow-sm p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {stats.rangeLabel}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Your earnings so far
              </p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 tracking-tight">
                ${stats.earnings.toFixed(2)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 w-full md:w-auto md:min-w-[280px]">
              <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Tasks
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {stats.tasksCompleted}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Hours online
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {stats.hoursOnline.toFixed(1)}
                </p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  Rating
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {stats.rating ? stats.rating.toFixed(1) : '—'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- Schedule + Map row --- */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Schedule */}
          <div className="md:col-span-1 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">Schedule</h2>
              <button
                type="button"
                className={`text-xs font-medium rounded-full px-3 py-1 border border-transparent ${softRed.main} text-white ${softRed.hover}`}
              >
                Manage
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Your upcoming time slots and areas.
            </p>

            <div className="mt-3 space-y-2">
              {upcomingShifts.map((shift, idx) => (
                <div
                  key={`${shift.day}-${idx}`}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2"
                >
                  <p className="text-xs font-medium text-slate-800">
                    {shift.day}
                  </p>
                  <p className="text-xs text-slate-600">{shift.time}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {shift.area}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Map placeholder */}
          <div className="md:col-span-2 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900">
                Active area
              </h2>
              <span className="text-[11px] text-slate-500">
                Map view coming soon
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              See where most of your recent tasks are located.
            </p>

            <div className="mt-3 h-40 md:h-52 rounded-2xl border border-dashed border-neutral-300 bg-white flex items-center justify-center text-xs text-slate-400">
              Map integration placeholder
            </div>
          </div>
        </section>

        {/* --- Earnings + promos + help row --- */}
        <section className="grid gap-6 md:grid-cols-3">
          {/* Earnings breakdown */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Earnings summary
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Overview of your payouts for this week.
            </p>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-700">
                <span>Base earnings</span>
                <span className="font-medium">
                  ${(stats.earnings * 0.78).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Promotions</span>
                <span className="font-medium">
                  ${(stats.earnings * 0.15).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span>Tips</span>
                <span className="font-medium">
                  ${(stats.earnings * 0.07).toFixed(2)}
                </span>
              </div>
              <div className="mt-2 border-t border-neutral-200 pt-2 flex items-center justify-between text-slate-900 text-sm font-semibold">
                <span>Total</span>
                <span>${stats.earnings.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Promos */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Promos & boosts
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Limited-time ways to increase your earnings.
            </p>

            <div className="mt-3 space-y-3">
              {promos.map((promo) => (
                <div
                  key={promo.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2"
                >
                  <p className="text-xs font-semibold text-slate-900">
                    {promo.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {promo.description}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {promo.window}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Help / Support */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Help & support
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Get answers fast or reach out if something doesn’t look right.
            </p>

            <div className="mt-3 space-y-2 text-sm">
              <button
                type="button"
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-slate-700 hover:border-[#F5C8C8] hover:bg-white transition-colors"
              >
                Payment & payout questions
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-slate-700 hover:border-[#F5C8C8] hover:bg-white transition-colors"
              >
                Account & verification
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-slate-700 hover:border-[#F5C8C8] hover:bg-white transition-colors"
              >
                Issues with a task
              </button>
            </div>

            <button
              type="button"
              className={`mt-4 w-full rounded-lg px-3 py-2 text-xs font-semibold text-white text-center ${softRed.main} ${softRed.hover}`}
            >
              Contact support
            </button>
          </div>
        </section>

        {/* --- Matches Section (best matches based on skills/location) --- */}
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-3">
            <h3
              className={`text-xl font-semibold ${neutrals.mainText}`}
            >
              Matches for you
            </h3>
            {fromCategory?.taskName && (
              <p className="text-xs text-slate-500">
                Filtered by{' '}
                <span className="font-semibold">{fromCategory.taskName}</span>
                {user?.location ? ` near ${user.location}` : ''}.
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
                  className={`${neutrals.card} ${neutrals.border} p-4 rounded-lg shadow-sm flex justify-between items-center`}
                >
                  <div className="pr-4">
                    <h4
                      className={`font-semibold text-sm md:text-base ${neutrals.mainText}`}
                    >
                      {task.title}
                    </h4>
                    <p className="text-xs md:text-sm text-slate-600 mt-1 line-clamp-3">
                      {task.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Location:{' '}
                      <span className="font-medium">
                        {task.location || 'Not specified'}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcceptTask(task._id)}
                    className={`text-white font-semibold py-2 px-4 rounded-md text-xs md:text-sm ${softRed.main} ${softRed.hover}`}
                  >
                    Accept
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                We don&apos;t see strong matches yet based on your skills and
                location. Try updating your profile or browsing all available
                jobs below.
              </p>
            )}
          </div>
        </div>

        {/* --- My Accepted Jobs (with Chat) --- */}
        <div className="mb-4">
          <h3 className={`text-xl font-semibold mb-4 ${neutrals.mainText}`}>
            My Accepted Jobs
          </h3>
          <div className="space-y-4">
            {myTasks.length > 0 ? (
              myTasks.map((task) => (
                <div
                  key={task._id}
                  className={`${successGreen.bg} ${successGreen.border} border rounded-lg p-4 shadow-sm flex justify-between items-center`}
                >
                  <div className="pr-4">
                    <h4 className="font-semibold text-sm md:text-base text-slate-900">
                      {task.title}
                    </h4>
                    <p className="text-xs md:text-sm text-slate-700 mt-1">
                      Location:{' '}
                      <span className="font-medium">{task.location}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Client:{' '}
                      <span className="font-medium">
                        {task.client_username}
                      </span>
                    </p>
                  </div>
                  <Link
                    to={`/tasks/${task._id}/chat`}
                    className={`text-white font-semibold py-2 px-4 rounded-md text-xs md:text-sm ${actionTeal.main} ${actionTeal.hover}`}
                  >
                    Chat with client
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                You haven&apos;t accepted any jobs yet.
              </p>
            )}
          </div>
        </div>

        {/* --- Search and Filter Form --- */}
        <form
          onSubmit={handleSearch}
          className={`${neutrals.card} ${neutrals.border} p-4 rounded-lg flex flex-col md:flex-row gap-4`}
        >
          <input
            type="text"
            placeholder="Search by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#E65A5A]/70"
          />
          <input
            type="text"
            placeholder="Filter by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#E65A5A]/70"
          />
          <button
            type="submit"
            className={`text-white font-semibold py-2 px-6 rounded-md text-sm md:text-base ${softRed.main} ${softRed.hover}`}
          >
            Search
          </button>
        </form>

        {/* --- Available Jobs --- */}
        <div>
          <h3 className={`text-xl font-semibold mb-4 ${softRed.text}`}>
            Available Jobs
          </h3>
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
                  className={`${neutrals.card} ${neutrals.border} p-6 rounded-lg shadow-sm flex justify-between items-center`}
                >
                  <div className="pr-4">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {task.title}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      {task.description}
                    </p>
                    <div className="mt-3 text-xs md:text-sm text-slate-500">
                      <span className="font-medium">Location:</span>{' '}
                      {task.location}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptTask(task._id)}
                    className={`text-white font-semibold py-2 px-4 rounded-md transition-colors ml-4 flex-shrink-0 text-xs md:text-sm ${softRed.main} ${softRed.hover}`}
                  >
                    Accept task
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No open tasks found matching your criteria.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskerDashboard;
