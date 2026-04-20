// src/pages/Categories.jsx
import { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { categories } from '../data/categories';

const tips = [
  'Describe your task in plain language — our AI will match you to the right tasker.',
  'You can browse by category or search for a specific task type below.',
  'All taskers are verified and rated by real clients.',
];

const Categories = () => {
  const [openCategoryId, setOpenCategoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = user?.role || 'client';

  const handleToggleCategory = (categoryId) => {
    setOpenCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleTaskClick = (category, task) => {
    if (role === 'tasker') {
      navigate('/tasker/dashboard', {
        state: { filterCategoryId: category.id, filterTaskId: task.id },
      });
    } else {
      navigate('/client/dashboard', {
        state: { newTaskCategoryId: category.id, newTaskTaskId: task.id },
      });
    }
  };

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    const results = [];
    categories.forEach((category) => {
      category.tasks.forEach((task) => {
        const haystack = (task.name + ' ' + (task.keywords || []).join(' ')).toLowerCase();
        if (haystack.includes(term)) results.push({ category, task });
      });
    });
    return results.slice(0, 6);
  }, [searchTerm]);

  const totalTasks = useMemo(
    () => categories.reduce((acc, c) => acc + c.tasks.length, 0),
    []
  );

  return (
    <div className="w-full space-y-12">

      {/* ── Hero ── */}
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-red-600">Browse</p>
        <h1 className="mt-3 font-serif text-[2.8rem] leading-tight text-slate-900 sm:text-[3.2rem]">
          Find the right help fast.
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          Browse {categories.length} categories and {totalTasks}+ task types, or just describe what you need and we'll point you in the right direction.
        </p>
      </section>

      {/* ── Stat strip ── */}
      <section className="grid grid-cols-3 gap-px border border-[#e7dfd7] bg-[#e7dfd7]">
        <div className="bg-[#f8f5f2] px-6 py-6 text-center">
          <p className="font-serif text-3xl text-slate-900">{categories.length}</p>
          <p className="mt-1 text-xs text-slate-500">Categories</p>
        </div>
        <div className="bg-[#f8f5f2] px-6 py-6 text-center">
          <p className="font-serif text-3xl text-slate-900">{totalTasks}+</p>
          <p className="mt-1 text-xs text-slate-500">Task Types</p>
        </div>
        <div className="bg-[#f8f5f2] px-6 py-6 text-center">
          <p className="font-serif text-3xl text-slate-900">120+</p>
          <p className="mt-1 text-xs text-slate-500">Verified Taskers</p>
        </div>
      </section>

      {/* ── Search ── */}
      <section className="mx-auto max-w-2xl">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Search for what you need
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder='e.g. "put together furniture" or "fix a leaky faucet"'
            className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 pr-10 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-red-500/70"
          />
          <svg className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-2 rounded-xl border border-neutral-200 bg-white shadow-md overflow-hidden">
            <div className="px-4 py-2 text-xs font-semibold uppercase text-slate-400 tracking-wide bg-neutral-50 border-b border-neutral-100">
              Suggested task types
            </div>
            <ul className="divide-y divide-neutral-100">
              {searchResults.map(({ category, task }) => (
                <li key={category.id + task.id}>
                  <button
                    onClick={() => handleTaskClick(category, task)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-neutral-50 flex items-center justify-between gap-4"
                  >
                    <div>
                      <span className="font-medium text-slate-900">{task.name}</span>
                      <span className="ml-2 text-xs text-slate-400">in {category.name}</span>
                    </div>
                    <span className="shrink-0 text-[11px] uppercase tracking-wide text-red-500 font-medium">
                      {role === 'tasker' ? 'View matches →' : 'Create task →'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {searchTerm.trim() && searchResults.length === 0 && (
          <p className="mt-3 text-sm text-slate-500 text-center">
            No exact matches — try different keywords or browse below.
          </p>
        )}
      </section>

      {/* ── Tips ── */}
      <section className="mx-auto max-w-2xl rounded-xl border border-[#e7dfd7] bg-[#f8f5f2] px-6 py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Tips</p>
        <ul className="space-y-2">
          {tips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
              {tip}
            </li>
          ))}
        </ul>
      </section>

      {/* ── Category grid ── */}
      <section>
        <h2 className="mb-6 font-serif text-[1.8rem] text-slate-900">All Categories</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((category) => {
            const isOpen = openCategoryId === category.id;
            return (
              <div
                key={category.id}
                className="rounded-2xl border border-[#e7dfd7] bg-white shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => handleToggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-neutral-50 transition"
                >
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{category.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{category.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-slate-500">
                      {category.tasks.length} tasks
                    </span>
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-neutral-100 bg-neutral-50">
                    <ul className="divide-y divide-neutral-100">
                      {category.tasks.map((task) => (
                        <li key={task.id}>
                          <button
                            onClick={() => handleTaskClick(category, task)}
                            className="w-full text-left px-5 py-2.5 text-sm hover:bg-white flex justify-between items-center transition"
                          >
                            <span className="text-slate-700">{task.name}</span>
                            <span className="text-[11px] uppercase tracking-wide text-red-500 font-medium">
                              {role === 'tasker' ? 'View matches →' : 'Create task →'}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="rounded-2xl border border-[#e7dfd7] bg-[#f8f5f2] px-8 py-12 text-center">
        <h2 className="font-serif text-[1.8rem] text-slate-900">
          Can't find what you're looking for?
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm text-slate-600">
          Use our AI-powered tasker search — just describe your task in plain English and we'll find the right person.
        </p>
        <Link
          to="/find-tasker"
          className="mt-6 inline-block rounded-full bg-[#8f3737] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#742c2c]"
        >
          Try AI Tasker Search
        </Link>
      </section>

    </div>
  );
};

export default Categories;