import { FiInstagram, FiTwitter, FiLinkedin, FiGithub, FiYoutube, FiFacebook, FiGlobe } from 'react-icons/fi';

const iconFor = (name = '', url = '') => {
  const k = `${name} ${url}`.toLowerCase();
  if (k.includes('instagram')) return <FiInstagram />;
  if (k.includes('twitter') || k.includes('x.com')) return <FiTwitter />;
  if (k.includes('linkedin')) return <FiLinkedin />;
  if (k.includes('github')) return <FiGithub />;
  if (k.includes('youtube')) return <FiYoutube />;
  if (k.includes('facebook')) return <FiFacebook />;
  return <FiGlobe />;
};

// Only http(s) links are ever rendered as anchors
const isSafe = (url) => /^https?:\/\//i.test(url || '');

const SocialLinks = ({ links = [] }) => {
  const safe = links.filter((l) => isSafe(l.url));
  if (!safe.length) return null;
  return (
    <div className="social-links">
      {safe.map((l, i) => (
        <a key={l._id || i} href={l.url} target="_blank" rel="noopener noreferrer" className="social-chip">
          {iconFor(l.name, l.url)} {l.name}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;
