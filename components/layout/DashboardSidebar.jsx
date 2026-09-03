import { NavLink, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {
  FiGrid, FiUsers, FiCalendar, FiBell, FiImage, FiUserCheck,
  FiTrendingUp, FiUser, FiClipboard, FiLogOut, FiClock, FiX,
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LINKS = {
  admin: [
    { to: '/admin', label: 'Overview', icon: <FiGrid />, end: true },
    { to: '/admin/clubs', label: 'Manage Clubs', icon: <FiUsers /> },
    { to: '/admin/coordinators', label: 'Coordinators', icon: <FiUserCheck /> },
    { to: '/admin/notifications', label: 'Notifications', icon: <FiBell /> },
    { to: '/admin/events', label: 'Events & Tracking', icon: <FiTrendingUp /> },
    { to: '/admin/gallery', label: 'Gallery', icon: <FiImage /> },
    { to: '/admin/users', label: 'All Users', icon: <FiClipboard /> },
  ],
  president: [
    { to: '/president', label: 'Overview', icon: <FiGrid />, end: true },
    { to: '/president/requests', label: 'Join Requests', icon: <FiUserCheck /> },
    { to: '/president/members', label: 'Members', icon: <FiUsers /> },
    { to: '/president/notifications', label: 'Notifications', icon: <FiBell /> },
    { to: '/president/events', label: 'Events & Tracking', icon: <FiTrendingUp /> },
    { to: '/president/gallery', label: 'Gallery', icon: <FiImage /> },
  ],
  coordinator: [
    { to: '/coordinator', label: 'Overview', icon: <FiGrid />, end: true },
    { to: '/coordinator/attendance', label: 'Attendance', icon: <FiClock /> },
    { to: '/coordinator/club-info', label: 'Club Info', icon: <FiClipboard /> },
    { to: '/coordinator/events', label: 'Events & Tracking', icon: <FiTrendingUp /> },
    { to: '/coordinator/gallery', label: 'Gallery', icon: <FiImage /> },
  ],
  member: [
    { to: '/member', label: 'Overview', icon: <FiGrid />, end: true },
    { to: '/member/notifications', label: 'Notifications', icon: <FiBell /> },
    { to: '/member/events', label: 'Events', icon: <FiCalendar /> },
    { to: '/member/participations', label: 'My Participations', icon: <FiTrendingUp /> },
    { to: '/member/gallery', label: 'Gallery', icon: <FiImage /> },
    { to: '/member/profile', label: 'Profile', icon: <FiUser /> },
  ],
};

// mobileOpen/onClose let the parent DashboardShell control the off-canvas drawer state
const DashboardSidebar = ({ role, mobileOpen, onClose }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-close the drawer whenever the route changes
  useEffect(() => { onClose?.(); /* eslint-disable-next-line */ }, [location.pathname]);

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={`sidebar animate-fadeIn ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-mobile-header">
          <span className="navbar-logo" style={{ fontSize: '1.15rem' }}>ClubConnect</span>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu"><FiX /></button>
        </div>
        {LINKS[role].map((link) => (
          <NavLink key={link.to} to={link.to} end={link.end}>
            {link.icon} {link.label}
          </NavLink>
        ))}
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="btn btn-outline btn-sm btn-block"
          style={{ marginTop: 20 }}
        >
          <FiLogOut /> Logout
        </button>
      </aside>
    </>
  );
};

export default DashboardSidebar;
