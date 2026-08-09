import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

function NavLink({ to, children }) {
  return (
    <Link to={to} className="relative group py-1">
      {children}
      <span className="absolute left-0 -bottom-0.5 h-0.5 w-0 bg-brass transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="bg-forest text-white sticky top-0 z-30 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg tracking-tight">
          <motion.svg
            whileHover={{ rotate: [0, -10, 10, -6, 0] }}
            transition={{ duration: 0.5 }}
            width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M4 8L12 3L20 8V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V8Z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="2.2" stroke="white" strokeWidth="1.6"/>
          </motion.svg>
          <span>KNUST Lost &amp; Found</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <NavLink to="/">Browse</NavLink>
          {user && <NavLink to="/report">Report an item</NavLink>}
          {user && <NavLink to="/my-reports">My reports</NavLink>}
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden sm:inline text-sm text-white/80">Hi, {user.name.split(" ")[0]}</span>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleLogout} className="text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-sm transition">
                Log out
              </motion.button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Link to="/register" className="text-sm font-medium bg-brass hover:bg-brass/90 px-3 py-1.5 rounded-sm transition inline-block">
                  Sign up
                </Link>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* mobile nav */}
      {user && (
        <div className="sm:hidden flex items-center gap-4 px-4 pb-3 text-sm font-medium">
          <Link to="/" className="hover:text-brass-50">Browse</Link>
          <Link to="/report" className="hover:text-brass-50">Report</Link>
          <Link to="/my-reports" className="hover:text-brass-50">Mine</Link>
          {user?.role === "admin" && <Link to="/admin" className="hover:text-brass-50">Admin</Link>}
        </div>
      )}
    </header>
  );
}
