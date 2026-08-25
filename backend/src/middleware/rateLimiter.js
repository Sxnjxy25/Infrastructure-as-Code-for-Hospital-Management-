// Rate limiters disabled as requested
const apiLimiter = (req, res, next) => next();
const authLimiter = (req, res, next) => next();

module.exports = { apiLimiter, authLimiter };
