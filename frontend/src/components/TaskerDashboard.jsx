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
        params: { q: query, location: location }
      });
      const myTasksPromise = axios.get('http://localhost:8000/api/my-tasker-tasks');

      const [openTasksResponse, myTasksResponse] = await Promise.all([
        openTasksPromise,
        myTasksPromise
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
      skills = user.skills.split(',').map((s) => s.trim()).filter(Boolean);
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

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${neutrals.mainText}`}>Tasker Dashboard</h2>
          <p className="text-sm text-slate-600">
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

      {error && <p className="text-red-500 text-center my-4 text-sm">{error}</p>}

      {/* Matches Section */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className={`text-xl font-semibold ${neutrals.mainText}`}>Matches for you</h3>
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
                  <h4 className={`font-semibold text-sm md:text-base ${neutrals.mainText}`}>
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
              We don&apos;t see strong matches yet based on your skills and location.
              Try updating your profile or browsing all available jobs below.
            </p>
          )}
        </div>
      </div>

      {/* Section for My Accepted Jobs */}
      <div className="mb-10">
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
                    Location: <span className="font-medium">{task.location}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Client: <span className="font-medium">{task.client_username}</span>
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

      {/* Search and Filter Form */}
      <form
        onSubmit={handleSearch}
        className={`${neutrals.card} ${neutrals.border} p-4 rounded-lg flex flex-col md:flex-row gap-4 mb-8`}
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

      {/* Section for Available Jobs */}
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
                  <p className="text-sm text-slate-600 mt-1">{task.description}</p>
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
  );
}

export default TaskerDashboard;
