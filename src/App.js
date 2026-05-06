import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import Forecast from "./Forecast";
import Alerts from "./Alerts";
import Settings from "./Settings";
import Profile from "./Profile";
import ProtectedRoute from "./ProtectedRoute";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md p-6">
          <div className="mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-3xl font-bold text-blue-600">$</span>
              <h2 className="text-2xl font-bold">Financial Tracker</h2>
            </div>
            <p className="text-gray-500 text-sm">Business Analytics</p>
          </div>
          <nav className="space-y-4">
            <Link to="/" className="block text-gray-700 hover:text-blue-600">Dashboard</Link>
            <Link to="/forecast" className="block text-gray-700 hover:text-blue-600">Forecast</Link>
            <Link to="/alerts" className="block text-gray-700 hover:text-blue-600">Alerts</Link>
            <Link to="/settings" className="block text-gray-700 hover:text-blue-600">Settings</Link>
            <Link to="/profile" className="block text-gray-700 hover:text-blue-600">Profile</Link>
            <Link to="/login" className="block text-gray-700 hover:text-blue-600">Login</Link>
            <Link to="/register" className="block text-gray-700 hover:text-blue-600">Register</Link>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forecast"
              element={
                <ProtectedRoute>
                  <Forecast />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <Alerts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
