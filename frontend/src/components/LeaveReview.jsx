import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// This component receives the task and a function to close itself
function LeaveReview({ task, onClose, onReviewSubmitted }) {
  const { token } = useContext(AuthContext);
  const [rating, setRating] = useState(5); // Default rating to 5 stars
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const reviewData = {
      task_id: task._id,
      tasker_username: task.tasker_username,
      rating: parseInt(rating),
      comment: comment,
    };
    
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      await axios.post('http://localhost:8000/api/reviews', reviewData, config);
      onReviewSubmitted(); // Tell the dashboard to refresh
      onClose(); // Close the modal
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit review.');
    }
  };

  return (
    // This is the modal container
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Leave a Review</h2>
        <p className="mb-2">For task: <strong>{task.title}</strong></p>
        <p className="text-sm text-gray-600 mb-6">For tasker: <strong>{task.tasker_username}</strong></p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Rating (1-5)</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-white"
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Fair</option>
              <option value="1">1 - Poor</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Comment (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border rounded-md"
            ></textarea>
          </div>

          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
              Cancel
            </button>
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeaveReview;