import { useMemo, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";

function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    navigate("/find-tasker", { state: { query: searchQuery } });
  };

  const heroImageUrl =
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1800&auto=format&fit=crop";

  const topCategories = useMemo(
    () => [
      { label: "Furniture Assembly" },
      { label: "TV Mounting" },
      { label: "Cleaning" },
      { label: "Help Moving" },
      { label: "Yardwork" },
      { label: "Home Repairs" },
      { label: "Painting" },
      { label: "Mounting" },
    ],
    []
  );

  const reviews = [
    {
      name: "Maria G.",
      quote: "Super easy to book and everything was done the same day.",
    },
    {
      name: "James R.",
      quote: "The process felt simple, clear, and way less stressful.",
    },
    {
      name: "Elena V.",
      quote: "Communication was easy and I found help fast.",
    },
    {
      name: "Daniel T.",
      quote: "Clean design, quick booking, and a smooth experience overall.",
    },
  ];

  return (
    <div className="bg-[#f6f4f2] text-slate-900">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8 py-6">
        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden border border-[#e7dfd7] bg-[#ebe5df]"
        >
          <div className="relative h-[320px] sm:h-[380px] md:h-[430px] lg:h-[470px]">
            <img
              src={heroImageUrl}
              alt="Home services"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-[rgba(60,38,22,0.18)]" />

            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
              <h1
                className="max-w-4xl text-white font-serif leading-[0.98]
                text-4xl sm:text-5xl md:text-6xl lg:text-[4.4rem]"
              >
                Book Reliable
                <br />
                Home Help Today
              </h1>

              <form
                onSubmit={handleSearch}
                className="mt-8 flex w-full max-w-[560px] items-center overflow-hidden rounded-full border border-[#d8d0c8] bg-white shadow-sm"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you need help with?"
                  className="w-full bg-transparent px-5 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-[46px] w-[56px] items-center justify-center border-l border-[#e7dfd7] text-slate-600 transition hover:bg-[#f7f3ef]"
                  aria-label="Search"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                </button>
              </form>

              {!user && (
                <div className="mt-5">
                  <Link
                    to="/register"
                    className="text-sm text-white/90 underline underline-offset-4 hover:text-white"
                  >
                    New here? Create an account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* TOP CATEGORIES */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-10"
        >
          <h2 className="text-[2rem] font-serif text-slate-900">Top Categories</h2>

          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {topCategories.map((cat, idx) => (
              <motion.button
                key={cat.label}
                onClick={() =>
                  navigate("/categories", { state: { focus: cat.label } })
                }
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                whileHover={{ y: -2 }}
                className="min-h-[118px] border border-[#ece7e2] bg-[#f3efec] p-4 text-left transition hover:bg-[#eee8e2]"
              >
                <p className="text-sm font-medium text-slate-800">{cat.label}</p>
                <p className="mt-2 text-[11px] text-slate-400">
                  Find trusted help near you
                </p>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* REVIEWS */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-12"
        >
          <h2 className="text-[2rem] font-serif text-slate-900">Reviews</h2>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
            {reviews.map((review, idx) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                className="min-h-[120px] border border-[#ece7e2] bg-[#f7f4f1] p-4"
              >
                <div className="mb-2 h-2 w-2 rounded-full bg-[#b58ce0]" />
                <p className="text-sm text-slate-700">{review.quote}</p>
                <p className="mt-4 text-xs text-slate-500">{review.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}

export default Home;