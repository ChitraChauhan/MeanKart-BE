const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  const { name, email } = req.body;
  
  try {
    let user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being updated and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    
    await user.save();
    
    // Return user data without password
    const userData = user.toObject();
    delete userData.password;
    
    res.json(userData);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    try {
        // Find user with password field
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Check if new password is the same as current password
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ 
                success: false,
                message: 'New password must be different from current password' 
            });
        }

        // Additional password strength validation
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Update password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();
        
        res.json({ 
            success: true,
            message: 'Password updated successfully'
        });
        
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error while updating password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
