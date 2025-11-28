import { useState } from "react";

export default function CategoryCard({ name, tasks, onTaskClick }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm bg-white">
      {/* Category Title */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left font-semibold text-black text-lg"
      >
        {name}
      </button>

      {/* Dropdown Tasks */}
      {open && (
        <div className="mt-3 ml-2 border-l-2 border-red-500 pl-4 flex flex-col gap-2">
          {tasks.map((task) => (
            <button
              key={task}
              onClick={() => onTaskClick(task)}
              className="text-gray-700 hover:text-red-500 transition text-sm text-left"
            >
              {task}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
