import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import SkeletonLoader from './SkeletonLoader';

function TaskerDashboard() {
  const { user } = useContext(AuthContext);
  const [openTasks, setOpenTasks] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllTasks = async (query = '', location = '') => {
    setIsLoading(true);
    setError('');
    try {
      const openTasksPromise = axios.get('http://localhost:8000/api/tasks', { 
        params: { q: query, location: location } 
      });
      const myTasksPromise = axios.get('http://localhost:8000/api/my-tasker-tasks');
      
      const [openTasksResponse, myTasksResponse] = await Promise.all([openTasksPromise, myTasksPromise]);

      setOpenTasks(openTasksResponse.data);
      setMyTasks(myTasksResponse.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not fetch tasks.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
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

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Tasker Dashboard</h2>
          <p className="text-gray-700">Welcome, {user?.full_name}!</p>
        </div>
        <Link to="/profile/edit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors">
          Edit Profile
        </Link>
      </div>

      {error && <p className="text-red-500 text-center my-4">{error}</p>}

      {/* Section for My Accepted Jobs */}
      <div className="mb-10">
        <h3 className="text-xl font-semibold mb-4 text-green-700">My Accepted Jobs</h3>
        <div className="space-y-4">
          {myTasks.length > 0 ? (
            myTasks.map(task => (
              <div key={task._id} className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-800">{task.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">Location: {task.location}</p>
                  <p className="text-xs text-gray-500 mt-2">Client: {task.client_username}</p>
                </div>
                <Link to={`/tasks/${task._id}/chat`} className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded">Chat with Client</Link>
              </div>
            ))
          ) : (
            <p className="text-gray-500">You have not accepted any jobs yet.</p>
          )}
        </div>
      </div>

      {/* Search and Filter Form */}
      <form onSubmit={handleSearch} className="bg-gray-100 p-4 rounded-lg flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by keyword..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
        <input
          type="text"
          placeholder="Filter by location..."
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        />
        <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700">
          Search
        </button>
      </form>

      {/* Section for Available Jobs */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-blue-700">Available Jobs</h3>
        <div className="space-y-4">
          {isLoading ? (
            <>
              <SkeletonLoader />
              <SkeletonLoader />
              <SkeletonLoader />
            </>
          ) : openTasks.length > 0 ? (
            openTasks.map(task => (
              <div key={task._id} className="bg-gray-50 p-6 rounded-lg shadow-sm border flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                  <p className="text-gray-600 mt-1">{task.description}</p>
                  <div className="mt-3 text-sm text-gray-500">
                    <strong>Location:</strong> {task.location}
                  </div>
                </div>
                <button
                  onClick={() => handleAcceptTask(task._id)}
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors ml-4 flex-shrink-0"
                >
                  Accept Task
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No open tasks found matching your criteria.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TaskerDashboard;