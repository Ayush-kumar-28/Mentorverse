const express = require('express');
const jwt = require('jsonwebtoken');
const Doubt = require('../models/Doubt');
const User = require('../models/User');

const router = express.Router();

const authenticate = async (req, res, next) => {
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
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const mapDoubt = (doubt) => {
  const base = {
    id: doubt._id.toString(),
    title: doubt.title,
    description: doubt.description,
    author: doubt.authorName,
    participants: doubt.participants,
    messages: doubt.messages.map((message) => ({
      role: message.role,
      text: message.text,
      author: message.authorName
    }))
  };
  if (doubt.imageUrl) {
    base.imageUrl = doubt.imageUrl;
  }
  return base;
};

router.get('/', async (req, res) => {
  try {
    const doubts = await Doubt.find().sort({ createdAt: -1 });
    res.json(doubts.map(mapDoubt));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, imageUrl } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    const doubt = await Doubt.create({
      title,
      description,
      imageUrl,
      author: req.user._id,
      authorName: req.user.name,
      participants: 1,
      messages: []
    });
    res.status(201).json(mapDoubt(doubt));
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

