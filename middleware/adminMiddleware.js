const User = require('../models/User');

// @desc    Check if user is admin
const admin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: 'Not authorized as an admin' });
    }
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = admin;
