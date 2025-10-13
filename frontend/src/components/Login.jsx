import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);

      const tokenResponse = await axios.post('http://localhost:8000/token', formData);
      const accessToken = tokenResponse.data.access_token;

      const loggedInUser = await login(accessToken);

      if (loggedInUser) {
        if (loggedInUser.role === 'client') navigate('/client/dashboard');
        else if (loggedInUser.role === 'tasker') navigate('/tasker/dashboard');
        else if (loggedInUser.role === 'admin') navigate('/admin/dashboard');
      } else {
        setError('Login successful, but failed to fetch user profile.');
      }

    } catch (err) {
      setError('Invalid username or password.');
      console.error('Login failed:', err);
    }
  };

  // -------------------- Forgot Password Handler --------------------
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetMessage('');
    try {
      await axios.post('http://localhost:8000/forgot-password', { email: resetEmail });
      setResetMessage('Password reset link sent! Check your email.');
    } catch (err) {
      setResetMessage('Failed to send reset link.');
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Login</h2>
      
      {!showResetForm ? (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="text-center mb-4">
            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700">
              Login
            </button>
          </div>
          <p
            className="text-blue-600 text-center cursor-pointer hover:underline"
            onClick={() => setShowResetForm(true)}
          >
            Forgot Password?
          </p>
          {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        </form>
      ) : (
        <form onSubmit={handleForgotPassword} className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-gray-700 font-semibold mb-2">Enter your email</label>
            <input
              type="email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="text-center mb-4">
            <button type="submit" className="bg-green-600 text-white font-bold py-2 px-6 rounded-md hover:bg-green-700">
              Send Reset Link
            </button>
          </div>
          <p
            className="text-blue-600 text-center cursor-pointer hover:underline"
            onClick={() => setShowResetForm(false)}
          >
            Back to Login
          </p>
          {resetMessage && <p className="text-green-500 text-center mt-4">{resetMessage}</p>}
        </form>
      )}
    </div>
  );
}

export default Login;
