const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token') || req.header('Authorization')?.split(' ')[1];

  // Check if no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.get('jwtSecret'));

    // Attach user info to request
    req.user = decoded.user;
    next();
  } catch (err) {
    // Invalid token
    return res.status(401).json({ msg: 'Token not valid' });
  }
};
