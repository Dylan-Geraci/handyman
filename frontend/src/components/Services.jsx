// src/components/Services.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import SkeletonLoader from './SkeletonLoader';

// ── Static demo service categories shown even without backend data ──
const DEMO_SERVICES = [
  {
    id: 'plumbing',
    name: 'Plumbing',
    description: 'Leaky faucets, pipe repairs, toilet installs, drain clogs, and water heater work. Our taskers handle it all quickly and cleanly.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'electrical',
    name: 'Electrical',
    description: 'Outlet replacements, ceiling fan installs, light fixtures, smart home wiring, and panel troubleshooting by certified pros.',
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'painting',
    name: 'Painting',
    description: 'Interior and exterior painting, trim work, accent walls, and touch-ups. We prep, paint, and clean up — you just pick the color.',
    color: 'text-green-600',
    bg: 'bg-green-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
      </svg>
    ),
  },
  {
    id: 'assembly',
    name: 'Furniture Assembly',
    description: 'IKEA, Wayfair, Amazon — any flat-pack furniture assembled fast and correctly. Beds, desks, shelves, wardrobes, and more.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
      </svg>
    ),
  },
  {
    id: 'moving',
    name: 'Help Moving',
    description: 'Loading, unloading, rearranging furniture, and heavy lifting. Whether it\'s one room or a full move, we\'ve got the muscle.',
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'yardwork',
    name: 'Yardwork & Outdoor',
    description: 'Lawn mowing, hedge trimming, leaf blowing, gutter cleaning, and general yard clean-ups to keep your outdoor space sharp.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
  },
  {
    id: 'mounting',
    name: 'TV & Mounting',
    description: 'TV wall mounts, picture hanging, shelving brackets, and mirror installs. We bring the drill — you bring the vision.',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'cleaning',
    name: 'Deep Cleaning',
    description: 'Move-in/move-out cleans, post-renovation clean-ups, and one-time deep cleans. Every surface, every corner.',
    color: 'text-cyan-600',
    bg: 'bg-cyan-50',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
];

const howItWorks = [
  { step: '01', title: 'Post your task', description: 'Describe what you need, choose a category, and set your location. Takes under two minutes.' },
  { step: '02', title: 'Get matched', description: 'Our system surfaces verified taskers in your area who specialize in exactly what you need.' },
  { step: '03', title: 'Chat & confirm', description: 'Message your tasker directly, agree on timing, and track progress all in one place.' },
  { step: '04', title: 'Done & reviewed', description: 'Once complete, leave a review so the community knows who the best taskers are.' },
];

function Services() {
  const [apiServices, setApiServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios.get('http://localhost:8000/api/services')
      .then(response => setApiServices(Array.isArray(response.data) ? response.data : []))
      .catch(() => setApiServices([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="w-full space-y-20">

      {/* ── Hero ── */}
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-red-600">What We Offer</p>
        <h1 className="mt-3 font-serif text-[2.8rem] leading-tight text-slate-900 sm:text-[3.4rem]">
          Every job, one platform
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          From fixing a leaky faucet to assembling an entire room of furniture, CRETE connects you with skilled local taskers who get it done right.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="rounded-full bg-[#8f3737] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#742c2c]"
          >
            Post a Task
          </Link>
          <Link
            to="/categories"
            className="rounded-full border border-[#c9b8b8] px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#7b2e2f] hover:text-[#7b2e2f]"
          >
            Browse Categories
          </Link>
        </div>
      </section>

      {/* ── Service Cards (demo) ── */}
      <section>
        <h2 className="mb-8 font-serif text-[2rem] text-slate-900 sm:text-[2.4rem]">Our Services</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_SERVICES.map((service) => (
            <div
              key={service.id}
              className="group rounded-2xl border border-[#e7dfd7] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-full ${service.bg} ${service.color}`}>
                {service.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="rounded-2xl border border-[#e7dfd7] bg-[#f8f5f2] px-8 py-12">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600">The Process</p>
          <h2 className="mt-3 font-serif text-[2rem] text-slate-900 sm:text-[2.4rem]">How it works</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step) => (
            <div key={step.step} className="flex flex-col">
              <span className="mb-3 font-serif text-4xl text-red-200">{step.step}</span>
              <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live services from API (shown only if backend returns data) ── */}
      {(isLoading || apiServices.length > 0) && (
        <section>
          <h2 className="mb-8 font-serif text-[2rem] text-slate-900 sm:text-[2.4rem]">
            Available Now
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? [...Array(3)].map((_, i) => <SkeletonLoader key={i} />)
              : apiServices.map((service) => (
                  <div
                    key={service._id}
                    className="rounded-2xl border border-[#e7dfd7] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-50">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">{service.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{service.description}</p>
                  </div>
                ))}
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section className="rounded-2xl border border-[#e7dfd7] bg-[#f8f5f2] px-8 py-14 text-center">
        <h2 className="font-serif text-[2rem] text-slate-900 sm:text-[2.4rem]">
          Don't see what you need?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-slate-600">
          Browse all our categories or describe your task and let our AI find the right tasker for you.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/categories"
            className="rounded-full bg-[#8f3737] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#742c2c]"
          >
            View All Categories
          </Link>
          <Link
            to="/find-tasker"
            className="rounded-full border border-[#c9b8b8] px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#7b2e2f] hover:text-[#7b2e2f]"
          >
            AI Tasker Search
          </Link>
        </div>
      </section>

    </div>
  );
}

export default Services;