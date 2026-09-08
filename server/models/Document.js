import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  sourceType: {
    type: String,
    enum: ['pdf', 'docx', 'md', 'txt'],
    default: 'pdf',
  },
  rawText: {
    type: String,
    required: [true, 'Raw text content is required'],
  },
  pageCount: {
    type: Number,
    default: 1,
  },
  isDemoDoc: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Document = mongoose.model('Document', documentSchema);
