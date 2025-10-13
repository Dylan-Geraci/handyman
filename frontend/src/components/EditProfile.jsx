import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function EditProfile() {
  const { user, token, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: '',
    location: '',
    skills: '',
    profile_image_url: '',
    bio: ''
  });
  const [message, setMessage] = useState('');

  // Pre-fill the form with the current user's data when the component loads
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        location: user.location || '',
        skills: user.skills ? user.skills.join(', ') : '',
        profile_image_url: user.profile_image_url || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const updateData = {
      ...formData,
      skills: formData.skills.split(',').map(skill => skill.trim())
    };

    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      await axios.put('http://localhost:8000/users/me', updateData, config);
      // Re-fetch user data to update context
      await login(token); 
      setMessage('Profile updated successfully!');
      setTimeout(() => navigate(-1), 1500); // Go back to the previous page
    } catch (error) {
      setMessage('Failed to update profile.');
      console.error("Error updating profile:", error);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Edit Your Profile</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
          <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Location</label>
          <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
        </div>
        {user?.role === 'tasker' && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Skills (comma-separated)</label>
              <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Profile Picture URL</label>
              <input type="text" name="profile_image_url" value={formData.profile_image_url} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" className="w-full px-3 py-2 border rounded-md"></textarea>
            </div>
          </>
        )}
        <div className="text-center">
          <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-md">
            Save Changes
          </button>
        </div>
        {message && <p className={`mt-4 text-center ${message.includes('successfully') ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}
      </form>
    </div>
  );
}

export default EditProfile;