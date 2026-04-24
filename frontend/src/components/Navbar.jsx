import { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import NotificationsPanel from "./NotificationsPanel";
import cretebotLogo from "../assets/cretebot_logo.svg";

function Navbar() {
  const { token, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
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

  const getDashboardPath = () => {
    if (user?.role === "client") return "/client/dashboard";
    if (user?.role === "tasker") return "/tasker/dashboard";
    if (user?.role === "admin") return "/admin/dashboard";
    return "/";
  };

  const getDashboardLabel = () => {
    if (user?.role === "client") return "My Dashboard";
    if (user?.role === "tasker") return "Tasker Dashboard";
    if (user?.role === "admin") return "Admin Dashboard";
    return "Dashboard";
  };

  const getUserInitials = () => {
    if (user?.full_name) {
      return user.full_name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }

    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }

    return "U";
  };

  const getRoleLabel = () => {
    if (!user?.role) return "User";
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  return (
    <nav
      className={`w-full border-b border-[#e7dfd7] bg-[#f8f5f2] ${
        !isHomePage ? "sticky top-0 z-30" : ""
      }`}
    >
      <div className="relative flex w-full items-center justify-between px-8 py-5 lg:px-12">
        {/* LEFT: Logo */}
        <Link to="/" className="z-10 shrink-0">
          <img
            src={cretebotLogo}
            alt="CreteBot"
            className="h-10 w-auto object-contain lg:h-12"
          />
        </Link>

        {/* CENTER: Nav links */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
          <Link
            to="/about"
            className="whitespace-nowrap text-[15px] text-slate-700 transition hover:text-[#7b2e2f]"
          >
            About Us
          </Link>
          <Link
            to="/services"
            className="whitespace-nowrap text-[15px] text-slate-700 transition hover:text-[#7b2e2f]"
          >
            Services
          </Link>
          <Link
            to="/categories"
            className="whitespace-nowrap text-[15px] text-slate-700 transition hover:text-[#7b2e2f]"
          >
            Categories
          </Link>
        </div>

        {/* RIGHT: Auth */}
        <div className="z-10 flex items-center gap-3 lg:gap-4">
          {token ? (
            <>
              <Link
                to={getDashboardPath()}
                className="hidden whitespace-nowrap rounded-full bg-[#8f3737] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#742c2c] sm:inline-flex"
              >
                {getDashboardLabel()}
              </Link>

              {/* Profile icon + dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d9cfc7] bg-white text-xs font-semibold text-[#7b2e2f] shadow-sm transition hover:border-[#7b2e2f] hover:bg-[#f3ece6]"
                  aria-label="Open profile menu"
                  title="Open profile menu"
                >
                  {getUserInitials()}
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-[1.5rem] border border-[#e7dfd7] bg-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
                    <div className="border-b border-[#efe7e0] bg-[#fbf8f5] px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8f3737] text-sm font-semibold text-white">
                          {getUserInitials()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {user?.full_name || "User"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {user?.username || "No username"}
                          </p>
                          <p className="mt-1 inline-flex rounded-full bg-[#f1ebe6] px-2 py-0.5 text-[10px] font-medium text-[#7b2e2f]">
                            {getRoleLabel()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="px-3 py-3">
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setIsProfileOpen(false)}
                        className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-[#f8f5f2] hover:text-[#7b2e2f]"
                      >
                        Dashboard
                      </Link>

                      <Link
                        to="/profile/edit"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-[#f8f5f2] hover:text-[#7b2e2f]"
                      >
                        Edit Profile
                      </Link>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="mt-1 flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-red-600 transition hover:bg-red-50"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setIsPanelOpen((prev) => !prev)}
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
                <>
                  <Link
                    to="/find-tasker"
                    className="hidden whitespace-nowrap text-sm text-slate-700 transition hover:text-[#7b2e2f] sm:block"
                  >
                    Find a Tasker
                  </Link>
                  <Link
                    to="/client/tasks"
                    className="hidden whitespace-nowrap text-sm text-slate-700 transition hover:text-[#7b2e2f] sm:block"
                  >
                    My Tasks
                  </Link>
                </>
              )}

              {user?.role === "tasker" && (
                <Link
                  to="/tasker/dashboard"
                  className="hidden whitespace-nowrap text-sm text-slate-700 transition hover:text-[#7b2e2f] sm:block"
                >
                  Dashboard
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="whitespace-nowrap rounded-full border border-[#7b2e2f] px-5 py-2.5 text-sm font-medium text-[#7b2e2f] transition hover:bg-[#7b2e2f] hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="whitespace-nowrap text-sm text-slate-700 transition hover:text-[#7b2e2f]"
              >
                Login / Sign Up
              </Link>
              <Link
                to="/register"
                className="whitespace-nowrap rounded-full bg-[#8f3737] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#742c2c]"
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