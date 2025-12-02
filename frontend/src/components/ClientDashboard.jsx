import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import LeaveReview from './LeaveReview';
import { softRed, actionTeal, successGreen, neutrals } from '../styles/theme';

function ClientDashboard() {
  const { user, token } = useContext(AuthContext);
  const location = useLocation();
  const fromCategory = location.state?.fromCategory || null; // << central place

  const [myTasks, setMyTasks] = useState([]);
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    location: '',
  });
  const [message, setMessage] = useState('');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState(null);

  const fetchMyTasks = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/my-client-tasks');
      setMyTasks(response.data);
    } catch (error) {
      console.error('Error fetching my tasks:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMyTasks();
    }
  }, [token]);

  // Prefill the form when coming from Categories
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
    setMessage('');
    try {
      await axios.post('http://localhost:8000/api/tasks', taskData);
      setMessage('Task posted successfully!');
      setTaskData({ title: '', description: '', location: '' });
      fetchMyTasks();
    } catch (error) {
      setMessage(error.response?.data?.detail || 'Failed to post task.');
    }
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await axios.put(`http://localhost:8000/api/tasks/${taskId}/complete`);
      fetchMyTasks();
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to mark task as complete.');
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-gray-200 text-gray-800';
      case 'in_progress':
        return 'bg-gray-200 text-gray-800';
      case 'completed':
        return `${successGreen.bg} ${successGreen.text}`;
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`${neutrals.card} p-8 rounded-lg shadow-md ${neutrals.border}`}>
      {isReviewModalOpen && selectedTaskForReview && (
        <LeaveReview
          task={selectedTaskForReview}
          onClose={closeReviewModal}
          onReviewSubmitted={fetchMyTasks}
        />
      )}

      <h2 className="text-2xl font-bold mb-4">Client Dashboard</h2>
      <p className="mb-6 text-gray-700">Welcome, {user?.full_name}!</p>

      {/* Banner when coming from Categories */}
      {fromCategory && (
        <div className={`mb-4 rounded-md ${successGreen.bg} ${successGreen.border} px-4 py-2 text-sm ${successGreen.text}`}>
          Starting a task from{' '}
          <span className="font-semibold">
            {fromCategory.categoryName} → {fromCategory.taskName}
          </span>
          . You can edit the details below before posting.
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Post a New Task</h3>
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 p-6 rounded-lg shadow-sm"
        >
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Task Title
            </label>
            <input
              type="text"
              name="title"
              value={taskData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={taskData.description}
              onChange={handleChange}
              required
              rows="4"
              className="w-full px-3 py-2 border rounded-md"
            ></textarea>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={taskData.location}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <button
            type="submit"
            className={`text-white font-bold py-2 px-4 rounded ${softRed.main} ${softRed.hover}`}
          >
            Post Task
          </button>
        </form>
        {message && (
          <p
            className={`mt-4 text-center ${
              message.includes('successfully')
                ? 'text-green-500'
                : 'text-red-500'
            }`}
          >
            {message}
          </p>
        )}
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">My Posted Tasks</h3>
        <div className="space-y-4">
          {myTasks.map((task) => (
              <div
                key={task._id}
                className={`${neutrals.card} p-4 rounded-lg shadow-sm ${neutrals.border}`}
              >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-gray-800">{task.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    {task.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Location: {task.location}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status.replace('_', ' ')}
                </span>
              </div>

                    {task.status === 'in_progress' && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-green-700">
                    Accepted by:{' '}
                    <Link
                      to={`/taskers/${encodeURIComponent(
                        task.tasker_username
                      )}`}
                      className="font-bold hover:underline ml-1"
                    >
                      {task.tasker_username}
                    </Link>
                  </p>
                  <div className="flex space-x-2">
                    <Link
                      to={`/tasks/${task._id}/chat`}
                      className={`text-white font-bold py-1 px-3 rounded text-sm ${actionTeal.main} ${actionTeal.hover}`}
                    >
                      Chat
                    </Link>
                    <button
                      onClick={() => handleCompleteTask(task._id)}
                      className={`text-white font-bold py-1 px-3 rounded text-sm ${actionTeal.main} ${actionTeal.hover}`}
                    >
                      Mark as Complete
                    </button>
                  </div>
                </div>
              )}

                    {task.status === 'completed' && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Completed by:{' '}
                    <Link
                      to={`/taskers/${encodeURIComponent(
                        task.tasker_username
                      )}`}
                      className="font-bold hover:underline ml-1"
                    >
                      {task.tasker_username}
                    </Link>
                  </p>
                  <button
                    onClick={() => openReviewModal(task)}
                    className={`text-white font-bold py-1 px-3 rounded text-sm ${actionTeal.main} ${actionTeal.hover}`}
                  >
                    Leave Review
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClientDashboard;
