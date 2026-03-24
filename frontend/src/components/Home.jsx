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
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2200&auto=format&fit=crop";

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
    <div className="w-full bg-[#f5f3f1] text-slate-900">
      <div className="w-full">
        {/* HERO */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full border-y border-[#e7dfd7] bg-[#f1ece6]"
        >
          <div className="relative h-[72vh] min-h-[520px] w-full overflow-hidden md:h-[78vh] md:min-h-[620px]">
            <img
              src={heroImageUrl}
              alt="Home services"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-black/25" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/10 to-black/30" />

            <div className="relative z-10 mx-auto flex h-full w-full max-w-[1400px] flex-col items-center justify-center px-6 text-center sm:px-10">
              <h1
                className="max-w-5xl text-white font-serif leading-[0.95]
                text-5xl sm:text-6xl md:text-7xl lg:text-[6rem]"
              >
                Book Reliable
                <br />
                Home Help Today
              </h1>

              <form
                onSubmit={handleSearch}
                className="mt-8 flex w-full max-w-[760px] items-center overflow-hidden rounded-full bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What do you need help with?"
                  className="h-[58px] w-full bg-transparent px-6 text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-[58px] w-[72px] items-center justify-center border-l border-[#e9e2da] text-slate-600 transition hover:bg-[#f7f3ef]"
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
                    className="text-sm font-medium text-white/95 underline underline-offset-4 transition hover:text-white"
                  >
                    New here? Create an account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        {/* CONTENT */}
        <div className="mx-auto w-full max-w-[1400px] px-5 py-14 sm:px-8 lg:px-10">
          {/* TOP CATEGORIES */}
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <h2 className="text-[2.3rem] font-serif text-slate-900 sm:text-[2.7rem]">
              Top Categories
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {topCategories.map((cat, idx) => (
                <motion.button
                  key={cat.label}
                  onClick={() =>
                    navigate("/categories", { state: { focus: cat.label } })
                  }
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                  whileHover={{ y: -2 }}
                  className="min-h-[150px] border border-[#e7dfd7] bg-[#f8f5f2] px-5 py-6 text-left transition hover:bg-[#f1ebe6]"
                >
                  <p className="text-lg font-medium text-slate-900">{cat.label}</p>
                  <p className="mt-3 text-sm text-slate-500">
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
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-16"
          >
            <h2 className="text-[2.3rem] font-serif text-slate-900 sm:text-[2.7rem]">
              Reviews
            </h2>

            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              {reviews.map((review, idx) => (
                <motion.div
                  key={review.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                  className="min-h-[170px] border border-[#e7dfd7] bg-[#faf7f4] p-6"
                >
                  <div className="mb-4 h-2.5 w-2.5 rounded-full bg-[#b58ce0]" />
                  <p className="text-base leading-7 text-slate-700">{review.quote}</p>
                  <p className="mt-6 text-sm text-slate-500">{review.name}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}

export default Home;