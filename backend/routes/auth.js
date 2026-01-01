const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

const router = express.Router();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildEmailQuery = (email) => ({ email: { $regex: `^${escapeRegex(email)}$`, $options: 'i' } });

// Register
router.post('/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty(),
  body('role').isIn(['mentor', 'mentee'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    console.log('Registration attempt for:', normalizedEmail, 'as', role);

    const existingUser = await User.findOne(buildEmailQuery(normalizedEmail));
    if (existingUser) {
      console.log('User already exists:', normalizedEmail);
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name: trimmedName, email: normalizedEmail, password: trimmedPassword, role });
    await user.save();
    console.log('User registered successfully:', normalizedEmail);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const trimmedPassword = typeof password === 'string' ? password.trim() : '';

    if (!normalizedEmail || !trimmedPassword) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Login attempt for email:', normalizedEmail);

    const user = await User.findOne(buildEmailQuery(normalizedEmail));
    if (!user) {
      console.log('User not found:', normalizedEmail);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log('User found, comparing passwords...');
    const isPasswordValid = await bcrypt.compare(trimmedPassword, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    console.log('Login successful for:', normalizedEmail);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Invalid authorization header' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('_id name email role');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Fetch current user error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

module.exports = router;