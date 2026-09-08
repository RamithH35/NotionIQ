import express from 'express';
import multer from 'multer';
import { Document } from '../models/Document.js';
import { Quiz } from '../models/Quiz.js';
import { requireAuth } from '../middleware/auth.js';
import { parseDocument } from '../services/parser.js';
import { aiRateLimiter, publicRateLimiter } from '../middleware/rateLimiter.js';
import { validateDocIdParam } from '../middleware/validate.js';

const router = express.Router();

// Enforce 10MB upload limit directly in memory storage
const MAX_FILE_SIZE = parseInt(process.env.MAX_UPLOAD_SIZE_BYTES || `${10 * 1024 * 1024}`, 10);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const ext = (file.originalname.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf' || ext === 'docx') {
      cb(null, true);
    } else {
      cb(new Error('Invalid File Type: Only genuine .pdf and .docx documents are permitted.'));
    }
  },
});

/**
 * Validate Actual File Content via Magic Bytes / Signatures
 */
function validateMagicBytes(buffer, originalname) {
  if (!buffer || buffer.length < 4) {
    throw new Error('Corrupted File: The uploaded file is empty or too short.');
  }

  const ext = (originalname.split('.').pop() || '').toLowerCase();

  // PDF Magic Bytes: %PDF- (0x25 0x50 0x44 0x46)
  const isPdfMagic = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

  // DOCX / ZIP Magic Bytes: PK\x03\x04 (0x50 0x4B 0x03 0x04)
  const isZipMagic = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;

  if (ext === 'pdf') {
    if (!isPdfMagic) {
      throw new Error('Security Error: Uploaded file does not match genuine PDF header signature.');
    }
  } else if (ext === 'docx') {
    if (!isZipMagic) {
      throw new Error('Security Error: Uploaded file does not match genuine OpenXML DOCX archive signature.');
    }
  } else {
    throw new Error('Unsupported format: Only .pdf and .docx documents are accepted.');
  }
}

// GET /api/documents - 3 demo docs + current user's doc (public with rate limiting)
router.get('/', publicRateLimiter(), async (req, res) => {
  try {
    const userId = req.session?.userId;
    
    // Fetch seeded demo docs (always public)
    const demoDocs = await Document.find({ isDemoDoc: true }).sort({ createdAt: 1 });
    
    // Fetch current user's uploaded doc (if logged in)
    let userDocs = [];
    if (userId) {
      userDocs = await Document.find({ ownerId: userId, isDemoDoc: false }).sort({ createdAt: -1 });
    }

    const allDocs = [...demoDocs, ...userDocs];
    return res.json({ documents: allDocs });
  } catch (err) {
    console.error('[Documents Error] Fetch documents error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve documents.' });
  }
});

// GET /api/documents/:id - Single document view (public for demo docs)
router.get('/:id', publicRateLimiter(), validateDocIdParam, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session?.userId;

    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Not Found', message: 'Document not found.' });
    }

    // Public if demo doc
    if (doc.isDemoDoc) {
      return res.json({ document: doc });
    }

    // If user doc, require auth and ownership
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Please sign in to view this document.' });
    }

    if (doc.ownerId && doc.ownerId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Access forbidden to this document.' });
    }

    return res.json({ document: doc });
  } catch (err) {
    console.error('[Documents Error] Get document error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve document.' });
  }
});

// POST /api/documents/upload - Multipart upload with magic bytes validation & quota checking
router.post('/upload', requireAuth, aiRateLimiter(), upload.single('file'), async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'Bad Request', message: 'No file uploaded. Please select a genuine .pdf or .docx document.' });
    }

    // Magic Bytes & Structure Verification
    validateMagicBytes(req.file.buffer, req.file.originalname);

    // Enforce 1 non-demo document quota per user
    const existingDocCount = await Document.countDocuments({
      ownerId: userId,
      isDemoDoc: false,
    });

    if (existingDocCount >= 1) {
      return res.status(409).json({
        error: 'Quota Exceeded',
        message: 'Each user is limited to 1 uploaded document in the sandbox. Please delete your existing document before uploading a new one.',
      });
    }

    // Sanitize filename
    const safeTitle = req.file.originalname
      .replace(/[^\w\s.-]/gi, '_')
      .slice(0, 150);

    // Execute safe memory-isolated parsing pipeline
    const parseResult = await parseDocument(
      req.file.buffer,
      safeTitle,
      req.file.mimetype
    );

    const newDoc = new Document({
      ownerId: userId,
      title: safeTitle,
      sourceType: parseResult.sourceType,
      rawText: parseResult.rawText,
      pageCount: parseResult.pageCount,
      isDemoDoc: false,
    });

    await newDoc.save();

    return res.status(201).json({
      message: 'Document uploaded and parsed successfully',
      document: newDoc,
    });
  } catch (err) {
    console.error('[Upload Error] Document upload error:', err.message);
    const clientMsg = err.message || 'Failed to parse and save document.';
    return res.status(400).json({ error: 'Upload Error', message: clientMsg });
  }
});

// DELETE /api/documents/:id - Delete user's own document
router.delete('/:id', requireAuth, validateDocIdParam, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ error: 'Not Found', message: 'Document not found.' });
    }

    if (doc.isDemoDoc) {
      return res.status(403).json({ error: 'Forbidden', message: 'Demo documents are protected and cannot be deleted.' });
    }

    if (!doc.ownerId || doc.ownerId.toString() !== userId) {
      return res.status(403).json({ error: 'Forbidden', message: 'Unauthorized to delete this document.' });
    }

    // Delete associated quizzes and document
    await Quiz.deleteMany({ docId: doc._id });
    await Document.findByIdAndDelete(id);

    return res.json({ message: 'Document and associated artifacts removed successfully.' });
  } catch (err) {
    console.error('[Documents Error] Delete document error:', err);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to delete document.' });
  }
});

export default router;
