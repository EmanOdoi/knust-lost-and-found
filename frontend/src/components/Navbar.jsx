import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { House, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function NavLink({ to, children }) {
  return (
    <Link to={to} className="relative group flex items-center gap-1 py-1">
      {children}
      <span className="absolute left-0 -bottom-0.5 h-0.5 w-0 bg-brass transition-all duration-300 group-hover:w-full" />
    </Link>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <>
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
          <NavLink to="/"><House size={17} aria-hidden="true" /> <span>Home</span></NavLink>
          <NavLink to="/browse"><Search size={17} aria-hidden="true" /> <span>Browse</span></NavLink>
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

      </header>

      {user && (
        <nav className="sm:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          <BottomNavButton to="/" active={location.pathname === "/"} icon="home">Home</BottomNavButton>
          <BottomNavButton to="/browse" active={location.pathname === "/browse"} icon="browse">Browse</BottomNavButton>
          <BottomNavButton to="/report" active={location.pathname === "/report"} icon="report">Report</BottomNavButton>
          <BottomNavButton to="/my-reports" active={location.pathname === "/my-reports"} icon="mine">Mine</BottomNavButton>
        </nav>
      )}
    </>
  );
}

function BottomNavButton({ to, active, icon, children }) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs font-semibold transition ${
        active ? "text-forest" : "text-ink/60 hover:text-ink"
      }`}
    >
      <BottomNavIcon name={icon} />
      {children}
      {active && (
        <motion.span
          layoutId="bottom-nav-indicator"
          className="absolute -bottom-2 h-0.5 w-9 rounded-full bg-brass"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
    </Link>
  );
}

function BottomNavIcon({ name }) {
  const commonProps = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (name === "report") {
    return (
      <svg {...commonProps}>
        <path d="M6 3h9l3 3v15H6z" />
        <path d="M15 3v4h4M9 12h6M9 16h6" />
      </svg>
    );
  }

  if (name === "mine") {
    return (
      <svg {...commonProps}>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    );
  }

  if (name === "home") {
    return (
      <svg {...commonProps}>
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
        <path d="M9 21v-6h6v6" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}
