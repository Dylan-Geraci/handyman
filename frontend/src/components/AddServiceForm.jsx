import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function AddServiceForm({ onServiceAdded }) { // <-- Notice the new 'onServiceAdded' prop
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const { token } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const serviceData = { name, description };

    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    try {
      await axios.post('http://localhost:8000/api/services', serviceData, config);
      setMessage('Service added successfully!');
      setName('');
      setDescription('');
      if (onServiceAdded) { // <-- Call the function after success
        onServiceAdded();
      }
    } catch (error) {
      setMessage('Failed to add service.');
      console.error('Error adding service:', error);
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">Add a New Service</h3>
      <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg shadow-sm">
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Service Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="3"
            className="w-full px-3 py-2 border rounded-md"
          ></textarea>
        </div>
        <button type="submit" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          Add Service
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}

export default AddServiceForm;