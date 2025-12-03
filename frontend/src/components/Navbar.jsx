import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import NotificationsPanel from './NotificationsPanel';
import { softRed, neutrals } from '../styles/theme';

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

  const linkBase = `text-sm font-medium ${neutrals.mainText} hover:text-[#E65A5A] transition-colors`;

  return (
    <nav className="sticky top-0 z-30 mb-3">
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        {/* --- Left Side Links --- */}
        <div className="flex items-center space-x-4">
          <Link to="/" className={linkBase}>
            Home
          </Link>

          {/* CORRECTED: Show these public links ONLY if the user is LOGGED OUT */}
          {!token && (
            <>
              <Link to="/services" className={linkBase}>
                Services
              </Link>
              <Link to="/portfolio" className={linkBase}>
                Portfolio
              </Link>
              <Link to="/contact" className={linkBase}>
                Contact
              </Link>
            </>
          )}

          {/* Categories should be visible to everyone */}
          <Link to="/categories" className={linkBase}>
            Categories
          </Link>

          {/* Show "Find a Tasker" link only to logged-in clients */}
          {user && user.role === 'client' && (
            <Link
              to="/find-tasker"
              className={`inline-flex items-center justify-center rounded-full ${softRed.main} text-white font-semibold py-1.5 px-3 text-xs sm:text-sm ${softRed.hover} transition-transform duration-150 hover:-translate-y-[1px] shadow-sm`}
            >
              Find a Tasker
            </Link>
          )}
        </div>

        {/* --- Right Side Links (Dynamic Part) --- */}
        <div className="flex items-center space-x-4 text-sm">
          {token ? (
            // If a user IS logged in
            <>
              {/* Your working notification bell */}
              <div className="relative">
                <button
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  className="relative p-2 rounded-full hover:bg-neutral-100 text-slate-700 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    ></path>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-[#E65A5A] text-white text-[10px] font-semibold flex items-center justify-center">
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
              {user?.role === 'client' && (
                <Link to="/client/tasks" className={linkBase}>
                  My Tasks
                </Link>
              )}
              {user?.role === 'tasker' && (
                <Link to="/tasker/dashboard" className={linkBase}>
                  Dashboard
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin/dashboard" className={linkBase}>
                  Admin Panel
                </Link>
              )}
              
              <button
                onClick={handleLogout}
                className="bg-slate-900 hover:bg-black text-white font-semibold py-1.5 px-3 rounded-full text-xs sm:text-sm transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            // If the user IS NOT logged in
            <>
              <Link
                to="/login"
                className={linkBase}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`inline-flex items-center justify-center rounded-full ${softRed.main} text-white font-semibold py-1.5 px-4 text-xs sm:text-sm ${softRed.hover} transition-transform duration-150 hover:-translate-y-[1px] shadow-sm`}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
