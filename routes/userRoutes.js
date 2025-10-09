const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({message: 'Server error'});
    }
});

router.put('/profile', protect, async (req, res) => {
    const {name, email} = req.body;

    try {
        let user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({email});
            if (existingUser) {
                return res.status(400).json({message: 'Email already in use'});
            }
            user.email = email;
        }

        if (name) user.name = name;

        await user.save();

        const userData = user.toObject();
        delete userData.password;

        res.json(userData);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({message: 'Server error'});
    }
});

router.put('/change-password', protect, async (req, res) => {
    const {currentPassword, newPassword} = req.body;

    try {
        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({message: 'User not found'});
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({message: 'Current password is incorrect'});
        }

        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

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
