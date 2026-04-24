import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

function EditProfile() {
  const { user, token, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    location: "",
    skills: "",
    profile_image_url: "",
    bio: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        location: user.location || "",
        skills: user.skills ? user.skills.join(", ") : "",
        profile_image_url: user.profile_image_url || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const updateData = {
      ...formData,
      skills: formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      await axios.put("http://localhost:8000/users/me", updateData, config);
      await login(token);
      setMessage("Profile updated successfully!");
      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      setMessage("Failed to update profile.");
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="min-h-[82vh] bg-[#f5f3f1] px-6 py-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f3737]">
            Account
          </p>
          <h1 className="mt-3 font-serif text-4xl text-slate-900 sm:text-5xl">
            Edit Profile
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Keep your information up to date so your account looks polished and
            your matches stay accurate.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left panel */}
          <div className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
              Preview
            </p>
            <h2 className="mt-2 font-serif text-3xl text-slate-900">
              Your Profile
            </h2>

            <div className="mt-6 flex items-center gap-4">
              {formData.profile_image_url ? (
                <img
                  src={formData.profile_image_url}
                  alt={formData.full_name || "Profile"}
                  className="h-20 w-20 rounded-full border border-[#e7dfd7] object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#8f3737] text-xl font-semibold text-white">
                  {(formData.full_name || user?.username || "U")
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}

              <div>
                <p className="text-lg font-semibold text-slate-900">
                  {formData.full_name || "Your Name"}
                </p>
                <p className="text-sm text-slate-500">
                  {formData.location || "Location not added yet"}
                </p>
                <p className="mt-1 inline-flex rounded-full bg-[#f1ebe6] px-2 py-0.5 text-[10px] font-medium text-[#7b2e2f]">
                  {user?.role
                    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    : "User"}
                </p>
              </div>
            </div>

            {user?.role === "tasker" && (
              <>
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-slate-900">Skills</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.skills
                      .split(",")
                      .map((skill) => skill.trim())
                      .filter(Boolean).length > 0 ? (
                      formData.skills
                        .split(",")
                        .map((skill) => skill.trim())
                        .filter(Boolean)
                        .map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-full border border-[#d7eceb] bg-[#eef8f7] px-3 py-1 text-xs font-medium text-[#2b8f8a]"
                          >
                            {skill}
                          </span>
                        ))
                    ) : (
                      <p className="text-sm text-slate-500">No skills added yet.</p>
                    )}
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-slate-900">Bio</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {formData.bio || "No bio added yet."}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
              Update
            </p>
            <h2 className="mt-2 font-serif text-3xl text-slate-900">
              Edit Details
            </h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                />
              </div>

              {user?.role === "tasker" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Skills
                    </label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      placeholder="e.g. plumbing, electrical, mounting"
                      className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Profile Picture URL
                    </label>
                    <input
                      type="text"
                      name="profile_image_url"
                      value={formData.profile_image_url}
                      onChange={handleChange}
                      placeholder="Paste an image URL"
                      className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows="5"
                      className="w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 py-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
                    />
                  </div>
                </>
              )}

              {message && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    message.includes("successfully")
                      ? "border border-green-200 bg-green-50 text-green-700"
                      : "border border-red-200 bg-red-50 text-red-600"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="h-14 flex-1 rounded-full bg-[#8f3737] px-6 text-sm font-semibold text-white transition hover:bg-[#742c2c]"
                >
                  Save Changes
                </button>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="h-14 flex-1 rounded-full border border-[#d9cfc7] bg-white px-6 text-sm font-semibold text-slate-700 transition hover:bg-[#f8f5f2]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;