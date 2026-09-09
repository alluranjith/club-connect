import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardShell from './components/layout/DashboardShell';
import Loader from './components/common/Loader';

// Public
import Home from './modules/public/Home';
import AboutUs from './modules/public/AboutUs';
import AboutClubs from './modules/public/AboutClubs';
import ClubDetail from './modules/public/ClubDetail';
import PublicGallery from './modules/public/PublicGallery';
import NotFound from './modules/public/NotFound';

// Auth
import Login from './modules/auth/Login';
import Register from './modules/auth/Register';
import ForgotPassword from './modules/auth/ForgotPassword';
import ResetPassword from './modules/auth/ResetPassword';

// Admin
import AdminOverview from './modules/admin/AdminOverview';
import ManageClubs from './modules/admin/ManageClubs';
import ManageCoordinators from './modules/admin/ManageCoordinators';
import AdminNotifications from './modules/admin/AdminNotifications';
import AdminEvents from './modules/admin/AdminEvents';
import AdminGallery from './modules/admin/AdminGallery';
import AllUsers from './modules/admin/AllUsers';

// President
import PresidentOverview from './modules/president/PresidentOverview';
import JoinRequests from './modules/president/JoinRequests';
import PresidentMembers from './modules/president/PresidentMembers';
import PresidentNotifications from './modules/president/PresidentNotifications';
import PresidentEvents from './modules/president/PresidentEvents';
import PresidentGallery from './modules/president/PresidentGallery';

// Coordinator
import CoordinatorOverview from './modules/coordinator/CoordinatorOverview';
import MarkAttendance from './modules/coordinator/MarkAttendance';
import CoordinatorClubInfo from './modules/coordinator/CoordinatorClubInfo';
import CoordinatorEvents from './modules/coordinator/CoordinatorEvents';
import CoordinatorGallery from './modules/coordinator/CoordinatorGallery';

// Member
import MemberOverview from './modules/member/MemberOverview';
import MemberNotifications from './modules/member/MemberNotifications';
import MemberEvents from './modules/member/MemberEvents';
import MemberParticipations from './modules/member/MemberParticipations';
import MemberGallery from './modules/member/MemberGallery';
import MemberProfile from './modules/member/MemberProfile';

import './styles/index.css';

const RootRedirect = () => {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <Loader fullscreen />;
  if (isAuthenticated) return <Navigate to={`/${user.role}`} replace />;
  return <Home />;
};

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        {/* ---------------- Public (no login required) ---------------- */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/clubs" element={<AboutClubs />} />
        <Route path="/clubs/:id" element={<ClubDetail />} />
        <Route path="/gallery" element={<PublicGallery />} />

        {/* ---------------- Auth (navbar/footer hidden here) ---------------- */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* ---------------- Admin ---------------- */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardShell role="admin"><AdminOverview /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/admin/clubs" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardShell role="admin"><ManageClubs /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/admin/coordinators" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardShell role="admin"><ManageCoordinators /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/admin/notifications" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardShell role="admin"><AdminNotifications /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/admin/events" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardShell role="admin"><AdminEvents /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/admin/gallery" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardShell role="admin"><AdminGallery /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardShell role="admin"><AllUsers /></DashboardShell>
          </ProtectedRoute>
        } />

        {/* ---------------- President ---------------- */}
        <Route path="/president" element={
          <ProtectedRoute allowedRoles={['president']}>
            <DashboardShell role="president"><PresidentOverview /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/president/requests" element={
          <ProtectedRoute allowedRoles={['president']}>
            <DashboardShell role="president"><JoinRequests /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/president/members" element={
          <ProtectedRoute allowedRoles={['president']}>
            <DashboardShell role="president"><PresidentMembers /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/president/notifications" element={
          <ProtectedRoute allowedRoles={['president']}>
            <DashboardShell role="president"><PresidentNotifications /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/president/events" element={
          <ProtectedRoute allowedRoles={['president']}>
            <DashboardShell role="president"><PresidentEvents /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/president/gallery" element={
          <ProtectedRoute allowedRoles={['president']}>
            <DashboardShell role="president"><PresidentGallery /></DashboardShell>
          </ProtectedRoute>
        } />

        {/* ---------------- Coordinator ---------------- */}
        <Route path="/coordinator" element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <DashboardShell role="coordinator"><CoordinatorOverview /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/coordinator/attendance" element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <DashboardShell role="coordinator"><MarkAttendance /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/coordinator/club-info" element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <DashboardShell role="coordinator"><CoordinatorClubInfo /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/coordinator/events" element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <DashboardShell role="coordinator"><CoordinatorEvents /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/coordinator/gallery" element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <DashboardShell role="coordinator"><CoordinatorGallery /></DashboardShell>
          </ProtectedRoute>
        } />

        {/* ---------------- Member (accepted & non-club members share these routes) ---------------- */}
        <Route path="/member" element={
          <ProtectedRoute allowedRoles={['member']}>
            <DashboardShell role="member"><MemberOverview /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/member/notifications" element={
          <ProtectedRoute allowedRoles={['member']}>
            <DashboardShell role="member"><MemberNotifications /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/member/events" element={
          <ProtectedRoute allowedRoles={['member']}>
            <DashboardShell role="member"><MemberEvents /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/member/participations" element={
          <ProtectedRoute allowedRoles={['member']}>
            <DashboardShell role="member"><MemberParticipations /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/member/gallery" element={
          <ProtectedRoute allowedRoles={['member']}>
            <DashboardShell role="member"><MemberGallery /></DashboardShell>
          </ProtectedRoute>
        } />
        <Route path="/member/profile" element={
          <ProtectedRoute allowedRoles={['member']}>
            <DashboardShell role="member"><MemberProfile /></DashboardShell>
          </ProtectedRoute>
        } />

        {/* ---------------- Fallback ---------------- */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
