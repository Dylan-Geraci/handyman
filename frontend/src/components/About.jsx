// src/components/About.jsx
import { Link } from 'react-router-dom';

const stats = [
  { value: '500+', label: 'Tasks Completed' },
  { value: '120+', label: 'Verified Taskers' },
  { value: '4.8★', label: 'Average Rating' },
  { value: '15+', label: 'Service Categories' },
];

const team = [
  {
    name: 'Alex Rivera',
    role: 'Co-Founder & CEO',
    initials: 'AR',
    bio: 'Former contractor turned tech entrepreneur. Built CRETE to solve the problem he lived every day — unreliable help and no easy way to find trusted professionals.',
  },
  {
    name: 'Jordan Kim',
    role: 'Co-Founder & CTO',
    initials: 'JK',
    bio: 'Full-stack engineer with a background in marketplace platforms. Passionate about building tools that make local economies work better for everyone.',
  },
  {
    name: 'Priya Mehta',
    role: 'Head of Tasker Success',
    initials: 'PM',
    bio: 'Works directly with taskers to ensure every professional on the platform has the support, training, and tools to do their best work.',
  },
];

const values = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Trust First',
    description: 'Every tasker is vetted before joining the platform. We verify identities and review work history so you never have to guess.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Speed & Simplicity',
    description: 'Post a task in under two minutes. Our matching system surfaces the right taskers fast — no endless back-and-forth.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Community',
    description: 'CRETE exists to support local workers and local homeowners. Every task posted puts money in someone\'s pocket nearby.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Clear Communication',
    description: 'Built-in messaging, status updates, and reviews keep both sides informed from first contact to task completion.',
  },
];

function About() {
  return (
    <div className="w-full space-y-20">

      {/* ── Hero ── */}
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Our Story</p>
        <h1 className="mt-3 font-serif text-[2.8rem] leading-tight text-slate-900 sm:text-[3.4rem]">
          Reliable help.<br />Closer than you think.
        </h1>
        <p className="mt-6 text-lg leading-8 text-slate-600">
          CRETE Handyman was built out of frustration. Finding dependable local help — a plumber, a mover, someone to assemble furniture — shouldn't require hours of searching and crossing your fingers. We built a platform that makes it as easy as it should be.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="rounded-full bg-[#8f3737] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#742c2c]"
          >
            Become a Tasker
          </Link>
          <Link
            to="/categories"
            className="rounded-full border border-[#c9b8b8] px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#7b2e2f] hover:text-[#7b2e2f]"
          >
            Browse Categories
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="grid grid-cols-2 gap-px border border-[#e7dfd7] bg-[#e7dfd7] md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-[#f8f5f2] px-8 py-10 text-center">
            <p className="font-serif text-[2.6rem] text-slate-900">{s.value}</p>
            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ── Mission ── */}
      <section className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Mission</p>
          <h2 className="mt-3 font-serif text-[2rem] text-slate-900 sm:text-[2.4rem]">
            Making skilled work<br />accessible to everyone
          </h2>
          <p className="mt-5 leading-7 text-slate-600">
            We believe skilled tradespeople deserve a modern way to find consistent work — and homeowners deserve a fast, trustworthy way to get things done. CRETE connects both sides with a platform built around transparency, reviews, and real-time communication.
          </p>
          <p className="mt-4 leading-7 text-slate-600">
            Whether you need a one-time fix or a recurring service, our taskers are vetted, rated, and ready. No middlemen, no guesswork.
          </p>
        </div>
        {/* Visual block */}
        <div className="grid grid-cols-2 gap-3">
          {['Plumbing', 'Electrical', 'Painting', 'Assembly', 'Moving', 'Yardwork'].map((tag) => (
            <div
              key={tag}
              className="flex items-center gap-2 rounded-xl border border-[#e7dfd7] bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
            >
              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
              {tag}
            </div>
          ))}
        </div>
      </section>

      {/* ── Values ── */}
      <section>
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600">What We Stand For</p>
          <h2 className="mt-3 font-serif text-[2rem] text-slate-900 sm:text-[2.4rem]">Our values</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-[#e7dfd7] bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600">
                {v.icon}
              </div>
              <h3 className="text-base font-semibold text-slate-900">{v.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Team ── */}
      <section>
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-600">The Team</p>
          <h2 className="mt-3 font-serif text-[2rem] text-slate-900 sm:text-[2.4rem]">Who's behind CRETE</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {team.map((member) => (
            <div
              key={member.name}
              className="rounded-2xl border border-[#e7dfd7] bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#8f3737] text-lg font-bold text-white">
                {member.initials}
              </div>
              <h3 className="font-semibold text-slate-900">{member.name}</h3>
              <p className="text-xs text-red-600 font-medium mb-3">{member.role}</p>
              <p className="text-sm leading-6 text-slate-600">{member.bio}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="rounded-2xl border border-[#e7dfd7] bg-[#f8f5f2] px-8 py-14 text-center">
        <h2 className="font-serif text-[2rem] text-slate-900 sm:text-[2.4rem]">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-slate-600">
          Post your first task in minutes or sign up as a tasker and start earning today.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            to="/login"
            className="rounded-full bg-[#8f3737] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#742c2c]"
          >
            Post a Task
          </Link>
          <Link
            to="/categories"
            className="rounded-full border border-[#c9b8b8] px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#7b2e2f] hover:text-[#7b2e2f]"
          >
            See All Services
          </Link>
        </div>
      </section>

    </div>
  );
}

export default About;