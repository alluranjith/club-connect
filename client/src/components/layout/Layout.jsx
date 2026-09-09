import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

// Routes where the navbar/footer must NOT render (per spec: login & create account pages)
const NO_CHROME_ROUTES = ['/login', '/register', '/forgot-password'];

const Layout = ({ children }) => {
  const location = useLocation();
  const hideChrome =
    NO_CHROME_ROUTES.includes(location.pathname) || location.pathname.startsWith('/reset-password');

  return (
    <>
      {!hideChrome && <Navbar />}
      <main>{children}</main>
      {!hideChrome && <Footer />}
    </>
  );
};

export default Layout;
