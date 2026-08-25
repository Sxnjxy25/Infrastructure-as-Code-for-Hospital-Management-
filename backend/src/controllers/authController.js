const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const jwtConfig = require('../config/jwt');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { doctor: true, patient: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Audit log entry
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          resource: 'AUTH',
          details: `Successful login for user ${user.email}`,
          ipAddress: req.ip || req.socket?.remoteAddress || null
        }
      });
    } catch (auditErr) {
      console.error('Audit Log Warning (User Login):', auditErr.message);
    }

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        doctor: user.doctor,
        patient: user.patient
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        doctor: true,
        patient: true
      }
    });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
