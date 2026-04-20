import { useState, useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import NotificationsPanel from "./NotificationsPanel";

function Navbar() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const isHomePage = location.pathname === "/";

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await axios.get("http://localhost:8000/api/notifications");
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
    navigate("/login");
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(`http://localhost:8000/api/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className={`w-full border-b border-[#e7dfd7] bg-[#f8f5f2] ${!isHomePage ? "sticky top-0 z-30" : ""}`}>
      {/* ── Single row: logo left | nav center | auth right ── */}
      <div className="relative flex w-full items-center justify-between px-8 py-5 lg:px-12">

        {/* LEFT: Logo */}
        <Link to="/" className="shrink-0 whitespace-nowrap">
          <span className="text-[1.65rem] font-semibold tracking-[0.06em] text-red-600">CRETE</span>
          <span className="text-[1.65rem] font-semibold tracking-[0.06em] text-slate-900"> Handyman</span>
        </Link>

        {/* CENTER: Nav links — absolutely centred in the bar */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
          <Link to="/about" className="text-[15px] text-slate-700 transition hover:text-[#7b2e2f] whitespace-nowrap">
            About Us
          </Link>
          <Link to="/services" className="text-[15px] text-slate-700 transition hover:text-[#7b2e2f] whitespace-nowrap">
            Services
          </Link>
          <Link to="/categories" className="text-[15px] text-slate-700 transition hover:text-[#7b2e2f] whitespace-nowrap">
            Categories
          </Link>
        </div>

        {/* RIGHT: Auth */}
        <div className="z-10 flex items-center gap-4 lg:gap-5">
          {token ? (
            <>
              {/* Notification bell */}
              <div className="relative">
                <button
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  className="relative rounded-full p-2 text-slate-700 transition hover:bg-[#ece6df]"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#7b2e2f] text-[10px] font-semibold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {isPanelOpen && (
                  <NotificationsPanel notifications={notifications} onMarkAsRead={handleMarkAsRead} />
                )}
              </div>

              {user?.role === "client" && (
                <Link to="/find-tasker" className="hidden text-sm text-slate-700 transition hover:text-[#7b2e2f] sm:block whitespace-nowrap">
                  Find a Tasker
                </Link>
              )}

              {user?.role === "client" && (
                <Link to="/client/tasks" className="hidden text-sm text-slate-700 transition hover:text-[#7b2e2f] sm:block whitespace-nowrap">
                  My Tasks
                </Link>
              )}

              {user?.role === "tasker" && (
                <Link to="/tasker/dashboard" className="hidden text-sm text-slate-700 transition hover:text-[#7b2e2f] sm:block whitespace-nowrap">
                  Dashboard
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="rounded-full border border-[#7b2e2f] px-5 py-2.5 text-sm font-medium text-[#7b2e2f] transition hover:bg-[#7b2e2f] hover:text-white whitespace-nowrap"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-slate-700 transition hover:text-[#7b2e2f] whitespace-nowrap">
                Login / Sign Up
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[#8f3737] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#742c2c] whitespace-nowrap"
              >
                Become a Tasker
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;