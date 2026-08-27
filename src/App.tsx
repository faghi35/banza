import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Settings from "@/pages/Settings";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminConversations from "@/pages/admin/AdminConversations";
import AdminModels from "@/pages/admin/AdminModels";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminLogs from "@/pages/admin/AdminLogs";
import AdminDiagnostics from "@/pages/admin/AdminDiagnostics";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/settings" element={<Settings />} />

      {/* Espace d'administration Banza AI */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="diagnostics" element={<AdminDiagnostics />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="conversations" element={<AdminConversations />} />
        <Route path="models" element={<AdminModels />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="logs" element={<AdminLogs />} />
      </Route>

      {/* Fallback route inconnue vers l'accueil */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
