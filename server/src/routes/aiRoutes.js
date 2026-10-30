import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { processAIChat } from '../services/aiService.js';

const router = express.Router();

/**
 * @route   POST /api/v1/ai/chat
 * @desc    Process user inquiry through StudyMate AI
 * @access  Private
 */
router.post('/chat', protect, async (req, res) => {
  try {
    const { prompt, conversationHistory } = req.body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid question or prompt is required.',
      });
    }

    const aiResult = await processAIChat({
      prompt,
      user: req.user,
      conversationHistory: conversationHistory || [],
    });

    res.status(200).json({
      success: true,
      ...aiResult,
    });
  } catch (error) {
    console.error('[StudyMate AI Error]:', error);
    res.status(500).json({
      success: false,
      message: 'StudyMate AI encountered an issue processing your request. Please try again.',
      reply: "I'm having a momentary hiccup retrieving that. You can browse your Study Groups or ask me about finding classmates!",
    });
  }
});

/**
 * @route   POST /api/v1/ai/feedback
 * @desc    Submit thumbs up / thumbs down feedback on an AI response
 * @access  Private
 */
router.post('/feedback', protect, async (req, res) => {
  try {
    const { messageId, rating, prompt } = req.body;
    // Log feedback for monitoring
    console.log(`[StudyMate AI Feedback] User ${req.user?._id} rated message ${messageId}: ${rating}`);

    res.status(200).json({
      success: true,
      message: 'Thank you for your feedback! It helps StudyMate AI improve.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not record feedback.' });
  }
});

export default router;
