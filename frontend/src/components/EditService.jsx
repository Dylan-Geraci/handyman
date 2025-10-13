import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function EditService() {
  const { serviceId } = useParams(); // Gets the ID from the URL
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  // Fetch the service data when the component loads
  useEffect(() => {
    axios.get(`http://localhost:8000/api/services/${serviceId}`)
      .then(response => {
        setName(response.data.name);
        setDescription(response.data.description);
      })
      .catch(error => console.error("Error fetching service:", error));
  }, [serviceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const updatedService = { name, description };
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      await axios.put(`http://localhost:8000/api/services/${serviceId}`, updatedService, config);
      navigate('/admin/dashboard'); // Go back to dashboard on success
    } catch (error) {
      setMessage('Failed to update service.');
      console.error('Error updating service:', error);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Edit Service</h2>
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Service Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        <div className="text-center">
            <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-md transition-colors">
            Update Service
            </button>
        </div>
      </form>
      {message && <p className="mt-4 text-red-500 text-center">{message}</p>}
    </div>
  );
}

export default EditService;