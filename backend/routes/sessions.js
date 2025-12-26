const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Session = require('../models/Session');
const User = require('../models/User');

const router = express.Router();

const normalizeAvailability = (availability) => {
  if (!availability) {
    return {};
  }
  if (availability instanceof Map) {
    return Object.fromEntries(availability);
  }
  if (typeof availability === 'object') {
    return availability;
  }
  return {};
};

const mapParticipant = (participant = {}) => ({
  name: participant.name || '',
  title: participant.title || '',
  company: participant.company || '',
  expertise: Array.isArray(participant.expertise) ? participant.expertise : [],
  matchReasoning: participant.matchReasoning || '',
  availability: normalizeAvailability(participant.availability),
  bio: participant.bio || '',
  experience: Array.isArray(participant.experience) ? participant.experience : [],
  email: participant.email || ''
});

const mapSession = (session) => ({
  id: session._id.toString(),
  mentor: mapParticipant(session.mentor),
  mentee: mapParticipant(session.mentee),
  reason: session.reason || '',
  scheduledStart: session.scheduledStart.toISOString(),
  durationMinutes: session.durationMinutes,
  status: session.status,
  meetingLink: session.meetingLink || '',
  chatHistory: Array.isArray(session.chatHistory)
    ? session.chatHistory.map((message) => ({
        role: message.role,
        text: message.text,
        author: message.author || ''
      }))
    : []
});

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    // Build filter based on authenticated user role
    const user = await User.findById(req.user.id).select('name role email');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Default: show sessions the user created (mentee)
    let filter = { createdBy: req.user.id };

    // If mentor, show sessions assigned to this mentor
    // Match by name OR email to handle cases where names might differ
    if (user.role === 'mentor') {
      const escapedName = user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedEmail = user.email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter = {
        $or: [
          { 'mentor.name': { $regex: `^${escapedName}$`, $options: 'i' } },
          { 'mentor.email': { $regex: `^${escapedEmail}$`, $options: 'i' } }
        ]
      };
      console.log('Mentor session filter:', JSON.stringify(filter));
      console.log('Mentor user:', { name: user.name, email: user.email, role: user.role });
    }
    
    // Filter by status if provided
    if (req.query.status) {
      if (!['upcoming', 'completed', 'cancelled'].includes(req.query.status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid status. Must be: upcoming, completed, or cancelled' 
        });
      }
      filter.status = req.query.status;
    }
    
    // Filter by date range if provided
    if (req.query.startDate || req.query.endDate) {
      filter.scheduledStart = {};
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid startDate format' 
          });
        }
        filter.scheduledStart.$gte = startDate;
      }
      if (req.query.endDate) {
        const endDate = new Date(req.query.endDate);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid endDate format' 
          });
        }
        filter.scheduledStart.$lte = endDate;
      }
    }
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    const [sessions, totalCount] = await Promise.all([
      Session.find(filter)
        .sort({ scheduledStart: -1 })
        .skip(skip)
        .limit(limit),
      Session.countDocuments(filter)
    ]);
    
    res.json({ 
      success: true,
      sessions: sessions.map(mapSession),
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { mentor, mentee, reason, scheduledStart, durationMinutes, meetingLink } = req.body;
    if (!mentor || !mentor.name) {
      return res.status(400).json({ message: 'Mentor information is required' });
    }
    if (!mentee || !mentee.name) {
      return res.status(400).json({ message: 'Mentee information is required' });
    }
    if (!scheduledStart) {
      return res.status(400).json({ message: 'scheduledStart is required' });
    }
    const start = new Date(scheduledStart);
    if (Number.isNaN(start.getTime())) {
      return res.status(400).json({ message: 'scheduledStart must be a valid date' });
    }
    let session = await Session.create({
      mentor,
      mentee,
      reason,
      scheduledStart: start,
      durationMinutes: durationMinutes || 30,
      meetingLink,
      createdBy: req.user.id
    });

    // Generate deterministic Jitsi room and link using session id
    const roomName = `MentorVerse-Session-${session._id.toString()}`;
    session.meetingLink = `https://meet.jit.si/${roomName}`;
    await session.save();

    res.status(201).json({ session: mapSession(session) });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session || session.createdBy.toString() !== req.user.id) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({ session: mapSession(session) });
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['upcoming', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { status, updatedBy: req.user.id },
      { new: true }
    );
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({ session: mapSession(session) });
  } catch (error) {
    console.error('Error updating session status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

