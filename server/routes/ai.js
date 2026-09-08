import express from 'express';
import { Document } from '../models/Document.js';
import { Quiz } from '../models/Quiz.js';
import { requireAuth } from '../middleware/auth.js';
import { generateContent } from '../services/omniRoute.js';
import { aiRateLimiter, publicRateLimiter } from '../middleware/rateLimiter.js';
import { validateQuizCount, validateDocIdParam } from '../middleware/validate.js';

const router = express.Router();

// POST /api/documents/:id/create-notes (and alias /analyze for backwards compatibility)
async function handleCreateShortNotes(req, res) {
  try {
    const { id } = req.params;
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Not Found', message: 'Document not found' });
    }

    const prompt = `Read and analyze the following technical document carefully.
Extract and formulate a structured list of approximately 20 concise, scannable short notes/topics.
Requirements:
1. Provide around 20 distinct bullet points covering key definitions, invariants, mechanics, architectures, and tradeoffs.
2. Keep each point scannable (ideally 1-2 lines per point, short-notes style).
3. Format as a clean markdown list with bold lead-ins for each point.

Document Title: ${doc.title}
Document Content:
${doc.rawText.slice(0, 10000)}`;

    const response = await generateContent({
      prompt,
      systemInstruction: 'You are an elite technical educator and knowledge architect. Output a clean, scannable list of approximately 20 concise study notes with bold topic headers for each point.',
    });

    return res.json({
      notes: response.text,
      analysis: response.text, // backwards compatibility
      model: response.model,
    });
  } catch (err) {
    console.error('[AI Error] Create short notes error:', err.message);
    return res.status(503).json({ error: 'AI Service Unavailable', message: 'AI analysis is temporarily unavailable, please try again' });
  }
}

router.post('/:id/create-notes', requireAuth, aiRateLimiter(), validateDocIdParam, handleCreateShortNotes);
router.post('/:id/analyze', requireAuth, aiRateLimiter(), validateDocIdParam, handleCreateShortNotes);

// POST /api/documents/:id/generate-quiz - Generate selectable count (5 / 10 / 15 / 20)
router.post('/:id/generate-quiz', requireAuth, aiRateLimiter(), validateDocIdParam, validateQuizCount, async (req, res) => {
  try {
    const { id } = req.params;
    const requestedCount = parseInt(req.body?.count || req.query?.count || '5', 10);
    const count = [5, 10, 15, 20].includes(requestedCount) ? requestedCount : 5;

    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Not Found', message: 'Document not found' });
    }

    const prompt = `Generate a rigorous ${count}-question multiple-choice active recall quiz based on this technical document.
You MUST generate EXACTLY ${count} questions.
For each question, return valid JSON format strictly matching this structure:
[
  {
    "question": "Clear, challenging question testing a critical invariant or concept?",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctIndex": 0,
    "explanation": "Thorough technical explanation of why this answer is correct."
  }
]

Document Title: ${doc.title}
Document Content:
${doc.rawText.slice(0, 10000)}`;

    let response = await generateContent({
      prompt,
      systemInstruction: `You are a rigorous technical educator. You MUST output ONLY a valid JSON array with EXACTLY ${count} question objects.`,
    });

    let questions = [];
    function parseQuizText(rawText) {
      let cleanedText = rawText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      const jsonStart = cleanedText.indexOf('[');
      const jsonEnd = cleanedText.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        cleanedText = cleanedText.slice(jsonStart, jsonEnd + 1);
      }
      
      return JSON.parse(cleanedText);
    }

    try {
      questions = parseQuizText(response.text);
    } catch (parseErr) {
      console.warn('Initial quiz JSON parse failed, retrying once...', parseErr.message);
      try {
        response = await generateContent({
          prompt: `${prompt}\n\nIMPORTANT: Make sure your response is strictly valid, parseable JSON only.`,
          systemInstruction: `Output strictly valid JSON array containing ${count} question objects.`,
        });
        questions = parseQuizText(response.text);
      } catch (retryErr) {
        console.error('Quiz retry failed:', retryErr.message);
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(502).json({ error: 'AI Formatting Error', message: 'AI generated response could not be formatted as a quiz, please try again.' });
    }

    // Save or update Quiz in collection
    const quiz = await Quiz.findOneAndUpdate(
      { docId: doc._id },
      {
        docId: doc._id,
        questions,
        generatedByModel: response.model,
        createdAt: new Date(),
      },
      { upsert: true, returnDocument: 'after' }
    );

    return res.json({
      quiz,
      model: response.model,
      count: questions.length,
      requestedCount: count,
    });
  } catch (err) {
    console.error('[AI Error] Generate quiz error:', err.message);
    return res.status(503).json({ error: 'AI Service Unavailable', message: 'AI analysis is temporarily unavailable, please try again' });
  }
});

// GET /api/documents/:id/quiz - Fetch existing quiz (public for demo docs)
router.get('/:id/quiz', publicRateLimiter(), validateDocIdParam, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.userId;

    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Not Found', message: 'Document not found' });
    }

    // If user doc, require auth
    if (!doc.isDemoDoc && !userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Please sign in to view this quiz' });
    }

    const quiz = await Quiz.findOne({ docId: id });
    if (!quiz) {
      return res.status(404).json({ error: 'Not Found', message: 'Quiz has not been generated for this document yet' });
    }

    return res.json({
      quiz,
      model: quiz.generatedByModel,
      documentTitle: doc.title,
    });
  } catch (err) {
    console.error('[AI Error] Fetch quiz error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve quiz' });
  }
});

export default router;
