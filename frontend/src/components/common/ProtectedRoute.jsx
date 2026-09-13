import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
}
