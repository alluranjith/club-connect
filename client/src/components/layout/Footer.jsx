import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiGithub, FiMail, FiArrowUpRight, FiHeart } from 'react-icons/fi';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-glow" />
      <div className="container footer-top">
        <div className="footer-brand">
          <h3 className="footer-logo">ClubConnect</h3>
          <p className="footer-tagline">
            One platform to run every campus club — events, membership, attendance
            and galleries, all connected.
          </p>
          <div className="footer-socials">
            <a href="#" aria-label="Instagram"><FiInstagram /></a>
            <a href="#" aria-label="Twitter"><FiTwitter /></a>
            <a href="#" aria-label="GitHub"><FiGithub /></a>
            <a href="mailto:support@clubconnect.app" aria-label="Email"><FiMail /></a>
          </div>
        </div>

        <div className="footer-links-grid">
          <div className="footer-col">
            <h4>Explore</h4>
            <Link to="/">Home</Link>
            <Link to="/clubs">Clubs</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/about">About Us</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Login</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/forgot-password">Forgot Password</Link>
          </div>
          <div className="footer-col">
            <h4>Get in touch</h4>
            <a href="mailto:support@clubconnect.app">support@clubconnect.app</a>
            <span className="footer-muted">Campus Central, Building 4</span>
          </div>
        </div>
      </div>

      <div className="container footer-bottom">
        <p>© {year} ClubConnect. All rights reserved.</p>
        <p className="footer-madewith">
          Built with <FiHeart className="footer-heart" /> for campus communities
          <FiArrowUpRight style={{ marginLeft: 6 }} />
        </p>
      </div>
    </footer>
  );
};

export default Footer;
