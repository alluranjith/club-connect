import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import HeroBanner from '../common/HeroBanner';

// Routes where the navbar/footer must NOT render (per spec: login & create account pages)
const NO_CHROME_ROUTES = ['/login', '/register', '/forgot-password', '/complete-profile'];

const Layout = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;
  const hideChrome = NO_CHROME_ROUTES.includes(path) || path.startsWith('/reset-password');
  // Club detail pages render their own full-width poster instead of the shared banner
  const hideBanner = /^\/clubs\/[^/]+(\/[^/]+)?$/.test(path);

  return (
    <>
      {!hideChrome && <Navbar />}
      {!hideChrome && !hideBanner && <HeroBanner />}
      <main>{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
};

export default Layout;
