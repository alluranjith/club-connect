// Usage: authorize('admin'), authorize('admin', 'president'), etc.
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource`);
    }
    next();
  };
};

// Ensures a president/coordinator is acting only within their own assigned club
const sameClubOrAdmin = (getClubIdFromReq) => {
  return (req, res, next) => {
    if (req.user.role === 'admin') return next();
    const targetClubId = getClubIdFromReq(req);
    if (!req.user.club || req.user.club.toString() !== String(targetClubId)) {
      res.status(403);
      throw new Error('You are not authorized to manage this club');
    }
    next();
  };
};

module.exports = { authorize, sameClubOrAdmin };
