if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET environment variable is not set. Using default secret for development only.');
}

module.exports = {
  secret: process.env.JWT_SECRET || 'hms_dev_only_secret_do_not_use_in_prod',
  expiresIn: '24h'
};
