import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AddServiceForm from './AddServiceForm';

function AdminDashboard() {
  const { token, logout } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const navigate = useNavigate();

  // Function to fetch services
  const fetchServices = () => {
    axios.get('http://localhost:8000/api/services')
      .then(response => {
        setServices(response.data);
      })
      .catch(error => console.error("Error fetching services:", error));
  };

  // Fetch all services when the component loads
  useEffect(() => {
    fetchServices();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?")) {
        return;
    }
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    try {
      await axios.delete(`http://localhost:8000/api/services/${serviceId}`, config);
      setServices(services.filter(s => s._id !== serviceId));
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service.");
    }
  };

  // This function will be passed to the AddServiceForm to refresh the list
  const onServiceAdded = () => {
    fetchServices();
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <button 
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
        >
          Logout
        </button>
      </div>
      
      <AddServiceForm onServiceAdded={onServiceAdded} />
      
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-4">Manage Services</h3>
        <div className="space-y-4">
          {services.map(service => (
            <div key={service._id} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg shadow-sm">
              <div>
                <h4 className="font-bold text-gray-800">{service.name}</h4>
                <p className="text-gray-600">{service.description}</p>
              </div>
              <div className="flex space-x-2">
                  <Link 
                    to={`/admin/services/edit/${service._id}`} 
                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded text-sm transition-colors"
                  >
                    Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(service._id)}
                    className="bg-red-500 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;