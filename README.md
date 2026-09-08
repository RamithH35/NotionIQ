# NotionIQ

> AI study assistant with document parsing, AI-generated notes, and interactive active recall quizzes.

NotionIQ is a full-stack developer and student study tool that extracts readable content from technical documents, synthesizes scannable concept notes, and formulates multiple-choice quizzes to reinforce learning.

---

## 🛠 Tech Stack

- **Frontend**: [Astro v5](https://astro.build/) & [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Session Auth**: `express-session` + `connect-mongo` (HTTP-only cookies)
- **AI & Parsing**: Google Gemini API (`gemini-3.6-flash`), local OmniRoute fallback, `pdf-parse`, and `mammoth`

---

## ✨ Features

- **Public Demo Mode**: Browse 3 pre-seeded technical documents (*Raft Consensus Protocol*, *Neural Attention Mechanics*, *Compilers & AST Optimization*) and take interactive recall quizzes immediately without signing in.
- **Authenticated Workspace**: Upload custom `.pdf` or `.docx` documents (1 user document quota in the sandbox), generate structured ~20-point study notes, and generate active recall quizzes.
- **Selectable Quiz Length**: Formulate 5, 10, 15, or 20 conceptual multiple-choice questions per document with instant explanation feedback.
- **Notes Section**: Save generated notes with custom titles linked to source documents (`linkedDocId`) for quick revision.
- **Reliable AI Routing**: Primary direct integration with Google Gemini Flash with fallback to a local OmniRoute instance (`http://localhost:20128`). Returns honest 503/502 errors on failure with zero canned/fabricated placeholder responses.
- **Security Hardened**:
  - Tiered rate limiting with exponential backoff on auth routes and quota protections on AI endpoints.
  - Strict input schema validation across registration, notes, and quiz length selectors.
  - Binary magic bytes inspection (`%PDF-` and OpenXML ZIP signatures) for file uploads with memory-isolated parsing.
  - Generic client-safe error messages with full server-side logging and security headers (`X-Content-Type-Options`, `X-Frame-Options`).

---

## 🎨 Design

Built with a strict black/white monochrome aesthetic inspired by Linear and Vercel dark mode:
- 4-level dark surface elevation (`#0a0a0a` canvas to `#222222` surface cards) with hairline 1px borders.
- Monospace technical badges, typewriter-style synthesis streams, and high-contrast typography.
- Color accents are strictly limited to semantic states: success green (`#3dd68c`) and error red (`#e5484d`).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster or local MongoDB instance

### 2. Environment Configuration
Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_random_session_secret_key

# Primary AI Provider
GEMINI_API_KEY=your_gemini_api_key

# Optional: Local OmniRoute Fallback
OMNIROUTE_API=your_omniroute_token
```

### 3. Installation & Database Seeding

```bash
# Install dependencies
npm install

# Seed demo documents and initial quizzes
npm run seed
```

### 4. Running Locally

Start the backend API server:
```bash
npm run server
# Runs on http://localhost:3000
```

In a separate terminal, start the frontend dev server:
```bash
npm run dev
# Runs on http://localhost:4321
```
