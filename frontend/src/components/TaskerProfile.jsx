import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// A small component to display star ratings visually
const StarRating = ({ rating }) => {
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, index) => (
        <svg
          key={index}
          className={`w-5 h-5 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.446a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.539 1.118l-3.368-2.446a1 1 0 00-1.176 0l-3.368 2.446c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.07 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  );
};

function TaskerProfile() {
  const { username } = useParams();
  const [tasker, setTasker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const encodedUsername = encodeURIComponent(username);
        const profilePromise = axios.get(`http://localhost:8000/api/taskers/${encodedUsername}`);
        const reviewsPromise = axios.get(`http://localhost:8000/api/reviews/${encodedUsername}`);
        
        const [profileResponse, reviewsResponse] = await Promise.all([profilePromise, reviewsPromise]);
        
        setTasker(profileResponse.data);
        setReviews(reviewsResponse.data);
      } catch (err) {
        setError('Could not load tasker profile.');
        console.error("Error fetching profile data:", err);
      }
    };

    fetchProfileData();
  }, [username]);

  if (error) {
    return <div className="text-center text-red-500 mt-10">{error}</div>;
  }

  if (!tasker) {
    return <div className="text-center mt-10">Loading profile...</div>;
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : 0;
  
  // Helper to get initials from a name for the fallback avatar
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <div className="flex items-center space-x-6">
        {/* NEW: Profile Picture Section */}
        {tasker.profile_image_url ? (
          <img 
            src={tasker.profile_image_url} 
            alt={tasker.full_name}
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
        ) : (
          // Fallback avatar if no image is provided
          <div className="w-24 h-24 rounded-full bg-blue-500 text-white flex items-center justify-center text-3xl font-bold">
            {getInitials(tasker.full_name)}
          </div>
        )}

        <div>
          <h2 className="text-3xl font-bold text-gray-800">{tasker.full_name}</h2>
          <p className="text-gray-500 mb-2">{tasker.location || 'Location not specified'}</p>
          
          {reviews.length > 0 && (
            <div className="flex items-center space-x-2">
                <StarRating rating={averageRating} />
                <span className="text-gray-600 font-semibold">{averageRating}</span>
                <span className="text-gray-500">({reviews.length} reviews)</span>
            </div>
          )}
        </div>
      </div>
      
      {/* NEW: Bio Section */}
      {tasker.bio && (
        <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-700">About Me</h3>
            <p className="text-gray-600 mt-2">{tasker.bio}</p>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-xl font-semibold text-gray-700">Skills</h3>
        {tasker.skills && tasker.skills.length > 0 ? (
          <div className="flex flex-wrap gap-2 mt-2">
            {tasker.skills.map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-2">No skills listed.</p>
        )}
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-700">Client Reviews</h3>
        {reviews.length > 0 ? (
          <div className="space-y-6 mt-4">
            {reviews.map(review => (
              <div key={review._id} className="border-t pt-4">
                <StarRating rating={review.rating} />
                <p className="text-gray-700 mt-2">{review.comment}</p>
                <p className="text-xs text-gray-400 mt-1">- Reviewed by {review.client_username}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 mt-2">This tasker has no reviews yet.</p>
        )}
      </div>
    </div>
  );
}

export default TaskerProfile;