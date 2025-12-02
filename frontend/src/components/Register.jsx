import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { softRed } from '../styles/theme';

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

  // softRed imported from shared theme
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
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-4">
          <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Create your account</div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Join <span className={softRed.text}>CRETE</span> Handyman</h2>
        </div>
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white shadow-[0_18px_45px_rgba(15,23,42,0.07)] border border-[#F5C8C8]/60 p-6 md:p-8">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">I am a...</label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2.5 border border-neutral-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-[#E65A5A]"
          >
            <option value="client">Client (I need work done)</option>
            <option value="tasker">Tasker (I'm looking for work)</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
          <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required className="w-full px-3 py-2.5 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E65A5A]" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Email (Username)</label>
          <input type="email" name="username" value={formData.username} onChange={handleChange} required className="w-full px-3 py-2.5 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E65A5A]" />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full px-3 py-2.5 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E65A5A]" />
        </div>
        {formData.role === 'tasker' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Skills (comma-separated)</label>
              <input type="text" name="skills" placeholder="e.g. plumbing, electrical" value={formData.skills} onChange={handleChange} className="w-full px-3 py-2.5 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E65A5A]" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Location</label>
              <input type="text" name="location" placeholder="e.g. Fullerton, CA" value={formData.location} onChange={handleChange} className="w-full px-3 py-2.5 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#E65A5A]" />
            </div>
          </>
        )}
        <div className="text-center">
          <button type="submit" className={`${softRed.main} ${softRed.hover} text-white text-sm font-semibold py-2.5 rounded-md px-6`}>
            Register
          </button>
        </div>
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        {success && <p className="text-green-500 text-center mt-4">{success}</p>}
        <div className="mt-4 text-center text-sm">
          Already have an account? <Link to="/login" className="text-[#E65A5A] font-semibold hover:underline">Log in</Link>
        </div>
      </form>
      </div>
    </div>
  );
}

export default Register;

