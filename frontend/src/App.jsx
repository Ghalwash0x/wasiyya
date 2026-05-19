import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute      from './components/RoleRoute';

import Login            from './pages/Login';
import Register         from './pages/Register';
import Dashboard        from './pages/Dashboard';
import MyWill           from './pages/MyWill';
import Assets           from './pages/Assets';
import Documents        from './pages/Documents';
import Beneficiaries    from './pages/Beneficiaries';
import Verification     from './pages/Verification';
import AdminPanel       from './pages/AdminPanel';
import DeveloperPanel   from './pages/DeveloperPanel';
import BeneficiaryAccess from './pages/BeneficiaryAccess';
import TwoFactorSetup  from './pages/TwoFactorSetup';

// Redirect to correct home based on role
const SmartRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user)                    return <Navigate to="/login"     replace />;
    if (user.role === 'admin')    return <Navigate to="/admin"     replace />;
    if (user.role === 'developer') return <Navigate to="/developer" replace />;
    return                               <Navigate to="/dashboard"  replace />;
};

const App = () => (
    <AuthProvider>
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/access/:token" element={<BeneficiaryAccess />} />

                {/* User routes */}
                <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/will"         element={<ProtectedRoute><MyWill /></ProtectedRoute>} />
                <Route path="/assets"       element={<ProtectedRoute><Assets /></ProtectedRoute>} />
                <Route path="/documents"    element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                <Route path="/beneficiaries" element={<ProtectedRoute><Beneficiaries /></ProtectedRoute>} />
                <Route path="/verification"  element={<ProtectedRoute><Verification /></ProtectedRoute>} />
                <Route path="/settings/2fa" element={<ProtectedRoute><TwoFactorSetup /></ProtectedRoute>} />

                {/* Admin routes */}
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <RoleRoute roles={['admin', 'developer']}>
                            <AdminPanel />
                        </RoleRoute>
                    </ProtectedRoute>
                } />

                {/* Developer routes */}
                <Route path="/developer" element={
                    <ProtectedRoute>
                        <RoleRoute roles={['developer']}>
                            <DeveloperPanel />
                        </RoleRoute>
                    </ProtectedRoute>
                } />

                {/* Smart redirect */}
                <Route path="/"  element={<SmartRedirect />} />
                <Route path="*"  element={<SmartRedirect />} />
            </Routes>
        </BrowserRouter>
    </AuthProvider>
);

export default App;
