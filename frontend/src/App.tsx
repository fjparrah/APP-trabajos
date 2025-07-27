import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { PrivateRoute } from "../auth/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import Tareas from "./pages/Tareas";
import NuevaTarea from "./pages/NuevaTarea";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/tareas/nueva"
          element={
            <PrivateRoute>
              <NuevaTarea />
            </PrivateRoute>
          }
        />
        <Route
          path="/tareas"
          element={
            <PrivateRoute>
              <Tareas />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute requireAdmin>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
