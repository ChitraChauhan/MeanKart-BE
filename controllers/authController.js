const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            name: user.name,
            isAdmin: user.isAdmin
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '30d',
        }
    );
};

exports.registerUser = async (req, res) => {
    const {name, email, password} = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({message: 'Please enter all fields'});
    }

    try {
        const userExists = await User.findOne({email});

        if (userExists) {
            return res.status(400).json({message: 'User already exists'});
        }

        const user = await User.create({
            name,
            email,
            password,
        });

        if (user) {
            return res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user),
                isAdmin: user.isAdmin,
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({message: 'Server Error'});
    }
};

exports.loginUser = async (req, res) => {
    const {email, password} = req.body;

    if (!email || !password) {
        return res.status(400).json({message: 'Please enter all fields'});
    }

    try {
        const user = await User.findOne({email}).select('+password');

        if (!user) {
            return res.status(401).json({message: 'Invalid email or password'});
        }

        const isMatch = await user.matchPassword(password);

        if (isMatch) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                token: generateToken(user),
                isAdmin: user.isAdmin,
                lastActive: Date.now()
            });
        } else {
            res.status(401).json({message: 'Invalid email or password'});
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            message: 'Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({message: 'Not authorized'});
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            lastActive: user.lastActive
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({message: 'Server error'});
    }
};
