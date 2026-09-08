import express from 'express';
import { Note } from '../models/Note.js';
import { requireAuth } from '../middleware/auth.js';
import { notesRateLimiter } from '../middleware/rateLimiter.js';
import { validateNotePayload } from '../middleware/validate.js';

const router = express.Router();

// Apply notes rate limiter across all note endpoints
router.use(notesRateLimiter());

// GET /api/notes - list current user's notes
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const notes = await Note.find({ ownerId: userId })
      .populate('linkedDocId', 'title sourceType')
      .sort({ updatedAt: -1 });

    return res.json({ notes });
  } catch (err) {
    console.error('[Notes Error] Fetch notes error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve notes. Please try again.' });
  }
});

// POST /api/notes - create note
router.post('/', requireAuth, validateNotePayload, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { title, content, linkedDocId } = req.body;

    const note = new Note({
      ownerId: userId,
      title: title.trim(),
      content: content || '',
      linkedDocId: linkedDocId || null,
    });

    await note.save();
    await note.populate('linkedDocId', 'title sourceType');

    return res.status(201).json({
      message: 'Note created successfully',
      note,
    });
  } catch (err) {
    console.error('[Notes Error] Create note error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to create note. Please try again.' });
  }
});

// PUT /api/notes/:id - update note
router.put('/:id', requireAuth, validateNotePayload, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;
    const { title, content, linkedDocId } = req.body;

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: 'Not Found', message: 'Note not found.' });
    }

    if (note.ownerId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Unauthorized to modify this note.' });
    }

    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content;
    if (linkedDocId !== undefined) note.linkedDocId = linkedDocId || null;
    note.updatedAt = new Date();

    await note.save();
    await note.populate('linkedDocId', 'title sourceType');

    return res.json({
      message: 'Note updated successfully',
      note,
    });
  } catch (err) {
    console.error('[Notes Error] Update note error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to update note. Please try again.' });
  }
});

// DELETE /api/notes/:id - delete note
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({ error: 'Not Found', message: 'Note not found.' });
    }

    if (note.ownerId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Unauthorized to delete this note.' });
    }

    await Note.findByIdAndDelete(id);

    return res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('[Notes Error] Delete note error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to delete note. Please try again.' });
  }
});

export default router;
