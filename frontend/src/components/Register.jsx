import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    password: "",
    role: "client",
    skills: "",
    location: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const registrationData = {
      ...formData,
      skills:
        formData.role === "tasker"
          ? formData.skills.split(",").map((skill) => skill.trim())
          : [],
    };

    try {
      await axios.post("http://localhost:8000/register", registrationData);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-[82vh] bg-[#f5f3f1] px-6 py-12">
      <div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[0.98fr_1.02fr] lg:items-stretch">
        {/* Left panel */}
        <div className="hidden overflow-hidden rounded-[2rem] border border-[#e7dfd7] bg-[#efe8e1] lg:block">
          <div className="relative h-full min-h-[780px]">
            <img
              src="https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1800&auto=format&fit=crop"
              alt="Create account"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative z-10 flex h-full flex-col justify-end p-10 text-white">
              <p className="mb-4 text-sm uppercase tracking-[0.2em] text-white/80">
                Join CRETE
              </p>
              <h1 className="max-w-xl font-serif text-5xl leading-[1.02]">
                Create your account and get started.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-6 text-white/85">
                Whether you need help done or want to work as a tasker, this gets you in the door.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-[620px]">
            <div className="mb-6 text-center lg:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f3737]">
                New account
              </p>
              <h2 className="mt-3 font-serif text-4xl text-slate-900">
                Create an account
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Choose your role, fill in your details, and you’re ready to go.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-9 font-serif"
            >
              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    I am a...
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737] font-sans"
                  >
                    <option value="client">Client (I need work done)</option>
                    <option value="tasker">Tasker (I'm looking for work)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737] font-sans"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737] font-sans"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737] font-sans"
                    placeholder="Create a password"
                  />
                </div>

                {formData.role === "tasker" && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Skills
                      </label>
                      <input
                        type="text"
                        name="skills"
                        placeholder="e.g. plumbing, electrical, moving"
                        value={formData.skills}
                        onChange={handleChange}
                        className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737] font-sans"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        placeholder="e.g. Fullerton, CA"
                        value={formData.location}
                        onChange={handleChange}
                        className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737] font-sans"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 font-sans">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 font-sans">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  className="mt-1 h-14 w-full rounded-full bg-[#8f3737] text-sm font-semibold text-white transition hover:bg-[#742c2c]"
                >
                  Create Account
                </button>

                <p className="pt-1 text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-[#8f3737] hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
