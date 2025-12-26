const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all mentees
router.get('/', async (req, res) => {
  try {
    const mentees = await User.find({ role: 'mentee' }).select('-password');
    res.json(mentees);
  } catch (error) {
    console.error('Error fetching mentees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get mentee by ID
router.get('/:id', async (req, res) => {
  try {
    const mentee = await User.findOne({ _id: req.params.id, role: 'mentee' }).select('-password');
    if (!mentee) {
      return res.status(404).json({ message: 'Mentee not found' });
    }
    res.json(mentee);
  } catch (error) {
    console.error('Error fetching mentee:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Mentee not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
