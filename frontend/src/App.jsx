import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
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
import ManagerPanel    from './pages/ManagerPanel';
import NotFound        from './pages/NotFound';

// Redirect to correct home based on role
const SmartRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user)                    return <Navigate to="/login"     replace />;
    if (user.role === 'admin')     return <Navigate to="/admin"     replace />;
    if (user.role === 'developer') return <Navigate to="/developer" replace />;
    if (user.role === 'manager')   return <Navigate to="/manager"   replace />;
    return                                <Navigate to="/dashboard"  replace />;
};

const App = () => (
    <AuthProvider>
        <SidebarProvider>
        <BrowserRouter>
            <Routes>
                {/* Public */}
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/access/:token" element={<BeneficiaryAccess />} />

                {/* User-only routes — admin/developer get AccessDenied */}
                <Route path="/dashboard"    element={<ProtectedRoute><RoleRoute roles={['user']}><Dashboard /></RoleRoute></ProtectedRoute>} />
                <Route path="/will"         element={<ProtectedRoute><RoleRoute roles={['user']}><MyWill /></RoleRoute></ProtectedRoute>} />
                <Route path="/assets"       element={<ProtectedRoute><RoleRoute roles={['user']}><Assets /></RoleRoute></ProtectedRoute>} />
                <Route path="/documents"    element={<ProtectedRoute><RoleRoute roles={['user']}><Documents /></RoleRoute></ProtectedRoute>} />
                <Route path="/beneficiaries" element={<ProtectedRoute><RoleRoute roles={['user']}><Beneficiaries /></RoleRoute></ProtectedRoute>} />
                <Route path="/verification"  element={<ProtectedRoute><RoleRoute roles={['user']}><Verification /></RoleRoute></ProtectedRoute>} />
                {/* 2FA is role-agnostic — all authenticated users can manage their own 2FA */}
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

                {/* Manager routes */}
                <Route path="/manager" element={
                    <ProtectedRoute>
                        <RoleRoute roles={['manager']}>
                            <ManagerPanel />
                        </RoleRoute>
                    </ProtectedRoute>
                } />

                {/* Smart redirect */}
                <Route path="/"  element={<SmartRedirect />} />
                <Route path="*"  element={<NotFound />} />
            </Routes>
        </BrowserRouter>
        </SidebarProvider>
    </AuthProvider>
);

export default App;
