// src/app.jsx
import { AuthProvider } from './context/authprovider';
import { AppRouter } from './routes/approuter';

// Importación única y centralizada de estilos del proyecto
import './styles/styles.css';

function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}

export default App;