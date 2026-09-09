import { useState } from 'react';
import { FiMenu } from 'react-icons/fi';
import DashboardSidebar from './DashboardSidebar';

const DashboardShell = ({ role, children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <DashboardSidebar role={role} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="dashboard-content animate-fadeIn">
        <button className="dashboard-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open dashboard menu">
          <FiMenu /> Menu
        </button>
        {children}
      </div>
    </div>
  );
};

export default DashboardShell;
