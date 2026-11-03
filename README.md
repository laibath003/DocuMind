# DocuMind AI — Intelligent Research Assistant

DocuMind AI is an AI-powered research assistant that helps users explore information from the web, analyze uploaded PDF documents, and combine both sources to generate context-aware answers.

It supports multiple research modes, intelligent query routing, semantic document retrieval, real-time AI response streaming, and source citations — all through a clean, intuitive research workspace.

## 🎥 Video Demo



## ✨ Features

### Multiple Research Modes

DocuMind provides four research modes:

- **Automatic Mode:** Uses AI to determine whether a question requires web search, document search, or both.
- **Web Search:** Retrieves relevant and up-to-date information from the internet.
- **Document Search:** Searches through uploaded PDF documents to answer questions using their content.
- **Hybrid Search:** Combines information from uploaded documents and web research to provide more comprehensive answers.

### AI-Powered Document Research

- Upload and manage multiple PDF documents.
- Extract text and divide documents into smaller chunks.
- Generate embeddings for semantic search.
- Retrieve relevant document sections using vector similarity.
- Generate context-aware answers grounded in uploaded documents.
- Include document citations with page references.

### Intelligent Web Research

- Search the web using Tavily.
- Retrieve relevant web results.
- Generate research-based answers using Gemini.
- Include source references and clickable links.

### Real-Time AI Streaming

- Stream AI-generated answers progressively.
- Display responses as they are generated instead of waiting for the entire response.
- Support streaming across research modes.

### Conversation Management

- Automatically save research conversations.
- View previous conversations in Saved Research.
- Reopen conversations with their complete message history.
- Preserve research modes and source citations.
- Delete saved conversations when no longer needed.

### Markdown Response Formatting

- Render headings, bold and italic text.
- Support numbered and bulleted lists.
- Display tables, code blocks, links, and horizontal dividers.
- Present AI responses in a readable format.

## 🛠️ Tech Stack

| Category | Technologies |
|---|---|
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| Backend | Node.js, Express.js, TypeScript |
| Database | Supabase PostgreSQL |
| Vector Search | pgvector |
| AI Integration | Google Gemini API |
| Web Search | Tavily API |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Document Processing | PDF text extraction, embeddings, semantic retrieval |
| Communication | REST APIs, Server-Sent Events (SSE) |

## 🧠 How It Works

### 1. Document Upload

Users upload PDF documents, which are stored in Supabase Storage.

### 2. Text Extraction and Processing

Text is extracted from uploaded PDFs, divided into smaller chunks, and converted into vector embeddings.

### 3. Semantic Retrieval

When a document-related question is asked, DocuMind generates an embedding for the query and retrieves relevant document chunks using Supabase PostgreSQL and pgvector.

### 4. Intelligent Query Routing

In Automatic Mode, Gemini analyzes the user's question and determines the appropriate research strategy:

- Web Search
- Document Search
- Hybrid Search

### 5. Answer Generation

Retrieved document content, web search results, or both are passed to Gemini to generate a context-aware response.

### 6. Streaming and Citations

The generated answer is streamed to the frontend using Server-Sent Events (SSE). Relevant sources and citations are included with the completed response.

## 🏗️ Project Structure

```text
DocuMind/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── ...
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── ...
│   └── package.json
│
├── .gitignore
└── package.json
```

*The structure above provides a high-level overview. Individual files and folders may vary as the project evolves.*

## ⚙️ Getting Started

Follow these instructions to run DocuMind locally.

### Prerequisites

Make sure you have the following installed:

- Node.js (v20 or later recommended)
- npm
- Git
- A Supabase account
- A Google Gemini API key
- A Tavily API key

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd DocuMind
```

### 2. Install Dependencies

Install the root dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

### 3. Configure Environment Variables

Create the required `.env` files in the frontend and backend directories.

Configure your Supabase credentials, Gemini API key, Tavily API key, and API URL according to the environment variable names used in the project.

**Never commit your `.env` files or expose private API keys.**

### 4. Configure Supabase

Set up a Supabase project with:

- PostgreSQL database.
- Supabase Authentication.
- Supabase Storage for PDF files.
- pgvector extension for vector embeddings.
- Required database tables, relationships, and retrieval functions.

Make sure the database schema and SQL functions required by the application are configured before running the project.

### 5. Run the Application

From the project root directory:

```bash
npm run dev
```

The frontend and backend development servers should start.

Frontend: `http://localhost:5173`

Backend: `http://localhost:5000`

## 🔐 Security

- API keys are stored in environment variables.
- Private API credentials are kept on the backend.
- Authenticated API requests use Supabase access tokens.
- PDF files are stored in private Supabase Storage.
- Temporary signed URLs are generated when documents need to be accessed.

## 🚀 Future Improvements

- Enhanced document processing and retrieval.
- Improved research history and organization.
- Additional document formats.
- Advanced filtering and retrieval strategies.
- More detailed research export options.
- Improved AI response evaluation and accuracy.

## 👩‍💻 Author

**Laiba Tahir**



---

⭐ If you find DocuMind AI interesting, consider giving the repository a star!

**Built with React, TypeScript, Supabase, and Google Gemini.**
