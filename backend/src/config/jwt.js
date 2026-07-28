module = module.exports = {
  secret: process.env.JWT_SECRET || 'hms_super_secret_jwt_key_2026_capstone',
  expiresIn: '24h'
};
