import { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
        if (loggedInUser.role === 'client') {
          navigate('/client/dashboard');
        } else if (loggedInUser.role === 'tasker') {
          navigate('/tasker/dashboard');
        } else if (loggedInUser.role === 'admin') {
          navigate('/admin/dashboard');
        }
      } else {
        setError('Login failed to fetch user profile.');
      }

    } catch (err) {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Login</h2>
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
        <div className="text-center">
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700">
            Login
          </button>
        </div>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </form>
      <div className="text-center mt-4">
        <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
          Forgot Password?
        </Link>
      </div>
    </div>
  );
}

export default Login;