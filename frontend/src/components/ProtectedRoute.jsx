// frontend/src/components/ProtectedRoute.jsx
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { token } = useContext(AuthContext);

  if (!token) {
    // If there's no token, redirect to the login page
    return <Navigate to="/login" />;
  }

  // If there is a token, show the requested page
  return children;
}

export default ProtectedRoute;