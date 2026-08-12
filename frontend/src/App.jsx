import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ReportItem from "./pages/ReportItem";
import ItemDetail from "./pages/ItemDetail";
import MyReports from "./pages/MyReports";
import AdminDashboard from "./pages/AdminDashboard";
import { RequireAuth, RequireAdmin } from "./components/RouteGuards";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-parchment pb-20 sm:pb-0">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/report" element={<RequireAuth><ReportItem /></RequireAuth>} />
          <Route path="/my-reports" element={<RequireAuth><MyReports /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-ink/40 py-6 border-t border-line">
        KNUST Campus Lost &amp; Found Management System
      </footer>
    </div>
  );
}
