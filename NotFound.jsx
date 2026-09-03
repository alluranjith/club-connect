import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="page container flex-center" style={{ flexDirection: 'column', textAlign: 'center' }}>
    <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
    <p className="section-subtitle">This page doesn't exist.</p>
    <Link to="/" className="btn btn-primary">Go home</Link>
  </div>
);

export default NotFound;
