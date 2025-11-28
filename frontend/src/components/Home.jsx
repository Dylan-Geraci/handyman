import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/find-tasker', { state: { query: searchQuery } });
  };

  const heroImageUrl =
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1600&auto=format&fit=crop';

  const softRed = {
    main: 'bg-[#E65A5A]',
    hover: 'hover:bg-[#D94E4E]',
    text: 'text-[#E65A5A]',
  };

  const topCategories = [
    { label: 'Furniture Assembly', emoji: '🪑' },
    { label: 'TV Mounting', emoji: '📺' },
    { label: 'Cleaning', emoji: '🧹' },
    { label: 'Help Moving', emoji: '🚚' },
    { label: 'Yardwork', emoji: '🌿' },
  ];

  return (
    <div className="space-y-16">
      {/* --- Hero Section --- */}
      <section className="rounded-3xl bg-gradient-to-b from-neutral-100 to-neutral-50 p-3 sm:p-4">
        <div className="rounded-2xl bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)] border border-[#F5C8C8]/60 overflow-hidden transition-transform duration-300 hover:-translate-y-[2px]">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Left: text */}
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <h1 className="mt-1 text-3xl md:text-4xl lg:text-[2.6rem] font-semibold text-slate-900 tracking-tight leading-tight">
                Your to-do list,
                <span className={`font-semibold ${softRed.text}`}> done.</span>
              </h1>

              <p className="mt-4 text-sm md:text-base text-slate-600 leading-relaxed max-w-md">
                Describe your task once and let CRETE match you with vetted, local
                Taskers for assembly, mounting, moving, cleaning, and more.
              </p>

              {user && user.role === 'client' ? (
                <form
                  onSubmit={handleSearch}
                  className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="I need help fixing a leaky faucet..."
                    className="w-full px-4 py-3 border border-neutral-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#E65A5A]"
                  />
                  <button
                    type="submit"
                    className={`whitespace-nowrap rounded-md ${softRed.main} px-5 py-3 text-sm font-semibold text-white shadow-sm ${softRed.hover} transition-transform duration-150 hover:-translate-y-[1px]`}
                  >
                    Find Help
                  </button>
                </form>
              ) : (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    to="/register"
                    className={`inline-flex items-center justify-center rounded-full ${softRed.main} px-6 py-3 text-sm font-semibold text-white shadow-sm ${softRed.hover} transition-transform duration-150 hover:-translate-y-[1px]`}
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/register"
                    className="text-xs md:text-sm text-slate-600 hover:text-[#E65A5A]"
                  >
                    Want to earn money as a Tasker? Sign up here.
                  </Link>
                </div>
              )}

              {/* Tiny trust strip */}
              <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-semibold text-white">
                    4.9
                  </span>
                  <span>Average Tasker rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Same-day help in most cities</span>
                </div>
              </div>
            </div>

            {/* Right: image */}
            <div className="relative">
              <img
                src={heroImageUrl}
                alt="Handyman at work"
                className="h-full w-full object-cover"
              />
              <div className="absolute bottom-4 left-4 rounded-lg bg-black/60 px-4 py-2 text-[11px] text-gray-100 shadow-sm">
                <p className="font-medium">On site in as little as 2 hours</p>
                <p className="text-[10px] text-gray-300">
                  Assembly • Mounting • Moving • Cleaning
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Top Categories Row --- */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Top categories
          </h2>
          <Link
            to="/categories"
            className="text-xs font-medium text-slate-500 hover:text-[#E65A5A] transition-colors"
          >
            View all
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
          {topCategories.map((cat) => (
            <button
              key={cat.label}
              onClick={() =>
                navigate('/categories', { state: { focus: cat.label } })
              }
              className="group flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-700 shadow-sm hover:shadow-md hover:border-[#F5C8C8] transition-all duration-150"
            >
              <span className="text-base">{cat.emoji}</span>
              <span className="group-hover:text-[#E65A5A]">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* --- Why choose CRETE? --- */}
      <section className="space-y-6">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900">
          Why choose CRETE?
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-4 text-left transition-transform duration-150 hover:-translate-y-[2px] hover:shadow-md">
            <p className="text-sm font-semibold text-slate-900">Vetted Taskers</p>
            <p className="mt-2 text-sm text-slate-600">
              Profiles, reviews, and ratings help you book people who have proven
              experience with the tasks you need.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-4 text-left transition-transform duration-150 hover:-translate-y-[2px] hover:shadow-md">
            <p className="text-sm font-semibold text-slate-900">Transparent pricing</p>
            <p className="mt-2 text-sm text-slate-600">
              See hourly rates and estimates up front, with no surprise fees at the end
              of the job.
            </p>
          </div>
          <div className="rounded-xl bg-white border border-neutral-200 shadow-sm p-4 text-left transition-transform duration-150 hover:-translate-y-[2px] hover:shadow-md">
            <p className="text-sm font-semibold text-slate-900">
              Same-day availability
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Get help today for urgent tasks, or schedule for a time that fits your
              calendar.
            </p>
          </div>
        </div>
      </section>

      {/* --- How it works --- */}
      <section className="text-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-slate-900">
          How it works
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">
          Simple steps to get your task completed.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              n: 1,
              title: 'Describe your task',
              body:
                'Tell us what you need done using smart search or by browsing categories.',
            },
            {
              n: 2,
              title: 'Choose your Tasker',
              body:
                'Compare profiles, reviews, and prices. Pick the best fit for your job.',
            },
            {
              n: 3,
              title: 'Get it done',
              body:
                'Chat, schedule, and pay securely once the work is complete.',
            },
          ].map((step) => (
            <div
              key={step.n}
              className="flex flex-col items-center px-4 rounded-xl bg-white border border-neutral-200 shadow-sm py-6 transition-transform duration-150 hover:-translate-y-[2px] hover:shadow-md"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${softRed.main} text-white text-sm font-semibold shadow-sm`}>
                {step.n}
              </div>
              <h3 className="mt-4 text-base md:text-lg font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- Testimonials --- */}
      <section className="space-y-6 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-slate-900 text-center">
          What people are saying
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              name: 'Maria G.',
              role: 'Client • Furniture Assembly',
              quote:
                'My Tasker assembled three pieces of furniture in under an hour. I booked in the morning and it was done by lunch.',
            },
            {
              name: 'James R.',
              role: 'Tasker • Mounting & Repairs',
              quote:
                'CRETE makes it easy to find consistent work that fits around my schedule. The app handles all the details.',
            },
            {
              name: 'Elena V.',
              role: 'Client • Moving Help',
              quote:
                'Booking moving help through CRETE saved me hours of stress. Communication and payment were super smooth.',
            },
          ].map((t) => (
            <div
              key={t.name}
              className="rounded-xl bg-white border border-neutral-200 shadow-sm p-5 text-left flex flex-col justify-between transition-transform duration-150 hover:-translate-y-[2px] hover:shadow-md"
            >
              <p className="text-sm text-slate-700">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 text-xs text-slate-500">
                <p className="font-semibold text-slate-900">{t.name}</p>
                <p>{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
