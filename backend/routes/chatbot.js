const express = require('express');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const router = express.Router();

// Check if Gemini API key is available
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;

if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (error) {
    console.error('Failed to initialize Gemini AI:', error);
  }
} else {
  console.warn('GEMINI_API_KEY not set or using placeholder value. Chatbot will return fallback responses.');
}

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
    // If Gemini AI is not available, return a helpful fallback response
    if (!genAI) {
      const fallbackResponses = [
        "I'm here to help with your mentorship journey! While I'm currently offline, I recommend browsing our available mentors or posting your question in a doubt room where other mentees and mentors can assist you.",
        "Great question! Although my AI features are temporarily unavailable, you can get immediate help by connecting with one of our expert mentors or joining an active doubt room discussion.",
        "I'd love to help you with that! For now, I recommend booking a session with one of our mentors who can provide personalized guidance on your topic.",
        "That's an interesting question! While I'm currently unable to provide AI-powered responses, our community of mentors and mentees in the doubt rooms are always ready to help.",
        "Thanks for reaching out! Although my AI capabilities are temporarily offline, you can get expert advice by browsing our mentor profiles and booking a session that fits your needs."
      ];
      
      const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return res.json({ reply: randomResponse });
    }

    const rawMessages = req.body.messages.slice(-12);
    const conversation = rawMessages.map(({ role, text }) => {
      const speaker = sanitizeRole(role) === 'user' ? 'Mentee' : 'MentorVerse AI';
      return `${speaker}: ${text}`;
    }).join('\n');

    const prompt = `${siteContext}\n\nConversation so far:\n${conversation}\n\nMentorVerse AI:`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text().trim();

    if (!reply) {
      return res.status(502).json({ message: 'Empty response from Gemini service' });
    }

    res.json({ reply });
  } catch (error) {
    console.error('Chatbot response error:', error);
    
    // Return a helpful fallback response instead of an error
    const fallbackResponse = "I'm experiencing some technical difficulties right now. For immediate assistance, I recommend connecting with one of our mentors or posting your question in a doubt room where the community can help you!";
    res.json({ reply: fallbackResponse });
  }
});

module.exports = router;
