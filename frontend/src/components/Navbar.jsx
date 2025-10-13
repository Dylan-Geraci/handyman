import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import NotificationsPanel from './NotificationsPanel';

function Navbar() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Your existing state and logic for notifications (this is correct)
  const [notifications, setNotifications] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await axios.get('http://localhost:8000/api/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  useEffect(() => {
    if (token) {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleMarkAsRead = async (notificationId) => {
    try {
        await axios.put(`http://localhost:8000/api/notifications/${notificationId}/read`);
        fetchNotifications();
    } catch (error) {
        console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="bg-blue-600 text-white p-4 rounded-md shadow-lg flex items-center justify-between">
      {/* --- Left Side Links --- */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="hover:text-yellow-300 transition-colors">Home</Link>

        {/* CORRECTED: Show these public links ONLY if the user is LOGGED OUT */}
        {!token && (
          <>
            <Link to="/services" className="hover:text-yellow-300 transition-colors">Services</Link>
            <Link to="/portfolio" className="hover:text-yellow-300 transition-colors">Portfolio</Link>
            <Link to="/contact" className="hover:text-yellow-300 transition-colors">Contact</Link>
          </>
        )}

        {/* Show "Find a Tasker" link only to logged-in clients */}
        {user && user.role === 'client' && (
           <Link to="/find-tasker" className="bg-yellow-400 text-blue-800 font-bold py-1 px-3 rounded hover:bg-yellow-300 transition-colors">Find a Tasker</Link>
        )}
      </div>

      {/* --- Right Side Links (Dynamic Part) --- */}
      <div className="flex items-center space-x-4">
        {token ? (
          // If a user IS logged in
          <>
            {/* Your working notification bell */}
            <div className="relative">
              <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="relative p-2 hover:bg-blue-700 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {isPanelOpen && (
                <NotificationsPanel 
                  notifications={notifications} 
                  onMarkAsRead={handleMarkAsRead} 
                />
              )}
            </div>

            {/* CORRECTED: Role-based dashboard links */}
            {user?.role === 'client' && <Link to="/client/dashboard" className="hover:text-yellow-300">My Tasks</Link>}
            {user?.role === 'tasker' && <Link to="/tasker/dashboard" className="hover:text-yellow-300">Dashboard</Link>}
            {user?.role === 'admin' && <Link to="/admin/dashboard" className="hover:text-yellow-300">Admin Panel</Link>}
            
            <button 
              onClick={handleLogout} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded transition-colors"
            >
              Logout
            </button>
          </>
        ) : (
          // If the user IS NOT logged in
          <>
            <Link to="/login" className="hover:text-yellow-300 transition-colors">Login</Link>
            <Link to="/register" className="bg-yellow-400 text-blue-800 font-bold py-1 px-3 rounded hover:bg-yellow-300 transition-colors">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;