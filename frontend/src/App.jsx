import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Services from './components/Services';
import Portfolio from './components/Portfolio';
import Contact from './components/Contact';
import Login from './components/Login';
import Register from './components/Register';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';
import EditService from './components/EditService';
import ClientDashboard from './components/ClientDashboard';
import ClientMyTasks from './components/ClientMyTasks';
import TaskerDashboard from './components/TaskerDashboard';
import TaskerProfile from './components/TaskerProfile';
import EditProfile from './components/EditProfile';
import Chat from './components/Chat';
import FindTasker from './components/FindTasker';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Categories from './pages/Categories';
import Footer from './components/Footer';

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen w-full bg-[#f5f3f1] text-slate-900">
      {!isHomePage && (
        <header className="w-full border-b border-[#e7dfd7] bg-[#f5f3f1]">
          <div className="mx-auto max-w-[1400px] px-5 py-4 text-center sm:px-8 lg:px-10">
            <h1 className="text-2xl font-semibold tracking-tight">
              <span className="text-red-600">CRETE</span>{' '}
              <span className="text-slate-900">Handyman</span>
            </h1>
          </div>
        </header>
      )}

      <Navbar />

      <main className="w-full">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/taskers/:username" element={<TaskerProfile />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services/edit/:serviceId"
            element={
              <ProtectedRoute>
                <EditService />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/dashboard"
            element={
              <ProtectedRoute>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/tasks"
            element={
              <ProtectedRoute>
                <ClientMyTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasker/dashboard"
            element={
              <ProtectedRoute>
                <TaskerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks/:taskId/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/find-tasker"
            element={
              <ProtectedRoute>
                <FindTasker />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;