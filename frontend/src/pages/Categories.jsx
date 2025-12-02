// src/pages/Categories.jsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { categories } from '../data/categories';
// If you already have an AuthContext, import it:
// import { useAuth } from '../context/AuthContext';

const Categories = () => {
  const [openCategoryId, setOpenCategoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Replace this with your real auth hook if you have one
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = user?.role || 'client'; // 'client' or 'tasker'

  const handleToggleCategory = (categoryId) => {
    setOpenCategoryId((prev) => (prev === categoryId ? null : categoryId));
  };

  const handleTaskClick = (category, task) => {
    if (role === 'tasker') {
      // Tasker should see matching tasks for this type
      navigate('/tasker/dashboard', {
        state: {
          filterCategoryId: category.id,
          filterTaskId: task.id
        }
      });
    } else {
      // Client should be prompted to create a new task
      navigate('/client/dashboard', {
        state: {
          newTaskCategoryId: category.id,
          newTaskTaskId: task.id
        }
      });
    }
  };

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase();
    const results = [];

    categories.forEach((category) => {
      category.tasks.forEach((task) => {
        const haystack =
          (task.name + ' ' + (task.keywords || []).join(' ')).toLowerCase();
        if (haystack.includes(term)) {
          results.push({ category, task });
        }
      });
    });

    return results.slice(0, 6); // cap suggestions
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight">
          Find the right Tasker by category
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          Choose a category to see task types, or search the kind of help you
          need. We’ll map phrases like{' '}
          <span className="font-medium">&quot;put together furniture&quot;</span>{' '}
          to the closest task type, such as{' '}
          <span className="font-medium">Furniture Assembly</span>.
        </p>
      </div>

      {/* Search bar */}
      <div className="max-w-xl mx-auto">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Search for what you need
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder='e.g. "put together furniture"'
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-red-500/70"
        />

        {searchResults.length > 0 && (
          <div className="mt-2 rounded-lg border border-neutral-200 bg-white shadow-sm">
            <div className="px-3 py-2 text-xs font-semibold uppercase text-slate-500 tracking-wide">
              Suggested task types
            </div>
            <ul className="divide-y divide-neutral-100">
              {searchResults.map(({ category, task }) => (
                <li key={category.id + task.id}>
                  <button
                    onClick={() => handleTaskClick(category, task)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 flex flex-col"
                  >
                    <span className="font-medium">{task.name}</span>
                    <span className="text-xs text-slate-500">
                      in {category.name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Categories list */}
      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => {
          const isOpen = openCategoryId === category.id;
          return (
            <div
              key={category.id}
              className="rounded-2xl border border-neutral-200 bg-white shadow-sm"
            >
              <button
                onClick={() => handleToggleCategory(category.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <h3 className="text-base font-semibold">{category.name}</h3>
                  <p className="text-xs text-slate-500">
                    {category.description}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {isOpen ? 'Hide tasks ▴' : 'View tasks ▾'}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-neutral-200 bg-neutral-50">
                  <ul className="divide-y divide-neutral-200">
                    {category.tasks.map((task) => (
                      <li key={task.id}>
                        <button
                          onClick={() => handleTaskClick(category, task)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-neutral-100 flex justify-between items-center"
                        >
                          <span>{task.name}</span>
                          <span className="text-[11px] uppercase tracking-wide text-slate-500">
                            {role === 'tasker' ? 'View matches' : 'Create task'}
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
    </div>
  );
};

export default Categories;
