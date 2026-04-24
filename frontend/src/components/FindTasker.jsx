import { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

function FindTasker() {
  const { token } = useContext(AuthContext);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    const recognition = new (window.SpeechRecognition ||
      window.webkitSpeechRecognition)();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText);
      setIsListening(false);
      handleSubmit(null, speechToText);
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setIsListening(false);
    };

    recognition.onerror = () => {
      setError("Voice recognition error. Please try again or type your request.");
      setIsListening(false);
    };
  };

  const handleSubmit = async (e, voiceQuery = null) => {
    if (e) e.preventDefault();

    setIsLoading(true);
    setError("");
    setResults([]);

    const searchQuery = voiceQuery || query;

    if (!searchQuery.trim()) {
      setError("Please enter a search query.");
      setIsLoading(false);
      return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      const response = await axios.post(
        "http://localhost:8000/api/taskers/ai-search",
        { query: searchQuery },
        config
      );
      setResults(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during the search.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[82vh] bg-[#f5f3f1] px-6 py-10">
      <div className="mx-auto max-w-[1350px]">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f3737]">
            AI Search
          </p>
          <h1 className="mt-3 font-serif text-4xl text-slate-900 sm:text-5xl">
            Find the right tasker for your job.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Describe what you need, and we’ll surface the best matches for you.
          </p>
        </div>

        {/* Search box */}
        <div className="rounded-[2rem] border border-[#e7dfd7] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 lg:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. I need a plumber in Fullerton to fix a leaky sink"
              className="h-14 w-full rounded-2xl border border-[#e5ddd6] bg-[#fbf8f5] px-4 text-slate-900 outline-none transition focus:border-[#8f3737]"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white transition ${
                  isListening ? "bg-[#8f3737]" : "bg-[#2b8f8a] hover:bg-[#227670]"
                }`}
                aria-label="Voice search"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v2a3 3 0 01-3 3z"
                  />
                </svg>
              </button>

              <button
                type="submit"
                className="h-14 rounded-full bg-[#8f3737] px-7 text-sm font-semibold text-white transition hover:bg-[#742c2c]"
              >
                Search
              </button>
            </div>
          </form>

          {isListening && (
            <p className="mt-4 text-sm font-medium text-[#2b8f8a]">Listening...</p>
          )}

          {isLoading && (
            <div className="mt-5 rounded-2xl border border-[#e7dfd7] bg-[#fbf8f5] px-4 py-3 text-sm text-slate-600">
              Finding taskers...
            </div>
          )}

          {error && (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="mt-8">
          {results.length > 0 && (
            <div className="mb-5">
              <h2 className="font-serif text-3xl text-slate-900">Matches</h2>
              <p className="mt-2 text-sm text-slate-500">
                Here are the taskers that best fit your request.
              </p>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {results.map((tasker) => (
              <div
                key={tasker.username}
                className="rounded-[1.75rem] border border-[#e7dfd7] bg-white p-6 shadow-[0_14px_40px_rgba(15,23,42,0.05)]"
              >
                <div className="flex items-center gap-4">
                  {tasker.profile_image_url ? (
                    <img
                      src={tasker.profile_image_url}
                      alt={tasker.full_name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#2b8f8a] text-lg font-semibold text-white">
                      {tasker.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {tasker.full_name}
                    </h3>
                    <p className="text-sm text-slate-500">{tasker.location}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    to={`/taskers/${encodeURIComponent(tasker.username)}`}
                    className="inline-flex rounded-full bg-[#2b8f8a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#227670]"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {!isLoading && !error && results.length === 0 && (
            <div className="mt-8 rounded-[2rem] border border-[#e7dfd7] bg-[#fbf8f5] px-6 py-8 text-center text-sm text-slate-500">
              Search for a tasker above to see results here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FindTasker;