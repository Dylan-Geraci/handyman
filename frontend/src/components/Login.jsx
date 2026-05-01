import { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

const DEMO_ACCOUNTS = [
  { label: "Mike (Customer)", username: "mike_customer", password: "demo123", emoji: "🧑" },
  { label: "Sarah (Tasker)", username: "alice_builder", password: "demo123", emoji: "🛠️" },
  { label: "Admin", username: "admin", password: "demo123", emoji: "⚙️" },
];

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [demoLoading, setDemoLoading] = useState(null);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const performLogin = async (uname, pwd) => {
    const formData = new FormData();
    formData.append("username", uname);
    formData.append("password", pwd);

    const tokenResponse = await axios.post(`${API_BASE}/token`, formData);
    const accessToken = tokenResponse.data.access_token;
    const loggedInUser = await login(accessToken);

    if (loggedInUser) {
      if (loggedInUser.role === "client") navigate("/client/dashboard");
      else if (loggedInUser.role === "tasker") navigate("/tasker/dashboard");
      else if (loggedInUser.role === "admin") navigate("/admin/dashboard");
    } else {
      throw new Error("Profile load failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await performLogin(username, password);
    } catch (err) {
      setError("Invalid username or password.");
      console.error("Login failed:", err);
    }
  };

  const handleDemoLogin = async (account) => {
    setDemoLoading(account.username);
    setError("");
    try {
      await performLogin(account.username, account.password);
    } catch (err) {
      setError(`Demo login failed for ${account.label}. Did you run the seed script?`);
      console.error(err);
    } finally {
      setDemoLoading(null);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage("");

    try {
      await axios.post(`${API_BASE}/forgot-password`, { email: resetEmail });
      setResetMessage("Password reset link sent. Check your email.");
    } catch (err) {
      setResetMessage("Failed to send reset link.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-[78vh] bg-[#f5f3f1] px-6 py-12">
      <div className="mx-auto grid max-w-[1300px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        {/* Left side */}
        <div className="hidden overflow-hidden rounded-[2rem] border border-[#e7dfd7] bg-[#efe8e1] lg:block">
          <div className="relative h-full min-h-[720px]">
            <img
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1800&auto=format&fit=crop"
              alt="Home help services"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative z-10 flex h-full flex-col justify-end p-10 text-white">
              <p className="mb-4 text-sm uppercase tracking-[0.2em] text-white/80">
                Welcome back
              </p>
              <h1 className="max-w-xl font-serif text-5xl leading-[1.02]">
                Log in and get back to booking help with ease.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/85">
                Clean, simple, and built to match the rest of the site.
              </p>
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-[560px]">
            <div className="mb-6 text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f3737]">
                CRETE Handyman
              </p>
              <h2 className="mt-3 font-serif text-4xl text-slate-900">
                {showResetForm ? "Reset your password" : "Log in"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                {showResetForm
                  ? "Enter your email and we’ll send you a reset link."
                  : "Sign in to manage tasks, messages, and your account."}
              </p>
            </div>

            {DEMO_MODE && !showResetForm && (
              <div className="mb-5 rounded-[2rem] border border-[#2b8f8a]/30 bg-gradient-to-br from-[#2b8f8a]/10 to-[#8f3737]/5 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#2b8f8a]">
                  ✦ Demo Quick Login
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {DEMO_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleDemoLogin(acc)}
                      disabled={demoLoading !== null}
                      className="rounded-2xl border border-[#e7dfd7] bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 shadow-sm transition hover:border-[#2b8f8a] hover:bg-[#fbf8f5] disabled:opacity-50"
                    >
                      <div className="text-xl">{acc.emoji}</div>
                      <div className="mt-1 leading-tight">
                        {demoLoading === acc.username ? "Logging in…" : acc.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-9 font-serif">
              {!showResetForm ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                      placeholder="Enter your email"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                      placeholder="Enter your password"
                    />
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="h-14 w-full rounded-full bg-[#8f3737] text-sm font-semibold text-white transition hover:bg-[#742c2c]"
                  >
                    Log In
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowResetForm(true)}
                    className="block w-full text-center text-sm font-medium text-[#8f3737] transition hover:underline"
                  >
                    Forgot Password?
                  </button>

                  <p className="pt-2 text-center text-sm text-slate-500">
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-[#8f3737] hover:underline"
                    >
                      Create an account
                    </Link>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                      placeholder="Enter your email"
                    />
                  </div>

                  {resetMessage && (
                    <div className="rounded-2xl border border-[#e7dfd7] bg-[#f8f5f2] px-4 py-3 text-sm text-slate-600">
                      {resetMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="h-14 w-full rounded-full bg-[#8f3737] text-sm font-semibold text-white transition hover:bg-[#742c2c]"
                  >
                    Send Reset Link
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowResetForm(false)}
                    className="block w-full text-center text-sm font-medium text-[#8f3737] transition hover:underline"
                  >
                    Back to Login
                  </button>

                  <p className="pt-2 text-center text-sm text-slate-500">
                    Don&apos;t have an account?{" "}
                    <Link
                      to="/register"
                      className="font-semibold text-[#8f3737] hover:underline"
                    >
                      Create an account
                    </Link>
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;