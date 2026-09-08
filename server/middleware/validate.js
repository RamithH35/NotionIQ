import mongoose from 'mongoose';

/**
 * NotionIQ Centralized Input Validation Schemas
 * Rejects invalid types, unexpected lengths, or malformed data strictly.
 */

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  if (email.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

export function isValidPassword(password) {
  if (typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 128;
}

export function isValidName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 80;
}

export function isValidMongoId(id) {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);
}

export function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};

  if (!isValidName(name)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Name must be a string between 2 and 80 characters.' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Please provide a valid email address.' });
  }
  if (!isValidPassword(password)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Password must be between 6 and 128 characters.' });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body || {};

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Please provide a valid email address.' });
  }
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ error: 'Validation Error', message: 'Password is required.' });
  }

  next();
}

export function validateNotePayload(req, res, next) {
  const { title, content, linkedDocId } = req.body || {};

  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 200) {
      return res.status(400).json({ error: 'Validation Error', message: 'Note title must be a non-empty string up to 200 characters.' });
    }
  } else if (req.method === 'POST') {
    return res.status(400).json({ error: 'Validation Error', message: 'Note title is required.' });
  }

  if (content !== undefined) {
    if (typeof content !== 'string' || content.length > 50000) {
      return res.status(400).json({ error: 'Validation Error', message: 'Note content must be a string up to 50,000 characters.' });
    }
  }

  if (linkedDocId !== undefined && linkedDocId !== null && linkedDocId !== '') {
    if (!isValidMongoId(linkedDocId)) {
      return res.status(400).json({ error: 'Validation Error', message: 'linkedDocId must be a valid document identifier.' });
    }
  }

  next();
}

export function validateQuizCount(req, res, next) {
  const countRaw = req.body?.count ?? req.query?.count;
  if (countRaw !== undefined) {
    const parsed = Number(countRaw);
    if (!Number.isInteger(parsed) || ![5, 10, 15, 20].includes(parsed)) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Quiz length must be one of: 5, 10, 15, or 20 questions.',
      });
    }
  }
  next();
}

export function validateDocIdParam(req, res, next) {
  const { id } = req.params;
  if (!isValidMongoId(id)) {
    return res.status(400).json({ error: 'Validation Error', message: 'Invalid document ID format.' });
  }
  next();
}
