import { useState, useEffect } from "react";
import axios from "axios";

function Portfolio() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await axios.get("http://localhost:8000/api/portfolio");
        setItems(response.data || []);
      } catch (error) {
        console.error("There was an error fetching the portfolio items!", error);
        setError("Could not load portfolio items right now.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolio();
  }, []);

  return (
    <div className="min-h-[82vh] bg-[#f5f3f1] px-6 py-10">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f3737]">
            Portfolio
          </p>
          <h1 className="mt-3 font-serif text-4xl text-slate-900 sm:text-5xl">
            Our Work
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            A look at completed projects and the kind of work our team can help with.
          </p>
        </div>

        {/* States */}
        {isLoading && (
          <div className="rounded-[2rem] border border-[#e7dfd7] bg-white px-6 py-8 text-sm text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            Loading portfolio...
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {!isLoading && !error && items.length === 0 && (
          <div className="rounded-[2rem] border border-[#e7dfd7] bg-white px-6 py-8 text-sm text-slate-500 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
            No portfolio items available yet.
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <div
                key={item._id}
                className="overflow-hidden rounded-[1.75rem] border border-[#e7dfd7] bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
              >
                <div className="relative h-60 w-full overflow-hidden bg-[#efe8e1]">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
                  />
                </div>

                <div className="p-6">
                  <h2 className="font-serif text-2xl text-slate-900">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Portfolio;