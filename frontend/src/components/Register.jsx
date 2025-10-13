import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [formData, setFormData] = useState({
    username: '', // This will be the email
    full_name: '',
    password: '',
    role: 'client', // Default role
    skills: '', // Stored as a comma-separated string
    location: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const registrationData = {
      ...formData,
      skills: formData.role === 'tasker' ? formData.skills.split(',').map(skill => skill.trim()) : [],
    };

    try {
      await axios.post('http://localhost:8000/register', registrationData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);

    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Create an Account</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">I am a...</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md bg-white"
          >
            <option value="client">Client (I need work done)</option>
            <option value="tasker">Tasker (I'm looking for work)</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
          <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Email (Username)</label>
          <input type="email" name="username" value={formData.username} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2 border rounded-md" />
        </div>
        {formData.role === 'tasker' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Skills (comma-separated)</label>
              <input type="text" name="skills" placeholder="e.g. plumbing, electrical" value={formData.skills} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Location</label>
              <input type="text" name="location" placeholder="e.g. Fullerton, CA" value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </>
        )}
        <div className="text-center">
          <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-6 rounded-md hover:bg-blue-700">
            Register
          </button>
        </div>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        {success && <p className="text-green-500 text-center mt-4">{success}</p>}
      </form>
    </div>
  );
}

export default Register;

