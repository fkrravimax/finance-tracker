import { Navigate, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles = [] }: ProtectedRouteProps) => {
    const user = authService.getCurrentUser();

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && (!user.role || !allowedRoles.includes(user.role))) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
