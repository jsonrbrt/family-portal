import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { CircularProgress, Box } from '@mui/material';

// Create these pages next
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Photos from './pages/Photos';
import Albums from './pages/Albums';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return user ? children : <Navigate to="/login" />
};

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route 
      path="/login" 
      element={user ? <Navigate to="/dashboard" /> : <Login />}
      />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />}
      />

      <Route
      path="/dashboard"
      element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      }
      />

      <Route
      path="/documents"
      element={
        <ProtectedRoute>
          <Documents />
        </ProtectedRoute>
      }
      />

      <Route
      path="/photos"
      element={
        <ProtectedRoute>
          <Photos />
        </ProtectedRoute>
      }
      />

      <Route
      path="/albums"
      element={
        <ProtectedRoute>
          <Albums />
        </ProtectedRoute>
      }
      />

      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

export default App;