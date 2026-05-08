import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleRoute = ({ children, roles }) => {
    const { user } = useAuth();

    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default RoleRoute;
