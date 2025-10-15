const express = require('express');
const router = express.Router();
const {protect} = require('../middleware/authMiddleware');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

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

router.get('/addresses', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('addresses');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.addresses || []);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/addresses', protect, async (req, res) => {
    try {
        const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
        
        const newAddress = {
            _id: new mongoose.Types.ObjectId(),
            fullName,
            phone,
            addressLine1,
            addressLine2: addressLine2 || '',
            city,
            state,
            postalCode,
            country,
            isDefault: !!isDefault
        };

        if (isDefault) {
            await User.updateOne(
                { _id: req.user.id },
                { $set: { 'addresses.$[].isDefault': false } }
            );
        }

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { 
                $push: { 
                    addresses: newAddress 
                } 
            },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addedAddress = user.addresses.id(newAddress._id);
        res.status(201).json(addedAddress);
    } catch (error) {
        console.error('Error adding address:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/addresses/:addressId', protect, async (req, res) => {
    try {
        const { addressId } = req.params;
        const { fullName, phone, addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

        const update = {};
        const addressFields = ['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'state', 'postalCode', 'country'];
        
        const addressUpdate = {};
        addressFields.forEach(field => {
            if (req.body[field] !== undefined) {
                addressUpdate[`addresses.$.${field}`] = req.body[field];
            }
        });

        if (isDefault === true) {
            await User.updateOne(
                { _id: req.user.id },
                { $set: { 'addresses.$[].isDefault': false } }
            );
            
            addressUpdate['addresses.$.isDefault'] = true;
        } else if (isDefault === false) {
            addressUpdate['addresses.$.isDefault'] = false;
        }

        const user = await User.findOneAndUpdate(
            { _id: req.user.id, 'addresses._id': addressId },
            { $set: addressUpdate },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const updatedAddress = user.addresses.id(addressId);
        res.json(updatedAddress);
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.delete('/addresses/:addressId', protect, async (req, res) => {
    try {
        const { addressId } = req.params;
        
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { addresses: { _id: addressId } } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressExists = user.addresses.some(addr => addr._id.toString() === addressId);
        if (addressExists) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.put('/addresses/:addressId/set-default', protect, async (req, res) => {
    try {
        const { addressId } = req.params;
        
        await User.updateOne(
            { _id: req.user.id },
            { $set: { 'addresses.$[].isDefault': false } }
        );
        
        const user = await User.findOneAndUpdate(
            { _id: req.user.id, 'addresses._id': addressId },
            { $set: { 'addresses.$.isDefault': true } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'Address not found' });
        }

        res.json({ message: 'Default address updated successfully' });
    } catch (error) {
        console.error('Error setting default address:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;
