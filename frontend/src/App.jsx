import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyWill from './pages/MyWill';
import Assets from './pages/Assets';
import Documents from './pages/Documents';
import Beneficiaries from './pages/Beneficiaries';
import Verification from './pages/Verification';
import AdminPanel from './pages/AdminPanel';
import BeneficiaryAccess from './pages/BeneficiaryAccess';

const App = () => (
    <AuthProvider>
        <BrowserRouter>
            <Routes>
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/access/:token" element={<BeneficiaryAccess />} />

                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/will"      element={<ProtectedRoute><MyWill /></ProtectedRoute>} />
                <Route path="/assets"    element={<ProtectedRoute><Assets /></ProtectedRoute>} />
                <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
                <Route path="/beneficiaries" element={<ProtectedRoute><Beneficiaries /></ProtectedRoute>} />
                <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />

                <Route path="/admin" element={
                    <ProtectedRoute>
                        <RoleRoute roles={['admin']}>
                            <AdminPanel />
                        </RoleRoute>
                    </ProtectedRoute>
                } />

                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    </AuthProvider>
);

export default App;
