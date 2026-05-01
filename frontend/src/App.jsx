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
import About from "./components/About";
import RecommendedTasksPage from './pages/RecommendedTasksPage';
import DemoBanner from './components/DemoBanner';

// Pages that render their own full-bleed layout (no padding wrapper needed)
const FULL_BLEED_ROUTES = ['/'];

function AppContent() {
  const location = useLocation();
  const isFullBleed = FULL_BLEED_ROUTES.includes(location.pathname);

  return (
    <div className="min-h-screen w-full bg-[#f5f3f1] text-slate-900">
      <DemoBanner />
      <Navbar />

      <main className="w-full">
        {isFullBleed ? (
          // Homepage manages its own layout
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        ) : (
          // All other pages get a consistent centred content wrapper
          <div className="mx-auto w-full max-w-[1400px] px-8 py-10 lg:px-12">
            <Routes>
              <Route path="/services" element={<Services />} />
              <Route path="/about" element={<About />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/taskers/:username" element={<TaskerProfile />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              <Route path="/admin/dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/services/edit/:serviceId" element={<ProtectedRoute><EditService /></ProtectedRoute>} />
              <Route path="/client/dashboard" element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} />
              <Route path="/client/tasks" element={<ProtectedRoute><ClientMyTasks /></ProtectedRoute>} />
              <Route path="/tasker/dashboard" element={<ProtectedRoute><TaskerDashboard /></ProtectedRoute>} />
              <Route path="/recommended" element={<ProtectedRoute><RecommendedTasksPage /></ProtectedRoute>} />
              <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/tasks/:taskId/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
              <Route path="/find-tasker" element={<ProtectedRoute><FindTasker /></ProtectedRoute>} />
            </Routes>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;