import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AddServiceForm from './AddServiceForm';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

function AdminDashboard() {
  const { token, logout } = useContext(AuthContext);
  const [services, setServices] = useState([]);
  const [selectedCities, setSelectedCities] = useState(['New York, NY']);
  const [scraperResult, setScraperResult] = useState(null);
  const [scraperError, setScraperError] = useState('');
  const [scraperLoading, setScraperLoading] = useState(false);
  const [scraperProgress, setScraperProgress] = useState(0);
  const [scraperStatus, setScraperStatus] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const navigate = useNavigate();

  const cities = [
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
    'Phoenix, AZ', 'Seattle, WA', 'Denver, CO', 'Boston, MA',
    'Miami, FL', 'Atlanta, GA',
  ];

  const fetchServices = () => {
    axios.get(`${API_BASE}/api/services`)
      .then((response) => setServices(response.data))
      .catch((error) => console.error('Error fetching services:', error));
  };

  useEffect(() => { fetchServices(); }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDelete = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await axios.delete(`${API_BASE}/api/services/${serviceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(services.filter((s) => s._id !== serviceId));
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service.');
    }
  };

  const onServiceAdded = () => fetchServices();

  const toggleCity = (city) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city]
    );
  };

  const runScraperWithProgress = () => {
    setScraperLoading(true);
    setScraperError('');
    setScraperResult(null);
    setScraperProgress(0);
    setScraperStatus('Starting...');

    const url = `${API_BASE}/api/scraper/run/stream?token=${encodeURIComponent(token)}&source=craigslist`;
    const es = new EventSource(url);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) setScraperStatus(data.message);
        if (typeof data.progress === 'number') setScraperProgress(data.progress);
        if (data.done) {
          setScraperResult({
            ...data.results,
            source: 'craigslist',
            time: new Date().toLocaleString(),
          });
          setScraperLoading(false);
          es.close();
        }
      } catch (err) {
        console.error('Failed to parse SSE event:', err);
      }
    };

    es.onerror = (err) => {
      console.error('Scraper stream error:', err);
      setScraperError('Scraper stream connection failed.');
      setScraperLoading(false);
      es.close();
    };
  };

  const runScraperFallback = async () => {
    setScraperLoading(true);
    setScraperError('');
    setScraperResult(null);

    try {
      const response = await axios.post(
        `${API_BASE}/api/scraper/run`,
        { source: 'craigslist', locations: selectedCities },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScraperResult({
        ...response.data,
        source: 'craigslist',
        time: new Date().toLocaleString(),
      });
    } catch (error) {
      setScraperError(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          `Scraper failed: ${error.message}`
      );
    } finally {
      setScraperLoading(false);
    }
  };

  const runScraper = () => {
    if (DEMO_MODE) runScraperWithProgress();
    else runScraperFallback();
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo data? This will clear posted tasks, scraped tasks, and chat messages, then re-seed.')) return;
    setResetting(true);
    setResetMessage('');
    try {
      const response = await axios.post(
        `${API_BASE}/api/demo/reset`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResetMessage(`Demo data reset. ${response.data.tasks_deleted ?? 0} tasks cleared.`);
      setScraperResult(null);
      setScraperProgress(0);
      setScraperStatus('');
    } catch (error) {
      setResetMessage(
        error?.response?.data?.detail || `Reset failed: ${error.message}`
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#f5f3f1] px-6 py-10">
      <div className="mx-auto w-full max-w-[1380px]">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8f3737]">
              Admin Dashboard
            </p>
            <h1 className="mt-3 font-serif text-4xl text-slate-900 sm:text-5xl">
              Operations
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Manage services, run market intelligence scraping, and control demo data.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {DEMO_MODE && (
              <button
                onClick={handleResetDemo}
                disabled={resetting}
                className="rounded-full border border-[#8f3737] bg-white px-5 py-3 text-sm font-medium text-[#8f3737] transition hover:bg-[#8f3737] hover:text-white disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : '🔄 Reset Demo Data'}
              </button>
            )}
            <button
              onClick={handleLogout}
              className="rounded-full bg-[#8f3737] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#742c2c]"
            >
              Logout
            </button>
          </div>
        </div>

        {resetMessage && (
          <div className="mb-6 rounded-2xl border border-[#e7dfd7] bg-[#fbf8f5] px-4 py-3 text-sm text-slate-700">
            {resetMessage}
          </div>
        )}

        {/* Scraper Section */}
        <section className="mb-8 rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2b8f8a]">
              Market Intelligence
            </p>
            <h2 className="mt-2 font-serif text-3xl text-slate-900">
              Craigslist Scraper
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pull live gig listings from Craigslist to enrich the marketplace with
              real-world tasks across selected cities.
            </p>
          </div>

          {/* Last run summary */}
          <div className="mb-6 grid gap-4 rounded-2xl border border-[#e7dfd7] bg-[#fbf8f5] p-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Scraped', value: scraperResult?.scraped ?? '—' },
              { label: 'Inserted', value: scraperResult?.inserted ?? '—' },
              { label: 'Updated', value: scraperResult?.updated ?? '—' },
              { label: 'Errors', value: scraperResult?.errors ?? '—' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
                <p className="mt-1 font-serif text-3xl text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {scraperLoading && (
            <div className="mb-6 rounded-2xl border border-[#2b8f8a]/30 bg-[#2b8f8a]/5 p-5">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-[#2b8f8a]">{scraperStatus || 'Working...'}</span>
                <span className="font-mono text-xs text-slate-500">{scraperProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#e7dfd7]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2b8f8a] to-[#227670] transition-all duration-500"
                  style={{ width: `${scraperProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* City picker */}
          <div className="mb-5">
            <p className="mb-3 text-sm font-medium text-slate-700">Cities to scrape</p>
            <div className="flex flex-wrap gap-2">
              {cities.map((city) => {
                const active = selectedCities.includes(city);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      active
                        ? 'border-[#2b8f8a] bg-[#2b8f8a] text-white'
                        : 'border-[#e2d8cf] bg-white text-slate-700 hover:border-[#2b8f8a]'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500">{selectedCities.length} selected</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={runScraper}
              disabled={scraperLoading || selectedCities.length === 0}
              className="rounded-full bg-gradient-to-r from-[#2b8f8a] to-[#227670] px-7 py-3 text-sm font-semibold text-white shadow-md transition hover:from-[#227670] hover:to-[#1c5e59] disabled:opacity-50"
            >
              {scraperLoading ? 'Running...' : 'Run Scraper'}
            </button>
          </div>

          {scraperError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {scraperError}
            </div>
          )}
        </section>

        {/* Services management */}
        <section className="rounded-[2rem] border border-[#e7dfd7] bg-white p-7 shadow-[0_18px_50px_rgba(15,23,42,0.05)] sm:p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8f3737]">
              Services
            </p>
            <h2 className="mt-2 font-serif text-3xl text-slate-900">Manage Services</h2>
          </div>

          <div className="mb-8">
            <AddServiceForm onServiceAdded={onServiceAdded} />
          </div>

          <div className="space-y-3">
            {services.length === 0 ? (
              <div className="rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] px-5 py-6 text-sm text-slate-500">
                No services yet.
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service._id}
                  className="rounded-[1.5rem] border border-[#e7dfd7] bg-[#fbf8f5] p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="pr-2">
                      <h3 className="text-lg font-semibold text-slate-900">{service.name}</h3>
                      <p className="mt-1 text-sm text-slate-600">{service.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        to={`/admin/services/edit/${service._id}`}
                        className="rounded-full border border-[#2b8f8a] px-4 py-2 text-xs font-semibold text-[#2b8f8a] transition hover:bg-[#2b8f8a] hover:text-white"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(service._id)}
                        className="rounded-full bg-[#8f3737] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#742c2c]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
