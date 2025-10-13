import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/forgot-password', { email });
      setMessage(response.data.message + " Please check your backend terminal for the reset token.");
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Forgot Your Password?</h2>
      <p className="text-center text-gray-600 mb-6">Enter your email address. We will generate a reset token in the backend terminal for you to use.</p>
      
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="text-center">
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700 w-full">
            Send Reset Instructions
          </button>
        </div>
      </form>

      {message && <p className="text-green-500 text-center mt-4">{message}</p>}
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}

      <div className="text-center mt-6">
        <Link to="/login" className="text-sm text-blue-600 hover:underline">Back to Login</Link>
      </div>
    </div>
  );
}

export default ForgotPassword;