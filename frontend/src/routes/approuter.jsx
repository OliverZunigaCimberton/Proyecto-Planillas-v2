// src/routes/approuter.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useauth';

// Importación de las páginas migradas
import { Login } from '../pages/login';
import { SeleccionApp } from '../pages/seleccionapp';
import { AdminVariables } from '../pages/adminvariables'; 
import { ReportanteVariables } from '../pages/reportantevariables'; 
import { AutorizadorVariables } from '../pages/autorizadorvariables'; 
import { ContadorVariables } from '../pages/contadorvariables'; // <-- IMPORTACIÓN DEL CONTADOR

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
                
                <Route path="/reportantevariables" element={<ProtectedRoute allowedRoles={['REPORTANTE']}><ReportanteVariables /></ProtectedRoute>} />
                <Route path="/autorizadorvariables" element={<ProtectedRoute allowedRoles={['AUTORIZADOR']}><AutorizadorVariables /></ProtectedRoute>} />
                
                {/* Ahora el Contador usa la interfaz real de React */}
                <Route path="/contadorvariables" element={<ProtectedRoute allowedRoles={['CONTADOR']}><ContadorVariables /></ProtectedRoute>} />
                
                <Route path="/adminvariables" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminVariables /></ProtectedRoute>} />

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};