import { useState } from "react";
import { categories } from "../data/categoriesData";
import CategoryCard from "../components/CategoryCard";

export default function Categories() {
  const [search, setSearch] = useState("");

  const filteredCategories = categories.map(cat => ({
    ...cat,
    tasks: cat.tasks.filter(t =>
      t.toLowerCase().includes(search.toLowerCase())
    ),
  }));

  const handleTaskClick = (taskName) => {
    console.log("User selected:", taskName);
    // TODO: navigate to Create Task page
  };

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Search */}
      <div className="max-w-xl mx-auto mb-6">
        <input
          type="text"
          placeholder="Search for a service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm"
        />
      </div>

      {/* Category Grid */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 gap-4">
        {filteredCategories.map((cat) => (
          <CategoryCard
            key={cat.id}
            name={cat.name}
            tasks={cat.tasks}
            onTaskClick={handleTaskClick}
          />
        ))}
      </div>
    </div>
  );
}
