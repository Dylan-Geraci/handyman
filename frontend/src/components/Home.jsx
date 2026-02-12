import { useMemo, useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { softRed, neutrals } from "../styles/theme";
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
      {
        label: "Furniture Assembly",
        image:
          "https://images.unsplash.com/photo-1581539250439-c96689b516dd?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "TV Mounting",
        image:
          "https://images.unsplash.com/photo-1602293589930-45aad59ba3db?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Cleaning",
        image:
          "https://images.unsplash.com/photo-1581579185169-812f6d2f8c8b?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Help Moving",
        image:
          "https://images.unsplash.com/photo-1600518464441-9154a57e9a9b?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Yardwork",
        image:
          "https://images.unsplash.com/photo-1599687266572-3c5bff5f6d41?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Home Repairs",
        image:
          "https://images.unsplash.com/photo-1585128792020-803d29415281?q=80&w=1200&auto=format&fit=crop",
      },
    ],
    []
  );

  const container = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: "easeOut", staggerChildren: 0.06 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="space-y-16"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-[#FFF8F5] shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        {/* subtle moving background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-25"
            style={{
              background:
                "radial-gradient(circle, rgba(249,115,91,0.95) 0%, rgba(249,115,91,0) 60%)",
            }}
            animate={{ x: [0, 18, -10, 0], y: [0, 12, -8, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute -bottom-48 -right-48 h-[640px] w-[640px] rounded-full blur-3xl opacity-25"
            style={{
              background:
                "radial-gradient(circle, rgba(253,232,228,1) 0%, rgba(253,232,228,0) 65%)",
            }}
            animate={{ x: [0, -14, 10, 0], y: [0, -10, 14, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/65 to-white" />
        </div>

        <div className="relative grid gap-8 md:grid-cols-2">
          {/* Left */}
          <motion.div className="p-8 md:p-10" variants={item}>
            <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1 text-xs text-slate-700 backdrop-blur-sm">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              Quick matches
              <span className="text-slate-400">•</span>
              Easy scheduling
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl lg:text-[2.65rem] font-semibold text-slate-900 tracking-tight leading-tight">
              Need a hand?
              <span className={`block ${softRed.text}`}>Book help in minutes.</span>
            </h1>

            <p className="mt-4 text-sm md:text-base text-slate-600 leading-relaxed max-w-md">
              Post what you need, choose a category, and we’ll help you find someone local
              who’s a good fit.
            </p>

            {/* Client search */}
            {user && user.role === "client" ? (
              <form
                onSubmit={handleSearch}
                className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <div className="relative w-full">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Try: "Mount a TV in Fullerton"'
                    className="w-full rounded-xl border border-neutral-300 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/60"
                  />
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
                    optional
                  </div>
                </div>

                <button
                  type="submit"
                  className={`whitespace-nowrap rounded-xl ${softRed.main} px-5 py-3 text-sm font-semibold text-white shadow-sm ${softRed.hover} transition-transform duration-150 hover:-translate-y-[1px]`}
                >
                  Find a Tasker
                </button>
              </form>
            ) : (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className={`inline-flex items-center justify-center rounded-xl ${softRed.main} px-6 py-3 text-sm font-semibold text-white shadow-sm ${softRed.hover} transition-transform duration-150 hover:-translate-y-[1px]`}
                >
                  Get Started
                </Link>

                <Link
                  to="/register"
                  className="text-xs md:text-sm text-slate-600 hover:text-[#E65A5A]"
                >
                  Want to earn as a Tasker? Sign up here.
                </Link>
              </div>
            )}

            {/* Trust strip */}
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
              {[
                { k: "4.9", v: "avg rating" },
                { k: "Same-day", v: "in many areas" },
                { k: "Secure", v: "chat + payments" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm"
                >
                  <div className="text-lg font-semibold text-slate-900">{s.k}</div>
                  <div className="text-[11px] text-slate-500">{s.v}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right */}
          <motion.div className="relative" variants={item}>
            <motion.img
              src={heroImageUrl}
              alt="Handyman at work"
              className="h-full w-full object-cover"
              initial={{ scale: 1.03 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />

            {/* Floating callouts */}
            <motion.div
              className="absolute left-4 top-4 rounded-2xl bg-white/85 backdrop-blur-sm border border-neutral-200 px-4 py-3 shadow-md"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
            >
              <div className="text-xs text-slate-500">Nearby now</div>
              <div className="text-sm font-semibold text-slate-900">Taskers available</div>
              <div className="text-[11px] text-slate-600">Assembly • Cleaning • Mounting</div>
            </motion.div>

            <motion.div
              className="absolute bottom-4 left-4 rounded-2xl bg-black/65 px-4 py-3 text-[11px] text-gray-100 shadow-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.55 }}
            >
              <p className="font-medium">Book today or schedule ahead</p>
              <p className="text-[10px] text-gray-300">Fast, clear, and simple</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES (image tiles) */}
      <motion.section variants={item} className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Popular categories
          </h2>
          <Link
            to="/categories"
            className="text-xs font-medium text-slate-500 hover:text-[#E65A5A] transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {topCategories.map((cat, idx) => (
            <motion.button
              key={cat.label}
              onClick={() => navigate("/categories", { state: { focus: cat.label } })}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md transition-transform"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: idx * 0.03 }}
            >
              <div className="absolute inset-0">
                <img
                  src={cat.image}
                  alt={cat.label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              </div>

              <div className="relative flex items-end justify-between p-4 min-h-[130px]">
                <div>
                  <div className="text-white font-semibold leading-snug">
                    {cat.label}
                  </div>
                  <div className="mt-1 text-[11px] text-white/80">Browse</div>
                </div>

                <div className="rounded-full bg-white/20 border border-white/25 px-3 py-1 text-[11px] text-white backdrop-blur-sm">
                  Quick
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* HOW IT WORKS */}
      <motion.section variants={item} className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
          How it works
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Post a task, pick someone you like, and you’re set.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { n: 1, title: "Post your task", body: "Describe what you need and choose a category." },
            { n: 2, title: "Pick your Tasker", body: "Compare profiles and reviews, then message." },
            { n: 3, title: "Get it done", body: "Schedule and pay securely when it’s complete." },
          ].map((step, idx) => (
            <motion.div
              key={step.n}
              className="flex flex-col items-center px-4 rounded-2xl bg-white border border-neutral-200 shadow-sm py-7 hover:shadow-md"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
              whileHover={{ y: -3 }}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-full ${softRed.main} text-white text-sm font-semibold shadow-sm`}>
                {step.n}
              </div>
              <h3 className="mt-4 text-base md:text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 max-w-[28ch]">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* WHY */}
      <motion.section variants={item} className="space-y-6">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
          Why people use CRETE
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Real profiles + reviews",
              body: "It’s easier to book when you can see what someone’s good at.",
            },
            {
              title: "Clear categories",
              body: "No guessing. Tasks and task types keep things organized.",
            },
            {
              title: "Everything in one place",
              body: "Chat, scheduling, and payments stay inside the app.",
            },
          ].map((c, idx) => (
            <motion.div
              key={c.title}
              className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-5 text-left hover:shadow-md"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
              whileHover={{ y: -3 }}
            >
              <p className="text-sm font-semibold text-slate-900">{c.title}</p>
              <p className="mt-2 text-sm text-slate-600">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* TESTIMONIALS */}
      <motion.section variants={item} className="space-y-6 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 text-center">
          What people say
        </h2>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: "Maria G.",
              role: "Client • Furniture Assembly",
              quote: "Booked in the morning and it was done before lunch.",
            },
            {
              name: "James R.",
              role: "Tasker • Mounting",
              quote: "I get jobs that actually match what I do, which is huge.",
            },
            {
              name: "Elena V.",
              role: "Client • Moving Help",
              quote: "Communication was easy and payment was simple.",
            },
          ].map((t, idx) => (
            <motion.div
              key={t.name}
              className="rounded-2xl bg-white border border-neutral-200 shadow-sm p-6 text-left flex flex-col justify-between hover:shadow-md"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
              whileHover={{ y: -3 }}
            >
              <p className="text-sm text-slate-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-5 text-xs text-slate-500">
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p>{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {!user && (
          <div className="flex justify-center pt-2">
            <Link
              to="/register"
              className={`inline-flex items-center justify-center rounded-xl ${softRed.main} px-6 py-3 text-sm font-semibold text-white shadow-sm ${softRed.hover} transition-transform duration-150 hover:-translate-y-[1px]`}
            >
              Make an account
            </Link>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
}

export default Home;
