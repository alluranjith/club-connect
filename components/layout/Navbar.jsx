import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { BsFillPeopleFill } from "react-icons/bs";
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const dashboardPathFor = (role) => `/${role}`;

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const close = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    close();
    navigate('/login');
  };

  // Close the mobile menu on every navigation so it doesn't stay open after tapping a link
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const links = (
    <>
      <NavLink to="/" end onClick={close}>Home</NavLink>
      <NavLink to="/clubs" onClick={close}>Clubs</NavLink>
      <NavLink to="/gallery" onClick={close}>Gallery</NavLink>
      <NavLink to="/about" onClick={close}>About</NavLink>

      {isAuthenticated ? (
        <>
          <NavLink to={dashboardPathFor(user.role)} onClick={close}>Dashboard</NavLink>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <NavLink to="/login" onClick={close} className="btn btn-outline btn-sm">Login</NavLink>
          <NavLink to="/register" onClick={close} className="btn btn-primary btn-sm" style={{color:'white'}}>Sign Up</NavLink>
        </>
      )}
    </>
  );

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-logo" onClick={close} style={{display:'flex',gap:'5px'}}>
        <BsFillPeopleFill  style={{ fontSize: 28, color: 'var(--color-primary)', marginBottom: 10 }} />
       ClubConnect</NavLink>

        {/* Desktop links */}
        <nav className="navbar-links navbar-links-desktop">
          {links}
          <ThemeToggle />
        </nav>

        {/* Mobile controls */}
        <div className="navbar-mobile-controls">
          <ThemeToggle />
          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {menuOpen && (
        <nav className="navbar-mobile-menu animate-slideDown">
          {links}
        </nav>
      )}
    </header>
  );
};

export default Navbar;
