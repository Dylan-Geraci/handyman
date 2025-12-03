import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SkeletonLoader from './SkeletonLoader';
import { softRed, actionTeal, successGreen, neutrals } from '../styles/theme';

function ClientMyTasks() {
  const { user } = useContext(AuthContext);

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyClientTasks = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await axios.get('http://localhost:8000/api/my-client-tasks');
      setTasks(res.data || []);
    } catch (err) {
      console.error('Error fetching client tasks:', err);
      setError(err.response?.data?.detail || 'Could not fetch your tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyClientTasks();
  }, []);

  const hasTasks = tasks && tasks.length > 0;

  const handleDeleteTask = async (taskId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this task? This action cannot be undone.'
    );
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://localhost:8000/api/tasks/${taskId}`);
      // Update UI without refetching everything
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err.response?.data?.detail || 'Could not delete this task.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div
        className={`${neutrals.card} ${neutrals.border} p-6 md:p-8 rounded-3xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] space-y-6`}
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1
              className={`text-2xl md:text-3xl font-semibold tracking-tight ${neutrals.mainText}`}
            >
              My Tasks
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {user?.full_name
                ? `Here are the tasks you've posted, ${user.full_name}.`
                : 'Here are the tasks you have posted.'}
            </p>
          </div>

          <Link
            to="/client/dashboard"
            className={`text-white font-semibold py-2 px-4 rounded-md text-sm md:text-base ${softRed.main} ${softRed.hover}`}
          >
            Create new task
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center mt-2">{error}</p>
        )}

        {/* Content */}
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <>
              <SkeletonLoader />
              <SkeletonLoader />
              <SkeletonLoader />
            </>
          ) : !hasTasks ? (
            <p className="text-sm text-slate-500">
              You haven&apos;t posted any tasks yet. Use the{' '}
              <span className="font-medium">Create new task</span> button above
              to get started.
            </p>
          ) : (
            tasks.map((task) => {
              const status = task.status || 'Pending';
              const isCompleted =
                typeof status === 'string' &&
                status.toLowerCase().includes('complete');
              const isInProgress =
                typeof status === 'string' &&
                (status.toLowerCase().includes('in progress') ||
                  status.toLowerCase().includes('accepted'));

              return (
                <div
                  key={task._id}
                  className={`${neutrals.card} ${neutrals.border} p-4 md:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4`}
                >
                  <div className="flex-1 pr-2">
                    <h2 className="text-sm md:text-base font-semibold text-slate-900">
                      {task.title || 'Untitled task'}
                    </h2>
                    <p className="mt-1 text-xs md:text-sm text-slate-600 line-clamp-2">
                      {task.description || 'No description provided.'}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs md:text-[13px] text-slate-500">
                      <span>
                        <span className="font-medium">Location:</span>{' '}
                        {task.location || 'Not specified'}
                      </span>
                      {task.tasker_username && (
                        <span>
                          <span className="font-medium">Tasker:</span>{' '}
                          {task.tasker_username}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: status + actions */}
                  <div className="flex flex-col items-start md:items-end gap-2 min-w-[200px]">
                    {/* Status pill */}
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium border ${
                        isCompleted
                          ? `${successGreen.bg} ${successGreen.border} text-emerald-700`
                          : isInProgress
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-neutral-50 border-neutral-200 text-slate-600'
                      }`}
                    >
                      {status}
                    </span>

                    <div className="flex flex-wrap gap-2">
                      {/* View details */}
                      <Link
                        to={`/tasks/${task._id}`}
                        className="text-xs md:text-sm px-3 py-2 rounded-md border border-neutral-200 bg-white text-slate-700 hover:border-[#F5C8C8] hover:bg-neutral-50 transition-colors"
                      >
                        View details
                      </Link>

                      {/* Chat with tasker, only if assigned */}
                      {task._id && task.tasker_username && (
                        <Link
                          to={`/tasks/${task._id}/chat`}
                          className={`text-xs md:text-sm px-3 py-2 rounded-md font-semibold text-white ${actionTeal.main} ${actionTeal.hover}`}
                        >
                          Message Tasker
                        </Link>
                      )}

                      {/* Delete task */}
                      {task._id && (
                        <button
                          type="button"
                          onClick={() => handleDeleteTask(task._id)}
                          className="text-xs md:text-sm px-3 py-2 rounded-md border border-[#F5C8C8] text-[#E65A5A] bg-white hover:bg-[#FFF5F5] transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientMyTasks;
