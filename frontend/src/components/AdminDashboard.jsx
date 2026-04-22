import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AddServiceForm from './AddServiceForm';

function AdminDashboard() {
  const { token, logout } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [selectedCities, setSelectedCities] = useState(['Los Angeles, CA']);
  const [scraperResult, setScraperResult] = useState(null);
  const [scraperError, setScraperError] = useState('');
  const [scraperLoading, setScraperLoading] = useState(false);

  const navigate = useNavigate();

  const cities = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Seattle, WA',
    'Denver, CO',
    'Boston, MA',
    'Miami, FL',
    'Atlanta, GA',
  ];

  const fetchServices = () => {
    axios
      .get('http://localhost:8000/api/services')
      .then((response) => {
        setServices(response.data);
      })
      .catch((error) => console.error('Error fetching services:', error));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      await axios.delete(`http://localhost:8000/api/services/${serviceId}`, config);
      setServices(services.filter((s) => s._id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service.');
    }
  };

  const onServiceAdded = () => {
    fetchServices();
  };

  const toggleCity = (city) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const runScraper = async () => {
    setScraperLoading(true);
    setScraperError('');
    setScraperResult(null);

    try {
      const response = await axios.post(
        'http://localhost:8000/api/scraper/run',
        {
          source: 'taskrabbit',
          locations: selectedCities,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setScraperResult({
        ...response.data,
        source: 'taskrabbit',
        time: new Date().toLocaleString(),
      });
    } catch (error) {
      console.error('Scraper error:', error);
      setScraperError(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          `Scraper failed: ${error.message}`
      );
    } finally {
      setScraperLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="bg-white rounded-2xl shadow p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
          >
            Logout
          </button>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Add a New Service</h2>
        <div className="mb-10">
          <AddServiceForm onServiceAdded={onServiceAdded} />
        </div>

        <div className="mb-10 border rounded-xl p-6 bg-white">
          <p className="text-gray-600 mb-6">
            Pull task listings from TaskRabbit and generate marketplace-ready tasks for selected cities.
          </p>

          <div className="mb-6 bg-gray-100 rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-3">Last Run</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Source:</span>{' '}
                  {scraperResult?.source || 'taskrabbit'}
                </p>
                <p>
                  <span className="font-semibold">Scraped:</span>{' '}
                  {scraperResult?.scraped ?? 0}
                </p>
                <p>
                  <span className="font-semibold">Updated:</span>{' '}
                  {scraperResult?.updated ?? 0}
                </p>
                <p>
                  <span className="font-semibold">Locations:</span>{' '}
                  {selectedCities.join(', ')}
                </p>
              </div>

              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Time:</span>{' '}
                  {scraperResult?.time || 'Not run yet'}
                </p>
                <p>
                  <span className="font-semibold">Inserted:</span>{' '}
                  {scraperResult?.inserted ?? 0}
                </p>
                <p>
                  <span className="font-semibold">Errors:</span>{' '}
                  {scraperResult?.errors ?? 0}
                </p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <p className="font-medium mb-3">Cities to scrape</p>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => {
                const active = selectedCities.includes(city);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={`px-4 py-2 rounded-full border ${
                      active
                        ? 'bg-cyan-500 text-white border-cyan-500'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-gray-500 mt-2">{selectedCities.length} selected</p>
          </div>

          <button
            onClick={runScraper}
            disabled={scraperLoading || selectedCities.length === 0}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg"
          >
            {scraperLoading ? 'Running...' : 'Run Scraper'}
          </button>

          {scraperError && (
            <div className="mt-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700">
              {scraperError}
            </div>
          )}

          <div className="mt-6 pt-6 border-t">
            <p className="text-lg font-medium mb-4">Danger Zone</p>
            <button
              type="button"
              className="border border-red-300 text-red-500 hover:bg-red-50 font-medium py-2 px-4 rounded-lg"
            >
              Delete all TaskRabbit tasks
            </button>
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Manage Services</h2>
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service._id} className="border rounded-xl p-4 bg-gray-50">
              <h3 className="text-xl font-semibold">{service.name}</h3>
              <p className="text-gray-700 mb-3">{service.description}</p>
              <div className="flex gap-3">
                <Link
                  to={`/admin/edit-service/${service._id}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(service._id)}
                  className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg"
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