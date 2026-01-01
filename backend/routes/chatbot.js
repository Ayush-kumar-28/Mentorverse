const express = require('express');
const { body, validationResult } = require('express-validator');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

const router = express.Router();

// Check if Gemini API key is available
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAI = null;

console.log('=== Gemini AI Initialization ===');
console.log('API Key present:', !!GEMINI_API_KEY);
console.log('API Key length:', GEMINI_API_KEY ? GEMINI_API_KEY.length : 0);
console.log('API Key starts with AIza:', GEMINI_API_KEY ? GEMINI_API_KEY.startsWith('AIza') : false);

if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your_gemini_api_key_here') {
  try {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('✅ Gemini AI initialized successfully');
    
    // Test the API key by trying to list models
    genAI.listModels().then(models => {
      console.log('✅ API key is working, available models:', models.length);
      console.log('First few models:', models.slice(0, 3).map(m => m.name));
    }).catch(error => {
      console.error('❌ API key test failed:', error.message);
    });
    
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error);
  }
} else {
  console.warn('⚠️ GEMINI_API_KEY not set or using placeholder value. Chatbot will return fallback responses.');
}
console.log('=================================')

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

// Test endpoint to check Gemini API status
router.get('/status', async (req, res) => {
  try {
    const status = {
      geminiInitialized: !!genAI,
      apiKeyPresent: !!GEMINI_API_KEY,
      apiKeyLength: GEMINI_API_KEY ? GEMINI_API_KEY.length : 0,
      apiKeyFormat: GEMINI_API_KEY ? GEMINI_API_KEY.startsWith('AIza') : false,
      timestamp: new Date().toISOString()
    };

    // Try to list models if genAI is available
    if (genAI) {
      try {
        const models = await genAI.listModels();
        status.availableModels = models.map(model => model.name);
      } catch (error) {
        status.modelListError = error.message;
      }
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', messageValidators, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Invalid request payload', errors: errors.array() });
  }

  try {
    // If Gemini AI is not available, return a helpful fallback response
    if (!genAI) {
      console.log('🤖 Chatbot: Using fallback response (no genAI instance)');
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

    console.log('🤖 Chatbot: Processing AI request...');
    const rawMessages = req.body.messages.slice(-12);
    const conversation = rawMessages.map(({ role, text }) => {
      const speaker = sanitizeRole(role) === 'user' ? 'Mentee' : 'MentorVerse AI';
      return `${speaker}: ${text}`;
    }).join('\n');

    const prompt = `${siteContext}\n\nConversation so far:\n${conversation}\n\nMentorVerse AI:`;
    console.log('🤖 Chatbot: Sending request to Gemini API...');

    // Use the standard gemini-pro model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text().trim();

    console.log('🤖 Chatbot: Received response from Gemini API, length:', reply.length);

    if (!reply) {
      console.log('🤖 Chatbot: Empty response from Gemini service');
      return res.status(502).json({ message: 'Empty response from Gemini service' });
    }

    console.log('🤖 Chatbot: Sending successful AI response');
    res.json({ reply });
  } catch (error) {
    console.error('🤖 Chatbot response error:', error);
    console.error('🤖 Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n')[0] // Just the first line of stack
    });
    
    // Return a helpful fallback response instead of an error
    const fallbackResponse = "I'm experiencing some technical difficulties right now. For immediate assistance, I recommend connecting with one of our mentors or posting your question in a doubt room where the community can help you!";
    console.log('🤖 Chatbot: Returning fallback response due to error');
    res.json({ reply: fallbackResponse });
  }
});

module.exports = router;
