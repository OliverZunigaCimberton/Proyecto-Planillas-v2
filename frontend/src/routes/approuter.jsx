// src/routes/approuter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useauth';

// ✨ 1. Importaciones actualizadas a los nuevos nombres limpios
import { Login } from '../pages/login';
import { SeleccionApp } from '../pages/seleccionapp';
import { Admin } from '../pages/admin'; 
import { Reportante } from '../pages/reportante'; 
import { Autorizador } from '../pages/autorizador'; 
import { Contador } from '../pages/contador';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (allowedRoles && !allowedRoles.includes(user?.rol?.toUpperCase())) return <Navigate to="/seleccionapp" replace />;
    return children;
};

const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    if (isAuthenticated) return <Navigate to="/seleccionapp" replace />;
    return children;
};

export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/seleccionapp" element={<ProtectedRoute><SeleccionApp /></ProtectedRoute>} />
                
                {/* ✨ 2. Rutas dinámicas maestras (Nota el parámetro /:fase al final) */}
                <Route path="/reportante/:fase" element={<ProtectedRoute allowedRoles={['REPORTANTE']}><Reportante /></ProtectedRoute>} />
                <Route path="/autorizador/:fase" element={<ProtectedRoute allowedRoles={['AUTORIZADOR']}><Autorizador /></ProtectedRoute>} />
                <Route path="/contador/:fase" element={<ProtectedRoute allowedRoles={['CONTADOR']}><Contador /></ProtectedRoute>} />
                <Route path="/admin/:fase" element={<ProtectedRoute allowedRoles={['ADMIN']}><Admin /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};