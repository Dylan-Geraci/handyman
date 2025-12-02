import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { softRed, actionTeal, successGreen, neutrals } from '../styles/theme';

function FindTasker() {
  const { token } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Voice Search Logic
  const handleVoiceSearch = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setQuery(speechToText); // Set the search box text to the speech result
      setIsListening(false);
      handleSubmit(null, speechToText); // Automatically submit the search
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError('Voice recognition error. Please try again or type your request.');
      setIsListening(false);
    };
  };


  const handleSubmit = async (e, voiceQuery = null) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');
    setResults([]);

    const searchQuery = voiceQuery || query;
    if (!searchQuery.trim()) {
        setError('Please enter a search query.');
        setIsLoading(false);
        return;
    }

    const config = { headers: { Authorization: `Bearer ${token}` } };
    try {
      const response = await axios.post('http://localhost:8000/api/taskers/ai-search', { query: searchQuery }, config);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred during the search.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 my-4 text-center">Find the Right Tasker for Your Job</h2>
      <p className="text-center text-gray-600 mb-8">Describe what you need, and our AI will find the best matches for you.</p>

      <form onSubmit={handleSubmit} className={`flex items-center gap-2 ${neutrals.card} ${neutrals.border} p-4 rounded-lg shadow-md border`}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'I need a plumber in Fullerton to fix a leaky sink'"
          className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#E65A5A]/30`}
        />
        <button
          type="button"
          onClick={handleVoiceSearch}
          className={`p-3 rounded-md transition-colors ${isListening ? `${softRed.main}` : `${actionTeal.main} ${actionTeal.hover}`} text-white`}
        >
          {/* Microphone Icon */}
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v2a3 3 0 01-3 3z"></path></svg>
        </button>
        <button type="submit" className={`text-white font-bold py-3 px-6 rounded-md ${softRed.main} ${softRed.hover}`}>
          Search
        </button>
      </form>
      
      {isListening && <p className={`text-center ${actionTeal.text} mt-4 font-semibold`}>Listening...</p>}

      {/* Results Section */}
      <div className="mt-8">
        {isLoading && <p className="text-center">Finding taskers...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        
        <div className="space-y-4">
            {results.map(tasker => (
            <div key={tasker.username} className={`${neutrals.card} p-6 rounded-lg shadow-md flex items-center justify-between border ${neutrals.border}`}>
              <div className="flex items-center space-x-4">
                  {tasker.profile_image_url ? (
                      <img src={tasker.profile_image_url} alt={tasker.full_name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                  <div className={`w-16 h-16 rounded-full ${actionTeal.main} text-white flex items-center justify-center text-xl font-bold`}>
                          {tasker.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                  )}
                  <div>
                      <h3 className="text-xl font-bold text-gray-800">{tasker.full_name}</h3>
                      <p className="text-gray-500">{tasker.location}</p>
                  </div>
              </div>
              <Link to={`/taskers/${encodeURIComponent(tasker.username)}`} className={`${actionTeal.main} ${actionTeal.hover} text-white font-bold py-2 px-4 rounded`}>
                  View Profile
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FindTasker;