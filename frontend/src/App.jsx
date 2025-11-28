import { Routes, Route } from 'react-router-dom';
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
import TaskerDashboard from './components/TaskerDashboard';
import TaskerProfile from './components/TaskerProfile';
import EditProfile from './components/EditProfile';
import Chat from './components/Chat';
import FindTasker from './components/FindTasker';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import Categories from './pages/Categories';
import Footer from './components/Footer';

function App() {
  return (
    // Global shell: soft neutral background, dark text
    <div className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="max-w-6xl mx-auto px-4 pb-10">
        {/* Brand header */}
        <h1 className="text-2xl font-semibold text-center py-4 tracking-tight">
          <span className="text-red-600">CRETE</span>{' '}
          <span className="text-slate-900">Handyman</span>
        </h1>

        <Navbar />

        <hr className="my-4 border-neutral-200" />

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

          {/* ADDED: Routes for the password reset flow */}
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
        <Footer />
      </div>
    </div>
  );
}

export default App;
