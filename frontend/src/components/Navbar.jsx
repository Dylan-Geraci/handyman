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
      await axios.put(
        `http://localhost:8000/api/notifications/${notificationId}/read`
      );
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isHomePage) {
    return (
      <nav className="bg-[#f6f4f2]">
        <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Logo */}
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="text-[1.7rem] font-semibold tracking-[0.06em] text-[#7b2e2f]"
              >
                CRETEBOT
              </Link>
            </div>

            {/* Center links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-700">
              <Link to="/about" className="hover:text-[#7b2e2f] transition-colors">
                About Us
              </Link>
              <Link
                to="/services"
                className="hover:text-[#7b2e2f] transition-colors"
              >
                Services
              </Link>
              <Link
                to="/categories"
                className="hover:text-[#7b2e2f] transition-colors"
              >
                Categories
              </Link>
            </div>

            {/* Right side */}
            <div className="flex flex-wrap items-center gap-4 text-sm md:justify-end">
              {token ? (
                <>
                  <div className="relative">
                    <button
                      onClick={() => setIsPanelOpen(!isPanelOpen)}
                      className="relative rounded-full p-2 text-slate-700 transition hover:bg-[#ece6df]"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
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
                      <NotificationsPanel
                        notifications={notifications}
                        onMarkAsRead={handleMarkAsRead}
                      />
                    )}
                  </div>

                  {user?.role === "client" && (
                    <Link
                      to="/client/tasks"
                      className="hover:text-[#7b2e2f] transition-colors"
                    >
                      My Tasks
                    </Link>
                  )}

                  {user?.role === "tasker" && (
                    <>
                      <Link
                        to="/tasker/dashboard"
                        className="hover:text-[#7b2e2f] transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/tasker/recommendations"
                        className="hover:text-[#7b2e2f] transition-colors"
                      >
                        Recommended Tasks
                      </Link>
                    </>
                  )}

                  {user?.role === "admin" && (
                    <Link
                      to="/admin/dashboard"
                      className="hover:text-[#7b2e2f] transition-colors"
                    >
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    className="rounded-full border border-[#7b2e2f] px-4 py-2 text-sm font-medium text-[#7b2e2f] transition hover:bg-[#7b2e2f] hover:text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:text-[#7b2e2f] transition-colors">
                    Login / Sign Up
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-full bg-[#7b2e2f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#652425]"
                  >
                    Become a Tasker
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-30 bg-[#f6f4f2] border-b border-[#e9e2da]">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="text-[1.5rem] font-semibold tracking-[0.06em] text-[#7b2e2f]"
        >
          CRETEBOT
        </Link>

        <div className="flex items-center gap-4 text-sm text-slate-700">
          <Link to="/categories" className="hover:text-[#7b2e2f] transition-colors">
            Categories
          </Link>

          {token ? (
            <>
              {user?.role === "client" && (
                <Link
                  to="/find-tasker"
                  className="hover:text-[#7b2e2f] transition-colors"
                >
                  Find a Tasker
                </Link>
              )}

              {user?.role === "tasker" && (
                <Link
                  to="/tasker/dashboard"
                  className="hover:text-[#7b2e2f] transition-colors"
                >
                  Dashboard
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="rounded-full bg-[#7b2e2f] px-4 py-2 text-white transition hover:bg-[#652425]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-[#7b2e2f] transition-colors">
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[#7b2e2f] px-4 py-2 text-white transition hover:bg-[#652425]"
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