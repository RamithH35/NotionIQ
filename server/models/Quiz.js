import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  stem: {
    type: String,
  },
  options: {
    type: [String],
    required: true,
  },
  correctIndex: {
    type: Number,
    required: true,
  },
  explanation: {
    type: String,
    default: '',
  },
}, { _id: false });

const quizSchema = new mongoose.Schema({
  docId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
  },
  questions: [questionSchema],
  generatedByModel: {
    type: String,
    required: true,
    default: 'OmniRoute / gemini-2.5-flash',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Quiz = mongoose.model('Quiz', quizSchema);
