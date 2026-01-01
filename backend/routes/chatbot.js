const express = require('express');
const { body, validationResult } = require('express-validator');
const { GoogleGenAI } = require('@google/genai');

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable not set');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const router = express.Router();

const messageValidators = [
  body('messages').isArray({ min: 1 }),
  body('messages.*.role').isString().trim().notEmpty(),
  body('messages.*.text').isString().trim().notEmpty(),
];

const sanitizeRole = (role) => {
  if (role === 'user') return 'user';
  return 'model';
};

const siteContext = `You are MentorVerse AI, the official assistant for a mentorship platform that connects mentees with mentors, manages doubt rooms, and supports career growth.
Always ground your answers in MentorVerse features: mentorship matching, session preparation, doubt room collaboration, and mentee support.
If mentors are unavailable, act as the fallback guide: answer mentee questions, suggest next steps, and recommend study plans.
When helpful, include 2-3 trusted learning resources with direct video links (e.g., reputable YouTube playlists, official course recordings). Provide a short description for every link.
Be encouraging, concise, and offer actionable tips. Do not invent site features or external offers. Always respond as MentorVerse AI.`;

router.post('/', messageValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid request payload', errors: errors.array() });
  }

  try {
    const rawMessages = req.body.messages.slice(-12);
    const conversation = rawMessages.map(({ role, text }) => {
      const speaker = sanitizeRole(role) === 'user' ? 'Mentee' : 'MentorVerse AI';
      return `${speaker}: ${text}`;
    }).join('\n');

    const prompt = `${siteContext}\n\nConversation so far:\n${conversation}\n\nMentorVerse AI:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const reply = typeof response.text === 'string' ? response.text.trim() : '';

    if (!reply) {
      return res.status(502).json({ message: 'Empty response from Gemini service' });
    }

    res.json({ reply });
  } catch (error) {
    console.error('Chatbot response error:', error);
    res.status(500).json({ message: 'Failed to generate chatbot response' });
  }
});

module.exports = router;
