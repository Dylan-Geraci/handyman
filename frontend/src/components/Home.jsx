import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ThemePreview from "./ThemePreview";

function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Pass the query to the find-tasker page via state
    navigate('/find-tasker', { state: { query: searchQuery } });
  };

  // URL for our new background image from Unsplash
  const heroImageUrl = "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2940&auto=format&fit=crop";

  return (
    <div>
      {/* --- Hero Section with Background Image --- */}
      <div 
        className="text-center p-12 md:p-24 rounded-lg shadow-lg mb-12 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImageUrl})` }}
      >
        {/* This div creates the dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg"></div>

        {/* All content is now relative to the container and sits on top of the overlay */}
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Your To-Do List, Done.
          </h1>
          <p className="text-lg text-gray-200 mt-4 max-w-2xl mx-auto">
            Find trusted, local handymen for any task, big or small. Describe what you need, and our AI will find the perfect match for you.
          </p>
          
          {user && user.role === 'client' ? (
            <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="I need help fixing a leaky faucet in my kitchen..."
                className="w-full px-4 py-3 border rounded-md text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md hover:bg-blue-700">
                Find Help
              </button>
            </form>
          ) : (
            <div className="mt-8">
              <Link to="/register" className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 text-lg">
                Get Started
              </Link>
            </div>
          )}
          
          <div className="mt-6">
              <Link to="/register" className="text-sm text-gray-200 hover:underline">
                  Want to earn money as a Tasker? Sign up here.
              </Link>
          </div>
        </div>
      </div>

      {/* --- How It Works Section (no changes) --- */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-800">How It Works</h2>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="flex flex-col items-center">
            <div className="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">1</div>
            <h3 className="text-xl font-semibold mt-4">Describe Your Task</h3>
            <p className="text-gray-600 mt-2">
              Tell us what you need done using our smart search or by posting a job.
            </p>
          </div>
          {/* Step 2 */}
          <div className="flex flex-col items-center">
            <div className="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">2</div>
            <h3 className="text-xl font-semibold mt-4">Choose Your Tasker</h3>
            <p className="text-gray-600 mt-2">
              Browse profiles, compare reviews, and select the best person for the job.
            </p>
          </div>
          {/* Step 3 */}
          <div className="flex flex-col items-center">
            <div className="bg-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">3</div>
            <h3 className="text-xl font-semibold mt-4">Get It Done</h3>
            <p className="text-gray-600 mt-2">
              Chat with your Tasker, schedule a time, and consider your task complete!
            </p>
          </div>
        </div>
      </div>
      <ThemePreview />
    </div>
  );
}

export default Home;