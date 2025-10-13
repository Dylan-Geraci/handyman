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

function App() {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-blue-600 text-center py-4">
          Handyman Services
        </h1>
        <Navbar />
        <hr className="my-4" />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/taskers/:username" element={<TaskerProfile />} />
          {/* ADDED: Routes for the password reset flow */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route 
            path="/admin/dashboard" 
            element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/admin/services/edit/:serviceId" 
            element={<ProtectedRoute><EditService /></ProtectedRoute>} 
          />
          <Route 
            path="/client/dashboard" 
            element={<ProtectedRoute><ClientDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/tasker/dashboard" 
            element={<ProtectedRoute><TaskerDashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/profile/edit" 
            element={<ProtectedRoute><EditProfile /></ProtectedRoute>} 
          />
          <Route 
            path="/tasks/:taskId/chat" 
            element={<ProtectedRoute><Chat /></ProtectedRoute>} 
          />
          <Route 
            path="/find-tasker" 
            element={<ProtectedRoute><FindTasker /></ProtectedRoute>} 
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;