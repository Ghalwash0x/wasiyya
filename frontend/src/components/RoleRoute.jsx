import React from 'react';
import { useAuth } from '../context/AuthContext';
import AccessDenied from '../pages/AccessDenied';

const RoleRoute = ({ children, roles }) => {
    const { user } = useAuth();

    if (!user || !roles.includes(user.role)) {
        return <AccessDenied />;
    }

    return children;
};

export default RoleRoute;
