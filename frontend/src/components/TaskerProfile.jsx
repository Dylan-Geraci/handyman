import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const StarRating = ({ rating }) => {
  const rounded = Math.round(Number(rating) || 0);

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          className={`h-5 w-5 ${index < rounded ? "text-yellow-400" : "text-slate-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.368-2.446a1 1 0 00-1.176 0l-3.368 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
};

function TaskerProfile() {
  const { username } = useParams();
  const [tasker, setTasker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const encodedUsername = encodeURIComponent(username);
        const profilePromise = axios.get(
          `http://localhost:8000/api/taskers/${encodedUsername}`
        );
        const reviewsPromise = axios.get(
          `http://localhost:8000/api/reviews/${encodedUsername}`
        );

        const [profileResponse, reviewsResponse] = await Promise.all([
          profilePromise,
          reviewsPromise,
        ]);

        setTasker(profileResponse.data);
        setReviews(reviewsResponse.data || []);
      } catch (err) {
        setError("Could not load tasker profile.");
        console.error("Error fetching profile data:", err);
      }
    };

    fetchProfileData();
  }, [username]);

  if (error) {
    return (
      <div className="min-h-[70vh] bg-[#f5f3f1] px-6 py-10">
        <div className="mx-auto max-w-[900px] rounded-[2rem] border border-red-200 bg-red-50 px-6 py-5 text-red-600">
          {error}
        </div>
      </div>
    );
  }

  if (!tasker) {
    return (
      <div className="min-h-[70vh] bg-[#f5f3f1] px-6 py-10">
        <div className="mx-auto max-w-[900px] rounded-[2rem] border border-[#e7dfd7] bg-white px-6 py-5 text-slate-500">
          Loading profile...
        </div>
      </div>
    );
  }

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        ).toFixed(1)
      : 0;

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-[82vh] bg-[#f5f3f1] px-6 py-10">
      <div className="mx-auto max-w-[1100px]">
        {/* Hero card */}
        <div className="rounded-[2rem] border border-[#e7dfd7] bg-white p-8 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {tasker.profile_image_url ? (
              <img
                src={tasker.profile_image_url}
                alt={tasker.full_name}
                className="h-28 w-28 rounded-full object-cover border border-[#e7dfd7]"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#2b8f8a] text-3xl font-semibold text-white">
                {getInitials(tasker.full_name)}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f3737]">
                Tasker Profile
              </p>
              <h1 className="mt-3 font-serif text-4xl text-slate-900">
                {tasker.full_name}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {tasker.location || "Location not specified"}
              </p>

              {reviews.length > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <StarRating rating={averageRating} />
                  <span className="text-sm font-semibold text-slate-700">
                    {averageRating}
                  </span>
                  <span className="text-sm text-slate-500">
                    ({reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left column */}
          <div className="space-y-8">
            {tasker.bio && (
              <section className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
                  About
                </p>
                <h2 className="mt-2 font-serif text-3xl text-slate-900">
                  About Me
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {tasker.bio}
                </p>
              </section>
            )}

            <section className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
                Skills
              </p>
              <h2 className="mt-2 font-serif text-3xl text-slate-900">
                What I Do
              </h2>

              {tasker.skills && tasker.skills.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {tasker.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="rounded-full border border-[#d7eceb] bg-[#eef8f7] px-4 py-2 text-sm font-medium text-[#2b8f8a]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No skills listed.</p>
              )}
            </section>
          </div>

          {/* Reviews */}
          <section className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
              Reviews
            </p>
            <h2 className="mt-2 font-serif text-3xl text-slate-900">
              Client Reviews
            </h2>

            {reviews.length > 0 ? (
              <div className="mt-6 space-y-5">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] p-5"
                  >
                    <StarRating rating={review.rating} />
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {review.comment}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      Reviewed by {review.client_username}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] px-5 py-6 text-sm text-slate-500">
                This tasker has no reviews yet.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default TaskerProfile;