# ExamGrader AI — Handwritten Code OCR & Exam Checker

An intelligent web application that uses Google Gemini Multimodal AI to transcribe, analyze, and grade handwritten programming exams and student code submissions.

![ExamGrader AI Preview](https://ai.google.dev/static/site-assets/images/share-ais-513315318.png)

## 🚀 Features

- **Handwritten OCR & Bounding Boxes**: Detects each handwritten token with normalized bounding box coordinates (`[ymin, xmin, ymax, xmax]`), visual word boxes, and strikethrough detection.
- **Fair & Lenient Grading Policy**:
  - Automatically identifies syntax slips (e.g., misspelled keywords, missing colons, PEP 8 conventions) with $-1$ point deduction.
  - Tests algorithm logic, edge cases, and data structure usage (e.g., stack operations, pointer manipulation).
- **Client-Side PDF & Image Support**: Supports PDF exam sheets (with client-side rasterization and digital text extraction) as well as PNG, JPG, and WEBP scans.
- **Interactive Code Editor & "Help OCR"**: Instructors can click any recognized word token to adjust coordinates, correct transcription errors, or edit Python code with instant re-grading.
- **Dynamic API Key Management**: Easily configure your Google Gemini API key through the UI or `.env`.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite
- **PDF Processing**: `pdfjs-dist`
- **Backend**: Node.js, Express, TSX
- **AI / LLM**: Google Gemini API (`@google/genai`) using `gemini-3.6-flash` and `gemini-3.8-flash`

## 🏁 Getting Started

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **npm** (v9+)
- A **Google Gemini API Key** (Get one for free at [Google AI Studio](https://aistudio.google.com/apikey))

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/<your-username>/examgrader-ai.git
cd examgrader-ai
npm install
```

### 3. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` and add your Gemini API key (or enter it directly via the "Set API Key" button in the app):
```env
GEMINI_API_KEY="your_api_key_here"
PORT=3000
```

### 4. Run Development Server
```bash
npm run dev
```
Open **http://localhost:3000** in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

## 🔒 Security Notice
Your private API keys should **never** be committed to GitHub. The included `.gitignore` automatically excludes `.env` and all credential files.
